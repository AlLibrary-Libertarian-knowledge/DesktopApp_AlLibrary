//! Tauri commands backed by vendored onion_share (derived from onion-poc, MIT).

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::{Mutex, watch};
use tracing::{info, error, warn};
use uuid::Uuid;

use crate::onion_share::config::{normalize_tracker_url, AppConfig};
use crate::onion_share::fetch;
use crate::onion_share::server::{ShareServerHandle, ShareServerStartOptions};
use crate::onion_share::tor::TorProcess;
use crate::onion_share::tracker_client;
use crate::commands::transfer_resolve::enrich_files_swarm_links;
use crate::onion_share::tracker_proto::NetworkLobby;
use crate::onion_share::tracker_proto::lobby_fingerprint;
use crate::onion_share::wizard::installer;
use crate::core::database::{
    complete_transfer_pool, delete_local_share_by_path_pool, delete_local_share_pool,
    ensure_node_database, insert_transfer_pool, list_local_shares_pool, load_lobby_from_db,
    local_share_disk_path_map_pool, sync_lobby_to_db, update_transfer_progress_pool,
    upsert_local_share_pool,
};
use crate::core::database::activity_log::insert_activity_pool;
use crate::core::database::models::LocalShareRow;
use chrono::Utc;
use std::collections::HashSet;
use std::path::PathBuf;

use crate::commands::documents::process_downloaded_file_internal;
use crate::commands::seed_sync::{ensure_document_seeded, flush_pending_seeds, sync_all_enabled_seeds};

pub use crate::commands::onion_state::{OnionShareState, TorBootstrapSnapshot};
use crate::commands::settings::load_app_settings;
use crate::core::document::pipeline::is_treated_file;
use crate::onion_share::link::parse_any;

const DEFAULT_CHUNK: usize = 256 * 1024;
/// Re-announce before tracker `last_seen` TTL (30s in POC) when not using WS.
const HTTP_ANNOUNCE_HEARTBEAT_SECS: u64 = 20;

async fn clone_active_handle(state: &OnionShareState) -> Option<Arc<ShareServerHandle>> {
    state.handle.lock().await.clone()
}

async fn run_tracker_sync(
    state: &OnionShareState,
    app: Option<&AppHandle>,
    handle: Option<Arc<ShareServerHandle>>,
    skip_if_busy: bool,
) -> Option<Result<tracker_client::TrackerSyncOutcome, String>> {
    let handle_ref = handle.as_ref().map(|h| h.as_ref());
    let cached = state.cached_lobby.clone();
    let gate = Arc::clone(&state.tracker_sync_gate);
    let tr = tracker_client::sync_tracker_result_gated(
        &gate,
        skip_if_busy,
        handle_ref,
        cached,
    )
    .await?;
    persist_tracker_diag(Arc::clone(&state.tracker_last_sync), app, &tr).await;
    if tr.is_ok() {
        if let Some(a) = app {
            persist_lobby_to_sqlite(a, state).await;
        }
    }
    Some(tr)
}

fn tracker_epoch_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis().min(u128::from(i64::MAX as u64)) as i64)
        .unwrap_or(0)
}

const TOR_WATCHDOG_INTERVAL_SECS: u64 = 180;
const TOR_MAX_RETRIES_PER_HOUR: u32 = 5;
const TOR_RETRY_WINDOW_MS: i64 = 3_600_000;

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
    #[serde(default)]
    pub tor_bridges: Vec<String>,
}

struct BootstrapInProgressGuard {
    flag: Arc<AtomicBool>,
}

impl BootstrapInProgressGuard {
    fn new(flag: Arc<AtomicBool>) -> Self {
        flag.store(true, Ordering::SeqCst);
        Self { flag }
    }
}

impl Drop for BootstrapInProgressGuard {
    fn drop(&mut self) {
        self.flag.store(false, Ordering::SeqCst);
    }
}

async fn update_bootstrap_snapshot(state: &OnionShareState, update: impl FnOnce(&mut TorBootstrapSnapshot)) {
    let mut snap = state.bootstrap.write().await;
    update(&mut snap);
    snap.last_attempt_at_ms = tracker_epoch_ms();
}

