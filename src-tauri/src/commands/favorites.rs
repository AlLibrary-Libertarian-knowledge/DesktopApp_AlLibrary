use crate::core::database::favorites::{
    is_favorite_pool, list_favorites_pool, toggle_favorite_pool,
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
) -> Result<Vec<String>, String> {
    let pool = ensure_node_database(&app_handle).await?;
    list_favorites_pool(&pool, limit).await
}
