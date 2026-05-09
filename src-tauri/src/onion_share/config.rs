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

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct AppConfig {
    pub terms_accepted: bool,
    pub tor_path: String,
    pub node_id: String,
    pub tracker_url: String,
    pub share_publicly: bool,
    /// After Tor fails reaching `tracker_url`, also try HTTP to local Docker Desktop (`127.0.0.1:8080`).
    pub try_local_tracker_fallback: bool,
    pub bootstrap_peers: Vec<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            terms_accepted: false,
            tor_path: String::new(),
            node_id: uuid::Uuid::new_v4().to_string(),
            tracker_url: "http://tjsdpiz3aweek6wovl2oblmmgacfqvnvxmn7ughwhte2ureidnn5tiqd.onion"
                .to_string(),
            share_publicly: true,
            // Docker Desktop POC maps tracker to host :8080; Tor-to-.onion can lag or fail behind strict networks.
            try_local_tracker_fallback: true,
            bootstrap_peers: Vec::new(),
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
        std::fs::read_to_string(path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
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
        std::process::Command::new(self.tor_bin())
            .arg("--version")
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
