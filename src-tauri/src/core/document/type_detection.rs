use crate::utils::error::{AlLibraryError, Result};
use mime_guess::MimeGuess;
use std::path::Path;

#[derive(Debug, Clone, PartialEq)]
pub enum DocumentType {
    PDF,
    EPUB,
    TXT,
    MD,
    HTML,
    RTF,
    DOC,
    DOCX,
    Unknown,
}

impl DocumentType {
    pub fn to_string(&self) -> String {
        match self {
            DocumentType::PDF => "PDF".to_string(),
            DocumentType::EPUB => "EPUB".to_string(),
            DocumentType::TXT => "TXT".to_string(),
            DocumentType::MD => "MD".to_string(),
            DocumentType::HTML => "HTML".to_string(),
            DocumentType::RTF => "RTF".to_string(),
            DocumentType::DOC => "DOC".to_string(),
            DocumentType::DOCX => "DOCX".to_string(),
            DocumentType::Unknown => "UNKNOWN".to_string(),
        }
    }

    pub fn from_string(s: &str) -> Self {
        match s.to_uppercase().as_str() {
            "PDF" => DocumentType::PDF,
            "EPUB" => DocumentType::EPUB,
            "TXT" => DocumentType::TXT,
            "MD" | "MARKDOWN" => DocumentType::MD,
            "HTML" | "HTM" => DocumentType::HTML,
            "RTF" => DocumentType::RTF,
            "DOC" => DocumentType::DOC,
            "DOCX" => DocumentType::DOCX,
            _ => DocumentType::Unknown,
        }
    }

    pub fn is_supported(&self) -> bool {
        !matches!(self, DocumentType::Unknown)
    }
}

pub struct TypeDetection;

impl TypeDetection {
    pub fn detect_from_path(file_path: &Path) -> DocumentType {
        if let Some(extension) = file_path.extension() {
            if let Some(ext_str) = extension.to_str() {
                return Self::detect_from_extension(ext_str);
            }
        }
        DocumentType::Unknown
    }

    pub fn detect_from_extension(extension: &str) -> DocumentType {
        match extension.to_lowercase().as_str() {
            "pdf" => DocumentType::PDF,
            "epub" => DocumentType::EPUB,
            "txt" => DocumentType::TXT,
            "md" | "markdown" => DocumentType::MD,
            "html" | "htm" => DocumentType::HTML,
            "rtf" => DocumentType::RTF,
            "doc" => DocumentType::DOC,
            "docx" => DocumentType::DOCX,
            _ => DocumentType::Unknown,
        }
    }

    pub fn detect_from_content(content: &[u8]) -> DocumentType {
        // PDF files start with %PDF
        if content.starts_with(b"%PDF") {
            return DocumentType::PDF;
        }

        // EPUB files are ZIP archives with specific structure
        if Self::is_zip_like(content) {
            // More sophisticated EPUB detection would require ZIP parsing
            // For now, we'll rely on extension detection
            return DocumentType::Unknown;
        }

        // Check for HTML content
        if Self::contains_html_tags(content) {
            return DocumentType::HTML;
        }

        // RTF files start with {\rtf
        if content.starts_with(b"{\\rtf") {
            return DocumentType::RTF;
        }

        // DOC files have specific magic bytes
        if content.len() >= 8 {
            let doc_signature = &content[0..8];
            if doc_signature == b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1" {
                return DocumentType::DOC;
            }
        }

        // DOCX files are ZIP archives
        if Self::is_zip_like(content) {
            return DocumentType::DOCX;
        }

        // Default to TXT for readable content
        if Self::is_text_content(content) {
            return DocumentType::TXT;
        }

