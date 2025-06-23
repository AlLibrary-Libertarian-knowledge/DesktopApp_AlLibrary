/**
 * Decentralized Content Discovery Types
 *
 * Comprehensive type definitions for P2P content discovery with cultural context,
 * alternative source finding, and anti-censorship capabilities.
 *
 * ANTI-CENSORSHIP CORE: P2P content discovery across multiple networks with
 * educational cultural context and resistance to information blocking.
 */

// ============================================================================
// CORE DISCOVERY INTERFACES
// ============================================================================

export interface DiscoveryOptions {
  // Search parameters
  query?: string;
  contentTypes: ContentType[];
  languages: string[];

  // Discovery methods
  methods: DiscoveryMethod[];
  maxResults: number;
  timeoutMs: number;

  // Network preferences
  networks: NetworkProtocol[];
  includeTorNodes: boolean;
  includeIPFSNodes: boolean;
  includeHybridNodes: boolean;

  // Cultural context (EDUCATIONAL ONLY)
  includeCulturalContext: boolean;
  culturalLanguages: string[];
  traditionalKnowledgeSources: boolean;

  // Anti-censorship settings
  prioritizeCensorshipResistant: boolean;
  useAlternativeRoutes: boolean;
  verifySourceDiversity: boolean;

  // Quality preferences
  qualityThreshold: number; // 0-100
  prioritizeRecentContent: boolean;
  requireSourceAttribution: boolean;
}

export interface DiscoveryMethod {
  // Method identification
  id: string;
  name: string;
  type: 'dht' | 'gossip' | 'broadcast' | 'federated' | 'mesh' | 'hybrid';

  // Method capabilities
  capabilities: MethodCapability[];
  networks: NetworkProtocol[];

  // Performance characteristics
  speed: number; // 0-100 (relative)
  coverage: number; // 0-100 (network reach)
  accuracy: number; // 0-100 (result relevance)

  // Anti-censorship properties
  censorshipResistance: number; // 0-100
  anonymityLevel: number; // 0-100
  routeAroundBlocking: boolean;

  // Educational value
  educationalContext: string[];
  learningOpportunities: string[];
}

export interface MethodCapability {
  capability: string;
  confidence: number; // 0-100
  description: string;
  requirements: string[];
  limitations: string[];
}

export interface NetworkProtocol {
  // Protocol identification
  name: string;
  version: string;
  type: 'libp2p' | 'ipfs' | 'tor' | 'i2p' | 'hypercore' | 'bittorrent' | 'custom';

  // Network properties
  decentralized: boolean;
  encrypted: boolean;
  anonymous: boolean;
  censorshipResistant: boolean;

  // Connection details
  endpoints: string[];
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  peerCount: number;

  // Performance metrics
  latency: number; // milliseconds
  bandwidth: number; // bytes/sec
  reliability: number; // 0-100

  // Cultural support
  supportsCulturalRouting: boolean;
  culturalNodeCount: number;
  educationalResourceCount: number;
}

// ============================================================================
// DISCOVERY RESULT INTERFACES
// ============================================================================

export interface DiscoveryResult {
  // Result identification
  resultId: string;
  discoveryId: string;
  timestamp: Date;

  // Content information
  content: ContentInfo;
  sources: SourceInfo[];

  // Discovery metadata
  discoveryMethod: string;
  networkPath: NetworkHop[];
  verificationLevel: VerificationLevel;

  // Quality assessment
  relevanceScore: number; // 0-100
  qualityScore: number; // 0-100
  trustScore: number; // 0-100

  // Cultural context (EDUCATIONAL ONLY)
  culturalContext?: CulturalContext;
  traditionalKnowledge?: TraditionalKnowledgeInfo;

  // Anti-censorship information
  censorshipRisk: CensorshipRisk;
  alternativeSources: AlternativeSource[];
  routeResilience: number; // 0-100

  // Educational opportunities
  learningOpportunities: LearningOpportunity[];
  relatedContent: RelatedContent[];
}

export interface ContentInfo {
  // Basic information
  id: string;
  title: string;
  description: string;
  contentType: ContentType;

  // Metadata
  language: string;
  size: number; // bytes
  format: string;
  checksum: string;

  // Temporal information
  createdAt: Date;
  modifiedAt: Date;
  discoveredAt: Date;

  // Content classification
  tags: string[];
  categories: string[];
  subjects: string[];

  // Cultural classification (INFORMATION ONLY)
  culturalOrigin?: string;
  culturalSignificance?: string;
  traditionalCategory?: string;
  sensitivityLevel?: number; // 1-3 (educational scale)
}

