use serde::{Deserialize, Serialize};
use crate::core::p2p::tor_manager;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorConfig {
    pub bridge_support: Option<bool>,
    pub socks_addr: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorStatus {
    pub bootstrapped: bool,
    pub circuit_established: bool,
    pub bridges_enabled: bool,
    pub socks: Option<String>,
    pub supports_control: bool,
}

#[tauri::command]
pub async fn init_tor_node(config: Option<TorConfig>) -> TorStatus {
    let start_cfg = tor_manager::StartConfig {
        bridge_support: config.as_ref().and_then(|c| c.bridge_support).unwrap_or(true),
        socks_override: config.and_then(|c| c.socks_addr),
    };
    match tor_manager::start(start_cfg) {
        Ok(st) => TorStatus {
            bootstrapped: st.bootstrapped,
            circuit_established: st.circuit_established,
            bridges_enabled: st.bridges_enabled,
            socks: st.socks,
            supports_control: st.supports_control,
        },
        Err(_) => TorStatus { bootstrapped: false, circuit_established: false, bridges_enabled: false, socks: None, supports_control: false },
    }
}

#[tauri::command]
pub async fn start_tor() -> bool {
    // Already started in init_tor_node; return true for idempotency
    true
}

#[tauri::command]
pub async fn get_tor_status() -> TorStatus {
    let st = tor_manager::status();
    TorStatus {
        bootstrapped: st.bootstrapped,
        circuit_established: st.circuit_established,
        bridges_enabled: st.bridges_enabled,
        socks: st.socks,
        supports_control: st.supports_control,
    }
}

#[tauri::command]
pub async fn enable_tor_bridges(_bridges: Vec<String>) -> bool {
    tor_manager::enable_bridges(&_bridges)
}

#[tauri::command]
pub async fn use_tor_socks(_addr: String) -> bool {
    // TODO: persist and use external SOCKS (Tor Browser); placeholder true
    true
}

#[tauri::command]
pub async fn create_hidden_service(local_port: u16) -> String {
    match tor_manager::create_hidden_service(local_port) {
        Ok(addr) => addr,
        Err(_) => "".to_string(),
    }
}

#[tauri::command]
pub async fn list_hidden_services() -> Vec<String> {
    tor_manager::list_hidden()
}

#[tauri::command]
pub async fn rotate_tor_circuit() -> bool {
    tor_manager::rotate_circuit()
}

#[tauri::command]
pub async fn stop_tor() -> bool {
    tor_manager::stop()
}

#[tauri::command]
pub async fn get_tor_log_tail(lines: usize) -> String {
    // Mirror tor_manager data_dir path logic
    let mut base = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
    base.push("tor-data");
    let log_path = base.join("tor.log");
    if !log_path.exists() {
        return String::from("Tor log not available. Enable by setting TOR_DEBUG=1 and restarting.");
    }
    let Ok(content) = fs::read_to_string(&log_path) else {
        return String::from("Could not read tor.log");
    };
    let mut all: Vec<&str> = content.lines().collect();
    if all.len() > lines { all = all.split_off(all.len() - lines); }
    all.join("\n")
}

