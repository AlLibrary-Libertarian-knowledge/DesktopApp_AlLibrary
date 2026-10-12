// Derived from onion-poc (MIT): POC-Tracker-Onion-Share/src/server/routes.rs
use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use bytes::Bytes;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::onion_share::dht::{
    FindNodeReq, FindNodeRes, FindValueReq, FindValueRes, StoreReq, K_BUCKET,
};
use crate::onion_share::dht::DhtPeer;
use crate::onion_share::gossip::{on_receive, GossipMessage};

use super::state::AppState;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/s/:id/manifest", get(manifest))
        .route("/s/:id/chunk/:idx", get(chunk))
        .route("/s/:id/register", post(register))
        .route("/s/:id/ping", post(ping))
        .route("/s/:id/presence", get(presence))
        .route("/files", get(list_files))
        .route("/dht/find_node", post(dht_find_node))
        .route("/dht/find_value", post(dht_find_value))
        .route("/dht/store", post(dht_store))
        .route("/gossip/recv", post(gossip_recv))
        .with_state(state)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manifest {
    pub file_id: Uuid,
    pub file_name: String,
    pub file_size: u64,
    pub chunk_size: usize,
    pub total_chunks: u64,
    pub cipher: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub file_id: Uuid,
    pub file_name: String,
    pub file_size: u64,
    pub total_chunks: u64,
    pub cipher: String,
    pub content_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterResponse {
    pub session_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PingRequest {
    pub session_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresenceResponse {
    pub online: usize,
}

async fn list_files(State(state): State<AppState>) -> Json<Vec<FileEntry>> {
    let shares = state.shares.lock().await;
    let entries = shares
        .values()
        .map(|s| FileEntry {
            file_id: s.file_id,
            file_name: s.file_name.clone(),
            file_size: s.file_size,
            total_chunks: s.total_chunks,
            cipher: "XChaCha20-Poly1305".into(),
            content_hash: s.content_hash.clone(),
        })
        .collect();
    Json(entries)
}

async fn manifest(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Manifest>, StatusCode> {
    let share = {
        let shares = state.shares.lock().await;
        shares.get(&id).cloned().ok_or(StatusCode::NOT_FOUND)?
    };
    Ok(Json(Manifest {
        file_id: share.file_id,
        file_name: share.file_name.clone(),
        file_size: share.file_size,
        chunk_size: share.chunk_size,
        total_chunks: share.total_chunks,
        cipher: "XChaCha20-Poly1305".into(),
    }))
}

async fn chunk(
    State(state): State<AppState>,
    Path((id, idx)): Path<(Uuid, u64)>,
) -> Result<Response, StatusCode> {
    let share = {
        let shares = state.shares.lock().await;
        shares.get(&id).cloned().ok_or(StatusCode::NOT_FOUND)?
    };
    if idx >= share.total_chunks {
        return Err(StatusCode::NOT_FOUND);
    }
    let ct = share
        .chunk_cipher(idx)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let bytes_len = ct.len() as u64;
    tokio::spawn(async move {
        state.record_bytes(bytes_len).await;
    });

    let mut headers = HeaderMap::new();
    headers.insert(
        "Content-Type",
        "application/octet-stream".parse().unwrap(),
    );
    Ok((headers, Bytes::from(ct)).into_response())
}

async fn register(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<RegisterResponse>, StatusCode> {
    {
        let shares = state.shares.lock().await;
        if !shares.contains_key(&id) {
            return Err(StatusCode::NOT_FOUND);
        }
    }
    let session_id = state.register().await;
    Ok(Json(RegisterResponse { session_id }))
}

async fn ping(
    State(state): State<AppState>,
    Path(_id): Path<Uuid>,
    Json(req): Json<PingRequest>,
) -> StatusCode {
    state.ping(req.session_id).await;
    StatusCode::NO_CONTENT
}

async fn presence(
    State(state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Json<PresenceResponse> {
    let online = state.online_count().await;
    Json(PresenceResponse { online })
}

async fn dht_find_node(
    State(state): State<AppState>,
    Json(req): Json<FindNodeReq>,
) -> Json<FindNodeRes> {
    let mut table = state.dht.lock().await;
    table.upsert(req.from);
    let peers = table.closest(&req.target_id, K_BUCKET);
    Json(FindNodeRes { peers })
}

async fn dht_find_value(
    State(state): State<AppState>,
    Json(req): Json<FindValueReq>,
) -> Json<FindValueRes> {
    let mut table = state.dht.lock().await;
    table.upsert(req.from);
    let providers = table.get_providers(&req.content_hash);
    let closer = table.closest(&req.content_hash, K_BUCKET);
    // Local shares also act as providers
    let mut providers = providers;
    if let Some(local) = state.local_peer.lock().await.clone() {
        let shares = state.shares.lock().await;
        if shares.values().any(|s| s.content_hash == req.content_hash) {
            if !providers.iter().any(|p| p.node_id == local.node_id) {
                providers.push(local);
            }
        }
    }
    Json(FindValueRes { providers, closer })
}

async fn dht_store(State(state): State<AppState>, Json(req): Json<StoreReq>) -> StatusCode {
    let mut table = state.dht.lock().await;
    table.upsert(req.from);
    table.store_provider(&req.content_hash, req.provider);
    StatusCode::NO_CONTENT
}

async fn gossip_recv(State(state): State<AppState>, Json(msg): Json<GossipMessage>) -> StatusCode {
    let outcome = {
        let mut g = state.gossip.lock().await;
        on_receive(&mut g, &msg)
    };
    let Some((_metric, _forward)) = outcome else {
        return StatusCode::NO_CONTENT;
    };
    // Treat gossip as provider advertisement for FIND_VALUE
    let provider = DhtPeer {
        node_id: msg.from.node_id.clone(),
        onion: msg.from.onion.clone(),
    };
    state
        .dht
        .lock()
        .await
        .store_provider(&msg.content_hash, provider);
    StatusCode::NO_CONTENT
}
