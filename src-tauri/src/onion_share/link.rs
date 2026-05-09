// Derived from onion-poc (MIT): POC-Tracker-Onion-Share/src/link.rs
use std::fmt;

use anyhow::Context;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use url::Url;
use uuid::Uuid;

use super::crypto::{key_from_b64url, key_to_b64url, FileKey};

#[derive(Clone, Debug)]
pub struct ShareLink {
    pub onion: String,
    pub file_id: Uuid,
    pub key: FileKey,
}

#[derive(Clone, Debug)]
pub struct SwarmLink {
    pub tracker_url: String,
    pub content_hash: String,
}

#[derive(Clone, Debug)]
pub enum ParsedLink {
    Direct(ShareLink),
    Swarm(SwarmLink),
}

impl ShareLink {
    pub fn to_link_string(&self) -> String {
        format!(
            "opoc://{}/s/{}#{}",
            self.onion,
            self.file_id,
            key_to_b64url(&self.key),
        )
    }

    pub fn parse(s: &str) -> anyhow::Result<Self> {
        let url = Url::parse(s).context("invalid link URL")?;
        anyhow::ensure!(url.scheme() == "opoc", "link must start with opoc://");

        let host = url.host_str().context("link missing host")?.to_string();
        anyhow::ensure!(host.ends_with(".onion"), "host must be a .onion");

        let segs = url
            .path_segments()
            .context("link missing path")?
            .collect::<Vec<_>>();

        anyhow::ensure!(segs.len() == 2 && segs[0] == "s", "link path must be /s/<file_id>");
        let file_id = Uuid::parse_str(segs[1]).context("invalid file_id (uuid)")?;

        let fragment = url.fragment().context("link missing #<key> fragment")?;
        let key = key_from_b64url(fragment)?;

        Ok(Self { onion: host, file_id, key })
    }
}

impl fmt::Display for ShareLink {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.to_link_string())
    }
}

impl SwarmLink {
    pub fn to_link_string(&self) -> String {
        let encoded_tracker = URL_SAFE_NO_PAD.encode(self.tracker_url.as_bytes());
        format!("opocswarm://swarm/{}#{}", self.content_hash, encoded_tracker)
    }

    pub fn parse(s: &str) -> anyhow::Result<Self> {
        let url = Url::parse(s).context("invalid swarm link URL")?;
        anyhow::ensure!(
            url.scheme() == "opocswarm",
            "link must start with opocswarm://"
        );
        anyhow::ensure!(
            url.host_str() == Some("swarm"),
            "swarm link host must be 'swarm'"
        );
        let content_hash = url
            .path_segments()
            .context("swarm link missing path")?
            .next()
            .context("swarm link missing content hash")?
            .to_string();
        let fragment = url.fragment().context("swarm link missing tracker fragment")?;
        let tracker_url = String::from_utf8(
            URL_SAFE_NO_PAD
                .decode(fragment)
                .context("invalid tracker encoding")?,
        )
        .context("tracker URL is not utf-8")?;
        Ok(Self {
            tracker_url,
            content_hash,
        })
    }
}

impl fmt::Display for SwarmLink {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.to_link_string())
    }
}

pub fn parse_any(s: &str) -> anyhow::Result<ParsedLink> {
    if s.starts_with("opocswarm://") {
        Ok(ParsedLink::Swarm(SwarmLink::parse(s)?))
    } else {
        Ok(ParsedLink::Direct(ShareLink::parse(s)?))
    }
}