async fn emit_tor_bootstrap_progress(app: &AppHandle, snap: &TorBootstrapSnapshot, message: &str) {
    let _ = app.emit(
        "tor-bootstrap-progress",
        json!({
            "mode": snap.mode,
            "bootstrapPercent": snap.bootstrap_percent,
            "message": message,
            "lastError": snap.last_error,
            "localOnly": snap.local_only,
            "retryCount": snap.retry_count,
        }),
    );
}

fn status_json_from_snapshot(
    running: bool,
    onion: serde_json::Value,
    local_port: serde_json::Value,
    snap: &TorBootstrapSnapshot,
) -> serde_json::Value {
    json!({
        "running": running,
        "onion": onion,
        "localPort": local_port,
        "mode": snap.mode,
        "bootstrapPercent": snap.bootstrap_percent,
        "lastError": snap.last_error,
        "localOnly": snap.local_only,
        "retryCount": snap.retry_count,
    })
}

async fn finalize_running_onion(app: &AppHandle, state: &OnionShareState) {
    if state
        .background_loops_started
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return;
    }
    restart_http_announce_heartbeat(app.clone(), state).await;
    spawn_tracker_ws_loop(app, state).await;
    restore_local_shares_from_db(app, state).await;
    let _ = sync_all_enabled_seeds(app, state).await;
    flush_pending_seeds(app, state).await;
    let _ = app.emit("network-presence-changed", json!({}));
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

        if !is_treated_file(&pb) {
            warn!("Skipping restore of untreated file: {}", row.disk_path);
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
    let fp = lobby_fingerprint(&lobby);
    {
        let mut last = state.last_persisted_lobby_fp.lock().await;
        if last.as_deref() == Some(fp.as_str()) {
            return;
        }
        *last = Some(fp);
    }
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
            let h = {
                let g = handle_arc.lock().await;
                g.clone()
            };
            let Some(h) = h else {
                break;
            };
            let tr = run_tracker_sync(&state_clone, Some(&app_clone), Some(h), true).await;
            if tr.is_none() {
                continue;
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
    let sync_gate = Arc::clone(&state.tracker_sync_gate);
    let on_lobby_updated = Some(lobby_persist_callback(app.clone(), state.clone()));

    let task = tokio::spawn(async move {
        tracker_client::run_tracker_ws_loop(handle_arc, lobby_arc, sync_gate, stop, on_lobby_updated).await;
    });

    state.tracker_task.lock().await.replace(task);
    let _ = app.emit("tracker-ws-started", ());
}

async fn connect_local_tracker_fallback(app: &AppHandle, state: &OnionShareState) {
    let cfg = AppConfig::load();
    if !cfg.try_local_tracker_fallback {
        return;
    }

    let tr = run_tracker_sync(state, Some(app), None, false)
        .await
        .unwrap_or(Err("Tracker sync skipped".into()));
    if tr.is_ok() {
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
    state: &OnionShareState,
) -> Result<serde_json::Value, String> {
    {
        let existing = clone_active_handle(state).await;
        if let Some(h) = existing {
            let onion = h.onion_addr.clone();
            let port = h.local_port;
            let _ = run_tracker_sync(state, Some(app), Some(h), true).await;
            update_bootstrap_snapshot(state, |s| {
                s.mode = "ready".to_string();
                s.bootstrap_percent = 100;
                s.local_only = false;
                s.last_error = None;
            })
            .await;
            return Ok(json!({"onion": onion, "localPort": port}));
        }
    }

    if state.bootstrap_in_progress.load(Ordering::SeqCst) {
        let snap = state.bootstrap.read().await.clone();
        return Ok(json!({
            "localOnly": snap.local_only,
            "error": snap.last_error,
            "bootstrapping": true,
        }));
    }

    TorProcess::cleanup_stale_tor_on_startup().await;

    let _bootstrap_guard = BootstrapInProgressGuard::new(Arc::clone(&state.bootstrap_in_progress));

    update_bootstrap_snapshot(state, |s| {
        s.mode = "bootstrapping".to_string();
        s.bootstrap_percent = 0;
        s.last_error = None;
        s.local_only = false;
    })
    .await;
    {
        let snap = state.bootstrap.read().await.clone();
        emit_tor_bootstrap_progress(app, &snap, "Connecting Tor…").await;
    }

    let mut cfg = AppConfig::load();
    let resolved = match installer::detect_tor(&cfg.tor_path) {
        Some(r) => r,
        None => {
            error!("Tor not found during bootstrap");
            let err = "Tor not found. Install Tor Browser or Expert Bundle and set tor path in config, or rely on bundled install (Windows).".to_string();
            update_bootstrap_snapshot(state, |s| {
                s.mode = "degraded".to_string();
                s.local_only = true;
                s.last_error = Some(err.clone());
            })
            .await;
            connect_local_tracker_fallback(app, state).await;
            let snap = state.bootstrap.read().await.clone();
            emit_tor_bootstrap_progress(app, &snap, "Tor unavailable — local tracker only").await;
            let _ = app.emit("network-presence-changed", json!({}));
            if cfg.try_local_tracker_fallback {
                return Ok(json!({ "localOnly": true, "error": err }));
            }
            return Err(err);
        }
    };

    let (progress_tx, mut progress_rx) = watch::channel(0u8);
    let app_progress = app.clone();
    let state_progress = state.clone();
    let progress_task = tokio::spawn(async move {
        loop {
            if progress_rx.changed().await.is_err() {
                break;
            }
            let pct = *progress_rx.borrow();
            update_bootstrap_snapshot(&state_progress, |s| {
                s.bootstrap_percent = pct;
                if s.mode == "bootstrapping" && pct > 0 {
                    s.mode = "bootstrapping".to_string();
                }
            })
            .await;
            let snap = state_progress.bootstrap.read().await.clone();
            emit_tor_bootstrap_progress(
                &app_progress,
                &snap,
                &format!("Bootstrapping Tor… {pct}%"),
            )
            .await;
        }
    });

    info!("Starting OnionShare with Tor binary: {}", resolved);
    let preferred = cfg.tor_overlay_data_dir.as_ref().and_then(|s| {
        let p = PathBuf::from(s);
        if p.exists() { Some(p) } else { None }
    });
    let start_opts = ShareServerStartOptions {
        bridges: cfg.tor_bridges.clone(),
        progress_tx: Some(progress_tx),
        preferred_data_dir: preferred,
    };
    let handle_srv = match ShareServerHandle::start(&resolved, start_opts).await {
        Ok(h) => h,
        Err(e) => {
            progress_task.abort();
            error!("ShareServerHandle::start failed: {}", e);
            let err = e.to_string();
            update_bootstrap_snapshot(state, |s| {
                s.mode = "degraded".to_string();
                s.local_only = true;
                s.last_error = Some(err.clone());
                s.bootstrap_percent = 0;
            })
            .await;
            connect_local_tracker_fallback(app, state).await;
            let snap = state.bootstrap.read().await.clone();
            emit_tor_bootstrap_progress(app, &snap, "Tor bootstrap failed — local tracker only").await;
            let _ = app.emit("network-presence-changed", json!({}));
            if AppConfig::load().try_local_tracker_fallback {
                return Ok(json!({ "localOnly": true, "error": err }));
            }
            update_bootstrap_snapshot(state, |s| {
                s.mode = "failed".to_string();
            })
            .await;
            return Err(err);
        }
    };
    progress_task.abort();

    if cfg.tor_path != resolved
        && !resolved.eq_ignore_ascii_case("tor")
        && !resolved.eq_ignore_ascii_case("tor.exe")
    {
        cfg.tor_path = resolved.clone();
        let _ = cfg.save();
    }

    let onion = handle_srv.onion_addr.clone();
    let port = handle_srv.local_port;
    let tor_data_dir = handle_srv.tor_data_dir();
    {
        let mut guard = state.handle.lock().await;
        *guard = Some(Arc::new(handle_srv));
    }
    if let Some(h) = clone_active_handle(state).await {
        let _ = run_tracker_sync(state, Some(app), Some(h), false).await;
    }

    {
        let mut saved_cfg = AppConfig::load();
        saved_cfg.tor_overlay_data_dir = Some(tor_data_dir.to_string_lossy().into_owned());
        let _ = saved_cfg.save();
    }

    update_bootstrap_snapshot(state, |s| {
        s.mode = "ready".to_string();
        s.bootstrap_percent = 100;
        s.local_only = false;
        s.last_error = None;
    })
    .await;
    let snap = state.bootstrap.read().await.clone();
    emit_tor_bootstrap_progress(app, &snap, "Onion network ready").await;
    finalize_running_onion(app, state).await;
    Ok(json!({"onion": onion, "localPort": port}))
}

/// Background recovery: retry Tor when handle is absent (max 5 attempts/hour).
pub fn spawn_tor_recovery_watchdog(app: AppHandle, state: OnionShareState) {
    tauri::async_runtime::spawn(async move {
        let mut interval =
            tokio::time::interval(std::time::Duration::from_secs(TOR_WATCHDOG_INTERVAL_SECS));
        interval.tick().await;
        loop {
            interval.tick().await;
            if state.bootstrap_in_progress.load(Ordering::SeqCst) {
                continue;
            }
            if state.handle.lock().await.is_some() {
                continue;
            }
            {
                let mut snap = state.bootstrap.write().await;
                let now = tracker_epoch_ms();
                if snap.retry_window_start_ms == 0
                    || now - snap.retry_window_start_ms > TOR_RETRY_WINDOW_MS
                {
                    snap.retry_window_start_ms = now;
                    snap.retry_count = 0;
                }
                if snap.retry_count >= TOR_MAX_RETRIES_PER_HOUR {
                    continue;
                }
                snap.retry_count += 1;
            }
            info!("Tor recovery watchdog: attempting onion bootstrap");
            let _ = bootstrap_onion_share(&app, &state).await;
        }
    });
}

/// Emit init-progress on the main window from a bootstrap result.
async fn emit_bootstrap_init_progress(
    app: &AppHandle,
    state: &OnionShareState,
    result: &Result<serde_json::Value, String>,
) {
    let Some(main) = app.get_webview_window("main") else {
        return;
    };
    let snap = state.bootstrap.read().await.clone();
    match result {
        Ok(v) if v.get("localOnly").and_then(|x| x.as_bool()) == Some(true) => {
            let err = v
                .get("error")
                .and_then(|x| x.as_str())
                .unwrap_or("Tor unavailable");
            let _ = main.emit(
                "init-progress",
                json!({
                    "phase": "onion",
                    "message": format!("Tracker via localhost only ({err})"),
                    "progress": 100.0,
                    "icon": "Users",
                    "localOnly": true,
                    "bootstrapPercent": snap.bootstrap_percent,
                }),
            );
        }
        Ok(v) if v.get("bootstrapping").and_then(|x| x.as_bool()) == Some(true) => {
            let _ = main.emit(
                "init-progress",
                json!({
                    "phase": "onion",
                    "message": "Tor bootstrap already in progress…",
                    "progress": snap.bootstrap_percent as f64,
                    "icon": "Users",
                    "bootstrapPercent": snap.bootstrap_percent,
                }),
            );
        }
        Ok(v) if v.get("background").and_then(|x| x.as_bool()) == Some(true) => {
            let _ = main.emit(
                "init-progress",
                json!({
                    "phase": "onion",
                    "message": "Connecting Tor in background…",
                    "progress": 20.0,
                    "icon": "Users",
                    "bootstrapPercent": snap.bootstrap_percent,
                }),
            );
        }
        Ok(v) => {
            let _ = main.emit(
                "init-progress",
                json!({
                    "phase": "onion",
                    "message": "Onion network ready",
                    "progress": 100.0,
                    "icon": "CheckCircle",
                    "onion": v.get("onion"),
                    "localPort": v.get("localPort"),
                    "bootstrapPercent": 100,
                }),
            );
        }
        Err(e) => {
            let _ = main.emit(
                "init-progress",
                json!({
                    "phase": "onion",
                    "message": format!("Onion unavailable ({e}). Local tracker may still work if Docker is running."),
                    "progress": 100.0,
                    "icon": "Users",
                    "localOnly": true,
                    "bootstrapPercent": snap.bootstrap_percent,
                }),
            );
        }
    }
}

async fn run_onion_bootstrap_with_progress(
    app: &AppHandle,
    state: &OnionShareState,
) -> Result<serde_json::Value, String> {
    let result = bootstrap_onion_share(app, state).await;
    emit_bootstrap_init_progress(app, state, &result).await;
    result
}

/// Non-blocking bootstrap: returns immediately; Tor connects in background (watchdog retries if needed).
#[tauri::command]
pub async fn bootstrap_onion_overlay_background(
    app: AppHandle,
    state: State<'_, OnionShareState>,
) -> Result<serde_json::Value, String> {
    {
        let guard = state.handle.lock().await;
        if let Some(ref h) = *guard {
            return Ok(json!({
                "alreadyRunning": true,
                "onion": h.onion_addr,
                "localPort": h.local_port,
            }));
        }
    }
    if state.bootstrap_in_progress.load(Ordering::SeqCst) {
        return Ok(json!({ "bootstrapping": true, "background": true }));
    }

    let app_bg = app.clone();
    let state_bg = state.inner().clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = run_onion_bootstrap_with_progress(&app_bg, &state_bg).await {
            warn!("Background onion bootstrap failed: {e}");
        }
    });

    emit_bootstrap_init_progress(
        &app,
        state.inner(),
        &Ok(json!({ "background": true, "started": true })),
    )
    .await;

    Ok(json!({ "started": true, "background": true }))
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

    let _ = main.emit(
        "init-progress",
        json!({
            "phase": "onion",
            "message": "Connecting Tor & onion network…",
            "progress": 12.0,
            "icon": "Users",
        }),
    );

    run_onion_bootstrap_with_progress(&app, state.inner()).await
}

