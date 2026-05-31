use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::commands::onion_bridge::OnionShareState;
use crate::core::database::{
    ensure_node_database, list_recent_transfers_pool, load_lobby_from_db, transfer_metrics_pool,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorConfig {
    #[serde(alias = "bridgeSupport")]
    pub bridge_support: Option<bool>,
    #[serde(alias = "socksAddr")]
    pub socks_addr: Option<String>,
    pub bridges: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorStatus {
    pub bootstrapped: bool,
    pub circuit_established: bool,
    pub bridges_enabled: bool,
    pub socks: Option<String>,
    pub supports_control: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    pub tor_support: Option<bool>,
    pub socks_proxy: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeConfigEcho {
    pub enable_cultural_filtering: bool,
    pub enable_content_blocking: bool,
    pub tor_support: bool,
    pub socks_proxy: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct P2PNode {
    pub id: String,
    pub config: NodeConfigEcho,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStatus {
    pub status: String,
    pub connected_peers: usize,
    pub connection_quality: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerInfo {
    pub id: String,
    pub name: Option<String>,
    pub connected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TransferItem {
    pub id: String,
    pub name: String,
    pub size: u64,
    pub downloaded: u64,
    pub download_speed: u64,
    pub upload_speed: u64,
    pub peers: u32,
    pub seeders: u32,
    pub eta_secs: u64,
    pub status: String,
    pub health: u8,
    pub ratio: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NetworkMetrics {
    pub active_downloads: u32,
    pub active_seeding: u32,
    pub active_discovery: u32,
    pub download_rate: u64,
    pub upload_rate: u64,
    pub transfers: Vec<TransferItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BootstrapResult {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
pub async fn init_tor_node(_config: Option<TorConfig>) -> TorStatus {
    disabled_tor_status()
}

#[tauri::command]
pub async fn start_tor() -> bool { false }

#[tauri::command]
pub async fn get_tor_status() -> TorStatus {
    disabled_tor_status()
}

#[tauri::command]
pub async fn enable_tor_bridges(_bridges: Vec<String>) -> bool { false }

#[tauri::command]
pub async fn use_tor_socks(_addr: String) -> bool { false }

#[tauri::command]
pub async fn create_hidden_service(_local_port: u16) -> String { String::new() }

#[tauri::command]
pub async fn list_hidden_services() -> Vec<String> { Vec::new() }

#[tauri::command]
pub async fn rotate_tor_circuit() -> bool { false }

#[tauri::command]
pub async fn stop_tor() -> bool { true }

#[tauri::command]
pub async fn get_tor_log_tail(_lines: usize) -> String {
    "Network module disabled: coming soon.".to_string()
}

#[tauri::command]
pub async fn init_p2p_node(config: NetworkConfig) -> P2PNode {
    P2PNode {
        id: "network-disabled".to_string(),
        config: NodeConfigEcho {
            enable_cultural_filtering: false,
            enable_content_blocking: false,
            tor_support: config.tor_support.unwrap_or(false),
            socks_proxy: config.socks_proxy,
        },
    }
}

#[tauri::command]
pub async fn start_p2p_node(_node_id: String) -> bool { false }

#[tauri::command]
pub async fn stop_p2p_node(_node_id: String) -> bool { true }

#[tauri::command]
pub async fn get_p2p_node_status(_node_id: Option<String>) -> NetworkStatus {
    NetworkStatus {
        status: "offline".to_string(),
        connected_peers: 0,
        connection_quality: "disabled".to_string(),
    }
}

#[tauri::command]
pub async fn get_connected_peers(_node_id: Option<String>) -> Vec<PeerInfo> { Vec::new() }

#[tauri::command]
pub async fn discover_peers(_node_id: Option<String>, _options: Option<serde_json::Value>) -> Vec<PeerInfo> {
    Vec::new()
}

#[tauri::command]
pub async fn get_network_metrics(app: AppHandle, _node_id: Option<String>) -> NetworkMetrics {
    let mut metrics = NetworkMetrics::default();

    if let Ok(pool) = ensure_node_database(&app).await {
        if let Ok((active, bytes_5m, completed_24h)) = transfer_metrics_pool(&pool).await {
            metrics.active_downloads = active;
            metrics.download_rate = bytes_5m / 300;
            metrics.active_seeding = completed_24h;
        }

        if let Ok(rows) = list_recent_transfers_pool(&pool, 20).await {
            metrics.transfers = rows
                .into_iter()
                .map(|t| {
                    let name = t
                        .name
                        .filter(|n| !n.is_empty())
                        .unwrap_or_else(|| t.link.chars().take(48).collect());
                    TransferItem {
                        id: t.id,
                        name,
                        size: t.bytes_moved.max(0) as u64,
                        downloaded: ((t.progress * t.bytes_moved.max(0) as f64) as u64),
                        download_speed: if t.status == "active" {
                            metrics.download_rate
                        } else {
                            0
                        },
                        upload_speed: 0,
                        peers: 0,
                        seeders: 0,
                        eta_secs: 0,
                        status: t.status.clone(),
                        health: if t.status == "completed" {
                            100
                        } else if t.status == "failed" {
                            0
                        } else {
                            (t.progress * 100.0) as u8
                        },
                        ratio: 0.0,
                    }
                })
                .collect();
        }
    }

    if let Ok(lobby) = load_lobby_from_db(&app).await {
        metrics.active_discovery = lobby.files.len() as u32;
        if metrics.active_seeding == 0 {
            metrics.active_seeding = lobby.online_nodes as u32;
        }
    }

    if let Some(state) = app.try_state::<OnionShareState>() {
        let guard = state.handle.lock().await;
        if guard.is_none() && metrics.download_rate == 0 {
            metrics.active_downloads = 0;
        }
    }

    metrics
}

#[tauri::command]
pub async fn enable_tor_routing(_node_id: Option<String>, _socks_proxy: Option<String>) -> bool { false }

#[tauri::command]
pub async fn disable_tor_routing(_node_id: Option<String>) -> bool { true }

#[tauri::command]
pub async fn search_p2p_network(_node_id: Option<String>, _search_request: serde_json::Value) -> Vec<serde_json::Value> {
    Vec::new()
}

#[tauri::command]
pub async fn start_libp2p_with_socks(_socks_addr: String) -> bool { false }

#[tauri::command]
pub async fn connect_bootstrap(_onion_addrs: Vec<String>) -> bool { false }

#[tauri::command]
pub async fn publish_content(_path: String) -> Result<String, String> {
    Err("Network disabled: coming soon".to_string())
}

#[tauri::command]
pub async fn fetch_content(_cid_or_hash: String, _out_path: String) -> Result<String, String> {
    Err("Network disabled: coming soon".to_string())
}

#[tauri::command]
pub async fn put_kad_record(_key: String, _value: Vec<u8>) -> Result<String, String> {
    Err("Network disabled: coming soon".to_string())
}

#[tauri::command]
pub async fn get_kad_record(_key: String) -> Result<Vec<u8>, String> {
    Err("Network disabled: coming soon".to_string())
}

#[tauri::command]
pub async fn bootstrap_kad() -> Result<BootstrapResult, String> {
    Ok(BootstrapResult { success: false, message: "Network disabled: coming soon".to_string() })
}

#[tauri::command]
pub async fn announce_peer_presence(_multiaddr: String) -> Result<String, String> {
    Err("Network disabled: coming soon".to_string())
}

#[tauri::command]
pub async fn discover_kad_peers() -> Result<Vec<String>, String> { Ok(Vec::new()) }

#[tauri::command]
pub async fn test_p2p_connection() -> Result<String, String> {
    Err("Network disabled: coming soon".to_string())
}

#[tauri::command]
pub async fn get_p2p_debug_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({"status":"disabled","message":"Network module coming soon"}))
}

#[tauri::command]
pub async fn get_peer_discovery_status() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({"status":"disabled","message":"Network module coming soon"}))
}

#[tauri::command]
pub async fn get_my_onion_address() -> Result<String, String> {
    Err("Network disabled: coming soon".to_string())
}

#[tauri::command]
pub async fn get_network_peers() -> Result<Vec<String>, String> { Ok(Vec::new()) }

#[tauri::command]
pub async fn add_peer_address(_address: String) -> Result<String, String> {
    Err("Network disabled: coming soon".to_string())
}

#[tauri::command]
pub async fn force_create_onion_service() -> Result<String, String> {
    Err("Network disabled: coming soon".to_string())
}

fn disabled_tor_status() -> TorStatus {
    TorStatus {
        bootstrapped: false,
        circuit_established: false,
        bridges_enabled: false,
        socks: None,
        supports_control: false,
    }
}
