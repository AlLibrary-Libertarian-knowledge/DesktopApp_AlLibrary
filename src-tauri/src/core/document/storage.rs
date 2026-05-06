use crate::utils::error::{AlLibraryError, Result};
use std::path::{Path, PathBuf};
use tokio::fs;
use tokio::io::AsyncWriteExt;
use tracing::{info, warn};
use uuid::Uuid;

pub struct FileStorage {
    base_path: PathBuf,
    documents_path: PathBuf,
    temp_path: PathBuf,
    cache_path: PathBuf,
}

impl FileStorage {
    pub async fn new(base_path: PathBuf) -> Result<Self> {
        let documents_path = base_path.join("documents");
        let temp_path = base_path.join("temp");
        let cache_path = base_path.join("cache");

        // Create directories if they don't exist
        fs::create_dir_all(&documents_path).await?;
        fs::create_dir_all(&temp_path).await?;
        fs::create_dir_all(&cache_path).await?;

        info!("File storage initialized at: {}", base_path.display());

        Ok(Self {
            base_path,
            documents_path,
            temp_path,
            cache_path,
        })
    }

    pub fn base_path(&self) -> &Path {
        &self.base_path
    }

    pub fn documents_path(&self) -> &Path {
        &self.documents_path
    }

    pub fn temp_path(&self) -> &Path {
        &self.temp_path
    }

    pub fn cache_path(&self) -> &Path {
        &self.cache_path
    }

    pub async fn store_document(&self, content: &[u8], file_extension: &str) -> Result<StoredFile> {
        let file_id = Uuid::new_v4().to_string();
        let filename = format!("{}.{}", file_id, file_extension);
        let file_path = self.documents_path.join(&filename);

        // Write file
        let mut file = fs::File::create(&file_path).await?;
        file.write_all(content).await?;
        file.sync_all().await?;

        // Calculate file hash
        let content_hash = self.calculate_hash(content)?;

        info!("Document stored: {} ({})", filename, content_hash);

        Ok(StoredFile {
            file_id,
            filename,
            file_path,
            content_hash,
            file_size: content.len() as u64,
        })
    }

    pub async fn read_document(&self, file_path: &Path) -> Result<Vec<u8>> {
        if !file_path.starts_with(&self.documents_path) {
            return Err(AlLibraryError::security("Invalid file path"));
        }

        let content = fs::read(file_path).await?;
        Ok(content)
    }

    pub async fn delete_document(&self, file_path: &Path) -> Result<()> {
        if !file_path.starts_with(&self.documents_path) {
            return Err(AlLibraryError::security("Invalid file path"));
        }

        if file_path.exists() {
            fs::remove_file(file_path).await?;
            info!("Document deleted: {}", file_path.display());
        }

        Ok(())
    }

    pub async fn move_to_temp(&self, file_path: &Path) -> Result<PathBuf> {
        let filename = file_path.file_name()
            .ok_or_else(|| AlLibraryError::file_operation("Invalid filename"))?;
        let temp_path = self.temp_path.join(filename);

        fs::rename(file_path, &temp_path).await?;
        info!("File moved to temp: {}", temp_path.display());

        Ok(temp_path)
    }

    pub async fn cleanup_temp(&self) -> Result<()> {
        let mut dir = fs::read_dir(&self.temp_path).await?;
        let mut files_removed = 0;

        while let Some(entry) = dir.next_entry().await? {
            let path = entry.path();
            if path.is_file() {
                if let Err(e) = fs::remove_file(&path).await {
                    warn!("Failed to remove temp file {}: {}", path.display(), e);
                } else {
                    files_removed += 1;
                }
            }
        }

        info!("Temp cleanup completed: {} files removed", files_removed);
        Ok(())
    }

    pub async fn validate_file_integrity(&self, file_path: &Path, expected_hash: &str) -> Result<bool> {
        let content = self.read_document(file_path).await?;
        let actual_hash = self.calculate_hash(&content)?;
        Ok(actual_hash == expected_hash)
    }

    pub async fn get_file_size(&self, file_path: &Path) -> Result<u64> {
        let metadata = fs::metadata(file_path).await?;
        Ok(metadata.len())
    }

    pub async fn file_exists(&self, file_path: &Path) -> bool {
        file_path.exists()
    }

    fn calculate_hash(&self, content: &[u8]) -> Result<String> {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(content);
        let result = hasher.finalize();
        Ok(format!("{:x}", result))
    }

    pub async fn create_subdirectory(&self, subdirectory: &str) -> Result<PathBuf> {
        let subdir_path = self.documents_path.join(subdirectory);
        fs::create_dir_all(&subdir_path).await?;
        Ok(subdir_path)
    }

    pub async fn get_storage_stats(&self) -> Result<StorageStats> {
        let mut total_size = 0u64;
        let mut file_count = 0u32;

        let mut dir = fs::read_dir(&self.documents_path).await?;
        while let Some(entry) = dir.next_entry().await? {
            let path = entry.path();
            if path.is_file() {
                if let Ok(metadata) = fs::metadata(&path).await {
                    total_size += metadata.len();
                    file_count += 1;
                }
            }
        }

        Ok(StorageStats {
            total_size,
            file_count,
            documents_path: self.documents_path.clone(),
        })
    }
}

#[derive(Debug, Clone)]
pub struct StoredFile {
    pub file_id: String,
    pub filename: String,
    pub file_path: PathBuf,
    pub content_hash: String,
    pub file_size: u64,
}

#[derive(Debug)]
pub struct StorageStats {
    pub total_size: u64,
    pub file_count: u32,
    pub documents_path: PathBuf,
} 