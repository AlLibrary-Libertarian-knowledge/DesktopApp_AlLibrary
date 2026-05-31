use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tracing::info;
use crate::core::document::type_detection::TypeDetection;
use crate::core::document::file_operations::FileOperations;
use crate::core::document::pipeline::{
    compute_fingerprint_from_bytes, is_sidecar_file, is_treated_file, legacy_full_file_hash,
    read_sidecar, run_pipeline_to_file, PipelineProgress,
};
use crate::core::database::{
    delete_document_by_id_pool, document_seed_enabled_pool, remap_document_id_pool,
    upsert_treated_document_pool, upsert_untreated_by_path_pool, TreatedDocumentRow,
};
use crate::commands::seed_sync::notify_document_treated;
use tauri::{AppHandle, Emitter};
use crate::commands::settings::load_app_settings;
use crate::core::database::node_db::ensure_node_database;
use crate::core::database::delete_local_share_by_path_pool;
use crate::core::database::activity_log::insert_activity_pool;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentInfo {
    pub id: String,
    pub filename: String,
    pub file_path: String,
    pub file_size: u64,
    pub document_type: String,
    pub created_at: String,
    pub modified_at: String,
    pub cultural_context: Option<CulturalContext>,
    pub metadata: DocumentMetadata,
    #[serde(default)]
    pub is_treated: bool,
    #[serde(default = "default_processing_status")]
    pub processing_status: String,
    pub content_hash: Option<String>,
    pub canonical_name: Option<String>,
    pub original_filename: Option<String>,
    #[serde(default = "default_seed_enabled")]
    pub seed_enabled: bool,
}

fn default_seed_enabled() -> bool {
    true
}

fn default_processing_status() -> String {
    "unknown".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CulturalContext {
    pub sensitivity_level: u32,
    pub cultural_origin: Option<String>,
    pub traditional_knowledge: bool,
    pub educational_resources: Vec<String>,
    pub community_acknowledgment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub categories: Vec<String>,
    pub language: Option<String>,
    pub page_count: Option<u32>,
    pub word_count: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub documents_found: u32,
    pub total_size: u64,
    pub scan_duration_ms: u64,
    pub documents: Vec<DocumentInfo>,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderInfo {
    pub path: String,
    pub exists: bool,
    pub document_count: u32,
    pub total_size: u64,
    pub last_scan: Option<String>,
}

/// Scan a folder for documents and return information about found files
#[tauri::command]
pub async fn scan_documents_folder(
    app: AppHandle,
    folder_path: String,
) -> Result<ScanResult, String> {
    let start_time = std::time::Instant::now();
    let path = PathBuf::from(&folder_path);
    
    info!("Starting document scan for folder: {}", folder_path);
    
    if !path.exists() {
        return Err(format!("Folder does not exist: {}", folder_path));
    }
    
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", folder_path));
    }
    
    let mut documents = Vec::new();
    let mut errors = Vec::new();
    let mut total_size = 0u64;
    let mut documents_found = 0u32;
    
    // Recursively scan the folder
    if let Err(e) = scan_directory_recursive(&app, &path, &mut documents, &mut errors, &mut total_size, &mut documents_found).await {
        errors.push(format!("Failed to scan directory: {}", e));
    }
    
    let scan_duration = start_time.elapsed().as_millis() as u64;

    if let Ok(pool) = ensure_node_database(&app).await {
        for doc in &documents {
            if let Err(e) = upsert_scanned_document(&pool, doc).await {
                errors.push(format!("DB upsert {}: {e}", doc.file_path));
            }
        }
    }

    info!("Document scan completed: {} documents found, {} bytes total, {}ms duration",
          documents_found, total_size, scan_duration);
    
    Ok(ScanResult {
        documents_found,
        total_size,
        scan_duration_ms: scan_duration,
        documents,
        errors,
    })
}

/// Get information about a specific folder
#[tauri::command]
pub async fn get_folder_info(folder_path: String) -> Result<FolderInfo, String> {
    let path = PathBuf::from(&folder_path);
    
    let exists = path.exists() && path.is_dir();
    let mut document_count = 0u32;
    let mut total_size = 0u64;
    
    if exists {
        // Quick scan to get basic info
        if let Ok(entries) = fs::read_dir(&path) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let entry_path = entry.path();
                    if entry_path.is_file() {
                        // Check if it's a supported document type
                        let mut is_document = false;
                        
                        if let Some(extension) = entry_path.extension() {
                            if let Some(ext_str) = extension.to_str() {
                                if TypeDetection::is_supported_extension(ext_str) {
                                    is_document = true;
                                }
                            }
                        }
                        
                        // If no extension or unsupported extension, check filename
                        if !is_document {
                            let filename = entry_path.file_name()
                                .and_then(|name| name.to_str())
                                .unwrap_or("")
                                .to_lowercase();
                            
                            if filename.contains("pdf") || filename.contains("epub") || 
                               filename.contains("txt") || filename.contains("md") ||
                               filename.contains("html") || filename.contains("htm") {
                                is_document = true;
                            }
                        }
                        
                        if is_document {
                            if let Ok(metadata) = entry.metadata() {
                                total_size += metadata.len();
                                document_count += 1;
                            }
                        }
                    }
                }
            }
        }
    }
    
    Ok(FolderInfo {
        path: folder_path,
        exists,
        document_count,
        total_size,
        last_scan: None, // TODO: Implement last scan tracking
    })
}

