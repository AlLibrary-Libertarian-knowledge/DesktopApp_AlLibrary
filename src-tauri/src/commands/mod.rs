pub mod app;
pub mod security;
pub mod system;
pub mod settings;
pub mod search;
pub mod collections;
pub mod documents;

pub use app::{initialize_app, get_app_ready_state, close_splash_screen, InitProgress};
pub use security::{get_security_info, refresh_security_info, SecurityInfo};
pub use system::{get_disk_space_info, DiskSpaceInfo};
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
  DocumentInfo,
  ScanResult,
  FolderInfo
};