export interface SourceInfo {
  // Source identification
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;

  // Network information
  networkProtocol: string;
  nodeId: string;
  isAnonymous: boolean;

  // Reliability metrics
  trustLevel: number; // 0-100
  verificationStatus: VerificationStatus;
  historicalAccuracy: number; // 0-100

  // Availability information
  availability: number; // 0-100
  responseTime: number; // milliseconds
  bandwidth: number; // bytes/sec

  // Cultural information (EDUCATIONAL ONLY)
  culturalAffiliation?: string;
  communityRole?: string;
  traditionalKnowledgeKeeper?: boolean;

  // Anti-censorship properties
  censorshipResistance: number; // 0-100
  routeStability: number; // 0-100
  hasAlternativeRoutes: boolean;
}

export interface NetworkHop {
  // Hop identification
  hopId: string;
  nodeId: string;
  protocol: string;

  // Hop properties
  isAnonymous: boolean;
  isEncrypted: boolean;
  latency: number; // milliseconds

  // Cultural routing (INFORMATION ONLY)
  culturalRouting?: boolean;
  communityNode?: boolean;
  educationalHub?: boolean;

  // Security properties
  trustLevel: number; // 0-100
  securityLevel: number; // 0-100
  verificationMethod: string;
}

// ============================================================================
// CULTURAL CONTEXT INTERFACES (EDUCATIONAL ONLY)
// ============================================================================

export interface CulturalContext {
  // Cultural identification (INFORMATION ONLY)
  culturalOrigin: string;
  culturalGroup: string;
  traditionalName?: string;

  // Cultural significance
  significance: CulturalSignificance;
  protocols: CulturalProtocol[];
  context: string[];

  // Educational information
  educationalResources: EducationalResource[];
  learningPathways: LearningPathway[];
  culturalEducation: string[];

  // Community information
  communityInformation: CommunityInfo;
  guardianInformation?: GuardianInfo;
  traditionKeepers: string[];

  // NO ACCESS CONTROL - INFORMATION ONLY
  informationOnly: true;
  educationalPurpose: true;
  accessGranted: true;
}

export interface CulturalSignificance {
  level: number; // 1-3 (educational scale)
  type: 'general' | 'traditional' | 'ceremonial' | 'sacred';
  description: string;
  educationalContext: string[];
  historicalImportance: string;
}

export interface CulturalProtocol {
  protocolType: string;
  description: string;
  educationalValue: string;
  learningOpportunity: string;
  communityInformation: string;
}

export interface TraditionalKnowledgeInfo {
  // Traditional knowledge classification (INFORMATION ONLY)
  knowledgeType: string;
  traditionalCategory: string;
  culturalOrigin: string;

  // Educational context
  educationalValue: string;
  learningObjectives: string[];
  culturalEducation: string[];

  // Source attribution
  traditionalSources: string[];
  communityAttribution: string[];
  keeperAcknowledgment: string[];

  // NO ACCESS RESTRICTIONS
  informationOnly: true;
  educationalAccess: true;
  transparentAttribution: true;
}

// ============================================================================
// ANTI-CENSORSHIP INTERFACES
// ============================================================================

export interface CensorshipRisk {
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100

  // Risk factors
  geographicRisk: GeographicRisk[];
  protocolRisk: ProtocolRisk[];
  contentRisk: ContentRisk[];

  // Mitigation strategies
  mitigationStrategies: MitigationStrategy[];
  alternativeRoutes: string[];
  backupMethods: string[];

  // Educational information
  censorshipEducation: string[];
  resistanceEducation: string[];
  rightsEducation: string[];
}

export interface GeographicRisk {
  region: string;
  riskLevel: number; // 0-100
  blockedProtocols: string[];
  restrictedContent: string[];
  mitigationMethods: string[];
}

export interface ProtocolRisk {
  protocol: string;
  vulnerabilities: string[];
  blockingMethods: string[];
  detectionRisk: number; // 0-100
  mitigationStrategies: string[];
}

export interface ContentRisk {
  riskType: string;
  description: string;
  likelihood: number; // 0-100
  impact: number; // 0-100
  mitigationOptions: string[];
}

export interface MitigationStrategy {
  strategyId: string;
  name: string;
  type: 'routing' | 'encryption' | 'obfuscation' | 'redundancy' | 'anonymization';
  effectiveness: number; // 0-100

  // Implementation details
  requirements: string[];
  limitations: string[];
  tradeoffs: string[];

  // Educational value
  educationalContext: string[];
  learningResources: string[];
}

