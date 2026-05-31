// Derived from onion-poc (MIT): download logic from POC-Tracker-Onion-Share/src/gui/bg.rs
use std::path::PathBuf;
use std::sync::Arc;

use anyhow::Context;
use serde::Deserialize;

use crate::onion_share::crypto;
use crate::onion_share::link::parse_any;
use crate::onion_share::link::ParsedLink;
use crate::onion_share::server::routes;
use crate::onion_share::tracker_proto::NetworkFile;

pub type FetchProgressCb = Arc<dyn Fn(u32, u32, u64) + Send + Sync>;

pub fn build_http_client(base_url: &str, socks_addr: Option<String>) -> anyhow::Result<reqwest::Client> {
    let mut builder = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(90))
        .timeout(std::time::Duration::from_secs(180))
        .user_agent("AlLibrary-onion-share/0.1");
    if base_url.contains(".onion") {
        if let Some(socks) = socks_addr {
            builder = builder.proxy(reqwest::Proxy::all(format!("socks5h://{}", socks))?);
        }
    }
    Ok(builder.build()?)
}

fn report_progress(cb: &Option<FetchProgressCb>, completed: u32, total: u32, bytes: u64) {
    if let Some(ref p) = cb {
        p(completed, total, bytes);
    }
}

/// Download direct or swarm link; returns path to saved file.
pub async fn fetch_to_directory(
    link_str: &str,
    socks_addr: Option<String>,
    out_dir: PathBuf,
    progress_cb: Option<FetchProgressCb>,
) -> anyhow::Result<PathBuf> {
    let parsed = parse_any(link_str)?;
    tokio::fs::create_dir_all(&out_dir).await.ok();

    match parsed {
        ParsedLink::Direct(link) => {
            let socks = socks_addr.context("socks required for .onion direct fetch")?;
            let client =
                build_http_client(&format!("http://{}", link.onion), Some(socks.clone()))?;
            let base = format!("http://{}/s/{}", link.onion, link.file_id);

            let manifest: routes::Manifest = client
                .get(format!("{}/manifest", base))
                .send()
                .await?
                .error_for_status()?
                .json()
                .await?;

            let total = manifest.total_chunks.max(1) as u32;
            let out_path = out_dir.join(&manifest.file_name);
            let mut out_file = tokio::fs::File::create(&out_path).await?;
            let mut bytes_moved = 0u64;

            for idx in 0..manifest.total_chunks {
                let ct = client
                    .get(format!("{}/chunk/{}", base, idx))
                    .send()
                    .await?
                    .error_for_status()?
                    .bytes()
                    .await?;

                let pt = crypto::decrypt_chunk(&link.key, link.file_id, idx, &ct)?;
                bytes_moved += pt.len() as u64;
                tokio::io::AsyncWriteExt::write_all(&mut out_file, &pt).await?;
                report_progress(&progress_cb, (idx + 1) as u32, total, bytes_moved);
            }
            tokio::io::AsyncWriteExt::flush(&mut out_file).await?;
            Ok(out_path)
        }
        ParsedLink::Swarm(swarm) => {
            let socks = socks_addr.context("socks required for swarm fetch")?;
            #[derive(Deserialize)]
            struct SwarmLookupResponse {
                file: Option<NetworkFile>,
            }

            let tracker_client =
                build_http_client(&swarm.tracker_url, Some(socks.clone()))?;
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
            if network_file.peers.is_empty() {
                anyhow::bail!("no peers for this hash");
            }

            let peer_client =
                build_http_client(&format!("http://{}", network_file.peers[0].onion), Some(socks.clone()))?;

            let first_peer = network_file.peers[0].clone();
            let base = format!(
                "http://{}/s/{}",
                first_peer.onion, first_peer.file_id
            );
            let manifest: routes::Manifest = peer_client
                .get(format!("{}/manifest", base))
                .send()
                .await?
                .error_for_status()?
                .json()
                .await?;

            let total = manifest.total_chunks.max(1) as u32;
            let file_key = crypto::key_from_content_hash(&network_file.content_hash)?;
            let out_path = out_dir.join(&manifest.file_name);

            let mut join_set = tokio::task::JoinSet::new();
            let concurrency = network_file.peers.len().clamp(2, 8);
            let sem = std::sync::Arc::new(tokio::sync::Semaphore::new(concurrency));

            for idx in 0..manifest.total_chunks {
                let permit = sem.clone().acquire_owned().await?;
                let peers = network_file.peers.clone();
                let client_inner =
                    build_http_client(&format!("http://{}", peers[0].onion), Some(socks.clone()))?;
                join_set.spawn(async move {
                    let _permit = permit;
                    for offset in 0..peers.len() {
                        let peer = &peers[(idx as usize + offset) % peers.len()];
                        let pb = format!("http://{}/s/{}", peer.onion, peer.file_id);
                        if let Ok(resp) = client_inner
                            .get(format!("{}/chunk/{}", pb, idx))
                            .send()
                            .await
                        {
                            if let Ok(ok_resp) = resp.error_for_status() {
                                if let Ok(bytes) = ok_resp.bytes().await {
                                    if let Ok(pt) =
                                        crypto::decrypt_chunk(&file_key, peer.file_id, idx, &bytes)
                                    {
                                        return Ok::<_, anyhow::Error>((idx, pt));
                                    }
                                }
                            }
                        }
                    }
                    anyhow::bail!("could not download chunk {}", idx)
                });
            }

            let mut chunks: Vec<Option<Vec<u8>>> =
                vec![None; manifest.total_chunks as usize];
            let mut completed = 0u32;
            let mut bytes_moved = 0u64;
            while let Some(res) = join_set.join_next().await {
                let (idx, pt) = res??;
                bytes_moved += pt.len() as u64;
                chunks[idx as usize] = Some(pt);
                completed += 1;
                report_progress(&progress_cb, completed, total, bytes_moved);
            }

            let mut out_file = tokio::fs::File::create(&out_path).await?;
            for chunk in chunks.into_iter() {
                let chunk = chunk.context("missing chunk in swarm download")?;
                tokio::io::AsyncWriteExt::write_all(&mut out_file, &chunk).await?;
            }
            tokio::io::AsyncWriteExt::flush(&mut out_file).await?;
            Ok(out_path)
        }
    }
}
