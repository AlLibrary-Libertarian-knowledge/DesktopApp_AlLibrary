//! Tauri commands backed by vendored onion_share (derived from onion-poc, MIT).

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::{Mutex, RwLock};
use tracing::{info, error, warn};
use uuid::Uuid;

use crate::onion_share::config::{normalize_tracker_url, AppConfig};
use crate::onion_share::fetch;
use crate::onion_share::server::ShareServerHandle;
use crate::onion_share::tracker_client;
use crate::onion_share::tracker_proto::NetworkLobby;
use crate::onion_share::wizard::installer;
use crate::core::database::{
    delete_local_share_by_path_pool, delete_local_share_pool, ensure_node_database,
    list_local_shares_pool, load_lobby_from_db, local_share_disk_path_map_pool,
    sync_lobby_to_db, upsert_local_share_pool,
};
use crate::core::database::models::LocalShareRow;
use chrono::Utc;
use std::collections::HashSet;
use std::path::PathBuf;

const DEFAULT_CHUNK: usize = 256 * 1024;
/// Re-announce before tracker `last_seen` TTL (30s in POC) when not using WS.
const HTTP_ANNOUNCE_HEARTBEAT_SECS: u64 = 20;

fn tracker_epoch_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis().min(u128::from(i64::MAX as u64)) as i64)
        .unwrap_or(0)
}

fn default_try_local_fallback() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackerNetworkConfig {
    pub tracker_url: String,
    pub node_id: String,
    pub share_publicly: bool,
    #[serde(default = "default_try_local_fallback")]
    pub try_local_tracker_fallback: bool,
}

#[derive(Clone)]
pub struct OnionShareState {
    handle: Arc<Mutex<Option<ShareServerHandle>>>,
    tracker_stop: Arc<AtomicBool>,
    tracker_task: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
    cached_lobby: Arc<RwLock<NetworkLobby>>,
    /// Last tracker announce diagnostics (persisted only in memory).
    tracker_last_sync: Arc<Mutex<Option<serde_json::Value>>>,
    http_announce_stop: Arc<AtomicBool>,
    http_announce_task: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
}

impl Default for OnionShareState {
    fn default() -> Self {
        Self {
            handle: Arc::new(Mutex::new(None)),
            tracker_stop: Arc::new(AtomicBool::new(false)),
            tracker_task: Arc::new(Mutex::new(None)),
            cached_lobby: Arc::new(RwLock::new(NetworkLobby::default())),
            tracker_last_sync: Arc::new(Mutex::new(None)),
            http_announce_stop: Arc::new(AtomicBool::new(true)),
            http_announce_task: Arc::new(Mutex::new(None)),
        }
    }
}

async fn persist_share_to_db(
    app: &AppHandle,
    disk_path: &str,
    file_id: &str,
    name: &str,
    size_bytes: u64,
    content_hash: &str,
    link: &str,
) -> Result<(), String> {
    let pool = ensure_node_database(app).await?;
    upsert_local_share_pool(
        &pool,
        &LocalShareRow {
            file_id: file_id.to_string(),
            name: name.to_string(),
            size_bytes: size_bytes as i64,
            content_hash: content_hash.to_string(),
            link: link.to_string(),
            disk_path: disk_path.to_string(),
            created_at: Utc::now().to_rfc3339(),
        },
    )
    .await
}

