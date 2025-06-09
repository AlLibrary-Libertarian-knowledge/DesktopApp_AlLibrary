use crate::utils::error::{AlLibraryError, Result};
use sqlx::{SqlitePool, Pool, Sqlite};
use std::sync::Arc;
use tokio::sync::OnceCell;

pub struct ConnectionManager {
    pool: Arc<SqlitePool>,
}

impl ConnectionManager {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            pool: Arc::new(pool),
        }
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }

    pub async fn health_check(&self) -> Result<()> {
        sqlx::query("SELECT 1")
            .fetch_one(&*self.pool)
            .await?;
        Ok(())
    }

    pub async fn close(&self) {
        self.pool.close().await;
    }
}

// Global connection manager instance
static CONNECTION_MANAGER: OnceCell<ConnectionManager> = OnceCell::const_new();

pub async fn init_connection_manager(pool: SqlitePool) -> Result<()> {
    let manager = ConnectionManager::new(pool);
    CONNECTION_MANAGER.set(manager)
        .map_err(|_| AlLibraryError::internal("Failed to initialize connection manager"))?;
    Ok(())
}

pub fn get_connection_manager() -> Result<&'static ConnectionManager> {
    CONNECTION_MANAGER.get()
        .ok_or_else(|| AlLibraryError::internal("Connection manager not initialized"))
}

pub fn get_pool() -> Result<&'static SqlitePool> {
    Ok(get_connection_manager()?.pool())
} 