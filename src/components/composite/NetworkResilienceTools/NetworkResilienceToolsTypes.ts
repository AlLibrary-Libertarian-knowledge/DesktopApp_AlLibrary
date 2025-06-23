/**
 * Network Resilience Tools Types
 *
 * Comprehensive type definitions for network resilience, censorship detection,
 * route-around capabilities, and anti-censorship network optimization.
 *
 * ANTI-CENSORSHIP CORE: Network resilience tools for detecting and circumventing
 * censorship with educational transparency and information freedom principles.
 */

// ============================================================================
// CORE RESILIENCE INTERFACES
// ============================================================================

export interface NetworkResilienceToolsProps {
  // Component configuration
  showNetworkHealth?: boolean;
  showCensorshipDetection?: boolean;
  showRouteOptimization?: boolean;
  showEducationalContent?: boolean;

  // Network preferences
  enableTorRouting?: boolean;
  enableI2PRouting?: boolean;
  enableDirectP2P?: boolean;
  enableMeshNetworking?: boolean;

  // Monitoring settings
  monitoringInterval?: number;
  alertThresholds?: AlertThresholds;
  autoRouteAround?: boolean;

  // Cultural integration
  culturalNetworkSupport?: boolean;
  culturalLanguages?: string[];
  showCulturalContext?: boolean;

  // Event handlers
  onCensorshipDetected?: (detection: CensorshipDetection) => void;
  onRouteOptimized?: (optimization: RouteOptimization) => void;
  onNetworkHealthChanged?: (health: NetworkHealth) => void;
  onLearningOpportunitySelected?: (opportunity: LearningOpportunity) => void;
  onError?: (error: string) => void;
}

export interface ResilienceState {
  // Monitoring status
  isMonitoring: boolean;
  lastCheck: Date;
  monitoringStarted: Date;

  // Network health
  networkHealth: NetworkHealth;
  connectionStatus: ConnectionStatus;
  routingStatus: RoutingStatus;

  // Censorship detection
  censorshipDetections: CensorshipDetection[];
  activeCensorship: CensorshipEvent[];
  censorshipHistory: CensorshipHistory[];

  // Route optimization
  activeRoutes: NetworkRoute[];
  backupRoutes: NetworkRoute[];
  optimizedRoutes: OptimizedRoute[];
  routePerformance: RoutePerformance[];

  // Tools status
  availableTools: ResilienceTool[];
  activeTools: string[];
  toolsConfig: ToolsConfiguration;

  // Educational content
  learningOpportunities: LearningOpportunity[];
  educationalMode: boolean;
  censorshipEducation: CensorshipEducation;

  // Cultural integration
  culturalNetworks: CulturalNetworkInfo[];
  culturalRouting: CulturalRoutingInfo;
  communityNetworkStatus: CommunityNetworkStatus;
}

// ============================================================================
// NETWORK HEALTH MONITORING
// ============================================================================

export interface NetworkHealth {
  overallScore: number; // 0-100
  components: HealthComponent[];
  timestamp: Date;
  trend: HealthTrend;
  alerts: HealthAlert[];
  recommendations: HealthRecommendation[];

  // Specific metrics
  connectivity: ConnectivityHealth;
  throughput: ThroughputHealth;
  latency: LatencyHealth;
  reliability: ReliabilityHealth;
  security: SecurityHealth;
  censorship: CensorshipHealth;
}

export interface HealthComponent {
  name: string;
  type: HealthComponentType;
  score: number; // 0-100
  status: ComponentStatus;
  description: string;
  lastChecked: Date;
  trend: 'improving' | 'stable' | 'degrading';
  alerts: string[];
  recommendations: string[];
}

export type HealthComponentType =
  | 'connectivity'
  | 'throughput'
  | 'latency'
  | 'reliability'
  | 'security'
  | 'censorship'
  | 'cultural_routing'
  | 'community_network';

export type ComponentStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'unknown';

export interface ConnectivityHealth {
  activeConnections: number;
  maxConnections: number;
  connectionSuccess: number; // percentage
  peerReachability: number; // percentage
  networkReachability: number; // percentage
  protocolSuccess: ProtocolSuccess[];
}