async fn restore_local_shares_from_db(app: &AppHandle, state: &OnionShareState) {
    let pool = match ensure_node_database(app).await {
        Ok(p) => p,
        Err(e) => {
            warn!("Skipping local share restore: {e}");
            return;
        }
    };

    let rows = match list_local_shares_pool(&pool).await {
        Ok(r) => r,
        Err(e) => {
            warn!("Failed to list local_shares for restore: {e}");
            return;
        }
    };

    if rows.is_empty() {
        return;
    }

    let guard = state.handle.lock().await;
    let Some(ref srv) = *guard else {
        return;
    };

    let active_hashes: HashSet<String> = {
        let shares = srv.state.shares.lock().await;
        shares
            .values()
            .map(|s| s.content_hash.clone())
            .collect()
    };

    for row in rows {
        let pb = PathBuf::from(&row.disk_path);
        if !pb.is_file() {
            if let Err(e) = delete_local_share_by_path_pool(&pool, &row.disk_path).await {
                warn!("Failed to remove stale local_share {}: {e}", row.disk_path);
            } else {
                warn!("Removed stale local_share (missing file): {}", row.disk_path);
            }
            continue;
        }

        if active_hashes.contains(&row.content_hash) {
            continue;
        }

        match srv.add_file(pb, DEFAULT_CHUNK).await {
            Ok(share) => {
                let link = srv.link_for(&share);
                if let Err(e) = persist_share_to_db(
                    app,
                    &row.disk_path,
                    &share.file_id.to_string(),
                    &share.file_name,
                    share.file_size,
                    &share.content_hash,
                    &link,
                )
                .await
                {
                    warn!("Failed to persist restored share {}: {e}", row.disk_path);
                } else {
                    info!("Restored local share: {}", row.disk_path);
                }
            }
            Err(e) => {
                warn!("Failed to restore share {}: {e}", row.disk_path);
            }
        }
    }
}

async fn persist_lobby_to_sqlite(app: &AppHandle, state: &OnionShareState) {
    let lobby = state.cached_lobby.read().await.clone();
    if let Err(e) = sync_lobby_to_db(app, &lobby).await {
        warn!("Lobby SQLite sync failed: {e}");
        return;
    }
    let _ = app.emit("lobby-updated", &lobby);
}

fn lobby_persist_callback(app: AppHandle, state: OnionShareState) -> tracker_client::LobbyUpdatedCallback {
    Arc::new(move || {
        let app = app.clone();
        let state = state.clone();
        tokio::spawn(async move {
            persist_lobby_to_sqlite(&app, &state).await;
        });
    })
}

async fn restart_http_announce_heartbeat(app: AppHandle, state: &OnionShareState) {
    state.http_announce_stop.store(true, Ordering::SeqCst);
    if let Some(t) = state.http_announce_task.lock().await.take() {
        t.abort();
    }
    state.http_announce_stop.store(false, Ordering::SeqCst);

    let stop = Arc::clone(&state.http_announce_stop);
    let handle_arc = Arc::clone(&state.handle);
    let lobby_arc = Arc::clone(&state.cached_lobby);
    let diag_arc = Arc::clone(&state.tracker_last_sync);
    let state_clone = state.clone();
    let app_clone = app.clone();

    let task = tokio::spawn(async move {
        let mut interval =
            tokio::time::interval(std::time::Duration::from_secs(HTTP_ANNOUNCE_HEARTBEAT_SECS));
        interval.tick().await;
        loop {
            interval.tick().await;
            if stop.load(Ordering::SeqCst) {
                break;
            }
            let g = handle_arc.lock().await;
            let Some(ref h) = *g else {
                drop(g);
                break;
            };
            let tr = tracker_client::sync_tracker_result(Some(h), lobby_arc.clone()).await;
            drop(g);
            persist_tracker_diag(diag_arc.clone(), Some(&app_clone), &tr).await;
            if tr.is_ok() {
                persist_lobby_to_sqlite(&app_clone, &state_clone).await;
            }
        }
    });

    state.http_announce_task.lock().await.replace(task);
}

