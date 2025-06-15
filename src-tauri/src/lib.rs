// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod commands;
pub mod core;
pub mod utils;

use crate::commands::{initialize_app, get_app_ready_state, close_splash_screen, get_security_info, refresh_security_info, get_disk_space_info};
use crate::utils::{init_logging, LoggingConfig};
use tracing::info;
use std::thread;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize basic logging
    let log_config = LoggingConfig::default();
    if let Err(e) = init_logging(log_config) {
        eprintln!("Failed to initialize logging: {}", e);
    }

    info!("Starting AlLibrary application");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            info!("AlLibrary setup completed");
            
            // Auto-start the initialization process
            let app_handle = app.handle().clone();
            thread::spawn(move || {
                // Small delay to ensure splash screen is shown
                thread::sleep(std::time::Duration::from_millis(1000));
                
                // Start initialization in background
                tauri::async_runtime::spawn(async move {
                    if let Err(e) = initialize_app(app_handle).await {
                        eprintln!("Initialization failed: {}", e);
                    }
                });
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            initialize_app,
            get_app_ready_state,
            close_splash_screen,
            get_security_info,
            refresh_security_info,
            get_disk_space_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