export interface ThroughputHealth {
  downloadSpeed: number; // bytes per second
  uploadSpeed: number; // bytes per second
  averageSpeed: number; // bytes per second
  speedConsistency: number; // percentage
  networkEfficiency: number; // percentage
  bottlenecks: Bottleneck[];
}

export interface LatencyHealth {
  averageLatency: number; // milliseconds
  minLatency: number; // milliseconds
  maxLatency: number; // milliseconds
  jitter: number; // milliseconds
  timeouts: number; // count
  qualityScore: number; // 0-100
}

export interface ReliabilityHealth {
  uptime: number; // percentage
  connectionStability: number; // percentage
  dataIntegrity: number; // percentage
  errorRate: number; // percentage
  recoveryTime: number; // milliseconds
  failureHistory: FailureEvent[];
}

export interface SecurityHealth {
  encryptionStatus: EncryptionStatus;
  authenticityVerification: number; // percentage
  privacyLevel: number; // 0-100
  securityThreats: SecurityThreat[];
  vulnerabilities: Vulnerability[];
  protectionLevel: ProtectionLevel;
}

export interface CensorshipHealth {
  censorshipRisk: number; // 0-100
  blockingDetected: boolean;
  throttlingDetected: boolean;
  filteringDetected: boolean;
  routeAroundSuccess: number; // percentage
  resistanceLevel: number; // 0-100
}

// ============================================================================
// CENSORSHIP DETECTION
// ============================================================================

export interface CensorshipDetection {
  detectionId: string;
  timestamp: Date;
  detectionType: CensorshipType;
  severity: CensorshipSeverity;
  confidence: number; // 0-100

  // Detection details
  targetResource: string;
  blockingMethod: BlockingMethod;
  affectedProtocols: string[];
  geographicScope: GeographicScope;

  // Evidence
  evidence: CensorshipEvidence[];
  testResults: CensorshipTestResult[];
  confirmations: CensorshipConfirmation[];

  // Response
  responseStrategy: ResponseStrategy;
  routeAroundOptions: RouteAroundOption[];
  educationalContent: CensorshipEducation;

  // Cultural context
  culturalImpact: CulturalImpact;
  affectedCommunities: string[];
  culturalEducation: string[];
}

export type CensorshipType =
  | 'content_blocking'
  | 'domain_blocking'
  | 'ip_blocking'
  | 'protocol_blocking'
  | 'traffic_throttling'
  | 'deep_packet_inspection'
  | 'dns_poisoning'
  | 'man_in_middle'
  | 'cultural_filtering'
  | 'information_manipulation';

export type CensorshipSeverity = 'minimal' | 'moderate' | 'significant' | 'severe' | 'complete';

export type BlockingMethod =
  | 'dns_blocking'
  | 'ip_blocking'
  | 'url_filtering'
  | 'keyword_filtering'
  | 'protocol_blocking'
  | 'traffic_shaping'
  | 'connection_reset'
  | 'timeout_manipulation';

export interface CensorshipEvidence {
  evidenceType: EvidenceType;
  description: string;
  timestamp: Date;
  reliability: number; // 0-100
  source: string;
  testMethod: string;
  rawData: any;
  educationalValue: string;
}

export type EvidenceType =
  | 'connection_failure'
  | 'timeout_pattern'
  | 'response_manipulation'
  | 'traffic_analysis'
  | 'protocol_interference'
  | 'dns_inconsistency'
  | 'geographic_variation'
  | 'cultural_targeting';

export interface CensorshipTestResult {
  testId: string;
  testType: CensorshipTestType;
  timestamp: Date;
  duration: number; // milliseconds
  result: TestResult;
  details: TestDetails;
  educationalInsights: string[];
}

export type CensorshipTestType =
  | 'connectivity_test'
  | 'dns_resolution_test'
  | 'protocol_test'
  | 'content_access_test'
  | 'speed_test'
  | 'anonymity_test'
  | 'geographic_test'
  | 'cultural_access_test';

export type TestResult =
  | 'passed'
  | 'failed'
  | 'inconclusive'
  | 'blocked'
  | 'throttled'
  | 'filtered';

// ============================================================================
// ROUTE OPTIMIZATION
// ============================================================================

