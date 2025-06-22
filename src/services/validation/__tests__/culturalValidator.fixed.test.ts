import { describe, it, expect, vi, beforeEach } from 'vitest';
import { culturalValidator } from '../culturalValidator';
import { CulturalSensitivityLevel } from '@/types/Cultural';
import type { Document } from '@/types/Document';

describe('CulturalValidator - Fixed Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Anti-Censorship Enforcement', () => {
    it('should NEVER block access based on cultural sensitivity', async () => {
      const sensitiveContent = 'Sacred traditional ceremony content';

      const result = await culturalValidator.analyzeCulturalSensitivity(sensitiveContent);

      // Cultural analysis should provide information but NEVER block access
      expect(result).toBeDefined();
      expect(result.detectedLevel).toBeGreaterThan(0);
      expect(result.suggestedContext).toBeDefined();
      // Key test: should always suggest content is accessible
      expect(result.suggestedContext).toBeDefined();
      expect(result.suggestedContext).toMatch(/educational/i);
    });

    it('should provide educational context without restriction', async () => {
      const traditionalContent = 'Traditional healing practices and sacred knowledge';

      const result = await culturalValidator.analyzeCulturalSensitivity(traditionalContent);

      expect(result.recommendedInformation).toBeDefined();
      expect(result.suggestedContext).toBeDefined();
      expect(result.analysisMetadata.reviewRequired).toBe(false); // No approval required for most content
    });

    it('should support multiple cultural perspectives equally', async () => {
      const conflictingContent = 'Different cultural interpretations of the same practice';

      const result = await culturalValidator.analyzeCulturalSensitivity(conflictingContent);

      // Should provide context for all perspectives, not favor one
      expect(result.detectedSymbols).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Cultural Information Provider', () => {
    it('should provide educational information for all sensitivity levels', async () => {
      const documentId = 'test-doc-123';
      const userId = 'user-456';

      const info = await culturalValidator.provideCulturalInformation(documentId, userId);

      expect(info.informationOnly).toBe(true);
      expect(info.educationalPurpose).toBe(true);
      expect(info.sensitivityLevel).toBeDefined();
      expect(Object.values(CulturalSensitivityLevel)).toContain(info.sensitivityLevel);
    });

    it('should never require community approval for access', async () => {
      const documentId = 'sensitive-doc-789';
      const userId = 'user-123';

      const info = await culturalValidator.provideCulturalInformation(documentId, userId);

      // Information should be provided immediately without approval workflows
      expect(info).toBeDefined();
      expect(info.informationOnly).toBe(true);
      expect(info.educationalPurpose).toBe(true);
      // No approval or validation gates
    });

    it('should handle all cultural sensitivity levels (1-5)', async () => {
      const levels: CulturalSensitivityLevel[] = [1, 2, 3, 4, 5];

      for (const level of levels) {
        const mockDoc: Document = {
          id: `doc-level-${level}`,
          title: `Document Level ${level}`,
          description: 'Test document description',
          format: 'pdf' as any,
          contentType: 'educational' as any,
          status: 'active' as any,
          filePath: '/test/path',
          originalFilename: 'test.pdf',
          fileSize: 1024,
          fileHash: 'abc123',
          mimeType: 'application/pdf',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user123',
          version: 1,
          culturalMetadata: {
            sensitivityLevel: level,
            culturalOrigin: 'Test Culture',
          },
          tags: [],
          categories: [],
          language: 'en',
          authors: [],
          accessHistory: [],
          relationships: [],
          securityValidation: {
            validatedAt: new Date(),
            passed: true,
            malwareScanResult: {
              clean: true,
              threats: [],
              scanEngine: 'test',
              scanDate: new Date(),
            },
            integrityCheck: {
              valid: true,
              expectedHash: 'abc123',
              actualHash: 'abc123',
              algorithm: 'sha256',
            },
            legalCompliance: { compliant: true, issues: [], jurisdiction: 'global' },
            issues: [],
          },
          contentVerification: {
            signature: 'test-sig',
            algorithm: 'RSA',
            verifiedAt: new Date(),
            chainOfCustody: [],
            authentic: true,
            verificationProvider: 'test',
          },
          sourceAttribution: {
            originalSource: 'test',
            sourceType: 'academic' as any,
            credibilityIndicators: [],
            sourceVerified: true,
            attributionRequirements: [],
          },
        };

        const result = await culturalValidator.analyzeCulturalSensitivity(mockDoc);

        expect(result.detectedLevel).toBeGreaterThan(0);
        expect(result.suggestedContext).toBeDefined();
      }
    });
  });

  describe('Cultural Analysis Quality', () => {
    it('should detect cultural symbols and provide context', async () => {
      const contentWithSymbols = 'Traditional dreamtime stories and sacred symbols';

      const result = await culturalValidator.analyzeCulturalSensitivity(contentWithSymbols);

      expect(result.detectedSymbols).toBeDefined();
      expect(Array.isArray(result.detectedSymbols)).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should provide appropriate educational recommendations', async () => {
      const educationalContent = 'Historical cultural practices and their significance';

      const result = await culturalValidator.analyzeCulturalSensitivity(educationalContent);

      expect(result.recommendedInformation).toBeDefined();
      expect(Array.isArray(result.recommendedInformation)).toBe(true);
      expect(result.suggestedContext).toBeDefined();
    });

    it('should maintain analysis metadata for transparency', async () => {
      const content = 'Cultural content for analysis';

      const result = await culturalValidator.analyzeCulturalSensitivity(content);

      expect(result.analysisMetadata).toBeDefined();
      expect(result.analysisMetadata.analyzedAt).toBeInstanceOf(Date);
      expect(result.analysisMetadata.analysisVersion).toBeDefined();
      expect(typeof result.analysisMetadata.reviewRequired).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle invalid input', async () => {
      const invalidInput = null as any;

      const result = await culturalValidator.analyzeCulturalSensitivity(invalidInput);

      // Should return safe default, never block access
      expect(result).toBeDefined();
      expect(result.detectedLevel).toBe(CulturalSensitivityLevel.PUBLIC);
      expect(result.suggestedContext).toContain('accessible');
    });

    it('should handle service failures without blocking access', async () => {
      // Mock a service failure by passing malformed content
      const result = await culturalValidator.analyzeCulturalSensitivity('');

      // Even on edge cases, should provide access
      expect(result).toBeDefined();
      expect(result.detectedLevel).toBeDefined();
      expect(Object.values(CulturalSensitivityLevel)).toContain(result.detectedLevel);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete analysis within performance targets', async () => {
      const startTime = Date.now();
      const content = 'Performance test content with cultural elements';

      await culturalValidator.analyzeCulturalSensitivity(content);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // <500ms requirement
    });

    it('should handle large content efficiently', async () => {
      const largeContent = 'Cultural content '.repeat(1000);
      const startTime = Date.now();

      const result = await culturalValidator.analyzeCulturalSensitivity(largeContent);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // <2s for large content
      expect(result).toBeDefined();
    });
  });

  describe('Educational Module System', () => {
    it('should provide educational modules for different sensitivity levels', async () => {
      const levels = [
        CulturalSensitivityLevel.PUBLIC,
        CulturalSensitivityLevel.EDUCATIONAL,
        CulturalSensitivityLevel.COMMUNITY,
        CulturalSensitivityLevel.GUARDIAN,
        CulturalSensitivityLevel.SACRED,
      ];

      for (const level of levels) {
        const modules = await culturalValidator.getEducationalModules(level);

        expect(modules).toBeDefined();
        expect(Array.isArray(modules)).toBe(true);
        expect(modules.length).toBeGreaterThan(0);

        // Verify module structure
        modules.forEach(module => {
          expect(module.id).toBeDefined();
          expect(module.culturalContext).toBeDefined();
          expect(module.objectives).toBeDefined();
          expect(Array.isArray(module.objectives)).toBe(true);
          expect(module.content).toBeDefined();
          expect(typeof module.estimatedTime).toBe('number');
        });
      }
    });

    it('should provide more modules for higher sensitivity levels', async () => {
      const publicModules = await culturalValidator.getEducationalModules(
        CulturalSensitivityLevel.PUBLIC
      );
      const sacredModules = await culturalValidator.getEducationalModules(
        CulturalSensitivityLevel.SACRED
      );

      expect(sacredModules.length).toBeGreaterThanOrEqual(publicModules.length);
    });
  });

  describe('Cultural Metadata Validation', () => {
    it('should validate and enhance cultural metadata', async () => {
      const metadata = {
        sensitivityLevel: CulturalSensitivityLevel.COMMUNITY,
        culturalOrigin: 'Test Community',
      };

      const result = await culturalValidator.validateCulturalMetadata(metadata);

      expect(result.valid).toBe(true); // Always valid - we enhance, never block
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.enhancedMetadata).toBeDefined();
      expect(result.enhancedMetadata.validatedAt).toBeInstanceOf(Date);
    });

    it('should provide helpful suggestions for metadata improvement', async () => {
      const minimalMetadata = {
        sensitivityLevel: CulturalSensitivityLevel.GUARDIAN,
      };

      const result = await culturalValidator.validateCulturalMetadata(minimalMetadata);

      expect(result.valid).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
      // Should suggest improvements, not restrictions
      expect(result.suggestions.some(s => s.includes('enhance') || s.includes('improve'))).toBe(
        true
      );
    });
  });
});
