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
    metadata_index: HashMap<String, ContentMeta>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ContentMeta {
    pub title: Option<String>,
    pub author: Option<String>,
    pub tags: Vec<String>,
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
pub struct KademliaRecord {
    pub key: String,
    pub value: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BootstrapResult {
    pub success: bool,
    pub message: String,
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
        *guard = Some(Runtime { node_id: format!("{}", handle.peer_id), socks_proxy: Some(socks_addr), online: true, content_index: HashMap::new(), metadata_index: HashMap::new() });
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
    // rudimentary metadata extraction: filename -> title, try parse author from parent directory
    let title = std::path::Path::new(&path).file_stem().and_then(|s| s.to_str()).map(|s| s.to_string());
    let author = std::path::Path::new(&path).parent().and_then(|p| p.file_name()).and_then(|s| s.to_str()).map(|s| s.to_string());
    let meta = ContentMeta { title, author, tags: vec![] };
    {
        let mut guard = RUNTIME.lock().unwrap();
        if let Some(rt) = guard.as_mut() {
            rt.content_index.insert(hash.clone(), path.clone());
            rt.metadata_index.insert(hash.clone(), meta);
        }
    }
    let tx_opt = { P2P_TX.lock().unwrap().as_ref().cloned() };
    if let Some(tx) = tx_opt {
        let title2 = std::path::Path::new(&path).file_stem().and_then(|s| s.to_str()).unwrap_or("").to_string();
        let author2 = std::path::Path::new(&path).parent().and_then(|p| p.file_name()).and_then(|s| s.to_str()).map(|s| s.to_string());
        let _ = tx.send(p2p::Command::UpdateIndex { hash: hash.clone(), path, title: title2, author: author2, tags: vec![] }).await;
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

// NetworkMetrics is defined above (single canonical definition)

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
            metadata_index: HashMap::new(),
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
        // Derive peers from connected index size if available later; for now reflect online/offline
        let peers = if rt.online { rt.content_index.len() } else { 0 };
        return NetworkStatus { status: status.into(), connected_peers: peers, connection_quality: if rt.online { "good".into() } else { "n/a".into() } };
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
    // Approximate metrics derived from runtime; replace with real counters when available
    let guard = RUNTIME.lock().unwrap();
    let peers = guard.as_ref().map(|rt| if rt.online { rt.content_index.len() } else { 0 }).unwrap_or(0);
    let mut metrics = NetworkMetrics {
        active_downloads: 0,
        active_seeding: if peers > 0 { 1 } else { 0 },
        active_discovery: if peers > 0 { 1 } else { 0 },
        download_rate: 0,
        upload_rate: 0,
        transfers: Vec::new(),
    };
    if let Some(rt) = guard.as_ref() {
        for (hash, path) in rt.content_index.iter() {
            let name = std::path::Path::new(path).file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
            let size = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
            metrics.transfers.push(TransferItem {
                id: hash.clone(), name, size, downloaded: size, download_speed: 0, upload_speed: 0,
                peers: 0, seeders: 0, eta_secs: 0, status: "seeding".into(), health: 100, ratio: 1.0,
            });
        }
    }
    metrics
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
    // Distributed search via libp2p gossipsub bridge in core/p2p runtime
    let tx_opt = { P2P_TX.lock().unwrap().as_ref().cloned() };
    if let Some(tx) = tx_opt {
        let (reply_tx, reply_rx) = oneshot::channel();
        if tx.send(p2p::Command::Search { query: search_request.query.clone(), reply: reply_tx }).await.is_ok() {
            if let Ok(pairs) = reply_rx.await {
                let max = search_request.options.max_results.unwrap_or(25);
                let guard = RUNTIME.lock().unwrap();
                let out = pairs.into_iter().take(max).map(|(id, name)| {
                    let desc = if let Some(rt) = guard.as_ref() { if let Some(m) = rt.metadata_index.get(&id) {
                        let mut d = String::new();
                        if let Some(a) = &m.author { d.push_str(&format!("author: {} ", a)); }
                        if !m.tags.is_empty() { d.push_str(&format!("tags: {} ", m.tags.join(","))); }
                        d
                    } else { String::new() } } else { String::new() };
                    SearchResult { id, title: name.clone(), description: if desc.is_empty() { "P2P network item".into() } else { desc } }
                }).collect();
                return out;
            }
        }
    }
    vec![]
}

// ============ NEW KADEMLIA RECORD COMMANDS ============

#[tauri::command]
pub async fn put_kad_record(key: String, value: Vec<u8>) -> Result<String, String> {
    let tx_opt = { P2P_TX.lock().unwrap().as_ref().cloned() };
    
    if let Some(tx) = tx_opt {
        let (reply_tx, reply_rx) = oneshot::channel();
        
        if tx.send(p2p::Command::PutRecord { key: key.clone(), value, reply: reply_tx }).await.is_ok() {
            match reply_rx.await {
                Ok(Ok(())) => Ok(format!("Successfully stored record with key: {}", key)),
                Ok(Err(e)) => Err(format!("Failed to store record: {}", e)),
                Err(_) => Err("Communication error with P2P runtime".to_string()),
            }
        } else {
            Err("Failed to send command to P2P runtime".to_string())
        }
    } else {
        Err("P2P runtime not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_kad_record(key: String) -> Result<Vec<u8>, String> {
    let tx_opt = { P2P_TX.lock().unwrap().as_ref().cloned() };
    
    if let Some(tx) = tx_opt {
        let (reply_tx, reply_rx) = oneshot::channel();
        
        if tx.send(p2p::Command::GetRecord { key: key.clone(), reply: reply_tx }).await.is_ok() {
            match reply_rx.await {
                Ok(Ok(value)) => Ok(value),
                Ok(Err(e)) => Err(format!("Failed to retrieve record: {}", e)),
                Err(_) => Err("Communication error with P2P runtime".to_string()),
            }
        } else {
            Err("Failed to send command to P2P runtime".to_string())
        }
    } else {
        Err("P2P runtime not initialized".to_string())
    }
}

#[tauri::command]
pub async fn bootstrap_kad() -> Result<BootstrapResult, String> {
    let tx_opt = { P2P_TX.lock().unwrap().as_ref().cloned() };
    
    if let Some(tx) = tx_opt {
        let (reply_tx, reply_rx) = oneshot::channel();
        
        if tx.send(p2p::Command::Bootstrap { reply: reply_tx }).await.is_ok() {
            match reply_rx.await {
                Ok(Ok(())) => Ok(BootstrapResult {
                    success: true,
                    message: "Kademlia bootstrap completed successfully".to_string(),
                }),
                Ok(Err(e)) => Ok(BootstrapResult {
                    success: false,
                    message: format!("Bootstrap failed: {}", e),
                }),
                Err(_) => Err("Communication error with P2P runtime".to_string()),
            }
        } else {
            Err("Failed to send command to P2P runtime".to_string())
        }
    } else {
        Err("P2P runtime not initialized".to_string())
    }
}

// Convenience command to store peer discovery information
#[tauri::command]
pub async fn announce_peer_presence(multiaddr: String) -> Result<String, String> {
    let key = format!("allibrary:peer:announcement:{}", chrono::Utc::now().timestamp());
    let value = multiaddr.into_bytes();
    
    put_kad_record(key.clone(), value).await
        .map(|_| format!("Announced peer presence with key: {}", key))
}

// Convenience command to discover peers via Kademlia
#[tauri::command]
pub async fn discover_kad_peers() -> Result<Vec<String>, String> {
    // Query for known peer announcement patterns
    let discovery_key = "allibrary:peer:discovery".to_string();
    
    match get_kad_record(discovery_key).await {
        Ok(data) => {
            // Try to parse the data as peer addresses
            if let Ok(peer_list) = String::from_utf8(data) {
                Ok(peer_list.lines().map(|s| s.to_string()).collect())
            } else {
                Ok(vec![])
            }
        }
        Err(_) => Ok(vec![]) // No peers found, not an error
    }
}

