use crate::core::database::{get_pool, DocumentOperations, Document};
use crate::utils::{AlLibraryError, Result};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDocumentRequest {
    pub title: String,
    pub description: Option<String>,
    pub content_hash: String,
    pub file_type: String,
    pub file_size: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentResponse {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub content_hash: String,
    pub file_type: String,
    pub file_size: i64,
    pub created_at: String,
    pub updated_at: String,
    pub is_shared: bool,
    pub processing_status: String,
}

impl From<Document> for DocumentResponse {
    fn from(doc: Document) -> Self {
        Self {
            id: doc.id,
            title: doc.title,
            description: doc.description,
            content_hash: doc.content_hash,
            file_type: doc.file_type,
            file_size: doc.file_size,
            created_at: doc.created_at.format("%Y-%m-%d %H:%M:%S").to_string(),
            updated_at: doc.updated_at.format("%Y-%m-%d %H:%M:%S").to_string(),
            is_shared: doc.is_shared,
            processing_status: doc.processing_status,
        }
    }
}

#[tauri::command]
pub async fn create_document(request: CreateDocumentRequest) -> Result<DocumentResponse, String> {
    let pool = get_pool().map_err(|e| e.to_string())?;
    
    let document = Document {
        id: String::new(), // Will be generated
        title: request.title,
        description: request.description,
        content_hash: request.content_hash,
        file_type: request.file_type,
        file_size: request.file_size,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        language_code: None,
        publication_date: None,
        page_count: None,
        cultural_origin: None,
        traditional_knowledge_protocols: None,
        indigenous_permissions: None,
        local_path: None,
        is_shared: false,
        processing_status: "pending".to_string(),
        content_verification_hash: None,
        malware_scan_status: "pending".to_string(),
        javascript_stripped: false,
        peer_availability_count: 0,
        last_availability_check: None,
        download_priority: 0,
    };
    
    let created_document = DocumentOperations::create(pool, document)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(DocumentResponse::from(created_document))
}

#[tauri::command]
pub async fn get_document(id: String) -> Result<Option<DocumentResponse>, String> {
    let pool = get_pool().map_err(|e| e.to_string())?;
    
    let document = DocumentOperations::get_by_id(pool, &id)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(document.map(DocumentResponse::from))
}

#[tauri::command]
pub async fn get_all_documents(limit: Option<i64>, offset: Option<i64>) -> Result<Vec<DocumentResponse>, String> {
    let pool = get_pool().map_err(|e| e.to_string())?;
    
    let documents = DocumentOperations::get_all(pool, limit, offset)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(documents.into_iter().map(DocumentResponse::from).collect())
}

#[tauri::command]
pub async fn search_documents(query: String) -> Result<Vec<DocumentResponse>, String> {
    let pool = get_pool().map_err(|e| e.to_string())?;
    
    let documents = DocumentOperations::search_by_title(pool, &query)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(documents.into_iter().map(DocumentResponse::from).collect())
}

#[tauri::command]
pub async fn delete_document(id: String) -> Result<bool, String> {
    let pool = get_pool().map_err(|e| e.to_string())?;
    
    DocumentOperations::delete(pool, &id)
        .await
        .map_err(|e| e.to_string())
} 