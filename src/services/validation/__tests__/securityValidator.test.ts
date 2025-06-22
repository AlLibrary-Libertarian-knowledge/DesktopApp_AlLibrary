import { describe, it, expect, vi, beforeEach } from 'vitest';
import { securityValidator } from '../securityValidator';
import type { ValidationContext } from '@/types/Security';

describe('SecurityValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Technical Security Validation', () => {
    it('should validate input for technical threats only', async () => {
      const safeInput = 'Normal user input text';
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'text',
        source: 'user_input',
      };

      const result = await securityValidator.validateInput(safeInput, context);

      expect(result.valid).toBe(true);
      expect(result.securityLevel).toBe('SAFE');
      expect(result.error).toBeUndefined();
    });

    it('should detect malicious script injection attempts', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'text',
        source: 'user_input',
      };

      const result = await securityValidator.validateInput(maliciousInput, context);

      expect(result.valid).toBe(false);
      expect(result.securityLevel).toBe('BLOCKED');
      expect(result.error).toContain('script');
    });

    it('should validate file uploads for malware', async () => {
      const mockFileBuffer = new ArrayBuffer(1024);
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'file',
        source: 'file_upload',
        fileName: 'test.pdf',
        fileSize: 1024,
      };

      const result = await securityValidator.validateInput(mockFileBuffer, context);

      expect(result).toBeDefined();
      expect(result.validatedAt).toBeInstanceOf(Date);
      expect(result.validationId).toBeDefined();
    });

    it('should NOT filter content based on cultural or political factors', async () => {
      const culturalContent = 'Traditional sacred practices and political dissent';
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'text',
        source: 'user_input',
      };

      const result = await securityValidator.validateInput(culturalContent, context);

      // Should pass security validation - no content censorship
      expect(result.valid).toBe(true);
      expect(result.securityLevel).toBe('SAFE');
    });
  });

  describe('Malware Scanning', () => {
    it('should scan files for malware threats', async () => {
      const filePath = '/test/path/document.pdf';

      const result = await securityValidator.scanFile(filePath);

      expect(result).toBeDefined();
      expect(result.clean).toBeDefined();
      expect(result.threats).toBeDefined();
      expect(Array.isArray(result.threats)).toBe(true);
      expect(result.scanEngine).toBeDefined();
      expect(result.scanDate).toBeInstanceOf(Date);
    });

    it('should handle scan failures gracefully', async () => {
      const invalidPath = '/nonexistent/file.pdf';

      const result = await securityValidator.scanFile(invalidPath);

      // Should return safe failure state
      expect(result).toBeDefined();
      expect(result.clean).toBe(false); // Fail-safe approach
      expect(result.threats).toBeDefined();
    });

    it('should complete scans within performance targets', async () => {
      const filePath = '/test/path/small-file.pdf';
      const startTime = Date.now();

      await securityValidator.scanFile(filePath);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // <5s for file scanning
    });
  });

  describe('Legal Compliance Validation', () => {
    it('should check legal compliance for jurisdiction', async () => {
      const content = 'Legal document content';
      const jurisdiction = 'global';

      const result = await securityValidator.validateLegalCompliance(content, jurisdiction);

      expect(result).toBeDefined();
      expect(result.compliant).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.jurisdiction).toBe(jurisdiction);
    });

    it('should handle different jurisdictions', async () => {
      const content = 'Test content';
      const jurisdictions = ['US', 'EU', 'global'];

      for (const jurisdiction of jurisdictions) {
        const result = await securityValidator.validateLegalCompliance(content, jurisdiction);

        expect(result.jurisdiction).toBe(jurisdiction);
        expect(result.compliant).toBeDefined();
      }
    });

    it('should NOT block content based on political or cultural factors', async () => {
      const politicalContent = 'Political dissent and cultural criticism';
      const jurisdiction = 'global';

      const result = await securityValidator.validateLegalCompliance(
        politicalContent,
        jurisdiction
      );

      // Legal compliance should be technical only
      expect(result.compliant).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize dangerous HTML elements', async () => {
      const dangerousHtml = '<script>malicious()</script><p>safe content</p>';

      const sanitized = await securityValidator.sanitizeInput(dangerousHtml);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('safe content');
    });

    it('should preserve safe formatting', async () => {
      const safeHtml = '<p>Safe paragraph</p><strong>Bold text</strong>';

      const sanitized = await securityValidator.sanitizeInput(safeHtml);

      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
    });

    it('should handle various input types', async () => {
      const inputs = ['plain text', '<p>HTML content</p>', '{"json": "data"}', 'unicode: 🌍'];

      for (const input of inputs) {
        const sanitized = await securityValidator.sanitizeInput(input);

        expect(sanitized).toBeDefined();
        expect(typeof sanitized).toBe('string');
      }
    });
  });

  describe('Threat Detection', () => {
    it('should detect SQL injection attempts', async () => {
      const sqlInjection = "'; DROP TABLE users; --";
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'text',
        source: 'user_input',
      };

      const result = await securityValidator.validateInput(sqlInjection, context);

      expect(result.valid).toBe(false);
      expect(result.securityLevel).toBe('BLOCKED');
    });

    it('should detect path traversal attempts', async () => {
      const pathTraversal = '../../../etc/passwd';
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'path',
        source: 'file_access',
      };

      const result = await securityValidator.validateInput(pathTraversal, context);

      expect(result.valid).toBe(false);
      expect(result.securityLevel).toBe('BLOCKED');
    });

    it('should allow legitimate file paths', async () => {
      const legitimatePath = '/documents/user123/file.pdf';
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'path',
        source: 'file_access',
      };

      const result = await securityValidator.validateInput(legitimatePath, context);

      expect(result.valid).toBe(true);
      expect(result.securityLevel).toBe('SAFE');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle high-volume validation requests', async () => {
      const requests = Array.from({ length: 100 }, (_, i) =>
        securityValidator.validateInput(`test input ${i}`, {
          userId: 'user-123',
          sessionId: 'session-456',
          inputType: 'text',
          source: 'user_input',
        })
      );

      const results = await Promise.all(requests);

      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.validatedAt).toBeInstanceOf(Date);
      });
    });

    it('should maintain validation metadata', async () => {
      const input = 'test input';
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'text',
        source: 'user_input',
      };

      const result = await securityValidator.validateInput(input, context);

      expect(result.validationId).toBeDefined();
      expect(result.validatedAt).toBeInstanceOf(Date);
      expect(typeof result.validationId).toBe('string');
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        null,
        undefined,
        '',
        ' '.repeat(10000), // Very long whitespace
        '🌍'.repeat(1000), // Unicode stress test
      ];

      for (const input of edgeCases) {
        const context: ValidationContext = {
          userId: 'user-123',
          sessionId: 'session-456',
          inputType: 'text',
          source: 'user_input',
        };

        const result = await securityValidator.validateInput(input as any, context);

        expect(result).toBeDefined();
        expect(result.validatedAt).toBeInstanceOf(Date);
      }
    });
  });
});