/// Get a list of documents in a folder (non-recursive)
#[tauri::command]
pub async fn list_documents_in_folder(
    app: AppHandle,
    folder_path: String,
) -> Result<Vec<DocumentInfo>, String> {
    let path = PathBuf::from(&folder_path);
    
    if !path.exists() || !path.is_dir() {
        return Err(format!("Invalid folder path: {}", folder_path));
    }
    
    let mut documents = Vec::new();
    
    if let Ok(entries) = fs::read_dir(&path) {
        for entry in entries {
            if let Ok(entry) = entry {
                let entry_path = entry.path();
                if entry_path.is_file() {
                    if is_sidecar_file(&entry_path) {
                        continue;
                    }
                    if let Ok(document_info) = create_document_info(&entry_path, Some(&app)).await {
                        documents.push(document_info);
                    }
                }
            }
        }
    }
    
    Ok(documents)
}

/// Full pipeline treatment + save to library (steps 0–7).
#[tauri::command]
pub async fn process_document(
    app_handle: AppHandle,
    target_dir: String,
    source_path: String,
    user_title: Option<String>,
    expected_content_hash: Option<String>,
) -> Result<DocumentInfo, String> {
    let src = PathBuf::from(&source_path);
    let dst_dir = PathBuf::from(&target_dir);
    if !dst_dir.exists() {
        fs::create_dir_all(&dst_dir).map_err(|e| e.to_string())?;
    }
    if !src.exists() || !src.is_file() {
        return Err("Source file not found".into());
    }

    let filename = src
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("Bad filename")?
        .to_string();
    let dest_path = dst_dir.join(&filename);
    let dest_for_pipeline = dest_path.clone();

    let app_emit = app_handle.clone();
    let progress_cb: Option<Box<dyn Fn(PipelineProgress) + Send + Sync>> =
        Some(Box::new(move |p: PipelineProgress| {
            let _ = app_emit.emit(
                "document-pipeline-progress",
                serde_json::json!({
                    "step": p.step,
                    "label": p.label,
                    "percent": p.percent,
                }),
            );
        }));

    let pipeline_out = tokio::task::spawn_blocking(move || {
        run_pipeline_to_file(&src, &dest_for_pipeline, progress_cb)
    })
    .await
    .map_err(|e| format!("Pipeline join error: {e}"))??;

    if let Some(expected) = expected_content_hash {
        if pipeline_out.fingerprint.content_hash != expected {
            let _ = fs::remove_file(&dest_path);
            return Err(format!(
                "Content hash mismatch: expected {expected}, got {}",
                pipeline_out.fingerprint.content_hash
            ));
        }
    }

    let canonical_name = resolve_canonical_name(&app_handle, &pipeline_out.fingerprint.content_hash, &filename).await;

    let info = build_document_info_from_treated(
        &dest_path,
        &pipeline_out.fingerprint,
        &filename,
        &canonical_name,
        user_title,
        pipeline_out.page_count,
        true,
    )
    .await?;

    if let Ok(pool) = ensure_node_database(&app_handle).await {
        upsert_treated_document_pool(
            &pool,
            &TreatedDocumentRow {
                id: info.id.clone(),
                content_hash: info.content_hash.clone().unwrap_or_default(),
                local_path: info.file_path.clone(),
                title: info.metadata.title.clone().unwrap_or(filename.clone()),
                original_filename: filename,
                canonical_name,
                file_type: info.document_type.clone(),
                file_size: info.file_size as i64,
                page_count: pipeline_out.page_count as i32,
                chunk_count: pipeline_out.fingerprint.chunk_count as i32,
                hash_scheme: pipeline_out.fingerprint.hash_scheme.clone(),
                is_treated: true,
                processing_status: "treated".to_string(),
            },
        )
        .await?;

        let payload = serde_json::json!({
            "title": info.metadata.title,
            "contentHash": info.content_hash,
        })
        .to_string();
        let _ = insert_activity_pool(&pool, "upload", Some(&info.id), Some(&payload)).await;
    }

    let _ = app_handle.emit(
        "document-pipeline-progress",
        serde_json::json!({
            "step": 7,
            "label": "Complete",
            "percent": 100,
        }),
    );

    notify_document_treated(&app_handle, &info.file_path);

    Ok(info)
}

/// Securely import a document — runs full treatment pipeline.
#[tauri::command]
pub async fn import_document(
    app_handle: AppHandle,
    target_dir: String,
    source_path: String,
) -> Result<DocumentInfo, String> {
    process_document(app_handle, target_dir, source_path, None, None).await
}

