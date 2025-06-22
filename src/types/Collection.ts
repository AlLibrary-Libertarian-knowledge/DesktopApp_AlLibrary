/**
 * Collection Types with Cultural Integration and P2P Sharing
 *
 * Collection models that support cultural organization, community sharing,
 * and decentralized collection management with respect for traditional knowledge.
 */

import { CulturalMetadata, CulturalSensitivityLevel } from './Cultural';
import { Document } from './Document';

/**
 * Collection types for different organizational purposes
 */
export enum CollectionType {
  PERSONAL = 'personal',
  COMMUNITY = 'community',
  CULTURAL = 'cultural',
  THEMATIC = 'thematic',
  EDUCATIONAL = 'educational',
  RESEARCH = 'research',
  SACRED = 'sacred',
  COLLABORATIVE = 'collaborative',
}

/**
 * Collection visibility levels
 */
export enum CollectionVisibility {
  PRIVATE = 'private',
  COMMUNITY = 'community',
  PUBLIC = 'public',
  CULTURAL_RESTRICTED = 'cultural_restricted',
  EDUCATIONAL_ONLY = 'educational_only',
}

/**
 * Collection sharing permissions
 */
export enum CollectionSharingPermission {
  VIEW_ONLY = 'view_only',
  COMMENT = 'comment',
  CONTRIBUTE = 'contribute',
  MODERATE = 'moderate',
  ADMIN = 'admin',
}

/**
 * Enhanced Collection interface with P2P and cultural features
 */
export interface Collection {
  /** Unique collection identifier */
  id: string;

  /** Collection name */
  name: string;

  /** Collection description */
  description?: string;

  /** Collection type */
  type: CollectionType;

  /** Collection visibility */
  visibility: CollectionVisibility;

  /** Documents in collection */
  documentIds: string[];

  /** Cached document references for performance */
  documents?: Document[];

  /** Cultural metadata for collection */
  culturalMetadata: CulturalMetadata;

  /** Collection owner */
  ownerId: string;

  /** Collection collaborators with permissions */
  collaborators: CollectionCollaborator[];

  /** Creation timestamp */
  createdAt: Date;

  /** Last modified timestamp */
  updatedAt: Date;

  /** Collection tags for organization */
  tags: string[];

  /** Categories for classification */
  categories: string[];

  /** Collection statistics */
  statistics: CollectionStatistics;

  /** P2P sharing configuration */
  p2pSharing: P2PSharingConfig;

  /** Cultural validation status */
  culturalValidation: CulturalValidationStatus;

  /** Collection organization settings */
  organization: CollectionOrganization;

  /** Access history for transparency */
  accessHistory: CollectionAccess[];

  /** Collection relationships */
  relationships: CollectionRelationship[];

  /** Synchronization status */
  syncStatus: SyncStatus;
}

/**
 * Collection collaborator with permissions
 */
export interface CollectionCollaborator {
  /** User ID */
  userId: string;

  /** User display name */
  displayName: string;

  /** Permission level */
  permission: CollectionSharingPermission;

  /** Date added to collection */
  addedAt: Date;

  /** Added by user ID */
  addedBy: string;

  /** Cultural role if applicable */
  culturalRole?: string;

  /** Community affiliation */
  communityAffiliation?: string;

  /** Active status */
  active: boolean;
}

/**
 * Collection statistics
 */
export interface CollectionStatistics {
  /** Total number of documents */
  documentCount: number;

  /** Total size in bytes */
  totalSize: number;

  /** Number of unique contributors */
  contributorCount: number;

  /** Number of views */
  viewCount: number;

  /** Number of shares */
  shareCount: number;

  /** Cultural diversity metrics */
  culturalDiversity: {
    origins: string[];
    sensitivityLevels: CulturalSensitivityLevel[];
    communityCount: number;
  };

  /** Last activity timestamp */
  lastActivity: Date;

  /** Growth metrics */
  growth: {
    documentsAddedThisWeek: number;
    documentsAddedThisMonth: number;
    newCollaboratorsThisMonth: number;
  };
}

/**
 * P2P sharing configuration
 */
