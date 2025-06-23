/**
 * TypeScript types for TraditionalKnowledgeAttribution component
 * Supports source tracking and provenance display with educational transparency
 */

export interface TraditionalKnowledgeAttributionProps {
  /** Content to display attribution for */
  content: AttributableContent;

  /** Whether to show detailed provenance chain */
  showProvenanceChain?: boolean;

  /** Whether to show educational context */
  showEducationalContext?: boolean;

  /** Whether to show community acknowledgments */
  showCommunityAcknowledgments?: boolean;

  /** Whether to allow additional attribution entries */
  allowAdditionalEntries?: boolean;

  /** Callback when attribution information is updated */
  onAttributionUpdated?: (updatedAttribution: AttributionInformation) => void;

  /** Callback when educational context is accessed */
  onEducationalContextAccessed?: (contextType: string) => void;

  /** CSS class name for styling */
  class?: string;

  /** Additional accessibility label */
  'aria-label'?: string;
}

export interface AttributableContent {
  /** Content identifier */
  id: string;

  /** Content title */
  title: string;

  /** Content description */
  description: string;

  /** Content type */
  type:
    | 'document'
    | 'artifact'
    | 'knowledge'
    | 'practice'
    | 'story'
    | 'ceremony'
    | 'medicine'
    | 'language';

  /** Primary attribution information */
  attribution: AttributionInformation;

  /** Alternative or disputed attributions */
  alternativeAttributions?: AttributionInformation[];

  /** Educational context about the content */
  educationalContext?: EducationalAttribution;

  /** Community acknowledgments */
  communityAcknowledgments?: CommunityAcknowledgment[];

  /** Content creation/documentation date */
  documentedDate: string;

  /** Last verification date */
  lastVerified?: string;

  /** Verification status */
  verificationStatus: VerificationStatus;

  /** Cultural classification */
  culturalClassification?: CulturalClassification;
}

export interface AttributionInformation {
  /** Attribution identifier */
  id: string;

  /** Primary source information */
  primarySource: SourceInformation;

  /** Secondary sources */
  secondarySources?: SourceInformation[];

  /** Attribution type */
  attributionType: AttributionType;

  /** Traditional ownership details */
  traditionalOwnership?: TraditionalOwnership;

  /** Source verification details */
  verification: SourceVerification;

  /** Provenance chain */
  provenanceChain: ProvenanceRecord[];

  /** Attribution confidence level */
  confidenceLevel: ConfidenceLevel;

  /** Attribution notes */
  notes?: string;

  /** Last updated timestamp */
  lastUpdated: string;

  /** Who provided this attribution */
  attributedBy?: AttributionProvider;
}

export interface SourceInformation {
  /** Source identifier */
  id: string;

  /** Source name/title */
  name: string;

  /** Source type */
  sourceType: SourceType;

  /** Source description */
  description: string;

  /** Cultural origin */
  culturalOrigin: string;

  /** Geographic origin */
  geographicOrigin?: string;

  /** Time period */
  timePeriod?: TimePeriod;

  /** Language of source */
  language?: string;

  /** Source credibility assessment */
  credibility: CredibilityAssessment;

  /** Contact information (if available) */
  contactInformation?: ContactInformation;

  /** Source accessibility */
  accessibility: SourceAccessibility;

  /** Related sources */
  relatedSources?: string[];
}

export interface TraditionalOwnership {
  /** Owning community/tribe/group */
  owningCommunity: string;

  /** Community identifier */
  communityId?: string;

  /** Ownership type */
  ownershipType: OwnershipType;

  /** Traditional protocols */
  protocols?: CulturalProtocol[];

  /** Custodian information */
  custodians?: CustodianInformation[];

  /** Usage guidelines (informational) */
  usageGuidelines?: UsageGuidelines;

  /** Community contact information */
  communityContact?: ContactInformation;

  /** Traditional permissions (informational) */
  traditionalPermissions?: TraditionalPermissions;