export interface RouteOptimization {
  optimizationId: string;
  timestamp: Date;
  optimizationType: OptimizationType;
  trigger: OptimizationTrigger;

  // Original route
  originalRoute: NetworkRoute;
  originalPerformance: RoutePerformance;

  // Optimized route
  optimizedRoute: NetworkRoute;
  expectedPerformance: RoutePerformance;
  actualPerformance?: RoutePerformance;

  // Optimization details
  optimizationSteps: OptimizationStep[];
  algorithms: OptimizationAlgorithm[];
  constraints: RouteConstraint[];

  // Success metrics
  improvementMetrics: ImprovementMetrics;
  qualityScore: number; // 0-100
  stabilityScore: number; // 0-100

  // Cultural considerations
  culturalRouting: boolean;
  communityPreferences: CommunityPreferences;
  educationalValue: string[];
}

export type OptimizationType =
  | 'latency_optimization'
  | 'throughput_optimization'
  | 'reliability_optimization'
  | 'security_optimization'
  | 'censorship_avoidance'
  | 'cost_optimization'
  | 'cultural_optimization'
  | 'community_optimization';

export type OptimizationTrigger =
  | 'performance_degradation'
  | 'censorship_detected'
  | 'route_failure'
  | 'user_request'
  | 'scheduled_optimization'
  | 'cultural_requirement'
  | 'community_preference';

export interface NetworkRoute {
  routeId: string;
  routeName: string;
  routeType: RouteType;
  protocols: ProtocolStack[];

  // Route path
  hops: RouteHop[];
  endpoints: RouteEndpoint[];
  intermediates: RouteIntermediate[];

  // Route characteristics
  characteristics: RouteCharacteristics;
  performance: RoutePerformance;
  reliability: RouteReliability;
  security: RouteSecurity;

  // Censorship resistance
  censorshipResistance: CensorshipResistance;
  routeAroundCapability: RouteAroundCapability;

  // Cultural integration
  culturalSupport: CulturalRouteSupport;
  communityNodes: CommunityNode[];
  traditionalPaths: TraditionalPath[];
}

export type RouteType = 'direct' | 'tor' | 'i2p' | 'mesh' | 'hybrid' | 'cultural' | 'community';

export interface RouteHop {
  hopId: string;
  nodeId: string;
  nodeType: NodeType;
  protocol: string;

  // Location and network
  geographicLocation?: GeographicLocation;
  networkProvider?: string;
  jurisdiction?: string;

  // Performance
  latency: number; // milliseconds
  bandwidth: number; // bytes per second
  reliability: number; // percentage

  // Security and privacy
  encryption: boolean;
  anonymity: boolean;
  logging: boolean;

  // Cultural information
  culturalAffiliation?: string;
  communityRole?: string;
  traditionalSignificance?: string;
  educationalValue?: string;
}

export type NodeType = 'entry' | 'relay' | 'exit' | 'bridge' | 'guard' | 'cultural' | 'community';

// ============================================================================
// RESILIENCE TOOLS
// ============================================================================

export interface ResilienceTool {
  toolId: string;
  toolName: string;
  toolType: ToolType;
  description: string;

  // Capabilities
  capabilities: ToolCapability[];
  supportedProtocols: string[];
  operatingModes: OperatingMode[];

  // Configuration
  configuration: ToolConfiguration;
  requirements: ToolRequirement[];
  limitations: ToolLimitation[];

  // Status
  status: ToolStatus;
  performance: ToolPerformance;
  usage: ToolUsage;

  // Educational content
  educationalResources: EducationalResource[];
  usageGuide: UsageGuide;
  troubleshooting: TroubleshootingGuide;

  // Cultural integration
  culturalSupport: CulturalToolSupport;
  communityEndorsement: CommunityEndorsement[];
  traditionalEquivalent?: TraditionalEquivalent;
}

export type ToolType =
  | 'censorship_detector'
  | 'route_optimizer'
  | 'traffic_obfuscator'
  | 'connection_multiplexer'
  | 'bandwidth_aggregator'
  | 'latency_reducer'
  | 'anonymity_enhancer'
  | 'integrity_verifier'
  | 'cultural_router'
  | 'community_connector'
  | 'educational_enhancer';

