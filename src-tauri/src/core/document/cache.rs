use crate::utils::error::{AlLibraryError, Result};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tracing::{info, warn};

#[derive(Debug, Clone)]
pub struct CacheEntry<T> {
    pub data: T,
    pub created_at: Instant,
    pub last_accessed: Instant,
    pub access_count: u64,
}

impl<T> CacheEntry<T> {
    fn new(data: T) -> Self {
        let now = Instant::now();
        Self {
            data,
            created_at: now,
            last_accessed: now,
            access_count: 1,
        }
    }

    fn access(&mut self) -> &T {
        self.last_accessed = Instant::now();
        self.access_count += 1;
        &self.data
    }

    fn is_expired(&self, ttl: Duration) -> bool {
        self.created_at.elapsed() > ttl
    }
}

pub struct FileCache {
    // File content cache
    content_cache: RwLock<HashMap<PathBuf, CacheEntry<Vec<u8>>>>,
    // Metadata cache
    metadata_cache: RwLock<HashMap<PathBuf, CacheEntry<FileCacheMetadata>>>,
    // Configuration
    max_content_size: usize,
    max_entries: usize,
    ttl: Duration,
}

#[derive(Debug, Clone)]
pub struct FileCacheMetadata {
    pub file_size: u64,
    pub content_hash: String,
    pub mime_type: String,
    pub last_modified: std::time::SystemTime,
}

impl FileCache {
    pub fn new(max_content_size: usize, max_entries: usize, ttl_seconds: u64) -> Self {
        Self {
            content_cache: RwLock::new(HashMap::new()),
            metadata_cache: RwLock::new(HashMap::new()),
            max_content_size,
            max_entries,
            ttl: Duration::from_secs(ttl_seconds),
        }
    }

    pub async fn get_content(&self, file_path: &Path) -> Option<Vec<u8>> {
        let mut cache = self.content_cache.write().await;
        
        if let Some(entry) = cache.get_mut(file_path) {
            if !entry.is_expired(self.ttl) {
                return Some(entry.access().clone());
            } else {
                cache.remove(file_path);
            }
        }
        
        None
    }

    pub async fn cache_content(&self, file_path: PathBuf, content: Vec<u8>) -> Result<()> {
        if content.len() > self.max_content_size {
            return Ok(()); // Don't cache large files
        }

        let mut cache = self.content_cache.write().await;
        
        // Remove expired entries and enforce size limit
        self.cleanup_content_cache(&mut cache).await;
        
        if cache.len() >= self.max_entries {
            self.evict_lru_content(&mut cache).await;
        }

        cache.insert(file_path.clone(), CacheEntry::new(content));
        info!("File content cached: {}", file_path.display());
        
        Ok(())
    }

    pub async fn get_metadata(&self, file_path: &Path) -> Option<FileCacheMetadata> {
        let mut cache = self.metadata_cache.write().await;
        
        if let Some(entry) = cache.get_mut(file_path) {
            if !entry.is_expired(self.ttl) {
                return Some(entry.access().clone());
            } else {
                cache.remove(file_path);
            }
        }
        
        None
    }

    pub async fn cache_metadata(&self, file_path: PathBuf, metadata: FileCacheMetadata) -> Result<()> {
        let mut cache = self.metadata_cache.write().await;
        
        // Remove expired entries
        self.cleanup_metadata_cache(&mut cache).await;
        
        if cache.len() >= self.max_entries {
            self.evict_lru_metadata(&mut cache).await;
        }

        cache.insert(file_path.clone(), CacheEntry::new(metadata));
        info!("File metadata cached: {}", file_path.display());
        
        Ok(())
    }

    pub async fn invalidate(&self, file_path: &Path) {
        {
            let mut content_cache = self.content_cache.write().await;
            content_cache.remove(file_path);
        }
        {
            let mut metadata_cache = self.metadata_cache.write().await;
            metadata_cache.remove(file_path);
        }
        info!("Cache invalidated for: {}", file_path.display());
    }

