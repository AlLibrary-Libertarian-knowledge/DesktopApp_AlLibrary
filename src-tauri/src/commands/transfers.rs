use crate::core::database::{ensure_node_database, list_recent_transfers_pool};
use serde::Serialize;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferDto {
    pub id: String,
    pub link: String,
    pub name: Option<String>,
    pub status: String,
    pub progress: f64,
    pub bytes_moved: i64,
    pub local_path: Option<String>,
    pub error: Option<String>,
    pub started_at: String,
    pub completed_at: Option<String>,
}

#[tauri::command]
pub async fn list_recent_transfers(
    app_handle: AppHandle,
    limit: Option<u32>,
) -> Result<Vec<TransferDto>, String> {
    let pool = ensure_node_database(&app_handle).await?;
    let rows = list_recent_transfers_pool(&pool, limit.unwrap_or(50)).await?;
    Ok(rows
        .into_iter()
        .map(|r| TransferDto {
            id: r.id,
            link: r.link,
            name: r.name,
            status: r.status,
            progress: r.progress,
            bytes_moved: r.bytes_moved,
            local_path: r.local_path,
            error: r.error,
            started_at: r.started_at,
            completed_at: r.completed_at,
        })
        .collect())
}
