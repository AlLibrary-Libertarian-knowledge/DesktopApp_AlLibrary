use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::collections::HashMap;
use crate::core::p2p::{self, onion_bootstrap_addr};
use tokio::sync::oneshot;

// Simple in-memory runtime to carry socks proxy and node state (placeholder for real libp2p runtime)
static RUNTIME: Mutex<Option<Runtime>> = Mutex::new(None);

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Runtime {
    node_id: String,
    socks_proxy: Option<String>,
    online: bool,
    content_index: HashMap<String, String>,
}

// Persist p2p runtime command channel
static P2P_TX: Mutex<Option<tokio::sync::mpsc::Sender<p2p::Command>>> = Mutex::new(None);

// New API draft for real libp2p integration (to be implemented in core/p2p)
#[tauri::command]
pub async fn start_libp2p_with_socks(socks_addr: String) -> bool {
    // Avoid holding the mutex across await
    let handle = match p2p::start_runtime(Some(socks_addr.clone())).await {
        Ok(h) => h,
        Err(_) => return false,
    };
    {
        let mut tx_guard = P2P_TX.lock().unwrap();
        *tx_guard = Some(handle.command_tx.clone());
    }
    {
        let mut guard = RUNTIME.lock().unwrap();
        *guard = Some(Runtime { node_id: format!("{}", handle.peer_id), socks_proxy: Some(socks_addr), online: true, content_index: HashMap::new() });
    }
    true
}

#[tauri::command]
pub async fn connect_bootstrap(onion_addrs: Vec<String>) -> bool {
    let addrs: Vec<_> = onion_addrs.into_iter().map(|a| onion_bootstrap_addr(&a, 443)).collect();
    let tx_opt = { P2P_TX.lock().unwrap().as_ref().cloned() };
    if let Some(tx) = tx_opt {
        let _ = tx.send(p2p::Command::AddBootstrap { addrs }).await;
        true
    } else { false }
}

#[tauri::command]
pub async fn publish_content(path: String) -> Result<String, String> {
    use sha2::{Sha256, Digest};
    let bytes = std::fs::read(&path).map_err(|e| format!("Failed to read file: {}", e))?;
    let mut h = Sha256::new(); h.update(&bytes);
    let hash = format!("{:x}", h.finalize());
    {
        let mut guard = RUNTIME.lock().unwrap();
        if let Some(rt) = guard.as_mut() {
            rt.content_index.insert(hash.clone(), path.clone());
        }
    }
    let tx_opt = { P2P_TX.lock().unwrap().as_ref().cloned() };
    if let Some(tx) = tx_opt {
        let _ = tx.send(p2p::Command::UpdateIndex { hash: hash.clone(), path }).await;
        let _ = tx.send(p2p::Command::PublishHash { hash: hash.clone() }).await;
        Ok(hash)
    } else { Err("p2p runtime not started".into()) }
}