    pub async fn clear(&self) {
        {
            let mut content_cache = self.content_cache.write().await;
            content_cache.clear();
        }
        {
            let mut metadata_cache = self.metadata_cache.write().await;
            metadata_cache.clear();
        }
        info!("All caches cleared");
    }

    pub async fn get_stats(&self) -> CacheStats {
        let content_cache = self.content_cache.read().await;
        let metadata_cache = self.metadata_cache.read().await;
        
        let content_size: usize = content_cache.values()
            .map(|entry| entry.data.len())
            .sum();
            
        CacheStats {
            content_entries: content_cache.len(),
            metadata_entries: metadata_cache.len(),
            total_content_size: content_size,
            max_entries: self.max_entries,
            max_content_size: self.max_content_size,
            ttl_seconds: self.ttl.as_secs(),
        }
    }

    pub async fn cleanup(&self) {
        {
            let mut content_cache = self.content_cache.write().await;
            self.cleanup_content_cache(&mut content_cache).await;
        }
        {
            let mut metadata_cache = self.metadata_cache.write().await;
            self.cleanup_metadata_cache(&mut metadata_cache).await;
        }
        info!("Cache cleanup completed");
    }

    // Private helper methods
    async fn cleanup_content_cache(&self, cache: &mut HashMap<PathBuf, CacheEntry<Vec<u8>>>) {
        let expired_keys: Vec<PathBuf> = cache.iter()
            .filter(|(_, entry)| entry.is_expired(self.ttl))
            .map(|(path, _)| path.clone())
            .collect();
            
        for key in expired_keys {
            cache.remove(&key);
        }
    }

    async fn cleanup_metadata_cache(&self, cache: &mut HashMap<PathBuf, CacheEntry<FileCacheMetadata>>) {
        let expired_keys: Vec<PathBuf> = cache.iter()
            .filter(|(_, entry)| entry.is_expired(self.ttl))
            .map(|(path, _)| path.clone())
            .collect();
            
        for key in expired_keys {
            cache.remove(&key);
        }
    }

    async fn evict_lru_content(&self, cache: &mut HashMap<PathBuf, CacheEntry<Vec<u8>>>) {
        if let Some((lru_key, _)) = cache.iter()
            .min_by_key(|(_, entry)| entry.last_accessed)
            .map(|(k, v)| (k.clone(), v.last_accessed)) {
            cache.remove(&lru_key);
            warn!("Evicted LRU content cache entry: {}", lru_key.display());
        }
    }

    async fn evict_lru_metadata(&self, cache: &mut HashMap<PathBuf, CacheEntry<FileCacheMetadata>>) {
        if let Some((lru_key, _)) = cache.iter()
            .min_by_key(|(_, entry)| entry.last_accessed)
            .map(|(k, v)| (k.clone(), v.last_accessed)) {
            cache.remove(&lru_key);
            warn!("Evicted LRU metadata cache entry: {}", lru_key.display());
        }
    }
}

#[derive(Debug)]
pub struct CacheStats {
    pub content_entries: usize,
    pub metadata_entries: usize,
    pub total_content_size: usize,
    pub max_entries: usize,
    pub max_content_size: usize,
    pub ttl_seconds: u64,
}

// Global cache instance
use tokio::sync::OnceCell;
static FILE_CACHE: OnceCell<FileCache> = OnceCell::const_new();

pub async fn init_file_cache(max_content_size: usize, max_entries: usize, ttl_seconds: u64) -> Result<()> {
    let cache = FileCache::new(max_content_size, max_entries, ttl_seconds);
    FILE_CACHE.set(cache)
        .map_err(|_| AlLibraryError::internal("Failed to initialize file cache"))?;
    info!("File cache initialized");
    Ok(())
}

pub fn get_file_cache() -> Result<&'static FileCache> {
    FILE_CACHE.get()
        .ok_or_else(|| AlLibraryError::internal("File cache not initialized"))
} 