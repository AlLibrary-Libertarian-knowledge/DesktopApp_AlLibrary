use crate::core::database::get_connection_manager;
use crate::core::document::get_file_cache;
use serde::{Deserialize, Serialize};
use sysinfo::Disks;
use std::path::Path;

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

#[derive(Debug, Serialize, Deserialize)]
pub struct DiskSpaceInfo {
    pub project_size_bytes: u64,
    pub total_disk_space_bytes: u64,
    pub available_disk_space_bytes: u64,
    pub used_disk_space_bytes: u64,
    pub project_percentage: f64,
    pub disk_usage_percentage: f64,
    pub project_path: String,
    pub disk_name: String,
}

#[tauri::command]
pub async fn get_system_status() -> Result<SystemStatus, String> {
    let database_connected = match get_connection_manager() {
        Ok(mgr) => mgr.health_check().await.is_ok(),
        Err(_) => false,
    };
    
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

#[tauri::command]
pub async fn get_disk_space_info(project_path: String) -> Result<DiskSpaceInfo, String> {
    let path = Path::new(&project_path);
    
    // Get project directory size
    let project_size = calculate_directory_size(path)
        .map_err(|e| format!("Failed to calculate project size: {}", e))?;
    
    // Get disk information
    let disks = Disks::new_with_refreshed_list();
    
    // Find the disk that contains our project path
    let disk = disks
        .iter()
        .find(|d| path.starts_with(d.mount_point()))
        .ok_or_else(|| "Could not find disk for project path".to_string())?;
    
    let total_space = disk.total_space();
    let available_space = disk.available_space();
    let used_space = total_space - available_space;
    
    // Calculate percentages
    let project_percentage = if total_space > 0 {
        (project_size as f64 / total_space as f64) * 100.0
    } else {
        0.0
    };
    
    let disk_usage_percentage = if total_space > 0 {
        (used_space as f64 / total_space as f64) * 100.0
    } else {
        0.0
    };
    
    Ok(DiskSpaceInfo {
        project_size_bytes: project_size,
        total_disk_space_bytes: total_space,
        available_disk_space_bytes: available_space,
        used_disk_space_bytes: used_space,
        project_percentage,
        disk_usage_percentage,
        project_path: project_path.clone(),
        disk_name: disk.name().to_string_lossy().to_string(),
    })
}

fn calculate_directory_size(path: &Path) -> Result<u64, std::io::Error> {
    let mut total_size = 0u64;
    
    if path.is_dir() {
        let entries = std::fs::read_dir(path)?;
        for entry in entries {
            let entry = entry?;
            let entry_path = entry.path();
            
            if entry_path.is_dir() {
                total_size += calculate_directory_size(&entry_path)?;
            } else {
                let metadata = entry.metadata()?;
                total_size += metadata.len();
            }
        }
    } else if path.is_file() {
        let metadata = std::fs::metadata(path)?;
        total_size = metadata.len();
    }
    
    Ok(total_size)
} 