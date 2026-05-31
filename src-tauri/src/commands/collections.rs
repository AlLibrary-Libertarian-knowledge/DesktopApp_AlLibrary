use serde::{Deserialize, Serialize};
use crate::core::database::CollectionOperations;
use crate::core::database::models::Collection;
use crate::core::database::ensure_node_database;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCollectionRequest {
    pub name: String,
    pub description: Option<String>,
    pub type_: Option<String>,
    pub visibility: Option<String>,
    pub document_ids: Option<Vec<String>>,
    pub cultural_metadata: Option<CulturalMetadata>,
    pub tags: Option<Vec<String>>,
    pub categories: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CulturalMetadata {
    pub sensitivity_level: Option<i32>,
    pub cultural_origin: Option<String>,
    pub community_id: Option<String>,
    pub traditional_protocols: Option<Vec<String>>,
    pub educational_context: Option<String>,
    pub cultural_context: Option<String>,
    pub source_attribution: Option<String>,
    pub cultural_group: Option<String>,
    pub related_concepts: Option<Vec<String>>,
    pub community_notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCollectionRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub type_: Option<String>,
    pub visibility: Option<String>,
    pub cultural_metadata: Option<CulturalMetadata>,
    pub tags: Option<Vec<String>>,
    pub categories: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CollectionResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub type_: String,
    pub visibility: String,
    pub document_count: i32,
    pub created_at: String,
    pub updated_at: String,
    pub cultural_metadata: Option<CulturalMetadata>,
    pub tags: Vec<String>,
    pub categories: Vec<String>,
}

#[tauri::command]
pub async fn create_collection(
    app_handle: tauri::AppHandle,
    request: CreateCollectionRequest,
) -> Result<CollectionResponse, String> {
    println!("Creating collection with name: {}", request.name);
    
    let pool = ensure_node_database(&app_handle).await?;
    println!("Database pool obtained successfully");
    
    let collection = Collection {
        id: String::new(),
        name: request.name,
        description: request.description,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    println!("Attempting to create collection in database...");
    match CollectionOperations::create(&pool, collection).await {
        Ok(created_collection) => {
            println!("Collection created successfully with ID: {}", created_collection.id);
            let response = CollectionResponse {
                id: created_collection.id,
                name: created_collection.name,
                description: created_collection.description,
                type_: request.type_.unwrap_or_else(|| "personal".to_string()),
                visibility: request.visibility.unwrap_or_else(|| "private".to_string()),
                document_count: 0,
                created_at: created_collection.created_at.to_rfc3339(),
                updated_at: created_collection.updated_at.to_rfc3339(),
                cultural_metadata: request.cultural_metadata,
                tags: request.tags.unwrap_or_default(),
                categories: request.categories.unwrap_or_default(),
            };
            println!("Collection response prepared successfully");
            Ok(response)
        }
        Err(e) => {
            println!("Failed to create collection: {}", e);
            Err(format!("Failed to create collection: {}", e))
        }
    }
}

#[tauri::command]
pub async fn get_collections(app_handle: tauri::AppHandle) -> Result<Vec<CollectionResponse>, String> {
    let pool = ensure_node_database(&app_handle).await?;
    
    match CollectionOperations::get_all(&pool).await {
        Ok(collections) => {
            let responses: Vec<CollectionResponse> = collections
                .into_iter()
                .map(|collection| CollectionResponse {
                    id: collection.id,
                    name: collection.name,
                    description: collection.description,
                    type_: "personal".to_string(), // Default type
                    visibility: "private".to_string(), // Default visibility
                    document_count: 0,
                    created_at: collection.created_at.to_rfc3339(),
                    updated_at: collection.updated_at.to_rfc3339(),
                    cultural_metadata: None,
                    tags: vec![],
                    categories: vec![],
                })
                .collect();
            Ok(responses)
        }
        Err(e) => Err(format!("Failed to get collections: {}", e)),
    }
}

#[tauri::command]
pub async fn get_collection(
    app_handle: tauri::AppHandle,
    _id: String,
) -> Result<Option<CollectionResponse>, String> {
    let pool = ensure_node_database(&app_handle).await?;
    
    match CollectionOperations::get_by_id(&pool, &_id).await {
        Ok(Some(collection)) => {
            let response = CollectionResponse {
                id: collection.id,
                name: collection.name,
                description: collection.description,
                type_: "personal".to_string(), // Default type
                visibility: "private".to_string(), // Default visibility
                document_count: 0,
                created_at: collection.created_at.to_rfc3339(),
                updated_at: collection.updated_at.to_rfc3339(),
                cultural_metadata: None,
                tags: vec![],
                categories: vec![],
            };
            Ok(Some(response))
        }
        Ok(None) => Ok(None),
        Err(e) => Err(format!("Failed to get collection: {}", e)),
    }
}

#[tauri::command]
pub async fn update_collection(
    id: String,
    request: UpdateCollectionRequest,
) -> Result<CollectionResponse, String> {
    // For now, just return a mock response since update is not fully implemented
    let response = CollectionResponse {
        id,
        name: request.name.unwrap_or_else(|| "Updated Collection".to_string()),
        description: request.description,
        type_: request.type_.unwrap_or_else(|| "personal".to_string()),
        visibility: request.visibility.unwrap_or_else(|| "private".to_string()),
        document_count: 0,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
        cultural_metadata: request.cultural_metadata,
        tags: request.tags.unwrap_or_default(),
        categories: request.categories.unwrap_or_default(),
    };
    Ok(response)
}

#[tauri::command]
pub async fn delete_collection(
    _id: String,
) -> Result<bool, String> {
    // For now, just return success since delete is not fully implemented
    Ok(true)
} 