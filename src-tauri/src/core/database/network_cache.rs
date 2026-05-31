use crate::core::database::node_db::ensure_node_database;
use crate::core::database::models::{NetworkFilePeerRow, NetworkFileRow, NetworkPeerRow};
use crate::onion_share::tracker_proto::{NetworkFile, NetworkLobby, PeerLocation};
use chrono::{Duration, Utc};
use sqlx::SqlitePool;
use std::collections::{HashMap, HashSet};
use tauri::AppHandle;
use tracing::info;

pub const CACHE_TTL_SECS: i64 = 30;

pub fn cache_cutoff_rfc3339() -> String {
    (Utc::now() - Duration::seconds(CACHE_TTL_SECS)).to_rfc3339()
}

pub async fn sync_lobby_to_db(app_handle: &AppHandle, lobby: &NetworkLobby) -> Result<(), String> {
    let pool = ensure_node_database(app_handle).await?;
    sync_lobby_to_pool(&pool, lobby)
        .await
        .map_err(|e| format!("Failed to sync lobby to database: {e}"))
}

pub async fn sync_lobby_to_pool(pool: &SqlitePool, lobby: &NetworkLobby) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    let cutoff = cache_cutoff_rfc3339();

    let mut tx = pool
        .begin()
        .await
        .map_err(|e| format!("Failed to begin transaction: {e}"))?;

    let mut peer_onions: HashMap<String, String> = HashMap::new();

    for file in &lobby.files {
        for peer in &file.peers {
            peer_onions
                .entry(peer.node_id.clone())
                .or_insert_with(|| peer.onion.clone());
        }
    }

    for (node_id, onion) in &peer_onions {
        sqlx::query(
            r#"
            INSERT INTO network_peers (node_id, onion, last_seen_at)
            VALUES (?, ?, ?)
            ON CONFLICT(node_id) DO UPDATE SET
                onion = excluded.onion,
                last_seen_at = excluded.last_seen_at
            "#,
        )
        .bind(node_id)
        .bind(onion)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to upsert network_peers: {e}"))?;
    }

    for file in &lobby.files {
        sqlx::query(
            r#"
            INSERT INTO network_files (
                content_hash, name, size, canonical_link, peer_count, first_seen_at, last_seen_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(content_hash) DO UPDATE SET
                name = COALESCE(network_files.name, excluded.name),
                size = excluded.size,
                canonical_link = excluded.canonical_link,
                peer_count = excluded.peer_count,
                last_seen_at = excluded.last_seen_at,
                first_seen_at = COALESCE(network_files.first_seen_at, excluded.first_seen_at)
            "#,
        )
        .bind(&file.content_hash)
        .bind(&file.name)
        .bind(file.size as i64)
        .bind(&file.link)
        .bind(file.peer_count as i64)
        .bind(&now)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to upsert network_files: {e}"))?;

        sqlx::query("DELETE FROM network_file_peers WHERE content_hash = ?")
            .bind(&file.content_hash)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to clear network_file_peers: {e}"))?;

        for peer in &file.peers {
            sqlx::query(
                r#"
                INSERT INTO network_file_peers (content_hash, node_id, file_id, link)
                VALUES (?, ?, ?, ?)
                "#,
            )
            .bind(&file.content_hash)
            .bind(&peer.node_id)
            .bind(peer.file_id.to_string())
            .bind(&peer.link)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to insert network_file_peers: {e}"))?;
        }
    }

    sqlx::query(
        "DELETE FROM network_file_peers WHERE content_hash IN (
            SELECT content_hash FROM network_files WHERE last_seen_at < ?
        )",
    )
    .bind(&cutoff)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to prune network_file_peers: {e}"))?;

    sqlx::query("DELETE FROM network_files WHERE last_seen_at < ?")
        .bind(&cutoff)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to prune network_files: {e}"))?;

    sqlx::query("DELETE FROM network_peers WHERE last_seen_at < ?")
        .bind(&cutoff)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to prune network_peers: {e}"))?;

    tx.commit()
        .await
        .map_err(|e| format!("Failed to commit lobby sync: {e}"))?;

    info!(
        "Synced lobby to SQLite: {} files, {} online nodes",
        lobby.files.len(),
        lobby.online_nodes
    );
    Ok(())
}

pub async fn load_lobby_from_db(app_handle: &AppHandle) -> Result<NetworkLobby, String> {
    let pool = ensure_node_database(app_handle).await?;
    load_lobby_from_pool(&pool)
        .await
        .map_err(|e| format!("Failed to load lobby from database: {e}"))
}

