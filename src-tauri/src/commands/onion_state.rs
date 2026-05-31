//! Shared onion / tracker runtime state (avoids circular deps with documents + seed_sync).

use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::sync::{Mutex, RwLock};

use crate::onion_share::server::ShareServerHandle;
use crate::onion_share::tracker_proto::NetworkLobby;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TorBootstrapSnapshot {
    pub mode: String,
    pub bootstrap_percent: u8,
    pub last_error: Option<String>,
    pub last_attempt_at_ms: i64,
    pub retry_count: u32,
    pub local_only: bool,
    pub retry_window_start_ms: i64,
}

impl Default for TorBootstrapSnapshot {
    fn default() -> Self {
        Self {
            mode: "idle".to_string(),
            bootstrap_percent: 0,
            last_error: None,
            last_attempt_at_ms: 0,
            retry_count: 0,
            local_only: false,
            retry_window_start_ms: 0,
        }
    }
}

#[derive(Clone)]
pub struct OnionShareState {
    pub handle: Arc<Mutex<Option<ShareServerHandle>>>,
    pub tracker_stop: Arc<AtomicBool>,
    pub tracker_task: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
    pub cached_lobby: Arc<RwLock<NetworkLobby>>,
    pub tracker_last_sync: Arc<Mutex<Option<serde_json::Value>>>,
    pub http_announce_stop: Arc<AtomicBool>,
    pub http_announce_task: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
    pub last_persisted_lobby_fp: Arc<Mutex<Option<String>>>,
    pub bootstrap: Arc<RwLock<TorBootstrapSnapshot>>,
    pub bootstrap_in_progress: Arc<AtomicBool>,
    /// Paths waiting for onion share when Tor was not ready.
    pub pending_seeds: Arc<Mutex<Vec<PathBuf>>>,
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
            last_persisted_lobby_fp: Arc::new(Mutex::new(None)),
            bootstrap: Arc::new(RwLock::new(TorBootstrapSnapshot::default())),
            bootstrap_in_progress: Arc::new(AtomicBool::new(false)),
            pending_seeds: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

/// Fire-and-forget notify after document treatment (avoids documents → onion_bridge cycle).
#[derive(Clone)]
pub struct SeedNotifySender(pub tokio::sync::mpsc::UnboundedSender<String>);
