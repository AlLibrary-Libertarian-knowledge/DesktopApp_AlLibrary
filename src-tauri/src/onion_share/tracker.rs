//! Tracker WebSocket (Tor SOCKS) + HTTP fallback; lobby cache and Tauri events.

use anyhow::Context;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;

use futures_util::{future::Either, SinkExt, StreamExt};
use once_cell::sync::Lazy;
use tauri::AppHandle;
use tauri::Emitter;
use tokio::sync::RwLock;
use tokio_tungstenite::client_async_with_config;
use tokio_tungstenite::tungstenite::Message;

use super::config::TrackerNetworkConfig;
use super::fetch::build_http_client;
use super::tracker_proto::{AnnouncedFile, NetworkLobby, WsClientMessage, WsServerMessage};

static LAST_LOBBY: Lazy<Arc<RwLock<NetworkLobby>>> =
    Lazy::new(|| Arc::new(RwLock::new(NetworkLobby::default())));

#[derive(Default, Clone)]
pub struct AnnounceState {
    pub onion: Option<String>,
    pub files: Vec<AnnouncedFile>,
}

pub async fn get_cached_lobby() -> NetworkLobby {
    LAST_LOBBY.read().await.clone()
}

pub async fn replace_cached_lobby(lobby: NetworkLobby) {
    *LAST_LOBBY.write().await = lobby;
}

async fn set_lobby(lobby: NetworkLobby, app: &Option<AppHandle>) {
    *LAST_LOBBY.write().await = lobby.clone();
    if let Some(a) = app {
        let _ = a.emit("onion-share-lobby", &lobby);
    }
}

pub fn tracker_ws_url(tracker_url: &str) -> String {
    if tracker_url.starts_with("https://") {
        tracker_url.replacen("https://", "wss://", 1) + "/ws"
    } else {
        tracker_url.replacen("http://", "ws://", 1) + "/ws"
    }
}

/// POST /announce + GET /lobby (HTTP fallback).
pub async fn http_sync_tracker(
    socks: Option<&str>,
    cfg: &TrackerNetworkConfig,
    onion: Option<String>,
    files: Vec<AnnouncedFile>,
) -> anyhow::Result<NetworkLobby> {
    let tracker_url = cfg.tracker_url.trim_end_matches('/');
    if tracker_url.is_empty() {
        return Ok(NetworkLobby::default());
    }
    let client = build_http_client(tracker_url, socks)?;

    if let Some(onion) = onion {
        let announce = WsClientMessage::Announce {
            node_id: cfg.node_id.clone(),
            onion,
            files,
        };
        let _ = client
            .post(format!("{}/announce", tracker_url))
            .json(&announce)
            .send()
            .await;
    }

    let res = client
        .get(format!("{}/lobby", tracker_url))
        .send()
        .await?;
    if res.status().is_success() {
        let lobby: NetworkLobby = res.json().await?;
        return Ok(lobby);
    }
    Ok(NetworkLobby::default())
}

async fn ws_comm_loop<S>(
    mut ws_stream: S,
    app: Option<AppHandle>,
    announce: Arc<RwLock<AnnounceState>>,
) -> anyhow::Result<()>
where
    S: futures_util::SinkExt<Message, Error = tokio_tungstenite::tungstenite::Error>
        + futures_util::StreamExt<Item = Result<Message, tokio_tungstenite::tungstenite::Error>>
        + Unpin,
{
    let mut interval = tokio::time::interval(Duration::from_secs(5));
    loop {
        tokio::select! {
            _ = interval.tick() => {
                let cfg = TrackerNetworkConfig::load();
                let st = announce.read().await;
                let socks = crate::core::p2p::tor_manager::status().socks;
                let tor_ok = socks.is_some();
                if !tor_ok {
                    continue;
                }
                let payload = if let Some(onion) = st.onion.clone() {
                    let files = if cfg.share_publicly {
                        st.files.clone()
                    } else {
                        Vec::new()
                    };
                    Some(WsClientMessage::Announce {
                        node_id: cfg.node_id.clone(),
                        onion,
                        files,
                    })
                } else {
                    None
                };
                drop(st);

                if let Some(msg) = payload {
                    if let Ok(text) = serde_json::to_string(&msg) {
                        let _ = ws_stream.send(Message::Text(text.into())).await;
                    }
                }
            }
            incoming = ws_stream.next() => {
                match incoming {
                    Some(Ok(Message::Text(text))) => {
                        if let Ok(WsServerMessage::Lobby { lobby }) = serde_json::from_str::<WsServerMessage>(&text) {
                            set_lobby(lobby, &app).await;
                        }
                    }
                    Some(Ok(Message::Ping(bytes))) => {
                        let _ = ws_stream.send(Message::Pong(bytes)).await;
                    }
                    Some(Ok(Message::Close(_))) | None | Some(Err(_)) => break,
                    _ => {}
                }
            }
        }
    }
    Ok(())
}

/// Runs until WS disconnects; caller should reconnect in a loop.
pub async fn run_one_ws_session(
    socks_addr: Option<String>,
    app: Option<AppHandle>,
    announce: Arc<RwLock<AnnounceState>>,
) -> anyhow::Result<()> {
    let cfg = TrackerNetworkConfig::load();
    let tracker_url = cfg.tracker_url.trim_end_matches('/').to_string();
    if tracker_url.is_empty() {
        tokio::time::sleep(Duration::from_secs(2)).await;
        return Ok(());
    }

    let ws_url = tracker_ws_url(&tracker_url);
    let ws_conn: anyhow::Result<Either<_, _>> = async {
        if tracker_url.contains(".onion") {
            let socks = socks_addr.context("SOCKS required for .onion tracker")?;
            let socks_socket: SocketAddr = socks.parse()?;
            let url = url::Url::parse(&ws_url)?;
            let host = url.host_str().context("no host")?;
            let port = url.port().unwrap_or(80);
            let stream = tokio_socks::tcp::Socks5Stream::connect(socks_socket, (host, port)).await?;
            let (ws, _resp) = client_async_with_config(ws_url.clone(), stream, None).await?;
            Ok(Either::Left(ws))
        } else {
            let (ws, _resp) = tokio_tungstenite::connect_async(ws_url.clone()).await?;
            Ok(Either::Right(ws))
        }
    }
    .await;

    match ws_conn {
        Ok(Either::Left(ws)) => ws_comm_loop(ws, app, announce).await,
        Ok(Either::Right(ws)) => ws_comm_loop(ws, app, announce).await,
        Err(e) => {
            tracing::warn!("tracker WS connect failed: {}", e);
            Err(e)
        }
    }
}