export interface P2PSharingConfig {
  /** Enable P2P sharing */
  enabled: boolean;

  /** IPFS content hash */
  ipfsHash?: string;

  /** Peer discovery enabled */
  peerDiscovery: boolean;

  /** Allowed peer networks */
  allowedNetworks: string[];

  /** Sharing restrictions */
  restrictions: {
    requireCulturalApproval: boolean;
    communityMembersOnly: boolean;
    educationalUseOnly: boolean;
    noCommercialUse: boolean;
  };

  /** Encryption settings */
  encryption: {
    enabled: boolean;
    algorithm?: string;
    keyRotationInterval?: number;
  };

  /** Sync preferences */
  syncPreferences: {
    autoSync: boolean;
    syncFrequency: number; // minutes
    conflictResolution: 'manual' | 'latest_wins' | 'community_vote';
  };
}

/**
 * Cultural validation status
 */
export interface CulturalValidationStatus {
  /** Validation required */
  required: boolean;

  /** Validation status */
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';

  /** Validating authority */
  validatingAuthority?: string;

  /** Validation date */
  validatedAt?: Date;

  /** Validation notes */
  notes?: string;

  /** Community feedback */
  communityFeedback: CommunityFeedback[];

  /** Educational requirements */
  educationalRequirements: string[];

  /** Cultural protocols to follow */
  culturalProtocols: string[];
}

/**
 * Community feedback on collections
 */
export interface CommunityFeedback {
  /** Feedback ID */
  id: string;

  /** User providing feedback */
  userId: string;

  /** User display name */
  displayName: string;

  /** Feedback type */
  type: 'approval' | 'concern' | 'suggestion' | 'cultural_guidance';

  /** Feedback content */
  content: string;

  /** Cultural authority level */
  culturalAuthority?: 'elder' | 'guardian' | 'community_member' | 'cultural_expert';

  /** Feedback timestamp */
  createdAt: Date;

  /** Feedback status */
  status: 'active' | 'addressed' | 'resolved';

  /** Response to feedback */
  response?: string;
}

/**
 * Collection organization settings
 */
export interface CollectionOrganization {
  /** Default sort order */
  defaultSort: {
    field: 'title' | 'date' | 'cultural_origin' | 'sensitivity' | 'size' | 'relevance';
    order: 'asc' | 'desc';
  };

  /** Grouping preferences */
  grouping: {
    enabled: boolean;
    groupBy: 'cultural_origin' | 'sensitivity' | 'type' | 'date' | 'author' | 'tags';
  };

  /** Filtering preferences */
  filtering: {
    defaultFilters: string[];
    hiddenSensitivityLevels: CulturalSensitivityLevel[];
    showEducationalOnly: boolean;
  };

  /** Display preferences */
  display: {
    viewMode: 'grid' | 'list' | 'timeline' | 'cultural_map';
    thumbnailSize: 'small' | 'medium' | 'large';
    showCulturalContext: boolean;
    showStatistics: boolean;
  };

  /** Auto-organization rules */
  autoOrganization: {
    enabled: boolean;
    rules: OrganizationRule[];
  };
}

/**
 * Auto-organization rule
 */
export interface OrganizationRule {
  /** Rule ID */
  id: string;

  /** Rule name */
  name: string;

  /** Rule condition */
  condition: {
    field: string;
    operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than';
    value: any;
  };

  /** Rule action */
  action: {
    type: 'add_tag' | 'set_category' | 'move_to_collection' | 'set_cultural_context';
    value: string;
  };

  /** Rule enabled */
  enabled: boolean;

  /** Rule priority */
  priority: number;
}

/**
 * Collection access record
 */
export interface CollectionAccess {
  /** Access ID */
  id: string;

  /** User who accessed */
  userId: string;

  /** Access timestamp */
  accessedAt: Date;

  /** Access type */
  accessType: 'view' | 'edit' | 'share' | 'download' | 'collaborate';

  /** Cultural information provided */
  culturalInformationProvided: boolean;

  /** Educational context shown */
  educationalContextShown: boolean;

  /** Documents accessed */
  documentsAccessed: string[];