        DocumentType::Unknown
    }

    pub fn detect_from_mime(mime_type: &str) -> DocumentType {
        match mime_type {
            "application/pdf" => DocumentType::PDF,
            "application/epub+zip" => DocumentType::EPUB,
            "text/plain" => DocumentType::TXT,
            "text/markdown" => DocumentType::MD,
            "text/html" => DocumentType::HTML,
            "application/rtf" => DocumentType::RTF,
            "application/msword" => DocumentType::DOC,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => DocumentType::DOCX,
            _ => DocumentType::Unknown,
        }
    }

    pub fn detect_comprehensive(file_path: &Path, content: &[u8]) -> Result<DocumentType> {
        // First try content-based detection (most reliable)
        let content_type = Self::detect_from_content(content);
        if content_type.is_supported() {
            return Ok(content_type);
        }

        // Then try extension-based detection
        let extension_type = Self::detect_from_path(file_path);
        if extension_type.is_supported() {
            return Ok(extension_type);
        }

        // Finally try MIME type detection
        let mime_guess = MimeGuess::from_path(file_path);
        if let Some(mime) = mime_guess.first() {
            let mime_type = Self::detect_from_mime(mime.as_ref());
            if mime_type.is_supported() {
                return Ok(mime_type);
            }
        }

        Ok(DocumentType::Unknown)
    }

    pub fn get_supported_extensions() -> Vec<&'static str> {
        vec!["pdf", "epub", "txt", "md", "markdown", "html", "htm", "rtf", "doc", "docx"]
    }

    pub fn is_supported_extension(extension: &str) -> bool {
        Self::get_supported_extensions().contains(&extension.to_lowercase().as_str())
    }

    pub fn validate_document_type(file_path: &Path, content: &[u8]) -> Result<()> {
        let detected_type = Self::detect_comprehensive(file_path, content)?;
        
        if !detected_type.is_supported() {
            return Err(AlLibraryError::invalid_input(
                format!("Unsupported document type for file: {}", file_path.display())
            ));
        }

        Ok(())
    }

    // Helper functions
    fn is_zip_like(content: &[u8]) -> bool {
        content.len() >= 4 && content.starts_with(b"PK\x03\x04")
    }

    fn contains_html_tags(content: &[u8]) -> bool {
        if let Ok(text) = std::str::from_utf8(content) {
            let lower_text = text.to_lowercase();
            return lower_text.contains("<html") 
                || lower_text.contains("<!doctype html")
                || lower_text.contains("<head>")
                || lower_text.contains("<body>");
        }
        false
    }

    fn is_text_content(content: &[u8]) -> bool {
        // Check if content is mostly UTF-8 text
        if content.is_empty() {
            return true;
        }

        match std::str::from_utf8(content) {
            Ok(_) => {
                // Additional check for binary content
                let non_printable_count = content.iter()
                    .filter(|&&b| b < 32 && b != b'\t' && b != b'\n' && b != b'\r')
                    .count();
                
                // If less than 10% non-printable characters, consider it text
                non_printable_count < (content.len() / 10)
            }
            Err(_) => false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_detect_from_extension() {
        assert_eq!(TypeDetection::detect_from_extension("pdf"), DocumentType::PDF);
        assert_eq!(TypeDetection::detect_from_extension("PDF"), DocumentType::PDF);
        assert_eq!(TypeDetection::detect_from_extension("epub"), DocumentType::EPUB);
        assert_eq!(TypeDetection::detect_from_extension("txt"), DocumentType::TXT);
        assert_eq!(TypeDetection::detect_from_extension("unknown"), DocumentType::Unknown);
    }

    #[test]
    fn test_detect_from_path() {
        let path = PathBuf::from("document.pdf");
        assert_eq!(TypeDetection::detect_from_path(&path), DocumentType::PDF);
        
        let path = PathBuf::from("book.epub");
        assert_eq!(TypeDetection::detect_from_path(&path), DocumentType::EPUB);
    }

    #[test]
    fn test_detect_from_content() {
        // PDF content
        let pdf_content = b"%PDF-1.4";
        assert_eq!(TypeDetection::detect_from_content(pdf_content), DocumentType::PDF);
        
        // HTML content
        let html_content = b"<html><head><title>Test</title></head><body>Content</body></html>";
        assert_eq!(TypeDetection::detect_from_content(html_content), DocumentType::HTML);
        
        // Plain text
        let text_content = b"This is plain text content";
        assert_eq!(TypeDetection::detect_from_content(text_content), DocumentType::TXT);
    }
} 