/// Re-process library files with whiteboard-v2 hashes; remap favorites/activity ids.
#[tauri::command]
pub async fn migrate_library_hashes(
    app_handle: AppHandle,
    folder_path: Option<String>,
) -> Result<serde_json::Value, String> {
    let folder = if let Some(p) = folder_path {
        PathBuf::from(p)
    } else {
        let settings = load_app_settings(app_handle.clone())
            .await
            .map_err(|e| e.to_string())?;
        PathBuf::from(settings.folder_structure.documents_folder)
    };

    let pool = ensure_node_database(&app_handle).await?;
    let mut migrated = 0u32;
    let mut errors: Vec<String> = Vec::new();

    let entries = collect_pdf_epub_files(&folder);
    for path in entries {
        let old_id = legacy_full_file_hash(&fs::read(&path).unwrap_or_default());
        match process_document(
            app_handle.clone(),
            folder.to_string_lossy().to_string(),
            path.to_string_lossy().to_string(),
            None,
            None,
        )
        .await
        {
            Ok(info) => {
                if old_id != info.id {
                    let _ = remap_document_id_pool(&pool, &old_id, &info.id).await;
                    let _ = delete_document_by_id_pool(&pool, &old_id).await;
                }
                migrated += 1;
            }
            Err(e) => errors.push(format!("{}: {e}", path.display())),
        }
    }

    Ok(serde_json::json!({
        "migrated": migrated,
        "errors": errors,
    }))
}

fn collect_pdf_epub_files(dir: &Path) -> Vec<PathBuf> {
    let mut out = Vec::new();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                let ext = p
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_lowercase();
                if ext == "pdf" || ext == "epub" {
                    out.push(p);
                }
            } else if p.is_dir() {
                out.extend(collect_pdf_epub_files(&p));
            }
        }
    }
    out
}

async fn resolve_canonical_name(
    app: &AppHandle,
    content_hash: &str,
    fallback: &str,
) -> String {
    if let Ok(pool) = ensure_node_database(app).await {
        if let Ok(Some(name)) = sqlx::query_scalar::<_, String>(
            "SELECT name FROM network_files WHERE content_hash = ? LIMIT 1",
        )
        .bind(content_hash)
        .fetch_optional(&pool)
        .await
        {
            return name;
        }
    }
    fallback.to_string()
}

/// Process a downloaded raw file into the library (post-fetch pipeline).
pub async fn process_downloaded_file_internal(
    app_handle: &AppHandle,
    raw_path: PathBuf,
    library_dir: PathBuf,
    expected_content_hash: Option<String>,
    user_title: Option<String>,
) -> Result<DocumentInfo, String> {
    process_document(
        app_handle.clone(),
        library_dir.to_string_lossy().to_string(),
        raw_path.to_string_lossy().to_string(),
        user_title,
        expected_content_hash,
    )
    .await
}

pub async fn ensure_seeding_allowed(path: &Path) -> Result<(), String> {
    crate::core::document::seeding::ensure_seeding_allowed(path).await
}

pub async fn get_document_info_internal(file_path: &str) -> Result<DocumentInfo, String> {
    let path = PathBuf::from(file_path);
    if !path.exists() || !path.is_file() {
        return Err(format!("File does not exist: {file_path}"));
    }
    create_document_info(&path, None).await
}

/// Get detailed information about a specific document
#[tauri::command]
pub async fn get_document_info(
    app: AppHandle,
    file_path: String,
) -> Result<DocumentInfo, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() || !path.is_file() {
        return Err(format!("File does not exist: {file_path}"));
    }
    create_document_info(&path, Some(&app)).await
}

