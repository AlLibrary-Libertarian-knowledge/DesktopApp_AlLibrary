/**
 * Unified Type Exports for AlLibrary
 *
 * Centralizes all type definitions following the SOLID architecture
 * and cultural/security framework requirements.
 */

// Cultural Framework Types
export type {
  CulturalMetadata,
  CulturalEducationModule,
  CulturalInformation,
  CulturalAnalysis,
  SacredSymbol,
  CommunityInformation,
  CulturalValidationContext,
  CulturalEducationProgress,
} from './Cultural';

export { CulturalSensitivityLevel } from './Cultural';

// Document Types
export type {
  Document,
  DocumentAuthor,
  PublicationInfo,
  DocumentAccess,
  DocumentRelationship,
  SecurityValidationResult,
  ContentVerification,
  CustodyRecord,
  SourceAttribution,
  DocumentInput,
  DocumentUpdate,
  DocumentSearchFilters,
  DocumentCollection,
} from './Document';

export { DocumentFormat, DocumentContentType, DocumentStatus } from './Document';

// Security Validation Types
export type {
  SecurityValidationContext,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SecurityScanResult,
  SecurityThreat,
  IntegrityCheckResult,
  IntegrityViolation,
  ValidationMetadata,
  SanitizationOptions,
  SanitizationRule,
  FileUploadValidation,
  FileValidationRule,
  AntiCensorshipProtection,
  IntegrityMechanism,
  LegalComplianceValidation,
  ComplianceCheck,
  ComplianceIssue,
  NetworkSecurityValidation,
  NetworkSecurityMetadata,
} from './Security';

// System Information Types
export type { DiskSpaceInfo, SystemStatus, CacheStats } from './System';

export { SystemAPI, SystemUtils } from './System';

// Network and P2P Types (to be implemented in Phase 3)
export interface NetworkNode {
  /** Node identifier */
  nodeId: string;

  /** Node address */
  address: string;

  /** Node status */
  status: 'online' | 'offline' | 'connecting';

  /** Cultural context support */
  culturalContextSupport: boolean;

  /** Security level */
  securityLevel: 'basic' | 'standard' | 'high';
}

export interface P2PContent {
  /** Content hash */
  contentHash: string;

  /** Content type */
  contentType: string;

  /** Cultural metadata */
  culturalMetadata: CulturalMetadata;

  /** Content verification */
  verification: ContentVerification;

  /** Distribution metadata */
  distributionMetadata: {
    uploadedAt: Date;
    uploadedBy: string;
    replicas: number;
    availability: number;
  };
}

// User and Authentication Types
export interface User {
  /** User identifier */
  id: string;

  /** Username */
  username: string;

  /** Display name */
  displayName: string;

  /** Email address */
  email?: string;

  /** Cultural preferences */
  culturalPreferences: CulturalPreferences;

  /** Educational progress */
  educationalProgress: Record<string, CulturalEducationProgress>;

  /** User settings */
  settings: UserSettings;

  /** Account creation date */
  createdAt: Date;

  /** Last activity */
  lastActivity: Date;
}

export interface CulturalPreferences {
  /** Preferred cultural contexts */
  preferredContexts: string[];

  /** Cultural learning goals */
  learningGoals: string[];

  /** Cultural communities user belongs to */
  communities: string[];

  /** Preferred cultural education pace */
  educationPace: 'slow' | 'moderate' | 'fast';

  /** Cultural information display preferences */
  displayPreferences: {
    showCulturalIndicators: boolean;
    showEducationalContext: boolean;
    showCommunityInformation: boolean;
    showTraditionalProtocols: boolean;
  };
}

export interface UserSettings {
  /** Theme preference */
  theme: 'light' | 'dark' | 'auto' | 'cultural';

  /** Language preference */
  language: string;

  /** Accessibility settings */
  accessibility: AccessibilitySettings;

  /** Privacy settings */
  privacy: PrivacySettings;

  /** Notification preferences */
  notifications: NotificationSettings;
}

export interface AccessibilitySettings {
  /** High contrast mode */
  highContrast: boolean;

  /** Large text mode */
  largeText: boolean;

  /** Screen reader support */
  screenReaderSupport: boolean;

  /** Keyboard navigation only */
  keyboardNavigationOnly: boolean;

  /** Motion reduction */
  reduceMotion: boolean;

