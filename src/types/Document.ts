/**
 * Core Document Types with Cultural Integration
 *
 * Document models that respect cultural heritage and traditional knowledge
 * while providing comprehensive information without access restrictions.
 */

import { CulturalMetadata, CulturalSensitivityLevel } from './Cultural';

/**
 * Document format types supported by AlLibrary
 */
export enum DocumentFormat {
  PDF = 'pdf',
  EPUB = 'epub',
  TEXT = 'text',
  MARKDOWN = 'markdown',
}

/**
 * Document content types for categorization
 */
export enum DocumentContentType {
  ACADEMIC = 'academic',
  LITERATURE = 'literature',
  HISTORICAL = 'historical',
  CULTURAL = 'cultural',
  TRADITIONAL_KNOWLEDGE = 'traditional_knowledge',
  TECHNICAL = 'technical',
  LEGAL = 'legal',
  EDUCATIONAL = 'educational',
  CEREMONIAL = 'ceremonial',
  COMMUNITY = 'community',
}

/**
 * Document status within the system
 */
export enum DocumentStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMMUNITY_REVIEW = 'community_review',
  CULTURAL_VALIDATION = 'cultural_validation',
}

/**
 * Core document interface with cultural integration
 */
export interface Document {
  /** Unique document identifier */
  id: string;

  /** Document title */
  title: string;

  /** Document description or summary */
  description?: string;

  /** Document format */
  format: DocumentFormat;

  /** Content type categorization */
  contentType: DocumentContentType;

  /** Current document status */
  status: DocumentStatus;

  /** File path for document storage */
  filePath: string;

  /** Original filename */
  originalFilename: string;

  /** File size in bytes */
  fileSize: number;

  /** File hash for integrity verification */
  fileHash: string;

  /** MIME type */
  mimeType: string;

  /** Document content (for analysis and search) */
  content?: string;

  /** Document creation timestamp */
  createdAt: Date;

  /** Last modified timestamp */
  updatedAt: Date;

  /** User who created the document */
  createdBy: string;

  /** User who last modified the document */
  updatedBy?: string;

  /** Document version number */
  version: number;

  /** Cultural metadata (mandatory for all documents) */
  culturalMetadata: CulturalMetadata;

  /** Document tags for organization */
  tags: string[];

  /** Categories for organization */
  categories: string[];

  /** Language of the document */
  language: string;

  /** Author information */
  authors: DocumentAuthor[];

  /** Publication information */
  publicationInfo?: PublicationInfo;

  /** Access history for transparency */
  accessHistory: DocumentAccess[];

  /** Document relationships */
  relationships: DocumentRelationship[];

  /** Security validation results */
  securityValidation: SecurityValidationResult;

  /** Content verification */
  contentVerification: ContentVerification;

  /** Source attribution */
  sourceAttribution: SourceAttribution;
}

/**
 * Document author information
 */
export interface DocumentAuthor {
  /** Author name */
  name: string;

  /** Author role or contribution */
  role?: string;

  /** Author affiliation */
  affiliation?: string;

  /** Cultural community if applicable */
  culturalCommunity?: string;

  /** Author contact information */
  contact?: string;

  /** Author bio or background */
  biography?: string;
}

/**
 * Publication information
 */
export interface PublicationInfo {
  /** Publisher name */
  publisher?: string;

  /** Publication date */
  publishedDate?: Date;

  /** ISBN or other identifier */
  identifier?: string;

  /** Edition information */
  edition?: string;

  /** Journal or collection name */
  journal?: string;

  /** Volume and issue */
  volume?: string;
  issue?: string;

  /** Page numbers */
  pages?: string;

  /** DOI or permanent link */
  doi?: string;

  /** Copyright information */
  copyright?: string;

  /** License information */
  license?: string;
}

/**
 * Document access record (for transparency, not restriction)
 */
export interface DocumentAccess {
  /** Access record ID */
  id: string;

  /** User who accessed the document */
  userId: string;

  /** Access timestamp */
  accessedAt: Date;

  /** Type of access */
  accessType: 'view' | 'download' | 'share' | 'edit';

  /** Cultural information provided */
  culturalInformationProvided: boolean;

  /** Educational context shown */
  educationalContextShown: boolean;

  /** User's cultural learning progress */
  culturalLearningProgress?: number;

  /** Information only - no access control */
  readonly informationOnly: true;
}

/**
 * Document relationships
 */
export interface DocumentRelationship {
  /** Related document ID */
  relatedDocumentId: string;

  /** Type of relationship */
  relationshipType:
    | 'sequel'
    | 'prequel'
    | 'translation'
    | 'adaptation'
    | 'reference'
    | 'cultural_variant'
    | 'community_response';

  /** Description of the relationship */
  description?: string;

  /** Cultural context of the relationship */
  culturalContext?: string;
}

/**
 * Security validation result
 */
export interface SecurityValidationResult {
  /** Validation timestamp */
  validatedAt: Date;

  /** Validation passed */
  passed: boolean;

