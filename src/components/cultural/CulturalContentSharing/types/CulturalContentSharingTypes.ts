/**
 * TypeScript types for CulturalContentSharing component
 * Supports community-aware content distribution with educational focus
 */

export interface CulturalContentSharingProps {
  /** Content to be shared */
  content: ShareableContent;

  /** Available community networks */
  availableNetworks?: CommunityNetwork[];

  /** Callback when content is shared */
  onContentShared?: (sharingResult: SharingResult) => void;

  /** Callback when sharing is cancelled */
  onSharingCancelled?: () => void;

  /** Whether to show educational context */
  showEducationalContext?: boolean;

  /** Whether to show cultural attribution options */
  showCulturalAttribution?: boolean;

  /** Predefined sharing templates */
  sharingTemplates?: SharingTemplate[];

  /** CSS class name for styling */
  class?: string;

  /** Additional accessibility label */
  'aria-label'?: string;
}

export interface ShareableContent {
  /** Content identifier */
  id: string;

  /** Content type */
  type: 'document' | 'collection' | 'educational-resource' | 'cultural-artifact' | 'discussion';

  /** Content title */
  title: string;

  /** Content description */
  description: string;

  /** Content file path or reference */
  contentPath?: string;

  /** Content size in bytes */
  size?: number;

  /** Content format/mime type */
  format?: string;

  /** Cultural metadata */
  culturalMetadata?: CulturalContentMetadata;

  /** Educational context */
  educationalContext?: EducationalContext;

  /** Source attribution */
  sourceAttribution?: SourceAttribution;

  /** Content creation timestamp */
  createdAt: string;

  /** Last modified timestamp */
  lastModified: string;

  /** Content creator/author */
  creator?: ContentCreator;

  /** Access permissions (information only) */
  accessInfo?: AccessInformation;
}

export interface CulturalContentMetadata {
  /** Cultural origin/tradition */
  culturalOrigin: string;

  /** Cultural sensitivity level (educational context only) */
  sensitivityLevel: 1 | 2 | 3;

  /** Cultural significance description */
  culturalSignificance: string;

  /** Traditional knowledge areas */
  knowledgeAreas: string[];

  /** Cultural protocols (educational information) */
  culturalProtocols?: CulturalProtocol[];

  /** Cultural context explanation */
  culturalContext: string;

  /** Associated cultural communities */
  associatedCommunities?: string[];

  /** Cultural language/script */
  culturalLanguage?: string;

  /** Traditional classification */
  traditionalClassification?: string;

  /** Cultural preservation status */
  preservationStatus?: 'well-documented' | 'endangered' | 'critical' | 'lost';
}

export interface EducationalContext {
  /** Educational level */
  level: 'general' | 'intermediate' | 'advanced' | 'scholarly';

  /** Learning objectives */
  learningObjectives: string[];

  /** Educational resources */
  resources: EducationalResource[];

  /** Context explanation */
  contextExplanation: string;

  /** Recommended prerequisites */
  prerequisites?: string[];

  /** Educational impact assessment */
  educationalImpact?: EducationalImpact;

  /** Target audience */
  targetAudience?: string[];
}

export interface EducationalResource {
  /** Resource identifier */
  id: string;

  /** Resource type */
  type: 'reading' | 'video' | 'interactive' | 'discussion' | 'exercise';

  /** Resource title */
  title: string;

  /** Resource description */
  description: string;

  /** Resource URL or path */
  resourcePath: string;

  /** Estimated time to complete */
  estimatedTime?: string;

  /** Difficulty level */
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface EducationalImpact {
  /** Impact assessment score */
  impactScore: number;

  /** Learning outcomes */
  learningOutcomes: string[];

  /** Community benefit description */
  communityBenefit: string;

  /** Cultural understanding enhancement */
  culturalUnderstanding: string;
}

export interface SourceAttribution {
  /** Original source identification */
  originalSource: string;

  /** Source type */
  sourceType: 'community' | 'individual' | 'institution' | 'traditional' | 'academic';

  /** Source verification status */
  verificationStatus: 'verified' | 'pending' | 'unverified' | 'disputed';

  /** Attribution requirements */
  attributionRequirements: string;

  /** Source contact information */
  sourceContact?: string;

  /** Source permissions (information only) */
  sourcePermissions?: string;

  /** Chain of custody */
  chainOfCustody?: CustodyRecord[];

  /** Traditional ownership acknowledgment */
  traditionalOwnership?: string;
}

export interface CustodyRecord {
  /** Custody holder */
  holder: string;

  /** Custody start date */
  custodyStart: string;

  /** Custody end date */
  custodyEnd?: string;

  /** Custody purpose */
  purpose: string;

