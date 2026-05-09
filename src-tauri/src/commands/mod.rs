pub mod app;
pub mod security;
pub mod system;
pub mod settings;
pub mod search;
pub mod collections;
pub mod documents;
pub mod network_shell;
pub mod onion_bridge;
pub mod tor_setup;

pub use app::{initialize_app, get_app_ready_state, close_splash_screen, InitProgress};
pub use security::{get_security_info, refresh_security_info, SecurityInfo};
pub use system::{
    get_disk_space_info, get_resource_usage, DiskSpaceInfo, pick_any_files, pick_folder,
    pick_library_folder, pick_document_files,
};
pub use tor_setup::{ensure_tor_for_onion_share, TorSetupProgress};
pub use settings::{load_app_settings, save_app_settings, AppSettings};
pub use search::{get_search_history, clear_search_history, get_search_index_info, SearchIndex};
pub use collections::{create_collection, get_collections, get_collection, update_collection, delete_collection};
pub use documents::{
  scan_documents_folder,
  get_folder_info,
  list_documents_in_folder,
  get_document_info,
  open_document,
  pdf_get_page_count,
  pdf_render_page_png,
  import_document,
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
    onion_share_add_file,
    onion_share_fetch,
    onion_share_list_local,
    onion_share_remove_file,
    onion_share_start,
    onion_share_status,
    onion_share_stop,
    tracker_get_cached_lobby_cmd,
    tracker_get_config,
    tracker_refresh_lobby,
    tracker_get_last_sync_diag,
    tracker_set_config,
    tracker_start_ws_loop,
    tracker_stop_ws_loop,
    OnionShareState,
    TrackerNetworkConfig,
};