pub mod models;
pub mod connection;
pub mod migrations;
pub mod operations;

pub use connection::*;
pub use models::*;
pub use operations::*;

use crate::utils::error::Result;
use sqlx::SqlitePool;
use std::path::PathBuf;

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new(database_path: &PathBuf) -> Result<Self> {
        let database_url = format!("sqlite:{}", database_path.display());
        
        // Create database file if it doesn't exist
        if let Some(parent) = database_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let pool = SqlitePool::connect(&database_url).await?;
        
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