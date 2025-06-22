/**
 * Document Storage Service
 *
 * Handles document storage, metadata management, and cultural context preservation.
 * Follows SOLID principles and anti-censorship core.
 */

import type { Document, DocumentUpdate, DocumentSearchFilters } from '@/types/Document';
import type { CulturalMetadata } from '@/types/Cultural';

/**
 * Storage statistics
 */
export interface StorageStats {
  totalDocuments: number;
  totalSize: number;
  availableSpace: number;
  usedSpace: number;
  documentTypes: Record<string, number>;
  culturalDistribution: Record<string, number>;
  lastBackup: Date;
  integrityStatus: 'verified' | 'checking' | 'error';
}

/**
 * Storage operation result
 */
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  culturalContext?: string;
  educationalNotes?: string[];
}

/**
 * Document storage metadata
 */
export interface DocumentStorageMetadata {
  documentId: string;
  filePath: string;
  fileSize: number;
  fileHash: string;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  backupStatus: 'backed_up' | 'pending' | 'failed';
  integrityVerified: boolean;
  culturalContextPreserved: boolean;
}

/**
 * Main storage service class
 */
export class StorageService {
  private readonly maxStorageSize = 10 * 1024 * 1024 * 1024; // 10GB
  private documents = new Map<string, Document>();
  private storageMetadata = new Map<string, DocumentStorageMetadata>();

  /**
   * Store a document with comprehensive metadata
   */
  async storeDocument(document: Document): Promise<StorageResult<Document>> {
    try {
      // Validate document
      if (!this.validateDocument(document)) {
        return {
          success: false,
          error: 'Invalid document data',
        };
      }

      // Check storage capacity
      if (!this.checkStorageCapacity(document.fileSize)) {
        return {
          success: false,
          error: 'Insufficient storage space',
        };
      }

      // Store document
      this.documents.set(document.id, document);

      // Create storage metadata
      const metadata: DocumentStorageMetadata = {
        documentId: document.id,
        filePath: document.filePath,
        fileSize: document.fileSize,
        fileHash: document.fileHash,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 0,
        backupStatus: 'pending',
        integrityVerified: true,
        culturalContextPreserved: true,
      };

      this.storageMetadata.set(document.id, metadata);

      // Provide cultural context information
      const culturalContext = this.generateCulturalContext(document);
      const educationalNotes = this.generateEducationalNotes(document);

      return {
        success: true,
        data: document,
        culturalContext,
        educationalNotes,
      };
    } catch (error) {
      console.error('Storage error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage failed',
      };
    }
  }

