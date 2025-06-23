/**
 * Information Integrity Verification Types
 *
 * Comprehensive type definitions for content authenticity verification,
 * source validation, manipulation detection, and educational transparency.
 *
 * ANTI-CENSORSHIP CORE: Information integrity through verification and transparency,
 * never through content blocking. Multiple verification methods supported equally.
 * Educational approach to information literacy and critical thinking.
 */

// ============================================================================
// CORE VERIFICATION INTERFACES
// ============================================================================

export interface VerificationOptions {
  // Verification methods to use
  methods: VerificationMethod[];

  // Verification depth and thoroughness
  thoroughness: 'basic' | 'standard' | 'comprehensive' | 'forensic';

  // Include cultural context verification
  includeCulturalContext: boolean;

  // Educational mode settings
  educationalMode: boolean;
  showLearningOpportunities: boolean;

  // Performance settings
  timeout: number; // milliseconds
  parallelVerification: boolean;

  // Privacy settings
  anonymousVerification: boolean;
  shareFingerprintsWithNetwork: boolean;
}

export interface VerificationMethod {
  // Method identification
  id: string;
  name: string;
  type: 'cryptographic' | 'consensus' | 'forensic' | 'provenance' | 'cultural' | 'community';

  // Method capabilities
  capabilities: MethodCapability[];

  // Performance characteristics
  accuracy: number; // 0-100
  speed: number; // 0-100 (relative)
  resourceUsage: 'low' | 'medium' | 'high';

  // Network requirements
  requiresNetwork: boolean;
  worksCensored: boolean;

  // Educational value
  educationalValue: number; // 0-100
  learningResources: string[];
}

export interface MethodCapability {
  capability:
    | 'authenticity'
    | 'integrity'
    | 'provenance'
    | 'manipulation_detection'
    | 'source_validation'
    | 'temporal_verification'
    | 'cultural_context';
  confidence: number; // 0-100
  description: string;
}

// ============================================================================
// VERIFICATION RESULT INTERFACES
// ============================================================================

export interface VerificationResult {
  // Overall verification status
  verificationId: string;
  contentId: string;
  overallScore: number; // 0-100
  trustLevel: 'unverified' | 'low' | 'medium' | 'high' | 'verified';

  // Verification breakdown
  authenticity: AuthenticityResult;
  integrity: IntegrityResult;
  provenance: ProvenanceResult;
  manipulation: ManipulationResult;
  source: SourceValidationResult;

  // Cultural context verification (EDUCATIONAL ONLY)
  culturalContext?: CulturalVerificationResult;

  // Verification metadata
  verifiedAt: Date;
  verificationDuration: number; // milliseconds
  methodsUsed: VerificationMethod[];

  // Educational insights
  learningOpportunities: LearningOpportunity[];
  criticalThinkingPrompts: string[];

  // Alternative perspectives
  alternativeVerifications: AlternativeVerification[];
  conflictingEvidence: ConflictingEvidence[];
}

export interface AuthenticityResult {
  // Authenticity assessment
  authentic: boolean;
  confidence: number; // 0-100
  certainty: 'low' | 'medium' | 'high' | 'certain';

  // Authentication methods
  methodsUsed: string[];
  cryptographicSignature?: CryptographicSignature;

  // Author verification
  authorAuthenticated: boolean;
  authorVerificationMethod: string;
  authorCredibility: number; // 0-100

  // Publisher verification
  publisherAuthenticated: boolean;
  publisherReputation: number; // 0-100
  publisherHistory: PublisherHistory;

  // Educational insights
  authenticityEducation: string[];
  verificationEducation: string[];
}

export interface IntegrityResult {
  // Integrity status
  intact: boolean;
  integrityScore: number; // 0-100

  // Checksum verification
  checksums: ChecksumVerification[];

  // File integrity
  fileIntegrityChecks: FileIntegrityCheck[];

  // Content comparison
  originalContentAvailable: boolean;
  contentMatchesOriginal?: boolean;
  contentDifferences?: ContentDifference[];

  // Educational context
  integrityEducation: string[];
  technicalExplanation: string[];
}

export interface ProvenanceResult {
  // Provenance tracking
  provenanceComplete: boolean;
  provenanceScore: number; // 0-100