  /** Cultural significance */
  culturalSignificance: string;

  /** Educational sharing notes */
  educationalSharingNotes?: string;
}

export interface SourceVerification {
  /** Verification status */
  status: VerificationStatus;

  /** Verification methods used */
  methods: VerificationMethod[];

  /** Verification date */
  verificationDate: string;

  /** Who verified the source */
  verifiedBy: VerificationProvider[];

  /** Cross-reference checks */
  crossReferences?: CrossReference[];

  /** Community validation */
  communityValidation?: CommunityValidation;

  /** Academic validation */
  academicValidation?: AcademicValidation;

  /** Verification notes */
  notes?: string;

  /** Confidence score */
  confidenceScore: number;

  /** Next verification due date */
  nextVerificationDue?: string;
}

export interface ProvenanceRecord {
  /** Record identifier */
  id: string;

  /** Step in the provenance chain */
  step: number;

  /** Description of this provenance step */
  description: string;

  /** Date of this step */
  date: string;

  /** Person/organization responsible */
  responsible: ResponsibleParty;

  /** Changes made at this step */
  changes?: string[];

  /** Verification for this step */
  stepVerification?: StepVerification;

  /** Documentation for this step */
  documentation?: DocumentationRecord[];

  /** Context at this step */
  context?: string;

  /** Cultural protocols observed */
  protocolsObserved?: string[];
}

export interface ResponsibleParty {
  /** Party identifier */
  id: string;

  /** Name */
  name: string;

  /** Role/title */
  role: string;

  /** Organization affiliation */
  organization?: string;

  /** Cultural affiliation */
  culturalAffiliation?: string;

  /** Credentials */
  credentials?: string[];

  /** Contact information */
  contactInfo?: ContactInformation;

  /** Authority/permission basis */
  authorityBasis?: string;
}

export interface EducationalAttribution {
  /** Educational purpose */
  purpose: string;

  /** Learning objectives */
  learningObjectives: string[];

  /** Educational level */
  level: EducationalLevel;

  /** Cultural context explanation */
  culturalContextExplanation: string;

  /** Educational resources */
  resources: EducationalResource[];

  /** Teaching protocols */
  teachingProtocols?: TeachingProtocol[];

  /** Learning outcomes */
  expectedOutcomes?: string[];

  /** Cultural competency requirements */
  competencyRequirements?: string[];

  /** Educational attribution sources */
  educationalSources?: SourceInformation[];
}

export interface CommunityAcknowledgment {
  /** Acknowledgment identifier */
  id: string;

  /** Community providing acknowledgment */
  community: string;

  /** Community identifier */
  communityId?: string;

  /** Acknowledgment type */
  acknowledgmentType: AcknowledgmentType;

  /** Acknowledgment message */
  message: string;

  /** Date provided */
  dateProvided: string;

  /** Provided by (person within community) */
  providedBy?: CommunityMember;

  /** Community role/authority */
  communityRole?: string;

  /** Acknowledgment scope */
  scope: AcknowledgmentScope;

  /** Additional context */
  additionalContext?: string;

  /** Verification of community membership */
  membershipVerification?: MembershipVerification;
}

export interface CulturalClassification {
  /** Primary classification */
  primary: string;

  /** Secondary classifications */
  secondary?: string[];

  /** Traditional classification systems */
  traditionalSystems?: TraditionalClassificationSystem[];

  /** Cultural categories */
  categories: string[];

  /** Sacred/public classification */
  sacredPublicLevel: SacredPublicLevel;

  /** Sharing permissions (informational) */
  sharingPermissions: SharingPermissionInfo;

  /** Cultural protocols */
  protocols?: CulturalProtocol[];

  /** Classification notes */
  notes?: string;
}

export interface VerificationProvider {
  /** Provider identifier */
  id: string;

  /** Provider name */
  name: string;

  /** Provider type */
  type: ProviderType;

  /** Credentials */
  credentials: string[];

