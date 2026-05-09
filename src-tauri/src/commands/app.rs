use tauri::{AppHandle, Emitter, Manager};
use serde::{Deserialize, Serialize};
use std::thread;
use std::time::Duration;
use tokio::time::{sleep, Duration as TokioDuration};
use tracing::{error, info};

/// Quick baseline startup only — closes the native splash. Tor/onion runs in `bootstrap_onion_overlay`.

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InitProgress {
    pub phase: String,
    pub message: String,
    pub progress: f32,
    pub icon: String,
}

#[tauri::command]
pub async fn initialize_app(app: AppHandle) -> Result<(), String> {
    info!("Starting application baseline initialization (splash phase)");

    let main_window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    let splash_window = app.get_webview_window("splashscreen");

    let early = vec![
        InitProgress {
            phase: "network".to_string(),
            message: "Initializing Cultural Heritage Network".to_string(),
            progress: 22.0,
            icon: "Globe".to_string(),
        },
        InitProgress {
            phase: "security".to_string(),
            message: "Securing Cultural Wisdom".to_string(),
            progress: 44.0,
            icon: "Shield".to_string(),
        },
        InitProgress {
            phase: "database".to_string(),
            message: "Preparing Knowledge Vault".to_string(),
            progress: 66.0,
            icon: "Database".to_string(),
        },
    ];

    for phase in early {
        info!("Initialization phase: {}", phase.phase);
        if let Err(e) = main_window.emit("init-progress", &phase) {
            error!("Failed to emit progress: {}", e);
        }
        sleep(TokioDuration::from_millis(380)).await;
    }

    let baseline_ready = InitProgress {
        phase: "baseline".to_string(),
        message: "Opening workspace…".to_string(),
        progress: 88.0,
        icon: "Sparkles".to_string(),
    };
    if let Err(e) = main_window.emit("init-progress", &baseline_ready) {
        error!("Failed to emit progress: {}", e);
    }
    sleep(TokioDuration::from_millis(280)).await;

    main_window.show().map_err(|e| e.to_string())?;
    main_window.set_focus().map_err(|e| e.to_string())?;

    if let Some(splash) = splash_window {
        let _ = splash.close();
    }

    info!("Baseline initialization completed (splash closed; onion follows on Loading screen)");
    Ok(())
}

#[tauri::command]
pub async fn get_app_ready_state() -> Result<bool, String> {
    thread::sleep(Duration::from_millis(100));
    Ok(true)
}

#[tauri::command]
pub async fn close_splash_screen(app: AppHandle) -> Result<(), String> {
    if let Some(splash_window) = app.get_webview_window("splashscreen") {
        splash_window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}
