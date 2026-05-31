//! Auto-seed treated documents to onion share (default ON; per-file opt-out via is_shared).

use std::collections::HashSet;
use std::path::PathBuf;

use serde_json::json;
use tauri::{AppHandle, Emitter, Manager};
use tracing::{info, warn};
use uuid::Uuid;

use crate::commands::onion_state::{OnionShareState, SeedNotifySender};
use crate::core::database::{
    delete_local_share_by_path_pool, ensure_node_database, list_local_shares_pool,
    local_share_disk_path_map_pool, set_document_shared_pool, upsert_local_share_pool,
    document_seed_enabled_pool, list_seed_eligible_paths_pool,
};
use crate::core::database::activity_log::insert_activity_pool;
use crate::core::database::models::LocalShareRow;
use crate::core::document::seeding::ensure_seeding_allowed;
use crate::onion_share::config::AppConfig;
use chrono::Utc;

const DEFAULT_CHUNK: usize = 256 * 1024;

fn normalize_path(p: &str) -> String {
    p.replace('\\', "/").to_lowercase()
}

async fn enqueue_pending(state: &OnionShareState, path: &str) {
    let mut pending = state.pending_seeds.lock().await;
    let norm = normalize_path(path);
    if !pending.iter().any(|p| normalize_path(&p.to_string_lossy()) == norm) {
        pending.push(PathBuf::from(path));
    }
}

pub async fn ensure_document_seeded(
    app: &AppHandle,
    state: &OnionShareState,
    path: &str,
) -> Result<(), String> {
    if !AppConfig::load().share_publicly {
        return Ok(());
    }

    let pool = ensure_node_database(app).await?;
    let enabled = document_seed_enabled_pool(&pool, path).await?;
    if !enabled {
        return Ok(());
    }

    let p = PathBuf::from(path);
    ensure_seeding_allowed(&p).await?;

    let guard = state.handle.lock().await;
    let Some(ref srv) = *guard else {
        drop(guard);
        enqueue_pending(state, path).await;
        info!("Queued seed (onion not ready): {path}");
        return Ok(());
    };

    let disk_path = path.to_string();
    if local_share_disk_path_map_pool(&pool)
        .await
        .unwrap_or_default()
        .contains_key(&disk_path)
    {
        return Ok(());
    }

    let share = srv
        .add_file(p, DEFAULT_CHUNK)
        .await
        .map_err(|e| e.to_string())?;
    let link = srv.link_for(&share);
    drop(guard);

    upsert_local_share_pool(
        &pool,
        &LocalShareRow {
            file_id: share.file_id.to_string(),
            name: share.file_name.clone(),
            size_bytes: share.file_size as i64,
            content_hash: share.content_hash.clone(),
            link: link.clone(),
            disk_path: disk_path.clone(),
            created_at: Utc::now().to_rfc3339(),
        },
    )
    .await?;

    let payload = json!({
        "title": share.file_name,
        "link": link,
        "name": share.file_name,
    })
    .to_string();
    let _ = insert_activity_pool(
        &pool,
        "share",
        Some(&share.content_hash),
        Some(&payload),
    )
    .await;

    let _ = app.emit("network-presence-changed", json!({}));
    info!("Auto-seeded document: {path}");
    Ok(())
}

pub async fn unseed_document(
    app: &AppHandle,
    state: &OnionShareState,
    path: &str,
) -> Result<(), String> {
    let pool = ensure_node_database(app).await?;
    set_document_shared_pool(&pool, path, false).await?;

    let disk_map = local_share_disk_path_map_pool(&pool).await.unwrap_or_default();
    let file_id = disk_map.get(path).cloned();

    if let Some(fid) = file_id {
        if let Ok(uuid) = Uuid::parse_str(&fid) {
            let guard = state.handle.lock().await;
            if let Some(ref srv) = *guard {
                srv.remove_file(uuid).await;
            }
        }
        delete_local_share_by_path_pool(&pool, path).await?;
    }

    let _ = app.emit("network-presence-changed", json!({}));
    Ok(())
}

pub async fn flush_pending_seeds(app: &AppHandle, state: &OnionShareState) {
    let paths: Vec<PathBuf> = {
        let mut pending = state.pending_seeds.lock().await;
        std::mem::take(&mut *pending)
    };
    for path in paths {
        let path_str = path.to_string_lossy().to_string();
        if let Err(e) = ensure_document_seeded(app, state, &path_str).await {
            warn!("Pending seed failed for {path_str}: {e}");
        }
    }
}

pub async fn sync_all_enabled_seeds(app: &AppHandle, state: &OnionShareState) -> Result<u32, String> {
    if !AppConfig::load().share_publicly {
        return Ok(0);
    }

    let pool = ensure_node_database(app).await?;
    let paths = list_seed_eligible_paths_pool(&pool).await?;
    let mut count = 0u32;
    for path in paths {
        if ensure_document_seeded(app, state, &path).await.is_ok() {
            count += 1;
        }
    }
    flush_pending_seeds(app, state).await;
    Ok(count)
}

pub fn spawn_seed_notify_listener(
    app: AppHandle,
    state: OnionShareState,
    mut rx: tokio::sync::mpsc::UnboundedReceiver<String>,
) {
    tauri::async_runtime::spawn(async move {
        while let Some(path) = rx.recv().await {
            if let Err(e) = ensure_document_seeded(&app, &state, &path).await {
                warn!("Auto-seed after treat failed for {path}: {e}");
            }
        }
    });
}

pub fn notify_document_treated(app: &AppHandle, path: &str) {
    if let Some(sender) = app.try_state::<SeedNotifySender>() {
        let _ = sender.0.send(path.to_string());
    }
}

#[tauri::command]
pub async fn sync_all_enabled_seeds_cmd(
    app: AppHandle,
    state: tauri::State<'_, OnionShareState>,
) -> Result<u32, String> {
    sync_all_enabled_seeds(&app, state.inner()).await
}

#[tauri::command]
pub async fn set_document_seed_enabled(
    app: AppHandle,
    state: tauri::State<'_, OnionShareState>,
    file_path: String,
    enabled: bool,
) -> Result<crate::commands::documents::DocumentInfo, String> {
    let pool = ensure_node_database(&app).await?;
    set_document_shared_pool(&pool, &file_path, enabled).await?;

    if enabled {
        ensure_document_seeded(&app, state.inner(), &file_path).await?;
    } else {
        unseed_document(&app, state.inner(), &file_path).await?;
    }

    crate::commands::documents::get_document_info(app, file_path).await
}

/// Remove stale local_shares rows whose disk_path is no longer seed-eligible.
pub async fn reconcile_local_shares(app: &AppHandle, state: &OnionShareState) {
    let pool = match ensure_node_database(app).await {
        Ok(p) => p,
        Err(_) => return,
    };
    let eligible: HashSet<String> = list_seed_eligible_paths_pool(&pool)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|p| normalize_path(&p))
        .collect();

    let rows = list_local_shares_pool(&pool).await.unwrap_or_default();
    for row in rows {
        if !eligible.contains(&normalize_path(&row.disk_path)) {
            if let Ok(uuid) = Uuid::parse_str(&row.file_id) {
                let guard = state.handle.lock().await;
                if let Some(ref srv) = *guard {
                    srv.remove_file(uuid).await;
                }
            }
            let _ = delete_local_share_by_path_pool(&pool, &row.disk_path).await;
        }
    }
}