  /** Access duration */
  duration?: number; // seconds

  /** Information only - no access control */
  readonly informationOnly: true;
}

/**
 * Collection relationship
 */
export interface CollectionRelationship {
  /** Related collection ID */
  relatedCollectionId: string;

  /** Relationship type */
  relationshipType:
    | 'parent'
    | 'child'
    | 'sibling'
    | 'cultural_variant'
    | 'translation'
    | 'community_response'
    | 'educational_supplement'
    | 'research_extension';

  /** Relationship description */
  description?: string;

  /** Cultural context of relationship */
  culturalContext?: string;

  /** Relationship strength */
  strength: number; // 0-1

  /** Bidirectional relationship */
  bidirectional: boolean;
}

/**
 * Synchronization status
 */
export interface SyncStatus {
  /** Last sync timestamp */
  lastSync?: Date;

  /** Sync in progress */
  syncing: boolean;

  /** Sync conflicts */
  conflicts: SyncConflict[];

  /** Peer sync status */
  peerStatus: PeerSyncStatus[];

  /** Sync errors */
  errors: string[];

  /** Next scheduled sync */
  nextSync?: Date;
}

/**
 * Sync conflict
 */
export interface SyncConflict {
  /** Conflict ID */
  id: string;

  /** Conflict type */
  type: 'document_modified' | 'collection_modified' | 'cultural_validation_changed';

  /** Conflicting versions */
  versions: {
    local: any;
    remote: any;
    timestamp: Date;
  }[];

  /** Resolution status */
  resolved: boolean;

  /** Resolution method */
  resolution?: 'manual' | 'latest_wins' | 'community_vote' | 'cultural_authority';

  /** Resolution timestamp */
  resolvedAt?: Date;
}

/**
 * Peer sync status
 */
export interface PeerSyncStatus {
  /** Peer ID */
  peerId: string;

  /** Peer name */
  peerName: string;

  /** Last sync with this peer */
  lastSync?: Date;

  /** Sync status */
  status: 'connected' | 'disconnected' | 'syncing' | 'error';

  /** Cultural compatibility */
  culturalCompatibility: number; // 0-1

  /** Trust level */
  trustLevel: number; // 0-1
}

/**
 * Collection creation request
 */
export interface CreateCollectionRequest {
  /** Collection name */
  name: string;

  /** Collection description */
  description?: string;

  /** Collection type */
  type: CollectionType;

  /** Collection visibility */
  visibility: CollectionVisibility;

  /** Initial document IDs */
  documentIds?: string[];

  /** Cultural metadata */
  culturalMetadata: Partial<CulturalMetadata>;

  /** Initial tags */
  tags?: string[];

  /** Initial categories */
  categories?: string[];

  /** P2P sharing configuration */
  p2pSharing?: Partial<P2PSharingConfig>;

  /** Organization settings */
  organization?: Partial<CollectionOrganization>;

  /** Initial collaborators */
  collaborators?: Omit<CollectionCollaborator, 'addedAt' | 'addedBy'>[];
}

/**
 * Collection update request
 */
export interface UpdateCollectionRequest {
  /** Updated name */
  name?: string;

  /** Updated description */
  description?: string;

  /** Updated visibility */
  visibility?: CollectionVisibility;

  /** Updated tags */
  tags?: string[];

  /** Updated categories */
  categories?: string[];

  /** Updated cultural metadata */
  culturalMetadata?: Partial<CulturalMetadata>;

  /** Updated P2P sharing */
  p2pSharing?: Partial<P2PSharingConfig>;

  /** Updated organization */
  organization?: Partial<CollectionOrganization>;
}

/**
 * Collection search filters
 */
export interface CollectionSearchFilters {
  /** Text query */
  query?: string;

  /** Collection type filter */
  type?: CollectionType[];

  /** Visibility filter */
  visibility?: CollectionVisibility[];

  /** Cultural origin filter */
  culturalOrigin?: string[];

  /** Cultural sensitivity filter */
  culturalSensitivity?: CulturalSensitivityLevel[];

  /** Owner filter */
  ownerId?: string;

  /** Collaborator filter */
  collaboratorId?: string;

