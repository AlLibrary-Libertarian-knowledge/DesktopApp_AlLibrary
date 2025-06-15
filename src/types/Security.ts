/**
 * Security Validation Types
 *
 * Comprehensive security framework for input validation, content protection,
 * and anti-censorship infrastructure without cultural content filtering.
 */

/**
 * Security validation context
 */
export interface SecurityValidationContext {
  /** Input type being validated */
  inputType: 'document' | 'text' | 'metadata' | 'user_input' | 'file_upload';

  /** Source of the input */
  source: 'user' | 'network' | 'file_system' | 'api' | 'import';

  /** Validation timestamp */
  timestamp: Date;

  /** User context */
  userId?: string;

  /** Request context */
  requestId: string;

  /** Validation scope */
  scope: 'technical_only' | 'legal_compliance' | 'content_integrity';
}

/**
 * Validation context (alias for test compatibility)
 */
export interface ValidationContext {
  /** User ID */
  userId: string;

  /** Session ID */
  sessionId: string;

  /** Input type */
  inputType: 'text' | 'file' | 'json' | 'path' | any;

  /** Input source */
  source: 'user_input' | 'file_upload' | 'file_access' | 'api' | string;

  /** Expected type for validation */
  expectedType?: string;

  /** File name (for file uploads) */
  fileName?: string;

  /** File size (for file uploads) */
  fileSize?: number;

  /** Jurisdiction for legal compliance */
  jurisdiction?: string;
}

/**
 * Comprehensive validation result
 */
export interface ValidationResult {
  /** Validation passed */
  valid: boolean;

  /** Sanitized input (if applicable) */
  sanitizedInput?: any;

  /** Validation errors */
  errors: ValidationError[];

  /** Validation warnings */
  warnings: ValidationWarning[];

  /** Security scan results */
  securityScanResults: SecurityScanResult[];

  /** Content integrity check */
  integrityCheck?: IntegrityCheckResult;

  /** Validation metadata */
  validationMetadata: ValidationMetadata;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Error severity */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /** Error category */
  category: 'type_validation' | 'security_threat' | 'legal_compliance' | 'technical_security';

  /** Field or location of error */
  field?: string;

  /** Suggested remediation */
  remediation?: string;

  /** Error metadata */
  metadata?: Record<string, any>;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;

  /** Warning message */
  message: string;

  /** Warning category */
  category: 'performance' | 'compatibility' | 'best_practice' | 'information';

  /** Field or location of warning */
  field?: string;

  /** Recommendation */
  recommendation?: string;
}

/**
 * Security scan result
 */
export interface SecurityScanResult {
  /** Scan type */
  scanType: 'malware' | 'virus' | 'suspicious_patterns' | 'content_integrity' | 'legal_compliance';

  /** Scan engine used */
  scanEngine: string;

  /** Scan result */
  result: 'clean' | 'threat_detected' | 'suspicious' | 'error';

  /** Detected threats */
  threats: SecurityThreat[];

  /** Scan timestamp */
  scanTimestamp: Date;

  /** Scan metadata */
  scanMetadata: {
    version: string;
    duration: number;
    filesScanned: number;
    bytesScanned: number;
  };
}

/**
 * Security threat detection
 */
export interface SecurityThreat {
  /** Threat ID */
  threatId: string;

  /** Threat type */
  threatType:
    | 'malware'
    | 'virus'
    | 'trojan'
    | 'suspicious_code'
    | 'legal_violation'
    | 'technical_exploit';

  /** Threat name */
  threatName: string;

  /** Threat description */
  description: string;

  /** Threat severity */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /** Threat location */
  location?: {
    file?: string;
    offset?: number;
    line?: number;
  };

  /** Mitigation recommendations */
  mitigation: string[];

  /** Threat metadata */
  metadata?: Record<string, any>;
}

/**
 * Content integrity check result
 */
export interface IntegrityCheckResult {
  /** Integrity check passed */
  valid: boolean;

  /** Expected hash */
  expectedHash?: string;

  /** Actual hash */
  actualHash: string;

  /** Hash algorithm */
  algorithm: string;

  /** Integrity check timestamp */
  checkedAt: Date;

  /** Integrity violations */
  violations: IntegrityViolation[];
}

/**
 * Integrity violation
 */
export interface IntegrityViolation {
  /** Violation type */
  type: 'hash_mismatch' | 'content_modified' | 'signature_invalid' | 'chain_broken';

  /** Violation description */
  description: string;

  /** Violation location */
  location?: string;

  /** Violation severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Validation metadata
 */
export interface ValidationMetadata {
  /** Validation engine version */
  validationEngineVersion: string;

  /** Validation rules version */
  rulesVersion: string;

  /** Validation start time */
  startTime: Date;

  /** Validation end time */
  endTime: Date;

  /** Validation duration */
  duration: number;

  /** Validation request ID */
  requestId: string;

  /** Validation context */
  context: SecurityValidationContext;
}

/**
 * Input sanitization options
 */
export interface SanitizationOptions {
  /** Remove HTML tags */
  removeHtml?: boolean;

  /** Remove script tags */
  removeScripts?: boolean;

  /** Encode special characters */
  encodeSpecialChars?: boolean;

  /** Normalize whitespace */
  normalizeWhitespace?: boolean;

  /** Remove dangerous patterns */
  removeDangerousPatterns?: boolean;