async fn spawn_tracker_ws_loop(app: &AppHandle, state: &OnionShareState) {
    state.tracker_stop.store(false, Ordering::SeqCst);
    {
        let mut tg = state.tracker_task.lock().await;
        if let Some(prev) = tg.take() {
            prev.abort();
        }
    }

    let handle_arc = Arc::clone(&state.handle);
    let lobby_arc = Arc::clone(&state.cached_lobby);
    let stop = Arc::clone(&state.tracker_stop);
    let on_lobby_updated = Some(lobby_persist_callback(app.clone(), state.clone()));

    let task = tokio::spawn(async move {
        tracker_client::run_tracker_ws_loop(handle_arc, lobby_arc, stop, on_lobby_updated).await;
    });

    state.tracker_task.lock().await.replace(task);
    let _ = app.emit("tracker-ws-started", ());
}

async fn connect_local_tracker_fallback(app: &AppHandle, state: &OnionShareState) {
    let cfg = AppConfig::load();
    if !cfg.try_local_tracker_fallback {
        return;
    }

    let tr = tracker_client::sync_tracker_result(None, state.cached_lobby.clone()).await;
    persist_tracker_diag(Arc::clone(&state.tracker_last_sync), Some(app), &tr).await;
    if tr.is_ok() {
        persist_lobby_to_sqlite(app, state).await;
        spawn_tracker_ws_loop(app, state).await;
        let _ = app.emit("network-presence-changed", json!({}));
    } else if let Err(e) = &tr {
        warn!("Local tracker fallback failed: {e}");
    }
}

async fn persist_tracker_diag(
    sink: Arc<Mutex<Option<serde_json::Value>>>,
    app: Option<&AppHandle>,
    result: &Result<tracker_client::TrackerSyncOutcome, String>,
) {
    let at = tracker_epoch_ms();
    let diag = match result {
        Ok(o) => json!({
            "ok": true,
            "atEpochMs": at,
            "urlUsed": o.url_used,
            "usedLocalhostFallback": o.used_localhost_fallback,
        }),
        Err(e) => json!({
            "ok": false,
            "atEpochMs": at,
            "error": e,
        }),
    };
    {
        let mut g = sink.lock().await;
        *g = Some(diag.clone());
    }
    if let Some(a) = app {
        let _ = a.emit("tracker-sync-done", diag);
    }
}

/// Starts onion share if not already running (embedded Tor + Axum + `.onion` hidden service).
/// Used by `onion_share_start` and application bootstrap.
pub async fn bootstrap_onion_share(
    app: &AppHandle,
    state: &State<'_, OnionShareState>,
) -> Result<serde_json::Value, String> {
    let mut guard = state.handle.lock().await;
    if guard.is_some() {
        let h = guard.as_ref().unwrap();
        let onion = h.onion_addr.clone();
        let port = h.local_port;
        let tr = tracker_client::sync_tracker_result(Some(h), state.cached_lobby.clone()).await;
        let sink = Arc::clone(&state.tracker_last_sync);
        persist_tracker_diag(sink, Some(app), &tr).await;
        if tr.is_ok() {
            persist_lobby_to_sqlite(app, state.inner()).await;
        }
        drop(guard);
        restart_http_announce_heartbeat(app.clone(), state.inner()).await;
        spawn_tracker_ws_loop(app, state.inner()).await;
        restore_local_shares_from_db(app, state.inner()).await;
        let _ = app.emit("network-presence-changed", json!({}));
        return Ok(json!({"onion": onion, "localPort": port}));
    }

    let mut cfg = AppConfig::load();
    let resolved = match installer::detect_tor(&cfg.tor_path) {
        Some(r) => r,
        None => {
            error!("Tor not found during bootstrap");
            drop(guard);
            connect_local_tracker_fallback(app, state.inner()).await;
            if cfg.try_local_tracker_fallback {
                return Ok(json!({
                    "localOnly": true,
                    "error": "Tor not found. Install Tor Browser or Expert Bundle and set tor path in config, or rely on bundled install (Windows).",
                }));
            }
            return Err(
                "Tor not found. Install Tor Browser or Expert Bundle and set tor path in config, or rely on bundled install (Windows)."
                    .to_string(),
            );
        }
    };

    info!("Starting OnionShare with Tor binary: {}", resolved);
    let handle_srv = match ShareServerHandle::start(&resolved).await {
        Ok(h) => h,
        Err(e) => {
            error!("ShareServerHandle::start failed: {}", e);
            drop(guard);
            connect_local_tracker_fallback(app, state.inner()).await;
            if AppConfig::load().try_local_tracker_fallback {
                return Ok(json!({
                    "localOnly": true,
                    "error": e.to_string(),
                }));
            }
            return Err(e.to_string());
        }
    };

    if cfg.tor_path != resolved && !resolved.eq_ignore_ascii_case("tor") && !resolved.eq_ignore_ascii_case("tor.exe") {
        cfg.tor_path = resolved.clone();
        let _ = cfg.save();
    }

    let onion = handle_srv.onion_addr.clone();
    let port = handle_srv.local_port;
    *guard = Some(handle_srv);
    let lobby = state.cached_lobby.clone();
    if let Some(ref h) = *guard {
        let tr = tracker_client::sync_tracker_result(Some(h), lobby).await;
        let sink = Arc::clone(&state.tracker_last_sync);
        persist_tracker_diag(sink, Some(app), &tr).await;
        if tr.is_ok() {
            persist_lobby_to_sqlite(app, state.inner()).await;
        }
    }
    drop(guard);
    restart_http_announce_heartbeat(app.clone(), state.inner()).await;
    spawn_tracker_ws_loop(app, state.inner()).await;
    restore_local_shares_from_db(app, state.inner()).await;
    let _ = app.emit("network-presence-changed", json!({}));
    Ok(json!({"onion": onion, "localPort": port}))
}