#[tauri::command]
pub async fn fetch_content(cid_or_hash: String, out_path: String) -> Result<String, String> {
    let tx_opt = { P2P_TX.lock().unwrap().as_ref().cloned() };
    if let Some(tx) = tx_opt {
        let (reply_tx, reply_rx) = oneshot::channel();
        tx.send(p2p::Command::Fetch { hash: cid_or_hash, out_path, reply: reply_tx })
            .await
            .map_err(|e| e.to_string())?;
        match reply_rx.await.map_err(|e| e.to_string())? {
            Ok(path) => Ok(path),
            Err(err) => Err(err),
        }
    } else {
        Err("p2p runtime not started".into())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    pub tor_support: Option<bool>,
    pub socks_proxy: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct P2PNode {
    pub id: String,
    pub config: NodeConfigEcho,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeConfigEcho {
    pub enable_cultural_filtering: bool,
    pub enable_content_blocking: bool,
    pub tor_support: bool,
    pub socks_proxy: Option<String>,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkMetrics {
    pub anonymity_level: u8,
    pub avg_latency_ms: u32,
    pub peers_connected: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchOptions {
    pub include_anonymous: Option<bool>,
    pub include_cultural_context: Option<bool>,
    pub resist_censorship: Option<bool>,
    pub support_alternative_narratives: Option<bool>,
    pub max_results: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    pub options: SearchOptions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub description: String,
}

#[tauri::command]
pub async fn init_p2p_node(config: NetworkConfig) -> P2PNode {
    let node_id = format!("node-{}", uuid::Uuid::new_v4());
    {
        let mut guard = RUNTIME.lock().unwrap();
        *guard = Some(Runtime {
            node_id: node_id.clone(),
            socks_proxy: config.socks_proxy.clone(),
            online: false,
            content_index: HashMap::new(),
        });
    }
    P2PNode {
        id: node_id,
        config: NodeConfigEcho {
            enable_cultural_filtering: false,
            enable_content_blocking: false,
            tor_support: config.tor_support.unwrap_or(true),
            socks_proxy: config.socks_proxy,
        },
    }
}

#[tauri::command]
pub async fn start_p2p_node(node_id: String) -> bool {
    let mut guard = RUNTIME.lock().unwrap();
    if let Some(rt) = guard.as_mut() {
        if rt.node_id == node_id { rt.online = true; return true; }
    }
    false
}

#[tauri::command]
pub async fn stop_p2p_node(_node_id: String) -> bool { true }

#[tauri::command]
pub async fn get_p2p_node_status(_node_id: Option<String>) -> NetworkStatus {
    let guard = RUNTIME.lock().unwrap();
    if let Some(rt) = guard.as_ref() {
        let status = if rt.online { "online" } else { "starting" };
        return NetworkStatus { status: status.into(), connected_peers: if rt.online { 12 } else { 0 }, connection_quality: if rt.online { "good".into() } else { "n/a".into() } };
    }
    NetworkStatus { status: "offline".into(), connected_peers: 0, connection_quality: "n/a".into() }
}

#[tauri::command]
pub async fn get_connected_peers(_node_id: Option<String>) -> Vec<PeerInfo> {
    let guard = RUNTIME.lock().unwrap();
    if let Some(rt) = guard.as_ref() {
        if rt.online {
            return vec![PeerInfo { id: "peer-onion-1".into(), name: Some("Onion Peer".into()), connected: true }];
        }
    }
    vec![]
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerDiscoveryOptions {
    pub include_tor_peers: Option<bool>,
    pub include_hidden_services: Option<bool>,
}

#[tauri::command]
pub async fn discover_peers(_node_id: Option<String>, _options: Option<PeerDiscoveryOptions>) -> Vec<PeerInfo> {
    get_connected_peers(None).await
}

#[tauri::command]
pub async fn get_network_metrics(_node_id: Option<String>) -> NetworkMetrics {
    NetworkMetrics { anonymity_level: 4, avg_latency_ms: 250, peers_connected: 12 }
}

#[tauri::command]
pub async fn enable_tor_routing(_node_id: Option<String>, socks_proxy: Option<String>) -> bool {
    let mut guard = RUNTIME.lock().unwrap();
    if let Some(rt) = guard.as_mut() {
        if socks_proxy.is_some() { rt.socks_proxy = socks_proxy; }
        return true;
    }
    false
}

#[tauri::command]
pub async fn disable_tor_routing(_node_id: Option<String>) -> bool { true }

#[tauri::command]
pub async fn search_p2p_network(_node_id: Option<String>, search_request: SearchRequest) -> Vec<SearchResult> {
    let max = search_request.options.max_results.unwrap_or(10);
    (0..max.min(3))
        .map(|i| SearchResult {
            id: format!("res-{}", i),
            title: format!("{} - result {}", search_request.query, i + 1),
            description: "P2P network item".into(),
        })
        .collect()
}