export interface AlternativeSource {
  // Source information
  sourceId: string;
  sourceName: string;
  sourceType: string;

  // Access methods
  accessMethods: AccessMethod[];
  protocols: string[];
  endpoints: string[];

  // Reliability information
  reliability: number; // 0-100
  availability: number; // 0-100
  censorshipResistance: number; // 0-100

  // Content verification
  contentHash: string;
  verificationMethod: string;
  lastVerified: Date;

  // Educational context
  educationalValue: string;
  learningOpportunities: string[];
}

export interface AccessMethod {
  method: string;
  description: string;
  requirements: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';

  // Security properties
  anonymity: number; // 0-100
  encryption: boolean;
  detectability: number; // 0-100

  // Educational information
  educationalGuide: string;
  learningResources: string[];
  safetyConsiderations: string[];
}

// ============================================================================
// DISCOVERY STATE INTERFACES
// ============================================================================

export interface DiscoveryState {
  // Current discovery status
  isDiscovering: boolean;
  discoveryProgress: DiscoveryProgress;

  // Results management
  results: DiscoveryResult[];
  filteredResults: DiscoveryResult[];
  selectedResult?: DiscoveryResult;

  // Discovery history
  recentDiscoveries: RecentDiscovery[];
  savedQueries: SavedQuery[];

  // UI state
  activeTab: DiscoveryTab;
  selectedMethods: string[];
  filters: DiscoveryFilters;

  // Network state
  networkStatus: NetworkStatus;
  connectedNetworks: string[];
  availableMethods: DiscoveryMethod[];

  // Cultural state (INFORMATION ONLY)
  culturalContext: boolean;
  culturalFilters: CulturalFilters;
  educationalMode: boolean;
}

export interface DiscoveryProgress {
  // Progress tracking
  currentPhase: DiscoveryPhase;
  completedPhases: DiscoveryPhase[];
  overallProgress: number; // 0-100

  // Method progress
  methodProgress: MethodProgress[];
  networkProgress: NetworkProgress[];

  // Results streaming
  resultsFound: number;
  resultsProcessed: number;
  resultsVerified: number;

  // Time tracking
  startTime: Date;
  estimatedCompletion?: Date;
  elapsedTime: number; // milliseconds
}

export interface MethodProgress {
  methodId: string;
  methodName: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress: number; // 0-100

  // Results from this method
  resultsFound: number;
  uniqueResults: number;
  verifiedResults: number;

  // Performance metrics
  responseTime: number; // milliseconds
  successRate: number; // 0-100
  errorCount: number;
}

export interface NetworkProgress {
  networkId: string;
  networkName: string;
  protocol: string;
  status: 'connecting' | 'searching' | 'completed' | 'error';

  // Network-specific progress
  peersSearched: number;
  totalPeers: number;
  resultsContributed: number;

  // Cultural network metrics (INFORMATION ONLY)
  culturalPeers?: number;
  educationalResources?: number;
  communityContributions?: number;
}

// ============================================================================
// UI AND INTERACTION INTERFACES
// ============================================================================

export interface DiscoveryFilters {
  // Content filters
  contentTypes: ContentType[];
  languages: string[];
  dateRange: DateRange;
  sizeRange: SizeRange;

  // Quality filters
  minQuality: number; // 0-100
  minTrust: number; // 0-100
  requireVerification: boolean;

  // Cultural filters (INFORMATION ONLY)
  culturalOrigins: string[];
  sensitivityLevels: number[];
  traditionalKnowledge: boolean;

  // Source filters
  sourceTypes: SourceType[];
  networks: string[];
  includeAnonymous: boolean;

  // Anti-censorship filters
  censorshipResistant: boolean;
  hasAlternativeRoutes: boolean;
  minAnonymity: number; // 0-100
}

export interface CulturalFilters {
  // Cultural context display (INFORMATION ONLY)
  showCulturalContext: boolean;
  showTraditionalKnowledge: boolean;
  showEducationalContent: boolean;

  // Learning preferences
  educationalLevel: string[];
  learningObjectives: string[];
  culturalInterests: string[];

  // Display preferences
  culturalLanguages: string[];
  traditionalScripts: boolean;
  communityInformation: boolean;

  // NO ACCESS CONTROL
  informationOnly: true;
  educationalPurpose: true;
  accessUnrestricted: true;
}

export interface DiscoveryTab {
  id: string;
  name: string;
  type: 'results' | 'methods' | 'networks' | 'cultural' | 'educational';
  active: boolean;
  resultCount?: number;
  hasNewResults?: boolean;
}