  // Chain of custody
  custodyChain: CustodyRecord[];
  custodyBreaks: CustodyBreak[];

  // Historical record
  creationRecord?: CreationRecord;
  modificationHistory: ModificationRecord[];

  // Source tracing
  originalSource?: SourceRecord;
  intermediarySources: SourceRecord[];

  // Educational value
  provenanceEducation: string[];
  sourceTrackingEducation: string[];
}

export interface ManipulationResult {
  // Manipulation detection
  manipulationDetected: boolean;
  manipulationScore: number; // 0-100 (higher = more likely manipulated)

  // Types of manipulation found
  manipulationTypes: ManipulationType[];

  // Forensic analysis
  forensicFindings: ForensicFinding[];

  // Temporal analysis
  temporalInconsistencies: TemporalInconsistency[];

  // Educational insights
  manipulationEducation: string[];
  forensicEducation: string[];
  criticalAnalysisPrompts: string[];
}

export interface SourceValidationResult {
  // Source validation
  sourceValidated: boolean;
  sourceCredibility: number; // 0-100

  // Source analysis
  sourceReputation: SourceReputation;
  sourceBias?: SourceBias;
  sourceHistory: SourceHistory;

  // Cross-validation
  crossValidationSources: CrossValidationSource[];
  consensusLevel: number; // 0-100

  // Educational context
  sourceEvaluation: SourceEvaluationEducation;
  biasEducation: string[];
}

// ============================================================================
// CULTURAL VERIFICATION INTERFACES (EDUCATIONAL ONLY)
// ============================================================================

export interface CulturalVerificationResult {
  // Cultural context verification (INFORMATION ONLY)
  culturalContextVerified: boolean;
  culturalAccuracy: number; // 0-100

  // Cultural source validation
  culturalSourceValidation: CulturalSourceValidation;

  // Traditional knowledge verification
  traditionalKnowledgeVerification?: TraditionalKnowledgeVerification;

  // Cultural sensitivity assessment
  culturalSensitivityAssessment: CulturalSensitivityAssessment;

  // Educational opportunities
  culturalEducationOpportunities: CulturalEducationOpportunity[];

  // Multiple perspectives
  culturalPerspectives: CulturalPerspective[];

  // NO ACCESS CONTROL - INFORMATION ONLY
  informationOnly: true;
  educationalPurpose: true;
  accessGranted: true;
}

export interface CulturalSourceValidation {
  // Cultural source assessment
  sourceAuthenticity: number; // 0-100
  culturalOriginVerified: boolean;
  traditionalProtocolsFollowed: boolean;

  // Community validation (INFORMATIONAL ONLY)
  communityValidation?: CommunityValidation;
  elderValidation?: ElderValidation;
  culturalInstitutionValidation?: CulturalInstitutionValidation;

  // Educational context
  culturalContextEducation: string[];
  traditionEducation: string[];

  // NO GATEKEEPING
  gatekeepingDetected: false;
  openAccess: true;
}

// ============================================================================
// SUPPORTING VERIFICATION INTERFACES
// ============================================================================

export interface CryptographicSignature {
  algorithm: string;
  signature: string;
  publicKey: string;
  keyVerified: boolean;
  signatureValid: boolean;
  certificateChain?: string[];
}

export interface ChecksumVerification {
  algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512';
  expectedChecksum: string;
  actualChecksum: string;
  matches: boolean;
}

export interface FileIntegrityCheck {
  checkType: 'size' | 'metadata' | 'header' | 'structure';
  expected: any;
  actual: any;
  matches: boolean;
  description: string;
}

export interface ContentDifference {
  type: 'addition' | 'deletion' | 'modification';
  location: string;
  originalContent?: string;
  currentContent?: string;
  significance: 'minor' | 'moderate' | 'major' | 'critical';
}

export interface CustodyRecord {
  custodian: string;
  startDate: Date;
  endDate?: Date;
  verificationMethod: string;
  verified: boolean;
}

export interface CustodyBreak {
  detectedAt: Date;
  duration?: number; // milliseconds
  possibleCause: string;
  impact: 'none' | 'low' | 'medium' | 'high' | 'unknown';
}