/// Open a document and return its content for preview
#[tauri::command]
pub async fn open_document(file_path: String) -> Result<Vec<u8>, String> {
    let path = PathBuf::from(&file_path);
    
    if !path.exists() || !path.is_file() {
        return Err(format!("File does not exist: {}", file_path));
    }
    
    // Validate file size (max 50MB for preview)
    if let Ok(metadata) = fs::metadata(&path) {
        if metadata.len() > 50 * 1024 * 1024 {
            return Err("File too large for preview (max 50MB)".to_string());
        }
    }
    
    // Read file content
    fs::read(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

// Helper function to recursively scan a directory
async fn scan_directory_recursive(
    app: &AppHandle,
    dir_path: &Path,
    documents: &mut Vec<DocumentInfo>,
    errors: &mut Vec<String>,
    total_size: &mut u64,
    documents_found: &mut u32,
) -> Result<(), String> {
    info!("Scanning directory: {}", dir_path.display());
    
    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry in entries {
            if let Ok(entry) = entry {
                let entry_path = entry.path();
                info!("Found entry: {}", entry_path.display());
                
                if entry_path.is_file() {
                    info!("Processing file: {}", entry_path.display());
                    
                    // Check if it's a supported document type
                    if let Some(extension) = entry_path.extension() {
                        if let Some(ext_str) = extension.to_str() {
                            info!("File extension: {}", ext_str);
                            
                            if TypeDetection::is_supported_extension(ext_str) {
                                info!("Supported extension found: {}", ext_str);
                                match create_document_info(&entry_path, Some(app)).await {
                                    Ok(doc_info) => {
                                        info!("Successfully processed document: {} (size: {})", doc_info.filename, doc_info.file_size);
                                        *total_size += doc_info.file_size;
                                        *documents_found += 1;
                                        documents.push(doc_info);
                                    }
                                    Err(e) => {
                                        let error_msg = format!("Failed to process {}: {}", entry_path.display(), e);
                                        info!("{}", error_msg);
                                        errors.push(error_msg);
                                    }
                                }
                            } else {
                                info!("Unsupported extension: {}", ext_str);
                                
                                // Try to detect type from filename without extension
                                let filename = entry_path.file_name()
                                    .and_then(|name| name.to_str())
                                    .unwrap_or("");
                                
                                info!("Filename: {}", filename);
                                
                                // Check if filename contains document type indicators
                                let lower_filename = filename.to_lowercase();
                                if lower_filename.contains("pdf") || lower_filename.contains(".pdf") {
                                    info!("Detected PDF from filename: {}", filename);
                                    match create_document_info(&entry_path, Some(app)).await {
                                        Ok(doc_info) => {
                                            info!("Successfully processed PDF document: {} (size: {})", doc_info.filename, doc_info.file_size);
                                            *total_size += doc_info.file_size;
                                            *documents_found += 1;
                                            documents.push(doc_info);
                                        }
                                        Err(e) => {
                                            let error_msg = format!("Failed to process PDF {}: {}", entry_path.display(), e);
                                            info!("{}", error_msg);
                                            errors.push(error_msg);
                                        }
                                    }
                                } else if lower_filename.contains("epub") || lower_filename.contains(".epub") {
                                    info!("Detected EPUB from filename: {}", filename);
                                    match create_document_info(&entry_path, Some(app)).await {
                                        Ok(doc_info) => {
                                            info!("Successfully processed EPUB document: {} (size: {})", doc_info.filename, doc_info.file_size);
                                            *total_size += doc_info.file_size;
                                            *documents_found += 1;
                                            documents.push(doc_info);
                                        }
                                        Err(e) => {
                                            let error_msg = format!("Failed to process EPUB {}: {}", entry_path.display(), e);
                                            info!("{}", error_msg);
                                            errors.push(error_msg);
                                        }
                                    }
                                }
                            }
                        } else {
                            info!("Could not convert extension to string for: {}", entry_path.display());
                        }
                    } else {
                        info!("No extension found for: {}", entry_path.display());
                    }
                } else if entry_path.is_dir() {
                    info!("Found subdirectory: {}", entry_path.display());
                    // Recursively scan subdirectories - use Box::pin to avoid recursion issues
                    let future = Box::pin(scan_directory_recursive(app, &entry_path, documents, errors, total_size, documents_found));
                    if let Err(e) = future.await {
                        let error_msg = format!("Failed to scan subdirectory {}: {}", entry_path.display(), e);
                        info!("{}", error_msg);
                        errors.push(error_msg);
                    }
                }
            }
        }
    } else {
        let error_msg = format!("Failed to read directory: {}", dir_path.display());
        info!("{}", error_msg);
        return Err(error_msg);
    }
    
    info!("Finished scanning directory: {} (found {} documents)", dir_path.display(), documents.len());
    Ok(())
}

// Staging id for untreated files (path-based, not content identity).
fn path_staging_id(file_path: &Path) -> String {
    format!(
        "untreated:{}",
        blake3::hash(file_path.to_string_lossy().as_bytes()).to_hex()
    )
}

async fn upsert_scanned_document(pool: &sqlx::SqlitePool, doc: &DocumentInfo) -> Result<(), String> {
    if doc.is_treated {
        let content_hash = doc.content_hash.clone().unwrap_or_else(|| doc.id.clone());
        let seed_enabled = document_seed_enabled_pool(pool, &doc.file_path)
            .await
            .unwrap_or(doc.seed_enabled);
        upsert_treated_document_pool(
            pool,
            &TreatedDocumentRow {
                id: doc.id.clone(),
                content_hash,
                local_path: doc.file_path.clone(),
                title: doc
                    .metadata
                    .title
                    .clone()
                    .unwrap_or_else(|| doc.filename.clone()),
                original_filename: doc
                    .original_filename
                    .clone()
                    .unwrap_or_else(|| doc.filename.clone()),
                canonical_name: doc
                    .canonical_name
                    .clone()
                    .unwrap_or_else(|| doc.filename.clone()),
                file_type: doc.document_type.clone(),
                file_size: doc.file_size as i64,
                page_count: doc.metadata.page_count.unwrap_or(0) as i32,
                chunk_count: 0,
                hash_scheme: "whiteboard-v2".to_string(),
                is_treated: true,
                processing_status: doc.processing_status.clone(),
            },
        )
        .await?;
        if !seed_enabled {
            let _ = crate::core::database::set_document_shared_pool(pool, &doc.file_path, false).await;
        }
    } else {
        let path_id = path_staging_id(std::path::Path::new(&doc.file_path));
        upsert_untreated_by_path_pool(
            pool,
            &path_id,
            &doc.file_path,
            &doc.filename,
            &doc.document_type,
            doc.file_size as i64,
        )
        .await?;
    }
    Ok(())
}

async fn build_document_info_from_treated(
    file_path: &Path,
    fp: &crate::core::document::pipeline::ContentFingerprint,
    original_filename: &str,
    canonical_name: &str,
    user_title: Option<String>,
    page_count: u32,
    seed_enabled: bool,
) -> Result<DocumentInfo, String> {
    let base = file_metadata_fields(file_path)?;
    let title = user_title.unwrap_or_else(|| original_filename.to_string());

    Ok(DocumentInfo {
        id: fp.content_hash.clone(),
        filename: canonical_name.to_string(),
        file_path: base.file_path,
        file_size: base.file_size,
        document_type: base.document_type,
        created_at: base.created_at,
        modified_at: base.modified_at,
        cultural_context: default_cultural_context(),
        metadata: DocumentMetadata {
            title: Some(title),
            author: None,
            description: None,
            tags: Vec::new(),
            categories: Vec::new(),
            language: None,
            page_count: Some(page_count),
            word_count: None,
        },
        is_treated: true,
        processing_status: "treated".to_string(),
        content_hash: Some(fp.content_hash.clone()),
        canonical_name: Some(canonical_name.to_string()),
        original_filename: Some(original_filename.to_string()),
        seed_enabled,
    })
}

struct FileMetaFields {
    file_path: String,
    file_size: u64,
    document_type: String,
    created_at: String,
    modified_at: String,
}

fn file_metadata_fields(file_path: &Path) -> Result<FileMetaFields, String> {
    let metadata = fs::metadata(file_path).map_err(|e| format!("Failed to get file metadata: {e}"))?;
    let file_size = metadata.len();
    let created_at = metadata
        .created()
        .unwrap_or_else(|_| metadata.modified().unwrap_or_else(|_| std::time::SystemTime::now()))
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let modified_at = metadata
        .modified()
        .unwrap_or_else(|_| std::time::SystemTime::now())
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let mut document_type = TypeDetection::detect_from_path(file_path).to_string();
    if document_type == "UNKNOWN" {
        let filename = file_path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("")
            .to_lowercase();
        if filename.contains("pdf") {
            document_type = "PDF".to_string();
        } else if filename.contains("epub") {
            document_type = "EPUB".to_string();
        }
    }

    Ok(FileMetaFields {
        file_path: file_path.to_string_lossy().to_string(),
        file_size,
        document_type,
        created_at: created_at.to_string(),
        modified_at: modified_at.to_string(),
    })
}

fn default_cultural_context() -> Option<CulturalContext> {
    Some(CulturalContext {
        sensitivity_level: 1,
        cultural_origin: None,
        traditional_knowledge: false,
        educational_resources: Vec::new(),
        community_acknowledgment: None,
    })
}

// Helper function to create DocumentInfo from a file path
async fn create_document_info(
    file_path: &Path,
    app: Option<&AppHandle>,
) -> Result<DocumentInfo, String> {
    let filename = file_path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "Invalid filename".to_string())?
        .to_string();

    let base = file_metadata_fields(file_path)?;
    let path_str = base.file_path.clone();

    async fn resolve_seed_enabled(
        app: Option<&AppHandle>,
        path: &str,
        is_treated: bool,
    ) -> bool {
        if !is_treated {
            return false;
        }
        if let Some(app) = app {
            if let Ok(pool) = ensure_node_database(app).await {
                return document_seed_enabled_pool(&pool, path)
                    .await
                    .unwrap_or(true);
            }
        }
        true
    }

    if is_treated_file(file_path) {
        let seed_enabled = resolve_seed_enabled(app, &path_str, true).await;
        if let Some(fp) = read_sidecar(file_path) {
            return build_document_info_from_treated(
                file_path,
                &fp,
                &filename,
                &filename,
                None,
                fp.page_count,
                seed_enabled,
            )
            .await;
        }
        let bytes = fs::read(file_path).map_err(|e| e.to_string())?;
        let fp = compute_fingerprint_from_bytes(&bytes, 0);
        return build_document_info_from_treated(
            file_path,
            &fp,
            &filename,
            &filename,
            None,
            fp.page_count,
            seed_enabled,
        )
        .await;
    }

    let id = path_staging_id(file_path);

    Ok(DocumentInfo {
        id,
        filename: filename.clone(),
        file_path: base.file_path,
        file_size: base.file_size,
        document_type: base.document_type,
        created_at: base.created_at,
        modified_at: base.modified_at,
        cultural_context: default_cultural_context(),
        metadata: DocumentMetadata {
            title: Some(filename.clone()),
            author: None,
            description: None,
            tags: Vec::new(),
            categories: Vec::new(),
            language: None,
            page_count: None,
            word_count: None,
        },
        is_treated: false,
        processing_status: "untreated".to_string(),
        content_hash: None,
        canonical_name: None,
        original_filename: Some(filename),
        seed_enabled: false,
    })
}

