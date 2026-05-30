use serde::Serialize;
use sqlx::SqlitePool;

#[derive(Debug, Clone, Serialize)]
pub struct ActivityEntry {
    pub id: i64,
    pub kind: String,
    pub document_id: Option<String>,
    pub payload_json: Option<String>,
    pub created_at: String,
}

pub async fn insert_activity_pool(
    pool: &SqlitePool,
    kind: &str,
    document_id: Option<&str>,
    payload_json: Option<&str>,
) -> Result<i64, String> {
    let result = sqlx::query(
        "INSERT INTO activity_log (kind, document_id, payload_json, created_at) VALUES (?, ?, ?, datetime('now'))",
    )
    .bind(kind)
    .bind(document_id)
    .bind(payload_json)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to insert activity: {e}"))?;
    Ok(result.last_insert_rowid())
}

pub async fn list_activity_pool(
    pool: &SqlitePool,
    kind: Option<&str>,
    since: Option<&str>,
    limit: Option<u32>,
) -> Result<Vec<ActivityEntry>, String> {
    let lim = limit.unwrap_or(500).min(5000) as i64;
    let rows = match (kind, since) {
        (Some(k), Some(s)) => {
            sqlx::query_as::<_, (i64, String, Option<String>, Option<String>, String)>(
                "SELECT id, kind, document_id, payload_json, created_at FROM activity_log \
                 WHERE kind = ? AND created_at >= ? ORDER BY created_at DESC LIMIT ?",
            )
            .bind(k)
            .bind(s)
            .bind(lim)
            .fetch_all(pool)
            .await
        }
        (Some(k), None) => {
            sqlx::query_as::<_, (i64, String, Option<String>, Option<String>, String)>(
                "SELECT id, kind, document_id, payload_json, created_at FROM activity_log \
                 WHERE kind = ? ORDER BY created_at DESC LIMIT ?",
            )
            .bind(k)
            .bind(lim)
            .fetch_all(pool)
            .await
        }
        (None, Some(s)) => {
            sqlx::query_as::<_, (i64, String, Option<String>, Option<String>, String)>(
                "SELECT id, kind, document_id, payload_json, created_at FROM activity_log \
                 WHERE created_at >= ? ORDER BY created_at DESC LIMIT ?",
            )
            .bind(s)
            .bind(lim)
            .fetch_all(pool)
            .await
        }
        (None, None) => {
            sqlx::query_as::<_, (i64, String, Option<String>, Option<String>, String)>(
                "SELECT id, kind, document_id, payload_json, created_at FROM activity_log \
                 ORDER BY created_at DESC LIMIT ?",
            )
            .bind(lim)
            .fetch_all(pool)
            .await
        }
    }
    .map_err(|e| format!("Failed to list activity: {e}"))?;

    Ok(rows
        .into_iter()
        .map(|(id, kind, document_id, payload_json, created_at)| ActivityEntry {
            id,
            kind,
            document_id,
            payload_json,
            created_at,
        })
        .collect())
}

pub async fn delete_activity_pool(pool: &SqlitePool, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM activity_log WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete activity: {e}"))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::database::migrations::run_migrations;
    use sqlx::sqlite::SqlitePoolOptions;

    async fn test_pool() -> SqlitePool {
        let db_path = std::env::temp_dir().join(format!(
            "activity_log_test_{}.db",
            uuid::Uuid::new_v4()
        ));
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).expect("temp dir");
        }
        let options = sqlx::sqlite::SqliteConnectOptions::new()
            .filename(&db_path)
            .create_if_missing(true);
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(options)
            .await
            .expect("connect");
        run_migrations(&pool).await.expect("migrate");
        pool
    }

    #[tokio::test]
    async fn insert_and_list_activity() {
        let pool = test_pool().await;
        let id = insert_activity_pool(&pool, "view", Some("doc-1"), Some(r#"{"title":"Test"}"#))
            .await
            .unwrap();
        assert!(id > 0);

        let list = list_activity_pool(&pool, None, None, None).await.unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].kind, "view");
        assert_eq!(list[0].document_id.as_deref(), Some("doc-1"));
    }

    #[tokio::test]
    async fn list_filters_by_kind() {
        let pool = test_pool().await;
        insert_activity_pool(&pool, "view", Some("a"), None)
            .await
            .unwrap();
        insert_activity_pool(&pool, "share", Some("b"), None)
            .await
            .unwrap();

        let views = list_activity_pool(&pool, Some("view"), None, None)
            .await
            .unwrap();
        assert_eq!(views.len(), 1);
        assert_eq!(views[0].kind, "view");
    }

    #[tokio::test]
    async fn delete_activity_removes_row() {
        let pool = test_pool().await;
        let id = insert_activity_pool(&pool, "upload", Some("x"), None)
            .await
            .unwrap();
        delete_activity_pool(&pool, id).await.unwrap();
        let list = list_activity_pool(&pool, None, None, None).await.unwrap();
        assert!(list.is_empty());
    }
}
