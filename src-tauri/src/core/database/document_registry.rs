use chrono::Utc;
use sqlx::SqlitePool;

#[derive(Debug, Clone)]
pub struct TreatedDocumentRow {
    pub id: String,
    pub content_hash: String,
    pub local_path: String,
    pub title: String,
    pub original_filename: String,
    pub canonical_name: String,
    pub file_type: String,
    pub file_size: i64,
    pub page_count: i32,
    pub chunk_count: i32,
    pub hash_scheme: String,
    pub is_treated: bool,
    pub processing_status: String,
}

pub async fn upsert_treated_document_pool(
    pool: &SqlitePool,
    row: &TreatedDocumentRow,
) -> Result<(), String> {
    let now = Utc::now();
    sqlx::query(
        r#"
        INSERT INTO documents (
            id, title, description, content_hash, file_type, file_size,
            created_at, updated_at, local_path, is_shared, processing_status,
            malware_scan_status, javascript_stripped, peer_availability_count,
            download_priority, is_treated, original_filename, canonical_name,
            chunk_count, hash_scheme, page_count
        ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, 1, 'treated', 'clean', 1, 0, 0, 1, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            content_hash = excluded.content_hash,
            file_type = excluded.file_type,
            file_size = excluded.file_size,
            updated_at = excluded.updated_at,
            local_path = excluded.local_path,
            is_shared = 1,
            processing_status = 'treated',
            is_treated = 1,
            original_filename = excluded.original_filename,
            canonical_name = excluded.canonical_name,
            chunk_count = excluded.chunk_count,
            hash_scheme = excluded.hash_scheme,
            page_count = excluded.page_count
        "#,
    )
    .bind(&row.id)
    .bind(&row.title)
    .bind(&row.content_hash)
    .bind(&row.file_type)
    .bind(row.file_size)
    .bind(now)
    .bind(now)
    .bind(&row.local_path)
    .bind(&row.original_filename)
    .bind(&row.canonical_name)
    .bind(row.chunk_count)
    .bind(&row.hash_scheme)
    .bind(row.page_count)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to upsert treated document: {e}"))?;
    Ok(())
}

pub async fn upsert_untreated_by_path_pool(
    pool: &SqlitePool,
    path_id: &str,
    local_path: &str,
    title: &str,
    file_type: &str,
    file_size: i64,
) -> Result<(), String> {
    let now = Utc::now();
    sqlx::query(
        r#"
        INSERT INTO documents (
            id, title, description, content_hash, file_type, file_size,
            created_at, updated_at, local_path, is_shared, processing_status,
            malware_scan_status, javascript_stripped, peer_availability_count,
            download_priority, is_treated, original_filename, canonical_name,
            chunk_count, hash_scheme, page_count
        ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, 0, 'untreated', 'pending', 0, 0, 0, 0, ?, ?, 0, 'none', NULL)
        ON CONFLICT(id) DO UPDATE SET
            local_path = excluded.local_path,
            file_size = excluded.file_size,
            updated_at = excluded.updated_at,
            processing_status = 'untreated',
            is_treated = 0,
            is_shared = 0
        "#,
    )
    .bind(path_id)
    .bind(title)
    .bind(path_id)
    .bind(file_type)
    .bind(file_size)
    .bind(now)
    .bind(now)
    .bind(local_path)
    .bind(title)
    .bind(title)
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to upsert untreated document: {e}"))?;
    Ok(())
}

pub async fn get_document_by_path_pool(
    pool: &SqlitePool,
    local_path: &str,
) -> Result<Option<TreatedDocumentRow>, String> {
    let row = sqlx::query_as::<_, (String, String, String, String, String, String, String, i64, Option<i32>, Option<i32>, String, i64, String)>(
        r#"
        SELECT id, content_hash, local_path, title, original_filename, canonical_name,
               file_type, file_size, page_count, chunk_count, hash_scheme, is_treated, processing_status
        FROM documents WHERE local_path = ? LIMIT 1
        "#,
    )
    .bind(local_path)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to get document by path: {e}"))?;

    Ok(row.map(|r| TreatedDocumentRow {
        id: r.0,
        content_hash: r.1,
        local_path: r.2,
        title: r.3,
        original_filename: r.4,
        canonical_name: r.5,
        file_type: r.6,
        file_size: r.7,
        page_count: r.8.unwrap_or(0),
        chunk_count: r.9.unwrap_or(0),
        hash_scheme: r.10,
        is_treated: r.11 != 0,
        processing_status: r.12,
    }))
}

pub async fn is_path_treated_pool(pool: &SqlitePool, local_path: &str) -> Result<bool, String> {
    let v: Option<i64> = sqlx::query_scalar(
        "SELECT is_treated FROM documents WHERE local_path = ? LIMIT 1",
    )
    .bind(local_path)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to query is_treated: {e}"))?;
    Ok(v.unwrap_or(0) != 0)
}

pub async fn remap_document_id_pool(
    pool: &SqlitePool,
    old_id: &str,
    new_id: &str,
) -> Result<(), String> {
    sqlx::query("UPDATE favorites SET document_id = ? WHERE document_id = ?")
        .bind(new_id)
        .bind(old_id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to remap favorites: {e}"))?;
    sqlx::query("UPDATE activity_log SET document_id = ? WHERE document_id = ?")
        .bind(new_id)
        .bind(old_id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to remap activity: {e}"))?;
    Ok(())
}

pub async fn delete_document_by_id_pool(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM documents WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete document: {e}"))?;
    Ok(())
}

pub async fn list_local_document_paths_pool(pool: &SqlitePool) -> Result<Vec<String>, String> {
    let rows = sqlx::query_scalar::<_, String>(
        "SELECT local_path FROM documents WHERE local_path IS NOT NULL",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to list document paths: {e}"))?;
    Ok(rows)
}
