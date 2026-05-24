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
use tracing::{info, warn, error};

use crate::onion_share::config::{normalize_tracker_url, AppConfig};
use crate::onion_share::fetch::build_http_client;
use crate::onion_share::server::ShareServerHandle;
use crate::onion_share::tracker_proto::{
    lobby_fingerprint, AnnouncedFile, NetworkLobby, WsClientMessage, WsServerMessage,
};

pub fn tracker_ws_url(tracker_url: &str) -> String {
    let u = tracker_url.trim_end_matches('/');
    if u.starts_with("https://") {
        u.replacen("https://", "wss://", 1).to_owned() + "/ws"
    } else {
        u.replacen("http://", "ws://", 1).to_owned() + "/ws"
    }
}

const LOCAL_TRACKER_HTTP: &str = "http://127.0.0.1:8080";

pub fn local_tracker_http_url() -> &'static str {
    LOCAL_TRACKER_HTTP
}

pub fn local_tracker_ws_url() -> String {
    tracker_ws_url(LOCAL_TRACKER_HTTP)
}

async fn fetch_lobby_http(
    tracker_url: &str,
    socks_addr: Option<&str>,
) -> Result<NetworkLobby, String> {
    let client = build_http_client(
        tracker_url,
        socks_addr.map(|s| s.to_string()),
    )
    .map_err(|e| e.to_string())?;
    let lobby_url = format!("{}/lobby", tracker_url.trim_end_matches('/'));
    let lobby = client
        .get(&lobby_url)
        .send()
        .await
        .map_err(|e| format!("GET lobby failed: {e}"))?;
    let lobby = lobby.error_for_status().map_err(|e| {
        e.status()
            .map(|s| format!("Lobby HTTP {s}"))
            .unwrap_or_else(|| format!("Lobby: {e}"))
    })?;
    lobby
        .json::<NetworkLobby>()
        .await
        .map_err(|e| format!("Lobby JSON: {e}"))
}

