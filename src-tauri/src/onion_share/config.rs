//! Persisted tracker / node settings (POC-compatible fields).

use anyhow::Context;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackerNetworkConfig {
    pub tracker_url: String,
    pub node_id: String,
    pub share_publicly: bool,
}

impl Default for TrackerNetworkConfig {
    fn default() -> Self {
        Self {
            tracker_url: String::new(),
            node_id: Uuid::new_v4().to_string(),
            share_publicly: true,
        }
    }
}

impl TrackerNetworkConfig {
    fn config_path() -> anyhow::Result<PathBuf> {
        let dir = dirs::config_dir()
            .or_else(dirs::data_local_dir)
            .context("no config directory")?
            .join("AlLibrary");
        Ok(dir.join("tracker_network.json"))
    }

    pub fn load() -> Self {
        let Ok(path) = Self::config_path() else {
            return Self::default();
        };
        if !path.exists() {
            let c = Self::default();
            let _ = c.save();
            return c;
        }
        fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    }

    pub fn save(&self) -> anyhow::Result<()> {
        let path = Self::config_path()?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, serde_json::to_string_pretty(self)?)?;
        Ok(())
    }
}
