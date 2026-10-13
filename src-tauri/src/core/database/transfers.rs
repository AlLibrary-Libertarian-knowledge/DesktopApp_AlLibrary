use chrono::Utc;
use sqlx::{Row, SqlitePool};

#[derive(Debug, Clone)]
pub struct TransferRow {
    pub id: String,
    pub direction: String,
    pub link: String,
    pub name: Option<String>,
    pub status: String,
    pub progress: f64,
    pub bytes_moved: i64,
    pub local_path: Option<String>,
    pub error: Option<String>,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub duration_ms: Option<i64>,
    pub total_chunks: Option<i64>,
    pub chunks_completed: Option<i64>,
    pub parallel_seeders: Option<i64>,
    pub chunk_failures: Option<i64>,
    pub chunk_size: Option<i64>,
    pub average_speed_kbps: Option<f64>,
    pub content_hash: Option<String>,
    pub retries: Option<i64>,
}

/// Metrics written when a transfer finishes (success or failure with partial progress).
#[derive(Debug, Clone, Default)]
pub struct TransferTelemetry {
    pub bytes_moved: i64,
    pub duration_ms: Option<i64>,
    pub total_chunks: Option<i64>,
    pub chunks_completed: Option<i64>,
    pub parallel_seeders: Option<i64>,
    pub chunk_failures: Option<i64>,
    pub chunk_size: Option<i64>,
    pub average_speed_kbps: Option<f64>,
    pub content_hash: Option<String>,
    pub retries: Option<i64>,
    /// First-byte / circuit latency (ms) for Analytics Cap.6 Tor KPIs.
    pub tor_circuit_latency_ms: Option<f64>,
}

fn map_transfer_row(row: &sqlx::sqlite::SqliteRow) -> Result<TransferRow, String> {
    Ok(TransferRow {
        id: row.try_get("id").map_err(|e| e.to_string())?,
        direction: row.try_get("direction").map_err(|e| e.to_string())?,
        link: row.try_get("link").map_err(|e| e.to_string())?,
        name: row.try_get("name").map_err(|e| e.to_string())?,
        status: row.try_get("status").map_err(|e| e.to_string())?,
        progress: row.try_get("progress").map_err(|e| e.to_string())?,
        bytes_moved: row.try_get("bytes_moved").map_err(|e| e.to_string())?,
        local_path: row.try_get("local_path").map_err(|e| e.to_string())?,
        error: row.try_get("error").map_err(|e| e.to_string())?,
        started_at: row.try_get("started_at").map_err(|e| e.to_string())?,
        completed_at: row.try_get("completed_at").map_err(|e| e.to_string())?,
        duration_ms: row.try_get("duration_ms").map_err(|e| e.to_string())?,
        total_chunks: row.try_get("total_chunks").map_err(|e| e.to_string())?,
        chunks_completed: row.try_get("chunks_completed").map_err(|e| e.to_string())?,
        parallel_seeders: row.try_get("parallel_seeders").map_err(|e| e.to_string())?,
        chunk_failures: row.try_get("chunk_failures").map_err(|e| e.to_string())?,
        chunk_size: row.try_get("chunk_size").map_err(|e| e.to_string())?,
        average_speed_kbps: row.try_get("average_speed_kbps").map_err(|e| e.to_string())?,
        content_hash: row.try_get("content_hash").map_err(|e| e.to_string())?,
        retries: row.try_get::<Option<i64>, _>("retries").unwrap_or(None),
    })
}

const TRANSFER_SELECT: &str = r#"
    SELECT id, direction, link, name, status, progress, bytes_moved, local_path, error,
           started_at, completed_at, duration_ms, total_chunks, chunks_completed,
           parallel_seeders, chunk_failures, chunk_size, average_speed_kbps, content_hash,
           retries
    FROM transfers
"#;

pub async fn insert_transfer_pool(
    pool: &SqlitePool,
    id: &str,
    link: &str,
    name: Option<&str>,
) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO transfers (id, direction, link, name, status, progress, bytes_moved, started_at)
        VALUES (?, 'inbound', ?, ?, 'active', 0, 0, ?)
        "#,
    )
    .bind(id)
    .bind(link)
    .bind(name)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to insert transfer: {e}"))?;
    Ok(())
}

