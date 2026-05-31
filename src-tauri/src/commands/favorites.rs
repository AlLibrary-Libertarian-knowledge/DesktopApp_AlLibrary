use crate::core::database::favorites::{
    is_favorite_pool, list_favorites_pool, toggle_favorite_pool, FavoriteEntry,
};
use crate::core::database::node_db::ensure_node_database;
use serde::Serialize;
use tauri::AppHandle;

#[derive(Debug, Serialize)]
pub struct FavoriteToggleResult {
    pub success: bool,
    #[serde(rename = "isFavorite")]
    pub is_favorite: bool,
}

#[derive(Debug, Serialize)]
pub struct FavoriteEntryDto {
    #[serde(rename = "documentId")]
    pub document_id: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

impl From<FavoriteEntry> for FavoriteEntryDto {
    fn from(entry: FavoriteEntry) -> Self {
        Self {
            document_id: entry.document_id,
            created_at: entry.created_at,
        }
    }
}

#[tauri::command]
pub async fn is_favorite(app_handle: AppHandle, document_id: String) -> Result<bool, String> {
    let pool = ensure_node_database(&app_handle).await?;
    is_favorite_pool(&pool, document_id.trim()).await
}

#[tauri::command]
pub async fn toggle_favorite(
    app_handle: AppHandle,
    document_id: String,
) -> Result<FavoriteToggleResult, String> {
    let pool = ensure_node_database(&app_handle).await?;
    let is_favorite = toggle_favorite_pool(&pool, document_id.trim()).await?;
    Ok(FavoriteToggleResult {
        success: true,
        is_favorite,
    })
}

#[tauri::command]
pub async fn list_favorites(
    app_handle: AppHandle,
    limit: Option<u32>,
) -> Result<Vec<FavoriteEntryDto>, String> {
    let pool = ensure_node_database(&app_handle).await?;
    let entries = list_favorites_pool(&pool, limit).await?;
    Ok(entries.into_iter().map(FavoriteEntryDto::from).collect())
}
