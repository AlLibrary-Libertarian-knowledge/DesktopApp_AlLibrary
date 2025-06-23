/**
 * CensorshipResistantSearch Component Types
 *
 * TypeScript interfaces for advanced distributed search with multi-protocol routing,
 * censorship circumvention, and information integrity verification.
 *
 * ANTI-CENSORSHIP PRINCIPLES:
 * - No content filtering based on cultural factors
 * - Multiple routing protocols for censorship resistance
 * - Information integrity through verification, not blocking
 * - Educational context enhances understanding
 * - Source transparency without judgment
 */

import type { CulturalMetadata } from '@/types/Cultural';

// ============================================================================
// CORE COMPONENT INTERFACES
// ============================================================================

export interface CensorshipResistantSearchProps {
  // Display configuration
  class?: string;
  variant?: 'compact' | 'detailed' | 'fullscreen';
  showAdvancedOptions?: boolean;

  // Anti-censorship features
  enableTorRouting?: boolean;
  enableIPFSDiscovery?: boolean;
  enableMultiProtocol?: boolean;
  showCensorshipStatus?: boolean;

  // Educational context
  showEducationalInfo?: boolean;
  showSourceVerification?: boolean;
  showIntegrityChecks?: boolean;

  // Event handlers
  onSearch?: (query: string, options: SearchOptions) => void;
  onResultSelect?: (result: SearchResult) => void;
  onProtocolChange?: (protocol: SearchProtocol) => void;
  onCensorshipDetected?: (event: CensorshipEvent) => void;
}

// ============================================================================
// SEARCH CONFIGURATION INTERFACES
// ============================================================================

export interface SearchOptions {
  // Basic search parameters
  query: string;
  maxResults?: number;
  timeout?: number;

  // Protocol selection
  protocols: SearchProtocol[];
  primaryProtocol?: SearchProtocol;
  fallbackProtocols: SearchProtocol[];

  // Anti-censorship settings
  enableAnonymousRouting: boolean;
  useMultiplePaths: boolean;
  bypassFiltering: boolean; // ALWAYS true - no cultural filtering
  resistCensorship: boolean;

  // Information integrity
  verifyAuthenticity: boolean;
  checkSourceIntegrity: boolean;
  validateProvenance: boolean;
  detectManipulation: boolean;

  // Educational context
  includeEducationalContext: boolean;
  showCulturalInformation: boolean; // Information only, never restrictive
  provideLearningOpportunities: boolean;
  displayMultiplePerspectives: boolean;

  // Content discovery
  searchDepth: 'local' | 'network' | 'extended' | 'global';
  includeAlternativeNarratives: boolean;
  supportConflictingViewpoints: boolean;
  preserveSourceDiversity: boolean;
}

export interface SearchProtocol {
  id: string;
  name: string;
  type: 'direct-p2p' | 'tor-onion' | 'ipfs-dht' | 'webrtc' | 'hybrid';
  description: string;

  // Protocol capabilities
  supportsAnonymity: boolean;
  bypassesCensorship: boolean;
  providesIntegrity: boolean;
  allowsVerification: boolean;

  // Performance characteristics
  averageLatency: number;
  reliabilityScore: number;
  censorshipResistance: number;
  privacyLevel: number;

  // Status and availability
  available: boolean;
  active: boolean;
  lastTested?: Date;
  errorCount: number;
}

// ============================================================================
// SEARCH RESULTS INTERFACES
// ============================================================================

export interface SearchResult {
  // Basic result information
  id: string;
  title: string;
  description: string;
  contentType: 'document' | 'collection' | 'peer' | 'community' | 'educational';
  format?: string;

  // Source information
  source: ResultSource;
  discoveryMethod: SearchProtocol;
  alternativeSources: ResultSource[];

  // Content verification
  integrity: IntegrityVerification;
  authenticity: AuthenticityCheck;
  provenance?: ProvenanceRecord;

  // Cultural context (INFORMATION ONLY)
  culturalContext?: CulturalInformation;
  educationalValue?: EducationalMetadata;
  alternativePerspectives?: AlternativePerspective[];

  // Accessibility and availability
  accessMethods: AccessMethod[];
  availabilityScore: number;
  censorshipStatus: CensorshipStatus;

  // Metadata
  createdAt?: Date;
  modifiedAt?: Date;
  size?: number;
  language?: string;
  tags: string[];
}

export interface ResultSource {
  id: string;
  name: string;
  type: 'peer' | 'ipfs-node' | 'tor-service' | 'direct-server' | 'mirror';
  address: string;

  // Source reliability
  trustScore: number;
  verificationStatus: 'verified' | 'unverified' | 'disputed' | 'unknown';
  communityRating?: number;

  // Technical details
  protocol: string;
  connectionType: 'direct' | 'proxy' | 'tor' | 'encrypted';
  responseTime?: number;
  availability: number;