/// Second-stage startup: Tor + hidden service + chunk server while the React Loading overlay is visible.
#[tauri::command]
pub async fn bootstrap_onion_overlay(
    app: AppHandle,
    state: State<'_, OnionShareState>,
) -> Result<serde_json::Value, String> {
    info!("Starting bootstrap_onion_overlay");
    let main = app
        .get_webview_window("main")
        .ok_or("main window not found".to_string())?;

    let start = json!({
        "phase": "onion",
        "message": "Connecting Tor & onion network…",
        "progress": 12.0,
        "icon": "Users",
    });
    let _ = main.emit("init-progress", &start);

    let result = bootstrap_onion_share(&app, &state).await;

    match &result {
        Ok(v) => {
            let done = json!({
                "phase": "onion",
                "message": "Onion network ready",
                "progress": 100.0,
                "icon": "CheckCircle",
                "onion": v.get("onion"),
                "localPort": v.get("localPort"),
            });
            let _ = main.emit("init-progress", &done);
        }
        Err(e) => {
            let skip = json!({
                "phase": "onion",
                "message": format!("Onion unavailable ({e}). Local tracker may still work if Docker is running."),
                "progress": 100.0,
                "icon": "Users",
            });
            let _ = main.emit("init-progress", &skip);
        }
    }

    match &result {
        Ok(v) if v.get("localOnly").and_then(|x| x.as_bool()) == Some(true) => {
            let partial = json!({
                "phase": "onion",
                "message": "Tracker connected via localhost (Tor unavailable)",
                "progress": 100.0,
                "icon": "Users",
                "localOnly": true,
            });
            let _ = main.emit("init-progress", &partial);
        }
        _ => {}
    }

    result
}

#[tauri::command]
pub async fn onion_share_start(
    app: AppHandle,
    state: State<'_, OnionShareState>,
) -> Result<serde_json::Value, String> {
    bootstrap_onion_share(&app, &state).await
}

#[tauri::command]
pub async fn onion_share_stop(app: AppHandle, state: State<'_, OnionShareState>) -> Result<(), String> {
    state.tracker_stop.store(true, Ordering::SeqCst);
    let mut tg = state.tracker_task.lock().await;
    if let Some(task) = tg.take() {
        task.abort();
    }
    drop(tg);

    state.http_announce_stop.store(true, Ordering::SeqCst);
    if let Some(t) = state.http_announce_task.lock().await.take() {
        t.abort();
    }

    let mut guard = state.handle.lock().await;
    if let Some(h) = guard.take() {
        h.stop().await;
    }
    let _ = app.emit("network-presence-changed", json!({}));
    Ok(())
}