  /** Tags filter */
  tags?: string[];

  /** Categories filter */
  categories?: string[];

  /** Date range */
  dateRange?: {
    start: Date;
    end: Date;
  };

  /** Document count range */
  documentCountRange?: {
    min: number;
    max: number;
  };

  /** Size range */
  sizeRange?: {
    min: number;
    max: number;
  };

  /** Cultural validation status */
  culturalValidationStatus?: ('pending' | 'approved' | 'rejected' | 'needs_review')[];

  /** P2P enabled filter */
  p2pEnabled?: boolean;
}

/**
 * Collection search options
 */
export interface CollectionSearchOptions {
  /** Sort field */
  sortBy?: 'name' | 'created' | 'updated' | 'document_count' | 'size' | 'relevance';

  /** Sort order */
  sortOrder?: 'asc' | 'desc';

  /** Maximum results */
  maxResults?: number;

  /** Include document details */
  includeDocuments?: boolean;

  /** Include statistics */
  includeStatistics?: boolean;

  /** Include collaborator details */
  includeCollaborators?: boolean;

  /** Respect cultural boundaries */
  respectCulturalBoundaries?: boolean;

  /** Show educational context */
  showEducationalContext?: boolean;
}

/**
 * Collection analytics data
 */
export interface CollectionAnalytics {
  /** Collection ID */
  collectionId: string;

  /** Analytics period */
  period: {
    start: Date;
    end: Date;
  };

  /** Usage metrics */
  usage: {
    views: number;
    uniqueViewers: number;
    downloads: number;
    shares: number;
    collaborations: number;
  };

  /** Growth metrics */
  growth: {
    documentsAdded: number;
    collaboratorsAdded: number;
    tagsAdded: number;
    sizeIncrease: number;
  };

  /** Cultural metrics */
  cultural: {
    culturalDiversityScore: number;
    communityEngagement: number;
    educationalImpact: number;
    culturalValidationScore: number;
  };

  /** P2P metrics */
  p2p: {
    peersConnected: number;
    syncEvents: number;
    dataShared: number;
    conflictsResolved: number;
  };

  /** Top contributors */
  topContributors: {
    userId: string;
    displayName: string;
    contributionScore: number;
    culturalRole?: string;
  }[];

  /** Popular documents */
  popularDocuments: {
    documentId: string;
    title: string;
    views: number;
    culturalSignificance: number;
  }[];
}

/**
 * Collection service interface for managing collections
 */
export interface CollectionService {
  // Collection CRUD operations
  createCollection(request: CreateCollectionRequest): Promise<Collection>;
  getCollection(id: string): Promise<Collection | null>;
  updateCollection(id: string, request: UpdateCollectionRequest): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;

  // Collection listing and search
  listCollections(userId: string, filters?: CollectionSearchFilters): Promise<Collection[]>;
  searchCollections(query: string, filters?: CollectionSearchFilters): Promise<Collection[]>;

  // Document management
  addDocumentToCollection(collectionId: string, documentId: string): Promise<void>;
  removeDocumentFromCollection(collectionId: string, documentId: string): Promise<void>;

  // Collaboration management
  addCollaborator(
    collectionId: string,
    collaborator: Omit<CollectionCollaborator, 'addedAt' | 'addedBy'>
  ): Promise<void>;
  removeCollaborator(collectionId: string, userId: string): Promise<void>;
  updateCollaboratorPermission(
    collectionId: string,
    userId: string,
    permission: CollectionSharingPermission
  ): Promise<void>;

  // Cultural validation
  requestCulturalValidation(collectionId: string, reason: string): Promise<void>;
  submitCommunityFeedback(
    collectionId: string,
    feedback: Omit<CommunityFeedback, 'id' | 'createdAt'>
  ): Promise<void>;

  // P2P operations
  shareCollectionP2P(collectionId: string): Promise<string>; // Returns IPFS hash
  syncWithPeers(collectionId: string): Promise<void>;

  // Analytics
  getCollectionAnalytics(
    collectionId: string,
    period: { start: Date; end: Date }
  ): Promise<CollectionAnalytics>;
}