  /** Verification method */
  verification: string;
}

export interface ContentCreator {
  /** Creator identifier */
  id: string;

  /** Creator name */
  name: string;

  /** Creator type */
  type: 'individual' | 'community' | 'organization' | 'traditional-keeper' | 'academic';

  /** Creator background */
  background?: string;

  /** Cultural affiliation */
  culturalAffiliation?: string;

  /** Creator credentials */
  credentials?: string[];

  /** Contact information */
  contactInfo?: string;
}

export interface AccessInformation {
  /** Access type (information only) */
  accessType: 'open' | 'educational' | 'attributed' | 'community-informed';

  /** Usage guidelines */
  usageGuidelines: string;

  /** Educational usage encouraged */
  educationalUsage: boolean;

  /** Attribution requirements */
  attributionRequired: boolean;

  /** Community notification preferred */
  communityNotificationPreferred: boolean;

  /** Cultural context explanation */
  culturalContextExplanation: string;
}

export interface SharingTemplate {
  /** Template identifier */
  id: string;

  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Target communities */
  targetCommunities: string[];

  /** Sharing message template */
  messageTemplate: string;

  /** Educational context template */
  educationalTemplate?: string;

  /** Attribution template */
  attributionTemplate?: string;

  /** Cultural protocol template */
  culturalProtocolTemplate?: string;
}

export interface SharingConfiguration {
  /** Selected communities for sharing */
  selectedCommunities: string[];

  /** Sharing message */
  sharingMessage: string;

  /** Include educational context */
  includeEducationalContext: boolean;

  /** Include cultural attribution */
  includeCulturalAttribution: boolean;

  /** Include source information */
  includeSourceInformation: boolean;

  /** Sharing template used */
  templateUsed?: string;

  /** Additional sharing options */
  additionalOptions?: SharingOptions;
}

export interface SharingOptions {
  /** Enable community discussion */
  enableCommunityDiscussion: boolean;

  /** Allow community contributions */
  allowCommunityContributions: boolean;

  /** Request community feedback */
  requestCommunityFeedback: boolean;

  /** Include learning opportunities */
  includeLearningOpportunities: boolean;

  /** Provide cultural context */
  provideCulturalContext: boolean;

  /** Support multiple perspectives */
  supportMultiplePerspectives: boolean;
}

export interface SharingResult {
  /** Sharing operation identifier */
  sharingId: string;

  /** Success status */
  success: boolean;

  /** Communities shared with */
  sharedWithCommunities: string[];

  /** Sharing timestamp */
  sharedAt: string;

  /** Content hash for verification */
  contentHash?: string;

  /** Error message if failed */
  errorMessage?: string;

  /** Sharing metrics */
  sharingMetrics?: SharingMetrics;

  /** Community responses */
  communityResponses?: CommunityResponse[];
}

export interface SharingMetrics {
  /** Number of peers reached */
  peersReached: number;

  /** Communities successfully notified */
  communitiesNotified: number;

  /** Educational context delivery success */
  educationalDeliverySuccess: boolean;

  /** Attribution information included */
  attributionIncluded: boolean;

  /** Sharing completion time */
  completionTime: number;

  /** Network distribution efficiency */
  distributionEfficiency: number;
}

export interface CommunityResponse {
  /** Community identifier */
  communityId: string;

  /** Response type */
  responseType:
    | 'acknowledgment'
    | 'appreciation'
    | 'educational-note'
    | 'context-addition'
    | 'discussion';

  /** Response message */
  message: string;

  /** Response timestamp */
  timestamp: string;

  /** Responder information */
  responder?: {
    id: string;
    name?: string;
    role?: string;
  };

  /** Additional context provided */
  additionalContext?: string;
}

export interface CulturalProtocol {
  /** Protocol identifier */
  id: string;

  /** Protocol name */
  name: string;

  /** Protocol description */
  description: string;

  /** Protocol type */
  type: 'sharing' | 'attribution' | 'usage' | 'discussion' | 'preservation';

  /** Educational explanation */
  educationalExplanation: string;

  /** Traditional significance */
  traditionalSignificance?: string;

  /** Modern application guidance */
  modernApplicationGuidance?: string;

  /** Community specific adaptations */
  communityAdaptations?: string[];
}

export interface CommunityNetwork {
  /** Network identifier */
  id: string;

  /** Network name */
  name: string;

  /** Network description */
  description: string;

  /** Cultural focus areas */
  culturalFocus: string[];

  /** Member count */
  memberCount: number;

  /** Network activity level */
  activityLevel: 'high' | 'medium' | 'low';

  /** Educational resources available */
  educationalResources: boolean;

  /** Community guidelines */
  communityGuidelines?: string;
}
