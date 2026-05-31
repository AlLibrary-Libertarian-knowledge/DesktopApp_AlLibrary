use crate::core::database::document_registry::{list_recent_local_documents_pool, LocalDocumentSummary};
use crate::core::database::network_cache::{
    list_browse_categories_pool, list_network_peers_pool, list_recent_network_files_pool,
    list_trending_network_files_pool, search_network_cached_pool, BrowseCategoryRow,
};
use crate::core::database::models::NetworkPeerRow;
use crate::core::database::node_db::ensure_node_database;
use crate::onion_share::tracker_proto::NetworkFile;
use serde::Serialize;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize)]
pub struct NetworkPeerDto {
    pub node_id: String,
    pub onion: String,
    pub last_seen_at: String,
}

impl From<NetworkPeerRow> for NetworkPeerDto {
    fn from(row: NetworkPeerRow) -> Self {
        Self {
            node_id: row.node_id,
            onion: row.onion,
            last_seen_at: row.last_seen_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowseCategoryDto {
    pub id: String,
    pub name: String,
    pub document_count: u32,
    pub source: String,
}

impl From<BrowseCategoryRow> for BrowseCategoryDto {
    fn from(row: BrowseCategoryRow) -> Self {
        Self {
            id: row.id,
            name: row.name,
            document_count: row.document_count,
            source: row.source,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalDocumentDto {
    pub id: String,
    pub title: String,
    pub file_type: String,
    pub file_size: i64,
    pub local_path: Option<String>,
    pub content_hash: Option<String>,
    pub is_treated: bool,
    pub created_at: String,
}

impl From<LocalDocumentSummary> for LocalDocumentDto {
    fn from(row: LocalDocumentSummary) -> Self {
        Self {
            id: row.id,
            title: row.title,
            file_type: row.file_type,
            file_size: row.file_size,
            local_path: row.local_path,
            content_hash: row.content_hash,
            is_treated: row.is_treated,
            created_at: row.created_at,
        }
    }
}

#[tauri::command]
pub async fn search_network_cached(
    app_handle: AppHandle,
    query: String,
    limit: Option<u32>,
) -> Result<Vec<NetworkFile>, String> {
    let pool = ensure_node_database(&app_handle).await?;
    search_network_cached_pool(&pool, &query, limit.unwrap_or(100)).await
}

#[tauri::command]
pub async fn list_network_peers(app_handle: AppHandle) -> Result<Vec<NetworkPeerDto>, String> {
    let pool = ensure_node_database(&app_handle).await?;
    let rows = list_network_peers_pool(&pool).await?;
    Ok(rows.into_iter().map(NetworkPeerDto::from).collect())
}

#[tauri::command]
pub async fn list_trending_network_files(
    app_handle: AppHandle,
    limit: Option<u32>,
) -> Result<Vec<NetworkFile>, String> {
    let pool = ensure_node_database(&app_handle).await?;
    list_trending_network_files_pool(&pool, limit.unwrap_or(50)).await
}

#[tauri::command]
pub async fn list_recent_network_files(
    app_handle: AppHandle,
    since_days: Option<u32>,
    limit: Option<u32>,
) -> Result<Vec<NetworkFile>, String> {
    let pool = ensure_node_database(&app_handle).await?;
    list_recent_network_files_pool(&pool, since_days.unwrap_or(7), limit.unwrap_or(100)).await
}

#[tauri::command]
pub async fn list_browse_categories(app_handle: AppHandle) -> Result<Vec<BrowseCategoryDto>, String> {
    let pool = ensure_node_database(&app_handle).await?;
    let rows = list_browse_categories_pool(&pool).await?;
    Ok(rows.into_iter().map(BrowseCategoryDto::from).collect())
}

#[tauri::command]
pub async fn list_recent_local_documents(
    app_handle: AppHandle,
    since_days: Option<u32>,
    limit: Option<u32>,
) -> Result<Vec<LocalDocumentDto>, String> {
    let pool = ensure_node_database(&app_handle).await?;
    let rows = list_recent_local_documents_pool(&pool, since_days.unwrap_or(7), limit.unwrap_or(100)).await?;
    Ok(rows.into_iter().map(LocalDocumentDto::from).collect())
}
