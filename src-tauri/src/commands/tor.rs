use serde::{Deserialize, Serialize};
use crate::core::p2p::tor_manager;

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
        },
        Err(_) => TorStatus { bootstrapped: false, circuit_established: false, bridges_enabled: false, socks: None },
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
    }
}

#[tauri::command]
pub async fn enable_tor_bridges(_bridges: Vec<String>) -> bool {
    // TODO: write bridges to torrc and reload; placeholder true
    true
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
    // TODO: track created onion addresses; placeholder empty
    vec![]
}

#[tauri::command]
pub async fn rotate_tor_circuit() -> bool {
    // TODO: send SIGNAL NEWNYM via control port; placeholder true
    true
}

#[tauri::command]
pub async fn stop_tor() -> bool {
    tor_manager::stop()
}


