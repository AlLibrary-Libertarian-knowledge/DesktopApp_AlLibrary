use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tracing::{error, info, warn};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchIndex {
    #[serde(rename = "indexPath")]
    pub index_path: String,
    #[serde(rename = "lastUpdated")]
    pub last_updated: String, // ISO date string
    #[serde(rename = "documentCount")]
    pub document_count: u32,
    #[serde(rename = "totalSize")]
    pub total_size: u64,
    #[serde(rename = "culturalContexts")]
    pub cultural_contexts: Vec<String>,
    #[serde(rename = "sensitivityLevels")]
    pub sensitivity_levels: Vec<u32>,
    #[serde(rename = "averageSearchTime")]
    pub average_search_time: f64,
    #[serde(rename = "indexHealth")]
    pub index_health: String, // "healthy" | "needs_update" | "corrupted"
}

fn get_search_history_path(project_path: &str) -> PathBuf {
    PathBuf::from(project_path).join("cache").join("search_history.json")
}

fn get_index_info_path(index_path: &str) -> PathBuf {
    PathBuf::from(index_path).join("index_info.json")
}

fn ensure_directory_exists(path: &PathBuf) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_search_history(project_path: String, limit: u32) -> Result<Vec<String>, String> {
    info!("Getting search history from project: {}", project_path);
    
    let history_path = get_search_history_path(&project_path);
    
    if !history_path.exists() {
        info!("Search history file not found, returning empty history");
        return Ok(vec![]);
    }

    let history_content = fs::read_to_string(&history_path)
        .map_err(|e| {
            warn!("Failed to read search history: {}", e);
            // Return empty history instead of error for better UX
            return format!("Failed to read search history: {}", e);
        })?;

    let mut history: Vec<String> = serde_json::from_str(&history_content)
        .unwrap_or_else(|e| {
            warn!("Failed to parse search history, returning empty: {}", e);
            vec![]
        });

    // Limit the results and return most recent first
    history.reverse();
    history.truncate(limit as usize);
    
    info!("Retrieved {} search history items", history.len());
    Ok(history)
}

#[tauri::command]
pub async fn add_search_to_history(project_path: String, query: String) -> Result<(), String> {
    info!("Adding search to history: {}", query);
    
    let history_path = get_search_history_path(&project_path);
    ensure_directory_exists(&history_path)?;

    let mut history: Vec<String> = if history_path.exists() {
        let history_content = fs::read_to_string(&history_path)
            .unwrap_or_else(|_| "[]".to_string());
        
        serde_json::from_str(&history_content)
            .unwrap_or_else(|_| vec![])
    } else {
        vec![]
    };

    // Remove duplicate if exists
    history.retain(|item| item != &query);
    
    // Add to beginning
    history.insert(0, query);
    
    // Keep only last 100 items
    history.truncate(100);

    let history_json = serde_json::to_string_pretty(&history)
        .map_err(|e| format!("Failed to serialize search history: {}", e))?;

    fs::write(&history_path, history_json)
        .map_err(|e| format!("Failed to write search history: {}", e))?;

    info!("Search added to history successfully");
    Ok(())
}

#[tauri::command]
pub async fn clear_search_history(project_path: String) -> Result<(), String> {
    info!("Clearing search history for project: {}", project_path);
    
    let history_path = get_search_history_path(&project_path);
    
    if history_path.exists() {
        fs::remove_file(&history_path)
            .map_err(|e| format!("Failed to clear search history: {}", e))?;
    }

    info!("Search history cleared successfully");
    Ok(())
}

#[tauri::command]
pub async fn get_search_index_info(index_path: String) -> Result<SearchIndex, String> {
    info!("Getting search index info from: {}", index_path);
    
    let index_info_path = get_index_info_path(&index_path);
    
    if !index_info_path.exists() {
        info!("Index info file not found, creating default");
        
        // Create default index info
        let default_index = SearchIndex {
            index_path: index_path.clone(),
            last_updated: chrono::Utc::now().to_rfc3339(),
            document_count: 0,
            total_size: 0,
            cultural_contexts: vec![],
            sensitivity_levels: vec![1, 2, 3, 4, 5],
            average_search_time: 0.0,
            index_health: "needs_update".to_string(),
        };

        // Ensure directory exists and save default
        ensure_directory_exists(&index_info_path)?;
        
        let index_json = serde_json::to_string_pretty(&default_index)
            .map_err(|e| format!("Failed to serialize default index info: {}", e))?;

        fs::write(&index_info_path, index_json)
            .map_err(|e| format!("Failed to write default index info: {}", e))?;

        return Ok(default_index);
    }

    let index_content = fs::read_to_string(&index_info_path)
        .map_err(|e| format!("Failed to read index info: {}", e))?;

    let index_info: SearchIndex = serde_json::from_str(&index_content)
        .unwrap_or_else(|e| {
            error!("Failed to parse index info: {}", e);
            SearchIndex {
                index_path: index_path.clone(),
                last_updated: chrono::Utc::now().to_rfc3339(),
                document_count: 0,
                total_size: 0,
                cultural_contexts: vec![],
                sensitivity_levels: vec![1, 2, 3, 4, 5],
                average_search_time: 0.0,
                index_health: "corrupted".to_string(),
            }
        });

    info!("Search index info retrieved successfully");
    Ok(index_info)
}

#[tauri::command]
pub async fn update_search_index_info(
    index_path: String,
    document_count: u32,
    total_size: u64,
    cultural_contexts: Vec<String>,
) -> Result<(), String> {
    info!("Updating search index info");
    
    let index_info_path = get_index_info_path(&index_path);
    ensure_directory_exists(&index_info_path)?;

    let updated_index = SearchIndex {
        index_path: index_path.clone(),
        last_updated: chrono::Utc::now().to_rfc3339(),
        document_count,
        total_size,
        cultural_contexts,
        sensitivity_levels: vec![1, 2, 3, 4, 5],
        average_search_time: 0.0,
        index_health: "healthy".to_string(),
    };

    let index_json = serde_json::to_string_pretty(&updated_index)
        .map_err(|e| format!("Failed to serialize index info: {}", e))?;

    fs::write(&index_info_path, index_json)
        .map_err(|e| format!("Failed to write index info: {}", e))?;

    info!("Search index info updated successfully");
    Ok(())
} 