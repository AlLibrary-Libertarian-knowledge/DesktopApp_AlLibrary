/**
 * Security Validation Service
 *
 * Provides comprehensive security validation including:
 * - Input validation and sanitization
 * - Malware scanning for uploaded files
 * - Legal compliance validation
 * - Content integrity verification
 *
 * IMPORTANT: This is TECHNICAL SECURITY ONLY
 * - NO cultural content filtering
 * - NO political content filtering
 * - NO ideological content filtering
 * Only technical threats and legal compliance
 */

import type {
  SecurityValidationResult,
  ValidationContext,
  SecurityThreat,
  ScanResult,
  SafetyResult,
} from '@/types/Security';

/**
 * Security validation pipeline for all user inputs
 */
export class SecurityValidator {
  /**
   * Validate any user input through comprehensive security pipeline
   *
   * @param input - Input to validate
   * @param context - Validation context
   * @returns Validation result with sanitized input
   */
  async validateInput(input: any, context: ValidationContext): Promise<SecurityValidationResult> {
    try {
      // Step 1: Type validation
      const typeValidation = this.validateType(input, context.expectedType);
      if (!typeValidation.valid) {
        throw new Error(`Type validation failed: ${typeValidation.error}`);
      }

      // Step 2: Security scanning
      const securityScan = await this.scanForSecurityThreats(input, context);
      if (!securityScan.safe) {
        throw new Error(`Security threats detected: ${securityScan.threats.join(', ')}`);
      }

      // Step 3: Legal compliance (technical only)
      const legalCompliance = await this.validateLegalCompliance(input, context);
      if (!legalCompliance.compliant) {
        throw new Error(`Legal compliance failed: ${legalCompliance.violations.join(', ')}`);
      }

      // Step 4: Content sanitization
      const sanitizedInput = this.sanitizeContent(input, context);

      return {
        valid: true,
        sanitizedInput,
        securityLevel: this.calculateSecurityLevel(securityScan, legalCompliance),
        validatedAt: new Date(),
        validationId: this.generateValidationId(),
      };
    } catch (error) {
      console.error('Security validation failed:', error);

      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        securityLevel: 'BLOCKED',
        validatedAt: new Date(),
        validationId: this.generateValidationId(),
      };
    }
  }

  /**
   * Scan file for malware and security threats
   *
   * @param filePath - Path to file to scan
   * @returns Scan result with threat information
   */
  async scanForMalware(filePath: string): Promise<ScanResult> {
    try {
      // Validate file exists and is accessible
      const fileInfo = await this.getFileInfo(filePath);

      // Check file signature/magic bytes
      const signatureValid = await this.validateFileSignature(filePath, fileInfo.type);
      if (!signatureValid) {
        return {
          safe: false,
          threats: [
            {
              type: 'INVALID_SIGNATURE',
              severity: 'HIGH',
              description: 'File signature does not match extension',
              recommendation: 'File may be disguised malware',
            },
          ],
          scanTime: new Date(),
          scanVersion: '1.0.0',
        };
      }

      // Scan for known malware patterns
      const malwarePatterns = await this.scanMalwarePatterns(filePath);

      // Check for suspicious content
      const suspiciousContent = await this.detectSuspiciousContent(filePath, fileInfo.type);

      const allThreats = [...malwarePatterns, ...suspiciousContent];

      return {
        safe: allThreats.length === 0,
        threats: allThreats,
        scanTime: new Date(),
        scanVersion: '1.0.0',
        fileInfo,
      };
    } catch (error) {
      console.error('Malware scan failed:', error);

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
        scanVersion: '1.0.0',
      };
    }
  }

  /**
   * Validate content safety (technical only)
   *
   * @param content - Content to validate
   * @returns Safety assessment
   */
  async validateContentSafety(content: any): Promise<SafetyResult> {
    try {
      const threats: SecurityThreat[] = [];

      // Check for executable code in documents
      if (typeof content === 'string') {
        const codeThreats = this.detectExecutableCode(content);
        threats.push(...codeThreats);

        // Check for suspicious URLs/links
        const urlThreats = this.detectSuspiciousUrls(content);
        threats.push(...urlThreats);

        // Check for data exfiltration patterns
        const dataThreats = this.detectDataExfiltration(content);
        threats.push(...dataThreats);
      }

      return {
        safe: threats.length === 0,
        threats,
        confidence: this.calculateConfidence(threats),
        recommendation: this.generateRecommendation(threats),
      };
    } catch (error) {
      console.error('Content safety validation failed:', error);

      return {
        safe: false,
        threats: [
          {
            type: 'VALIDATION_ERROR',
            severity: 'MEDIUM',
            description: 'Unable to validate content safety',
            recommendation: 'Manual review recommended',
          },
        ],
        confidence: 0,
        recommendation: 'Content validation failed - proceed with caution',
      };
    }
  }

  /**
   * Generate secure hash for content integrity
   *
   * @param content - Content to hash
   * @returns Secure hash string
   */
  async generateSecureHash(content: any): Promise<string> {
    try {
      const contentString = typeof content === 'string' ? content : JSON.stringify(content);
      const encoder = new TextEncoder();
      const data = encoder.encode(contentString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Hash generation failed:', error);
      throw new Error('Failed to generate content hash');
    }
  }

  /**
   * Verify content integrity
   *
   * @param content - Content to verify
   * @param expectedHash - Expected hash value
   * @returns True if content matches hash
   */
  async verifyContentIntegrity(content: any, expectedHash: string): Promise<boolean> {
    try {
      const actualHash = await this.generateSecureHash(content);
      return actualHash === expectedHash;
    } catch (error) {
      console.error('Content integrity verification failed:', error);
      return false;
    }
  }

  // ==================== PRIVATE VALIDATION METHODS ====================

  private validateType(input: any, expectedType?: string): { valid: boolean; error?: string } {
    if (!expectedType) return { valid: true };

    const actualType = typeof input;

    // Handle special cases
    if (expectedType === 'array' && Array.isArray(input)) {
      return { valid: true };
    }

    if (expectedType === 'file' && input instanceof File) {
      return { valid: true };
    }

    if (actualType !== expectedType) {
      return {
        valid: false,
        error: `Expected ${expectedType} but got ${actualType}`,
      };
    }

    return { valid: true };
  }

  private async scanForSecurityThreats(
    input: any,
    context: ValidationContext
  ): Promise<{ safe: boolean; threats: SecurityThreat[] }> {
    const threats: SecurityThreat[] = [];

    if (typeof input === 'string') {
      // Check for SQL injection patterns
      const sqlThreats = this.detectSqlInjection(input);
      threats.push(...sqlThreats);

      // Check for XSS patterns
      const xssThreats = this.detectXssPatterns(input);
      threats.push(...xssThreats);

      // Check for command injection
      const cmdThreats = this.detectCommandInjection(input);
      threats.push(...cmdThreats);
    }

    return {
      safe: threats.length === 0,
      threats,
    };
  }

  private async validateLegalCompliance(
    input: any,
    context: ValidationContext
  ): Promise<{ compliant: boolean; violations: string[] }> {
    const violations: string[] = [];

    // Only technical legal compliance - NO content censorship

    // Check for copyright violations (technical patterns only)
    if (typeof input === 'string' && input.length > 1000) {
      const copyrightMarkers = this.detectCopyrightMarkers(input);
      if (copyrightMarkers.length > 0) {
        violations.push('Potential copyright material detected - verify fair use');
      }
    }

    // File type restrictions (technical only)
    if (context.fileType && !this.isAllowedFileType(context.fileType)) {
      violations.push(`File type ${context.fileType} not supported for security reasons`);
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }

  private sanitizeContent(input: any, context: ValidationContext): any {
    if (typeof input === 'string') {
      // Remove potentially dangerous patterns
      let sanitized = input;

      // Remove script tags
      sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');

      // Remove event handlers
      sanitized = sanitized.replace(/on\w+\s*=\s*[^>]+/gi, '');

      // Escape HTML entities
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      return sanitized;
    }

    return input;
  }

  private detectSqlInjection(input: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
      /(\b(UNION|JOIN|WHERE|ORDER BY|GROUP BY)\b)/i,
      /(--|\/\*|\*\/)/,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        threats.push({
          type: 'SQL_INJECTION',
          severity: 'HIGH',
          description: 'Potential SQL injection pattern detected',
          recommendation: 'Use parameterized queries',
        });
        break;
      }
    }

    return threats;
  }

  private detectXssPatterns(input: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const xssPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        threats.push({
          type: 'XSS',
          severity: 'HIGH',
          description: 'Potential cross-site scripting pattern detected',
          recommendation: 'Sanitize user input',
        });
        break;
      }
    }

    return threats;
  }

  private detectCommandInjection(input: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const cmdPatterns = [
      /[;&|`$()]/,
      /\b(rm|del|format|shutdown|reboot)\b/i,
      /\.\.\//,
      /\/etc\/passwd/i,
      /cmd\.exe/i,
    ];

    for (const pattern of cmdPatterns) {
      if (pattern.test(input)) {
        threats.push({
          type: 'COMMAND_INJECTION',
          severity: 'CRITICAL',
          description: 'Potential command injection pattern detected',
          recommendation: 'Block and review input',
        });
        break;
      }
    }

    return threats;
  }

  private detectExecutableCode(content: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const codePatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /new\s+Function/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
    ];

    for (const pattern of codePatterns) {
      if (pattern.test(content)) {
        threats.push({
          type: 'EXECUTABLE_CODE',
          severity: 'HIGH',
          description: 'Executable code detected in content',
          recommendation: 'Review code for malicious intent',
        });
      }
    }

    return threats;
  }

  private detectSuspiciousUrls(content: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const matches = content.match(urlPattern);

    if (matches) {
      for (const url of matches) {
        if (this.isSuspiciousUrl(url)) {
          threats.push({
            type: 'SUSPICIOUS_URL',
            severity: 'MEDIUM',
            description: `Potentially suspicious URL detected: ${url}`,
            recommendation: 'Verify URL before accessing',
          });
        }
      }
    }

    return threats;
  }

  private detectDataExfiltration(content: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const patterns = [/fetch\s*\(/i, /XMLHttpRequest/i, /\.send\s*\(/i, /base64/i];

    let patternCount = 0;
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        patternCount++;
      }
    }

    if (patternCount >= 2) {
      threats.push({
        type: 'DATA_EXFILTRATION',
        severity: 'HIGH',
        description: 'Multiple patterns suggesting data exfiltration attempt',
        recommendation: 'Block and investigate',
      });
    }

    return threats;
  }

  private async getFileInfo(filePath: string): Promise<any> {
    // TODO: Implement with Tauri file system API
    return {
      size: 0,
      type: 'unknown',
      lastModified: new Date(),
    };
  }

  private async validateFileSignature(filePath: string, expectedType: string): Promise<boolean> {
    // TODO: Implement with actual file signature validation
    return true;
  }

  private async scanMalwarePatterns(filePath: string): Promise<SecurityThreat[]> {
    // TODO: Implement with actual malware scanning
    return [];
  }

  private async detectSuspiciousContent(
    filePath: string,
    fileType: string
  ): Promise<SecurityThreat[]> {
    // TODO: Implement with file content analysis
    return [];
  }

  private detectCopyrightMarkers(content: string): string[] {
    const markers: string[] = [];
    const copyrightPatterns = [/©\s*\d{4}/, /copyright\s+\d{4}/i, /all rights reserved/i];

    for (const pattern of copyrightPatterns) {
      if (pattern.test(content)) {
        markers.push(pattern.source);
      }
    }

    return markers;
  }

  private isAllowedFileType(fileType: string): boolean {
    const allowedTypes = ['application/pdf', 'application/epub+zip', 'text/plain', 'text/markdown'];

    return allowedTypes.includes(fileType);
  }

  private isSuspiciousUrl(url: string): boolean {
    const suspiciousPatterns = [
      /bit\.ly/i,
      /tinyurl/i,
      /t\.co/i,
      /\d+\.\d+\.\d+\.\d+/, // IP addresses
      /[a-z]{20,}\.com/i, // Very long domains
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  private calculateSecurityLevel(
    securityScan: any,
    legalCompliance: any
  ): 'SAFE' | 'WARNING' | 'BLOCKED' {
    if (!securityScan.safe) return 'BLOCKED';
    if (!legalCompliance.compliant) return 'WARNING';
    return 'SAFE';
  }

  private calculateConfidence(threats: SecurityThreat[]): number {
    if (threats.length === 0) return 1.0;

    const criticalThreats = threats.filter(t => t.severity === 'CRITICAL').length;
    const highThreats = threats.filter(t => t.severity === 'HIGH').length;
    const mediumThreats = threats.filter(t => t.severity === 'MEDIUM').length;

    const score = criticalThreats * 0.9 + highThreats * 0.7 + mediumThreats * 0.4;
    return Math.max(0, 1.0 - score);
  }

  private generateRecommendation(threats: SecurityThreat[]): string {
    if (threats.length === 0) {
      return 'Content appears safe - no security threats detected';
    }

    const hasCritical = threats.some(t => t.severity === 'CRITICAL');
    const hasHigh = threats.some(t => t.severity === 'HIGH');

    if (hasCritical) {
      return 'CRITICAL threats detected - block content immediately';
    }

    if (hasHigh) {
      return 'HIGH risk threats detected - review before proceeding';
    }

    return 'MEDIUM risk detected - proceed with caution';
  }

  private generateValidationId(): string {
    return `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const securityValidator = new SecurityValidator();
