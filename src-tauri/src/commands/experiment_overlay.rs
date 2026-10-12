//! DHT bootstrap, lookup benchmarks, and gossip announce for Cap. 6 experiments.

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use uuid::Uuid;

use crate::commands::onion_bridge::OnionShareState;
use crate::core::database::{
    ensure_node_database, insert_gossip_event_pool, insert_lookup_event_pool, load_lobby_from_db,
};
use crate::onion_share::config::{normalize_tracker_url, AppConfig};
use crate::onion_share::dht::{
    bootstrap_from_peers, iterative_find_value, DhtPeer, RoutingTable, StoreReq,
};
use crate::onion_share::fetch::build_http_client;
use crate::onion_share::gossip::{fanout_send, new_announce, DEFAULT_FANOUT};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BootstrapResult {
    pub success: bool,
    pub message: String,
    pub peers_known: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LookupBenchmarkDto {
    pub content_hash: String,
    pub hops: u32,
    pub duration_ms: u64,
    pub success: bool,
    pub peer_count: u32,
    pub provider_count: u32,
}

async fn local_peer_from_state(state: &OnionShareState) -> Result<(DhtPeer, String), String> {
    let handle = state.handle.lock().await;
    let h = handle
        .as_ref()
        .ok_or_else(|| "Start onion sharing first (Tor SOCKS required).".to_string())?;
    let socks = h.socks_addr();
    let onion = h.onion_addr.clone();
    let cfg = AppConfig::load();
    let node_id = if cfg.node_id.trim().is_empty() {
        Uuid::new_v4().to_string()
    } else {
        cfg.node_id
    };
    Ok((DhtPeer { node_id, onion }, socks))
}

#[tauri::command]
pub async fn bootstrap_kad(
    app: AppHandle,
    state: State<'_, OnionShareState>,
) -> Result<BootstrapResult, String> {
    let (local, socks) = local_peer_from_state(&state).await?;
    if let Some(h) = state.handle.lock().await.as_ref() {
        h.state.set_local_peer(local.clone()).await;
    }

    // Seeds from tracker bootstrap + lobby peers
    let mut seeds: Vec<DhtPeer> = Vec::new();
    let tracker_url = normalize_tracker_url(&AppConfig::load().tracker_url);

    if let Ok(client) = build_http_client(&tracker_url, None) {
        if let Ok(resp) = client
            .get(format!(
                "{}/dht/bootstrap",
                tracker_url.trim_end_matches('/')
            ))
            .send()
            .await
        {
            if let Ok(body) = resp.json::<serde_json::Value>().await {
                if let Some(arr) = body.get("peers").and_then(|p| p.as_array()) {
                    for p in arr {
                        let node_id = p
                            .get("node_id")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let onion = p
                            .get("onion")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        if !node_id.is_empty() && !onion.is_empty() {
                            seeds.push(DhtPeer { node_id, onion });
                        }
                    }
                }
            }
        }
    }

    if let Ok(lobby) = load_lobby_from_db(&app).await {
        for f in lobby.files {
            for peer in f.peers {
                seeds.push(DhtPeer {
                    node_id: peer.node_id,
                    onion: peer.onion,
                });
            }
        }
    }

    let mut table = RoutingTable::new(local.node_id.clone());
    let contacted = bootstrap_from_peers(&mut table, &socks, &local, seeds)
        .await
        .unwrap_or(0);

    if let Some(h) = state.handle.lock().await.as_ref() {
        *h.state.dht.lock().await = table.clone();
        // Advertise local shares into DHT store
        let shares = h.state.shares.lock().await;
        for s in shares.values() {
            h.state
                .dht
                .lock()
                .await
                .store_provider(&s.content_hash, local.clone());
        }
    }

    Ok(BootstrapResult {
        success: contacted > 0 || table.peer_count() > 0,
        message: format!(
            "DHT bootstrap: contacted {contacted} seeds, {} peers in table",
            table.peer_count()
        ),
        peers_known: table.peer_count() as u32,
    })
}

#[tauri::command]
pub async fn run_dht_lookup_benchmark(
    app: AppHandle,
    state: State<'_, OnionShareState>,
    content_hash: String,
) -> Result<LookupBenchmarkDto, String> {
    let (local, socks) = local_peer_from_state(&state).await?;
    let mut table = if let Some(h) = state.handle.lock().await.as_ref() {
        h.state.dht.lock().await.clone()
    } else {
        RoutingTable::new(local.node_id.clone())
    };

    let result = iterative_find_value(&mut table, &socks, &local, &content_hash)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(h) = state.handle.lock().await.as_ref() {
        *h.state.dht.lock().await = table;
    }

    if let Ok(pool) = ensure_node_database(&app).await {
        let _ = insert_lookup_event_pool(
            &pool,
            Some(&content_hash),
            result.hops,
            result.duration_ms,
            result.success,
            result.peer_count,
        )
        .await;
    }

    Ok(LookupBenchmarkDto {
        content_hash,
        hops: result.hops,
        duration_ms: result.duration_ms,
        success: result.success,
        peer_count: result.peer_count,
        provider_count: result.providers.len() as u32,
    })
}

#[tauri::command]
pub async fn put_kad_record(
    state: State<'_, OnionShareState>,
    key: String,
    _value: Vec<u8>,
) -> Result<String, String> {
    let (local, socks) = local_peer_from_state(&state).await?;
    let peers = if let Some(h) = state.handle.lock().await.as_ref() {
        h.state
            .dht
            .lock()
            .await
            .store_provider(&key, local.clone());
        h.state.dht.lock().await.closest(&key, 8)
    } else {
        Vec::new()
    };
    let client = build_http_client("http://x.onion", Some(socks)).map_err(|e| e.to_string())?;
    for peer in peers {
        let url = format!("http://{}/dht/store", peer.onion.trim_end_matches('/'));
        let _ = client
            .post(url)
            .json(&StoreReq {
                from: local.clone(),
                content_hash: key.clone(),
                provider: local.clone(),
            })
            .send()
            .await;
    }
    Ok(key)
}

#[tauri::command]
pub async fn get_kad_record(
    app: AppHandle,
    state: State<'_, OnionShareState>,
    key: String,
) -> Result<Vec<u8>, String> {
    let dto = run_dht_lookup_benchmark(app, state, key).await?;
    if dto.success {
        Ok(dto.content_hash.into_bytes())
    } else {
        Err("FIND_VALUE found no providers".to_string())
    }
}

#[tauri::command]
pub async fn gossip_announce_content(
    app: AppHandle,
    state: State<'_, OnionShareState>,
    content_hash: String,
    size: Option<u64>,
) -> Result<serde_json::Value, String> {
    let (local, socks) = local_peer_from_state(&state).await?;
    let msg = new_announce(&local, &content_hash, size.unwrap_or(0));
    let peers = if let Some(h) = state.handle.lock().await.as_ref() {
        h.state.dht.lock().await.all_peers()
    } else {
        Vec::new()
    };
    let sent = fanout_send(&socks, &peers, &msg, DEFAULT_FANOUT)
        .await
        .map_err(|e| e.to_string())?;

    if let Ok(pool) = ensure_node_database(&app).await {
        let _ = insert_gossip_event_pool(&pool, &msg.msg_id, &content_hash, 0, 0).await;
    }

    Ok(serde_json::json!({
        "msgId": msg.msg_id,
        "contentHash": content_hash,
        "sent": sent,
        "fanout": DEFAULT_FANOUT,
    }))
}

#[tauri::command]
pub async fn discover_kad_peers(state: State<'_, OnionShareState>) -> Result<Vec<String>, String> {
    if let Some(h) = state.handle.lock().await.as_ref() {
        let peers = h.state.dht.lock().await.all_peers();
        return Ok(peers.into_iter().map(|p| p.onion).collect());
    }
    Ok(Vec::new())
}
