use chrono::Utc;
use sqlx::SqlitePool;

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
}

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
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        UPDATE transfers SET
            status = ?,
            progress = ?,
            local_path = ?,
            error = ?,
            completed_at = ?
        WHERE id = ?
        "#,
    )
    .bind(status)
    .bind(progress)
    .bind(local_path)
    .bind(error)
    .bind(&now)
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
    let rows = sqlx::query_as::<_, (String, String, String, Option<String>, String, f64, i64, Option<String>, Option<String>, String, Option<String>)>(
        r#"
        SELECT id, direction, link, name, status, progress, bytes_moved, local_path, error, started_at, completed_at
        FROM transfers
        ORDER BY started_at DESC
        LIMIT ?
        "#,
    )
    .bind(limit as i64)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list transfers: {e}"))?;

    Ok(rows
        .into_iter()
        .map(
            |(id, direction, link, name, status, progress, bytes_moved, local_path, error, started_at, completed_at)| {
                TransferRow {
                    id,
                    direction,
                    link,
                    name,
                    status,
                    progress,
                    bytes_moved,
                    local_path,
                    error,
                    started_at,
                    completed_at,
                }
            },
        )
        .collect())
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