#[tauri::command]
pub async fn onion_share_add_file(
    app: AppHandle,
    path: String,
    state: State<'_, OnionShareState>,
) -> Result<serde_json::Value, String> {
    let guard = state.handle.lock().await;
    let Some(ref srv) = *guard else {
        return Err("Onion sharing not running. Run onion_share_start first.".to_string());
    };
    let disk_path = path.clone();
    let p = PathBuf::from(&path);
    let share = srv
        .add_file(p, DEFAULT_CHUNK)
        .await
        .map_err(|e| e.to_string())?;
    let link = srv.link_for(&share);
    drop(guard);

    persist_share_to_db(
        &app,
        &disk_path,
        &share.file_id.to_string(),
        &share.file_name,
        share.file_size,
        &share.content_hash,
        &link,
    )
    .await?;

    Ok(json!({
        "fileId": share.file_id.to_string(),
        "fileName": share.file_name,
        "fileSize": share.file_size,
        "contentHash": share.content_hash,
        "link": link,
    }))
}

#[tauri::command]
pub async fn onion_share_remove_file(
    app: AppHandle,
    file_id: String,
    state: State<'_, OnionShareState>,
) -> Result<(), String> {
    let fid = Uuid::parse_str(&file_id).map_err(|_| "invalid file_id".to_string())?;
    let guard = state.handle.lock().await;
    let Some(ref srv) = *guard else {
        return Err("Share server not active".to_string());
    };
    srv.remove_file(fid).await;
    drop(guard);

    let pool = ensure_node_database(&app).await?;
    delete_local_share_pool(&pool, &file_id).await?;
    Ok(())
}

#[tauri::command]
pub async fn onion_share_list_local(
    app: AppHandle,
    state: State<'_, OnionShareState>,
) -> Result<Vec<serde_json::Value>, String> {
    let guard = state.handle.lock().await;
    let Some(ref srv) = *guard else {
        return Ok(Vec::new());
    };
    let shares = srv.state.shares.lock().await;
    let disk_paths = match ensure_node_database(&app).await {
        Ok(pool) => local_share_disk_path_map_pool(&pool).await.unwrap_or_default(),
        Err(_) => std::collections::HashMap::new(),
    };
    let mut out = Vec::new();
    for s in shares.values() {
        let file_id = s.file_id.to_string();
        out.push(json!({
            "fileId": file_id,
            "name": s.file_name,
            "size": s.file_size,
            "contentHash": s.content_hash,
            "link": srv.link_for(s),
            "diskPath": disk_paths.get(&file_id),
        }));
    }
    Ok(out)
}

#[tauri::command]
pub async fn onion_share_status(
    state: State<'_, OnionShareState>,
) -> Result<serde_json::Value, String> {
    let guard = state.handle.lock().await;
    match guard.as_ref() {
        None => Ok(json!({
            "running": false,
            "onion": serde_json::Value::Null,
            "localPort": serde_json::Value::Null,
        })),
        Some(h) => Ok(json!({
            "running": true,
            "onion": h.onion_addr,
            "localPort": h.local_port,
        })),
    }
}

#[tauri::command]
pub async fn tracker_get_config() -> Result<TrackerNetworkConfig, String> {
    let c = AppConfig::load();
    Ok(TrackerNetworkConfig {
        tracker_url: normalize_tracker_url(&c.tracker_url),
        node_id: c.node_id,
        share_publicly: c.share_publicly,
        try_local_tracker_fallback: c.try_local_tracker_fallback,
    })
}

