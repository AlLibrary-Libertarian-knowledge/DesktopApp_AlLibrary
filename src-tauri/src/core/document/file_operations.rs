use crate::utils::error::{AlLibraryError, Result};
use std::path::{Path, PathBuf};
use tokio::fs;
use tokio::io::{AsyncWriteExt, AsyncReadExt, BufReader, BufWriter};
use tracing::info;

pub struct FileOperations;

impl FileOperations {
    pub async fn copy_file(source: &Path, destination: &Path) -> Result<()> {
        // Ensure destination directory exists
        if let Some(parent) = destination.parent() {
            fs::create_dir_all(parent).await?;
        }

        fs::copy(source, destination).await?;
        info!("File copied from {} to {}", source.display(), destination.display());
        Ok(())
    }

    pub async fn move_file(source: &Path, destination: &Path) -> Result<()> {
        // Ensure destination directory exists
        if let Some(parent) = destination.parent() {
            fs::create_dir_all(parent).await?;
        }

        fs::rename(source, destination).await?;
        info!("File moved from {} to {}", source.display(), destination.display());
        Ok(())
    }

    pub async fn read_file_bytes(file_path: &Path) -> Result<Vec<u8>> {
        // Check file size first
        let metadata = fs::metadata(file_path).await?;
        if metadata.len() > 50 * 1024 * 1024 { // 50MB threshold
            return Err(AlLibraryError::FileOperation { 
                message: "File too large for memory loading. Use streaming read instead.".to_string() 
            });
        }
        
        let content = fs::read(file_path).await?;
        Ok(content)
    }

    pub async fn write_file_bytes(file_path: &Path, content: &[u8]) -> Result<()> {
        // Ensure directory exists
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        let mut file = fs::File::create(file_path).await?;
        file.write_all(content).await?;
        file.sync_all().await?;
        Ok(())
    }

    pub async fn read_file_string(file_path: &Path) -> Result<String> {
        let content = fs::read_to_string(file_path).await?;
        Ok(content)
    }

    pub async fn write_file_string(file_path: &Path, content: &str) -> Result<()> {
        // Ensure directory exists
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        fs::write(file_path, content).await?;
        Ok(())
    }

    pub async fn delete_file(file_path: &Path) -> Result<()> {
        if file_path.exists() {
            fs::remove_file(file_path).await?;
            info!("File deleted: {}", file_path.display());
        }
        Ok(())
    }

    pub async fn delete_directory(dir_path: &Path) -> Result<()> {
        if dir_path.exists() {
            fs::remove_dir_all(dir_path).await?;
            info!("Directory deleted: {}", dir_path.display());
        }
        Ok(())
    }

    pub async fn create_directory(dir_path: &Path) -> Result<()> {
        fs::create_dir_all(dir_path).await?;
        info!("Directory created: {}", dir_path.display());
        Ok(())
    }

    pub async fn list_files(dir_path: &Path) -> Result<Vec<PathBuf>> {
        let mut files = Vec::new();
        let mut dir = fs::read_dir(dir_path).await?;

        while let Some(entry) = dir.next_entry().await? {
            let path = entry.path();
            if path.is_file() {
                files.push(path);
            }
        }

        files.sort();
        Ok(files)
    }

    pub async fn list_directories(dir_path: &Path) -> Result<Vec<PathBuf>> {
        let mut directories = Vec::new();
        let mut dir = fs::read_dir(dir_path).await?;

        while let Some(entry) = dir.next_entry().await? {
            let path = entry.path();
            if path.is_dir() {
                directories.push(path);
            }
        }

        directories.sort();
        Ok(directories)
    }

    pub async fn get_file_metadata(file_path: &Path) -> Result<FileMetadata> {
        let metadata = fs::metadata(file_path).await?;
        let modified = metadata.modified()?;
        let created = metadata.created().unwrap_or(modified);
        
        Ok(FileMetadata {
            size: metadata.len(),
            is_file: metadata.is_file(),
            is_directory: metadata.is_dir(),
            modified,
            created,
            readonly: metadata.permissions().readonly(),
        })
    }

