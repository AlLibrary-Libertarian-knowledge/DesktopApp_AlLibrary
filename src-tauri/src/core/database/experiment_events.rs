use chrono::Utc;
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct LookupEventRow {
    pub id: String,
    pub content_hash: Option<String>,
    pub hops: i64,
    pub duration_ms: i64,
    pub success: bool,
    pub peer_count: i64,
    pub started_at: String,
}

#[derive(Debug, Clone)]
pub struct GossipEventRow {
    pub id: String,
    pub msg_id: String,
    pub content_hash: String,
    pub hop: i64,
    pub propagation_ms: i64,
    pub recorded_at: String,
}

#[derive(Debug, Clone)]
pub struct ChunkPerfRow {
    pub id: String,
    pub transfer_id: String,
    pub chunk_index: i64,
    pub chunk_size_bytes: i64,
    pub latency_ms: f64,
    pub transfer_time_ms: f64,
    pub verification_passed: bool,
    pub retry_count: i64,
    pub recorded_at: String,
}

pub async fn insert_lookup_event_pool(
    pool: &SqlitePool,
    content_hash: Option<&str>,
    hops: u32,
    duration_ms: u64,
    success: bool,
    peer_count: u32,
) -> Result<String, String> {
    let id = Uuid::new_v4().to_string();
    let started_at = Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO lookup_events (id, content_hash, hops, duration_ms, success, peer_count, started_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(content_hash)
    .bind(hops as i64)
    .bind(duration_ms as i64)
    .bind(if success { 1 } else { 0 })
    .bind(peer_count as i64)
    .bind(&started_at)
    .execute(pool)
    .await
    .map_err(|e| format!("insert lookup: {e}"))?;
    Ok(id)
}

pub async fn insert_gossip_event_pool(
    pool: &SqlitePool,
    msg_id: &str,
    content_hash: &str,
    hop: u32,
    propagation_ms: u64,
) -> Result<String, String> {
    let id = Uuid::new_v4().to_string();
    let recorded_at = Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO gossip_events (id, msg_id, content_hash, hop, propagation_ms, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(msg_id)
    .bind(content_hash)
    .bind(hop as i64)
    .bind(propagation_ms as i64)
    .bind(&recorded_at)
    .execute(pool)
    .await
    .map_err(|e| format!("insert gossip: {e}"))?;
    Ok(id)
}

pub async fn insert_chunk_perf_pool(
    pool: &SqlitePool,
    transfer_id: &str,
    chunk_index: u64,
    chunk_size_bytes: u32,
    latency_ms: f64,
    transfer_time_ms: f64,
    verification_passed: bool,
    retry_count: u32,
) -> Result<(), String> {
    let id = Uuid::new_v4().to_string();
    let recorded_at = Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO chunk_perf_logs
        (id, transfer_id, chunk_index, chunk_size_bytes, latency_ms, transfer_time_ms,
         verification_passed, retry_count, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(transfer_id)
    .bind(chunk_index as i64)
    .bind(chunk_size_bytes as i64)
    .bind(latency_ms)
    .bind(transfer_time_ms)
    .bind(if verification_passed { 1 } else { 0 })
    .bind(retry_count as i64)
    .bind(&recorded_at)
    .execute(pool)
    .await
    .map_err(|e| format!("insert chunk perf: {e}"))?;
    Ok(())
}

pub async fn list_lookup_events_pool(
    pool: &SqlitePool,
    limit: u32,
) -> Result<Vec<LookupEventRow>, String> {
    let rows = sqlx::query(
        r#"
        SELECT id, content_hash, hops, duration_ms, success, peer_count, started_at
        FROM lookup_events ORDER BY started_at DESC LIMIT ?
        "#,
    )
    .bind(limit as i64)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("list lookup: {e}"))?;

    Ok(rows
        .iter()
        .map(|r| LookupEventRow {
            id: r.get("id"),
            content_hash: r.get("content_hash"),
            hops: r.get("hops"),
            duration_ms: r.get("duration_ms"),
            success: r.get::<i64, _>("success") != 0,
            peer_count: r.get("peer_count"),
            started_at: r.get("started_at"),
        })
        .collect())
}

pub async fn list_gossip_events_pool(
    pool: &SqlitePool,
    limit: u32,
) -> Result<Vec<GossipEventRow>, String> {
    let rows = sqlx::query(
        r#"
        SELECT id, msg_id, content_hash, hop, propagation_ms, recorded_at
        FROM gossip_events ORDER BY recorded_at DESC LIMIT ?
        "#,
    )
    .bind(limit as i64)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("list gossip: {e}"))?;

    Ok(rows
        .iter()
        .map(|r| GossipEventRow {
            id: r.get("id"),
            msg_id: r.get("msg_id"),
            content_hash: r.get("content_hash"),
            hop: r.get("hop"),
            propagation_ms: r.get("propagation_ms"),
            recorded_at: r.get("recorded_at"),
        })
        .collect())
}

pub async fn list_chunk_perf_for_transfers_pool(
    pool: &SqlitePool,
    limit: u32,
) -> Result<Vec<ChunkPerfRow>, String> {
    let rows = sqlx::query(
        r#"
        SELECT id, transfer_id, chunk_index, chunk_size_bytes, latency_ms, transfer_time_ms,
               verification_passed, retry_count, recorded_at
        FROM chunk_perf_logs ORDER BY recorded_at DESC LIMIT ?
        "#,
    )
    .bind(limit as i64)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("list chunk perf: {e}"))?;

    Ok(rows
        .iter()
        .map(|r| ChunkPerfRow {
            id: r.get("id"),
            transfer_id: r.get("transfer_id"),
            chunk_index: r.get("chunk_index"),
            chunk_size_bytes: r.get("chunk_size_bytes"),
            latency_ms: r.get("latency_ms"),
            transfer_time_ms: r.get("transfer_time_ms"),
            verification_passed: r.get::<i64, _>("verification_passed") != 0,
            retry_count: r.get("retry_count"),
            recorded_at: r.get("recorded_at"),
        })
        .collect())
}