pub async fn update_transfer_progress_pool(
    pool: &SqlitePool,
    id: &str,
    progress: f64,
    bytes_moved: i64,
) -> Result<(), String> {
    sqlx::query(
        r#"
        UPDATE transfers SET progress = ?, bytes_moved = ? WHERE id = ?
        "#,
    )
    .bind(progress)
    .bind(bytes_moved)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to update transfer progress: {e}"))?;
    Ok(())
}

pub async fn complete_transfer_pool(
    pool: &SqlitePool,
    id: &str,
    status: &str,
    progress: f64,
    local_path: Option<&str>,
    error: Option<&str>,
) -> Result<(), String> {
    complete_transfer_with_telemetry_pool(pool, id, status, progress, local_path, error, None).await
}

pub async fn complete_transfer_with_telemetry_pool(
    pool: &SqlitePool,
    id: &str,
    status: &str,
    progress: f64,
    local_path: Option<&str>,
    error: Option<&str>,
    telemetry: Option<&TransferTelemetry>,
) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    let t = telemetry.cloned().unwrap_or_default();
    sqlx::query(
        r#"
        UPDATE transfers SET
            status = ?,
            progress = ?,
            local_path = ?,
            error = ?,
            completed_at = ?,
            bytes_moved = CASE WHEN ? > 0 THEN ? ELSE bytes_moved END,
            duration_ms = ?,
            total_chunks = ?,
            chunks_completed = ?,
            parallel_seeders = ?,
            chunk_failures = ?,
            chunk_size = ?,
            average_speed_kbps = ?,
            content_hash = COALESCE(?, content_hash),
            retries = COALESCE(?, retries)
        WHERE id = ?
        "#,
    )
    .bind(status)
    .bind(progress)
    .bind(local_path)
    .bind(error)
    .bind(&now)
    .bind(t.bytes_moved)
    .bind(t.bytes_moved)
    .bind(t.duration_ms)
    .bind(t.total_chunks)
    .bind(t.chunks_completed)
    .bind(t.parallel_seeders)
    .bind(t.chunk_failures)
    .bind(t.chunk_size)
    .bind(t.average_speed_kbps)
    .bind(t.content_hash.as_deref())
    .bind(t.retries)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to complete transfer: {e}"))?;
    Ok(())
}

pub async fn list_recent_transfers_pool(
    pool: &SqlitePool,
    limit: u32,
) -> Result<Vec<TransferRow>, String> {
    let rows = sqlx::query(&format!(
        "{TRANSFER_SELECT} ORDER BY started_at DESC LIMIT ?"
    ))
    .bind(limit as i64)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list transfers: {e}"))?;

    rows.iter().map(map_transfer_row).collect()
}

/// Completed transfers with measurement fields — safe for anonymous analytics export
/// (no link, path, or file name).
pub async fn list_exportable_telemetry_pool(
    pool: &SqlitePool,
    limit: u32,
) -> Result<Vec<TransferRow>, String> {
    let rows = sqlx::query(&format!(
        "{TRANSFER_SELECT}
         WHERE duration_ms IS NOT NULL AND content_hash IS NOT NULL
         ORDER BY completed_at DESC
         LIMIT ?"
    ))
    .bind(limit as i64)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list telemetry: {e}"))?;

    rows.iter().map(map_transfer_row).collect()
}

pub async fn transfer_metrics_pool(pool: &SqlitePool) -> Result<(u32, u64, u32), String> {
    let active: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM transfers WHERE status = 'active'",
    )
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    let bytes_5m: i64 = sqlx::query_scalar(
        r#"
        SELECT COALESCE(SUM(bytes_moved), 0) FROM transfers
        WHERE started_at >= datetime('now', '-5 minutes')
        "#,
    )
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    let completed_24h: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*) FROM transfers
        WHERE status = 'completed' AND completed_at >= datetime('now', '-1 day')
        "#,
    )
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    Ok((
        active.max(0) as u32,
        bytes_5m.max(0) as u64,
        completed_24h.max(0) as u32,
    ))
}