  /** Cultural affiliation */
  culturalAffiliation?: string;

  /** Expertise areas */
  expertiseAreas: string[];

  /** Verification method used */
  methodUsed: string;

  /** Date of verification */
  verificationDate: string;

  /** Confidence in verification */
  confidence: ConfidenceLevel;
}

export interface CrossReference {
  /** Reference identifier */
  id: string;

  /** Reference source */
  source: string;

  /** Reference type */
  type: 'supporting' | 'contradicting' | 'neutral' | 'additional-context';

  /** Reference description */
  description: string;

  /** Correlation strength */
  correlationStrength: number;

  /** Notes */
  notes?: string;
}

export interface CommunityValidation {
  /** Validating community */
  community: string;

  /** Validation status */
  status: 'validated' | 'disputed' | 'additional-info' | 'no-response';

  /** Validation message */
  message?: string;

  /** Date of validation */
  validationDate: string;

  /** Community representative */
  representative?: CommunityMember;

  /** Validation scope */
  scope: string;
}

export interface AcademicValidation {
  /** Validating institution */
  institution: string;

  /** Validating scholar */
  scholar: string;

  /** Validation methodology */
  methodology: string;

  /** Validation result */
  result: ValidationResult;

  /** Academic paper/publication */
  publication?: string;

  /** Date of validation */
  validationDate: string;

  /** Peer review status */
  peerReviewStatus?: string;
}

export interface StepVerification {
  /** Verification method */
  method: string;

  /** Verification result */
  result: 'verified' | 'partial' | 'disputed' | 'unable-to-verify';

  /** Evidence provided */
  evidence: string[];

  /** Verification notes */
  notes?: string;
}

export interface DocumentationRecord {
  /** Documentation type */
  type: 'photo' | 'video' | 'audio' | 'written' | 'digital' | 'physical';

  /** Documentation description */
  description: string;

  /** Location/path to documentation */
  location?: string;

  /** Creation date */
  creationDate: string;

  /** Creator */
  creator: string;

  /** Verification status */
  verified: boolean;
}

export interface ContactInformation {
  /** Contact type */
  type: 'individual' | 'organization' | 'community' | 'institution';

  /** Contact name */
  name: string;

  /** Email address */
  email?: string;

  /** Phone number */
  phone?: string;

  /** Mailing address */
  address?: string;

  /** Website */
  website?: string;

  /** Preferred contact method */
  preferredMethod?: string;

  /** Contact notes */
  notes?: string;

  /** Privacy level */
  privacyLevel: 'public' | 'restricted' | 'community-only' | 'private';
}

export interface SourceAccessibility {
  /** Access level */
  accessLevel: 'open' | 'restricted' | 'community' | 'private';

  /** Access requirements */
  requirements?: string[];

  /** Educational access notes */
  educationalAccess: string;

  /** Community access notes */
  communityAccess?: string;

  /** Research access notes */
  researchAccess?: string;

  /** Digital availability */
  digitalAvailability: boolean;

  /** Physical location */
  physicalLocation?: string;
}

export interface TimePeriod {
  /** Start date/period */
  start: string;

  /** End date/period */
  end?: string;

  /** Period description */
  description: string;

  /** Uncertainty level */
  uncertainty?: string;

  /** Dating method */
  datingMethod?: string;
}

export interface CredibilityAssessment {
  /** Overall credibility score */
  score: number;

  /** Assessment criteria */
  criteria: CredibilityCriteria;

  /** Assessment notes */
  notes?: string;

  /** Assessment date */
  assessmentDate: string;

  /** Assessed by */
  assessedBy: string;
}

export interface CredibilityCriteria {
  /** Source reliability */
  sourceReliability: number;

  /** Information consistency */
  consistency: number;

  /** Community validation */
  communityValidation: number;

  /** Academic validation */
  academicValidation: number;

  /** Documentation quality */
  documentationQuality: number;