// --- Native PDF rasterization using PDFium ---
#[tauri::command]
pub async fn pdf_get_page_count(file_path: String) -> Result<u32, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err("File not found".into());
    }

    tokio::task::spawn_blocking(move || {
        use pdfium_render::prelude::*;
        let bindings = Pdfium::bind_to_system_library()
            .or_else(|_| {
                // Try load from app resources directory next to the executable
                let exe_dir = std::env::current_exe()
                    .ok()
                    .and_then(|p| p.parent().map(|p| p.to_path_buf()))
                    .unwrap_or_else(|| std::path::PathBuf::from("."));
                let resources_dir = exe_dir.join("resources");
                let libname = Pdfium::pdfium_platform_library_name_at_path(resources_dir.to_string_lossy().as_ref());
                Pdfium::bind_to_library(libname)
            })
            .or_else(|_| {
                // Try load from the executable directory itself (drop pdfium.dll next to exe)
                let exe_dir = std::env::current_exe()
                    .ok()
                    .and_then(|p| p.parent().map(|p| p.to_path_buf()))
                    .unwrap_or_else(|| std::path::PathBuf::from("."));
                let libname = Pdfium::pdfium_platform_library_name_at_path(exe_dir.to_string_lossy().as_ref());
                Pdfium::bind_to_library(libname)
            })
            .map_err(|e| format!("Failed to bind to PDFium: {}", e))?;
        let pdfium = Pdfium::new(bindings);
        let doc = pdfium
            .load_pdf_from_file(&file_path, None)
            .map_err(|e| format!("Failed to open PDF: {}", e))?;
        Ok::<u32, String>(doc.pages().len() as u32)
    })
    .await
    .map_err(|e| format!("Join error: {}", e))?
}

