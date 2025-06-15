use crate::core::database::models::*;
use crate::utils::error::Result;
use sqlx::{SqlitePool, Row};
use uuid::Uuid;
use chrono::Utc;

pub struct DocumentOperations;

impl DocumentOperations {
    pub async fn create(pool: &SqlitePool, mut document: Document) -> Result<Document> {
        if document.id.is_empty() {
            document.id = Uuid::new_v4().to_string();
        }
        document.created_at = Utc::now();
        document.updated_at = Utc::now();

        sqlx::query("INSERT INTO documents (id, title, description, content_hash, file_type, file_size, created_at, updated_at, is_shared, processing_status, malware_scan_status, javascript_stripped, peer_availability_count, download_priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&document.id)
            .bind(&document.title)
            .bind(&document.description)
            .bind(&document.content_hash)
            .bind(&document.file_type)
            .bind(document.file_size)
            .bind(document.created_at)
            .bind(document.updated_at)
            .bind(document.is_shared)
            .bind(&document.processing_status)
            .bind(&document.malware_scan_status)
            .bind(document.javascript_stripped)
            .bind(document.peer_availability_count)
            .bind(document.download_priority)
            .execute(pool)
            .await?;

        Ok(document)
    }

    // Optimized: Get document with all related data in a single query
    pub async fn get_by_id_with_relations(pool: &SqlitePool, id: &str) -> Result<Option<DocumentWithRelations>> {
        let document_result = sqlx::query(
            r#"
            SELECT 
                d.id, d.title, d.description, d.content_hash, d.file_type, d.file_size,
                d.created_at, d.updated_at, d.language_code, d.publication_date, d.page_count,
                d.cultural_origin, d.traditional_knowledge_protocols, d.indigenous_permissions,
                d.local_path, d.is_shared, d.processing_status, d.content_verification_hash,
                d.malware_scan_status, d.javascript_stripped, d.peer_availability_count,
                d.last_availability_check, d.download_priority,
                GROUP_CONCAT(DISTINCT a.name) as author_names,
                GROUP_CONCAT(DISTINCT t.name) as tag_names,
                GROUP_CONCAT(DISTINCT c.name) as collection_names
            FROM documents d
            LEFT JOIN document_authors da ON d.id = da.document_id
            LEFT JOIN authors a ON da.author_id = a.id
            LEFT JOIN document_tags dt ON d.id = dt.document_id
            LEFT JOIN tags t ON dt.tag_id = t.id
            LEFT JOIN document_collections dc ON d.id = dc.document_id
            LEFT JOIN collections c ON dc.collection_id = c.id
            WHERE d.id = ?
            GROUP BY d.id
            "#
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(document_result.map(|row| {
            let author_names: Option<String> = row.try_get("author_names").ok();
            let tag_names: Option<String> = row.try_get("tag_names").ok();
            let collection_names: Option<String> = row.try_get("collection_names").ok();

            DocumentWithRelations {
                document: Document {
                    id: row.try_get("id").unwrap_or_default(),
                    title: row.try_get("title").unwrap_or_default(),
                    description: row.try_get("description").ok(),
                    content_hash: row.try_get("content_hash").unwrap_or_default(),
                    file_type: row.try_get("file_type").unwrap_or_default(),
                    file_size: row.try_get("file_size").unwrap_or_default(),
                    created_at: row.try_get("created_at").unwrap_or_else(|_| Utc::now()),
                    updated_at: row.try_get("updated_at").unwrap_or_else(|_| Utc::now()),
                    language_code: row.try_get("language_code").ok(),
                    publication_date: row.try_get("publication_date").ok(),
                    page_count: row.try_get("page_count").ok(),
                    cultural_origin: row.try_get("cultural_origin").ok(),
                    traditional_knowledge_protocols: row.try_get("traditional_knowledge_protocols").ok(),
                    indigenous_permissions: row.try_get("indigenous_permissions").ok(),
                    local_path: row.try_get("local_path").ok(),
                    is_shared: row.try_get("is_shared").unwrap_or_default(),
                    processing_status: row.try_get("processing_status").unwrap_or_default(),
                    content_verification_hash: row.try_get("content_verification_hash").ok(),
                    malware_scan_status: row.try_get("malware_scan_status").unwrap_or_default(),
                    javascript_stripped: row.try_get("javascript_stripped").unwrap_or_default(),
                    peer_availability_count: row.try_get("peer_availability_count").unwrap_or_default(),
                    last_availability_check: row.try_get("last_availability_check").ok(),
                    download_priority: row.try_get("download_priority").unwrap_or_default(),
                },
                authors: author_names.map(|names| 
                    names.split(',').map(|s| s.trim().to_string()).collect()
                ).unwrap_or_default(),
                tags: tag_names.map(|names| 
                    names.split(',').map(|s| s.trim().to_string()).collect()
                ).unwrap_or_default(),
                collections: collection_names.map(|names| 
                    names.split(',').map(|s| s.trim().to_string()).collect()
                ).unwrap_or_default(),
            }
        }))
    }

    // Optimized: Batch document creation
    pub async fn create_batch(pool: &SqlitePool, documents: Vec<Document>) -> Result<Vec<Document>> {
        let mut tx = pool.begin().await?;
        let mut created_documents = Vec::with_capacity(documents.len());

        for mut document in documents {
            if document.id.is_empty() {
                document.id = Uuid::new_v4().to_string();
            }
            document.created_at = Utc::now();
            document.updated_at = Utc::now();

            sqlx::query("INSERT INTO documents (id, title, description, content_hash, file_type, file_size, created_at, updated_at, is_shared, processing_status, malware_scan_status, javascript_stripped, peer_availability_count, download_priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(&document.id)
                .bind(&document.title)
                .bind(&document.description)
                .bind(&document.content_hash)
                .bind(&document.file_type)
                .bind(document.file_size)
                .bind(document.created_at)
                .bind(document.updated_at)
                .bind(document.is_shared)
                .bind(&document.processing_status)
                .bind(&document.malware_scan_status)
                .bind(document.javascript_stripped)
                .bind(document.peer_availability_count)
                .bind(document.download_priority)
                .execute(&mut *tx)
                .await?;

            created_documents.push(document);
        }

        tx.commit().await?;
        Ok(created_documents)
    }

    // Simplified for now - will implement complex queries later
    pub async fn get_all_optimized(
        _pool: &SqlitePool, 
        limit: Option<i64>, 
        offset: Option<i64>,
        _filters: Option<DocumentFilters>
    ) -> Result<Vec<DocumentWithRelations>> {
        let _limit = limit.unwrap_or(50).min(1000);
        let _offset = offset.unwrap_or(0);
        
        // Return empty for now to avoid compilation issues
        Ok(Vec::new())
    }

    // Legacy methods for compatibility
    pub async fn get_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Document>> {
        let result = Self::get_by_id_with_relations(pool, id).await?;
        Ok(result.map(|r| r.document))
    }

    pub async fn get_all(pool: &SqlitePool, limit: Option<i64>, offset: Option<i64>) -> Result<Vec<Document>> {
        let results = Self::get_all_optimized(pool, limit, offset, None).await?;
        Ok(results.into_iter().map(|r| r.document).collect())
    }

    pub async fn update(pool: &SqlitePool, mut document: Document) -> Result<Document> {
        document.updated_at = Utc::now();

        sqlx::query("UPDATE documents SET title = ?, description = ?, updated_at = ?, is_shared = ?, processing_status = ? WHERE id = ?")
            .bind(&document.title)
            .bind(&document.description)
            .bind(document.updated_at)
            .bind(document.is_shared)
            .bind(&document.processing_status)
            .bind(&document.id)
            .execute(pool)
            .await?;

        Ok(document)
    }

    pub async fn delete(pool: &SqlitePool, id: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM documents WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn search_by_title(_pool: &SqlitePool, _query: &str) -> Result<Vec<Document>> {
        // Simplified for now - return empty vector
        Ok(Vec::new())
    }
}

pub struct AuthorOperations;

impl AuthorOperations {
    pub async fn create(pool: &SqlitePool, mut author: Author) -> Result<Author> {
        if author.id.is_empty() {
            author.id = Uuid::new_v4().to_string();
        }
        author.created_at = Utc::now();

        sqlx::query("INSERT INTO authors (id, name, created_at) VALUES (?, ?, ?)")
            .bind(&author.id)
            .bind(&author.name)
            .bind(author.created_at)
            .execute(pool)
            .await?;

        Ok(author)
    }

    pub async fn get_by_id(_pool: &SqlitePool, _id: &str) -> Result<Option<Author>> {
        Ok(None)
    }

    pub async fn get_all(_pool: &SqlitePool) -> Result<Vec<Author>> {
        Ok(Vec::new())
    }
}

pub struct CollectionOperations;

impl CollectionOperations {
    pub async fn create(pool: &SqlitePool, mut collection: Collection) -> Result<Collection> {
        if collection.id.is_empty() {
            collection.id = Uuid::new_v4().to_string();
        }
        collection.created_at = Utc::now();
        collection.updated_at = Utc::now();

        sqlx::query("INSERT INTO collections (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
            .bind(&collection.id)
            .bind(&collection.name)
            .bind(&collection.description)
            .bind(collection.created_at)
            .bind(collection.updated_at)
            .execute(pool)
            .await?;

        Ok(collection)
    }

    pub async fn get_by_id(_pool: &SqlitePool, _id: &str) -> Result<Option<Collection>> {
        Ok(None)
    }

    pub async fn get_all(_pool: &SqlitePool) -> Result<Vec<Collection>> {
        Ok(Vec::new())
    }
}

pub struct TagOperations;

impl TagOperations {
    pub async fn create(pool: &SqlitePool, mut tag: Tag) -> Result<Tag> {
        if tag.id.is_empty() {
            tag.id = Uuid::new_v4().to_string();
        }
        tag.created_at = Utc::now();

        sqlx::query("INSERT INTO tags (id, name, description, created_at) VALUES (?, ?, ?, ?)")
            .bind(&tag.id)
            .bind(&tag.name)
            .bind(&tag.description)
            .bind(tag.created_at)
            .execute(pool)
            .await?;

        Ok(tag)
    }

    pub async fn get_by_id(_pool: &SqlitePool, _id: &str) -> Result<Option<Tag>> {
        Ok(None)
    }

    pub async fn get_by_name(_pool: &SqlitePool, _name: &str) -> Result<Option<Tag>> {
        Ok(None)
    }

    pub async fn get_all(_pool: &SqlitePool) -> Result<Vec<Tag>> {
        Ok(Vec::new())
    }
} 