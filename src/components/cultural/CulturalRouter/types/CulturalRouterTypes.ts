/**
 * CulturalRouter Types - Culturally-Aware Content Routing
 *
 * Provides intelligent routing of cultural content through P2P networks while
 * respecting cultural protocols and maintaining information accessibility.
 *
 * ANTI-CENSORSHIP PRINCIPLES:
 * - Routes content to maximize accessibility
 * - Provides educational context without blocking content
 * - Supports multiple cultural perspectives equally
 * - Maintains information integrity across routes
 */

// Core routing interfaces
export interface CulturalRoute {
  id: string;
  sourcePeerId: string;
  targetPeerId: string;
  contentHash: string;
  culturalLevel: number;
  routingPath: RouteHop[];
  educationalContext?: EducationalRouting;
  estimatedLatency: number;
  reliability: number;
  created: Date;
}

export interface RouteHop {
  peerId: string;
  peerName?: string;
  culturalAffiliation?: string[];
  trustLevel: number;
  latency: number;
  bandwidth: number;
  geographicLocation?: string;
  isEducationalNode: boolean;
}

export interface EducationalRouting {
  contextProvided: string[];
  learningResources: LearningResource[];
  alternativeViewpoints: AlternativeViewpoint[];
  sourceAuthenticity: AuthenticityInfo;
}

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  url?: string;
  contentType: 'article' | 'video' | 'audio' | 'interactive';
  culturalContext: string;
  educationalLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface AlternativeViewpoint {
  id: string;
  perspective: string;
  source: string;
  description: string;
  supportingEvidence?: string[];
  culturalOrigin: string;
}

export interface AuthenticityInfo {
  verified: boolean;
  sources: string[];
  verificationMethod: string;
  lastVerified: Date;
  conflictingClaims?: ConflictingClaim[];
}

export interface ConflictingClaim {
  claim: string;
  source: string;
  evidence?: string[];
  perspective: string;
}

// Routing strategy interfaces
export interface RoutingStrategy {
  id: string;
  name: string;
  description: string;
  priority: number;
  culturalConsiderations: CulturalConsideration[];
  antiCensorshipFeatures: AntiCensorshipFeature[];
  educationalEnhancement: boolean;
}

export interface CulturalConsideration {
  type: 'information-display' | 'educational-context' | 'source-transparency';
  description: string;
  implementation: string;
  respectsMultiplePerspectives: boolean;
}

export interface AntiCensorshipFeature {
  type:
    | 'route-diversity'
    | 'content-mirroring'
    | 'educational-bypass'
    | 'transparency-preservation';
  description: string;
  strength: 'low' | 'medium' | 'high';
  activationConditions: string[];
}

// Network state interfaces
export interface CulturalNetworkState {
  connectedPeers: CulturalPeer[];
  availableRoutes: CulturalRoute[];
  networkHealth: NetworkHealth;
  educationalNodes: EducationalNode[];
  censorshipStatus: CensorshipStatus;
}

export interface CulturalPeer {
  id: string;
  displayName: string;
  culturalBackground?: string;
  educationalRole?: 'learner' | 'educator' | 'scholar' | 'community-member';
  trustScore: number;
  responsiveness: number;
  bandwidth: number;
  geographicRegion?: string;
  supportsEducation: boolean;
  lastSeen: Date;
}

export interface EducationalNode {
  peerId: string;
  institutionName?: string;
  specializations: string[];
  resourcesAvailable: LearningResource[];
  culturalExpertise: string[];
  accessibilityFeatures: AccessibilityFeature[];
  isOpenAccess: boolean;
}

export interface AccessibilityFeature {
  type: 'screen-reader' | 'high-contrast' | 'large-text' | 'audio-description' | 'subtitles';
  languages: string[];
  description: string;
}

export interface NetworkHealth {
  overallHealth: number;
  routeAvailability: number;
  educationalCoverage: number;
  diversityIndex: number;
  censorshipResistance: number;
  informationIntegrity: number;
}

export interface CensorshipStatus {
  level: 'none' | 'low' | 'medium' | 'high' | 'severe';
  affectedRegions: string[];
  blockedContent: BlockedContent[];
  workarounds: CensorshipWorkaround[];
  educationalBypass: boolean;
}

export interface BlockedContent {
  contentHash: string;
  blockingRegions: string[];
  blockingMethods: string[];
  alternativeAccess: AlternativeAccess[];
  educationalJustification: string;
}

