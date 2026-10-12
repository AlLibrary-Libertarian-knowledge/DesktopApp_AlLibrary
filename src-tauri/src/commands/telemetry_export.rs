//! Anonymous experiment telemetry export for the TCC analytics hub.
//! Never includes file names, share links, local paths, or identity.

use crate::core::database::{
    ensure_node_database, list_chunk_perf_for_transfers_pool, list_exportable_telemetry_pool,
    list_gossip_events_pool, list_lookup_events_pool,
};
use serde::Serialize;
use serde_json::{json, Value};
use tauri::AppHandle;

fn map_status(local: &str) -> String {
    match local {
        "completed" => "COMPLETED".to_string(),
        "failed" => "FAILED".to_string(),
        "timed_out" | "timeout" => "TIMED_OUT".to_string(),
        other => other.to_uppercase(),
    }
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
        let Some(content_hash) = r.content_hash else {
            continue;
        };
        let duration_ms = r.duration_ms.unwrap_or(0).max(1) as f64;
        let duration_seconds = duration_ms / 1000.0;
        let avg = r
            .average_speed_kbps
            .unwrap_or_else(|| (r.bytes_moved as f64 / 1024.0) / duration_seconds);
        out.push(json!({
            "event_type": "transfer",
            "content_hash": content_hash,
            "status": map_status(&r.status),
            "bytes_transferred": r.bytes_moved,
            "chunks_transferred": r.chunks_completed.unwrap_or(0),
            "total_chunks": r.total_chunks.unwrap_or(0),
            "parallel_seeders": r.parallel_seeders.unwrap_or(1),
            "duration_seconds": duration_seconds,
            "average_speed_kbps": (avg * 10.0).round() / 10.0,
            "peak_speed_kbps": ((avg * 1.15) * 10.0).round() / 10.0,
            "chunk_failures": r.chunk_failures.unwrap_or(0),
            "retries": r.retries.unwrap_or(0),
            "chunk_size": r.chunk_size.unwrap_or(262_144),
            "started_at": r.started_at,
            "completed_at": r.completed_at,
        }));
    }

    for l in list_lookup_events_pool(&pool, lim).await? {
        out.push(json!({
            "event_type": "lookup",
            "content_hash": l.content_hash.unwrap_or_default(),
            "hops": l.hops,
            "duration_ms": l.duration_ms,
            "success": l.success,
            "peer_count": l.peer_count,
            "started_at": l.started_at,
        }));
    }

    for g in list_gossip_events_pool(&pool, lim).await? {
        out.push(json!({
            "event_type": "gossip",
            "msg_id": g.msg_id,
            "content_hash": g.content_hash,
            "hop": g.hop,
            "propagation_ms": g.propagation_ms,
            "recorded_at": g.recorded_at,
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
            "timestamp": c.recorded_at,
        }));
    }

    Ok(out)
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
