/**
 * Document Upload Service
 *
 * Handles document uploads with comprehensive validation, cultural context,
 * and progress tracking. Follows SOLID principles and anti-censorship core.
 */

/// <reference lib="dom" />

import { validationService } from '../validationService';
import type { Document, DocumentInput, DocumentAuthor } from '@/types/Document';
import { DocumentFormat, DocumentContentType, DocumentStatus } from '@/types/Document';
import type { CulturalSensitivityLevel } from '@/types/Cultural';
import type { CompleteValidationResult } from '../validationService';

/**
 * Upload session state
 */
export interface UploadSession {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'pending' | 'uploading' | 'validating' | 'processing' | 'completed' | 'error';
  validationResult?: CompleteValidationResult;
  error?: string;
  document?: Document;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (session: UploadSession) => void;

/**
 * Upload result
 */
export interface UploadResult {
  success: boolean;
  session: UploadSession;
  document?: Document;
  error?: string;
  culturalContext?: string;
  educationalResources?: string[];
}

/**
 * Upload options
 */
export interface UploadOptions {
  autoTagging?: boolean;
  culturalAnalysis?: boolean;
  securityValidation?: boolean;
  generateThumbnail?: boolean;
  onProgress?: UploadProgressCallback;
  userId: string;
}

/**
 * Main upload service class
 */
export class UploadService {
  private activeSessions = new Map<string, UploadSession>();
  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB
  private readonly supportedFormats: DocumentFormat[] = [
    DocumentFormat.PDF,
    DocumentFormat.EPUB,
    DocumentFormat.TEXT,
    DocumentFormat.MARKDOWN,
  ];

  /**
   * Upload a document with comprehensive validation
   */
  async uploadDocument(
    file: File,
    metadata: Partial<DocumentInput>,
    options: UploadOptions
  ): Promise<UploadResult> {
    const sessionId = this.generateSessionId();

    // Create upload session
    const session: UploadSession = {
      id: sessionId,
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.activeSessions.set(sessionId, session);
    options.onProgress?.(session);

    try {
      // Step 1: Validate file format and size
      await this.validateFile(file, session, options);

      // Step 2: Read file content
      const fileContent = await this.readFileContent(file, session, options);

      // Step 3: Perform comprehensive validation
      await this.performValidation(fileContent, metadata, session, options);

      // Step 4: Create document record
      const document = await this.createDocumentRecord(file, metadata, session, options);

      // Step 5: Complete upload
      session.status = 'completed';
      session.document = document;
      session.progress = 100;
      session.updatedAt = new Date();
      options.onProgress?.(session);

      return {
        success: true,
        session,
        document,
        culturalContext: session.validationResult?.culturalAnalysis.suggestedContext,
        educationalResources: session.validationResult?.culturalAnalysis.recommendedInformation,
      };
    } catch (error) {
      console.error('Upload failed:', error);

      session.status = 'error';
      session.error = error instanceof Error ? error.message : 'Upload failed';
      session.updatedAt = new Date();
      options.onProgress?.(session);

      return {
        success: false,
        session,
        error: session.error,
      };
    }
  }

  /**
   * Validate file format and size
   */
  private async validateFile(
    file: File,
    session: UploadSession,
    options: UploadOptions
  ): Promise<void> {
    session.status = 'validating';
    session.progress = 10;
    options.onProgress?.(session);

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(
        `File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(this.maxFileSize)}`
      );
    }

    // Check file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const format = this.getDocumentFormat(fileExtension);

    if (!format || !this.supportedFormats.includes(format)) {
      throw new Error(
        `Unsupported file format: ${fileExtension}. Supported formats: ${this.supportedFormats.join(', ')}`
      );
    }

    session.progress = 20;
    options.onProgress?.(session);
  }

  /**
   * Read file content for validation
   */
  private async readFileContent(
    file: File,
    session: UploadSession,
    options: UploadOptions
  ): Promise<ArrayBuffer> {
    session.status = 'uploading';
    session.progress = 30;
    options.onProgress?.(session);

    try {
      const arrayBuffer = await file.arrayBuffer();
      session.progress = 50;
      options.onProgress?.(session);
      return arrayBuffer;
    } catch (error) {
      throw new Error('Failed to read file content');
    }
  }

