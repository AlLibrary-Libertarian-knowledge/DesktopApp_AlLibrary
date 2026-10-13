//! Anonymous experiment telemetry export + auto-ingest for the TCC analytics hub.
//! Never includes file names, share links, local paths, or identity.

use crate::core::database::{
    ensure_node_database, list_chunk_perf_for_transfers_pool, list_exportable_telemetry_pool,
    list_gossip_events_pool, list_lookup_events_pool, TransferTelemetry,
};
use crate::onion_share::config::AppConfig;
use chrono::{DateTime, SecondsFormat, Utc};
use serde::Serialize;
use serde_json::{json, Value};
use tauri::AppHandle;
use tracing::{info, warn};

fn map_status(local: &str) -> String {
    match local {
        "completed" => "COMPLETED".to_string(),
        "failed" => "FAILED".to_string(),
        "timed_out" | "timeout" => "TIMED_OUT".to_string(),
        other => other.to_uppercase(),
    }
}

/// Django DateTimeField rejects nanosecond fractions from some Rust rfc3339 strings.
fn normalize_timestamp(raw: &str) -> String {
    let trimmed = raw.trim();
    if let Ok(dt) = DateTime::parse_from_rfc3339(trimmed) {
        return dt
            .with_timezone(&Utc)
            .to_rfc3339_opts(SecondsFormat::Millis, true);
    }
    // Fallback: truncate fractional seconds to millis if present
    if let Some((head, rest)) = trimmed.split_once('.') {
        let digits: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
        let tz = &rest[digits.len()..];
        let millis = format!("{:0<3}", digits.chars().take(3).collect::<String>());
        return format!("{head}.{millis}{tz}");
    }
    trimmed.to_string()
}

fn transfer_row_to_event(r: &crate::core::database::TransferRow) -> Option<Value> {
    let content_hash = r.content_hash.as_ref()?;
    if content_hash.len() < 32 {
        return None;
    }
    let duration_ms = r.duration_ms.unwrap_or(0).max(1) as f64;
    let duration_seconds = duration_ms / 1000.0;
    let avg = r
        .average_speed_kbps
        .unwrap_or_else(|| (r.bytes_moved as f64 / 1024.0) / duration_seconds);
    let started = normalize_timestamp(&r.started_at);
    let completed = r
        .completed_at
        .as_deref()
        .map(normalize_timestamp)
        .unwrap_or_else(|| Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true));
    Some(json!({
        "event_type": "transfer",
        "content_hash": content_hash,
        "status": map_status(&r.status),
        "bytes_transferred": r.bytes_moved,
        "chunks_transferred": r.chunks_completed.unwrap_or(0),
        "total_chunks": r.total_chunks.unwrap_or(0),
        "parallel_seeders": r.parallel_seeders.unwrap_or(1).max(1),
        "duration_seconds": duration_seconds,
        "average_speed_kbps": (avg * 10.0).round() / 10.0,
        "peak_speed_kbps": ((avg * 1.15) * 10.0).round() / 10.0,
        "chunk_failures": r.chunk_failures.unwrap_or(0),
        "retries": r.retries.unwrap_or(0),
        "chunk_size": r.chunk_size.unwrap_or(262_144).max(1024),
        "tor_circuit_latency_ms": 0.0,
        "started_at": started,
        "completed_at": completed,
    }))
}

/// Build a single transfer ingest event from in-memory telemetry (download just finished).
pub fn transfer_telemetry_to_event(
    status: &str,
    telemetry: &TransferTelemetry,
    started_at: &str,
    completed_at: &str,
) -> Option<Value> {
    let content_hash = telemetry.content_hash.as_ref()?;
    if content_hash.len() < 32 {
        return None;
    }
    let duration_ms = telemetry.duration_ms.unwrap_or(0).max(1) as f64;
    let duration_seconds = duration_ms / 1000.0;
    let avg = telemetry
        .average_speed_kbps
        .unwrap_or_else(|| (telemetry.bytes_moved as f64 / 1024.0) / duration_seconds);
    Some(json!({
        "event_type": "transfer",
        "content_hash": content_hash,
        "status": map_status(status),
        "bytes_transferred": telemetry.bytes_moved.max(0),
        "chunks_transferred": telemetry.chunks_completed.unwrap_or(0),
        "total_chunks": telemetry.total_chunks.unwrap_or(0),
        "parallel_seeders": telemetry.parallel_seeders.unwrap_or(1).max(1),
        "duration_seconds": duration_seconds,
        "average_speed_kbps": (avg * 10.0).round() / 10.0,
        "peak_speed_kbps": ((avg * 1.15) * 10.0).round() / 10.0,
        "chunk_failures": telemetry.chunk_failures.unwrap_or(0),
        "retries": telemetry.retries.unwrap_or(0),
        "chunk_size": telemetry.chunk_size.unwrap_or(262_144).max(1024),
        "tor_circuit_latency_ms": telemetry.tor_circuit_latency_ms.unwrap_or(0.0),
        "started_at": normalize_timestamp(started_at),
        "completed_at": normalize_timestamp(completed_at),
    }))
}

