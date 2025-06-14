/**
 * Main Validation Service
 *
 * Orchestrates all validation types following SOLID principles:
 * - Single Responsibility: Each validator handles specific validation type
 * - Open/Closed: Extensible for new validation types
 * - Interface Segregation: Clear validation interfaces
 * - Dependency Inversion: Depends on abstractions, not concrete classes
 *
 * ANTI-CENSORSHIP ENFORCEMENT:
 * - Cultural validation is INFORMATION ONLY - NO ACCESS CONTROL
 * - Security validation for technical threats only
 * - No content blocking based on cultural, political, or ideological factors
 */

import type { Document } from '@/types/Document';
import type {
  CulturalAnalysis,
  CulturalInformation,
  CulturalSensitivityLevel,
} from '@/types/Cultural';
import type { SecurityValidationResult, SafetyResult, ValidationContext } from '@/types/Security';
import { culturalValidator, securityValidator, documentValidator } from './validation';
import type { DocumentValidationResult, DocumentUploadContext } from './validation';

/**
 * Complete validation result combining all validation types
 */
export interface CompleteValidationResult {
  // Overall validation status
  valid: boolean;

  // Document validation
  documentResult?: DocumentValidationResult;

  // Cultural analysis (INFORMATION ONLY)
  culturalAnalysis: CulturalAnalysis;
  culturalInformation?: CulturalInformation;

  // Security validation
  securityValidation: SecurityValidationResult;
  safetyAssessment: SafetyResult;

  // Validation metadata
  validationId: string;
  validatedAt: Date;
  validationVersion: string;

  // Result aggregation
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Main validation service orchestrator
 *
 * Coordinates all validation types while maintaining strict separation of concerns
 */
export class ValidationService {
  private readonly validationVersion = '1.0.0';

  /**
   * Complete document validation pipeline
   *
   * @param fileContent - Document content to validate
   * @param context - Validation context
   * @returns Complete validation result
   */
  async validateDocument(
    fileContent: ArrayBuffer | string,
    context: DocumentUploadContext
  ): Promise<CompleteValidationResult> {
    const validationId = this.generateValidationId();
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Step 1: Document validation (includes format, security, and cultural analysis)
      const documentResult = await documentValidator.validateDocument(fileContent, context);

      // Step 2: Enhanced cultural information (INFORMATION ONLY)
      let culturalInformation: CulturalInformation | undefined;
      if (documentResult.document) {
        culturalInformation = await culturalValidator.provideCulturalInformation(
          documentResult.document.id,
          context.userId
        );
      }

      // Step 3: Aggregate results
      const overallValid = documentResult.valid;

      // Collect all errors and warnings
      errors.push(...documentResult.errors);
      warnings.push(...documentResult.warnings);

      // Generate recommendations
      recommendations.push(...this.generateRecommendations(documentResult));

      return {
        valid: overallValid,
        documentResult,
        culturalAnalysis: documentResult.culturalAnalysis,
        culturalInformation,
        securityValidation: documentResult.securityValidation,
        safetyAssessment: documentResult.safetyAssessment,
        validationId,
        validatedAt: new Date(),
        validationVersion: this.validationVersion,
        errors,
        warnings,
        recommendations,
      };
    } catch (error) {
      console.error('Validation service error:', error);

      // Return safe failure state
      return this.createFailureResult(validationId, error);
    }
  }

  /**
   * Validate user input for any form field
   *
   * @param input - Input to validate
   * @param context - Validation context
   * @returns Security validation result
   */
  async validateUserInput(
    input: any,
    context: ValidationContext
  ): Promise<SecurityValidationResult> {
    try {
      return await securityValidator.validateInput(input, context);
    } catch (error) {
      console.error('User input validation error:', error);

      return {
        valid: false,
        error: 'Input validation failed',
        securityLevel: 'BLOCKED',
        validatedAt: new Date(),
        validationId: this.generateValidationId(),
      };
    }
  }

  /**
   * Analyze content for cultural context (INFORMATION ONLY)
   *
   * @param content - Content to analyze
   * @returns Cultural analysis with educational information
   */
  async analyzeCulturalContext(content: string | Document): Promise<CulturalAnalysis> {
    try {
      return await culturalValidator.analyzeCulturalSensitivity(content);
    } catch (error) {
      console.error('Cultural analysis error:', error);

      // Always provide default public analysis - never block
      return {
        detectedLevel: 1, // CulturalSensitivityLevel.PUBLIC
        confidence: 0,
        detectedSymbols: [],
        suggestedContext: 'Cultural analysis unavailable - content accessible',
        recommendedInformation: [],
        analysisMetadata: {
          analyzedAt: new Date(),
          analysisVersion: this.validationVersion,
          reviewRequired: false,
        },
      };
    }
  }

