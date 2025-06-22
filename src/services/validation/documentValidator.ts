/**
 * Document Validation Service
 *
 * Validates document content for:
 * - Format validation (PDF/EPUB)
 * - Content safety and security
 * - Cultural context analysis (INFORMATION ONLY)
 * - Metadata extraction and validation
 *
 * Following anti-censorship principles:
 * - Cultural analysis provides information only
 * - No content blocking based on cultural factors
 * - Security validation for technical threats only
 */

import type { Document } from '@/types/Document';
import type { CulturalAnalysis } from '@/types/Cultural';
import { CulturalSensitivityLevel } from '@/types/Cultural';
import type { SecurityValidationResult, SafetyResult } from '@/types/Security';
import { culturalValidator } from './culturalValidator';
import { securityValidator } from './securityValidator';

/**
 * Document validation result
 */
export interface DocumentValidationResult {
  /** Validation passed */
  valid: boolean;

  /** Validated document */
  document?: Document;

  /** Cultural analysis */
  culturalAnalysis: CulturalAnalysis;

  /** Security validation */
  securityValidation: SecurityValidationResult;

  /** Safety assessment */
  safetyAssessment: SafetyResult;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];

  /** Validation timestamp */
  validatedAt: Date;
}

/**
 * Document upload context
 */
export interface DocumentUploadContext {
  /** User ID */
  userId: string;

  /** File name */
  fileName: string;

  /** File size */
  fileSize: number;

  /** File type */
  fileType: string;

  /** MIME type */
  mimeType: string;

  /** Upload source */
  source: 'user_upload' | 'import' | 'sync';

  /** Cultural sensitivity level */
  culturalSensitivityLevel?: CulturalSensitivityLevel;
}

/**
 * Document validator with integrated cultural and security analysis
 */
export class DocumentValidator {
  /**
   * Validate uploaded document with comprehensive analysis
   *
   * @param fileContent - Document file content
   * @param context - Upload context information
   * @returns Complete validation result
   */
  async validateDocument(
    fileContent: ArrayBuffer | string,
    context: DocumentUploadContext
  ): Promise<DocumentValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Step 1: Format validation
      const formatValidation = await this.validateFormat(fileContent, context.fileType);
      if (!formatValidation.valid) {
        errors.push(...formatValidation.errors);
      }

      // Step 2: Extract text content for analysis
      const textContent = await this.extractTextContent(fileContent, context.fileType);

      // Step 3: Security validation
      const securityValidation = await securityValidator.validateInput(textContent, {
        expectedType: 'string',
        fileType: context.fileType,
        source: 'document_upload',
      });

      // Step 4: Safety assessment
      const safetyAssessment = await securityValidator.validateContentSafety(textContent);

      // Step 5: Cultural analysis (INFORMATION ONLY)
      const culturalAnalysis = await culturalValidator.analyzeCulturalSensitivity(textContent);

      // Step 6: Generate document metadata
      const metadata = await this.generateDocumentMetadata(
        textContent,
        context,
        culturalAnalysis,
        securityValidation
      );

      // Step 7: Create document object if validation passes
      let document: Document | undefined;
      const isValid = securityValidation.valid && safetyAssessment.safe && errors.length === 0;

      if (isValid) {
        document = await this.createDocumentObject(
          textContent,
          metadata,
          context,
          culturalAnalysis
        );
      } else {
        errors.push('Document failed validation checks');
      }