  /**
   * Retrieve a document by ID
   */
  async getDocument(documentId: string): Promise<StorageResult<Document>> {
    try {
      const document = this.documents.get(documentId);
      if (!document) {
        return {
          success: false,
          error: 'Document not found',
        };
      }

      // Update access metadata
      const metadata = this.storageMetadata.get(documentId);
      if (metadata) {
        metadata.lastAccessed = new Date();
        metadata.accessCount++;
      }

      // Provide cultural context information
      const culturalContext = this.generateCulturalContext(document);
      const educationalNotes = this.generateEducationalNotes(document);

      return {
        success: true,
        data: document,
        culturalContext,
        educationalNotes,
      };
    } catch (error) {
      console.error('Document retrieval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document retrieval failed',
      };
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    documentId: string,
    updates: DocumentUpdate
  ): Promise<StorageResult<Document>> {
    try {
      const document = this.documents.get(documentId);
      if (!document) {
        return {
          success: false,
          error: 'Document not found',
        };
      }

      // Apply updates
      const updatedDocument: Document = {
        ...document,
        ...updates,
        updatedAt: new Date(),
        version: document.version + 1,
      };

      // Validate updated document
      if (!this.validateDocument(updatedDocument)) {
        return {
          success: false,
          error: 'Invalid document updates',
        };
      }

      // Store updated document
      this.documents.set(documentId, updatedDocument);

      // Provide cultural context information
      const culturalContext = this.generateCulturalContext(updatedDocument);
      const educationalNotes = this.generateEducationalNotes(updatedDocument);

      return {
        success: true,
        data: updatedDocument,
        culturalContext,
        educationalNotes,
      };
    } catch (error) {
      console.error('Document update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document update failed',
      };
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<StorageResult<void>> {
    try {
      const document = this.documents.get(documentId);
      if (!document) {
        return {
          success: false,
          error: 'Document not found',
        };
      }

      // Remove document and metadata
      this.documents.delete(documentId);
      this.storageMetadata.delete(documentId);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Document deletion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document deletion failed',
      };
    }
  }

  /**
   * Search documents with filters
   */
  async searchDocuments(filters: DocumentSearchFilters): Promise<StorageResult<Document[]>> {
    try {
      let results = Array.from(this.documents.values());

      // Apply filters
      if (filters.query) {
        const query = filters.query.toLowerCase();
        results = results.filter(
          doc =>
            doc.title.toLowerCase().includes(query) ||
            doc.description?.toLowerCase().includes(query) ||
            doc.tags.some(tag => tag.toLowerCase().includes(query)) ||
            doc.authors.some(author => author.name.toLowerCase().includes(query))
        );
      }

      if (filters.format && filters.format.length > 0) {
        results = results.filter(doc => filters.format!.includes(doc.format));
      }

      if (filters.contentType && filters.contentType.length > 0) {
        results = results.filter(doc => filters.contentType!.includes(doc.contentType));
      }

      if (filters.culturalSensitivityLevel && filters.culturalSensitivityLevel.length > 0) {
        results = results.filter(doc =>
          filters.culturalSensitivityLevel!.includes(doc.culturalMetadata.sensitivityLevel)
        );
      }

      if (filters.language && filters.language.length > 0) {
        results = results.filter(doc => filters.language!.includes(doc.language));
      }

      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(doc => filters.tags!.some(tag => doc.tags.includes(tag)));
      }

      if (filters.categories && filters.categories.length > 0) {
        results = results.filter(doc =>
          filters.categories!.some(category => doc.categories.includes(category))
        );
      }

      if (filters.dateRange) {
        results = results.filter(
          doc =>
            doc.createdAt >= filters.dateRange!.start && doc.createdAt <= filters.dateRange!.end
        );
      }

      // Sort results
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error('Document search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document search failed',
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageResult<StorageStats>> {
    try {
      const documents = Array.from(this.documents.values());
      const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);

      // Calculate document type distribution
      const documentTypes: Record<string, number> = {};
      documents.forEach(doc => {
        documentTypes[doc.format] = (documentTypes[doc.format] || 0) + 1;
      });

      // Calculate cultural distribution
      const culturalDistribution: Record<string, number> = {};
      documents.forEach(doc => {
        const level = doc.culturalMetadata.sensitivityLevel;
        culturalDistribution[`level_${level}`] = (culturalDistribution[`level_${level}`] || 0) + 1;
      });

      const stats: StorageStats = {
        totalDocuments: documents.length,
        totalSize,
        availableSpace: this.maxStorageSize - totalSize,
        usedSpace: totalSize,
        documentTypes,
        culturalDistribution,
        lastBackup: new Date(), // TODO: Implement actual backup tracking
        integrityStatus: 'verified',
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Storage stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get storage stats',
      };
    }
  }

  /**
   * Get all documents
   */
  async getAllDocuments(): Promise<StorageResult<Document[]>> {
    try {
      const documents = Array.from(this.documents.values());
      return {
        success: true,
        data: documents,
      };
    } catch (error) {
      console.error('Get all documents error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get documents',
      };
    }
  }

  /**
   * Get document storage metadata
   */
  async getDocumentMetadata(documentId: string): Promise<StorageResult<DocumentStorageMetadata>> {
    try {
      const metadata = this.storageMetadata.get(documentId);
      if (!metadata) {
        return {
          success: false,
          error: 'Document metadata not found',
        };
      }

      return {
        success: true,
        data: metadata,
      };
    } catch (error) {
      console.error('Get document metadata error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get document metadata',
      };
    }
  }

  /**
   * Validate document data
   */
  private validateDocument(document: Document): boolean {
    return !!(
      document.id &&
      document.title &&
      document.filePath &&
      document.fileSize > 0 &&
      document.fileHash &&
      document.culturalMetadata
    );
  }

  /**
   * Check storage capacity
   */
  private checkStorageCapacity(fileSize: number): boolean {
    const currentSize = Array.from(this.documents.values()).reduce(
      (sum, doc) => sum + doc.fileSize,
      0
    );
    return currentSize + fileSize <= this.maxStorageSize;
  }

  /**
   * Generate cultural context information
   */
  private generateCulturalContext(document: Document): string {
    const { culturalMetadata } = document;

    if (culturalMetadata.sensitivityLevel > 1) {
      return `This document contains ${culturalMetadata.culturalOrigin ? culturalMetadata.culturalOrigin + ' ' : ''}cultural content. Cultural context is provided for educational purposes only.`;
    }

    return 'This document contains general cultural content.';
  }

  /**
   * Generate educational notes
   */
  private generateEducationalNotes(document: Document): string[] {
    const notes: string[] = [];
    const { culturalMetadata } = document;

    if (culturalMetadata.sensitivityLevel > 2) {
      notes.push('This content may contain traditional or sacred knowledge.');
      notes.push('Cultural protocols and community guidelines are available.');
    }

    if (culturalMetadata.traditionalProtocols.length > 0) {
      notes.push('Traditional protocols are documented for this content.');
    }

    if (culturalMetadata.educationalResources.length > 0) {
      notes.push('Educational resources are available for cultural learning.');
    }

    notes.push('Cultural information is provided for educational purposes only.');
    notes.push('No access restrictions are applied based on cultural content.');

    return notes;
  }
}

// Export singleton instance
export const storageService = new StorageService();