pub async fn post_telemetry_events(events: &[Value]) -> Result<u32, String> {
    if events.is_empty() {
        return Ok(0);
    }
    let cfg = AppConfig::load();
    if !cfg.analytics_ingest_enabled {
        return Ok(0);
    }
    let url = cfg.analytics_ingest_url.trim().trim_end_matches('/').to_string();
    if url.is_empty() {
        return Err("analytics_ingest_url is empty".into());
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .map_err(|e| format!("analytics http client: {e}"))?;

    let res = client
        .post(&url)
        .json(events)
        .send()
        .await
        .map_err(|e| format!("analytics ingest request failed: {e}"))?;

    let status = res.status();
    let body = res.text().await.unwrap_or_default();
    if !status.is_success() {
        return Err(format!("analytics ingest HTTP {status}: {body}"));
    }

    let created = serde_json::from_str::<Value>(&body)
        .ok()
        .and_then(|v| v.get("created").and_then(|c| c.as_u64()))
        .unwrap_or(events.len() as u64) as u32;
    info!("analytics ingest ok: created={created} url={url}");
    Ok(created)
}

/// Fire-and-forget ingest for a just-completed download (does not block UX on hub downtime).
pub fn spawn_ingest_transfer_telemetry(
    status: &str,
    telemetry: TransferTelemetry,
    started_at: String,
    completed_at: String,
) {
    let status = status.to_string();
    tauri::async_runtime::spawn(async move {
        let Some(event) =
            transfer_telemetry_to_event(&status, &telemetry, &started_at, &completed_at)
        else {
            warn!("analytics ingest skipped: missing content_hash on transfer");
            return;
        };
        match post_telemetry_events(&[event]).await {
            Ok(n) => info!("auto-ingest transfer events={n}"),
            Err(e) => warn!("auto-ingest transfer failed: {e}"),
        }
    });
}

/// Export typed anonymous events (snake_case) for Django ingest.
#[tauri::command]
pub async fn export_anonymous_telemetry(
    app_handle: AppHandle,
    limit: Option<u32>,
) -> Result<Vec<Value>, String> {
    let pool = ensure_node_database(&app_handle).await?;
    let lim = limit.unwrap_or(200);
    let mut out = Vec::new();

    for r in list_exportable_telemetry_pool(&pool, lim).await? {
        if let Some(ev) = transfer_row_to_event(&r) {
            out.push(ev);
        }
    }

    for l in list_lookup_events_pool(&pool, lim).await? {
        out.push(json!({
            "event_type": "lookup",
            "content_hash": l.content_hash.unwrap_or_default(),
            "hops": l.hops,
            "duration_ms": l.duration_ms,
            "success": l.success,
            "peer_count": l.peer_count,
            "started_at": normalize_timestamp(&l.started_at),
        }));
    }

    for g in list_gossip_events_pool(&pool, lim).await? {
        out.push(json!({
            "event_type": "gossip",
            "msg_id": g.msg_id,
            "content_hash": g.content_hash,
            "hop": g.hop,
            "propagation_ms": g.propagation_ms,
            "recorded_at": normalize_timestamp(&g.recorded_at),
        }));
    }

    for c in list_chunk_perf_for_transfers_pool(&pool, lim).await? {
        out.push(json!({
            "event_type": "chunk",
            "transfer_id": c.transfer_id,
            "chunk_index": c.chunk_index,
            "chunk_size_bytes": c.chunk_size_bytes,
            "latency_ms": c.latency_ms,
            "transfer_time_ms": c.transfer_time_ms,
            "verification_passed": c.verification_passed,
            "retry_count": c.retry_count,
            "timestamp": normalize_timestamp(&c.recorded_at),
        }));
    }

    Ok(out)
}

/// Export local anonymous telemetry and POST to the Analytics hub.
#[tauri::command]
pub async fn push_anonymous_telemetry(
    app_handle: AppHandle,
    limit: Option<u32>,
) -> Result<Value, String> {
    let events = export_anonymous_telemetry(app_handle, limit).await?;
    let created = post_telemetry_events(&events).await?;
    Ok(json!({
        "exported": events.len(),
        "created": created,
        "is_simulated": false,
    }))
}

/// Legacy DTO kept for frontend typing if needed.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnonymousTelemetryEvent {
    pub content_hash: String,
    pub status: String,
    pub bytes_transferred: i64,
    pub chunks_transferred: i64,
    pub total_chunks: i64,
    pub parallel_seeders: i32,
    pub duration_seconds: f64,
    pub average_speed_kbps: f64,
    pub peak_speed_kbps: f64,
    pub chunk_failures: i32,
    pub chunk_size: i32,
    pub started_at: String,
    pub completed_at: Option<String>,
}