  /**
   * Get cultural information for educational purposes
   *
   * @param documentId - Document ID
   * @param userId - User ID (for personalization only)
   * @returns Cultural information for education
   */
  async getCulturalInformation(documentId: string, userId: string): Promise<CulturalInformation> {
    try {
      return await culturalValidator.provideCulturalInformation(documentId, userId);
    } catch (error) {
      console.error('Cultural information error:', error);

      // Always provide information, never block access
      return {
        sensitivityLevel: 1, // CulturalSensitivityLevel.PUBLIC
        culturalContext: 'Cultural information unavailable',
        educationalResources: [],
        traditionalProtocols: [],
        informationOnly: true,
        educationalPurpose: true,
      };
    }
  }

  /**
   * Validate file for malware and security threats
   *
   * @param filePath - Path to file to scan
   * @returns Security scan result
   */
  async scanFileForThreats(filePath: string) {
    try {
      return await securityValidator.scanForMalware(filePath);
    } catch (error) {
      console.error('File scanning error:', error);

      // Fail secure - block unknown files
      return {
        safe: false,
        threats: [
          {
            type: 'SCAN_ERROR',
            severity: 'HIGH',
            description: 'Unable to scan file for security threats',
            recommendation: 'File blocked due to scan failure',
          },
        ],
        scanTime: new Date(),
        scanVersion: this.validationVersion,
      };
    }
  }

  /**
   * Generate validation summary for user display
   *
   * @param result - Validation result
   * @returns User-friendly summary
   */
  generateValidationSummary(result: CompleteValidationResult): {
    status: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    culturalNotes?: string;
    nextSteps: string[];
  } {
    if (!result.valid) {
      return {
        status: 'error',
        title: 'Validation Failed',
        message: 'Document could not be validated due to security concerns.',
        nextSteps: [
          'Check file format is supported (PDF/EPUB)',
          'Ensure file is not corrupted',
          'Verify file comes from trusted source',
        ],
      };
    }

    if (result.warnings.length > 0) {
      return {
        status: 'warning',
        title: 'Validation Completed with Warnings',
        message: 'Document is valid but has some considerations.',
        culturalNotes: this.generateCulturalNotes(result.culturalAnalysis),
        nextSteps: [
          'Review warnings before proceeding',
          'Consider cultural context if applicable',
          'Document ready for upload',
        ],
      };
    }

    return {
      status: 'success',
      title: 'Validation Successful',
      message: 'Document has been successfully validated and is ready for upload.',
      culturalNotes: this.generateCulturalNotes(result.culturalAnalysis),
      nextSteps: [
        'Document ready for upload',
        'Cultural context available for learning',
        'All security checks passed',
      ],
    };
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private generateRecommendations(documentResult: DocumentValidationResult): string[] {
    const recommendations: string[] = [];

    // Security recommendations
    if (documentResult.securityValidation.securityLevel === 'WARNING') {
      recommendations.push('Review security warnings before proceeding');
    }

    // Cultural recommendations (EDUCATIONAL ONLY)
    if (documentResult.culturalAnalysis.detectedLevel > CulturalSensitivityLevel.PUBLIC) {
      recommendations.push('Cultural context information available for educational purposes');
      recommendations.push('Consider reviewing cultural learning resources');
    }

    // Safety recommendations
    if (!documentResult.safetyAssessment.safe) {
      recommendations.push('Review safety assessment before upload');
    }

    // File format recommendations
    if (documentResult.errors.some(e => e.includes('format'))) {
      recommendations.push('Ensure file format is PDF or EPUB');
    }

    return recommendations;
  }

  private generateCulturalNotes(culturalAnalysis: CulturalAnalysis): string | undefined {
    if (culturalAnalysis.detectedLevel === CulturalSensitivityLevel.PUBLIC) {
      return undefined;
    }

    return (
      `This content appears to have cultural significance (${culturalAnalysis.detectedLevel}). ` +
      `Educational resources are available to enhance understanding. ` +
      `${culturalAnalysis.suggestedContext || ''}`
    );
  }

  private createFailureResult(validationId: string, error: unknown): CompleteValidationResult {
    return {
      valid: false,
      culturalAnalysis: {
        detectedLevel: 1, // CulturalSensitivityLevel.PUBLIC
        confidence: 0,
        detectedSymbols: [],
        analysisMetadata: {
          analyzedAt: new Date(),
          analysisVersion: this.validationVersion,
          reviewRequired: false,
        },
      },
      securityValidation: {
        valid: false,
        error: 'Validation service error',
        securityLevel: 'BLOCKED',
        validatedAt: new Date(),
        validationId,
      },
      safetyAssessment: {
        safe: false,
        threats: [
          {
            type: 'VALIDATION_ERROR',
            severity: 'HIGH',
            description: 'Validation service encountered an error',
            recommendation: 'Contact support if problem persists',
          },
        ],
        confidence: 0,
        recommendation: 'Validation failed',
      },
      validationId,
      validatedAt: new Date(),
      validationVersion: this.validationVersion,
      errors: ['Validation service error occurred'],
      warnings: [],
      recommendations: ['Try again or contact support'],
    };
  }

  private generateValidationId(): string {
    return `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const validationService = new ValidationService();

// Export types for external use
export type { CompleteValidationResult, DocumentUploadContext, DocumentValidationResult };