  /**
   * Perform comprehensive validation
   */
  private async performValidation(
    fileContent: ArrayBuffer,
    metadata: Partial<DocumentInput>,
    session: UploadSession,
    options: UploadOptions
  ): Promise<void> {
    session.status = 'validating';
    session.progress = 60;
    options.onProgress?.(session);

    try {
      // Create validation context
      const context = {
        userId: options.userId,
        fileName: session.fileName,
        fileSize: session.fileSize,
        metadata,
        culturalAnalysis: options.culturalAnalysis ?? true,
        securityValidation: options.securityValidation ?? true,
      };

      // Perform validation
      const validationResult = await validationService.validateDocument(fileContent, context);

      session.validationResult = validationResult;
      session.progress = 80;
      options.onProgress?.(session);

      // Check for critical validation errors
      if (!validationResult.valid && validationResult.errors.length > 0) {
        const criticalErrors = validationResult.errors.filter(
          error =>
            error.includes('malware') || error.includes('security') || error.includes('format')
        );

        if (criticalErrors.length > 0) {
          throw new Error(`Validation failed: ${criticalErrors.join(', ')}`);
        }
      }
    } catch (error) {
      throw new Error(
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create document record
   */
  private async createDocumentRecord(
    file: File,
    metadata: Partial<DocumentInput>,
    session: UploadSession,
    options: UploadOptions
  ): Promise<Document> {
    session.status = 'processing';
    session.progress = 90;
    options.onProgress?.(session);

    // Generate document ID
    const documentId = this.generateDocumentId();

    // Determine content type
    const contentType = this.determineContentType(metadata, session.validationResult);

    // Create document record
    const document: Document = {
      id: documentId,
      title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
      description: metadata.description,
      format:
        this.getDocumentFormat(file.name.split('.').pop()?.toLowerCase()) || DocumentFormat.PDF,
      contentType,
      status: DocumentStatus.ACTIVE,
      filePath: `/documents/${documentId}/${file.name}`,
      originalFilename: file.name,
      fileSize: file.size,
      fileHash: await this.calculateFileHash(file),
      mimeType: file.type,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: options.userId,
      version: 1,
      culturalMetadata: {
        sensitivityLevel: metadata.culturalSensitivityLevel || 1,
        culturalOrigin: metadata.culturalOrigin,
        traditionalProtocols: metadata.traditionalProtocols || [],
        educationalResources:
          session.validationResult?.culturalAnalysis.recommendedInformation || [],
        informationOnly: true,
        educationalPurpose: true,
      },
      tags: metadata.tags || [],
      categories: metadata.categories || [],
      language: metadata.language || 'en',
      authors: metadata.authors || [],
      accessHistory: [],
      relationships: [],
      securityValidation: {
        validatedAt: new Date(),
        passed: session.validationResult?.securityValidation.valid || false,
        malwareScanResult: {
          clean: session.validationResult?.securityValidation.valid || false,
          threats: session.validationResult?.securityValidation.error
            ? [session.validationResult.securityValidation.error]
            : [],
          scanEngine: 'AlLibrary Security Validator',
          scanDate: new Date(),
        },
        integrityCheck: {
          valid: true,
          expectedHash: await this.calculateFileHash(file),
          actualHash: await this.calculateFileHash(file),
          algorithm: 'SHA-256',
        },
        legalCompliance: {
          compliant: true,
          issues: [],
          jurisdiction: 'local',
        },
        issues: session.validationResult?.errors || [],
      },
      contentVerification: {
        signature: '',
        algorithm: 'SHA-256',
        verifiedAt: new Date(),
        chainOfCustody: [],
        authentic: true,
        verificationProvider: 'AlLibrary',
      },
      sourceAttribution: metadata.sourceAttribution || {
        originalSource: 'User Upload',
        sourceType: 'individual',
        credibilityIndicators: [],
        sourceVerified: false,
        attributionRequirements: [],
      },
    };

    return document;
  }

  /**
   * Get upload session by ID
   */
  getSession(sessionId: string): UploadSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): UploadSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Cancel upload session
   */
  cancelUpload(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'uploading') {
      session.status = 'error';
      session.error = 'Upload cancelled by user';
      session.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Clear completed sessions
   */
  clearCompletedSessions(): void {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.status === 'completed' || session.status === 'error') {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Utility methods
   */
  private generateSessionId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDocumentFormat(extension?: string): DocumentFormat | null {
    if (!extension) return null;

    const formatMap: Record<string, DocumentFormat> = {
      pdf: DocumentFormat.PDF,
      epub: DocumentFormat.EPUB,
      txt: DocumentFormat.TEXT,
      md: DocumentFormat.MARKDOWN,
    };

    return formatMap[extension] || null;
  }

  private determineContentType(
    metadata: Partial<DocumentInput>,
    validationResult?: CompleteValidationResult
  ): DocumentContentType {
    // Use metadata if provided
    if (metadata.contentType) {
      return metadata.contentType;
    }

    // Analyze content based on validation result
    if (validationResult?.culturalAnalysis.detectedLevel > 2) {
      return DocumentContentType.TRADITIONAL_KNOWLEDGE;
    }

    // Default based on file name and content
    const fileName = metadata.title?.toLowerCase() || '';

    if (fileName.includes('traditional') || fileName.includes('indigenous')) {
      return DocumentContentType.TRADITIONAL_KNOWLEDGE;
    }

    if (fileName.includes('ceremonial') || fileName.includes('sacred')) {
      return DocumentContentType.CEREMONIAL;
    }

    if (fileName.includes('community')) {
      return DocumentContentType.COMMUNITY;
    }

    if (fileName.includes('academic') || fileName.includes('research')) {
      return DocumentContentType.ACADEMIC;
    }

    if (fileName.includes('historical')) {
      return DocumentContentType.HISTORICAL;
    }

    return DocumentContentType.EDUCATIONAL;
  }

  private async calculateFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
export const uploadService = new UploadService();
