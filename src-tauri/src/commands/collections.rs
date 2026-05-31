use crate::core::database::ensure_node_database;
use crate::core::database::models::Collection;
use crate::core::database::CollectionOperations;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCollectionRequest {
    pub name: String,
    pub description: Option<String>,
    pub document_ids: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCollectionRequest {
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CollectionResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub document_count: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub document_ids: Option<Vec<String>>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CollectionDocumentResponse {
    pub id: String,
    pub title: String,
    pub file_type: String,
    pub file_size: i64,
    pub local_path: Option<String>,
}

async fn to_response(
    pool: &sqlx::SqlitePool,
    collection: Collection,
    include_document_ids: bool,
) -> Result<CollectionResponse, String> {
    let document_count = CollectionOperations::count_documents(pool, &collection.id)
        .await
        .map_err(|e| format!("Failed to count documents: {e}"))?;
    let document_ids = if include_document_ids {
        Some(
            CollectionOperations::list_document_ids(pool, &collection.id)
                .await
                .map_err(|e| format!("Failed to list document ids: {e}"))?,
        )
    } else {
        None
    };

    Ok(CollectionResponse {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        document_count,
        document_ids,
        created_at: collection.created_at.to_rfc3339(),
        updated_at: collection.updated_at.to_rfc3339(),
    })
}

#[tauri::command]
pub async fn create_collection(
    app_handle: tauri::AppHandle,
    request: CreateCollectionRequest,
) -> Result<CollectionResponse, String> {
    if request.name.trim().is_empty() {
        return Err("Collection name is required".to_string());
    }

    let pool = ensure_node_database(&app_handle).await?;

    let collection = Collection {
        id: String::new(),
        name: request.name.trim().to_string(),
        description: request
            .description
            .map(|d| d.trim().to_string())
            .filter(|d| !d.is_empty()),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    let created = CollectionOperations::create(&pool, collection)
        .await
        .map_err(|e| format!("Failed to create collection: {e}"))?;

    if let Some(document_ids) = request.document_ids {
        if !document_ids.is_empty() {
            CollectionOperations::add_documents(&pool, &created.id, &document_ids)
                .await
                .map_err(|e| format!("Failed to link documents: {e}"))?;
        }
    }

    to_response(&pool, created, true).await
}

#[tauri::command]
pub async fn get_collections(app_handle: tauri::AppHandle) -> Result<Vec<CollectionResponse>, String> {
    let pool = ensure_node_database(&app_handle).await?;

    let collections = CollectionOperations::get_all(&pool)
        .await
        .map_err(|e| format!("Failed to get collections: {e}"))?;

    let mut responses = Vec::with_capacity(collections.len());
    for collection in collections {
        responses.push(to_response(&pool, collection, false).await?);
    }
    Ok(responses)
}

#[tauri::command]
pub async fn get_collection(
    app_handle: tauri::AppHandle,
    id: String,
    include_documents: Option<bool>,
) -> Result<Option<CollectionResponse>, String> {
    let pool = ensure_node_database(&app_handle).await?;

    match CollectionOperations::get_by_id(&pool, &id).await {
        Ok(Some(collection)) => {
            Ok(Some(
                to_response(&pool, collection, include_documents.unwrap_or(false)).await?,
            ))
        }
        Ok(None) => Ok(None),
        Err(e) => Err(format!("Failed to get collection: {e}")),
    }
}

#[tauri::command]
pub async fn update_collection(
    app_handle: tauri::AppHandle,
    id: String,
    updates: UpdateCollectionRequest,
) -> Result<CollectionResponse, String> {
    let pool = ensure_node_database(&app_handle).await?;

    let existing = CollectionOperations::get_by_id(&pool, &id)
        .await
        .map_err(|e| format!("Failed to load collection: {e}"))?
        .ok_or_else(|| format!("Collection not found: {id}"))?;

    let mut collection = existing;
    if let Some(name) = updates.name {
        if name.trim().is_empty() {
            return Err("Collection name cannot be empty".to_string());
        }
        collection.name = name.trim().to_string();
    }
    if let Some(description) = updates.description {
        collection.description = Some(description).filter(|d| !d.trim().is_empty());
    }

    let updated = CollectionOperations::update(&pool, collection)
        .await
        .map_err(|e| format!("Failed to update collection: {e}"))?;

    to_response(&pool, updated, true).await
}

#[tauri::command]
pub async fn delete_collection(
    app_handle: tauri::AppHandle,
    id: String,
) -> Result<bool, String> {
    let pool = ensure_node_database(&app_handle).await?;

    CollectionOperations::delete(&pool, &id)
        .await
        .map_err(|e| format!("Failed to delete collection: {e}"))
}

#[tauri::command]
pub async fn add_documents_to_collection(
    app_handle: tauri::AppHandle,
    collection_id: String,
    document_ids: Vec<String>,
) -> Result<(), String> {
    if document_ids.is_empty() {
        return Ok(());
    }

    let pool = ensure_node_database(&app_handle).await?;

    if CollectionOperations::get_by_id(&pool, &collection_id)
        .await
        .map_err(|e| format!("Failed to load collection: {e}"))?
        .is_none()
    {
        return Err(format!("Collection not found: {collection_id}"));
    }

    CollectionOperations::add_documents(&pool, &collection_id, &document_ids)
        .await
        .map_err(|e| format!("Failed to add documents: {e}"))
}

#[tauri::command]
pub async fn remove_documents_from_collection(
    app_handle: tauri::AppHandle,
    collection_id: String,
    document_ids: Vec<String>,
) -> Result<(), String> {
    if document_ids.is_empty() {
        return Ok(());
    }

    let pool = ensure_node_database(&app_handle).await?;

    CollectionOperations::remove_documents(&pool, &collection_id, &document_ids)
        .await
        .map_err(|e| format!("Failed to remove documents: {e}"))
}

#[tauri::command]
pub async fn get_collection_documents(
    app_handle: tauri::AppHandle,
    collection_id: String,
) -> Result<Vec<CollectionDocumentResponse>, String> {
    let pool = ensure_node_database(&app_handle).await?;

    let documents = CollectionOperations::list_documents(&pool, &collection_id)
        .await
        .map_err(|e| format!("Failed to list collection documents: {e}"))?;

    Ok(documents
        .into_iter()
        .map(|doc| CollectionDocumentResponse {
            id: doc.id,
            title: doc.title,
            file_type: doc.file_type,
            file_size: doc.file_size,
            local_path: doc.local_path,
        })
        .collect())
}