/// Pull lobby over plain HTTP (no announce). Used when Tor/onion is unavailable.
pub async fn sync_lobby_http_only(
    tracker_url: &str,
    cached_lobby: Arc<tokio::sync::RwLock<NetworkLobby>>,
) -> Result<(), String> {
    let lobby = fetch_lobby_http(tracker_url, None).await?;
    let mut w = cached_lobby.write().await;
    *w = lobby;
    Ok(())
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

#[derive(Debug, Clone, serde::Serialize)]
pub struct TrackerSyncOutcome {
    pub url_used: String,
    pub used_localhost_fallback: bool,
}

/// HTTP announce + lobby pull — logs failures; use `sync_tracker_result` when you must surface errors.
pub async fn sync_tracker(
    handle: Option<&ShareServerHandle>,
    cached_lobby: Arc<tokio::sync::RwLock<NetworkLobby>>,
) {
    if let Err(e) = sync_tracker_result(handle, cached_lobby).await {
        warn!("{}", e);
    }
}

async fn announce_and_refresh_lobby(
    tracker_url: &str,
    handle: &ShareServerHandle,
    cfg: &AppConfig,
    cached_lobby: Arc<tokio::sync::RwLock<NetworkLobby>>,
) -> Result<(), String> {
    let tracker_url = tracker_url.trim_end_matches('/');
    if tracker_url.is_empty() {
        return Err("empty tracker URL".into());
    }

    let socks = if tracker_url.contains(".onion") {
        Some(handle.socks_addr())
    } else {
        None
    };
    let client = build_http_client(tracker_url, socks.clone()).map_err(|e| {
        socks
            .as_ref()
            .map(|s| format!("HTTP client (+ SOCKS {}): {}", s, e))
            .unwrap_or_else(|| format!("HTTP client: {e}"))
    })?;

    let files_announced = announced_files(handle, cfg).await;
    let announce_msg = WsClientMessage::Announce {
        node_id: cfg.node_id.clone(),
        onion: handle.onion_addr.clone(),
        files: files_announced,
    };

    let announce_url = format!("{}/announce", tracker_url);
    let lobby_url = format!("{}/lobby", tracker_url);

    let mut announce_ok = false;
    let mut last_err = String::new();

    for attempt in 0..5u32 {
        if attempt > 0 {
            let delay_secs = 2_u64.saturating_mul(attempt as u64);
            let delay = Duration::from_secs(delay_secs.min(15).max(2));
            warn!(
                "Tracker announce retry {}/5 toward {} ({:?})",
                attempt + 1,
                announce_url,
                delay
            );
            tokio::time::sleep(delay).await;
        }

        match client.post(&announce_url).json(&announce_msg).send().await {
            Ok(resp) => {
                let status = resp.status();
                if status.is_success() {
                    info!(
                        "Tracker announce OK ← POST {} (node_id={}, onion={})",
                        announce_url, cfg.node_id, handle.onion_addr
                    );
                    announce_ok = true;
                    break;
                }
                let body = resp.text().await.unwrap_or_default();
                last_err = format!("HTTP {}", status.as_str());
                if !body.trim().is_empty() {
                    last_err.push_str(": ");
                    let chunk: String = body.chars().take(240).collect();
                    last_err.push_str(&chunk);
                }
                warn!("announce {}", last_err);
            }
            Err(e) => {
                last_err = e.to_string();
                warn!("announce transport: {}", last_err);
            }
        }
    }

    if !announce_ok {
        return Err(format!("POST {announce_url} failed after retries: {last_err}"));
    }

    let lobby = client
        .get(&lobby_url)
        .send()
        .await
        .map_err(|e| format!("GET lobby failed: {e}"))?;
    let lobby = lobby.error_for_status().map_err(|e| {
        e.status()
            .map(|s| format!("Lobby HTTP {s}"))
            .unwrap_or_else(|| format!("Lobby: {e}"))
    })?;

    match lobby.json::<NetworkLobby>().await {
        Ok(lobby) => {
            let mut w = cached_lobby.write().await;
            *w = lobby;
            Ok(())
        }
        Err(e) => Err(format!("Lobby JSON: {e}")),
    }
}

async fn sync_localhost_lobby_only(
    cached_lobby: Arc<tokio::sync::RwLock<NetworkLobby>>,
) -> Result<TrackerSyncOutcome, String> {
    sync_lobby_http_only(LOCAL_TRACKER_HTTP, cached_lobby).await?;
    info!(
        "Tracker lobby synced via localhost fallback ({}) without onion announce",
        LOCAL_TRACKER_HTTP
    );
    Ok(TrackerSyncOutcome {
        url_used: LOCAL_TRACKER_HTTP.to_string(),
        used_localhost_fallback: true,
    })
}

pub async fn sync_tracker_result(
    handle: Option<&ShareServerHandle>,
    cached_lobby: Arc<tokio::sync::RwLock<NetworkLobby>>,
) -> Result<TrackerSyncOutcome, String> {
    let cfg = AppConfig::load();
    let Some(handle) = handle else {
        if cfg.try_local_tracker_fallback {
            return sync_localhost_lobby_only(cached_lobby).await;
        }
        return Err("No onion share active — start Tor/onion sharing first.".into());
    };

    let primary = normalize_tracker_url(&cfg.tracker_url);
    if primary.is_empty() {
        return Err(
            "tracker_url is empty. Set it under Configurations → Connection manager.".into(),
        );
    }
    if cfg.tracker_url.trim() != primary.as_str()
        && cfg.tracker_url.contains(".onion")
        && primary.contains(".onion")
    {
        info!(
            "Using normalized tracker URL: {} (saved was {})",
            primary,
            cfg.tracker_url.trim()
        );
    }

    let mut candidates: Vec<(String, bool)> = vec![(primary.clone(), false)];
    let local_fb = normalize_tracker_url("http://127.0.0.1:8080");
    if cfg.try_local_tracker_fallback && primary.contains(".onion") && local_fb != primary {
        candidates.push((local_fb, true));
        info!(
            "Local Docker fallback queued: try {} if Tor cannot reach {}",
            "http://127.0.0.1:8080", primary
        );
    }

    let mut last_err = String::new();
    for (base, is_fb) in candidates {
        match announce_and_refresh_lobby(&base, handle, &cfg, cached_lobby.clone()).await {
            Ok(()) => {
                info!("Tracker announce/refresh OK for {}", base);
                if is_fb {
                    warn!(
                        "Announce succeeded via LOCALHOST {}; Tor path to .onion may still be broken.",
                        base
                    );
                }
                return Ok(TrackerSyncOutcome {
                    url_used: base,
                    used_localhost_fallback: is_fb,
                });
            }
            Err(e) => {
                warn!("Tracker candidate {} failed: {}", base, e);
                last_err = e;
            }
        }
    }

    error!("All tracker targets failed. Last error: {}", last_err);

    Err(format!(
        "All tracker targets failed. Last error: {}. Hint: for Docker Desktop on this PC the tracker listens on mapped port 8080 — fallback can use http://127.0.0.1:8080.",
        last_err
    ))
}

pub type LobbyUpdatedCallback = Arc<dyn Fn() + Send + Sync>;

pub async fn run_tracker_ws_loop(
    handle: Arc<tokio::sync::Mutex<Option<ShareServerHandle>>>,
    cached_lobby: Arc<tokio::sync::RwLock<NetworkLobby>>,
    stop: Arc<std::sync::atomic::AtomicBool>,
    on_lobby_updated: Option<LobbyUpdatedCallback>,
) {
    loop {
        if stop.load(std::sync::atomic::Ordering::SeqCst) {
            break;
        }

        let cfg = AppConfig::load();
        let (ws_url, use_socks, socks_addr_str) = {
            let guard = handle.lock().await;
            if let Some(ref h) = *guard {
                let tracker_url =
                    normalize_tracker_url(&cfg.tracker_url).trim_end_matches('/').to_string();
                if tracker_url.is_empty() {
                    drop(guard);
                    warn!("tracker_url empty; skipping tracker WS until configured");
                    tokio::time::sleep(Duration::from_secs(5)).await;
                    continue;
                }
                (
                    tracker_ws_url(&tracker_url),
                    tracker_url.contains(".onion"),
                    h.socks_addr(),
                )
            } else if cfg.try_local_tracker_fallback {
                (
                    local_tracker_ws_url(),
                    false,
                    String::new(),
                )
            } else {
                drop(guard);
                tokio::time::sleep(Duration::from_secs(2)).await;
                continue;
            }
        };

        let ws_conn: anyhow::Result<Either<_, _>> = async {
            if use_socks {
                let socks_socket: SocketAddr = socks_addr_str.parse()?;
                let url = url::Url::parse(&ws_url)?;
                let host = url.host_str().context("no host")?;
                let port = url.port().unwrap_or(80);
                let stream =
                    tokio_socks::tcp::Socks5Stream::connect(socks_socket, (host, port)).await?;
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
                let _ = ws_comm_loop(
                    ws_stream,
                    handle.clone(),
                    cached_lobby.clone(),
                    stop.clone(),
                    on_lobby_updated.clone(),
                )
                .await;
            }
            Err(e) => {
                warn!("Tracker WebSocket error ({}): {}", ws_url, e);
                let g = handle.lock().await;
                if g.is_some() {
                    sync_tracker(g.as_ref(), cached_lobby.clone()).await;
                } else if cfg.try_local_tracker_fallback {
                    let _ =
                        sync_lobby_http_only(LOCAL_TRACKER_HTTP, cached_lobby.clone()).await;
                }
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
    on_lobby_updated: Option<LobbyUpdatedCallback>,
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
                                node_id: cfg.node_id.clone(),
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
                            drop(w);
                            if let Some(cb) = &on_lobby_updated {
                                cb();
                            }
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
