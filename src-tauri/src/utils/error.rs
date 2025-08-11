use thiserror::Error;

#[derive(Error, Debug)]
pub enum AlLibraryError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("File operation error: {message}")]
    FileOperation { message: String },

    #[error("Document processing error: {message}")]
    DocumentProcessing { message: String },

    #[error("Network error: {message}")]
    Network { message: String },

    #[error("Security error: {message}")]
    Security { message: String },

    #[error("Cultural protection error: {message}")]
    CulturalProtection { message: String },

    #[error("Configuration error: {message}")]
    Configuration { message: String },

    #[error("Not found: {resource}")]
    NotFound { resource: String },

    #[error("Invalid input: {message}")]
    InvalidInput { message: String },

    #[error("Permission denied: {action}")]
    PermissionDenied { action: String },

    #[error("Internal error: {message}")]
    Internal { message: String },
}

pub type Result<T> = std::result::Result<T, AlLibraryError>;

impl From<AlLibraryError> for tauri::Error {
    fn from(err: AlLibraryError) -> Self {
        tauri::Error::Anyhow(anyhow::anyhow!(err))
    }
}

impl From<String> for AlLibraryError {
    fn from(message: String) -> Self {
        Self::Internal { message }
    }
}

// Helper functions for creating common errors
impl AlLibraryError {
    pub fn file_operation(message: impl Into<String>) -> Self {
        Self::FileOperation {
            message: message.into(),
        }
    }

    pub fn document_processing(message: impl Into<String>) -> Self {
        Self::DocumentProcessing {
            message: message.into(),
        }
    }

    pub fn network(message: impl Into<String>) -> Self {
        Self::Network {
            message: message.into(),
        }
    }

    pub fn security(message: impl Into<String>) -> Self {
        Self::Security {
            message: message.into(),
        }
    }

    pub fn cultural_protection(message: impl Into<String>) -> Self {
        Self::CulturalProtection {
            message: message.into(),
        }
    }

    pub fn configuration(message: impl Into<String>) -> Self {
        Self::Configuration {
            message: message.into(),
        }
    }

    pub fn not_found(resource: impl Into<String>) -> Self {
        Self::NotFound {
            resource: resource.into(),
        }
    }

    pub fn invalid_input(message: impl Into<String>) -> Self {
        Self::InvalidInput {
            message: message.into(),
        }
    }

    pub fn permission_denied(action: impl Into<String>) -> Self {
        Self::PermissionDenied {
            action: action.into(),
        }
    }

    pub fn internal(message: impl Into<String>) -> Self {
        Self::Internal {
            message: message.into(),
        }
    }
} 