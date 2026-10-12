//! Epidemic metadata gossip for Cap. 6 propagation measurements.

use std::collections::HashSet;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::dht::{build_socks_client, DhtPeer};

pub const DEFAULT_FANOUT: usize = 3;
pub const MAX_HOP: u32 = 6;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GossipMessage {
    pub msg_id: String,
    pub content_hash: String,
    pub size: u64,
    pub ts_origin_ms: u64,
    pub hop: u32,
    pub from: DhtPeer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GossipEventMetric {
    pub msg_id: String,
    pub content_hash: String,
    pub hop: u32,
    pub propagation_ms: u64,
}

#[derive(Clone, Default)]
pub struct GossipState {
    seen: HashSet<String>,
}

impl GossipState {
    pub fn new() -> Self {
        Self {
            seen: HashSet::new(),
        }
    }

    pub fn seen(&self, msg_id: &str) -> bool {
        self.seen.contains(msg_id)
    }

    pub fn mark(&mut self, msg_id: &str) {
        self.seen.insert(msg_id.to_string());
        if self.seen.len() > 10_000 {
            self.seen.clear();
        }
    }
}

pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

pub fn new_announce(local: &DhtPeer, content_hash: &str, size: u64) -> GossipMessage {
    GossipMessage {
        msg_id: Uuid::new_v4().to_string(),
        content_hash: content_hash.to_string(),
        size,
        ts_origin_ms: now_ms(),
        hop: 0,
        from: local.clone(),
    }
}

pub async fn fanout_send(
    socks: &str,
    peers: &[DhtPeer],
    msg: &GossipMessage,
    fanout: usize,
) -> anyhow::Result<usize> {
    let client = build_socks_client(socks)?;
    let mut sent = 0usize;
    for peer in peers.iter().take(fanout.max(1)) {
        let url = format!("http://{}/gossip/recv", peer.onion.trim_end_matches('/'));
        if client.post(&url).json(msg).send().await.is_ok() {
            sent += 1;
        }
    }
    Ok(sent)
}

/// Handle inbound gossip: returns metric if first sight, plus whether to rebroadcast.
pub fn on_receive(
    state: &mut GossipState,
    msg: &GossipMessage,
) -> Option<(GossipEventMetric, Option<GossipMessage>)> {
    if state.seen(&msg.msg_id) {
        return None;
    }
    state.mark(&msg.msg_id);
    let propagation_ms = now_ms().saturating_sub(msg.ts_origin_ms);
    let metric = GossipEventMetric {
        msg_id: msg.msg_id.clone(),
        content_hash: msg.content_hash.clone(),
        hop: msg.hop,
        propagation_ms,
    };
    let forward = if msg.hop + 1 < MAX_HOP {
        let mut next = msg.clone();
        next.hop += 1;
        Some(next)
    } else {
        None
    };
    Some((metric, forward))
}