      return {
        valid: isValid,
        document,
        culturalAnalysis,
        securityValidation,
        safetyAssessment,
        errors,
        warnings,
        validatedAt: new Date(),
      };
    } catch (error) {
      console.error('Document validation failed:', error);

      // Return safe defaults on error
      return {
        valid: false,
        culturalAnalysis: {
          detectedLevel: CulturalSensitivityLevel.PUBLIC,
          confidence: 0,
          detectedSymbols: [],
          analysisMetadata: {
            analyzedAt: new Date(),
            analysisVersion: '1.0.0',
            reviewRequired: false,
          },
        },
        securityValidation: {
          valid: false,
          error: 'Validation error occurred',
          securityLevel: 'BLOCKED',
          validatedAt: new Date(),
          validationId: 'error',
        },
        safetyAssessment: {
          safe: false,
          threats: [
            {
              type: 'VALIDATION_ERROR',
              severity: 'HIGH',
              description: 'Document validation failed',
              recommendation: 'Manual review required',
            },
          ],
          confidence: 0,
          recommendation: 'Document validation failed',
        },
        errors: ['Document validation encountered an error'],
        warnings: [],
        validatedAt: new Date(),
      };
    }
  }

  /**
   * Validate PDF content specifically
   *
   * @param content - PDF file content
   * @returns PDF validation result
   */
  async validatePDFContent(content: ArrayBuffer): Promise<{
    valid: boolean;
    errors: string[];
    metadata?: any;
  }> {
    try {
      // Basic PDF signature validation
      const uint8Array = new Uint8Array(content);
      const header = String.fromCharCode(...uint8Array.slice(0, 4));

      if (header !== '%PDF') {
        return {
          valid: false,
          errors: ['Invalid PDF file signature'],
        };
      }

      // Check for PDF version
      const versionMatch = String.fromCharCode(...uint8Array.slice(0, 20)).match(/%PDF-(\d\.\d)/);
      if (!versionMatch) {
        return {
          valid: false,
          errors: ['Unable to determine PDF version'],
        };
      }

      // Basic structure validation
      const hasEOF = String.fromCharCode(...uint8Array.slice(-10)).includes('%%EOF');
      if (!hasEOF) {
        return {
          valid: false,
          errors: ['PDF file appears to be truncated or corrupted'],
        };
      }

      return {
        valid: true,
        errors: [],
        metadata: {
          version: versionMatch[1],
          size: content.byteLength,
          hasValidStructure: true,
        },
      };
    } catch (error) {
      console.error('PDF validation failed:', error);
      return {
        valid: false,
        errors: ['PDF validation error occurred'],
      };
    }
  }

  /**
   * Validate EPUB content specifically
   *
   * @param content - EPUB file content
   * @returns EPUB validation result
   */
  async validateEPUBContent(content: ArrayBuffer): Promise<{
    valid: boolean;
    errors: string[];
    metadata?: any;
  }> {
    try {
      // EPUB files are ZIP archives, check ZIP signature
      const uint8Array = new Uint8Array(content);
      const zipSignature = uint8Array.slice(0, 4);

      // ZIP file signatures: PK\x03\x04 or PK\x05\x06 or PK\x07\x08
      const isValidZip =
        zipSignature[0] === 0x50 &&
        zipSignature[1] === 0x4b &&
        (zipSignature[2] === 0x03 || zipSignature[2] === 0x05 || zipSignature[2] === 0x07);

      if (!isValidZip) {
        return {
          valid: false,
          errors: ['Invalid EPUB file format - not a valid ZIP archive'],
        };
      }

      // TODO: In production, we would:
      // 1. Extract the ZIP contents
      // 2. Validate META-INF/container.xml exists
      // 3. Validate OPF files
      // 4. Check for required EPUB structure

      return {
        valid: true,
        errors: [],
        metadata: {
          format: 'EPUB',
          size: content.byteLength,
          hasValidStructure: true,
        },
      };
    } catch (error) {
      console.error('EPUB validation failed:', error);
      return {
        valid: false,
        errors: ['EPUB validation error occurred'],
      };
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async validateFormat(
    content: ArrayBuffer | string,
    fileType: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (typeof content === 'string') {
      // Text-based format
      if (fileType === 'text/plain' || fileType === 'text/markdown') {
        return { valid: true, errors: [] };
      }
      errors.push(`String content not valid for file type: ${fileType}`);
      return { valid: false, errors };
    }

    // Binary format validation
    switch (fileType) {
      case 'application/pdf':
        const pdfResult = await this.validatePDFContent(content);
        return { valid: pdfResult.valid, errors: pdfResult.errors };

      case 'application/epub+zip':
        const epubResult = await this.validateEPUBContent(content);
        return { valid: epubResult.valid, errors: epubResult.errors };

      default:
        errors.push(`Unsupported file type: ${fileType}`);
        return { valid: false, errors };
    }
  }

  private async extractTextContent(
    content: ArrayBuffer | string,
    fileType: string
  ): Promise<string> {
    if (typeof content === 'string') {
      return content;
    }

    // For binary formats, we would need specific parsers
    switch (fileType) {
      case 'application/pdf':
        // TODO: Integrate PDF text extraction library
        return 'PDF text content extraction not yet implemented';

      case 'application/epub+zip':
        // TODO: Integrate EPUB text extraction library
        return 'EPUB text content extraction not yet implemented';

      default:
        return 'Binary content - text extraction not supported';
    }
  }

  private async generateDocumentMetadata(
    textContent: string,
    context: DocumentUploadContext,
    culturalAnalysis: CulturalAnalysis,
    securityValidation: SecurityValidationResult
  ): Promise<DocumentMetadata> {
    const wordCount = textContent.split(/\s+/).length;
    const estimatedReadingTime = Math.ceil(wordCount / 200); // 200 words per minute

    return {
      title: context.fileName.replace(/\.[^/.]+$/, ''), // Remove extension
      author: 'Unknown',
      description: textContent.slice(0, 200) + (textContent.length > 200 ? '...' : ''),
      language: this.detectLanguage(textContent),
      wordCount,
      estimatedReadingTime,
      fileType: context.fileType,
      fileSize: context.fileSize,
      uploadedBy: context.userId,
      uploadedAt: new Date(),
      culturalSensitivityLevel: culturalAnalysis.detectedLevel,
      securityLevel: securityValidation.securityLevel || 'UNKNOWN',
      tags: this.extractTags(textContent),
      source: context.source,
    };
  }

  private async createDocumentObject(
    textContent: string,
    metadata: DocumentMetadata,
    context: DocumentUploadContext,
    culturalAnalysis: CulturalAnalysis
  ): Promise<Document> {
    const contentHash = await securityValidator.generateSecureHash(textContent);

    return {
      id: this.generateDocumentId(),
      ...metadata,
      content: textContent,
      contentHash,
      culturalContext: {
        sensitivityLevel: culturalAnalysis.detectedLevel,
        culturalOrigin: culturalAnalysis.detectedOrigin,
        educationalContext: culturalAnalysis.suggestedContext,
        traditionalProtocols: [],
        sourceAttribution: context.source,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      status: 'active',
    };
  }

  private detectLanguage(text: string): string {
    // Simple language detection - would use proper library in production
    const commonWords = {
      en: ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that'],
      es: ['el', 'de', 'que', 'y', 'en', 'un', 'es', 'se'],
      fr: ['le', 'de', 'et', 'un', 'il', 'être', 'et', 'en'],
      pt: ['o', 'de', 'que', 'e', 'do', 'da', 'em', 'um'],
    };

    const words = text.toLowerCase().split(/\s+/).slice(0, 100);
    let maxMatches = 0;
    let detectedLang = 'en';

    for (const [lang, langWords] of Object.entries(commonWords)) {
      const matches = words.filter(word => langWords.includes(word)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedLang = lang;
      }
    }

    return detectedLang;
  }

  private extractTags(text: string): string[] {
    // Simple tag extraction - would use NLP in production
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordCounts = words.reduce((acc: Record<string, number>, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const documentValidator = new DocumentValidator();