  /** Custom sanitization rules */
  customRules?: SanitizationRule[];
}

/**
 * Sanitization rule
 */
export interface SanitizationRule {
  /** Rule name */
  name: string;

  /** Pattern to match */
  pattern: RegExp;

  /** Replacement value */
  replacement: string;

  /** Rule description */
  description: string;
}

/**
 * File upload validation
 */
export interface FileUploadValidation {
  /** Allowed file types */
  allowedTypes: string[];

  /** Maximum file size */
  maxFileSize: number;

  /** Minimum file size */
  minFileSize?: number;

  /** Require file signature validation */
  requireSignatureValidation: boolean;

  /** Malware scanning required */
  requireMalwareScanning: boolean;

  /** Content integrity check required */
  requireIntegrityCheck: boolean;

  /** Custom validation rules */
  customValidationRules?: FileValidationRule[];
}

/**
 * File validation rule
 */
export interface FileValidationRule {
  /** Rule name */
  name: string;

  /** Rule type */
  type: 'content' | 'metadata' | 'structure';

  /** Validation function */
  validator: (file: File) => Promise<ValidationResult>;

  /** Rule description */
  description: string;
}

/**
 * Anti-censorship protection mechanisms
 */
export interface AntiCensorshipProtection {
  /** Content verification enabled */
  contentVerificationEnabled: boolean;

  /** Multiple source validation */
  multipleSourceValidation: boolean;

  /** Provenance tracking */
  provenanceTracking: boolean;

  /** Historical context preservation */
  historicalContextPreservation: boolean;

  /** Alternative perspective support */
  alternativePerspectiveSupport: boolean;

  /** Information integrity mechanisms */
  integrityMechanisms: IntegrityMechanism[];
}

/**
 * Information integrity mechanism
 */
export interface IntegrityMechanism {
  /** Mechanism type */
  type:
    | 'cryptographic_signature'
    | 'blockchain_verification'
    | 'peer_validation'
    | 'source_attribution';

  /** Mechanism name */
  name: string;

  /** Implementation details */
  implementation: string;

  /** Verification method */
  verificationMethod: string;

  /** Mechanism metadata */
  metadata?: Record<string, any>;
}

/**
 * Legal compliance validation (technical/legal only, no cultural filtering)
 */
export interface LegalComplianceValidation {
  /** Jurisdiction */
  jurisdiction: string;

  /** Compliance checks */
  complianceChecks: ComplianceCheck[];

  /** Legal validation result */
  compliant: boolean;

  /** Compliance issues */
  issues: ComplianceIssue[];

  /** Validation timestamp */
  validatedAt: Date;
}

/**
 * Compliance check
 */
export interface ComplianceCheck {
  /** Check type */
  type: 'copyright' | 'pornography' | 'illegal_content' | 'technical_security';

  /** Check name */
  name: string;

  /** Check passed */
  passed: boolean;

  /** Check details */
  details: string;

  /** Legal basis */
  legalBasis?: string;
}

/**
 * Compliance issue
 */
export interface ComplianceIssue {
  /** Issue type */
  type: 'copyright_violation' | 'illegal_content' | 'technical_violation';

  /** Issue description */
  description: string;

  /** Issue severity */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /** Legal reference */
  legalReference?: string;

  /** Remediation steps */
  remediation: string[];
}

/**
 * Network security validation for P2P operations
 */
export interface NetworkSecurityValidation {
  /** Peer verification */
  peerVerification: boolean;

  /** Content encryption */
  contentEncryption: boolean;

  /** Network integrity check */
  networkIntegrityCheck: boolean;

  /** Anti-manipulation protection */
  antiManipulationProtection: boolean;

  /** Anonymous routing support */
  anonymousRoutingSupport: boolean;

  /** Network security metadata */
  securityMetadata: NetworkSecurityMetadata;
}

/**
 * Network security metadata
 */
export interface NetworkSecurityMetadata {
  /** Encryption algorithm */
  encryptionAlgorithm: string;

  /** Key exchange method */
  keyExchangeMethod: string;

  /** Peer authentication method */
  peerAuthenticationMethod: string;

  /** Network protocol version */
  protocolVersion: string;

  /** Security level */
  securityLevel: 'basic' | 'standard' | 'high' | 'maximum';
}

/**
 * Security validation result (alias for compatibility)
 */
export interface SecurityValidationResult {
  /** Validation passed */
  valid: boolean;

  /** Sanitized input */
  sanitizedInput?: any;

  /** Security level */
  securityLevel: 'SAFE' | 'WARNING' | 'BLOCKED';

  /** Validation timestamp */
  validatedAt: Date;

  /** Validation ID */
  validationId: string;

  /** Error message if validation failed */
  error?: string;
}

/**
 * Safety assessment result
 */
export interface SafetyResult {
  /** Content is safe */
  safe: boolean;

  /** Detected threats */
  threats: SecurityThreat[];

  /** Confidence level */
  confidence: number;

  /** Safety recommendation */
  recommendation: string;
}

/**
 * Scan result interface
 */
export interface ScanResult {
  /** Scan passed */
  safe: boolean;

  /** Detected threats */
  threats: SecurityThreat[];

  /** Scan timestamp */
  scanTime: Date;

  /** Scanner version */
  scanVersion: string;

  /** File information */
  fileInfo?: {
    type: string;
    size: number;
  };
}