export interface ToolCapability {
  capability: string;
  effectiveness: number; // 0-100
  reliability: number; // 0-100
  requirements: string[];
  limitations: string[];
  educationalValue: string;
}

export interface ToolConfiguration {
  configId: string;
  parameters: ConfigParameter[];
  presets: ConfigPreset[];
  customizations: ConfigCustomization[];
  culturalSettings: CulturalSettings;
}

export interface ConfigParameter {
  name: string;
  type: ParameterType;
  value: any;
  defaultValue: any;
  validRange?: ValueRange;
  description: string;
  educationalContext: string;
}

export type ParameterType = 'boolean' | 'integer' | 'float' | 'string' | 'array' | 'object';

// ============================================================================
// EDUCATIONAL & CULTURAL INTEGRATION
// ============================================================================

export interface CensorshipEducation {
  educationId: string;
  title: string;
  description: string;
  educationLevel: EducationLevel;

  // Educational content
  concepts: EducationalConcept[];
  principles: CensorshipPrinciple[];
  techniques: CensorshipTechnique[];
  countermeasures: Countermeasure[];

  // Learning resources
  resources: EducationalResource[];
  exercises: LearningExercise[];
  assessments: LearningAssessment[];

  // Cultural context
  culturalPerspectives: CulturalPerspective[];
  historicalContext: HistoricalContext[];
  globalExamples: GlobalExample[];

  // Information freedom
  rightsEducation: RightsEducation[];
  ethicalConsiderations: EthicalConsideration[];
  responsibleUse: ResponsibleUseGuideline[];
}

export type EducationLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert'
  | 'academic'
  | 'community';

export interface EducationalConcept {
  conceptId: string;
  name: string;
  description: string;
  difficulty: EducationLevel;
  prerequisites: string[];
  learningObjectives: LearningObjective[];
  culturalContext: string[];
  realWorldExamples: RealWorldExample[];
}

export interface CensorshipPrinciple {
  principleId: string;
  name: string;
  description: string;
  category: PrincipleCategory;
  importance: ImportanceLevel;
  applications: PrincipleApplication[];
  culturalVariations: CulturalVariation[];
  ethicalImplications: EthicalImplication[];
}

export type PrincipleCategory =
  | 'information_freedom'
  | 'digital_rights'
  | 'privacy_protection'
  | 'cultural_preservation'
  | 'community_empowerment'
  | 'educational_access'
  | 'technological_sovereignty';

export type ImportanceLevel = 'fundamental' | 'important' | 'useful' | 'contextual' | 'cultural';

export interface LearningOpportunity {
  opportunityId: string;
  title: string;
  description: string;
  type: OpportunityType;
  difficulty: EducationLevel;

  // Content
  content: LearningContent[];
  activities: LearningActivity[];
  resources: EducationalResource[];

  // Cultural integration
  culturalRelevance: CulturalRelevance;
  communityConnection: CommunityConnection;
  traditionalKnowledge: TraditionalKnowledge;

  // Learning outcomes
  objectives: LearningObjective[];
  competencies: LearningCompetency[];
  assessments: LearningAssessment[];
}

export type OpportunityType =
  | 'tutorial'
  | 'workshop'
  | 'simulation'
  | 'case_study'
  | 'project'
  | 'community_practice';

// ============================================================================
// CULTURAL NETWORK INTEGRATION
// ============================================================================

export interface CulturalNetworkInfo {
  networkId: string;
  networkName: string;
  culturalGroup: string;
  traditionalName?: string;

  // Network characteristics
  networkType: CulturalNetworkType;
  connectionProtocols: string[];
  routingPreferences: RoutingPreference[];

  // Community information
  communitySize: number;
  activeNodes: number;
  culturalNodes: number;
  elderNodes: number;

  // Cultural context
  culturalSignificance: CulturalSignificance;
  traditionalProtocols: TraditionalProtocol[];
  educationalResources: CulturalEducationalResource[];

  // Network health
  networkHealth: CulturalNetworkHealth;
  communityEngagement: CommunityEngagement;
  culturalPreservation: CulturalPreservation;

  // Educational value
  learningOpportunities: CulturalLearningOpportunity[];
  culturalEducation: CulturalEducationProgram[];
  knowledgeSharing: KnowledgeSharing;
}

