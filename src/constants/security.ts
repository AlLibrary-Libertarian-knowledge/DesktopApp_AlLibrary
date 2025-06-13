// Security Constants (TECHNICAL SECURITY ONLY)
export const SECURITY_LEVELS = {
  SAFE: 'safe',
  WARNING: 'warning',
  BLOCKED: 'blocked',
};

export const VALIDATION_TYPES = {
  MALWARE: 'malware',
  LEGAL_COMPLIANCE: 'legal_compliance',
  TYPE_VALIDATION: 'type_validation',
  INPUT_SANITIZATION: 'input_sanitization',
};

export const FILE_TYPES = {
  ALLOWED: ['.pdf', '.epub', '.txt', '.md'],
  DOCUMENT_EXTENSIONS: ['.pdf', '.epub'],
  TEXT_EXTENSIONS: ['.txt', '.md'],
};

export const SECURITY_MESSAGES = {
  MALWARE_DETECTED: 'File blocked: Malware detected',
  LEGAL_VIOLATION: 'File blocked: Legal compliance violation',
  INVALID_TYPE: 'File blocked: Invalid file type',
  SAFE_FILE: 'File validated: Safe to access',
  NO_CULTURAL_FILTERING: 'Technical security only - no cultural content filtering',
};
