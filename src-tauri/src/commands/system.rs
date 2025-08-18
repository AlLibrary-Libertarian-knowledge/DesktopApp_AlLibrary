use crate::core::database::get_connection_manager;
use crate::core::document::get_file_cache;
use serde::{Deserialize, Serialize};
use sysinfo::Disks;
use std::path::Path;
use std::env;
use rfd::FileDialog;
use std::fs;
use std::path::PathBuf;
use tokio::time::{sleep, Duration};
use sysinfo::{System, CpuRefreshKind, MemoryRefreshKind, RefreshKind};

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

#[derive(Debug, Serialize, Deserialize)]
pub struct ResourceUsage {
    pub cpu_percent: f32,
    pub memory_percent: f32,
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
pub async fn get_disk_space_info(projectPath: String) -> Result<DiskSpaceInfo, String> {
    use tracing::{info, debug};
    
    info!("Getting disk space info for path: {}", projectPath);
    let path = Path::new(&projectPath);
    
    // Get project directory size (gracefully handle permission errors)
    let project_size = calculate_directory_size(path).unwrap_or(0);
    debug!("Project size calculated: {} bytes", project_size);
    
    // Get disk information
    let disks = Disks::new_with_refreshed_list();
    debug!("Found {} disks", disks.len());
    
    // Find the disk that contains our project path
    // Windows-specific logic for drive detection
    let disk = if cfg!(windows) {
        // On Windows, extract the drive letter from the path
        let path_str = path.to_string_lossy();
        let drive_letter = if path_str.len() >= 2 && path_str.chars().nth(1) == Some(':') {
            path_str.chars().nth(0).unwrap().to_uppercase().to_string()
        } else {
            // Default to C: if we can't determine the drive
            "C".to_string()
        };
        
        // Find disk by drive letter
        disks.iter().find(|d| {
            let mount_point = d.mount_point().to_string_lossy();
            mount_point.starts_with(&format!("{}:", drive_letter)) || 
            mount_point.starts_with(&format!("{}:\\", drive_letter))
        })
    } else {
        // Unix-like systems: find by mount point
        let mut search_path = path;
        loop {
            if let Some(disk) = disks.iter().find(|d| search_path.starts_with(d.mount_point())) {
                break Some(disk);
            }
            
            // Try parent directory
            if let Some(parent) = search_path.parent() {
                search_path = parent;
            } else {
                break None;
            }
        }
    };
    
    let disk = disk.ok_or_else(|| {
        let available_disks: Vec<String> = disks.iter()
            .map(|d| format!("{} ({})", d.name().to_string_lossy(), d.mount_point().to_string_lossy()))
            .collect();
        format!("Could not find disk for project path '{}'. Available disks: [{}]", 
                projectPath, available_disks.join(", "))
    })?;
    
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
        project_path: projectPath.clone(),
        disk_name: disk.name().to_string_lossy().to_string(),
    })
}

/// Returns approximate CPU and memory usage percentages.
#[tauri::command]
pub async fn get_resource_usage() -> Result<ResourceUsage, String> {
    // Initialize system with minimal refresh kind first
    let mut sys = System::new_with_specifics(
        RefreshKind::new()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::everything())
    );

    // First refresh
    sys.refresh_cpu_specifics(CpuRefreshKind::new().with_cpu_usage());
    sys.refresh_memory();
    // Wait a short time to compute CPU usage delta
    // Windows Task Manager uses a ~1s sampling window; align closer for comparable numbers
    sleep(Duration::from_millis(1000)).await;
    sys.refresh_cpu_specifics(CpuRefreshKind::new().with_cpu_usage());
    sys.refresh_memory();

    // Global CPU usage across all processors
    let cpu = sys.global_cpu_info().cpu_usage(); // 0..100

    // Memory percent
    let total = sys.total_memory() as f32;
    let used = (sys.used_memory()) as f32;
    let mem_pct = if total > 0.0 { (used / total) * 100.0 } else { 0.0 };

    Ok(ResourceUsage { cpu_percent: cpu, memory_percent: mem_pct })
}

fn calculate_directory_size(path: &Path) -> Result<u64, std::io::Error> {
    let mut total_size = 0u64;
    
    // Check if path exists first
    if !path.exists() {
        return Ok(0);
    }
    
    if path.is_dir() {
        // Try to read directory, but handle permission errors gracefully
        match std::fs::read_dir(path) {
            Ok(entries) => {
                for entry in entries {
                    match entry {
                        Ok(entry) => {
                            let entry_path = entry.path();
                            
                            if entry_path.is_dir() {
                                // Recursively calculate subdirectory size, but ignore permission errors
                                if let Ok(subdir_size) = calculate_directory_size(&entry_path) {
                                    total_size += subdir_size;
                                }
                                // If we can't access a subdirectory, just skip it
                            } else {
                                // Try to get file metadata, but handle permission errors
                                if let Ok(metadata) = entry.metadata() {
                                    total_size += metadata.len();
                                }
                                // If we can't access file metadata, just skip it
                            }
                        }
                        Err(_) => {
                            // Skip entries we can't read due to permissions
                            continue;
                        }
                    }
                }
            }
            Err(_) => {
                // If we can't read the directory due to permissions, return 0
                return Ok(0);
            }
        }
    } else if path.is_file() {
        // Try to get file metadata, but handle permission errors
        match std::fs::metadata(path) {
            Ok(metadata) => total_size = metadata.len(),
            Err(_) => return Ok(0), // If we can't access file, return 0
        }
    }
    
    Ok(total_size)
} 

#[tauri::command]
pub async fn get_installer_library_dir() -> Option<String> {
    let base = env::var("PROGRAMDATA").ok()?;
    let mut p = PathBuf::from(base);
    p.push("AlLibrary");
    p.push("installer.txt");
    let s = fs::read_to_string(&p).ok()?;
    Some(s.trim().to_string())
}

#[tauri::command]
pub async fn pick_library_folder() -> Option<String> {
    let dir = FileDialog::new()
        .set_title("Select your AlLibrary folder")
        .pick_folder();
    dir.map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn pick_document_files() -> Vec<String> {
    let dialog = match std::env::current_dir() {
        Ok(dir) => FileDialog::new().set_title("Select documents to import").add_filter("Documents", &["pdf", "epub"]).set_directory(dir),
        Err(_) => FileDialog::new().set_title("Select documents to import").add_filter("Documents", &["pdf", "epub"]),
    };
    let files = dialog.pick_files();
    files
        .unwrap_or_default()
        .into_iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect()
}