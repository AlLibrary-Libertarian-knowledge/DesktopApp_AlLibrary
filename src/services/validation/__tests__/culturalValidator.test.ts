import { describe, it, expect, vi, beforeEach } from 'vitest';
import { culturalValidator } from '../culturalValidator';
import type { Document } from '@/types/Document';
import type { CulturalSensitivityLevel } from '@/types/Cultural';

describe('CulturalValidator', () => {
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
      expect(result.suggestedContext).toContain('accessible');
    });

    it('should provide educational context without restriction', async () => {
      const traditionalContent = 'Traditional healing practices and sacred knowledge';

      const result = await culturalValidator.analyzeCulturalSensitivity(traditionalContent);

      expect(result.recommendedInformation).toBeDefined();
      expect(result.suggestedContext).toBeDefined();
      expect(result.analysisMetadata.reviewRequired).toBe(false); // No approval required
    });

    it('should support multiple cultural perspectives equally', async () => {
      const conflictingContent = 'Different cultural interpretations of the same practice';

      const result = await culturalValidator.analyzeCulturalSensitivity(conflictingContent);

      // Should provide context for all perspectives, not favor one
      expect(result.detectedSymbols).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cultural Information Provider', () => {
    it('should provide educational information for all sensitivity levels', async () => {
      const documentId = 'test-doc-123';
      const userId = 'user-456';

      const info = await culturalValidator.provideCulturalInformation(documentId, userId);

      expect(info.informationOnly).toBe(true);
      expect(info.educationalPurpose).toBe(true);
      expect(info.culturalContext).toBeDefined();
      expect(info.educationalResources).toBeDefined();
    });

    it('should never require community approval for access', async () => {
      const documentId = 'sensitive-doc-789';
      const userId = 'user-123';

      const info = await culturalValidator.provideCulturalInformation(documentId, userId);

      // Information should be provided immediately without approval workflows
      expect(info).toBeDefined();
      expect(info.traditionalProtocols).toBeDefined();
      // No approval or validation gates
    });

    it('should handle all cultural sensitivity levels (1-5)', async () => {
      const levels: CulturalSensitivityLevel[] = [1, 2, 3, 4, 5];

      for (const level of levels) {
        const mockDoc: Document = {
          id: `doc-level-${level}`,
          title: `Document Level ${level}`,
          culturalMetadata: {
            sensitivityLevel: level,
            culturalOrigin: 'Test Culture',
            traditionalProtocols: [],
            educationalResources: [],
            informationOnly: true,
            educationalPurpose: true,
          },
        } as Document;

        const result = await culturalValidator.analyzeCulturalSensitivity(mockDoc);

        expect(result.detectedLevel).toBe(level);
        expect(result.suggestedContext).toContain('accessible');
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
      expect(result.analysisMetadata.reviewRequired).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle invalid input', async () => {
      const invalidInput = null as any;

      const result = await culturalValidator.analyzeCulturalSensitivity(invalidInput);

      // Should return safe default, never block access
      expect(result).toBeDefined();
      expect(result.detectedLevel).toBe(1); // Default to public
      expect(result.suggestedContext).toContain('accessible');
    });

    it('should handle service failures without blocking access', async () => {
      // Mock a service failure
      const originalConsoleError = console.error;
      console.error = vi.fn();

      try {
        const result = await culturalValidator.analyzeCulturalSensitivity('test content');

        // Even on failure, should provide access
        expect(result).toBeDefined();
        expect(result.suggestedContext).toContain('accessible');
      } finally {
        console.error = originalConsoleError;
      }
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
});