export interface RecentDiscovery {
  discoveryId: string;
  query: string;
  timestamp: Date;
  resultCount: number;
  methods: string[];

  // Quick access
  topResults: DiscoveryResult[];
  averageQuality: number;
  culturalContent: boolean;
}

export interface SavedQuery {
  queryId: string;
  name: string;
  query: string;
  filters: DiscoveryFilters;

  // Query metadata
  createdAt: Date;
  lastUsed: Date;
  useCount: number;

  // Results history
  lastResultCount: number;
  averageQuality: number;
  successRate: number; // 0-100
}

// ============================================================================
// SUPPORTING TYPE DEFINITIONS
// ============================================================================

export type ContentType =
  | 'document'
  | 'book'
  | 'article'
  | 'research'
  | 'multimedia'
  | 'audio'
  | 'video'
  | 'image'
  | 'dataset'
  | 'software'
  | 'cultural_artifact'
  | 'traditional_knowledge'
  | 'educational_material';

export type SourceType =
  | 'peer'
  | 'archive'
  | 'library'
  | 'repository'
  | 'community'
  | 'institution'
  | 'individual'
  | 'traditional_keeper'
  | 'cultural_organization'
  | 'educational_institution';

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'trusted'
  | 'community_verified'
  | 'expert_verified'
  | 'institutionally_verified';

export type VerificationLevel =
  | 'none'
  | 'basic'
  | 'standard'
  | 'comprehensive'
  | 'cryptographic'
  | 'community'
  | 'expert'
  | 'institutional';

export type DiscoveryPhase =
  | 'initializing'
  | 'connecting'
  | 'searching'
  | 'verifying'
  | 'filtering'
  | 'ranking'
  | 'completing';

export type NetworkStatus = 'disconnected' | 'connecting' | 'connected' | 'degraded' | 'error';

export interface DateRange {
  start?: Date;
  end?: Date;
}

export interface SizeRange {
  min?: number; // bytes
  max?: number; // bytes
}

export interface EducationalResource {
  resourceId: string;
  title: string;
  type: string;
  description: string;
  url?: string;
  difficulty: string;
}

export interface LearningPathway {
  pathwayId: string;
  name: string;
  description: string;
  steps: string[];
  duration: string;
  prerequisites: string[];
}

export interface LearningOpportunity {
  opportunityId: string;
  title: string;
  description: string;
  type: string;
  resources: string[];
  difficulty: string;
}

export interface RelatedContent {
  contentId: string;
  title: string;
  relevance: number; // 0-100
  contentType: ContentType;
  culturalConnection?: string;
}

export interface CommunityInfo {
  communityName: string;
  role: string;
  information: string;
  educationalContext: string;
  learningOpportunities: string[];
}

export interface GuardianInfo {
  guardianName?: string;
  role: string;
  information: string;
  educationalContext: string;
  respectfulProtocols: string[];
}

// ============================================================================
// COMPONENT PROPS INTERFACE
// ============================================================================

export interface DecentralizedContentDiscoveryProps {
  // Discovery configuration
  initialQuery?: string;
  discoveryOptions?: Partial<DiscoveryOptions>;
  autoStart?: boolean;

  // UI customization
  variant?: 'default' | 'compact' | 'detailed' | 'embedded';
  showAdvancedOptions?: boolean;
  showCulturalContext?: boolean;
  showEducationalContent?: boolean;

  // Network preferences
  preferredNetworks?: string[];
  enableAnonymousDiscovery?: boolean;
  prioritizeCensorshipResistant?: boolean;

  // Cultural context (INFORMATION ONLY)
  culturalTheme?: 'indigenous' | 'traditional' | 'modern' | 'ceremonial' | 'community' | 'default';
  culturalLanguages?: string[];
  showTraditionalKnowledge?: boolean;

  // Event handlers
  onResultsFound?: (results: DiscoveryResult[]) => void;
  onResultSelected?: (result: DiscoveryResult) => void;
  onDiscoveryComplete?: (summary: DiscoverySummary) => void;
  onError?: (error: string) => void;
  onLearningOpportunitySelected?: (opportunity: LearningOpportunity) => void;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;

  // Integration
  className?: string;
  testId?: string;
}

export interface DiscoverySummary {
  discoveryId: string;
  totalResults: number;
  uniqueSources: number;
  networksSearched: number;
  methodsUsed: number;
  duration: number; // milliseconds
  averageQuality: number; // 0-100
  censorshipResistantResults: number;
  culturalContent: number;
  educationalOpportunities: number;
}