#[tauri::command]
pub async fn pdf_render_page_png(file_path: String, page_index: u32, scale: f32) -> Result<Vec<u8>, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err("File not found".into());
    }

    tokio::task::spawn_blocking(move || {
        use pdfium_render::prelude::*;
        let bindings = Pdfium::bind_to_system_library()
            .or_else(|_| {
                let exe_dir = std::env::current_exe()
                    .ok()
                    .and_then(|p| p.parent().map(|p| p.to_path_buf()))
                    .unwrap_or_else(|| std::path::PathBuf::from("."));
                let resources_dir = exe_dir.join("resources");
                let libname = Pdfium::pdfium_platform_library_name_at_path(resources_dir.to_string_lossy().as_ref());
                Pdfium::bind_to_library(libname)
            })
            .or_else(|_| {
                let exe_dir = std::env::current_exe()
                    .ok()
                    .and_then(|p| p.parent().map(|p| p.to_path_buf()))
                    .unwrap_or_else(|| std::path::PathBuf::from("."));
                let libname = Pdfium::pdfium_platform_library_name_at_path(exe_dir.to_string_lossy().as_ref());
                Pdfium::bind_to_library(libname)
            })
            .map_err(|e| format!("Failed to bind to PDFium: {}", e))?;
        let pdfium = Pdfium::new(bindings);
        let doc = pdfium
            .load_pdf_from_file(&file_path, None)
            .map_err(|e| format!("Failed to open PDF: {}", e))?;
        let pages = doc.pages();
        let idx: usize = page_index as usize;
        if idx >= pages.len() as usize {
            return Err(format!("Page index {} out of range {}", idx, pages.len()));
        }
        let page = pages.get(idx as u16).map_err(|e| format!("{}", e))?;
        let bitmap = page
            .render_with_config(
                &PdfRenderConfig::new()
                    .scale_page_by_factor(scale),
            )
            .map_err(|e| format!("Render failed: {}", e))?;

        // Encode RGBA bytes to PNG
        let rgba = bitmap.as_rgba_bytes();
        let width = bitmap.width() as u32;
        let height = bitmap.height() as u32;

        let mut buffer: Vec<u8> = Vec::new();
        {
            let mut encoder = png::Encoder::new(&mut buffer, width, height);
            encoder.set_color(png::ColorType::Rgba);
            encoder.set_depth(png::BitDepth::Eight);
            let mut writer = encoder
                .write_header()
                .map_err(|e| format!("PNG header write failed: {}", e))?;
            writer
                .write_image_data(&rgba)
                .map_err(|e| format!("PNG encode failed: {}", e))?;
        }

        Ok::<Vec<u8>, String>(buffer)
    })
    .await
    .map_err(|e| format!("Join error: {}", e))?
}

