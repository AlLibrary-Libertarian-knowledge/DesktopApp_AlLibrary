// Derived from onion-poc (MIT): POC-Tracker-Onion-Share/src/config.rs
use anyhow::Context;
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Docker POC (`tor-entrypoint.sh`) publishes the tracker as `HiddenServicePort 80 127.0.0.1:8080`:
/// Tor presents **virtual port 80**, not 8080. `http://….onion:8080` never hits the HS and announce fails silently.
pub fn normalize_tracker_url(raw: &str) -> String {
    let t = raw.trim();
    if t.is_empty() {
        return String::new();
    }
    let Ok(mut u) = url::Url::parse(t) else {
        return t.trim_end_matches('/').to_string();
    };
    let host = u.host_str().unwrap_or("");
    if host.ends_with(".onion") && u.scheme() == "http" && u.port() == Some(8080) {
        let _ = u.set_port(None);
    }
    u.as_str().trim_end_matches('/').to_string()
}

/// Current TrackerRust hidden service (keys persisted in the `tor_keys` Docker volume).
pub const DEFAULT_TRACKER_ONION_URL: &str =
    "http://xscv6ske7lokympue5f3wqf472etqnpdghcxolozkfx67xywnjr2y6id.onion";

/// Retired tracker onions. A saved `tracker_url` pointing at one of these is migrated to
/// [`DEFAULT_TRACKER_ONION_URL`] on load, so old installs do not stay pinned to a dead address.
const LEGACY_TRACKER_ONION_HOSTS: &[&str] = &[
    "3anhnwqwxmjo7xsyxs3uoocdctxd3nwkfm5lt36xcwi4hfmkbttoktqd.onion",
];

fn is_legacy_tracker_onion(url: &str) -> bool {
    let host = url::Url::parse(url.trim())
        .ok()
        .and_then(|u| u.host_str().map(|h| h.to_ascii_lowercase()));
    match host {
        Some(h) => LEGACY_TRACKER_ONION_HOSTS.iter().any(|legacy| h == *legacy),
        None => false,
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct AppConfig {
    pub terms_accepted: bool,
    pub tor_path: String,
    pub node_id: String,
    pub tracker_url: String,
    pub share_publicly: bool,
    /// After Tor fails reaching `tracker_url`, also try HTTP to local Docker Desktop (`127.0.0.1:8080`).
    /// Only used when localhost actually answers a probe (avoids family-PC dead ends).
    pub try_local_tracker_fallback: bool,
    /// Optional hub on LAN for other household PCs, e.g. `http://192.168.15.191:8080`.
    #[serde(default)]
    pub preferred_hub_url: String,
    /// Last tracker URL that successfully synced the lobby.
    #[serde(default)]
    pub last_good_tracker_url: String,
    pub bootstrap_peers: Vec<String>,
    /// Tor bridge lines (one per entry), passed as `--Bridge` when non-empty.
    pub tor_bridges: Vec<String>,
    /// Last successful Tor overlay data directory (warm-start reuse).
    pub tor_overlay_data_dir: Option<String>,
    /// When true, completed downloads POST anonymous transfer metrics to the Analytics hub.
    pub analytics_ingest_enabled: bool,
    /// Full URL for Django telemetry ingest (default local TCC hub).
    pub analytics_ingest_url: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            terms_accepted: false,
            tor_path: String::new(),
            node_id: uuid::Uuid::new_v4().to_string(),
            tracker_url: DEFAULT_TRACKER_ONION_URL.to_string(),
            share_publicly: true,
            // Docker Desktop POC maps tracker to host :8080; Tor-to-.onion can lag or fail behind strict networks.
            try_local_tracker_fallback: true,
            preferred_hub_url: String::new(),
            last_good_tracker_url: String::new(),
            bootstrap_peers: Vec::new(),
            tor_bridges: Vec::new(),
            tor_overlay_data_dir: None,
            analytics_ingest_enabled: true,
            analytics_ingest_url: "http://127.0.0.1:8000/api/v1/telemetry/ingest/".to_string(),
        }
    }
}

impl AppConfig {
    fn config_path() -> Option<PathBuf> {
        ProjectDirs::from("br", "tcc", "onion_poc").map(|d| d.config_dir().join("config.json"))
    }

    pub fn load() -> Self {
        let Some(path) = Self::config_path() else {
            return Self::default();
        };
        let mut cfg: Self = std::fs::read_to_string(path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default();
        cfg.migrate_legacy_tracker_urls();
        cfg
    }

    /// Replace retired tracker onions (saved by older builds) with the current default.
    /// Persists the change so the migration runs once per install.
    fn migrate_legacy_tracker_urls(&mut self) {
        let mut changed = false;
        if is_legacy_tracker_onion(&self.tracker_url) {
            self.tracker_url = DEFAULT_TRACKER_ONION_URL.to_string();
            changed = true;
        }
        if is_legacy_tracker_onion(&self.last_good_tracker_url) {
            self.last_good_tracker_url.clear();
            changed = true;
        }
        if is_legacy_tracker_onion(&self.preferred_hub_url) {
            self.preferred_hub_url.clear();
            changed = true;
        }
        if changed {
            let _ = self.save();
        }
    }

    pub fn save(&self) -> anyhow::Result<()> {
        let path = Self::config_path().context("no config dir")?;
        if let Some(p) = path.parent() {
            std::fs::create_dir_all(p)?;
        }
        std::fs::write(path, serde_json::to_string_pretty(self)?)?;
        Ok(())
    }

    pub fn tor_bin(&self) -> &str {
        if self.tor_path.is_empty() {
            "tor"
        } else {
            &self.tor_path
        }
    }

    pub fn tor_available(&self) -> bool {
        let mut cmd = std::process::Command::new(self.tor_bin());
        crate::onion_share::platform::hide_console(&mut cmd);
        cmd.arg("--version")
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    }

    pub fn effective_tor_path(&self) -> String {
        self.tor_bin().to_string()
    }

    pub fn tor_data_dir() -> anyhow::Result<PathBuf> {
        ProjectDirs::from("br", "tcc", "onion_poc")
            .map(|d| d.data_local_dir().join("tor_bundle"))
            .context("no data dir")
    }
}