#[tauri::command]
pub async fn onion_share_start(
    app: AppHandle,
    state: State<'_, OnionShareState>,
) -> Result<serde_json::Value, String> {
    bootstrap_onion_share(&app, state.inner()).await
}

pub async fn stop_onion_share_internal(app: &AppHandle, state: &OnionShareState) {
    state.tracker_stop.store(true, Ordering::SeqCst);
    let mut tg = state.tracker_task.lock().await;
    if let Some(task) = tg.take() {
        task.abort();
    }
    drop(tg);

    state.http_announce_stop.store(true, Ordering::SeqCst);
    state.background_loops_started.store(false, Ordering::SeqCst);
    if let Some(t) = state.http_announce_task.lock().await.take() {
        t.abort();
    }

    let mut guard = state.handle.lock().await;
    if let Some(h) = guard.take() {
        if let Ok(h) = Arc::try_unwrap(h) {
            h.stop().await;
        } else {
            warn!("Share server still referenced during stop; skipping graceful shutdown");
        }
    }
    let _ = app.emit("network-presence-changed", json!({}));
}

#[tauri::command]
pub async fn onion_share_stop(app: AppHandle, state: State<'_, OnionShareState>) -> Result<(), String> {
    stop_onion_share_internal(&app, state.inner()).await;
    Ok(())
}