export interface CensorshipWorkaround {
  method: 'educational-routing' | 'geographic-bypass' | 'mirror-content' | 'transparency-advocacy';
  description: string;
  effectiveness: number;
  implementationStatus: 'available' | 'in-progress' | 'planned';
}

export interface AlternativeAccess {
  method: 'mirror-site' | 'educational-portal' | 'academic-access' | 'community-sharing';
  url?: string;
  description: string;
  requirements?: string[];
}

// Component props and event interfaces
export interface CulturalRouterProps {
  networkState: CulturalNetworkState;
  onRouteSelected?: (route: CulturalRoute) => void;
  onEducationalRequest?: (contentHash: string) => void;
  onCensorshipDetected?: (status: CensorshipStatus) => void;
  showEducationalContext?: boolean;
  enableAntiCensorship?: boolean;
  maxRoutes?: number;
  preferEducationalNodes?: boolean;
  className?: string;
}

// Router configuration
export interface CulturalRouterConfig {
  preferredRoutingStrategies: RoutingStrategy[];
  educationalPriority: number;
  diversityRequirement: number;
  antiCensorshipLevel: 'basic' | 'enhanced' | 'maximum';
  transparencyLevel: 'full' | 'balanced' | 'minimal';
  supportMultiplePerspectives: boolean;
  enableInformationIntegrity: boolean;
}

// Routing request and response
export interface RoutingRequest {
  contentHash: string;
  culturalLevel: number;
  educationalContext: boolean;
  sourceRegion?: string;
  targetRegion?: string;
  priorityLevel: 'low' | 'normal' | 'high' | 'urgent';
  accessibilityRequirements?: AccessibilityFeature[];
}

export interface RoutingResponse {
  routes: CulturalRoute[];
  educationalOptions: EducationalOption[];
  censorshipStatus: CensorshipStatus;
  alternativeAccess: AlternativeAccess[];
  integrityVerification: IntegrityVerification;
}

export interface EducationalOption {
  route: CulturalRoute;
  educationalValue: number;
  learningPath: LearningResource[];
  culturalContext: string;
  alternativePerspectives: AlternativeViewpoint[];
}

export interface IntegrityVerification {
  verified: boolean;
  method: string;
  confidence: number;
  lastChecked: Date;
  potentialIssues: IntegrityIssue[];
}

export interface IntegrityIssue {
  type: 'tampering' | 'outdated' | 'conflicting-sources' | 'unverified-claims';
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
}

// Event system
export interface CulturalRouterEvents {
  'route-established': CulturalRoute;
  'educational-content-requested': { contentHash: string; educationalLevel: string };
  'censorship-detected': CensorshipStatus;
  'integrity-verified': IntegrityVerification;
  'alternative-perspective-available': AlternativeViewpoint;
  'network-health-updated': NetworkHealth;
}

// Anti-censorship specific types
export interface AntiCensorshipRoute {
  route: CulturalRoute;
  censorshipBypass: CensorshipWorkaround[];
  educationalJustification: string;
  transparencyMeasures: TransparencyMeasure[];
  communitySupport: CommunitySupport;
}

export interface TransparencyMeasure {
  type:
    | 'source-attribution'
    | 'routing-disclosure'
    | 'method-explanation'
    | 'community-verification';
  description: string;
  implementation: string;
  verificationMethod: string;
}

export interface CommunitySupport {
  supportingCommunities: string[];
  endorsements: Endorsement[];
  educationalValue: number;
  consensusLevel: number;
}

export interface Endorsement {
  community: string;
  endorser: string;
  reasoning: string;
  date: Date;
  credibility: number;
}

// Real-time monitoring
export interface CulturalRouterState {
  activeRoutes: CulturalRoute[];
  routingPerformance: RoutingPerformance;
  educationalActivity: EducationalActivity;
  censorshipMonitoring: CensorshipMonitoring;
  integrityStatus: IntegrityStatus;
}

export interface RoutingPerformance {
  averageLatency: number;
  successRate: number;
  educationalEnhancement: number;
  diversityMaintained: number;
  censorshipCircumvention: number;
}

export interface EducationalActivity {
  activeEducationalRoutes: number;
  learningResourcesShared: number;
  culturalContextProvided: number;
  alternativePerspectivesOffered: number;
}

export interface CensorshipMonitoring {
  blockedAttempts: number;
  successfulWorkarounds: number;
  educationalBypasses: number;
  transparencyReports: number;
}

export interface IntegrityStatus {
  verifiedContent: number;
  integrityIssuesDetected: number;
  alternativeSourcesAvailable: number;
  communityVerifications: number;
}