// ---------- Annotation export support (flatten to PNGs) ----------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverlayRect {
    pub page: u32,            // 1-based page number
    pub x: f32,               // normalized [0..1]
    pub y: f32,               // normalized [0..1]
    pub w: f32,               // normalized width
    pub h: f32,               // normalized height
    pub fill_rgba: [u8; 4],   // rgba
    pub stroke_rgba: [u8; 4], // rgba
    pub stroke_width: f32,    // pixels
}

fn blend_pixel(dst: &mut [u8; 4], src: [u8; 4]) {
    let sa = src[3] as f32 / 255.0;
    let da = dst[3] as f32 / 255.0;
    let out_a = sa + da * (1.0 - sa);
    if out_a <= 0.0 {
        dst.copy_from_slice(&[0, 0, 0, 0]);
        return;
    }
    for i in 0..3 {
        let sc = src[i] as f32 / 255.0;
        let dc = dst[i] as f32 / 255.0;
        let out = (sc * sa + dc * da * (1.0 - sa)) / out_a;
        dst[i] = (out * 255.0).round() as u8;
    }
    dst[3] = (out_a * 255.0).round() as u8;
}

fn draw_rect_rgba(
    rgba: &mut [u8],
    width: u32,
    height: u32,
    rect: &OverlayRect,
    scale: f32,
) {
    let w = width as i32;
    let h = height as i32;
    let sx = (rect.x * width as f32) as i32;
    let sy = (rect.y * height as f32) as i32;
    let sw = (rect.w * width as f32) as i32;
    let sh = (rect.h * height as f32) as i32;
    let ex = (sx + sw).clamp(0, w - 1);
    let ey = (sy + sh).clamp(0, h - 1);
    let sx = sx.clamp(0, w - 1);
    let sy = sy.clamp(0, h - 1);
    if ex <= sx || ey <= sy { return; }

    let mut px = [0u8; 4];

    // fill
    for y in sy..ey {
        for x in sx..ex {
            let idx = ((y as u32 * width + x as u32) * 4) as usize;
            px.copy_from_slice(&rgba[idx..idx+4]);
            blend_pixel(&mut px, rect.fill_rgba);
            rgba[idx..idx+4].copy_from_slice(&px);
        }
    }

    // stroke
    let s = (rect.stroke_width * scale).max(1.0) as i32;
    for i in 0..s {
        let top = (sy + i).clamp(0, h - 1);
        let bottom = (ey - 1 - i).clamp(0, h - 1);
        for x in sx..ex {
            let idx_top = ((top as u32 * width + x as u32) * 4) as usize;
            px.copy_from_slice(&rgba[idx_top..idx_top+4]);
            blend_pixel(&mut px, rect.stroke_rgba);
            rgba[idx_top..idx_top+4].copy_from_slice(&px);

            let idx_bottom = ((bottom as u32 * width + x as u32) * 4) as usize;
            px.copy_from_slice(&rgba[idx_bottom..idx_bottom+4]);
            blend_pixel(&mut px, rect.stroke_rgba);
            rgba[idx_bottom..idx_bottom+4].copy_from_slice(&px);
        }
        let left = (sx + i).clamp(0, w - 1);
        let right = (ex - 1 - i).clamp(0, w - 1);
        for y in sy..ey {
            let idx_left = ((y as u32 * width + left as u32) * 4) as usize;
            px.copy_from_slice(&rgba[idx_left..idx_left+4]);
            blend_pixel(&mut px, rect.stroke_rgba);
            rgba[idx_left..idx_left+4].copy_from_slice(&px);

            let idx_right = ((y as u32 * width + right as u32) * 4) as usize;
            px.copy_from_slice(&rgba[idx_right..idx_right+4]);
            blend_pixel(&mut px, rect.stroke_rgba);
            rgba[idx_right..idx_right+4].copy_from_slice(&px);
        }
    }
}

