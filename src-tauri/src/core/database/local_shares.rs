use crate::core::database::models::LocalShareRow;
use sqlx::SqlitePool;
use std::collections::HashMap;

pub async fn upsert_local_share_pool(
    pool: &SqlitePool,
    row: &LocalShareRow,
) -> Result<(), String> {
    sqlx::query(
        r#"
        INSERT INTO local_shares (
            file_id, name, size_bytes, content_hash, link, disk_path, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(disk_path) DO UPDATE SET
            file_id = excluded.file_id,
            name = excluded.name,
            size_bytes = excluded.size_bytes,
            content_hash = excluded.content_hash,
            link = excluded.link
        "#,
    )
    .bind(&row.file_id)
    .bind(&row.name)
    .bind(row.size_bytes)
    .bind(&row.content_hash)
    .bind(&row.link)
    .bind(&row.disk_path)
    .bind(&row.created_at)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to upsert local_share: {e}"))?;
    Ok(())
}

pub async fn delete_local_share_pool(pool: &SqlitePool, file_id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM local_shares WHERE file_id = ?")
        .bind(file_id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete local_share: {e}"))?;
    Ok(())
}

pub async fn delete_local_share_by_path_pool(
    pool: &SqlitePool,
    disk_path: &str,
) -> Result<(), String> {
    sqlx::query("DELETE FROM local_shares WHERE disk_path = ?")
        .bind(disk_path)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete local_share by path: {e}"))?;
    Ok(())
}

pub async fn list_local_shares_pool(pool: &SqlitePool) -> Result<Vec<LocalShareRow>, String> {
    sqlx::query_as::<_, LocalShareRow>(
        r#"
        SELECT file_id, name, size_bytes, content_hash, link, disk_path, created_at
        FROM local_shares
        ORDER BY created_at ASC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list local_shares: {e}"))
}

pub async fn list_local_share_paths_pool(pool: &SqlitePool) -> Result<Vec<String>, String> {
    sqlx::query_scalar::<_, String>("SELECT disk_path FROM local_shares ORDER BY created_at ASC")
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to list local_share paths: {e}"))
}

pub async fn local_share_disk_path_map_pool(
    pool: &SqlitePool,
) -> Result<HashMap<String, String>, String> {
    let rows = list_local_shares_pool(pool).await?;
    Ok(rows
        .into_iter()
        .map(|r| (r.file_id, r.disk_path))
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::database::migrations;
    use chrono::Utc;
    use sqlx::sqlite::SqlitePoolOptions;
    use uuid::Uuid;

    async fn test_pool() -> SqlitePool {
        let db_path = std::env::temp_dir().join(format!("local_shares_test_{}.db", Uuid::new_v4()));
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

    fn sample_row(file_id: &str, disk_path: &str) -> LocalShareRow {
        LocalShareRow {
            file_id: file_id.to_string(),
            name: "sample.pdf".into(),
            size_bytes: 1024,
            content_hash: "abc123".into(),
            link: "http://example.onion/s/link".into(),
            disk_path: disk_path.to_string(),
            created_at: Utc::now().to_rfc3339(),
        }
    }

    #[tokio::test]
    async fn upsert_list_delete_round_trip() {
        let pool = test_pool().await;
        let path = "/tmp/test-share.pdf";

        upsert_local_share_pool(&pool, &sample_row("id-1", path))
            .await
            .expect("upsert");

        let rows = list_local_shares_pool(&pool).await.expect("list");
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].disk_path, path);

        upsert_local_share_pool(&pool, &sample_row("id-2", path))
            .await
            .expect("upsert again");
        let rows = list_local_shares_pool(&pool).await.expect("list");
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].file_id, "id-2");

        delete_local_share_pool(&pool, "id-2").await.expect("delete");
        assert!(list_local_shares_pool(&pool).await.unwrap().is_empty());
    }
}
