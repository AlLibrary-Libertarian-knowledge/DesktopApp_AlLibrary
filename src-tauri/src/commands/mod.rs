pub mod app;
pub mod security;
pub mod system;
pub mod settings;
pub mod search;
pub mod collections;
pub mod documents;
pub mod network_shell;
pub mod onion_bridge;
pub mod onion_state;
pub mod seed_sync;
pub mod network_cache;
pub mod tor_setup;
pub mod favorites;
pub mod activity;
pub mod transfers;

pub use app::{initialize_app, get_app_ready_state, close_splash_screen, InitProgress};
pub use security::{get_security_info, refresh_security_info, SecurityInfo};
pub use system::{
    get_disk_space_info, get_resource_usage, DiskSpaceInfo, pick_any_files, pick_folder,
    pick_library_folder, pick_document_files,
};
pub use tor_setup::{ensure_tor_for_onion_share, TorSetupProgress};
pub use settings::{apply_project_paths, load_app_settings, save_app_settings, AppSettings};
pub use search::{get_search_history, clear_search_history, get_search_index_info, SearchIndex};
pub use collections::{
    create_collection, get_collections, get_collection, update_collection, delete_collection,
    add_documents_to_collection, remove_documents_from_collection, get_collection_documents,
};
pub use documents::{
  scan_documents_folder,
  get_folder_info,
  list_documents_in_folder,
  get_document_info,
  open_document,
  pdf_get_page_count,
  pdf_render_page_png,
  import_document,
  process_document,
  migrate_library_hashes,
  process_downloaded_file_internal,
  ensure_seeding_allowed,
  delete_local_document,
  DocumentInfo,
  ScanResult,
  FolderInfo
};
pub use network_shell::{
  init_tor_node,
  start_tor,
  get_tor_status,
  enable_tor_bridges,
  use_tor_socks,
  create_hidden_service,
  list_hidden_services,
  rotate_tor_circuit,
  get_tor_log_tail,
  stop_tor,
  TorConfig,
  TorStatus,
  init_p2p_node,
  start_p2p_node,
  stop_p2p_node,
  get_p2p_node_status,
  get_connected_peers,
  discover_peers,
  get_network_metrics,
  enable_tor_routing,
  disable_tor_routing,
  search_p2p_network,
  start_libp2p_with_socks,
  connect_bootstrap,
  publish_content,
  fetch_content,
  NetworkConfig as P2PNetworkConfig,
  P2PNode,
  NetworkStatus as P2PNetworkStatus,
  NetworkMetrics as P2PNetworkMetrics
};
pub use onion_bridge::{
    bootstrap_onion_overlay,
    bootstrap_onion_overlay_background,
    stop_onion_share_internal,
    onion_share_add_file,
    onion_share_fetch,
    onion_share_list_local,
    onion_share_remove_file,
    onion_share_start,
    onion_share_status,
    onion_share_stop,
    reset_tor_overlay_data,
    spawn_tor_recovery_watchdog,
    tracker_get_cached_lobby_cmd,
    tracker_get_config,
    tracker_refresh_lobby,
    tracker_get_last_sync_diag,
    tracker_set_config,
    tracker_start_ws_loop,
    tracker_stop_ws_loop,
    OnionShareState,
    TorBootstrapSnapshot,
    TrackerNetworkConfig,
};
pub use onion_state::SeedNotifySender;
pub use seed_sync::{set_document_seed_enabled, sync_all_enabled_seeds_cmd};
pub use network_cache::{
    list_browse_categories, list_network_peers, list_recent_local_documents,
    list_recent_network_files, list_trending_network_files, search_network_cached,
    BrowseCategoryDto, LocalDocumentDto,
};
pub use favorites::{is_favorite, toggle_favorite, list_favorites, FavoriteToggleResult};
pub use activity::{log_activity, list_activity, delete_activity};
pub use transfers::{list_recent_transfers, TransferDto};