  /** Color blind support */
  colorBlindSupport: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
}

export interface PrivacySettings {
  /** Share activity with community */
  shareActivity: boolean;

  /** Allow educational progress sharing */
  shareEducationalProgress: boolean;

  /** Anonymous usage statistics */
  anonymousStatistics: boolean;

  /** Cultural context sharing */
  shareCulturalContext: boolean;
}

export interface NotificationSettings {
  /** Cultural education reminders */
  culturalEducationReminders: boolean;

  /** Community notifications */
  communityNotifications: boolean;

  /** Document update notifications */
  documentUpdates: boolean;

  /** Security alerts */
  securityAlerts: boolean;

  /** System notifications */
  systemNotifications: boolean;
}

// Search and Discovery Types
export interface SearchQuery {
  /** Search text */
  query: string;

  /** Search filters */
  filters: DocumentSearchFilters;

  /** Cultural context for search */
  culturalContext?: string;

  /** Search type */
  searchType: 'local' | 'network' | 'hybrid';

  /** Search timestamp */
  timestamp: Date;

  /** User context */
  userId: string;
}

export interface SearchResult {
  /** Search result ID */
  id: string;

  /** Document information */
  document: Document;

  /** Relevance score */
  relevanceScore: number;

  /** Cultural relevance score */
  culturalRelevanceScore?: number;

  /** Search highlights */
  highlights: SearchHighlight[];

  /** Cultural information */
  culturalInformation: CulturalInformation;

  /** Result metadata */
  metadata: {
    source: 'local' | 'network';
    retrievedAt: Date;
    cached: boolean;
  };
}

export interface SearchHighlight {
  /** Field name */
  field: string;

  /** Highlighted text */
  text: string;

  /** Highlight positions */
  positions: { start: number; end: number }[];
}

// Error and Response Types
export interface APIResponse<T = any> {
  /** Response success status */
  success: boolean;

  /** Response data */
  data?: T;

  /** Error information */
  error?: APIError;

  /** Response metadata */
  metadata: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

export interface APIError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Error details */
  details?: string;

  /** Error category */
  category: 'validation' | 'security' | 'cultural' | 'network' | 'system';

  /** Field-specific errors */
  fieldErrors?: Record<string, string[]>;
}

// Configuration Types
export interface AppConfiguration {
  /** Application version */
  version: string;

  /** Environment */
  environment: 'development' | 'production' | 'testing';

  /** Cultural framework configuration */
  culturalFramework: CulturalFrameworkConfig;

  /** Security configuration */
  security: SecurityConfig;

  /** Network configuration */
  network: NetworkConfig;

  /** Storage configuration */
  storage: StorageConfig;
}

export interface CulturalFrameworkConfig {
  /** Cultural validation enabled */
  validationEnabled: boolean;

  /** Educational context enabled */
  educationalContextEnabled: boolean;

  /** Community features enabled */
  communityFeaturesEnabled: boolean;

  /** Default sensitivity level */
  defaultSensitivityLevel: CulturalSensitivityLevel;

  /** Supported cultural contexts */
  supportedContexts: string[];
}

export interface SecurityConfig {
  /** Input validation level */
  inputValidationLevel: 'basic' | 'standard' | 'strict';

  /** Malware scanning enabled */
  malwareScanningEnabled: boolean;

  /** Content integrity checking */
  contentIntegrityEnabled: boolean;

  /** Legal compliance checking */
  legalComplianceEnabled: boolean;

  /** Supported file types */
  supportedFileTypes: string[];

  /** Maximum file size */
  maxFileSize: number;
}

export interface NetworkConfig {
  /** P2P enabled */
  p2pEnabled: boolean;

  /** TOR integration enabled */
  torIntegrationEnabled: boolean;

  /** Network discovery enabled */
  networkDiscoveryEnabled: boolean;

  /** Content sharing enabled */
  contentSharingEnabled: boolean;

  /** Network security level */
  securityLevel: 'basic' | 'standard' | 'high' | 'maximum';
}

export interface StorageConfig {
  /** Database type */
  databaseType: 'sqlite';

  /** Storage encryption enabled */
  encryptionEnabled: boolean;

  /** Backup enabled */
  backupEnabled: boolean;

  /** Storage location */
  storageLocation: string;

  /** Maximum storage size */
  maxStorageSize?: number;
}
