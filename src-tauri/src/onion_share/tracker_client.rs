// Derived from onion-poc (MIT): POC-Tracker-Onion-Share/src/gui/bg.rs (tracker paths)
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;

use anyhow::Context;
#[allow(unused_imports)]
use futures_util::SinkExt;
use futures_util::StreamExt;
use futures_util::future::Either;
use tokio_tungstenite::client_async_with_config;
use tokio_tungstenite::tungstenite::Message;
use tracing::{info, warn};

use crate::onion_share::config::AppConfig;
use crate::onion_share::fetch::build_http_client;
use crate::onion_share::server::ShareServerHandle;
use crate::onion_share::tracker_proto::{
    AnnouncedFile, NetworkLobby, WsClientMessage, WsServerMessage,
};

pub fn tracker_ws_url(tracker_url: &str) -> String {
    if tracker_url.starts_with("https://") {
        tracker_url.replacen("https://", "wss://", 1) + "/ws"
    } else {
        tracker_url.replacen("http://", "ws://", 1) + "/ws"
    }
}

pub async fn announced_files(handle: &ShareServerHandle, cfg: &AppConfig) -> Vec<AnnouncedFile> {
    if !cfg.share_publicly {
        return Vec::new();
    }
    let shares = handle.state.shares.lock().await;
    shares
        .values()
        .map(|s| AnnouncedFile {
            file_id: s.file_id,
            name: s.file_name.clone(),
            size: s.file_size,
            link: handle.link_for(s),
            content_hash: s.content_hash.clone(),
        })
        .collect()
}

/// HTTP fallback announce + lobby pull (parity with POC `sync_tracker`).
pub async fn sync_tracker(
    handle: Option<&ShareServerHandle>,
    cached_lobby: Arc<tokio::sync::RwLock<NetworkLobby>>,
) {
    let cfg = AppConfig::load();
    let Some(handle) = handle else {
        return;
    };

    let tracker_url = cfg.tracker_url.trim_end_matches('/').to_string();
    let socks = handle.socks_addr();

    let Ok(client) = build_http_client(&tracker_url, Some(socks.clone())) else {
        return;
    };

    let files_announced = announced_files(handle, &cfg).await;
    let announce_msg = WsClientMessage::Announce {
        node_id: cfg.node_id.clone(),
        onion: handle.onion_addr.clone(),
        files: files_announced,
    };
    let _ = client
        .post(format!("{}/announce", tracker_url))
        .json(&announce_msg)
        .send()
        .await;

    if let Ok(res) = client.get(format!("{}/lobby", tracker_url)).send().await {
        if let Ok(lobby) = res.json::<NetworkLobby>().await {
            let mut w = cached_lobby.write().await;
            *w = lobby;
        }
    }
}

pub async fn run_tracker_ws_loop(
    handle: Arc<tokio::sync::Mutex<Option<ShareServerHandle>>>,
    cached_lobby: Arc<tokio::sync::RwLock<NetworkLobby>>,
    stop: Arc<std::sync::atomic::AtomicBool>,
) {
    loop {
        if stop.load(std::sync::atomic::Ordering::SeqCst) {
            break;
        }

        let cfg = AppConfig::load();
        let tracker_url = cfg.tracker_url.clone();

        let guard = handle.lock().await;
        let Some(ref h) = *guard else {
            drop(guard);
            tokio::time::sleep(Duration::from_secs(2)).await;
            continue;
        };
        let socks_addr_str = h.socks_addr();
        drop(guard);

        let tracker_url_clone = tracker_url.trim_end_matches('/').to_string();
        let ws_url = tracker_ws_url(&tracker_url_clone);

        let ws_conn: anyhow::Result<Either<_, _>> = async {
            if tracker_url_clone.contains(".onion") {
                let socks_socket: SocketAddr = socks_addr_str.parse()?;
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
            Ok(ws_stream) => {
                info!("Connected to tracker WebSocket: {}", ws_url);
                let _ = ws_comm_loop(ws_stream, handle.clone(), cached_lobby.clone(), stop.clone()).await;
            }
            Err(e) => {
                warn!("Tracker WebSocket error ({}): {}", ws_url, e);
                let g = handle.lock().await;
                let h_opt = g.as_ref();
                sync_tracker(h_opt, cached_lobby.clone()).await;
                drop(g);
                tokio::time::sleep(Duration::from_secs(3)).await;
            }
        }
    }
}

async fn ws_comm_loop<S>(
    mut ws_stream: S,
    handle: Arc<tokio::sync::Mutex<Option<ShareServerHandle>>>,
    cached_lobby: Arc<tokio::sync::RwLock<NetworkLobby>>,
    stop: Arc<std::sync::atomic::AtomicBool>,
) -> anyhow::Result<()>
where
    S: futures_util::SinkExt<Message, Error = tokio_tungstenite::tungstenite::Error>
        + StreamExt<Item = Result<Message, tokio_tungstenite::tungstenite::Error>>
        + Unpin,
{
    let mut interval = tokio::time::interval(Duration::from_secs(5));
    loop {
        tokio::select! {
            _ = interval.tick() => {
                if stop.load(std::sync::atomic::Ordering::SeqCst) {
                    break;
                }
                let cfg = AppConfig::load();
                let payload = {
                    let g = handle.lock().await;
                    match g.as_ref() {
                        Some(h) => {
                            let files = announced_files(h, &cfg).await;
                            Some(WsClientMessage::Announce {
                                node_id: cfg.node_id,
                                onion: h.onion_addr.clone(),
                                files,
                            })
                        }
                        None => None,
                    }
                };
                if let Some(msg) = payload {
                    let text = serde_json::to_string(&msg)?;
                    ws_stream.send(Message::Text(text.into())).await?;
                }
            }
            incoming = ws_stream.next() => {
                match incoming {
                    Some(Ok(Message::Text(text))) => {
                        if let Ok(WsServerMessage::Lobby { lobby }) =
                            serde_json::from_str::<WsServerMessage>(&text)
                        {
                            let mut w = cached_lobby.write().await;
                            *w = lobby;
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