pub async fn load_lobby_from_pool(pool: &SqlitePool) -> Result<NetworkLobby, String> {
    let cutoff = cache_cutoff_rfc3339();

    let file_rows: Vec<NetworkFileRow> = sqlx::query_as(
        r#"
        SELECT content_hash, name, size, canonical_link, peer_count, first_seen_at, last_seen_at
        FROM network_files
        WHERE last_seen_at >= ?
        ORDER BY peer_count DESC, name ASC
        "#,
    )
    .bind(&cutoff)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to query network_files: {e}"))?;

    let peer_rows: Vec<(String, String, String, String)> = sqlx::query_as(
        r#"
        SELECT fp.content_hash, fp.node_id, fp.file_id, fp.link
        FROM network_file_peers fp
        INNER JOIN network_files f ON f.content_hash = fp.content_hash
        WHERE f.last_seen_at >= ?
        "#,
    )
    .bind(&cutoff)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to query network_file_peers: {e}"))?;

    let onion_rows: Vec<(String, String)> = sqlx::query_as(
        r#"
        SELECT node_id, onion FROM network_peers WHERE last_seen_at >= ?
        "#,
    )
    .bind(&cutoff)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to query network_peers: {e}"))?;

    let onions: HashMap<String, String> = onion_rows.into_iter().collect();
    let mut peers_by_hash: HashMap<String, Vec<PeerLocation>> = HashMap::new();

    for (content_hash, node_id, file_id, link) in peer_rows {
        let onion = onions
            .get(&node_id)
            .cloned()
            .unwrap_or_else(|| String::new());
        peers_by_hash
            .entry(content_hash)
            .or_default()
            .push(PeerLocation {
                node_id,
                onion,
                file_id: uuid::Uuid::parse_str(&file_id).unwrap_or_else(|_| uuid::Uuid::nil()),
                link,
            });
    }

    let online_nodes: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM network_peers WHERE last_seen_at >= ?",
    )
    .bind(&cutoff)
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    let files = file_rows
        .into_iter()
        .map(|row| NetworkFile {
            name: row.name,
            size: row.size as u64,
            link: row.canonical_link.unwrap_or_default(),
            content_hash: row.content_hash.clone(),
            peer_count: row.peer_count as usize,
            peers: peers_by_hash.remove(&row.content_hash).unwrap_or_default(),
        })
        .collect();

    Ok(NetworkLobby {
        online_nodes: if online_nodes > 0 {
            online_nodes as usize
        } else {
            onions.len()
        },
        files,
    })
}

pub async fn search_network_cached_pool(
    pool: &SqlitePool,
    query: &str,
    limit: u32,
) -> Result<Vec<NetworkFile>, String> {
    let cutoff = cache_cutoff_rfc3339();
    let pattern = format!("%{}%", query.trim());
    let limit = limit.max(1) as i64;

    let file_rows: Vec<NetworkFileRow> = if query.trim().is_empty() {
        sqlx::query_as(
            r#"
            SELECT content_hash, name, size, canonical_link, peer_count, first_seen_at, last_seen_at
            FROM network_files
            WHERE last_seen_at >= ?
            ORDER BY peer_count DESC, name ASC
            LIMIT ?
            "#,
        )
        .bind(&cutoff)
        .bind(limit)
        .fetch_all(pool)
        .await
    } else {
        sqlx::query_as(
            r#"
            SELECT content_hash, name, size, canonical_link, peer_count, first_seen_at, last_seen_at
            FROM network_files
            WHERE last_seen_at >= ?
              AND (name LIKE ? COLLATE NOCASE OR content_hash LIKE ? COLLATE NOCASE)
            ORDER BY peer_count DESC, name ASC
            LIMIT ?
            "#,
        )
        .bind(&cutoff)
        .bind(&pattern)
        .bind(&pattern)
        .bind(limit)
        .fetch_all(pool)
        .await
    }
    .map_err(|e| format!("Failed to search network_files: {e}"))?;

    let mut results = Vec::with_capacity(file_rows.len());
    for row in file_rows {
        let peer_rows: Vec<NetworkFilePeerRow> = sqlx::query_as(
            r#"
            SELECT content_hash, node_id, file_id, link
            FROM network_file_peers
            WHERE content_hash = ?
            "#,
        )
        .bind(&row.content_hash)
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to query file peers: {e}"))?;

        let mut peer_node_ids: HashSet<String> = HashSet::new();
        let mut peers = Vec::new();
        for pr in peer_rows {
            peer_node_ids.insert(pr.node_id.clone());
            let onion: Option<String> = sqlx::query_scalar(
                "SELECT onion FROM network_peers WHERE node_id = ?",
            )
            .bind(&pr.node_id)
            .fetch_optional(pool)
            .await
            .map_err(|e| format!("Failed to query peer onion: {e}"))?;

            peers.push(PeerLocation {
                node_id: pr.node_id,
                onion: onion.unwrap_or_default(),
                file_id: uuid::Uuid::parse_str(&pr.file_id).unwrap_or_else(|_| uuid::Uuid::nil()),
                link: pr.link,
            });
        }

        results.push(NetworkFile {
            name: row.name,
            size: row.size as u64,
            link: row.canonical_link.unwrap_or_default(),
            content_hash: row.content_hash,
            peer_count: if row.peer_count > 0 {
                row.peer_count as usize
            } else {
                peers.len()
            },
            peers,
        });
    }

    Ok(results)
}

