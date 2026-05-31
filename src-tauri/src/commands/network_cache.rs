use crate::core::database::network_cache::{
    list_network_peers_pool, search_network_cached_pool,
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