export interface CreationRecord {
  creator: string;
  createdAt: Date;
  creationMethod: string;
  originalLocation: string;
  witnesses?: string[];
}

export interface ModificationRecord {
  modifier: string;
  modifiedAt: Date;
  modificationType: string;
  changes: string[];
  reason?: string;
}

export interface SourceRecord {
  sourceId: string;
  sourceName: string;
  sourceType: 'original' | 'copy' | 'derivative' | 'reference';
  credibility: number; // 0-100
  verificationDate: Date;
}

export interface ManipulationType {
  type:
    | 'digital_forgery'
    | 'content_splicing'
    | 'metadata_manipulation'
    | 'temporal_shifting'
    | 'context_removal'
    | 'deep_fake'
    | 'steganography';
  confidence: number; // 0-100
  evidence: string[];
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface ForensicFinding {
  findingType: string;
  evidence: string[];
  confidence: number; // 0-100
  technicalDetails: string;
  educationalExplanation: string;
}

export interface TemporalInconsistency {
  inconsistencyType: 'timestamp_mismatch' | 'creation_date_invalid' | 'sequence_error';
  details: string;
  impact: 'low' | 'medium' | 'high';
}

export interface SourceReputation {
  reputationScore: number; // 0-100
  trackRecord: TrackRecord[];
  peerRating: number; // 0-100
  expertEndorsements: string[];
}

export interface SourceBias {
  biasType: 'political' | 'commercial' | 'ideological' | 'cultural' | 'personal';
  biasLevel: number; // 0-100
  biasDescription: string;
  mitigationStrategies: string[];
}

export interface SourceHistory {
  established: Date;
  previousPublications: number;
  accuracyRecord: AccuracyRecord[];
  controversies: Controversy[];
}

export interface CrossValidationSource {
  sourceId: string;
  sourceName: string;
  agreement: number; // 0-100
  disagreements: string[];
}

export interface SourceEvaluationEducation {
  evaluationCriteria: string[];
  redFlags: string[];
  evaluationMethods: string[];
  criticalQuestions: string[];
}

// ============================================================================
// ADDITIONAL SUPPORTING INTERFACES
// ============================================================================

export interface TraditionalKnowledgeVerification {
  // Traditional knowledge assessment
  traditionalKnowledgeVerified: boolean;
  knowledgeType: 'oral' | 'ceremonial' | 'medicinal' | 'artistic' | 'historical' | 'other';

  // Source verification
  traditionalSourceVerified: boolean;
  lineageDocumented: boolean;
  transmissionMethod: string;

  // Educational context
  traditionalKnowledgeEducation: string[];
  culturalProtocolEducation: string[];
  respectfulEngagementEducation: string[];

  // Multiple perspectives supported
  alternativeTraditionalSources: AlternativeTraditionalSource[];
}

export interface CulturalSensitivityAssessment {
  // Sensitivity level (INFORMATIONAL ONLY)
  sensitivityLevel: number; // 1-5
  sensitivityType: 'general' | 'traditional' | 'sacred' | 'ceremonial' | 'restricted';

  // Cultural context
  culturalContext: string;
  culturalOrigin: string[];

  // Educational preparation
  educationalPreparation: EducationalPreparation;
  culturalProtocolEducation: string[];

  // NO ACCESS RESTRICTIONS
  accessRestricted: false;
  educationalEnhancement: true;
}

export interface LearningOpportunity {
  topic: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  resources: LearningResource[];
}

export interface LearningResource {
  type: 'article' | 'video' | 'interactive' | 'exercise' | 'quiz';
  title: string;
  url?: string;
  description: string;
  duration?: number; // minutes
}

export interface AlternativeVerification {
  verificationId: string;
  method: string;
  result: VerificationResult;
  source: string;
  credibility: number; // 0-100
}

export interface ConflictingEvidence {
  evidenceType: string;
  conflictDescription: string;
  sources: string[];
  resolutionSuggestions: string[];
  educationalValue: string;
}

export interface CommunityValidation {
  // Community input (INFORMATIONAL ONLY)
  communityName: string;
  validationProvided: boolean;
  validationNotes: string[];

  // NO GATEKEEPING
  gatekeepingRole: false;
  informationalRole: true;
}

export interface ElderValidation {
  // Elder knowledge sharing (INFORMATIONAL ONLY)
  elderName?: string; // Optional for privacy
  validationProvided: boolean;
  culturalContext: string[];