pub async fn list_network_peers_pool(pool: &SqlitePool) -> Result<Vec<NetworkPeerRow>, String> {
    let cutoff = cache_cutoff_rfc3339();
    sqlx::query_as(
        r#"
        SELECT node_id, onion, last_seen_at
        FROM network_peers
        WHERE last_seen_at >= ?
        ORDER BY last_seen_at DESC
        "#,
    )
    .bind(&cutoff)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list network_peers: {e}"))
}

#[derive(Debug, Clone)]
pub struct BrowseCategoryRow {
    pub id: String,
    pub name: String,
    pub document_count: u32,
    pub source: String,
}

pub async fn list_trending_network_files_pool(
    pool: &SqlitePool,
    limit: u32,
) -> Result<Vec<NetworkFile>, String> {
    let cutoff = cache_cutoff_rfc3339();
    let file_rows: Vec<NetworkFileRow> = sqlx::query_as(
        r#"
        SELECT content_hash, name, size, canonical_link, peer_count, first_seen_at, last_seen_at
        FROM network_files
        WHERE last_seen_at >= ?
        ORDER BY peer_count DESC, last_seen_at DESC
        LIMIT ?
        "#,
    )
    .bind(&cutoff)
    .bind(limit.max(1) as i64)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list trending network files: {e}"))?;

    rows_to_network_files(pool, file_rows).await
}

pub async fn list_recent_network_files_pool(
    pool: &SqlitePool,
    since_days: u32,
    limit: u32,
) -> Result<Vec<NetworkFile>, String> {
    let cutoff = cache_cutoff_rfc3339();
    let since = format!("-{} days", since_days.max(1));
    let file_rows: Vec<NetworkFileRow> = sqlx::query_as(
        r#"
        SELECT content_hash, name, size, canonical_link, peer_count, first_seen_at, last_seen_at
        FROM network_files
        WHERE last_seen_at >= ?
          AND (first_seen_at >= datetime('now', ?) OR last_seen_at >= datetime('now', ?))
        ORDER BY COALESCE(first_seen_at, last_seen_at) DESC
        LIMIT ?
        "#,
    )
    .bind(&cutoff)
    .bind(&since)
    .bind(&since)
    .bind(limit.max(1) as i64)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list recent network files: {e}"))?;

    rows_to_network_files(pool, file_rows).await
}

