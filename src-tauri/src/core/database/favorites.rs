use sqlx::SqlitePool;

pub async fn is_favorite_pool(pool: &SqlitePool, document_id: &str) -> Result<bool, String> {
    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM favorites WHERE document_id = ?",
    )
    .bind(document_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to check favorite: {e}"))?;
    Ok(count > 0)
}

pub async fn toggle_favorite_pool(
    pool: &SqlitePool,
    document_id: &str,
) -> Result<bool, String> {
    if is_favorite_pool(pool, document_id).await? {
        sqlx::query("DELETE FROM favorites WHERE document_id = ?")
            .bind(document_id)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to remove favorite: {e}"))?;
        Ok(false)
    } else {
        sqlx::query(
            "INSERT INTO favorites (document_id, created_at) VALUES (?, datetime('now'))",
        )
        .bind(document_id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to add favorite: {e}"))?;
        Ok(true)
    }
}

pub async fn list_favorites_pool(
    pool: &SqlitePool,
    limit: Option<u32>,
) -> Result<Vec<String>, String> {
    let lim = limit.unwrap_or(500).min(5000) as i64;
    sqlx::query_scalar::<_, String>(
        "SELECT document_id FROM favorites ORDER BY created_at DESC LIMIT ?",
    )
    .bind(lim)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list favorites: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::database::migrations::run_migrations;
    use sqlx::sqlite::SqlitePoolOptions;

    async fn test_pool() -> SqlitePool {
        let db_path = std::env::temp_dir().join(format!(
            "favorites_test_{}.db",
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
    async fn toggle_favorite_round_trip() {
        let pool = test_pool().await;
        let id = "hash-abc123";
        assert!(!is_favorite_pool(&pool, id).await.unwrap());
        assert!(toggle_favorite_pool(&pool, id).await.unwrap());
        assert!(is_favorite_pool(&pool, id).await.unwrap());
        assert!(!toggle_favorite_pool(&pool, id).await.unwrap());
        assert!(!is_favorite_pool(&pool, id).await.unwrap());
    }

    #[tokio::test]
    async fn list_favorites_returns_ids() {
        let pool = test_pool().await;
        toggle_favorite_pool(&pool, "a").await.unwrap();
        toggle_favorite_pool(&pool, "b").await.unwrap();
        let list = list_favorites_pool(&pool, None).await.unwrap();
        assert_eq!(list.len(), 2);
        assert!(list.contains(&"a".to_string()));
        assert!(list.contains(&"b".to_string()));
    }
}
