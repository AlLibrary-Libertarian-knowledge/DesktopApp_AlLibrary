use crate::core::database::resolve_database_path;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tracing::{error, info};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolvedPaths {
    #[serde(rename = "databaseFile")]
    pub database_file: String,
    #[serde(rename = "documentsFolder")]
    pub documents_folder: String,
    #[serde(rename = "downloadFolder")]
    pub download_folder: String,
}

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
    #[serde(rename = "resolvedPaths", skip_serializing, default)]
    pub resolved_paths: Option<ResolvedPaths>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSettings {
    #[serde(rename = "projectFolderPath")]
    pub project_folder_path: String,
    #[serde(rename = "downloadFolderPath", default)]
    pub download_folder_path: String,
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

fn default_download_folder(project_root: &str) -> String {
    PathBuf::from(project_root.trim())
        .join("downloads")
        .to_string_lossy()
        .into_owned()
}

fn derive_folder_structure(project_root: &str) -> FolderStructure {
    let root = PathBuf::from(project_root.trim());
    FolderStructure {
        documents_folder: root.join("documents").to_string_lossy().into_owned(),
        index_folder: root.join("search_index").to_string_lossy().into_owned(),
        metadata_folder: root.join("metadata").to_string_lossy().into_owned(),
        cache_folder: root.join("cache").to_string_lossy().into_owned(),
        backup_folder: root.join("backups").to_string_lossy().into_owned(),
        cultural_contexts_folder: root.join("cultural_contexts").to_string_lossy().into_owned(),
        educational_resources_folder: root
            .join("educational_resources")
            .to_string_lossy()
            .into_owned(),
        community_content_folder: root
            .join("community_content")
            .to_string_lossy()
            .into_owned(),
    }
}

fn apply_project_root(settings: &mut AppSettings, project_root: &str, download_folder: &str) {
    let project_root = project_root.trim();
    let download_folder = download_folder.trim();
    settings.project.project_folder_path = project_root.to_string();
    settings.project.download_folder_path = download_folder.to_string();
    settings.folder_structure = derive_folder_structure(project_root);
    settings.project.search_index_path = settings.folder_structure.index_folder.clone();
}

fn subfolder_paths(settings: &AppSettings) -> Vec<&str> {
    vec![
        settings.folder_structure.documents_folder.as_str(),
        settings.folder_structure.index_folder.as_str(),
        settings.folder_structure.metadata_folder.as_str(),
        settings.folder_structure.cache_folder.as_str(),
        settings.folder_structure.backup_folder.as_str(),
        settings.folder_structure.cultural_contexts_folder.as_str(),
        settings.folder_structure.educational_resources_folder.as_str(),
        settings.folder_structure.community_content_folder.as_str(),
        settings.project.download_folder_path.as_str(),
    ]
}

fn create_project_subfolders(settings: &AppSettings) -> Result<(), String> {
    for path in subfolder_paths(settings) {
        if path.is_empty() {
            continue;
        }
        fs::create_dir_all(path)
            .map_err(|e| format!("Failed to create directory {}: {}", path, e))?;
    }
    Ok(())
}

fn get_default_settings() -> AppSettings {
    let home_dir = dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("/"))
        .to_string_lossy()
        .to_string();
    
    let default_project_path = format!("{}/AlLibrary", home_dir);
    let default_download = default_download_folder(&default_project_path);
    let folder_structure = derive_folder_structure(&default_project_path);

    AppSettings {
        project: ProjectSettings {
            project_folder_path: default_project_path.clone(),
            download_folder_path: default_download,
            default_project_name: "AlLibrary".to_string(),
            auto_create_subfolders: true,
            search_index_path: folder_structure.index_folder.clone(),
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
        folder_structure,
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
        resolved_paths: None,
    }
}

fn populate_resolved_paths(settings: &mut AppSettings) {
    settings.resolved_paths = Some(ResolvedPaths {
        database_file: resolve_database_path(settings)
            .to_string_lossy()
            .into_owned(),
        documents_folder: settings.folder_structure.documents_folder.clone(),
        download_folder: settings.project.download_folder_path.clone(),
    });
}

#[tauri::command]
pub async fn load_app_settings(app_handle: AppHandle) -> Result<AppSettings, String> {
    info!("Loading app settings");
    
    let settings_path = get_settings_path(&app_handle)
        .map_err(|e| format!("Failed to get settings path: {}", e))?;

    if !settings_path.exists() {
        info!("Settings file not found, creating default settings");
        let mut default_settings = get_default_settings();
        populate_resolved_paths(&mut default_settings);
        
        let settings_json = serde_json::to_string_pretty(&default_settings)
            .map_err(|e| format!("Failed to serialize default settings: {}", e))?;
        
        fs::write(&settings_path, settings_json)
            .map_err(|e| format!("Failed to write default settings: {}", e))?;
        
        return Ok(default_settings);
    }

    let settings_content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings file: {}", e))?;

    let mut settings: AppSettings = serde_json::from_str(&settings_content)
        .unwrap_or_else(|e| {
            error!("Failed to parse settings, using defaults: {}", e);
            get_default_settings()
        });

    populate_resolved_paths(&mut settings);

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

#[tauri::command]
pub async fn apply_project_paths(
    app_handle: AppHandle,
    project_folder_path: String,
    download_folder_path: Option<String>,
) -> Result<AppSettings, String> {
    let project = project_folder_path.trim();
    if project.is_empty() {
        return Err("project_folder_path cannot be empty".into());
    }

    let mut settings = load_app_settings(app_handle.clone()).await?;
    let download = download_folder_path
        .map(|p| p.trim().to_string())
        .filter(|p| !p.is_empty())
        .unwrap_or_else(|| default_download_folder(project));

    apply_project_root(&mut settings, project, &download);

    if settings.project.auto_create_subfolders {
        create_project_subfolders(&settings)?;
        info!("Project subfolders created under {}", project);
    }

    save_app_settings(app_handle, settings.clone()).await?;
    populate_resolved_paths(&mut settings);
    info!(
        "Applied project paths: project={}, download={}",
        settings.project.project_folder_path, settings.project.download_folder_path
    );
    Ok(settings)
}