    pub async fn file_exists(file_path: &Path) -> bool {
        file_path.exists()
    }

    pub async fn directory_exists(dir_path: &Path) -> bool {
        dir_path.exists() && dir_path.is_dir()
    }

    pub async fn ensure_directory_exists(dir_path: &Path) -> Result<()> {
        if !Self::directory_exists(dir_path).await {
            Self::create_directory(dir_path).await?;
        }
        Ok(())
    }

    pub async fn get_file_extension(file_path: &Path) -> Option<String> {
        file_path.extension()
            .and_then(|ext| ext.to_str())
            .map(|s| s.to_lowercase())
    }

    pub async fn get_filename_without_extension(file_path: &Path) -> Option<String> {
        file_path.file_stem()
            .and_then(|stem| stem.to_str())
            .map(|s| s.to_string())
    }

    pub async fn validate_path_security(file_path: &Path, allowed_base: &Path) -> Result<()> {
        let canonical_path = file_path.canonicalize()
            .map_err(|_| AlLibraryError::security("Invalid file path"))?;
        let canonical_base = allowed_base.canonicalize()
            .map_err(|_| AlLibraryError::security("Invalid base path"))?;

        if !canonical_path.starts_with(canonical_base) {
            return Err(AlLibraryError::security("Path traversal attempt detected"));
        }

        Ok(())
    }

    // Optimized for large files - streaming copy with progress
    pub async fn copy_file_streaming(
        source: &Path, 
        destination: &Path,
        progress_callback: Option<impl Fn(u64, u64)>
    ) -> Result<()> {
        if let Some(parent) = destination.parent() {
            fs::create_dir_all(parent).await?;
        }

        let source_file = fs::File::open(source).await?;
        let dest_file = fs::File::create(destination).await?;
        
        let file_size = source_file.metadata().await?.len();
        let mut reader = BufReader::new(source_file);
        let mut writer = BufWriter::new(dest_file);
        
        let mut buffer = vec![0u8; 64 * 1024]; // 64KB chunks
        let mut total_copied = 0u64;
        
        loop {
            let bytes_read = reader.read(&mut buffer).await?;
            if bytes_read == 0 { break; }
            
            writer.write_all(&buffer[..bytes_read]).await?;
            total_copied += bytes_read as u64;
            
            if let Some(ref callback) = progress_callback {
                callback(total_copied, file_size);
            }
        }
        
        writer.flush().await?;
        info!("Large file copied with streaming: {} to {}", source.display(), destination.display());
        Ok(())
    }

    // Stream large file reading to avoid memory spikes
    pub async fn read_file_bytes_streaming(
        file_path: &Path,
        max_chunk_size: usize
    ) -> Result<impl futures::Stream<Item = Result<Vec<u8>>>> {
        let file = fs::File::open(file_path).await?;
        let mut reader = BufReader::new(file);
        
        Ok(async_stream::stream! {
            let mut buffer = vec![0u8; max_chunk_size];
            loop {
                match reader.read(&mut buffer).await {
                    Ok(0) => break, // EOF
                    Ok(n) => yield Ok(buffer[..n].to_vec()),
                    Err(e) => {
                        yield Err(AlLibraryError::from(e));
                        break;
                    }
                }
            }
        })
    }

    // Batch file operations to reduce syscalls
    pub async fn batch_file_operations<F, Fut>(
        operations: Vec<F>
    ) -> Result<Vec<std::result::Result<(), AlLibraryError>>>
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = Result<()>>,
    {
        let futures = operations.into_iter().map(|op| op());
        let results = futures::future::join_all(futures).await;
        Ok(results)
    }
}

#[derive(Debug, Clone)]
pub struct FileMetadata {
    pub size: u64,
    pub is_file: bool,
    pub is_directory: bool,
    pub modified: std::time::SystemTime,
    pub created: std::time::SystemTime,
    pub readonly: bool,
} 