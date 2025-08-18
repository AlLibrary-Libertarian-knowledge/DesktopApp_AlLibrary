// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod commands;
pub mod core;
pub mod utils;

use crate::commands::{initialize_app, get_app_ready_state, close_splash_screen, get_security_info, refresh_security_info, get_disk_space_info, get_resource_usage, load_app_settings, save_app_settings, get_search_history, clear_search_history, get_search_index_info, create_collection, get_collections, get_collection, update_collection, delete_collection, scan_documents_folder, get_folder_info, list_documents_in_folder, get_document_info, open_document, pdf_get_page_count, pdf_render_page_png, init_tor_node, start_tor, get_tor_status, enable_tor_bridges, use_tor_socks, create_hidden_service, list_hidden_services, rotate_tor_circuit, stop_tor, get_tor_log_tail, init_p2p_node, start_p2p_node, stop_p2p_node, get_p2p_node_status, get_connected_peers, discover_peers, get_network_metrics, enable_tor_routing, disable_tor_routing, search_p2p_network, start_libp2p_with_socks, connect_bootstrap, publish_content, fetch_content, pick_library_folder, pick_document_files, import_document};
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
            // Ensure resources directory exists in dev runs
            if let Ok(exe_dir) = std::env::current_exe().and_then(|p| Ok(p.parent().map(|p| p.to_path_buf()).unwrap_or_default())) {
                let res_dir = exe_dir.join("resources");
                let _ = std::fs::create_dir_all(&res_dir);
            }
            
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
            get_disk_space_info,
            load_app_settings,
            save_app_settings,
            get_search_history,
            clear_search_history,
            get_search_index_info,
            create_collection,
            get_collections,
            get_collection,
            update_collection,
            delete_collection,
            scan_documents_folder,
            get_folder_info,
            list_documents_in_folder,
            get_document_info,
            open_document,
            pdf_get_page_count,
            pdf_render_page_png,
            import_document
            ,init_tor_node
            ,start_tor
            ,get_tor_status
            ,enable_tor_bridges
            ,use_tor_socks
            ,create_hidden_service
            ,list_hidden_services
            ,rotate_tor_circuit
             ,get_tor_log_tail
            ,stop_tor
            ,init_p2p_node
            ,start_p2p_node
            ,stop_p2p_node
            ,get_p2p_node_status
            ,get_connected_peers
            ,discover_peers
            ,get_network_metrics
            ,enable_tor_routing
            ,disable_tor_routing
            ,search_p2p_network
             ,start_libp2p_with_socks
             ,connect_bootstrap
             ,publish_content
             ,fetch_content
             ,pick_library_folder
             ,pick_document_files
             ,get_resource_usage
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
