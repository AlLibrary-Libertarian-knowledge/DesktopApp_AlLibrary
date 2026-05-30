use crate::core::database::activity_log::{
    delete_activity_pool, insert_activity_pool, list_activity_pool, ActivityEntry,
};
use crate::core::database::node_db::ensure_node_database;
use serde::Serialize;
use tauri::AppHandle;

#[derive(Debug, Serialize)]
pub struct ActivityEntryDto {
    pub id: i64,
    pub kind: String,
    #[serde(rename = "documentId")]
    pub document_id: Option<String>,
    #[serde(rename = "payloadJson")]
    pub payload_json: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

impl From<ActivityEntry> for ActivityEntryDto {
    fn from(entry: ActivityEntry) -> Self {
        Self {
            id: entry.id,
            kind: entry.kind,
            document_id: entry.document_id,
            payload_json: entry.payload_json,
            created_at: entry.created_at,
        }
    }
}

#[tauri::command]
pub async fn log_activity(
    app_handle: AppHandle,
    kind: String,
    document_id: Option<String>,
    payload_json: Option<String>,
) -> Result<i64, String> {
    let pool = ensure_node_database(&app_handle).await?;
    let doc_id = document_id.as_deref().map(|s| s.trim()).filter(|s| !s.is_empty());
    insert_activity_pool(
        &pool,
        kind.trim(),
        doc_id,
        payload_json.as_deref(),
    )
    .await
}

#[tauri::command]
pub async fn list_activity(
    app_handle: AppHandle,
    kind: Option<String>,
    since: Option<String>,
    limit: Option<u32>,
) -> Result<Vec<ActivityEntryDto>, String> {
    let pool = ensure_node_database(&app_handle).await?;
    let kind_filter = kind.as_deref().map(|s| s.trim()).filter(|s| !s.is_empty());
    let since_filter = since.as_deref().map(|s| s.trim()).filter(|s| !s.is_empty());
    let entries = list_activity_pool(&pool, kind_filter, since_filter, limit).await?;
    Ok(entries.into_iter().map(ActivityEntryDto::from).collect())
}

#[tauri::command]
pub async fn delete_activity(app_handle: AppHandle, id: i64) -> Result<(), String> {
    let pool = ensure_node_database(&app_handle).await?;
    delete_activity_pool(&pool, id).await
}