  /** Provenance clarity */
  provenanceClarity: number;
}

export interface CustodianInformation {
  /** Custodian name */
  name: string;

  /** Custodian role */
  role: string;

  /** Community position */
  communityPosition?: string;

  /** Custodianship period */
  custodianshipPeriod?: TimePeriod;

  /** Responsibilities */
  responsibilities: string[];

  /** Contact information */
  contactInfo?: ContactInformation;

  /** Succession information */
  succession?: string;
}

export interface UsageGuidelines {
  /** Educational usage */
  educational: string;

  /** Research usage */
  research?: string;

  /** Commercial usage */
  commercial?: string;

  /** Community usage */
  community?: string;

  /** Attribution requirements */
  attributionRequirements: string;

  /** Prohibited uses */
  prohibitedUses?: string[];

  /** Special considerations */
  specialConsiderations?: string[];
}

export interface TraditionalPermissions {
  /** Permission type */
  type: string;

  /** Permission scope */
  scope: string;

  /** Permission conditions */
  conditions?: string[];

  /** Granted by */
  grantedBy: string;

  /** Grant date */
  grantDate?: string;

  /** Permission duration */
  duration?: string;

  /** Renewal requirements */
  renewalRequirements?: string;
}

export interface CulturalProtocol {
  /** Protocol identifier */
  id: string;

  /** Protocol name */
  name: string;

  /** Protocol description */
  description: string;

  /** Protocol type */
  type: ProtocolType;

  /** When protocol applies */
  applicability: string;

  /** Protocol steps */
  steps?: string[];

  /** Traditional significance */
  significance: string;

  /** Modern adaptation */
  modernAdaptation?: string;

  /** Educational explanation */
  educationalExplanation: string;
}

export interface EducationalResource {
  /** Resource identifier */
  id: string;

  /** Resource type */
  type: 'article' | 'video' | 'audio' | 'interactive' | 'course' | 'workshop';

  /** Resource title */
  title: string;

  /** Resource description */
  description: string;

  /** Resource URL or path */
  resourcePath: string;

  /** Educational level */
  level: EducationalLevel;

  /** Duration/length */
  duration?: string;

  /** Creator/author */
  creator: string;

  /** Creation date */
  creationDate: string;

  /** Cultural relevance */
  culturalRelevance: string;
}

export interface TeachingProtocol {
  /** Protocol name */
  name: string;

  /** Protocol description */
  description: string;

  /** Cultural context */
  culturalContext: string;

  /** Teaching methods */
  methods: string[];

  /** Audience considerations */
  audienceConsiderations: string;

  /** Respectful approaches */
  respectfulApproaches: string[];
}

export interface CommunityMember {
  /** Member identifier */
  id: string;

  /** Member name */
  name: string;

  /** Community role */
  role?: string;

  /** Authority level */
  authorityLevel?: string;

  /** Credentials */
  credentials?: string[];

  /** Contact information */
  contactInfo?: ContactInformation;

  /** Verification status */
  verified: boolean;
}

export interface MembershipVerification {
  /** Verification method */
  method: string;

  /** Verification status */
  status: 'verified' | 'pending' | 'disputed' | 'unverified';

  /** Verification date */
  verificationDate?: string;

  /** Verified by */
  verifiedBy?: string;

  /** Verification notes */
  notes?: string;
}

export interface TraditionalClassificationSystem {
  /** System name */
  name: string;

  /** System description */
  description: string;

  /** Cultural origin */
  culturalOrigin: string;

  /** Classification within system */
  classification: string;

  /** System hierarchy */
  hierarchy?: string[];

  /** Traditional significance */
  significance: string;
}

export interface SharingPermissionInfo {
  /** Permission level */
  level: 'open' | 'educational' | 'restricted' | 'community-only';

  /** Permission description */
  description: string;

  /** Educational sharing allowed */
  educationalSharing: boolean;

  /** Research sharing allowed */
  researchSharing: boolean;

