//! Tauri commands backed by vendored onion_share (derived from onion-poc, MIT).

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::{Mutex, RwLock};
use uuid::Uuid;

use crate::onion_share::config::AppConfig;
use crate::onion_share::fetch;
use crate::onion_share::server::ShareServerHandle;
use crate::onion_share::tracker_client;
use crate::onion_share::tracker_proto::NetworkLobby;
use crate::onion_share::wizard::installer;

const DEFAULT_CHUNK: usize = 256 * 1024;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackerNetworkConfig {
    pub tracker_url: String,
    pub node_id: String,
    pub share_publicly: bool,
}

#[derive(Clone, Default)]
pub struct OnionShareState {
    handle: Arc<Mutex<Option<ShareServerHandle>>>,
    tracker_stop: Arc<AtomicBool>,
    tracker_task: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
    cached_lobby: Arc<RwLock<NetworkLobby>>,
}

#[tauri::command]
pub async fn onion_share_start(state: State<'_, OnionShareState>) -> Result<serde_json::Value, String> {
    let mut guard = state.handle.lock().await;
    if guard.is_some() {
        let h = guard.as_ref().unwrap();
        return Ok(json!({"onion": h.onion_addr, "localPort": h.local_port}));
    }

    let mut cfg = AppConfig::load();
    let resolved = installer::detect_tor(&cfg.tor_path).ok_or_else(|| {
        "Tor not found. Install Tor Browser or Expert Bundle and set tor path in config, or rely on bundled install (Windows)."
            .to_string()
    })?;

    let handle_srv = ShareServerHandle::start(&resolved)
        .await
        .map_err(|e| e.to_string())?;

    if cfg.tor_path != resolved && !resolved.eq_ignore_ascii_case("tor") && !resolved.eq_ignore_ascii_case("tor.exe") {
        cfg.tor_path = resolved.clone();
        let _ = cfg.save();
    }

    let onion = handle_srv.onion_addr.clone();
    let port = handle_srv.local_port;
    *guard = Some(handle_srv);
    Ok(json!({"onion": onion, "localPort": port}))
}

#[tauri::command]
pub async fn onion_share_stop(state: State<'_, OnionShareState>) -> Result<(), String> {
    state.tracker_stop.store(true, Ordering::SeqCst);
    let mut tg = state.tracker_task.lock().await;
    if let Some(task) = tg.take() {
        task.abort();
    }
    drop(tg);

    let mut guard = state.handle.lock().await;
    if let Some(h) = guard.take() {
        h.stop().await;
    }
    Ok(())
}

#[tauri::command]
pub async fn onion_share_add_file(
    path: String,
    state: State<'_, OnionShareState>,
) -> Result<serde_json::Value, String> {
    let guard = state.handle.lock().await;
    let Some(ref srv) = *guard else {
        return Err("Onion sharing not running. Run onion_share_start first.".to_string());
    };
    let p = std::path::PathBuf::from(path);
    let share = srv
        .add_file(p, DEFAULT_CHUNK)
        .await
        .map_err(|e| e.to_string())?;
    Ok(json!({
        "fileId": share.file_id.to_string(),
        "fileName": share.file_name,
        "fileSize": share.file_size,
        "contentHash": share.content_hash,
        "link": srv.link_for(&share),
    }))
}

#[tauri::command]
pub async fn onion_share_remove_file(
    file_id: String,
    state: State<'_, OnionShareState>,
) -> Result<(), String> {
    let fid = Uuid::parse_str(&file_id).map_err(|_| "invalid file_id".to_string())?;
    let guard = state.handle.lock().await;
    let Some(ref srv) = *guard else {
        return Err("Share server not active".to_string());
    };
    srv.remove_file(fid).await;
    Ok(())
}

#[tauri::command]
pub async fn onion_share_list_local(
    state: State<'_, OnionShareState>,
) -> Result<Vec<serde_json::Value>, String> {
    let guard = state.handle.lock().await;
    let Some(ref srv) = *guard else {
        return Ok(Vec::new());
    };
    let shares = srv.state.shares.lock().await;
    let mut out = Vec::new();
    for s in shares.values() {
        out.push(json!({
            "fileId": s.file_id.to_string(),
            "name": s.file_name,
            "size": s.file_size,
            "contentHash": s.content_hash,
            "link": srv.link_for(s),
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
        tracker_url: c.tracker_url,
        node_id: c.node_id,
        share_publicly: c.share_publicly,
    })
}

#[tauri::command]
pub async fn tracker_set_config(config: TrackerNetworkConfig) -> Result<(), String> {
    let mut c = AppConfig::load();
    c.tracker_url = config.tracker_url;
    c.node_id = config.node_id;
    c.share_publicly = config.share_publicly;
    c.save().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tracker_refresh_lobby(state: State<'_, OnionShareState>) -> Result<NetworkLobby, String> {
    let guard = state.handle.lock().await;
    let Some(ref srv) = *guard else {
        return Err(
            "Onion/Tor sharing is not active. Start sharing before refreshing the tracker lobby.".to_string(),
        );
    };
    tracker_client::sync_tracker(Some(srv), state.cached_lobby.clone()).await;
    drop(guard);
    tracker_get_cached_inner(&state).await
}

#[tauri::command]
pub async fn tracker_get_cached_lobby_cmd(
    state: State<'_, OnionShareState>,
) -> Result<NetworkLobby, String> {
    tracker_get_cached_inner(&state).await
}

async fn tracker_get_cached_inner(state: &OnionShareState) -> Result<NetworkLobby, String> {
    Ok(state.cached_lobby.read().await.clone())
}

#[tauri::command]
pub async fn tracker_start_ws_loop(
    app: AppHandle,
    state: State<'_, OnionShareState>,
) -> Result<(), String> {
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

    let task = tokio::spawn(async move {
        tracker_client::run_tracker_ws_loop(handle_arc, lobby_arc, stop).await;
    });

    state.tracker_task.lock().await.replace(task);
    let _ = app.emit("tracker-ws-started", ());
    Ok(())
}

#[tauri::command]
pub async fn tracker_stop_ws_loop(state: State<'_, OnionShareState>) -> Result<(), String> {
    state.tracker_stop.store(true, Ordering::SeqCst);
    if let Some(t) = state.tracker_task.lock().await.take() {
        t.abort();
    }
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
