//! Download over Tor via HTTP (direct opoc:// or swarm), POC-compatible.

use std::path::PathBuf;

use anyhow::Context;
use futures_util::future::join_all;
use serde::Deserialize;
use tokio::io::AsyncWriteExt;

use super::crypto::key_from_content_hash;
use super::crypto::{decrypt_chunk, FileKey};
use super::http_routes::Manifest;
use super::link::{parse_any, ParsedLink, ShareLink};
use super::tracker_proto::NetworkFile;

#[derive(Debug, Deserialize)]
struct SwarmLookupResponse {
    file: Option<NetworkFile>,
}

pub(crate) fn build_http_client(base_url: &str, socks_addr: Option<&str>) -> anyhow::Result<reqwest::Client> {
    let mut builder = reqwest::Client::builder();
    if base_url.contains(".onion") {
        if let Some(socks) = socks_addr {
            builder = builder.proxy(reqwest::Proxy::all(format!("socks5h://{}", socks))?);
        }
    }
    Ok(builder.build()?)
}

async fn download_direct(
    link: &ShareLink,
    out_dir: PathBuf,
    socks: Option<&str>,
) -> anyhow::Result<PathBuf> {
    let client = build_http_client(&format!("http://{}", link.onion), socks)?;
    let base = format!("http://{}/s/{}", link.onion, link.file_id);
    let manifest: Manifest = client
        .get(format!("{}/manifest", base))
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    tokio::fs::create_dir_all(&out_dir).await.ok();
    let out_path = out_dir.join(&manifest.file_name);
    let mut out_file = tokio::fs::File::create(&out_path).await?;

    for idx in 0..manifest.total_chunks {
        let ct = client
            .get(format!("{}/chunk/{}", base, idx))
            .send()
            .await?
            .error_for_status()?
            .bytes()
            .await?;
        let pt = decrypt_chunk(&link.key, link.file_id, idx, &ct)?;
        out_file.write_all(&pt).await?;
    }
    out_file.flush().await?;
    Ok(out_path)
}

async fn download_swarm(
    swarm: &super::link::SwarmLink,
    out_dir: PathBuf,
    socks: Option<&str>,
) -> anyhow::Result<PathBuf> {
    let tracker_client = build_http_client(swarm.tracker_url.trim_end_matches('/'), socks)?;
    let lookup: SwarmLookupResponse = tracker_client
        .get(format!(
            "{}/swarm/{}",
            swarm.tracker_url.trim_end_matches('/'),
            swarm.content_hash
        ))
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    let network_file = lookup
        .file
        .context("file not found in tracker swarm")?;
    anyhow::ensure!(
        !network_file.peers.is_empty(),
        "no peers available for this hash"
    );

    let key: FileKey = key_from_content_hash(&network_file.content_hash)?;
    let first = &network_file.peers[0];
    let peer_client = build_http_client(&format!("http://{}", first.onion), socks)?;
    let base = format!("http://{}/s/{}", first.onion, first.file_id);
    let manifest: Manifest = peer_client
        .get(format!("{}/manifest", base))
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    tokio::fs::create_dir_all(&out_dir).await.ok();
    let out_path = out_dir.join(&manifest.file_name);

    let concurrency = network_file.peers.len().clamp(2, 8);
    let sem = std::sync::Arc::new(tokio::sync::Semaphore::new(concurrency));
    let mut handles = Vec::new();
    for idx in 0..manifest.total_chunks {
        let permit = sem.clone().acquire_owned().await?;
        let peers = network_file.peers.clone();
        let socks_owned = socks.map(|s| s.to_string());
        let key = key;
        handles.push(tokio::spawn(async move {
            let _permit = permit;
            for offset in 0..peers.len() {
                let peer = &peers[(idx as usize + offset) % peers.len()];
                let base = format!("http://{}/s/{}", peer.onion, peer.file_id);
                let client = match build_http_client(
                    &format!("http://{}", peer.onion),
                    socks_owned.as_deref(),
                ) {
                    Ok(c) => c,
                    Err(_) => continue,
                };
                let fetched = client
                    .get(format!("{}/chunk/{}", base, idx))
                    .send()
                    .await;
                if let Ok(resp) = fetched {
                    if let Ok(ok_resp) = resp.error_for_status() {
                        if let Ok(bytes) = ok_resp.bytes().await {
                            if let Ok(pt) = decrypt_chunk(&key, peer.file_id, idx, &bytes) {
                                return Ok::<(u64, Vec<u8>), anyhow::Error>((idx, pt));
                            }
                        }
                    }
                }
            }
            anyhow::bail!("could not download chunk {} from any peer", idx)
        }));
    }

    let results = join_all(handles).await;
    let mut chunks: Vec<Option<Vec<u8>>> = vec![None; manifest.total_chunks as usize];
    for res in results {
        let (idx, pt) = res.map_err(|e| anyhow::anyhow!("join: {}", e))??;
        chunks[idx as usize] = Some(pt);
    }

    let mut out_file = tokio::fs::File::create(&out_path).await?;
    for chunk in chunks.into_iter() {
        let chunk = chunk.context("missing chunk in swarm download")?;
        out_file.write_all(&chunk).await?;
    }
    out_file.flush().await?;
    Ok(out_path)
}

pub async fn fetch_to_dir(
    link_str: &str,
    out_dir: PathBuf,
    socks_addr: Option<String>,
) -> anyhow::Result<PathBuf> {
    let socks = socks_addr.as_deref();
    match parse_any(link_str)? {
        ParsedLink::Direct(link) => download_direct(&link, out_dir, socks).await,
        ParsedLink::Swarm(swarm) => download_swarm(&swarm, out_dir, socks).await,
    }
}
