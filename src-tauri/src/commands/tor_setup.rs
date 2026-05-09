//! First-run Tor bundle setup for onion share (`AppConfig::tor_path` + vendored installer).

use serde::Serialize;
use tauri::{AppHandle, Emitter};

use crate::onion_share::config::AppConfig;
use crate::onion_share::wizard::installer;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TorSetupProgress {
    pub progress: f32,
    pub message: String,
}

#[tauri::command]
pub async fn ensure_tor_for_onion_share(app: AppHandle) -> Result<String, String> {
    let emit = |progress: f32, message: &str| {
        let _ = app.emit(
            "tor-setup-progress",
            TorSetupProgress {
                progress,
                message: message.to_string(),
            },
        );
    };

    emit(0.02, "Checking for Tor…");

    let mut cfg = AppConfig::load();
    if let Some(found) = installer::detect_tor(&cfg.tor_path) {
        if cfg.tor_path != found {
            cfg.tor_path = found.clone();
            let _ = cfg.save();
        }
        emit(1.0, "Tor is ready.");
        return Ok(found);
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(dir) = AppConfig::tor_data_dir() {
            let _ = tokio::fs::create_dir_all(&dir).await;
        }

        use tokio::sync::mpsc;
        let (tx, mut rx) = mpsc::channel::<f64>(64);
        let app_progress = app.clone();
        let progress_task = tokio::spawn(async move {
            while let Some(p) = rx.recv().await {
                let msg = if p < 0.75 {
                    "Downloading Tor…"
                } else if p < 0.95 {
                    "Extracting Tor…"
                } else {
                    "Finishing…"
                };
                let _ = app_progress.emit(
                    "tor-setup-progress",
                    TorSetupProgress {
                        progress: p as f32,
                        message: msg.to_string(),
                    },
                );
            }
        });

        let tor_exe = installer::install_tor_windows(tx)
            .await
            .map_err(|e| e.to_string())?;

        let _ = progress_task.await;

        let path_str = tor_exe.to_string_lossy().to_string();
        cfg.tor_path = path_str.clone();
        cfg.save().map_err(|e| e.to_string())?;
        emit(1.0, "Tor is ready.");
        Ok(path_str)
    }

    #[cfg(not(target_os = "windows"))]
    {
        emit(0.0, "Tor was not found.");
        Err(
            "Tor was not found. Install Tor with your package manager (macOS: brew install tor; Debian/Ubuntu: sudo apt install tor), then click Retry."
                .to_string(),
        )
    }
}