pub async fn list_browse_categories_pool(pool: &SqlitePool) -> Result<Vec<BrowseCategoryRow>, String> {
    let mut categories: Vec<BrowseCategoryRow> = Vec::new();

    let local_rows: Vec<(String, i64)> = sqlx::query_as(
        r#"
        SELECT COALESCE(NULLIF(file_type, ''), 'Unknown') AS ft, COUNT(*) AS cnt
        FROM documents
        GROUP BY ft
        ORDER BY cnt DESC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list local browse categories: {e}"))?;

    for (name, count) in local_rows {
        let id = format!("local:{}", name.to_lowercase().replace(' ', "-"));
        categories.push(BrowseCategoryRow {
            id,
            name: name.clone(),
            document_count: count.max(0) as u32,
            source: "local".to_string(),
        });
    }

    let cutoff = cache_cutoff_rfc3339();
    let network_rows: Vec<(String, i64)> = sqlx::query_as(
        r#"
        SELECT
            COALESCE(
                NULLIF(LOWER(substr(name, instr(name, '.') + 1)), ''),
                'unknown'
            ) AS ext,
            COUNT(*) AS cnt
        FROM network_files
        WHERE last_seen_at >= ?
        GROUP BY ext
        ORDER BY cnt DESC
        "#,
    )
    .bind(&cutoff)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list network browse categories: {e}"))?;

    for (ext, count) in network_rows {
        let label = ext.to_uppercase();
        categories.push(BrowseCategoryRow {
            id: format!("network:{}", ext),
            name: label,
            document_count: count.max(0) as u32,
            source: "network".to_string(),
        });
    }

    Ok(categories)
}

async fn rows_to_network_files(
    pool: &SqlitePool,
    file_rows: Vec<NetworkFileRow>,
) -> Result<Vec<NetworkFile>, String> {
    let mut results = Vec::with_capacity(file_rows.len());
    for row in file_rows {
        let peer_rows: Vec<NetworkFilePeerRow> = sqlx::query_as(
            r#"
            SELECT content_hash, node_id, file_id, link
            FROM network_file_peers
            WHERE content_hash = ?
            "#,
        )
        .bind(&row.content_hash)
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to query file peers: {e}"))?;

        let mut peers = Vec::new();
        for pr in peer_rows {
            let onion: Option<String> = sqlx::query_scalar(
                "SELECT onion FROM network_peers WHERE node_id = ?",
            )
            .bind(&pr.node_id)
            .fetch_optional(pool)
            .await
            .map_err(|e| format!("Failed to query peer onion: {e}"))?;

            peers.push(PeerLocation {
                node_id: pr.node_id,
                onion: onion.unwrap_or_default(),
                file_id: uuid::Uuid::parse_str(&pr.file_id).unwrap_or_else(|_| uuid::Uuid::nil()),
                link: pr.link,
            });
        }

        results.push(NetworkFile {
            name: row.name,
            size: row.size as u64,
            link: row.canonical_link.unwrap_or_default(),
            content_hash: row.content_hash,
            peer_count: if row.peer_count > 0 {
                row.peer_count as usize
            } else {
                peers.len()
            },
            peers,
        });
    }
    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::database::migrations;
    use sqlx::sqlite::SqlitePoolOptions;
    use uuid::Uuid;

    async fn test_pool() -> SqlitePool {
        let db_path = std::env::temp_dir().join(format!("network_cache_test_{}.db", Uuid::new_v4()));
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).expect("parent dir");
        }
        let options = sqlx::sqlite::SqliteConnectOptions::new()
            .filename(&db_path)
            .create_if_missing(true);
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(options)
            .await
            .expect("connect");
        migrations::run_migrations(&pool)
            .await
            .expect("migrations");
        pool
    }

    fn sample_lobby() -> NetworkLobby {
        NetworkLobby {
            online_nodes: 2,
            files: vec![
                NetworkFile {
                    name: "alpha.pdf".into(),
                    size: 1000,
                    link: "http://a.onion/f/1".into(),
                    content_hash: "hash-alpha".into(),
                    peer_count: 1,
                    peers: vec![PeerLocation {
                        node_id: "node-a".into(),
                        onion: "aaaa.onion".into(),
                        file_id: Uuid::new_v4(),
                        link: "http://a.onion/f/1".into(),
                    }],
                },
                NetworkFile {
                    name: "beta.epub".into(),
                    size: 2000,
                    link: "http://b.onion/f/2".into(),
                    content_hash: "hash-beta".into(),
                    peer_count: 1,
                    peers: vec![PeerLocation {
                        node_id: "node-b".into(),
                        onion: "bbbb.onion".into(),
                        file_id: Uuid::new_v4(),
                        link: "http://b.onion/f/2".into(),
                    }],
                },
            ],
        }
    }

    #[tokio::test]
    async fn sync_and_load_round_trip() {
        let pool = test_pool().await;
        let lobby = sample_lobby();

        sync_lobby_to_pool(&pool, &lobby)
            .await
            .expect("sync");

        let loaded = load_lobby_from_pool(&pool).await.expect("load");
        assert_eq!(loaded.files.len(), 2);
        assert!(loaded
            .files
            .iter()
            .any(|f| f.content_hash == "hash-alpha" && f.name == "alpha.pdf"));
        assert!(loaded.online_nodes >= 1);
    }

    #[tokio::test]
    async fn search_cached_filters_by_name() {
        let pool = test_pool().await;
        sync_lobby_to_pool(&pool, &sample_lobby())
            .await
            .expect("sync");

        let hits = search_network_cached_pool(&pool, "alpha", 10)
            .await
            .expect("search");
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].name, "alpha.pdf");
    }

    #[tokio::test]
    async fn prune_removes_stale_rows() {
        let pool = test_pool().await;
        let stale = (Utc::now() - Duration::seconds(120)).to_rfc3339();

        sqlx::query(
            r#"
            INSERT INTO network_files (
                content_hash, name, size, canonical_link, peer_count, first_seen_at, last_seen_at
            ) VALUES ('stale-hash', 'old.pdf', 1, 'link', 0, ?, ?)
            "#,
        )
        .bind(&stale)
        .bind(&stale)
        .execute(&pool)
        .await
        .expect("insert stale");

        sync_lobby_to_pool(&pool, &sample_lobby())
            .await
            .expect("sync");

        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM network_files WHERE content_hash = 'stale-hash'",
        )
        .fetch_one(&pool)
        .await
        .expect("count");
        assert_eq!(count, 0);
    }
}