  // Educational sharing
  wisdomShared: string[];
  culturalTeaching: string[];

  // NO ACCESS CONTROL
  accessControl: false;
  educationalPurpose: true;
}

export interface CulturalInstitutionValidation {
  // Institution information sharing (INFORMATIONAL ONLY)
  institutionName: string;
  institutionType: 'museum' | 'university' | 'cultural_center' | 'library' | 'archive';
  validationProvided: boolean;

  // Educational resources
  institutionalResources: string[];
  educationalPrograms: string[];

  // NO GATEKEEPING
  informationSharing: true;
  accessBlocking: false;
}

export interface EducationalPreparation {
  recommendedReading: string[];
  culturalContextResources: string[];
  respectfulEngagementGuidelines: string[];
  criticalThinkingQuestions: string[];
}

export interface CulturalEducationOpportunity {
  topic: string;
  educationType: 'historical' | 'contemporary' | 'comparative' | 'analytical';
  resources: LearningResource[];
  culturalContext: string;
}

export interface CulturalPerspective {
  perspectiveName: string;
  culturalOrigin: string;
  viewpoint: string;
  historicalContext: string;
  modernRelevance: string;
  educationalValue: string;
}

export interface AlternativeTraditionalSource {
  sourceName: string;
  sourceType: 'oral' | 'written' | 'ceremonial' | 'artistic';
  culturalOrigin: string;
  perspective: string;
  educationalValue: string;
}

export interface PublisherHistory {
  established: Date;
  publicationsCount: number;
  reputationScore: number; // 0-100
  verificationHistory: string[];
}

export interface TrackRecord {
  publicationDate: Date;
  accuracy: number; // 0-100
  impact: string;
  corrections?: string[];
}

export interface AccuracyRecord {
  period: string;
  accuracy: number; // 0-100
  corrections: number;
  retractions: number;
}

export interface Controversy {
  date: Date;
  description: string;
  resolution?: string;
  impact: 'low' | 'medium' | 'high';
}

// ============================================================================
// UI STATE INTERFACES
// ============================================================================

export interface VerificationState {
  // Current verification status
  isVerifying: boolean;
  verificationProgress: VerificationProgress;

  // Results
  currentResult?: VerificationResult;
  verificationHistory: VerificationResult[];

  // UI state
  selectedMethods: VerificationMethod[];
  showEducationalContent: boolean;
  expandedSections: string[];

  // Filters and sorting
  resultFilter: ResultFilter;
  sortBy: 'confidence' | 'date' | 'method' | 'accuracy';
  sortOrder: 'asc' | 'desc';
}

export interface VerificationProgress {
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  overallProgress: number; // 0-100

  // Method-specific progress
  methodProgress: MethodProgress[];

  // Timing
  startTime: Date;
  estimatedCompletion?: Date;
}

export interface MethodProgress {
  methodId: string;
  methodName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  result?: any;
}

export interface ResultFilter {
  trustLevels: string[];
  methodTypes: string[];
  showConflicts: boolean;
  showEducational: boolean;
  culturalContextOnly: boolean;
}

// ============================================================================
// COMPONENT PROPS INTERFACE
// ============================================================================

export interface InformationIntegrityVerificationProps {
  // Content to verify
  contentId?: string;
  contentUrl?: string;
  contentData?: any;
  contentType: 'document' | 'media' | 'data' | 'metadata';

  // Verification options
  verificationOptions?: Partial<VerificationOptions>;
  autoStart?: boolean;

  // Cultural context (INFORMATION ONLY)
  culturalTheme?: 'indigenous' | 'traditional' | 'modern' | 'ceremonial' | 'community' | 'default';
  culturalContext?: string;
  showCulturalVerification?: boolean;

  // UI customization
  showAdvancedOptions?: boolean;
  showEducationalContent?: boolean;
  compact?: boolean;

  // Event handlers
  onVerificationComplete?: (result: VerificationResult) => void;
  onVerificationProgress?: (progress: VerificationProgress) => void;
  onError?: (error: string) => void;
  onLearningOpportunitySelected?: (opportunity: LearningOpportunity) => void;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}
