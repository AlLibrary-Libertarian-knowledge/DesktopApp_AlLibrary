use crate::core::database::get_connection_manager;
use crate::core::document::get_file_cache;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStatus {
    pub database_connected: bool,
    pub file_cache_initialized: bool,
    pub app_version: String,
    pub total_documents: i64,
    pub cache_stats: Option<CacheStatsResponse>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CacheStatsResponse {
    pub content_entries: usize,
    pub metadata_entries: usize,
    pub total_content_size: usize,
    pub max_entries: usize,
}

#[tauri::command]
pub async fn get_system_status() -> Result<SystemStatus, String> {
    let database_connected = get_connection_manager()
        .and_then(|mgr| mgr.health_check())
        .await
        .is_ok();
    
    let file_cache_initialized = get_file_cache().is_ok();
    
    let cache_stats = if file_cache_initialized {
        get_file_cache()
            .map_err(|e| e.to_string())?
            .get_stats()
            .await
            .into()
    } else {
        None
    };
    
    // Get document count
    let total_documents = if database_connected {
        use crate::core::database::{get_pool, DocumentOperations};
        match get_pool() {
            Ok(pool) => {
                DocumentOperations::get_all(pool, None, None)
                    .await
                    .map(|docs| docs.len() as i64)
                    .unwrap_or(0)
            }
            Err(_) => 0,
        }
    } else {
        0
    };
    
    Ok(SystemStatus {
        database_connected,
        file_cache_initialized,
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        total_documents,
        cache_stats,
    })
}

impl From<crate::core::document::CacheStats> for Option<CacheStatsResponse> {
    fn from(stats: crate::core::document::CacheStats) -> Self {
        Some(CacheStatsResponse {
            content_entries: stats.content_entries,
            metadata_entries: stats.metadata_entries,
            total_content_size: stats.total_content_size,
            max_entries: stats.max_entries,
        })
    }
}

#[tauri::command]
pub async fn check_database_health() -> Result<bool, String> {
    match get_connection_manager() {
        Ok(mgr) => mgr.health_check().await.map(|_| true).map_err(|e| e.to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn clear_cache() -> Result<bool, String> {
    match get_file_cache() {
        Ok(cache) => {
            cache.clear().await;
            Ok(true)
        }
        Err(e) => Err(e.to_string()),
    }
} 