  /** Commercial sharing allowed */
  commercialSharing: boolean;

  /** Attribution requirements */
  attributionRequired: boolean;

  /** Community notification required */
  communityNotificationRequired: boolean;

  /** Special conditions */
  specialConditions?: string[];
}

export interface AttributionProvider {
  /** Provider identifier */
  id: string;

  /** Provider name */
  name: string;

  /** Provider type */
  type: 'individual' | 'community' | 'institution' | 'academic' | 'traditional-keeper';

  /** Cultural affiliation */
  culturalAffiliation?: string;

  /** Expertise areas */
  expertise: string[];

  /** Credentials */
  credentials?: string[];

  /** Contact information */
  contactInfo?: ContactInformation;

  /** Verification status */
  verified: boolean;
}

// Enums and Union Types
export type AttributionType =
  | 'traditional-knowledge'
  | 'cultural-practice'
  | 'oral-history'
  | 'sacred-knowledge'
  | 'community-knowledge'
  | 'individual-knowledge'
  | 'academic-research'
  | 'collaborative-work';

export type SourceType =
  | 'oral-tradition'
  | 'elder-testimony'
  | 'community-record'
  | 'written-document'
  | 'academic-paper'
  | 'multimedia-record'
  | 'physical-artifact'
  | 'ceremonial-record'
  | 'medicinal-knowledge'
  | 'practical-knowledge';

export type OwnershipType =
  | 'collective-ownership'
  | 'individual-ownership'
  | 'community-stewardship'
  | 'sacred-trust'
  | 'ancestral-knowledge'
  | 'shared-heritage'
  | 'ceremonial-ownership'
  | 'medicinal-stewardship';

export type VerificationStatus =
  | 'verified'
  | 'partially-verified'
  | 'pending-verification'
  | 'disputed'
  | 'multiple-sources'
  | 'unverified'
  | 'under-review';

export type VerificationMethod =
  | 'community-validation'
  | 'elder-confirmation'
  | 'cross-reference'
  | 'academic-review'
  | 'peer-verification'
  | 'document-analysis'
  | 'oral-testimony'
  | 'ceremonial-confirmation';

export type ConfidenceLevel = 'very-high' | 'high' | 'medium' | 'low' | 'very-low' | 'uncertain';

export type EducationalLevel =
  | 'general-public'
  | 'elementary'
  | 'secondary'
  | 'undergraduate'
  | 'graduate'
  | 'specialist'
  | 'community-specific';

export type AcknowledgmentType =
  | 'source-confirmation'
  | 'cultural-validation'
  | 'educational-endorsement'
  | 'community-blessing'
  | 'elder-acknowledgment'
  | 'protocol-confirmation'
  | 'sharing-permission'
  | 'context-clarification';

export type AcknowledgmentScope =
  | 'full-content'
  | 'partial-content'
  | 'cultural-context'
  | 'educational-use'
  | 'research-use'
  | 'specific-aspects'
  | 'general-sharing';

export type SacredPublicLevel =
  | 'public-knowledge'
  | 'community-knowledge'
  | 'restricted-knowledge'
  | 'sacred-knowledge'
  | 'ceremonial-knowledge'
  | 'medicinal-knowledge'
  | 'educational-knowledge';

export type ProviderType =
  | 'community-elder'
  | 'cultural-expert'
  | 'academic-researcher'
  | 'traditional-keeper'
  | 'institutional-expert'
  | 'peer-reviewer'
  | 'community-member';

export type ValidationResult =
  | 'fully-validated'
  | 'partially-validated'
  | 'conflicting-evidence'
  | 'insufficient-evidence'
  | 'disputed'
  | 'requires-further-research';

export type ProtocolType =
  | 'sharing-protocol'
  | 'attribution-protocol'
  | 'educational-protocol'
  | 'ceremonial-protocol'
  | 'research-protocol'
  | 'community-protocol'
  | 'respectful-use-protocol';
