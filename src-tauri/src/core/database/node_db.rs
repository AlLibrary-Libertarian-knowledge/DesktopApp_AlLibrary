use crate::commands::settings::{load_app_settings, AppSettings};
use crate::core::database::migrations;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::AppHandle;
use tokio::sync::OnceCell;
use tracing::{debug, info};

static NODE_DB_POOL: OnceCell<Arc<SqlitePool>> = OnceCell::const_new();

pub fn resolve_database_path(settings: &AppSettings) -> PathBuf {
    PathBuf::from(&settings.folder_structure.documents_folder).join("allibrary.db")
}

pub async fn ensure_node_database(app_handle: &AppHandle) -> Result<SqlitePool, String> {
    if let Some(pool) = NODE_DB_POOL.get() {
        debug!("Reusing cached node database pool");
        return Ok((**pool).clone());
    }

    let settings = load_app_settings(app_handle.clone())
        .await
        .map_err(|e| format!("Failed to load app settings: {e}"))?;

    let documents_folder = PathBuf::from(&settings.folder_structure.documents_folder);
    let database_path = resolve_database_path(&settings);

    info!(
        "Ensuring node database at {}",
        database_path.display()
    );

    std::fs::create_dir_all(&documents_folder)
        .map_err(|e| format!("Failed to create documents folder: {e}"))?;

    let options = SqliteConnectOptions::new()
        .filename(&database_path)
        .create_if_missing(true);
    let pool = SqlitePoolOptions::new()
        .connect_with(options)
        .await
        .map_err(|e| format!("Failed to connect to database: {e}"))?;

    migrations::run_migrations(&pool)
        .await
        .map_err(|e| format!("Failed to run database migrations: {e}"))?;

    info!("Node database ready at {}", database_path.display());

    let _ = NODE_DB_POOL.set(Arc::new(pool.clone()));
    Ok(pool)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::settings::{
        AccessibilitySettings, AppSettings, CulturalSettings, FolderStructure, ProjectSettings,
        SearchSettings,
    };

    fn sample_settings(documents_folder: &str) -> AppSettings {
        AppSettings {
            project: ProjectSettings {
                project_folder_path: "/AlLibrary".into(),
                download_folder_path: "/AlLibrary/downloads".into(),
                default_project_name: "AlLibrary".into(),
                auto_create_subfolders: true,
                search_index_path: "/AlLibrary/search_index".into(),
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
                documents_folder: documents_folder.into(),
                index_folder: format!("{documents_folder}/../search_index"),
                metadata_folder: format!("{documents_folder}/../metadata"),
                cache_folder: format!("{documents_folder}/../cache"),
                backup_folder: format!("{documents_folder}/../backups"),
                cultural_contexts_folder: format!("{documents_folder}/../cultural_contexts"),
                educational_resources_folder: format!("{documents_folder}/../educational_resources"),
                community_content_folder: format!("{documents_folder}/../community_content"),
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
            theme: "auto".into(),
            language: "en".into(),
            accessibility: AccessibilitySettings {
                high_contrast: false,
                reduced_motion: false,
                screen_reader_optimized: false,
            },
            cultural: CulturalSettings {
                preferred_cultural_contexts: vec![],
                educational_level: "beginner".into(),
                community_memberships: vec![],
            },
            resolved_paths: None,
        }
    }

    #[test]
    fn resolve_database_path_uses_documents_folder() {
        let settings = sample_settings("/tmp/AlLibrary/documents");
        let path = resolve_database_path(&settings);
        assert_eq!(
            path,
            PathBuf::from("/tmp/AlLibrary/documents/allibrary.db")
        );
    }
}
