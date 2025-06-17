/**
 * Services Index
 *
 * Central export point for all service modules following SOLID architecture
 * - Validation services (cultural information + security validation)
 * - Storage services (local database management)
 * - Upload services (document upload with validation)
 * - API services (external integrations)
 * - Network services (P2P communication)
 */

// Validation Services
export { validationService } from './validationService';
export { culturalValidator, securityValidator, documentValidator } from './validation';

// Storage Services
export { storageService } from './storage';
export { StorageService } from './storage/storageService';

// Upload Services
export { uploadService } from './upload';
export { UploadService } from './upload/uploadService';

// Search Services
export { searchService } from './searchService';

// Project Services
export { projectService } from './projectService';

// Collection Services
export { collectionService } from './collectionService';

// Organization Services
export { organizationService } from './organizationService';

// Relationship Services
export { relationshipService } from './relationshipService';

// P2P Services
export { p2pService } from './p2pService';

// Re-export commonly used service patterns
export { ValidationService } from './validationService';