#[tauri::command]
pub async fn tracker_set_config(config: TrackerNetworkConfig) -> Result<(), String> {
    let mut c = AppConfig::load();
    c.tracker_url = normalize_tracker_url(&config.tracker_url);
    if c.tracker_url.is_empty() {
        return Err("tracker_url cannot be empty".to_string());
    }
    c.node_id = config.node_id;
    c.share_publicly = config.share_publicly;
    c.try_local_tracker_fallback = config.try_local_tracker_fallback;
    c.save().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tracker_refresh_lobby(
    app: AppHandle,
    state: State<'_, OnionShareState>,
) -> Result<NetworkLobby, String> {
    let guard = state.handle.lock().await;
    let tr = if let Some(ref srv) = *guard {
        tracker_client::sync_tracker_result(Some(srv), state.cached_lobby.clone()).await
    } else {
        tracker_client::sync_tracker_result(None, state.cached_lobby.clone()).await
    };
    drop(guard);
    persist_tracker_diag(Arc::clone(&state.tracker_last_sync), Some(&app), &tr).await;
    tr.map_err(|e| format!("Cannot reach tracker: {e}"))?;
    persist_lobby_to_sqlite(&app, state.inner()).await;

    tracker_get_cached_inner(&app, state.inner()).await
}

#[tauri::command]
pub async fn tracker_get_last_sync_diag(state: State<'_, OnionShareState>) -> Result<serde_json::Value, String> {
    Ok(state
        .tracker_last_sync
        .lock()
        .await
        .clone()
        .unwrap_or(serde_json::Value::Null))
}

#[tauri::command]
pub async fn tracker_get_cached_lobby_cmd(
    app: AppHandle,
    state: State<'_, OnionShareState>,
) -> Result<NetworkLobby, String> {
    tracker_get_cached_inner(&app, state.inner()).await
}

async fn tracker_get_cached_inner(app: &AppHandle, state: &OnionShareState) -> Result<NetworkLobby, String> {
    let mem = state.cached_lobby.read().await.clone();
    if !mem.files.is_empty() || mem.online_nodes > 0 {
        return Ok(mem);
    }
    load_lobby_from_db(app).await
}

#[tauri::command]
pub async fn tracker_start_ws_loop(
    app: AppHandle,
    state: State<'_, OnionShareState>,
) -> Result<(), String> {
    spawn_tracker_ws_loop(&app, state.inner()).await;
    let _ = app.emit("network-presence-changed", json!({}));
    Ok(())
}

#[tauri::command]
pub async fn tracker_stop_ws_loop(
    app: AppHandle,
    state: State<'_, OnionShareState>,
) -> Result<(), String> {
    state.tracker_stop.store(true, Ordering::SeqCst);
    if let Some(t) = state.tracker_task.lock().await.take() {
        t.abort();
    }
    let _ = app.emit("network-presence-changed", json!({}));
    Ok(())
}

#[tauri::command]
pub async fn onion_share_fetch(
    app: AppHandle,
    link: String,
    out_dir: String,
    state: State<'_, OnionShareState>,
) -> Result<(), String> {
    let socks = {
        let g = state.handle.lock().await;
        g.as_ref().map(|h| h.socks_addr())
    };
    let Some(socks) = socks else {
        return Err("Start onion sharing first so Tor SOCKS is available (POC-aligned).".to_string());
    };

    let out = std::path::PathBuf::from(out_dir);
    let link_owned = link;
    tokio::spawn(async move {
        let res = fetch::fetch_to_directory(&link_owned, Some(socks), out).await;

        match res {
            Ok(path) => {
                let _ = app.emit(
                    "onion-share-fetch-done",
                    json!({
                        "ok": true,
                        "path": path.to_string_lossy().to_string(),
                        "link": link_owned,
                    }),
                );
            }
            Err(e) => {
                let _ = app.emit(
                    "onion-share-fetch-done",
                    json!({"ok": false, "error": e.to_string(), "link": link_owned}),
                );
            }
        }
    });

    Ok(())
}
