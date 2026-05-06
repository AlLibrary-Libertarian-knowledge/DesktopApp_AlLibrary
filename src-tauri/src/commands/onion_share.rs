//! POC-compatible onion HTTP share + tracker client (M5).

use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use once_cell::sync::Lazy;
use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tokio::sync::{Mutex, RwLock};
use uuid::Uuid;

use crate::core::p2p::tor_manager;
use crate::onion_share::tracker_proto::AnnouncedFile;
use crate::onion_share::{
    fetch, tracker, AnnounceState, ShareHostHandle, TrackerNetworkConfig, get_cached_lobby,
};

static SHARE_HOST: Lazy<Arc<Mutex<Option<ShareHostHandle>>>> =
    Lazy::new(|| Arc::new(Mutex::new(None)));

static ANNOUNCE: Lazy<Arc<RwLock<AnnounceState>>> =
    Lazy::new(|| Arc::new(RwLock::new(AnnounceState::default())));

static TRACKER_WS_TASK: Lazy<Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>> =
    Lazy::new(|| Arc::new(Mutex::new(None)));

async fn sync_announce_from_host() {
    let mut ann = ANNOUNCE.write().await;
    let host_guard = SHARE_HOST.lock().await;
    match host_guard.as_ref() {
        None => {
            ann.onion = None;
            ann.files.clear();
        }
        Some(h) => {
            ann.onion = Some(h.onion_addr.clone());
            let cfg = TrackerNetworkConfig::load();
            let shares = h.state.shares.lock().await;
            ann.files = shares
                .values()
                .map(|s| AnnouncedFile {
                    file_id: s.file_id,
                    name: s.file_name.clone(),
                    size: s.file_size,
                    link: h.link_for(s).to_link_string(),
                    content_hash: s.content_hash.clone(),
                })
                .collect();
            if !cfg.share_publicly {
                ann.files.clear();
            }
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OnionShareStartResponse {
    pub onion: String,
    pub local_port: u16,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OnionShareAddFileResponse {
    pub file_id: Uuid,
    pub file_name: String,
    pub file_size: u64,
    pub content_hash: String,
    pub link: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalShareEntry {
    pub file_id: Uuid,
    pub name: String,
    pub size: u64,
    pub content_hash: String,
    pub link: String,
}

#[tauri::command]
pub async fn onion_share_start() -> Result<OnionShareStartResponse, String> {
    let mut g = SHARE_HOST.lock().await;
    if g.is_some() {
        return Err("onion share host already running".into());
    }
    let h = ShareHostHandle::start()
        .await
        .map_err(|e| format!("{}", e))?;
    let onion = h.onion_addr.clone();
    let local_port = h.local_port;
    *g = Some(h);
    sync_announce_from_host().await;
    Ok(OnionShareStartResponse { onion, local_port })
}

#[tauri::command]
pub async fn onion_share_stop() -> Result<(), String> {
    let mut g = SHARE_HOST.lock().await;
    if let Some(h) = g.take() {
        h.stop().await;
    }
    sync_announce_from_host().await;
    Ok(())
}

#[tauri::command]
pub async fn onion_share_add_file(path: String) -> Result<OnionShareAddFileResponse, String> {
    let g = SHARE_HOST.lock().await;
    let h = g
        .as_ref()
        .ok_or_else(|| "start onion share host first (onion_share_start)".to_string())?;
    let share = h
        .add_file(PathBuf::from(path))
        .await
        .map_err(|e| e.to_string())?;
    let link = h.link_for(&share).to_link_string();
    let resp = OnionShareAddFileResponse {
        file_id: share.file_id,
        file_name: share.file_name.clone(),
        file_size: share.file_size,
        content_hash: share.content_hash.clone(),
        link: link.clone(),
    };
    drop(g);
    sync_announce_from_host().await;
    Ok(resp)
}

#[tauri::command]
pub async fn onion_share_remove_file(file_id: String) -> Result<(), String> {
    let id = Uuid::parse_str(&file_id).map_err(|e| e.to_string())?;
    let g = SHARE_HOST.lock().await;
    let h = g
        .as_ref()
        .ok_or_else(|| "share host not running".to_string())?;
    h.remove_file(id).await;
    drop(g);
    sync_announce_from_host().await;
    Ok(())
}

#[tauri::command]
pub async fn onion_share_list_local() -> Result<Vec<LocalShareEntry>, String> {
    let g = SHARE_HOST.lock().await;
    let h = g
        .as_ref()
        .ok_or_else(|| "share host not running".to_string())?;
    let shares = h.state.shares.lock().await;
    let out: Vec<LocalShareEntry> = shares
        .values()
        .map(|s| LocalShareEntry {
            file_id: s.file_id,
            name: s.file_name.clone(),
            size: s.file_size,
            content_hash: s.content_hash.clone(),
            link: h.link_for(s).to_link_string(),
        })
        .collect();
    Ok(out)
}

#[tauri::command]
pub async fn onion_share_status() -> Result<serde_json::Value, String> {
    let g = SHARE_HOST.lock().await;
    if let Some(h) = g.as_ref() {
        Ok(serde_json::json!({
            "running": true,
            "onion": h.onion_addr,
            "localPort": h.local_port,
        }))
    } else {
        Ok(serde_json::json!({
            "running": false,
            "onion": serde_json::Value::Null,
            "localPort": serde_json::Value::Null,
        }))
    }
}

#[tauri::command]
pub async fn tracker_get_config() -> Result<TrackerNetworkConfig, String> {
    Ok(TrackerNetworkConfig::load())
}

#[tauri::command]
pub async fn tracker_set_config(config: TrackerNetworkConfig) -> Result<(), String> {
    config.save().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn tracker_refresh_lobby() -> Result<crate::onion_share::tracker_proto::NetworkLobby, String> {
    let cfg = TrackerNetworkConfig::load();
    let socks = tor_manager::status().socks;
    let st = ANNOUNCE.read().await;
    let onion = st.onion.clone();
    let files = if cfg.share_publicly {
        st.files.clone()
    } else {
        vec![]
    };
    drop(st);
    let lobby = tracker::http_sync_tracker(socks.as_deref(), &cfg, onion, files)
        .await
        .map_err(|e| e.to_string())?;
    tracker::replace_cached_lobby(lobby.clone()).await;
    Ok(lobby)
}

#[tauri::command]
pub async fn tracker_get_cached_lobby_cmd() -> Result<crate::onion_share::tracker_proto::NetworkLobby, String> {
    Ok(get_cached_lobby().await)
}

#[tauri::command]
pub async fn tracker_start_ws_loop(app: AppHandle) -> Result<(), String> {
    let mut slot = TRACKER_WS_TASK.lock().await;
    if let Some(old) = slot.take() {
        old.abort();
    }
    let announce = ANNOUNCE.clone();
    let app2 = app.clone();
    let handle = tokio::spawn(async move {
        loop {
            let socks = tor_manager::status().socks;
            let _ = tracker::run_one_ws_session(socks.clone(), Some(app2.clone()), announce.clone()).await;
            let cfg = TrackerNetworkConfig::load();
            let st = announce.read().await;
            let onion = st.onion.clone();
            let files = if cfg.share_publicly {
                st.files.clone()
            } else {
                vec![]
            };
            drop(st);
            if let Ok(lobby) =
                tracker::http_sync_tracker(socks.as_deref(), &cfg, onion, files).await
            {
                tracker::replace_cached_lobby(lobby.clone()).await;
                let _ = app2.emit("onion-share-lobby", &lobby);
            }
            tokio::time::sleep(Duration::from_secs(3)).await;
        }
    });
    *slot = Some(handle);
    Ok(())
}

#[tauri::command]
pub async fn tracker_stop_ws_loop() -> Result<(), String> {
    let mut slot = TRACKER_WS_TASK.lock().await;
    if let Some(h) = slot.take() {
        h.abort();
    }
    Ok(())
}

#[tauri::command]
pub async fn onion_share_fetch(link: String, out_dir: String) -> Result<String, String> {
    let socks = tor_manager::status().socks;
    let path = fetch::fetch_to_dir(&link, PathBuf::from(out_dir), socks)
        .await
        .map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}