  /** Malware scan result */
  malwareScanResult: {
    clean: boolean;
    threats: string[];
    scanEngine: string;
    scanDate: Date;
  };

  /** Content integrity check */
  integrityCheck: {
    valid: boolean;
    expectedHash: string;
    actualHash: string;
    algorithm: string;
  };

  /** Legal compliance check */
  legalCompliance: {
    compliant: boolean;
    issues: string[];
    jurisdiction: string;
  };

  /** Validation errors or warnings */
  issues: string[];
}

/**
 * Content verification for anti-manipulation
 */
export interface ContentVerification {
  /** Cryptographic signature */
  signature: string;

  /** Signing algorithm */
  algorithm: string;

  /** Verification timestamp */
  verifiedAt: Date;

  /** Chain of custody */
  chainOfCustody: CustodyRecord[];

  /** Content authenticity */
  authentic: boolean;

  /** Verification provider */
  verificationProvider: string;

  /** Public key for verification */
  publicKey?: string;
}

/**
 * Chain of custody record
 */
export interface CustodyRecord {
  /** Custody timestamp */
  timestamp: Date;

  /** Person or system taking custody */
  custodian: string;

  /** Action performed */
  action: string;

  /** Digital signature */
  signature: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Source attribution for transparency
 */
export interface SourceAttribution {
  /** Original source */
  originalSource: string;

  /** Source type */
  sourceType:
    | 'community'
    | 'individual'
    | 'institution'
    | 'traditional'
    | 'academic'
    | 'cultural_organization';

  /** Source credibility indicators */
  credibilityIndicators: string[];

  /** Source verification */
  sourceVerified: boolean;

  /** Cultural provenance */
  culturalProvenance?: string;

  /** Traditional transmission method */
  traditionalTransmission?: string;

  /** Community endorsement */
  communityEndorsement?: string;

  /** Attribution requirements */
  attributionRequirements: string[];
}

/**
 * Document input for creation
 */
export interface DocumentInput {
  /** Document title */
  title: string;

  /** Document description */
  description?: string;

  /** Content type */
  contentType: DocumentContentType;

  /** File to upload */
  file: File;

  /** Cultural sensitivity level */
  culturalSensitivityLevel: CulturalSensitivityLevel;

  /** Cultural origin */
  culturalOrigin?: string;

  /** Community ID if applicable */
  communityId?: string;

  /** Document tags */
  tags: string[];

  /** Categories */
  categories: string[];

  /** Language */
  language: string;

  /** Authors */
  authors: DocumentAuthor[];

  /** Publication info */
  publicationInfo?: PublicationInfo;

  /** Source attribution */
  sourceAttribution: SourceAttribution;

  /** Cultural context */
  culturalContext?: string;

  /** Traditional protocols */
  traditionalProtocols?: string[];
}

/**
 * Document update input
 */
export interface DocumentUpdate {
  /** Updated title */
  title?: string;

  /** Updated description */
  description?: string;

  /** Updated tags */
  tags?: string[];

  /** Updated categories */
  categories?: string[];

  /** Updated cultural metadata */
  culturalMetadata?: Partial<CulturalMetadata>;

  /** Updated authors */
  authors?: DocumentAuthor[];

  /** Updated publication info */
  publicationInfo?: PublicationInfo;

  /** Updated source attribution */
  sourceAttribution?: SourceAttribution;
}

/**
 * Document search filters
 */
export interface DocumentSearchFilters {
  /** Text query */
  query?: string;

  /** Document format filter */
  format?: DocumentFormat[];

  /** Content type filter */
  contentType?: DocumentContentType[];

  /** Status filter */
  status?: DocumentStatus[];

  /** Cultural sensitivity level filter */
  culturalSensitivityLevel?: CulturalSensitivityLevel[];

  /** Cultural origin filter */
  culturalOrigin?: string[];

  /** Community filter */
  communityId?: string[];

  /** Language filter */
  language?: string[];

  /** Tags filter */
  tags?: string[];

  /** Categories filter */
  categories?: string[];

  /** Author filter */
  authors?: string[];

  /** Date range */
  dateRange?: {
    start: Date;
    end: Date;
  };

  /** File size range */
  fileSizeRange?: {
    min: number;
    max: number;
  };

  /** User filter (for access history) */
  userId?: string;
}

/**
 * Document collection for organization
 */
export interface DocumentCollection {
  /** Collection ID */
  id: string;

  /** Collection name */
  name: string;

  /** Collection description */
  description?: string;

  /** Collection type */
  type: 'user_collection' | 'community_collection' | 'cultural_collection' | 'thematic_collection';

  /** Documents in collection */
  documentIds: string[];

  /** Cultural metadata for collection */
  culturalMetadata: CulturalMetadata;

  /** Collection owner */
  ownerId: string;

  /** Collection collaborators */
  collaborators: string[];

  /** Creation timestamp */
  createdAt: Date;

  /** Last modified timestamp */
  updatedAt: Date;

  /** Collection tags */
  tags: string[];

  /** Collection visibility */
  visibility: 'private' | 'community' | 'public';
}