#[tauri::command]
pub async fn export_annotated_pngs(
    file_path: String,
    overlays: Vec<OverlayRect>,
    scale: Option<f32>,
) -> Result<Vec<String>, String> {
    let output_dir = {
        let p = PathBuf::from(&file_path);
        let stem = p
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("export");
        let dir = p
            .parent()
            .unwrap_or_else(|| Path::new(".")).join(format!("{}__annotated_export", stem));
        if !dir.exists() { fs::create_dir_all(&dir).map_err(|e| format!("Failed to create dir: {}", e))?; }
        dir
    };

    let page_file_paths = tokio::task::spawn_blocking(move || {
        use pdfium_render::prelude::*;
        let bindings = Pdfium::bind_to_system_library()
            .or_else(|_| {
                let exe_dir = std::env::current_exe()
                    .ok()
                    .and_then(|p| p.parent().map(|p| p.to_path_buf()))
                    .unwrap_or_else(|| std::path::PathBuf::from("."));
                let resources_dir = exe_dir.join("resources");
                let libname = Pdfium::pdfium_platform_library_name_at_path(resources_dir.to_string_lossy().as_ref());
                Pdfium::bind_to_library(libname)
            })
            .or_else(|_| {
                let exe_dir = std::env::current_exe()
                    .ok()
                    .and_then(|p| p.parent().map(|p| p.to_path_buf()))
                    .unwrap_or_else(|| std::path::PathBuf::from("."));
                let libname = Pdfium::pdfium_platform_library_name_at_path(exe_dir.to_string_lossy().as_ref());
                Pdfium::bind_to_library(libname)
            })
            .map_err(|e| format!("Failed to bind to PDFium: {}", e))?;

        let pdfium = Pdfium::new(bindings);
        let doc = pdfium
            .load_pdf_from_file(&file_path, None)
            .map_err(|e| format!("Failed to open PDF: {}", e))?;
        let pages = doc.pages();
        let mut file_paths: Vec<String> = Vec::new();
        let scale = scale.unwrap_or(1.0);

        for i in 0..pages.len() {
            let page = pages.get(i as u16).map_err(|e| format!("{}", e))?;
            let bitmap = page
                .render_with_config(&PdfRenderConfig::new().scale_page_by_factor(scale))
                .map_err(|e| format!("Render failed: {}", e))?;

            let mut rgba = bitmap.as_rgba_bytes().to_vec();
            let width = bitmap.width() as u32;
            let height = bitmap.height() as u32;

            // draw overlays for this page (1-based page index)
            let page_index = (i + 1) as u32;
            for r in overlays.iter().filter(|r| r.page == page_index) {
                draw_rect_rgba(&mut rgba, width, height, r, scale);
            }

            // encode to PNG and save
            let mut buffer: Vec<u8> = Vec::new();
            {
                let mut encoder = png::Encoder::new(&mut buffer, width, height);
                encoder.set_color(png::ColorType::Rgba);
                encoder.set_depth(png::BitDepth::Eight);
                let mut writer = encoder
                    .write_header()
                    .map_err(|e| format!("PNG header write failed: {}", e))?;
                writer
                    .write_image_data(&rgba)
                    .map_err(|e| format!("PNG encode failed: {}", e))?;
            }
            let path = output_dir.join(format!("page-{:04}.png", i + 1));
            fs::write(&path, &buffer).map_err(|e| format!("Failed to write file: {}", e))?;
            file_paths.push(path.to_string_lossy().to_string());
        }
        Ok::<Vec<String>, String>(file_paths)
    })
    .await
    .map_err(|e| format!("Join error: {}", e))??;

    Ok(page_file_paths)
}

fn is_protected_project_path(relative: &str) -> bool {
    let norm = relative.replace('\\', "/").to_lowercase();
    if norm.ends_with("allibrary.db") {
        return true;
    }
    if norm.starts_with("search_index/") || norm == "search_index" {
        return true;
    }
    if norm.starts_with("documents/allibrary.db") {
        return true;
    }
    false
}

fn validate_deletable_path(project_root: &Path, file_path: &Path) -> Result<PathBuf, String> {
    if !file_path.exists() {
        return Err(format!("File does not exist: {}", file_path.display()));
    }
    if !file_path.is_file() {
        return Err(format!("Path is not a file: {}", file_path.display()));
    }

    let project_canon = project_root
        .canonicalize()
        .map_err(|e| format!("Invalid project folder: {e}"))?;
    let file_canon = file_path
        .canonicalize()
        .map_err(|e| format!("Invalid file path: {e}"))?;

    if !file_canon.starts_with(&project_canon) {
        return Err("File must be inside the project folder".into());
    }

    let relative = file_canon
        .strip_prefix(&project_canon)
        .map_err(|_| "Failed to resolve path relative to project")?
        .to_string_lossy();

    if is_protected_project_path(relative.as_ref()) {
        return Err("This file is protected and cannot be deleted".into());
    }

    Ok(file_canon)
}

/// Permanently delete a local document file under the project folder.
#[tauri::command]
pub async fn delete_local_document(
    app_handle: AppHandle,
    file_path: String,
) -> Result<(), String> {
    let settings = load_app_settings(app_handle.clone()).await?;
    let project_root = PathBuf::from(settings.project.project_folder_path.trim());
    if project_root.as_os_str().is_empty() {
        return Err("Project folder is not configured".into());
    }

    let target = PathBuf::from(file_path.trim());
    let validated = validate_deletable_path(&project_root, &target)?;

    if let Ok(pool) = ensure_node_database(&app_handle).await {
        let path_str = validated.to_string_lossy().to_string();
        let _ = delete_local_share_by_path_pool(&pool, &path_str).await;
    }

    FileOperations::delete_file(&validated)
        .await
        .map_err(|e| e.to_string())?;

    info!("Deleted local document: {}", validated.display());
    Ok(())
}

#[cfg(test)]
mod delete_path_tests {
    use super::*;

    #[test]
    fn protected_paths_are_blocked() {
        assert!(is_protected_project_path("documents/allibrary.db"));
        assert!(is_protected_project_path("search_index/index_info.json"));
        assert!(is_protected_project_path("Search_Index/foo"));
        assert!(!is_protected_project_path("tor-design.pdf"));
        assert!(!is_protected_project_path("documents/report.pdf"));
    }
}
