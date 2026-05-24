// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod commands;
pub mod core;
pub mod onion_share;
pub mod utils;

use crate::commands::{initialize_app, get_app_ready_state, close_splash_screen, get_security_info, refresh_security_info, get_disk_space_info, get_resource_usage, load_app_settings, save_app_settings, apply_project_paths, get_search_history, clear_search_history, get_search_index_info, create_collection, get_collections, get_collection, update_collection, delete_collection, scan_documents_folder, get_folder_info, list_documents_in_folder, get_document_info, open_document, pdf_get_page_count, pdf_render_page_png, init_tor_node, start_tor, get_tor_status, enable_tor_bridges, use_tor_socks, create_hidden_service, list_hidden_services, rotate_tor_circuit, stop_tor, get_tor_log_tail, init_p2p_node, start_p2p_node, stop_p2p_node, get_p2p_node_status, get_connected_peers, discover_peers, get_network_metrics, enable_tor_routing, disable_tor_routing, search_p2p_network, start_libp2p_with_socks, connect_bootstrap, publish_content, fetch_content, pick_library_folder, pick_folder, pick_any_files, pick_document_files, import_document, ensure_tor_for_onion_share};
use crate::commands::network_cache::{list_network_peers, search_network_cached};
use crate::commands::onion_bridge::{bootstrap_onion_overlay, onion_share_start, onion_share_stop, onion_share_add_file, onion_share_remove_file, onion_share_list_local, onion_share_status, tracker_get_config, tracker_set_config, tracker_refresh_lobby, tracker_get_cached_lobby_cmd, tracker_get_last_sync_diag, tracker_start_ws_loop, tracker_stop_ws_loop, onion_share_fetch, OnionShareState};
use crate::commands::network_shell::{put_kad_record, get_kad_record, bootstrap_kad, announce_peer_presence, discover_kad_peers, test_p2p_connection, get_p2p_debug_info, get_peer_discovery_status, get_my_onion_address, get_network_peers, add_peer_address, force_create_onion_service};
use crate::utils::{init_logging, LoggingConfig};
use tracing::info;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize basic logging
    let log_config = LoggingConfig::default();
    if let Err(e) = init_logging(log_config) {
        eprintln!("Failed to initialize logging: {}", e);
    }

    info!("Starting AlLibrary application");

    tauri::Builder::default()
        .manage(OnionShareState::default())
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            info!("AlLibrary setup completed");
            // Ensure resources directory exists in dev runs
            if let Ok(exe_dir) = std::env::current_exe().and_then(|p| Ok(p.parent().map(|p| p.to_path_buf()).unwrap_or_default())) {
                let res_dir = exe_dir.join("resources");
                let _ = std::fs::create_dir_all(&res_dir);
            }
            // Bootstrap (including Tor onion share) runs from the frontend via `invoke('initialize_app')`
            // so the loading screen receives `init-progress` events and blocks until completion.
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
            apply_project_paths,
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
             ,pick_folder
             ,pick_any_files
             ,pick_document_files
             ,ensure_tor_for_onion_share
             ,get_resource_usage
             ,put_kad_record
             ,get_kad_record
             ,bootstrap_kad
             ,announce_peer_presence
             ,discover_kad_peers
             ,test_p2p_connection
             ,get_p2p_debug_info
             ,get_peer_discovery_status
             ,get_my_onion_address
             ,get_network_peers
             ,add_peer_address
             ,force_create_onion_service
            ,bootstrap_onion_overlay
            ,onion_share_start
            ,onion_share_stop
            ,onion_share_add_file
            ,onion_share_remove_file
            ,onion_share_list_local
            ,onion_share_status
            ,tracker_get_config
            ,tracker_set_config
            ,tracker_refresh_lobby
            ,tracker_get_last_sync_diag
            ,tracker_get_cached_lobby_cmd
            ,tracker_start_ws_loop
            ,tracker_stop_ws_loop
            ,onion_share_fetch
            ,search_network_cached
            ,list_network_peers
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
