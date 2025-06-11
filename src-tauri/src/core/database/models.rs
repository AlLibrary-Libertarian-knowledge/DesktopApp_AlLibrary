use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Document {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub content_hash: String,
    pub file_type: String,
    pub file_size: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub language_code: Option<String>,
    pub publication_date: Option<DateTime<Utc>>,
    pub page_count: Option<i32>,
    pub cultural_origin: Option<String>,
    pub traditional_knowledge_protocols: Option<String>,
    pub indigenous_permissions: Option<String>,
    pub local_path: Option<String>,
    pub is_shared: bool,
    pub processing_status: String,
    pub content_verification_hash: Option<String>,
    pub malware_scan_status: String,
    pub javascript_stripped: bool,
    pub peer_availability_count: i32,
    pub last_availability_check: Option<DateTime<Utc>>,
    pub download_priority: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DocumentMetadata {
    pub id: String,
    pub document_id: String,
    pub metadata_key: String,
    pub metadata_value: String,
    pub metadata_type: String,
    pub is_searchable: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Author {
    pub id: String,
    pub name: String,
    pub birth_date: Option<DateTime<Utc>>,
    pub death_date: Option<DateTime<Utc>>,
    pub cultural_affiliation: Option<String>,
    pub institutional_affiliation: Option<String>,
    pub biographical_notes: Option<String>,
    pub preferred_citation_format: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DocumentAuthor {
    pub document_id: String,
    pub author_id: String,
    pub author_role: String,
    pub attribution_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CulturalContext {
    pub id: String,
    pub culture_name: String,
    pub geographic_region: Option<String>,
    pub traditional_knowledge_protocols: Option<String>,
    pub access_restrictions: Option<String>,
    pub community_contact_info: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DocumentCollection {
    pub document_id: String,
    pub collection_id: String,
    pub added_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DocumentTag {
    pub document_id: String,
    pub tag_id: String,
    pub added_at: DateTime<Utc>,
}

// Enums for specific fields
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileType {
    PDF,
    EPUB,
}

impl ToString for FileType {
    fn to_string(&self) -> String {
        match self {
            FileType::PDF => "PDF".to_string(),
            FileType::EPUB => "EPUB".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessingStatus {
    Pending,
    Processing,
    Verified,
    Error,
}

impl ToString for ProcessingStatus {
    fn to_string(&self) -> String {
        match self {
            ProcessingStatus::Pending => "pending".to_string(),
            ProcessingStatus::Processing => "processing".to_string(),
            ProcessingStatus::Verified => "verified".to_string(),
            ProcessingStatus::Error => "error".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MalwareScanStatus {
    Pending,
    Clean,
    Suspicious,
    Blocked,
}

impl ToString for MalwareScanStatus {
    fn to_string(&self) -> String {
        match self {
            MalwareScanStatus::Pending => "pending".to_string(),
            MalwareScanStatus::Clean => "clean".to_string(),
            MalwareScanStatus::Suspicious => "suspicious".to_string(),
            MalwareScanStatus::Blocked => "blocked".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuthorRole {
    Author,
    Editor,
    Translator,
    Compiler,
    Contributor,
}

impl ToString for AuthorRole {
    fn to_string(&self) -> String {
        match self {
            AuthorRole::Author => "author".to_string(),
            AuthorRole::Editor => "editor".to_string(),
            AuthorRole::Translator => "translator".to_string(),
            AuthorRole::Compiler => "compiler".to_string(),
            AuthorRole::Contributor => "contributor".to_string(),
        }
    }
}

// Helper functions for creating new instances
impl Document {
    pub fn new(
        title: String,
        content_hash: String,
        file_type: FileType,
        file_size: i64,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            description: None,
            content_hash,
            file_type: file_type.to_string(),
            file_size,
            created_at: now,
            updated_at: now,
            language_code: None,
            publication_date: None,
            page_count: None,
            cultural_origin: None,
            traditional_knowledge_protocols: None,
            indigenous_permissions: None,
            local_path: None,
            is_shared: true,
            processing_status: ProcessingStatus::Pending.to_string(),
            content_verification_hash: None,
            malware_scan_status: MalwareScanStatus::Pending.to_string(),
            javascript_stripped: false,
            peer_availability_count: 0,
            last_availability_check: None,
            download_priority: 0,
        }
    }
}

impl Author {
    pub fn new(name: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            birth_date: None,
            death_date: None,
            cultural_affiliation: None,
            institutional_affiliation: None,
            biographical_notes: None,
            preferred_citation_format: None,
            created_at: Utc::now(),
        }
    }
}

impl Collection {
    pub fn new(name: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description: None,
            created_at: now,
            updated_at: now,
        }
    }
}

impl Tag {
    pub fn new(name: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description: None,
            created_at: Utc::now(),
        }
    }
} 

// Optimized query result structures (simplified for now)

#[derive(Debug, Clone)]
pub struct DocumentWithRelations {
    pub document: Document,
    pub authors: Vec<String>,
    pub tags: Vec<String>,
    pub collections: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct DocumentFilters {
    pub file_type: Option<String>,
    pub processing_status: Option<String>,
    pub is_shared: Option<bool>,
    pub cultural_origin: Option<String>,
} 