#[tauri::command]
pub async fn onion_share_add_file(
    app: AppHandle,
    path: String,
    state: State<'_, OnionShareState>,
) -> Result<serde_json::Value, String> {
    add_treated_share(&app, state.inner(), &path).await
}

async fn add_treated_share(
    app: &AppHandle,
    state: &OnionShareState,
    path: &str,
) -> Result<serde_json::Value, String> {
    ensure_document_seeded(app, state, path).await?;
    let pool = ensure_node_database(app).await?;
    let rows = list_local_shares_pool(&pool).await.unwrap_or_default();
    if let Some(row) = rows.iter().find(|r| r.disk_path == path) {
        return Ok(json!({
            "fileId": row.file_id,
            "fileName": row.name,
            "fileSize": row.size_bytes,
            "contentHash": row.content_hash,
            "link": row.link,
        }));
    }
    Ok(json!({ "queued": true, "path": path }))
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
    let snap = state.bootstrap.read().await.clone();
    let status = {
        let guard = state.handle.lock().await;
        match guard.as_ref() {
            None => status_json_from_snapshot(
                false,
                serde_json::Value::Null,
                serde_json::Value::Null,
                &snap,
            ),
            Some(h) => status_json_from_snapshot(
                true,
                json!(h.onion_addr),
                json!(h.local_port),
                &snap,
            ),
        }
    };
    Ok(status)
}