  // Educational context
  sourceContext?: string;
  educationalNote?: string;
  culturalSignificance?: string;
}

// ============================================================================
// INFORMATION INTEGRITY INTERFACES
// ============================================================================

export interface IntegrityVerification {
  // Verification status
  verified: boolean;
  verificationMethod: 'cryptographic' | 'consensus' | 'authority' | 'community' | 'multiple';
  confidence: number; // 0-100

  // Verification details
  checksumValid: boolean;
  signatureValid: boolean;
  consensusReached: boolean;
  communityValidated: boolean;

  // Verification metadata
  verifiedAt: Date;
  verifiedBy: string[];
  verificationChain: VerificationStep[];

  // Issues and warnings (EDUCATIONAL ONLY)
  warnings: IntegrityWarning[];
  educationalNotes: string[];
  alternativeVerifications: IntegrityVerification[];
}

export interface AuthenticityCheck {
  // Authenticity status
  authentic: boolean;
  authenticityScore: number; // 0-100
  verificationMethod: string;

  // Source verification
  authorVerified: boolean;
  publisherVerified: boolean;
  originVerified: boolean;

  // Content analysis
  manipulationDetected: boolean;
  alterationsFound: AlterationRecord[];
  originalityScore: number;

  // Educational context
  authenticityContext: string;
  verificationEducation: string[];
  sourceEducation: string;
}

export interface ProvenanceRecord {
  // Content history
  originalSource: string;
  creationDate?: Date;
  modificationHistory: ModificationRecord[];
  distributionPath: DistributionStep[];

  // Ownership and attribution
  creators: Creator[];
  contributors: Contributor[];
  rightsHolders: RightsHolder[];

  // Cultural provenance (INFORMATION ONLY)
  culturalOrigin?: CulturalMetadata;
  traditionalOwnership?: TraditionalOwnership[];
  communityConnections: CommunityConnection[];

  // Educational value
  educationalProvenance: string;
  learningOpportunities: string[];
  historicalSignificance: string;
}

// ============================================================================
// CULTURAL CONTEXT INTERFACES (INFORMATION ONLY)
// ============================================================================

export interface CulturalInformation {
  // Cultural context (NEVER RESTRICTIVE)
  sensitivityLevel: 1 | 2 | 3;
  culturalSignificance: string;
  traditionalContext: string;
  communityRelevance: string;

  // Educational resources
  educationalMaterials: EducationalResource[];
  learningObjectives: string[];
  culturalLearningPaths: LearningPath[];

  // Multiple perspectives
  perspectives: CulturalPerspective[];
  alternativeViews: AlternativeView[];
  conflictingInterpretations: ConflictingInterpretation[];

  // Community information (NOT CONTROL)
  communityInformation: CommunityInformation[];
  sourceAttribution: SourceAttribution[];
  culturalProtocols: CulturalProtocol[];

  // Access enhancement (NOT RESTRICTION)
  accessGuidance: string;
  educationalPreparation: string;
  respectfulEngagement: string;
}

export interface EducationalMetadata {
  // Educational value
  educationalLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  learningObjectives: string[];
  educationalTopics: string[];

  // Cultural education
  culturalLearningValue: number; // 0-100
  crossCulturalInsights: string[];
  educationalWarnings: string[]; // Educational only, not restrictive

  // Learning opportunities
  relatedResources: EducationalResource[];
  recommendedPreparation: string[];
  furtherLearning: string[];
}

export interface AlternativePerspective {
  // Perspective information
  id: string;
  title: string;
  description: string;
  perspective: string;

  // Source and context
  source: string;
  culturalContext: string;
  historicalContext: string;

  // Educational value
  educationalValue: string;
  learningOpportunities: string[];
  comparisonPoints: string[];

  // Multiple viewpoints support
  conflictingViews: ConflictingView[];
  supportingEvidence: Evidence[];
  alternativeInterpretations: Interpretation[];
}

// ============================================================================
// CENSORSHIP RESISTANCE INTERFACES
// ============================================================================

export interface CensorshipStatus {
  // Censorship detection
  censorshipDetected: boolean;
  censorshipLevel: 'none' | 'partial' | 'moderate' | 'severe' | 'complete';
  censorshipMethods: CensorshipMethod[];

  // Resistance capabilities
  bypassMethods: BypassMethod[];
  alternativeRoutes: AlternativeRoute[];
  resistanceStrategies: ResistanceStrategy[];

  // Status information
  accessibilityScore: number; // 0-100
  availabilityThroughProtocols: ProtocolAvailability[];
  recommendedApproaches: RecommendedApproach[];

  // Educational context
  censorshipEducation: string[];
  resistanceEducation: string[];
  freedomOfInformationContext: string;
}

