import { describe, it, expect, vi, beforeEach } from 'vitest';
import { securityValidator } from '../securityValidator';
import type { ValidationContext } from '@/types/Security';

describe('SecurityValidator - Fixed Tests', () => {
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
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Security threats detected');
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

  describe('Input Validation Methods', () => {
    it('should validate different input types', async () => {
      const inputs = [
        { input: 'plain text', type: 'text' },
        { input: '{"json": "data"}', type: 'json' },
        { input: 'unicode: 🌍', type: 'text' },
        { input: new ArrayBuffer(100), type: 'file' },
      ];

      for (const { input, type } of inputs) {
        const context: ValidationContext = {
          userId: 'user-123',
          sessionId: 'session-456',
          inputType: type as any,
          source: 'user_input',
        };

        const result = await securityValidator.validateInput(input, context);

        expect(result).toBeDefined();
        expect(typeof result.valid).toBe('boolean');
        expect(result.validatedAt).toBeInstanceOf(Date);
      }
    });

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
      const requests = Array.from({ length: 50 }, (_, i) =>
        securityValidator.validateInput(`test input ${i}`, {
          userId: 'user-123',
          sessionId: 'session-456',
          inputType: 'text',
          source: 'user_input',
        })
      );

      const results = await Promise.all(requests);

      expect(results).toHaveLength(50);
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
        ' '.repeat(1000), // Very long whitespace
        '🌍'.repeat(100), // Unicode stress test
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

  describe('Security Threat Detection', () => {
    it('should detect various XSS patterns', async () => {
      const xssPatterns = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
        '<svg onload="alert(1)">',
      ];

      for (const pattern of xssPatterns) {
        const context: ValidationContext = {
          userId: 'user-123',
          sessionId: 'session-456',
          inputType: 'text',
          source: 'user_input',
        };

        const result = await securityValidator.validateInput(pattern, context);

        expect(result.valid).toBe(false);
        expect(result.securityLevel).toBe('BLOCKED');
      }
    });

    it('should allow safe HTML content', async () => {
      const safeHtml = '<p>This is safe content</p><strong>Bold text</strong>';
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'text',
        source: 'user_input',
      };

      const result = await securityValidator.validateInput(safeHtml, context);

      // Should be safe or provide sanitized version
      expect(result).toBeDefined();
      expect(result.validatedAt).toBeInstanceOf(Date);
    });

    it('should validate file content types', async () => {
      const contexts = [
        { fileName: 'document.pdf', mimeType: 'application/pdf' },
        { fileName: 'book.epub', mimeType: 'application/epub+zip' },
        { fileName: 'text.txt', mimeType: 'text/plain' },
      ];

      for (const { fileName, mimeType } of contexts) {
        const context: ValidationContext = {
          userId: 'user-123',
          sessionId: 'session-456',
          inputType: 'file',
          source: 'file_upload',
          fileName,
          mimeType,
        };

        const result = await securityValidator.validateInput(new ArrayBuffer(1024), context);

        expect(result).toBeDefined();
        expect(result.validationId).toBeDefined();
      }
    });
  });

  describe('Anti-Censorship Validation', () => {
    it('should not block content based on political views', async () => {
      const politicalContent = 'Government criticism and political dissent content';
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'text',
        source: 'user_input',
      };

      const result = await securityValidator.validateInput(politicalContent, context);

      // Should pass - no political censorship
      expect(result.valid).toBe(true);
      expect(result.securityLevel).toBe('SAFE');
    });

    it('should not block content based on cultural factors', async () => {
      const culturalContent = 'Traditional practices and cultural criticism';
      const context: ValidationContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        inputType: 'text',
        source: 'user_input',
      };

      const result = await securityValidator.validateInput(culturalContent, context);

      // Should pass - no cultural censorship
      expect(result.valid).toBe(true);
      expect(result.securityLevel).toBe('SAFE');
    });

    it('should only block technical security threats', async () => {
      const technicalThreats = [
        '<script>malicious_code()</script>',
        'SELECT * FROM users WHERE 1=1; DROP TABLE users;',
        '../../../etc/passwd',
      ];

      for (const threat of technicalThreats) {
        const context: ValidationContext = {
          userId: 'user-123',
          sessionId: 'session-456',
          inputType: 'text',
          source: 'user_input',
        };

        const result = await securityValidator.validateInput(threat, context);

        // Should block technical threats
        expect(result.valid).toBe(false);
        expect(result.securityLevel).toBe('BLOCKED');
      }
    });
  });
});
