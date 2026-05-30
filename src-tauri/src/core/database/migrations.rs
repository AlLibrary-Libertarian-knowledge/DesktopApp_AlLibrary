use crate::utils::error::Result;
use sqlx::SqlitePool;
use tracing::info;

pub async fn run_migrations(pool: &SqlitePool) -> Result<()> {
    info!("Running database migrations...");

    // Create migrations table if it doesn't exist
    create_migrations_table(pool).await?;

    // Run all migrations
    let migrations = get_migrations();
    for migration in migrations {
        if !is_migration_applied(pool, &migration.version).await? {
            info!("Running migration: {}", migration.version);
            run_migration(pool, &migration).await?;
            mark_migration_as_applied(pool, &migration.version).await?;
        }
    }

    info!("Database migrations completed successfully");
    Ok(())
}

struct Migration {
    version: String,
    #[allow(dead_code)]
    description: String,
    sql: String,
}

async fn create_migrations_table(pool: &SqlitePool) -> Result<()> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;
    Ok(())
}

async fn is_migration_applied(pool: &SqlitePool, version: &str) -> Result<bool> {
    let result = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM schema_migrations WHERE version = ?",
    )
    .bind(version)
    .fetch_one(pool)
    .await?;
    Ok(result > 0)
}

async fn run_migration(pool: &SqlitePool, migration: &Migration) -> Result<()> {
    sqlx::query(&migration.sql).execute(pool).await?;
    Ok(())
}

async fn mark_migration_as_applied(pool: &SqlitePool, version: &str) -> Result<()> {
    sqlx::query("INSERT INTO schema_migrations (version) VALUES (?)")
        .bind(version)
        .execute(pool)
        .await?;
    Ok(())
}

fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: "001_initial_schema".to_string(),
            description: "Create initial database schema".to_string(),
            sql: r#"
                -- Documents table
                CREATE TABLE documents (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    content_hash TEXT NOT NULL UNIQUE,
                    file_type TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    language_code TEXT,
                    publication_date DATETIME,
                    page_count INTEGER,
                    cultural_origin TEXT,
                    traditional_knowledge_protocols TEXT,
                    indigenous_permissions TEXT,
                    local_path TEXT,
                    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
                    processing_status TEXT NOT NULL DEFAULT 'pending',
                    content_verification_hash TEXT,
                    malware_scan_status TEXT NOT NULL DEFAULT 'pending',
                    javascript_stripped BOOLEAN NOT NULL DEFAULT FALSE,
                    peer_availability_count INTEGER NOT NULL DEFAULT 0,
                    last_availability_check DATETIME,
                    download_priority INTEGER NOT NULL DEFAULT 0
                );

                -- Document metadata table
                CREATE TABLE document_metadata (
                    id TEXT PRIMARY KEY,
                    document_id TEXT NOT NULL,
                    metadata_key TEXT NOT NULL,
                    metadata_value TEXT NOT NULL,
                    metadata_type TEXT NOT NULL,
                    is_searchable BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
                );

                -- Authors table
                CREATE TABLE authors (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    birth_date DATETIME,
                    death_date DATETIME,
                    cultural_affiliation TEXT,
                    institutional_affiliation TEXT,
                    biographical_notes TEXT,
                    preferred_citation_format TEXT,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                -- Document authors junction table
                CREATE TABLE document_authors (
                    document_id TEXT NOT NULL,
                    author_id TEXT NOT NULL,
                    author_role TEXT NOT NULL DEFAULT 'author',
                    attribution_order INTEGER NOT NULL DEFAULT 1,
                    PRIMARY KEY (document_id, author_id),
                    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
                    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
                );

                -- Cultural contexts table
                CREATE TABLE cultural_contexts (
                    id TEXT PRIMARY KEY,
                    culture_name TEXT NOT NULL,
                    geographic_region TEXT,
                    traditional_knowledge_protocols TEXT,
                    access_restrictions TEXT,
                    community_contact_info TEXT,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                -- Collections table
                CREATE TABLE collections (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                -- Document collections junction table
                CREATE TABLE document_collections (
                    document_id TEXT NOT NULL,
                    collection_id TEXT NOT NULL,
                    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (document_id, collection_id),
                    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
                    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
                );

                -- Tags table
                CREATE TABLE tags (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                -- Document tags junction table
                CREATE TABLE document_tags (
                    document_id TEXT NOT NULL,
                    tag_id TEXT NOT NULL,
                    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (document_id, tag_id),
                    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
                    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                );

                -- Create indexes for better query performance
                CREATE INDEX idx_documents_content_hash ON documents(content_hash);
                CREATE INDEX idx_documents_file_type ON documents(file_type);
                CREATE INDEX idx_documents_created_at ON documents(created_at);
                CREATE INDEX idx_documents_processing_status ON documents(processing_status);
                CREATE INDEX idx_documents_is_shared ON documents(is_shared);
                CREATE INDEX idx_document_metadata_document_id ON document_metadata(document_id);
                CREATE INDEX idx_document_metadata_key ON document_metadata(metadata_key);
                CREATE INDEX idx_document_metadata_searchable ON document_metadata(is_searchable);
                CREATE INDEX idx_authors_name ON authors(name);
                CREATE INDEX idx_tags_name ON tags(name);
            "#.to_string(),
        },
        Migration {
            version: "002_network_cache".to_string(),
            description: "Create network cache tables for tracker lobby".to_string(),
            sql: r#"
                CREATE TABLE network_files (
                    content_hash TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    size INTEGER NOT NULL,
                    canonical_link TEXT,
                    peer_count INTEGER NOT NULL DEFAULT 0,
                    first_seen_at TEXT,
                    last_seen_at TEXT NOT NULL
                );

                CREATE TABLE network_peers (
                    node_id TEXT PRIMARY KEY,
                    onion TEXT NOT NULL,
                    last_seen_at TEXT NOT NULL
                );

                CREATE TABLE network_file_peers (
                    content_hash TEXT NOT NULL,
                    node_id TEXT NOT NULL,
                    file_id TEXT NOT NULL,
                    link TEXT NOT NULL,
                    PRIMARY KEY (content_hash, node_id, file_id),
                    FOREIGN KEY (content_hash) REFERENCES network_files(content_hash),
                    FOREIGN KEY (node_id) REFERENCES network_peers(node_id)
                );

                CREATE INDEX idx_network_files_name ON network_files(name);
                CREATE INDEX idx_network_files_last_seen_at ON network_files(last_seen_at);
                CREATE INDEX idx_network_peers_last_seen_at ON network_peers(last_seen_at);
            "#.to_string(),
        },
        Migration {
            version: "003_local_shares".to_string(),
            description: "Create local_shares table for persisted outbound shares".to_string(),
            sql: r#"
                CREATE TABLE local_shares (
                    file_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    size_bytes INTEGER NOT NULL,
                    content_hash TEXT NOT NULL,
                    link TEXT NOT NULL,
                    disk_path TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL
                );

                CREATE INDEX idx_local_shares_disk_path ON local_shares(disk_path);
            "#.to_string(),
        },
        Migration {
            version: "004_favorites".to_string(),
            description: "Create favorites table for bookmarked documents".to_string(),
            sql: r#"
                CREATE TABLE favorites (
                    document_id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE INDEX idx_favorites_created_at ON favorites(created_at);
            "#.to_string(),
        },
        Migration {
            version: "005_activity_log".to_string(),
            description: "Create activity_log table for recent user actions".to_string(),
            sql: r#"
                CREATE TABLE activity_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    kind TEXT NOT NULL,
                    document_id TEXT,
                    payload_json TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
                CREATE INDEX idx_activity_log_kind ON activity_log(kind);
            "#.to_string(),
        },
        Migration {
            version: "006_content_pipeline".to_string(),
            description: "Content pipeline fields: is_treated, canonical_name, hash_scheme".to_string(),
            sql: r#"
                ALTER TABLE documents ADD COLUMN is_treated BOOLEAN NOT NULL DEFAULT 0;
                ALTER TABLE documents ADD COLUMN original_filename TEXT;
                ALTER TABLE documents ADD COLUMN canonical_name TEXT;
                ALTER TABLE documents ADD COLUMN chunk_count INTEGER NOT NULL DEFAULT 0;
                ALTER TABLE documents ADD COLUMN hash_scheme TEXT NOT NULL DEFAULT 'none';

                CREATE INDEX idx_documents_is_treated ON documents(is_treated);
                CREATE INDEX idx_documents_local_path ON documents(local_path);
            "#.to_string(),
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;
    use std::path::PathBuf;

    async fn run_all_migrations_on_path(db_path: &PathBuf) -> Result<()> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let options = sqlx::sqlite::SqliteConnectOptions::new()
            .filename(db_path)
            .create_if_missing(true);
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(options)
            .await?;
        run_migrations(&pool).await
    }

    async fn table_exists(pool: &SqlitePool, name: &str) -> bool {
        let count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = ?",
        )
        .bind(name)
        .fetch_one(pool)
        .await
        .unwrap_or(0);
        count > 0
    }

    #[tokio::test]
    async fn migration_002_creates_network_cache_tables() {
        let db_path = std::env::temp_dir().join(format!(
            "allibrary_test_{}.db",
            uuid::Uuid::new_v4()
        ));
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).expect("temp parent dir");
        }

        run_all_migrations_on_path(&db_path)
            .await
            .expect("migrations should succeed");

        let options = sqlx::sqlite::SqliteConnectOptions::new()
            .filename(&db_path)
            .create_if_missing(true);
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(options)
            .await
            .expect("connect");

        assert!(table_exists(&pool, "network_files").await);
        assert!(table_exists(&pool, "network_peers").await);
        assert!(table_exists(&pool, "network_file_peers").await);

        let applied: Vec<String> = sqlx::query_scalar(
            "SELECT version FROM schema_migrations ORDER BY version",
        )
        .fetch_all(&pool)
        .await
        .expect("schema_migrations");

        assert!(applied.contains(&"001_initial_schema".to_string()));
        assert!(applied.contains(&"002_network_cache".to_string()));
        assert!(applied.contains(&"003_local_shares".to_string()));
        assert!(applied.contains(&"004_favorites".to_string()));
        assert!(applied.contains(&"005_activity_log".to_string()));
        assert!(table_exists(&pool, "local_shares").await);
        assert!(table_exists(&pool, "favorites").await);
        assert!(table_exists(&pool, "activity_log").await);
    }
}