use axum::{
    extract::{Path, State, WebSocketUpgrade},
    response::IntoResponse,
    Json, Router,
};
use axum::extract::ws::{Message, WebSocket};
use axum::http::StatusCode;
use axum::routing::{get, post};
use futures_util::{SinkExt, StreamExt};
use desktopapp_allibrary_lib::onion_share::tracker_proto::{AnnouncedFile, NetworkFile, NetworkLobby, PeerLocation, WsClientMessage, WsServerMessage};
use serde::Serialize;
use uuid::Uuid;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{broadcast, Mutex};

const CANONICAL_STORE: &str = "tracker_canonical_names.json";

#[derive(Clone)]
struct TrackerState {
    nodes: Arc<Mutex<HashMap<String, Node>>>,
    lobby_tx: broadcast::Sender<String>,
    canonical_names: Arc<Mutex<HashMap<String, String>>>,
    store_path: PathBuf,
}

async fn load_canonical_store(path: &PathBuf) -> HashMap<String, String> {
    tokio::fs::read_to_string(path)
        .await
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

async fn save_canonical_store(path: &PathBuf, map: &HashMap<String, String>) {
    if let Ok(json) = serde_json::to_string_pretty(map) {
        let _ = tokio::fs::write(path, json).await;
    }
}

fn aggregate_lobby(
    nodes: &HashMap<String, Node>,
    canonical: &HashMap<String, String>,
) -> NetworkLobby {
    let mut by_hash: HashMap<String, NetworkFile> = HashMap::new();

    for (node_id, node) in nodes {
        for file in &node.files {
            let canonical_name = canonical
                .get(&file.content_hash)
                .cloned()
                .unwrap_or_else(|| file.name.clone());

            let entry = by_hash.entry(file.content_hash.clone()).or_insert_with(|| NetworkFile {
                name: canonical_name.clone(),
                size: file.size,
                link: file.link.clone(),
                content_hash: file.content_hash.clone(),
                peer_count: 0,
                peers: Vec::new(),
            });

            entry.peers.push(PeerLocation {
                node_id: node_id.clone(),
                onion: node.onion.clone(),
                file_id: file.file_id,
                link: file.link.clone(),
            });
            entry.peer_count = entry.peers.len();
        }
    }

    NetworkLobby {
        online_nodes: nodes.len(),
        files: by_hash.into_values().collect(),
    }
}

async fn register_canonical_names(state: &TrackerState, files: &[AnnouncedFile]) {
    let mut canonical = state.canonical_names.lock().await;
    let mut changed = false;
    for file in files {
        if !canonical.contains_key(&file.content_hash) {
            canonical.insert(file.content_hash.clone(), file.name.clone());
            changed = true;
        }
    }
    if changed {
        save_canonical_store(&state.store_path, &canonical).await;
    }
}

#[derive(Clone, Debug)]
struct Node {
    last_seen: Instant,
    onion: String,
    files: Vec<AnnouncedFile>,
}

#[derive(Serialize)]
struct SwarmLookupResponse {
    file: Option<NetworkFile>,
}

async fn push_lobby(state: &TrackerState) {
    let mut nodes = state.nodes.lock().await;
    nodes.retain(|_, node| node.last_seen.elapsed() < Duration::from_secs(30));
    let canonical = state.canonical_names.lock().await.clone();
    let lobby = aggregate_lobby(&nodes, &canonical);
    if let Ok(payload) = serde_json::to_string(&WsServerMessage::Lobby { lobby }) {
        let _ = state.lobby_tx.send(payload);
    }
}

async fn lobby(State(state): State<TrackerState>) -> Json<NetworkLobby> {
    let mut nodes = state.nodes.lock().await;
    nodes.retain(|_, node| node.last_seen.elapsed() < Duration::from_secs(30));
    let canonical = state.canonical_names.lock().await.clone();
    Json(aggregate_lobby(&nodes, &canonical))
}

async fn swarm_lookup(
    State(state): State<TrackerState>,
    Path(content_hash): Path<String>,
) -> Json<SwarmLookupResponse> {
    let mut nodes = state.nodes.lock().await;
    nodes.retain(|_, node| node.last_seen.elapsed() < Duration::from_secs(30));
    let canonical = state.canonical_names.lock().await.clone();
    let lobby = aggregate_lobby(&nodes, &canonical);
    let file = lobby.files.into_iter().find(|f| f.content_hash == content_hash);
    Json(SwarmLookupResponse { file })
}

#[derive(Serialize)]
struct DebugNodesResponse {
    count: usize,
    nodes: Vec<DebugNode>,
}

#[derive(Serialize)]
struct DebugNode {
    node_id: String,
    onion: String,
    files: Vec<Uuid>,
}

async fn debug_nodes(State(state): State<TrackerState>) -> Json<DebugNodesResponse> {
    let nodes = state.nodes.lock().await;
    let list = nodes.iter().map(|(id, n)| DebugNode {
        node_id: id.clone(),
        onion: n.onion.clone(),
        files: n.files.iter().map(|f| f.file_id).collect(),
    }).collect();

    Json(DebugNodesResponse {
        count: nodes.len(),
        nodes: list,
    })
}

/// Fallback HTTP Announce handler (mais robusto que WS em redes instáveis/WAN)
async fn announce_http(
    State(state): State<TrackerState>,
    Json(msg): Json<WsClientMessage>,
) -> StatusCode {
    let WsClientMessage::Announce { node_id, onion, files } = msg;
    tracing::info!("HTTP Announce: node_id={}, onion={}, files={}", node_id, onion, files.len());
    let mut nodes = state.nodes.lock().await;
    register_canonical_names(&state, &files).await;
    nodes.insert(node_id, Node {
        last_seen: Instant::now(),
        onion,
        files,
    });
    drop(nodes);
    push_lobby(&state).await;
    StatusCode::OK
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<TrackerState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: TrackerState) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.lobby_tx.subscribe();
    let mut current_node_id: Option<String> = None;

    if let Ok(initial) = serde_json::to_string(&WsServerMessage::Lobby {
        lobby: {
            let mut nodes = state.nodes.lock().await;
            nodes.retain(|_, node| node.last_seen.elapsed() < Duration::from_secs(30));
            let canonical = state.canonical_names.lock().await.clone();
            aggregate_lobby(&nodes, &canonical)
        },
    }) {
        let _ = sender.send(Message::Text(initial.into())).await;
    }

    loop {
        tokio::select! {
            ws_msg = receiver.next() => {
                match ws_msg {
                    Some(Ok(Message::Text(text))) => {
                        match serde_json::from_str::<WsClientMessage>(&text) {
                            Ok(WsClientMessage::Announce { node_id, onion, files }) => {
                                tracing::info!("Announce: node_id={}, onion={}, files={}", node_id, onion, files.len());
                                current_node_id = Some(node_id.clone());
                                register_canonical_names(&state, &files).await;
                                let mut nodes = state.nodes.lock().await;
                                nodes.insert(node_id, Node {
                                    last_seen: Instant::now(),
                                    onion,
                                    files,
                                });
                                drop(nodes);
                                push_lobby(&state).await;
                            }
                            Err(err) => {
                                tracing::warn!("invalid websocket payload: {err}");
                            }
                        }
                    }
                    Some(Ok(Message::Ping(bytes))) => {
                        let _ = sender.send(Message::Pong(bytes)).await;
                    }
                    Some(Ok(Message::Close(_))) | None | Some(Err(_)) => break,
                    _ => {}
                }
            }
            lobby_msg = rx.recv() => {
                match lobby_msg {
                    Ok(text) => {
                        if sender.send(Message::Text(text.into())).await.is_err() {
                            break;
                        }
                    }
                    Err(_) => break,
                }
            }
        }
    }

    if let Some(node_id) = current_node_id {
        let mut nodes = state.nodes.lock().await;
        nodes.remove(&node_id);
        drop(nodes);
        push_lobby(&state).await;
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let (lobby_tx, _) = broadcast::channel(64);
    let store_path = PathBuf::from(
        std::env::var("TRACKER_CANONICAL_PATH").unwrap_or_else(|_| CANONICAL_STORE.to_string()),
    );
    let canonical_names = Arc::new(Mutex::new(load_canonical_store(&store_path).await));

    let state = TrackerState {
        nodes: Arc::new(Mutex::new(HashMap::new())),
        lobby_tx,
        canonical_names,
        store_path,
    };


    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/announce", post(announce_http))
        .route("/lobby", get(lobby))
        .route("/swarm/:content_hash", get(swarm_lookup))
        .route("/debug/nodes", get(debug_nodes))
        .with_state(state.clone());

    let cleanup_state = state.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(5));
        loop {
            interval.tick().await;
            push_lobby(&cleanup_state).await;
        }
    });

    let addr = "0.0.0.0:8080";
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("tracker websocket/http ativo em http://{addr}");
    axum::serve(listener, app).await?;
    Ok(())
}