export interface CensorshipEvent {
  // Event details
  id: string;
  timestamp: Date;
  type: 'blocking' | 'filtering' | 'throttling' | 'redirect' | 'manipulation';
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Affected content
  affectedContent: string[];
  targetedSources: string[];
  blockedProtocols: string[];

  // Response and mitigation
  detectionMethod: string;
  automaticResponse: AutomaticResponse;
  recommendedActions: RecommendedAction[];

  // Educational context
  educationalResponse: string;
  informationFreedomImpact: string;
  userGuidance: string[];
}

export interface BypassMethod {
  // Method information
  id: string;
  name: string;
  type: 'protocol-switch' | 'route-change' | 'proxy' | 'encryption' | 'obfuscation';
  description: string;

  // Effectiveness
  successRate: number; // 0-100
  detectionResistance: number; // 0-100
  performanceImpact: number; // 0-100

  // Implementation
  available: boolean;
  automatic: boolean;
  userActionRequired: boolean;
  technicalComplexity: 'low' | 'medium' | 'high';

  // Educational guidance
  howToUse: string[];
  educationalContext: string;
  privacyImplications: string[];
}

// ============================================================================
// SEARCH STATE INTERFACES
// ============================================================================

export interface SearchState {
  // Search status
  isSearching: boolean;
  searchProgress: number; // 0-100
  activeProtocols: SearchProtocol[];
  completedProtocols: SearchProtocol[];

  // Results management
  results: SearchResult[];
  resultCount: number;
  estimatedTotal: number;
  resultQuality: number; // 0-100

  // Performance metrics
  searchDuration: number;
  averageResponseTime: number;
  protocolPerformance: ProtocolPerformance[];

  // Status and health
  networkHealth: NetworkHealth;
  censorshipStatus: CensorshipStatus;
  integrityStatus: IntegrityStatus;

  // Educational context
  searchEducation: SearchEducation;
  discoveryOpportunities: DiscoveryOpportunity[];
  learningRecommendations: LearningRecommendation[];
}

export interface SearchEducation {
  // Search education
  searchContext: string;
  methodologyExplanation: string;
  protocolEducation: ProtocolEducation[];

  // Information literacy
  sourceEvaluation: string[];
  integrityAssessment: string[];
  biasRecognition: string[];

  // Anti-censorship education
  censorshipAwareness: string[];
  resistanceMethods: string[];
  informationFreedomPrinciples: string[];
}

// ============================================================================
// TECHNICAL INTERFACES
// ============================================================================

export interface ProtocolPerformance {
  protocol: SearchProtocol;
  responseTime: number;
  successRate: number;
  errorRate: number;
  resultsQuality: number;
  censorshipResistance: number;
}

export interface NetworkHealth {
  overall: number; // 0-100
  connectivity: number; // 0-100
  diversityScore: number; // 0-100
  censorshipResistance: number; // 0-100
  informationIntegrity: number; // 0-100
}

export interface IntegrityStatus {
  overallIntegrity: number; // 0-100
  verificationRate: number; // 0-100
  authenticityScore: number; // 0-100
  manipulationDetection: number; // 0-100
  sourceReliability: number; // 0-100
}

// ============================================================================
// SUPPORTING TYPE DEFINITIONS
// ============================================================================

export interface VerificationStep {
  step: number;
  method: string;
  result: boolean;
  timestamp: Date;
  verifier: string;
  confidence: number;
}

export interface IntegrityWarning {
  type: 'checksum-mismatch' | 'signature-invalid' | 'consensus-failed' | 'source-disputed';
  severity: 'info' | 'warning' | 'error';
  message: string;
  educationalContext: string;
  recommendedAction: string;
}

export interface AlterationRecord {
  type: 'content' | 'metadata' | 'structure' | 'format';
  description: string;
  confidence: number;
  detectedAt: Date;
  impact: 'minor' | 'moderate' | 'significant' | 'major';
}

export interface ModificationRecord {
  timestamp: Date;
  modifier: string;
  changes: string[];
  reason: string;
  verified: boolean;
}

export interface DistributionStep {
  timestamp: Date;
  source: string;
  destination: string;
  method: string;
  verified: boolean;
}

export interface Creator {
  name: string;
  role: string;
  contribution: string;
  verified: boolean;
  culturalContext?: string;
}

export interface Contributor {
  name: string;
  contribution: string;
  timestamp?: Date;
  role: string;
}

export interface RightsHolder {
  name: string;
  rights: string[];
  jurisdiction: string;
  contactInfo?: string;
}

export interface TraditionalOwnership {
  community: string;
  traditionalRights: string[];
  culturalSignificance: string;
  respectfulUsage: string[];
  educationalContext: string;
}

export interface CommunityConnection {
  community: string;
  relationship: string;
  significance: string;
  educationalValue: string;
  respectfulEngagement: string[];
}

