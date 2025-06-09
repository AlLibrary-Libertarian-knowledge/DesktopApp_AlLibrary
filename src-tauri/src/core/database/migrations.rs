use crate::utils::error::{AlLibraryError, Result};
use sqlx::SqlitePool;
use tracing::{info, warn};

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
    ]
} 