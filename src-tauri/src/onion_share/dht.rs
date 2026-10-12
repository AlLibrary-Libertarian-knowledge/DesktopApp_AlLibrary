//! Minimal Kademlia-style DHT for TCC experiment metrics (discovery plane).
//! FIND_VALUE returns provider onions; file bytes still flow via onion-share.

use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};
use std::time::Instant;

use anyhow::Context;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub const K_BUCKET: usize = 8;
pub const ALPHA: usize = 3;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DhtPeer {
    pub node_id: String,
    pub onion: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FindNodeReq {
    pub from: DhtPeer,
    pub target_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FindNodeRes {
    pub peers: Vec<DhtPeer>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FindValueReq {
    pub from: DhtPeer,
    pub content_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FindValueRes {
    pub providers: Vec<DhtPeer>,
    pub closer: Vec<DhtPeer>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoreReq {
    pub from: DhtPeer,
    pub content_hash: String,
    pub provider: DhtPeer,
}

#[derive(Debug, Clone)]
pub struct LookupResult {
    pub content_hash: Option<String>,
    pub hops: u32,
    pub duration_ms: u64,
    pub success: bool,
    pub peer_count: u32,
    pub providers: Vec<DhtPeer>,
}

pub fn node_id_bytes(node_id: &str) -> [u8; 32] {
    let mut h = Sha256::new();
    h.update(node_id.as_bytes());
    h.finalize().into()
}

pub fn xor_distance(a: &[u8; 32], b: &[u8; 32]) -> [u8; 32] {
    let mut out = [0u8; 32];
    for i in 0..32 {
        out[i] = a[i] ^ b[i];
    }
    out
}

fn dist_cmp(a: &[u8; 32], b: &[u8; 32]) -> Ordering {
    a.cmp(b)
}

#[derive(Clone, Default)]
pub struct RoutingTable {
    pub local_id: String,
    peers: Vec<DhtPeer>,
    /// content_hash -> providers
    store: HashMap<String, Vec<DhtPeer>>,
}

impl RoutingTable {
    pub fn new(local_id: impl Into<String>) -> Self {
        Self {
            local_id: local_id.into(),
            peers: Vec::new(),
            store: HashMap::new(),
        }
    }

    pub fn upsert(&mut self, peer: DhtPeer) {
        if peer.node_id == self.local_id {
            return;
        }
        if let Some(existing) = self.peers.iter_mut().find(|p| p.node_id == peer.node_id) {
            *existing = peer;
            return;
        }
        self.peers.push(peer);
        // Keep closest K to local by XOR distance (simplified single bucket)
        let local = node_id_bytes(&self.local_id);
        self.peers.sort_by(|a, b| {
            let da = xor_distance(&local, &node_id_bytes(&a.node_id));
            let db = xor_distance(&local, &node_id_bytes(&b.node_id));
            dist_cmp(&da, &db)
        });
        if self.peers.len() > K_BUCKET * 4 {
            self.peers.truncate(K_BUCKET * 4);
        }
    }

    pub fn closest(&self, target_id: &str, n: usize) -> Vec<DhtPeer> {
        let target = node_id_bytes(target_id);
        let mut peers = self.peers.clone();
        peers.sort_by(|a, b| {
            let da = xor_distance(&target, &node_id_bytes(&a.node_id));
            let db = xor_distance(&target, &node_id_bytes(&b.node_id));
            dist_cmp(&da, &db)
        });
        peers.into_iter().take(n).collect()
    }

    pub fn store_provider(&mut self, content_hash: &str, provider: DhtPeer) {
        let entry = self.store.entry(content_hash.to_string()).or_default();
        if !entry.iter().any(|p| p.node_id == provider.node_id) {
            entry.push(provider);
        }
    }

    pub fn get_providers(&self, content_hash: &str) -> Vec<DhtPeer> {
        self.store.get(content_hash).cloned().unwrap_or_default()
    }

    pub fn all_peers(&self) -> Vec<DhtPeer> {
        self.peers.clone()
    }

    pub fn peer_count(&self) -> usize {
        self.peers.len()
    }
}

pub fn build_socks_client(socks: &str) -> anyhow::Result<reqwest::Client> {
    Ok(reqwest::Client::builder()
        .proxy(reqwest::Proxy::all(format!("socks5h://{socks}"))?)
        .connect_timeout(std::time::Duration::from_secs(60))
        .timeout(std::time::Duration::from_secs(90))
        .user_agent("AlLibrary-dht/0.1")
        .build()?)
}

async fn rpc_find_node(
    client: &reqwest::Client,
    peer: &DhtPeer,
    from: &DhtPeer,
    target_id: &str,
) -> anyhow::Result<FindNodeRes> {
    let url = format!("http://{}/dht/find_node", peer.onion.trim_end_matches('/'));
    let res = client
        .post(&url)
        .json(&FindNodeReq {
            from: from.clone(),
            target_id: target_id.to_string(),
        })
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    Ok(res)
}

async fn rpc_find_value(
    client: &reqwest::Client,
    peer: &DhtPeer,
    from: &DhtPeer,
    content_hash: &str,
) -> anyhow::Result<FindValueRes> {
    let url = format!("http://{}/dht/find_value", peer.onion.trim_end_matches('/'));
    let res = client
        .post(&url)
        .json(&FindValueReq {
            from: from.clone(),
            content_hash: content_hash.to_string(),
        })
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    Ok(res)
}

/// Iterative FIND_VALUE with hop counting for Cap. 6 benchmarks.
pub async fn iterative_find_value(
    table: &mut RoutingTable,
    socks: &str,
    local: &DhtPeer,
    content_hash: &str,
) -> anyhow::Result<LookupResult> {
    let started = Instant::now();
    let client = build_socks_client(socks)?;
    let mut hops = 0u32;
    let mut queried: HashSet<String> = HashSet::new();
    let mut shortlist = table.closest(content_hash, ALPHA.max(K_BUCKET));
    let mut best_providers: Vec<DhtPeer> = table.get_providers(content_hash);

    if !best_providers.is_empty() {
        return Ok(LookupResult {
            content_hash: Some(content_hash.to_string()),
            hops: 0,
            duration_ms: started.elapsed().as_millis() as u64,
            success: true,
            peer_count: table.peer_count() as u32,
            providers: best_providers,
        });
    }

    for _round in 0..5 {
        if shortlist.is_empty() {
            break;
        }
        let batch: Vec<_> = shortlist
            .drain(..)
            .filter(|p| queried.insert(p.node_id.clone()))
            .take(ALPHA)
            .collect();
        if batch.is_empty() {
            break;
        }
        for peer in batch {
            hops += 1;
            match rpc_find_value(&client, &peer, local, content_hash).await {
                Ok(res) => {
                    table.upsert(peer);
                    if !res.providers.is_empty() {
                        for p in &res.providers {
                            table.store_provider(content_hash, p.clone());
                            if !best_providers.iter().any(|x| x.node_id == p.node_id) {
                                best_providers.push(p.clone());
                            }
                        }
                    }
                    for c in res.closer {
                        table.upsert(c.clone());
                        if !queried.contains(&c.node_id) {
                            shortlist.push(c);
                        }
                    }
                }
                Err(_) => continue,
            }
        }
        if !best_providers.is_empty() {
            break;
        }
        shortlist = table.closest(content_hash, K_BUCKET);
    }

    Ok(LookupResult {
        content_hash: Some(content_hash.to_string()),
        hops,
        duration_ms: started.elapsed().as_millis() as u64,
        success: !best_providers.is_empty(),
        peer_count: table.peer_count() as u32,
        providers: best_providers,
    })
}

pub async fn bootstrap_from_peers(
    table: &mut RoutingTable,
    socks: &str,
    local: &DhtPeer,
    seeds: Vec<DhtPeer>,
) -> anyhow::Result<usize> {
    let client = build_socks_client(socks).context("socks client")?;
    let mut added = 0usize;
    for seed in seeds {
        table.upsert(seed.clone());
        match rpc_find_node(&client, &seed, local, &local.node_id).await {
            Ok(res) => {
                added += 1;
                for p in res.peers {
                    table.upsert(p);
                }
            }
            Err(_) => continue,
        }
    }
    Ok(added)
}
