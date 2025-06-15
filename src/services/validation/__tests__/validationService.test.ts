import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationService } from '../../validationService';
import type { DocumentUploadContext } from '../documentValidator';
import type { ValidationContext } from '@/types/Security';

describe('ValidationService Integration', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
    vi.clearAllMocks();
  });

  describe('Complete Document Validation Pipeline', () => {
    it('should orchestrate all validation types for document upload', async () => {
      const mockFileContent = new ArrayBuffer(1024);
      const context: DocumentUploadContext = {
        userId: 'user-123',
        fileName: 'test-document.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadSource: 'user_upload',
      };

      const result = await validationService.validateDocument(mockFileContent, context);

      // Verify complete validation result structure
      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
      expect(result.validationId).toBeDefined();
      expect(result.validatedAt).toBeInstanceOf(Date);
      expect(result.validationVersion).toBeDefined();

      // Verify all validation components are present
      expect(result.culturalAnalysis).toBeDefined();
      expect(result.securityValidation).toBeDefined();
      expect(result.safetyAssessment).toBeDefined();

      // Verify aggregated results
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should provide cultural information without blocking access', async () => {
      const culturalContent = 'Traditional sacred knowledge document';
      const context: DocumentUploadContext = {
        userId: 'user-123',
        fileName: 'sacred-knowledge.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        uploadSource: 'user_upload',
      };

      const result = await validationService.validateDocument(culturalContent, context);

      // Cultural analysis should provide information but not block
      expect(result.culturalAnalysis).toBeDefined();
      expect(result.culturalAnalysis.suggestedContext).toContain('accessible');

      if (result.culturalInformation) {
        expect(result.culturalInformation.informationOnly).toBe(true);
        expect(result.culturalInformation.educationalPurpose).toBe(true);
      }
    });

    it('should block technical security threats', async () => {
      const maliciousContent = '<script>malicious_code()</script>';
      const context: DocumentUploadContext = {
        userId: 'user-123',
        fileName: 'malicious.html',
        fileSize: maliciousContent.length,
        mimeType: 'text/html',
        uploadSource: 'user_upload',
      };

      const result = await validationService.validateDocument(maliciousContent, context);

      // Should detect and block technical threats
      expect(result.securityValidation.valid).toBe(false);
      expect(result.securityValidation.securityLevel).toBe('BLOCKED');
      expect(result.valid).toBe(false);
    });

    it('should handle validation failures gracefully', async () => {
      const invalidContent = null as any;
      const context: DocumentUploadContext = {
        userId: 'user-123',
        fileName: 'invalid.pdf',
        fileSize: 0,
        mimeType: 'application/pdf',
        uploadSource: 'user_upload',
      };

      const result = await validationService.validateDocument(invalidContent, context);

      // Should return safe failure state
      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('User Input Validation', () => {
    it('should validate safe user input', async () => {
      const safeInput = 'Normal user search query';
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'text',
        source: 'search_query',
      };

      const result = await validationService.validateUserInput(safeInput, context);

      expect(result.valid).toBe(true);
      expect(result.securityLevel).toBe('SAFE');
    });

    it('should block malicious user input', async () => {
      const maliciousInput = '<script>steal_data()</script>';
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'text',
        source: 'user_input',
      };

      const result = await validationService.validateUserInput(maliciousInput, context);

      expect(result.valid).toBe(false);
      expect(result.securityLevel).toBe('BLOCKED');
    });

    it('should handle input validation errors gracefully', async () => {
      const invalidInput = undefined as any;
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'text',
        source: 'user_input',
      };

      const result = await validationService.validateUserInput(invalidInput, context);

      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Cultural Context Analysis', () => {
    it('should analyze cultural context for educational purposes', async () => {
      const culturalContent = 'Traditional healing practices and ceremonies';

      const result = await validationService.analyzeCulturalContext(culturalContent);

      expect(result).toBeDefined();
      expect(result.detectedLevel).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.suggestedContext).toContain('accessible');
      expect(result.analysisMetadata.reviewRequired).toBe(false);
    });

    it('should provide cultural information for all sensitivity levels', async () => {
      const documentId = 'cultural-doc-123';
      const userId = 'user-456';

      const result = await validationService.getCulturalInformation(documentId, userId);

      expect(result).toBeDefined();
      expect(result.informationOnly).toBe(true);
      expect(result.educationalPurpose).toBe(true);
      expect(result.culturalContext).toBeDefined();
    });

    it('should handle cultural analysis errors without blocking', async () => {
      const invalidContent = null as any;

      const result = await validationService.analyzeCulturalContext(invalidContent);

      // Should provide safe default, never block
      expect(result).toBeDefined();
      expect(result.detectedLevel).toBe(1); // Default to public
      expect(result.suggestedContext).toContain('accessible');
    });
  });

  describe('File Threat Scanning', () => {
    it('should scan files for security threats', async () => {
      const filePath = '/test/documents/sample.pdf';

      const result = await validationService.scanFileForThreats(filePath);

      expect(result).toBeDefined();
      expect(result.clean).toBeDefined();
      expect(result.threats).toBeDefined();
      expect(Array.isArray(result.threats)).toBe(true);
      expect(result.scanDate).toBeInstanceOf(Date);
    });

    it('should handle scan failures gracefully', async () => {
      const invalidPath = '/nonexistent/file.pdf';

      const result = await validationService.scanFileForThreats(invalidPath);

      expect(result).toBeDefined();
      expect(result.clean).toBe(false); // Fail-safe
    });
  });

  describe('Validation Summary Generation', () => {
    it('should generate appropriate summary for successful validation', async () => {
      const mockResult = {
        valid: true,
        documentResult: { valid: true, errors: [], warnings: [] },
        culturalAnalysis: {
          detectedLevel: 2,
          suggestedContext: 'Content accessible with educational context',
          confidence: 0.8,
          detectedSymbols: [],
          recommendedInformation: [],
          analysisMetadata: {
            analyzedAt: new Date(),
            analysisVersion: '1.0.0',
            reviewRequired: false,
          },
        },
        securityValidation: { valid: true, securityLevel: 'SAFE' as const },
        safetyAssessment: { safe: true, issues: [] },
        validationId: 'test-123',
        validatedAt: new Date(),
        validationVersion: '1.0.0',
        errors: [],
        warnings: [],
        recommendations: ['Consider adding metadata'],
      };

      const summary = validationService.generateValidationSummary(mockResult as any);

      expect(summary.status).toBe('success');
      expect(summary.title).toBeDefined();
      expect(summary.message).toBeDefined();
      expect(Array.isArray(summary.nextSteps)).toBe(true);
    });

    it('should generate appropriate summary for validation with warnings', async () => {
      const mockResult = {
        valid: true,
        documentResult: { valid: true, errors: [], warnings: ['Minor formatting issue'] },
        culturalAnalysis: {
          detectedLevel: 3,
          suggestedContext: 'Content accessible with cultural context',
          confidence: 0.9,
          detectedSymbols: ['traditional_symbol'],
          recommendedInformation: ['Cultural background information'],
          analysisMetadata: {
            analyzedAt: new Date(),
            analysisVersion: '1.0.0',
            reviewRequired: false,
          },
        },
        securityValidation: { valid: true, securityLevel: 'SAFE' as const },
        safetyAssessment: { safe: true, issues: [] },
        validationId: 'test-456',
        validatedAt: new Date(),
        validationVersion: '1.0.0',
        errors: [],
        warnings: ['Minor formatting issue'],
        recommendations: ['Review formatting', 'Add cultural context'],
      };

      const summary = validationService.generateValidationSummary(mockResult as any);

      expect(summary.status).toBe('warning');
      expect(summary.culturalNotes).toBeDefined();
    });

    it('should generate appropriate summary for validation errors', async () => {
      const mockResult = {
        valid: false,
        documentResult: { valid: false, errors: ['Security threat detected'], warnings: [] },
        culturalAnalysis: {
          detectedLevel: 1,
          suggestedContext: 'Content accessible',
          confidence: 0.5,
          detectedSymbols: [],
          recommendedInformation: [],
          analysisMetadata: {
            analyzedAt: new Date(),
            analysisVersion: '1.0.0',
            reviewRequired: false,
          },
        },
        securityValidation: { valid: false, securityLevel: 'BLOCKED' as const },
        safetyAssessment: { safe: false, issues: ['Malware detected'] },
        validationId: 'test-789',
        validatedAt: new Date(),
        validationVersion: '1.0.0',
        errors: ['Security threat detected'],
        warnings: [],
        recommendations: ['Remove security threats'],
      };

      const summary = validationService.generateValidationSummary(mockResult as any);

      expect(summary.status).toBe('error');
      expect(summary.nextSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete validation within performance targets', async () => {
      const content = 'Test document content';
      const context: DocumentUploadContext = {
        userId: 'user-123',
        fileName: 'test.pdf',
        fileSize: content.length,
        mimeType: 'application/pdf',
        uploadSource: 'user_upload',
      };

      const startTime = Date.now();
      await validationService.validateDocument(content, context);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // <2s requirement
    });

    it('should handle concurrent validation requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        validationService.validateDocument(`content ${i}`, {
          userId: 'user-123',
          fileName: `test${i}.pdf`,
          fileSize: 100,
          mimeType: 'application/pdf',
          uploadSource: 'user_upload',
        })
      );

      const results = await Promise.all(requests);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.validationId).toBeDefined();
      });
    });
  });
});