#[tauri::command]
pub async fn reset_tor_overlay_data(
    app: AppHandle,
    state: State<'_, OnionShareState>,
) -> Result<serde_json::Value, String> {
    {
        let mut guard = state.handle.lock().await;
        if let Some(h) = guard.take() {
            if let Ok(h) = Arc::try_unwrap(h) {
                h.stop().await;
            } else {
                warn!("Share server still referenced during Tor reset; skipping graceful shutdown");
            }
        }
    }
    let outcome = TorProcess::reset_data_dir().await;
    let _ = app.emit("network-presence-changed", json!({}));
    Ok(json!({
        "cleared": outcome.cleared,
        "fallbackRenamed": outcome.fallback_renamed,
        "path": outcome.path.to_string_lossy(),
    }))
}

#[tauri::command]
pub async fn tracker_get_config() -> Result<TrackerNetworkConfig, String> {
    let c = AppConfig::load();
    Ok(TrackerNetworkConfig {
        tracker_url: normalize_tracker_url(&c.tracker_url),
        node_id: c.node_id,
        share_publicly: c.share_publicly,
        try_local_tracker_fallback: c.try_local_tracker_fallback,
        tor_bridges: c.tor_bridges,
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
    c.tor_bridges = config
        .tor_bridges
        .into_iter()
        .map(|b| b.trim().to_string())
        .filter(|b| !b.is_empty())
        .collect();
    c.save().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tracker_refresh_lobby(
    app: AppHandle,
    state: State<'_, OnionShareState>,
) -> Result<NetworkLobby, String> {
    let h = clone_active_handle(state.inner()).await;
    match run_tracker_sync(state.inner(), Some(&app), h, false).await {
        Some(Ok(_)) => {}
        Some(Err(e)) => return Err(format!("Cannot reach tracker: {e}")),
        None => return Err("Tracker sync skipped".into()),
    }

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
    let mut mem = state.cached_lobby.read().await.clone();
    if mem.files.is_empty() && mem.online_nodes == 0 {
        mem = load_lobby_from_db(app).await?;
    }
    let tracker = normalize_tracker_url(&AppConfig::load().tracker_url);
    enrich_files_swarm_links(&mut mem.files, &tracker);
    Ok(mem)
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
    file_name: Option<String>,
    client_transfer_id: Option<String>,
) -> Result<String, String> {
    let socks = {
        let g = state.handle.lock().await;
        g.as_ref().map(|h| h.socks_addr())
    };
    let Some(socks) = socks else {
        return Err("Start onion sharing first so Tor SOCKS is available (POC-aligned).".to_string());
    };

    let transfer_id = client_transfer_id
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| Uuid::new_v4().to_string());
    if let Ok(pool) = ensure_node_database(&app).await {
        let _ = insert_transfer_pool(
            &pool,
            &transfer_id,
            &link,
            file_name.as_deref(),
        )
        .await;
    }

    let out = std::path::PathBuf::from(out_dir);
    let link_owned = link;
    let app_for_fetch = app.clone();
    let share_state = state.inner().clone();
    let tid = transfer_id.clone();
    tokio::spawn(async move {
        let tid_progress = tid.clone();
        let app_progress = app_for_fetch.clone();
        let link_progress = link_owned.clone();
        let progress_cb: fetch::FetchProgressCb = Arc::new(move |completed, total, bytes| {
            let progress = if total > 0 {
                (completed as f64) / (total as f64)
            } else {
                0.0
            };
            let app_emit = app_progress.clone();
            let tid_emit = tid_progress.clone();
            let link_emit = link_progress.clone();
            tauri::async_runtime::spawn(async move {
                if let Ok(pool) = ensure_node_database(&app_emit).await {
                    let _ = update_transfer_progress_pool(&pool, &tid_emit, progress, bytes as i64).await;
                }
                let _ = app_emit.emit(
                    "transfer-progress",
                    json!({
                        "id": tid_emit,
                        "link": link_emit,
                        "progress": progress,
                        "bytesMoved": bytes,
                    }),
                );
            });
        });

        let res = fetch::fetch_to_directory(
            &link_owned,
            Some(socks),
            out.clone(),
            Some(progress_cb),
        )
        .await;

        match res {
            Ok(raw_path) => {
                let expected_hash = parse_any(&link_owned)
                    .ok()
                    .and_then(|p| match p {
                        crate::onion_share::link::ParsedLink::Swarm(s) => Some(s.content_hash),
                        _ => None,
                    });

                let settings = load_app_settings(app_for_fetch.clone()).await.ok();
                let library_dir = settings
                    .map(|s| PathBuf::from(s.folder_structure.documents_folder))
                    .unwrap_or_else(|| out.clone());

                let incoming = library_dir.join("incoming");
                let _ = std::fs::create_dir_all(&incoming);
                let staged = incoming.join(
                    raw_path
                        .file_name()
                        .unwrap_or_default(),
                );
                let _ = std::fs::copy(&raw_path, &staged);

                match process_downloaded_file_internal(
                    &app_for_fetch,
                    staged.clone(),
                    library_dir.clone(),
                    expected_hash.clone(),
                    raw_path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .map(String::from),
                )
                .await
                {
                    Ok(info) => {
                        let _ = add_treated_share(&app_for_fetch, &share_state, &info.file_path).await;

                        if let Ok(pool) = ensure_node_database(&app_for_fetch).await {
                            let payload = serde_json::json!({
                                "link": link_owned,
                                "path": info.file_path,
                                "contentHash": info.content_hash,
                            })
                            .to_string();
                            let _ = insert_activity_pool(
                                &pool,
                                "download",
                                info.content_hash.as_deref(),
                                Some(&payload),
                            )
                            .await;
                            let _ = complete_transfer_pool(
                                &pool,
                                &tid,
                                "completed",
                                1.0,
                                Some(&info.file_path),
                                None,
                            )
                            .await;
                        }
                        let _ = app_for_fetch.emit(
                            "onion-share-fetch-done",
                            json!({
                                "ok": true,
                                "path": info.file_path,
                                "link": link_owned,
                                "transferId": tid,
                            }),
                        );
                    }
                    Err(e) => {
                        if let Ok(pool) = ensure_node_database(&app_for_fetch).await {
                            let _ = complete_transfer_pool(
                                &pool,
                                &tid,
                                "failed",
                                0.0,
                                None,
                                Some(&e),
                            )
                            .await;
                        }
                        let _ = app_for_fetch.emit(
                            "onion-share-fetch-done",
                            json!({"ok": false, "error": e, "link": link_owned, "transferId": tid}),
                        );
                    }
                }
            }
            Err(e) => {
                let err = e.to_string();
                if let Ok(pool) = ensure_node_database(&app_for_fetch).await {
                    let _ = complete_transfer_pool(&pool, &tid, "failed", 0.0, None, Some(&err)).await;
                }
                let _ = app_for_fetch.emit(
                    "onion-share-fetch-done",
                    json!({"ok": false, "error": err, "link": link_owned, "transferId": tid}),
                );
            }
        }
    });

    Ok(transfer_id)
}