export type CulturalNetworkType =
  | 'indigenous'
  | 'traditional'
  | 'academic'
  | 'community'
  | 'ceremonial'
  | 'educational';

export interface CulturalRoutingInfo {
  routingId: string;
  culturalPreferences: CulturalPreference[];
  respectfulRouting: RespectfulRouting;
  communityPriorities: CommunityPriority[];
  traditionalPaths: TraditionalPathInfo[];
  educationalRouting: EducationalRouting;
}

export interface CommunityNetworkStatus {
  statusId: string;
  timestamp: Date;
  overallHealth: number; // 0-100

  // Community metrics
  activeMembers: number;
  participationRate: number; // percentage
  engagementLevel: number; // 0-100

  // Cultural metrics
  culturalActivity: CulturalActivity[];
  traditionalPractices: TraditionalPractice[];
  knowledgePreservation: KnowledgePreservation[];

  // Educational metrics
  learningActivities: LearningActivity[];
  educationalContributions: EducationalContribution[];
  knowledgeTransfer: KnowledgeTransfer[];

  // Network resilience
  censorshipResistance: number; // 0-100
  routeResilience: number; // 0-100
  informationIntegrity: number; // 0-100
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface AlertThresholds {
  healthScoreThreshold: number;
  latencyThreshold: number;
  throughputThreshold: number;
  reliabilityThreshold: number;
  censorshipRiskThreshold: number;
  securityThreatThreshold: number;
}

export interface ConnectionStatus {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  activeConnections: number;
  totalAttempts: number;
  successRate: number;
  lastConnected: Date;
  connectionQuality: number; // 0-100
}

export interface RoutingStatus {
  primaryRoute: NetworkRoute;
  backupRoutes: NetworkRoute[];
  activeOptimizations: RouteOptimization[];
  routeChanges: RouteChange[];
  routingEfficiency: number; // 0-100
}

export interface CensorshipEvent {
  eventId: string;
  timestamp: Date;
  eventType: CensorshipType;
  severity: CensorshipSeverity;
  duration: number; // milliseconds
  affectedResources: string[];
  educationalContent: string[];
}

export interface CensorshipHistory {
  historyId: string;
  timeRange: TimeRange;
  events: CensorshipEvent[];
  patterns: CensorshipPattern[];
  trends: CensorshipTrend[];
  educationalInsights: EducationalInsight[];
}

export interface OptimizedRoute {
  routeId: string;
  optimizedAt: Date;
  optimization: RouteOptimization;
  performance: RoutePerformance;
  stability: RouteStability;
  culturalAlignment: CulturalAlignment;
}

export interface RoutePerformance {
  latency: number; // milliseconds
  throughput: number; // bytes per second
  reliability: number; // percentage
  efficiency: number; // percentage
  qualityScore: number; // 0-100
  measurementTime: Date;
}

export interface ToolsConfiguration {
  configId: string;
  globalSettings: GlobalSettings;
  toolSpecificSettings: Record<string, any>;
  culturalSettings: CulturalSettings;
  educationalSettings: EducationalSettings;
}

export interface LearningObjective {
  objectiveId: string;
  description: string;
  category: ObjectiveCategory;
  level: EducationLevel;
  culturalRelevance: number; // 0-100
  assessmentMethod: AssessmentMethod;
}

export type ObjectiveCategory =
  | 'technical_understanding'
  | 'cultural_awareness'
  | 'ethical_reasoning'
  | 'practical_application'
  | 'critical_thinking'
  | 'community_engagement'
  | 'information_literacy';

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface TimeRange {
  start: Date;
  end: Date;
  duration: number; // milliseconds
}

export interface GeographicLocation {
  country: string;
  region?: string;
  city?: string;
  coordinates?: Coordinates;
  jurisdiction: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ValueRange {
  min: any;
  max: any;
  step?: any;
}

export interface HealthTrend {
  direction: 'improving' | 'stable' | 'degrading';
  rate: number;
  confidence: number; // 0-100
  timeframe: number; // milliseconds
}

export interface HealthAlert {
  alertId: string;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  category: AlertCategory;
  educationalContext: string;
}

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AlertCategory = 'performance' | 'security' | 'censorship' | 'cultural' | 'educational';
