pub mod models;
pub mod connection;
pub mod migrations;
pub mod operations;
pub mod node_db;
pub mod network_cache;
pub mod local_shares;
pub mod favorites;
pub mod activity_log;

pub use connection::*;
pub use models::*;
pub use operations::*;
pub use node_db::{ensure_node_database, resolve_database_path};
pub use network_cache::{
    cache_cutoff_rfc3339, load_lobby_from_db, load_lobby_from_pool, sync_lobby_to_db,
    sync_lobby_to_pool, search_network_cached_pool, list_network_peers_pool,
};
pub use local_shares::{
    delete_local_share_by_path_pool, delete_local_share_pool, list_local_share_paths_pool,
    list_local_shares_pool, local_share_disk_path_map_pool, upsert_local_share_pool,
};

use crate::utils::error::Result;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::path::PathBuf;

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new(database_path: &PathBuf) -> Result<Self> {
        // Create database file if it doesn't exist
        if let Some(parent) = database_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let options = SqliteConnectOptions::new()
            .filename(database_path)
            .create_if_missing(true);
        let pool = SqlitePoolOptions::new()
            .connect_with(options)
            .await?;
        
        let db = Self { pool };
        
        // Run migrations
        db.run_migrations().await?;
        
        Ok(db)
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }

    pub async fn close(self) {
        self.pool.close().await;
    }

    async fn run_migrations(&self) -> Result<()> {
        migrations::run_migrations(&self.pool).await
    }
} 