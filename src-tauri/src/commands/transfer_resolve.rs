//! Resolve download links (swarm-first) and peer availability for the transfer UI.

use serde::Serialize;
use tauri::AppHandle;

use crate::core::database::network_cache::search_network_cached_pool;
use crate::core::database::node_db::ensure_node_database;
use crate::onion_share::config::{normalize_tracker_url, AppConfig};
use crate::onion_share::link::{build_swarm_link_string, parse_any, ParsedLink};
use crate::onion_share::tracker_proto::{NetworkFile, PeerLocation};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PeerLocationDto {
    pub node_id: String,
    pub onion: String,
    pub file_id: String,
    pub link: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedDownloadLink {
    pub link: String,
    pub link_kind: String,
    pub content_hash: String,
    pub peer_count: u32,
    pub available: bool,
    pub peers: Vec<PeerLocationDto>,
}

fn tracker_url_from_config() -> String {
    normalize_tracker_url(&AppConfig::load().tracker_url)
}

fn is_likely_content_hash(value: &str) -> bool {
    let v = value.trim();
    v.len() >= 32 && v.chars().all(|c| c.is_ascii_hexdigit())
}

fn map_peer(p: &PeerLocation) -> PeerLocationDto {
    PeerLocationDto {
        node_id: p.node_id.clone(),
        onion: p.onion.clone(),
        file_id: p.file_id.to_string(),
        link: p.link.clone(),
    }
}

fn best_direct_link(file: &NetworkFile) -> String {
    file.peers
        .first()
        .map(|p| p.link.clone())
        .filter(|l| !l.is_empty())
        .unwrap_or_else(|| file.link.clone())
}

async fn find_network_file(app: &AppHandle, input: &str) -> Result<Option<NetworkFile>, String> {
    let pool = ensure_node_database(app).await?;
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }

    let rows = search_network_cached_pool(&pool, trimmed, 50).await?;
    if let Some(exact) = rows
        .iter()
        .find(|f| f.content_hash.eq_ignore_ascii_case(trimmed))
    {
        return Ok(Some(exact.clone()));
    }
    if let Some(by_link) = rows.iter().find(|f| f.link == trimmed) {
        return Ok(Some(by_link.clone()));
    }
    if let Some(by_peer) = rows.iter().find(|f| f.peers.iter().any(|p| p.link == trimmed)) {
        return Ok(Some(by_peer.clone()));
    }
    if rows.len() == 1 {
        return Ok(Some(rows[0].clone()));
    }
    Ok(None)
}

fn resolve_from_file(file: &NetworkFile, prefer_swarm: bool, tracker_url: &str) -> ResolvedDownloadLink {
    let peer_count = if file.peer_count > 0 {
        file.peer_count
    } else {
        file.peers.len()
    } as u32;
    let available = peer_count > 0;
    let peers: Vec<PeerLocationDto> = file.peers.iter().map(map_peer).collect();

    let swarm_link = file
        .swarm_link
        .clone()
        .unwrap_or_else(|| build_swarm_link_string(tracker_url, &file.content_hash));

    if prefer_swarm && available {
        return ResolvedDownloadLink {
            link: swarm_link,
            link_kind: "swarm".into(),
            content_hash: file.content_hash.clone(),
            peer_count,
            available,
            peers,
        };
    }

    let direct = best_direct_link(file);
    ResolvedDownloadLink {
        link: direct,
        link_kind: "direct".into(),
        content_hash: file.content_hash.clone(),
        peer_count,
        available,
        peers,
    }
}

#[tauri::command]
pub async fn build_swarm_link(
    content_hash: String,
    tracker_url: Option<String>,
) -> Result<String, String> {
    let hash = content_hash.trim();
    if hash.is_empty() {
        return Err("content_hash is required".into());
    }
    let tracker = tracker_url
        .map(|u| normalize_tracker_url(&u))
        .unwrap_or_else(tracker_url_from_config);
    Ok(build_swarm_link_string(&tracker, hash))
}

#[tauri::command]
pub async fn resolve_download_link(
    app: AppHandle,
    input: String,
    prefer_swarm: Option<bool>,
) -> Result<ResolvedDownloadLink, String> {
    let prefer_swarm = prefer_swarm.unwrap_or(true);
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Download input is empty".into());
    }

    let tracker_url = tracker_url_from_config();

    if trimmed.starts_with("opocswarm://") {
        if let Ok(ParsedLink::Swarm(swarm)) = parse_any(trimmed) {
            return Ok(ResolvedDownloadLink {
                link: trimmed.to_string(),
                link_kind: "swarm".into(),
                content_hash: swarm.content_hash,
                peer_count: 0,
                available: true,
                peers: vec![],
            });
        }
    }

    if trimmed.starts_with("opoc://") {
        let content_hash = find_network_file(&app, trimmed)
            .await?
            .map(|f| f.content_hash)
            .unwrap_or_default();
        return Ok(ResolvedDownloadLink {
            link: trimmed.to_string(),
            link_kind: "direct".into(),
            content_hash,
            peer_count: 0,
            available: true,
            peers: vec![],
        });
    }

    let file = find_network_file(&app, trimmed).await?;
    let Some(file) = file else {
        if is_likely_content_hash(trimmed) && prefer_swarm {
            return Ok(ResolvedDownloadLink {
                link: build_swarm_link_string(&tracker_url, trimmed),
                link_kind: "swarm".into(),
                content_hash: trimmed.to_string(),
                peer_count: 0,
                available: false,
                peers: vec![],
            });
        }
        return Err(format!("No network file found for: {trimmed}"));
    };

    Ok(resolve_from_file(&file, prefer_swarm, &tracker_url))
}

#[tauri::command]
pub async fn get_swarm_availability(
    app: AppHandle,
    content_hash: String,
) -> Result<ResolvedDownloadLink, String> {
    resolve_download_link(app, content_hash, Some(true)).await
}

pub fn enrich_file_swarm_link(file: &mut NetworkFile, tracker_url: &str) {
    file.swarm_link = Some(build_swarm_link_string(tracker_url, &file.content_hash));
}

pub fn enrich_files_swarm_links(files: &mut [NetworkFile], tracker_url: &str) {
    for file in files.iter_mut() {
        enrich_file_swarm_link(file, tracker_url);
    }
}
