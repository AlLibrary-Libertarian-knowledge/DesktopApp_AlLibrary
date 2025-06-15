use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tracing::{error, info};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub project: ProjectSettings,
    #[serde(rename = "folderStructure")]
    pub folder_structure: FolderStructure,
    pub search: SearchSettings,
    pub theme: String,
    pub language: String,
    pub accessibility: AccessibilitySettings,
    pub cultural: CulturalSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSettings {
    #[serde(rename = "projectFolderPath")]
    pub project_folder_path: String,
    #[serde(rename = "defaultProjectName")]
    pub default_project_name: String,
    #[serde(rename = "autoCreateSubfolders")]
    pub auto_create_subfolders: bool,
    #[serde(rename = "searchIndexPath")]
    pub search_index_path: String,
    #[serde(rename = "enableFullTextSearch")]
    pub enable_full_text_search: bool,
    #[serde(rename = "searchResultsLimit")]
    pub search_results_limit: u32,
    #[serde(rename = "searchHistoryLimit")]
    pub search_history_limit: u32,
    #[serde(rename = "enableCulturalFiltering")]
    pub enable_cultural_filtering: bool,
    #[serde(rename = "defaultCulturalSensitivityLevel")]
    pub default_cultural_sensitivity_level: u32,
    #[serde(rename = "showEducationalContext")]
    pub show_educational_context: bool,
    #[serde(rename = "indexUpdateInterval")]
    pub index_update_interval: u32,
    #[serde(rename = "searchTimeout")]
    pub search_timeout: u32,
    #[serde(rename = "cacheSearchResults")]
    pub cache_search_results: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderStructure {
    #[serde(rename = "documentsFolder")]
    pub documents_folder: String,
    #[serde(rename = "indexFolder")]
    pub index_folder: String,
    #[serde(rename = "metadataFolder")]
    pub metadata_folder: String,
    #[serde(rename = "cacheFolder")]
    pub cache_folder: String,
    #[serde(rename = "backupFolder")]
    pub backup_folder: String,
    #[serde(rename = "culturalContextsFolder")]
    pub cultural_contexts_folder: String,
    #[serde(rename = "educationalResourcesFolder")]
    pub educational_resources_folder: String,
    #[serde(rename = "communityContentFolder")]
    pub community_content_folder: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchSettings {
    #[serde(rename = "caseSensitive")]
    pub case_sensitive: bool,
    #[serde(rename = "includeMetadata")]
    pub include_metadata: bool,
    #[serde(rename = "includeTags")]
    pub include_tags: bool,
    #[serde(rename = "includeContent")]
    pub include_content: bool,
    #[serde(rename = "respectCulturalBoundaries")]
    pub respect_cultural_boundaries: bool,
    #[serde(rename = "showCulturalEducation")]
    pub show_cultural_education: bool,
    #[serde(rename = "enableCommunityValidation")]
    pub enable_community_validation: bool,
    #[serde(rename = "maxSearchResults")]
    pub max_search_results: u32,
    #[serde(rename = "searchDebounceMs")]
    pub search_debounce_ms: u32,
    #[serde(rename = "enableSearchSuggestions")]
    pub enable_search_suggestions: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessibilitySettings {
    #[serde(rename = "highContrast")]
    pub high_contrast: bool,
    #[serde(rename = "reducedMotion")]
    pub reduced_motion: bool,
    #[serde(rename = "screenReaderOptimized")]
    pub screen_reader_optimized: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CulturalSettings {
    #[serde(rename = "preferredCulturalContexts")]
    pub preferred_cultural_contexts: Vec<String>,
    #[serde(rename = "educationalLevel")]
    pub educational_level: String,
    #[serde(rename = "communityMemberships")]
    pub community_memberships: Vec<String>,
}

fn get_settings_path(app_handle: &AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    // Ensure the directory exists
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    
    Ok(app_data_dir.join("settings.json"))
}

fn get_default_settings() -> AppSettings {
    let home_dir = dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("/"))
        .to_string_lossy()
        .to_string();
    
    let default_project_path = format!("{}/AlLibrary", home_dir);

    AppSettings {
        project: ProjectSettings {
            project_folder_path: default_project_path.clone(),
            default_project_name: "AlLibrary".to_string(),
            auto_create_subfolders: true,
            search_index_path: format!("{}/search_index", default_project_path),
            enable_full_text_search: true,
            search_results_limit: 100,
            search_history_limit: 50,
            enable_cultural_filtering: true,
            default_cultural_sensitivity_level: 1,
            show_educational_context: true,
            index_update_interval: 30,
            search_timeout: 5000,
            cache_search_results: true,
        },
        folder_structure: FolderStructure {
            documents_folder: format!("{}/documents", default_project_path),
            index_folder: format!("{}/search_index", default_project_path),
            metadata_folder: format!("{}/metadata", default_project_path),
            cache_folder: format!("{}/cache", default_project_path),
            backup_folder: format!("{}/backups", default_project_path),
            cultural_contexts_folder: format!("{}/cultural_contexts", default_project_path),
            educational_resources_folder: format!("{}/educational_resources", default_project_path),
            community_content_folder: format!("{}/community_content", default_project_path),
        },
        search: SearchSettings {
            case_sensitive: false,
            include_metadata: true,
            include_tags: true,
            include_content: true,
            respect_cultural_boundaries: true,
            show_cultural_education: true,
            enable_community_validation: true,
            max_search_results: 100,
            search_debounce_ms: 300,
            enable_search_suggestions: true,
        },
        theme: "auto".to_string(),
        language: "en".to_string(),
        accessibility: AccessibilitySettings {
            high_contrast: false,
            reduced_motion: false,
            screen_reader_optimized: false,
        },
        cultural: CulturalSettings {
            preferred_cultural_contexts: vec![],
            educational_level: "beginner".to_string(),
            community_memberships: vec![],
        },
    }
}

#[tauri::command]
pub async fn load_app_settings(app_handle: AppHandle) -> Result<AppSettings, String> {
    info!("Loading app settings");
    
    let settings_path = get_settings_path(&app_handle)
        .map_err(|e| format!("Failed to get settings path: {}", e))?;

    if !settings_path.exists() {
        info!("Settings file not found, creating default settings");
        let default_settings = get_default_settings();
        
        // Save default settings
        let settings_json = serde_json::to_string_pretty(&default_settings)
            .map_err(|e| format!("Failed to serialize default settings: {}", e))?;
        
        fs::write(&settings_path, settings_json)
            .map_err(|e| format!("Failed to write default settings: {}", e))?;
        
        return Ok(default_settings);
    }

    let settings_content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings file: {}", e))?;

    let settings: AppSettings = serde_json::from_str(&settings_content)
        .unwrap_or_else(|e| {
            error!("Failed to parse settings, using defaults: {}", e);
            get_default_settings()
        });

    info!("App settings loaded successfully");
    Ok(settings)
}

#[tauri::command]
pub async fn save_app_settings(app_handle: AppHandle, settings: AppSettings) -> Result<(), String> {
    info!("Saving app settings");
    
    let settings_path = get_settings_path(&app_handle)
        .map_err(|e| format!("Failed to get settings path: {}", e))?;

    let settings_json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&settings_path, settings_json)
        .map_err(|e| format!("Failed to write settings file: {}", e))?;

    info!("App settings saved successfully");
    Ok(())
} 