export interface EducationalResource {
  title: string;
  type: 'article' | 'video' | 'course' | 'guide' | 'tutorial';
  url?: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface LearningPath {
  name: string;
  description: string;
  steps: LearningStep[];
  duration: string;
  prerequisites: string[];
}

export interface LearningStep {
  step: number;
  title: string;
  description: string;
  resources: EducationalResource[];
  objectives: string[];
}

export interface CulturalPerspective {
  perspective: string;
  description: string;
  culturalContext: string;
  educationalValue: string;
  respectfulConsiderations: string[];
}

export interface AlternativeView {
  viewpoint: string;
  description: string;
  source: string;
  educationalContext: string;
  comparisonPoints: string[];
}

export interface ConflictingInterpretation {
  interpretation: string;
  source: string;
  reasoning: string;
  educationalValue: string;
  respectfulDiscussion: string[];
}

export interface CommunityInformation {
  community: string;
  information: string;
  context: string;
  educationalValue: string;
  respectfulEngagement: string[];
}

export interface SourceAttribution {
  source: string;
  attribution: string;
  significance: string;
  respectfulAcknowledgment: string;
  educationalContext: string;
}

export interface CulturalProtocol {
  protocol: string;
  description: string;
  educationalContext: string;
  respectfulPractice: string[];
  learningOpportunities: string[];
}

export interface ConflictingView {
  view: string;
  source: string;
  reasoning: string;
  educationalValue: string;
}

export interface Evidence {
  type: string;
  description: string;
  source: string;
  reliability: number;
  educationalContext: string;
}

export interface Interpretation {
  interpretation: string;
  basis: string;
  source: string;
  educationalValue: string;
  alternativeViews: string[];
}

export interface CensorshipMethod {
  method: string;
  description: string;
  detectionMethod: string;
  commonality: number;
  bypassDifficulty: number;
}

export interface AlternativeRoute {
  route: string;
  description: string;
  reliability: number;
  speed: number;
  anonymity: number;
}

export interface ResistanceStrategy {
  strategy: string;
  description: string;
  effectiveness: number;
  complexity: string;
  requirements: string[];
}

export interface ProtocolAvailability {
  protocol: SearchProtocol;
  available: boolean;
  reliability: number;
  speed: number;
  limitations: string[];
}

export interface RecommendedApproach {
  approach: string;
  description: string;
  suitability: number;
  steps: string[];
  expectedOutcome: string;
}

export interface AutomaticResponse {
  triggered: boolean;
  actions: string[];
  effectiveness: number;
  userNotified: boolean;
  fallbackActivated: boolean;
}

export interface RecommendedAction {
  action: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  steps: string[];
  expectedResult: string;
}

export interface AccessMethod {
  method: string;
  description: string;
  reliability: number;
  speed: number;
  anonymity: number;
  requirements: string[];
}

export interface ProtocolEducation {
  protocol: SearchProtocol;
  howItWorks: string;
  advantages: string[];
  limitations: string[];
  bestUseCase: string;
  educationalResources: EducationalResource[];
}

export interface DiscoveryOpportunity {
  opportunity: string;
  description: string;
  educationalValue: string;
  actionSteps: string[];
  expectedLearning: string[];
}

export interface LearningRecommendation {
  topic: string;
  description: string;
  relevance: string;
  resources: EducationalResource[];
  nextSteps: string[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type SearchResultType = SearchResult['contentType'];
export type VerificationMethod = IntegrityVerification['verificationMethod'];
export type EducationalLevel = EducationalMetadata['educationalLevel'];

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  query: '',
  maxResults: 50,
  timeout: 30000,
  protocols: [],
  fallbackProtocols: [],
  enableAnonymousRouting: false,
  useMultiplePaths: true,
  bypassFiltering: true, // ALWAYS true - no cultural filtering
  resistCensorship: true,
  verifyAuthenticity: true,
  checkSourceIntegrity: true,
  validateProvenance: true,
  detectManipulation: true,
  includeEducationalContext: true,
  showCulturalInformation: true, // Information only, never restrictive
  provideLearningOpportunities: true,
  displayMultiplePerspectives: true,
  searchDepth: 'network',
  includeAlternativeNarratives: true,
  supportConflictingViewpoints: true,
  preserveSourceDiversity: true,
};

export const PROTOCOL_TYPES = ['direct-p2p', 'tor-onion', 'ipfs-dht', 'webrtc', 'hybrid'] as const;

export const CENSORSHIP_LEVELS = ['none', 'partial', 'moderate', 'severe', 'complete'] as const;

export type ProtocolType = (typeof PROTOCOL_TYPES)[number];
export type CensorshipLevel = (typeof CENSORSHIP_LEVELS)[number];
