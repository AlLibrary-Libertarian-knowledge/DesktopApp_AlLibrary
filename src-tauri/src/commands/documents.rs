use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::fs;
use tracing::info;
use crate::core::document::type_detection::TypeDetection;
use std::io::{Read, Write};
use lopdf::Document as LoDocument;
use zip::ZipArchive;

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
pub async fn scan_documents_folder(folder_path: String) -> Result<ScanResult, String> {
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
    if let Err(e) = scan_directory_recursive(&path, &mut documents, &mut errors, &mut total_size, &mut documents_found).await {
        errors.push(format!("Failed to scan directory: {}", e));
    }
    
    let scan_duration = start_time.elapsed().as_millis() as u64;
    
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
pub async fn list_documents_in_folder(folder_path: String) -> Result<Vec<DocumentInfo>, String> {
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
                    if let Ok(document_info) = create_document_info(&entry_path).await {
                        documents.push(document_info);
                    }
                }
            }
        }
    }
    
    Ok(documents)
}

/// Securely import a document (PDF/EPUB) into the library folder
/// - Validates extension and size
/// - Strips JavaScript actions from PDFs
/// - Validates EPUB structure (zip) and rejects scripts in OPF/HTML
/// - Saves to target_dir with original filename
#[tauri::command]
pub async fn import_document(target_dir: String, source_path: String) -> Result<DocumentInfo, String> {
    let src = PathBuf::from(&source_path);
    let dst_dir = PathBuf::from(&target_dir);
    if !dst_dir.exists() { fs::create_dir_all(&dst_dir).map_err(|e| e.to_string())?; }
    if !src.exists() || !src.is_file() { return Err("Source file not found".into()); }

    let ext = src.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    if ext != "pdf" && ext != "epub" { return Err("Only PDF and EPUB are allowed".into()); }

    // size limit 200MB
    let meta = fs::metadata(&src).map_err(|e| e.to_string())?;
    if meta.len() > 200 * 1024 * 1024 { return Err("File too large (>200MB)".into()); }

    let sanitized_path = dst_dir.join(src.file_name().ok_or("Bad filename")?);

    if ext == "pdf" {
        // Strip JavaScript from PDF
        let mut doc = LoDocument::load(&src).map_err(|e| format!("PDF parse failed: {}", e))?;
        // Remove names that often hold JS (OpenAction, AA, Names/JavaScript, etc.)
        if let Some(cat_id) = doc.trailer.get(b"Root").and_then(|r| r.as_reference()).ok() {
            if let Ok(mut catalog) = doc.get_object_mut(cat_id) {
                if let Ok(dict) = catalog.as_dict_mut() {
                    dict.remove(b"OpenAction");
                    dict.remove(b"AA");
                    dict.remove(b"Names");
                }
            }
        }
        // Also scrub any JavaScript actions in annotations
        for (_, obj) in doc.objects.iter_mut() {
            if let Ok(dict) = obj.as_dict_mut() {
                dict.remove(b"JS");
                dict.remove(b"JavaScript");
                dict.remove(b"S"); // remove action type references
            }
        }
        doc.compress();
        doc.save(&sanitized_path).map_err(|e| format!("Save failed: {}", e))?;
    } else { // epub
        // Basic EPUB validation: ensure it's a zip and entries do not include .js
        let file = fs::File::open(&src).map_err(|e| e.to_string())?;
        let mut zip = ZipArchive::new(file).map_err(|e| format!("Invalid EPUB (zip): {}", e))?;
        for i in 0..zip.len() {
            let mut f = zip.by_index(i).map_err(|e| e.to_string())?;
            let name = f.name().to_lowercase();
            if name.ends_with(".js") { return Err("EPUB contains JavaScript; rejected".into()); }
            // rudimentary scan for <script>
            if name.ends_with(".html") || name.ends_with(".xhtml") || name.ends_with(".opf") {
                let mut buf = String::new();
                let mut reader = std::io::BufReader::new(&mut f);
                let _ = reader.read_to_string(&mut buf); // ignore non-utf8
                if buf.contains("<script") { return Err("EPUB contains script tags; rejected".into()); }
            }
        }
        // If passes, copy original file as-is
        fs::copy(&src, &sanitized_path).map_err(|e| e.to_string())?;
    }

    // Return DocumentInfo for the imported file
    create_document_info(&sanitized_path).await
}

/// Get detailed information about a specific document
#[tauri::command]
pub async fn get_document_info(file_path: String) -> Result<DocumentInfo, String> {
    let path = PathBuf::from(&file_path);
    
    if !path.exists() || !path.is_file() {
        return Err(format!("File does not exist: {}", file_path));
    }
    
    create_document_info(&path).await
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
                                match create_document_info(&entry_path).await {
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
                                    match create_document_info(&entry_path).await {
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
                                    match create_document_info(&entry_path).await {
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
                    let future = Box::pin(scan_directory_recursive(&entry_path, documents, errors, total_size, documents_found));
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

// Helper function to create DocumentInfo from a file path
async fn create_document_info(file_path: &Path) -> Result<DocumentInfo, String> {
    let filename = file_path.file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "Invalid filename".to_string())?
        .to_string();
    
    let file_path_str = file_path.to_string_lossy().to_string();
    
    // Get file metadata
    let metadata = fs::metadata(file_path).map_err(|e| format!("Failed to get file metadata: {}", e))?;
    
    let file_size = metadata.len();
    let created_at = metadata.created()
        .unwrap_or_else(|_| metadata.modified().unwrap_or_else(|_| std::time::SystemTime::now()))
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    
    let modified_at = metadata.modified()
        .unwrap_or_else(|_| std::time::SystemTime::now())
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    
    // Detect document type
    let mut document_type = TypeDetection::detect_from_path(file_path).to_string();
    
    // If type is unknown, try to detect from filename
    if document_type == "UNKNOWN" {
        let filename = file_path.file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("")
            .to_lowercase();
        
        if filename.contains("pdf") || filename.contains(".pdf") {
            document_type = "PDF".to_string();
        } else if filename.contains("epub") || filename.contains(".epub") {
            document_type = "EPUB".to_string();
        } else if filename.contains("txt") || filename.contains(".txt") {
            document_type = "TXT".to_string();
        } else if filename.contains("md") || filename.contains("markdown") {
            document_type = "MD".to_string();
        } else if filename.contains("html") || filename.contains("htm") {
            document_type = "HTML".to_string();
        }
    }
    
    // Generate document ID (hash of file path)
    let id = format!("{:x}", md5::compute(file_path_str.as_bytes()));
    
    // Create basic metadata
    let metadata = DocumentMetadata {
        title: Some(filename.clone()),
        author: None,
        description: None,
        tags: Vec::new(),
        categories: Vec::new(),
        language: None,
        page_count: None,
        word_count: None,
    };
    
    // Create cultural context (default to level 1 - general access)
    let cultural_context = Some(CulturalContext {
        sensitivity_level: 1,
        cultural_origin: None,
        traditional_knowledge: false,
        educational_resources: Vec::new(),
        community_acknowledgment: None,
    });
    
    Ok(DocumentInfo {
        id,
        filename,
        file_path: file_path_str,
        file_size,
        document_type,
        created_at: created_at.to_string(),
        modified_at: modified_at.to_string(),
        cultural_context,
        metadata,
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
