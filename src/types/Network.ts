/**
 * Network Types for P2P and Decentralized Networking
 *
 * Type definitions for censorship-resistant networking, community sovereignty,
 * and anti-censorship P2P features.
 */

import type { CulturalMetadata } from './Cultural';

/**
 * P2P Node representation
 */
export interface P2PNode {
  /** Unique node identifier */
  id: string;

  /** Node public key for verification */
  publicKey: string;

  /** Node configuration */
  config: NetworkConfig;

  /** Current node status */
  status: NodeStatus;

  /** Supported protocols */
  protocols: string[];

  /** Network addresses */
  addresses: NetworkAddress[];

  /** Anti-censorship capabilities */
  capabilities: NodeCapabilities;
}

/**
 * Network configuration with anti-censorship settings
 */
export interface NetworkConfig {
  /** Node display name */
  name?: string;

  /** Enable TOR routing */
  torSupport: boolean;

  /** Enable IPFS content addressing */
  ipfsEnabled: boolean;

  /** Maximum number of peer connections */
  maxConnections: number;

  /** Port configuration */
  ports: {
    p2p: number;
    http?: number;
    tor?: number;
  };

  /** Anti-censorship settings (MANDATORY) */
  enableCulturalFiltering: false; // MUST be false
  enableContentBlocking: false; // MUST be false
  educationalMode: true; // MUST be true
  communityInformationOnly: true; // MUST be true
  resistCensorship: true; // MUST be true
  preserveAlternatives: true; // MUST be true

  /** Community participation settings */
  communityNetworks: string[];

  /** Content sharing preferences */
  contentSharing: ContentSharingConfig;

  /** Security settings */
  security: SecurityConfig;
}

/**
 * Content sharing configuration
 */
export interface ContentSharingConfig {
  /** Automatically share new content */
  autoShare: boolean;

  /** Share cultural information and context */
  shareCulturalContext: boolean;

  /** Support multiple perspectives */
  supportMultiplePerspectives: boolean;

  /** Enable educational sharing */
  enableEducationalSharing: boolean;

  /** Maximum content size to share (bytes) */
  maxContentSize: number;

  /** Allowed content types */
  allowedContentTypes: string[];
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** Enable end-to-end encryption */
  encryption: boolean;

  /** Encryption algorithm */
  encryptionAlgorithm: string;

  /** Enable content verification */
  verifyContent: boolean;

  /** Enable peer verification */
  verifyPeers: boolean;

  /** Key rotation interval (hours) */
  keyRotationInterval: number;
}

/**
 * Node status enumeration
 */
export enum NodeStatus {
  OFFLINE = 'offline',
  STARTING = 'starting',
  ONLINE = 'online',
  CONNECTING = 'connecting',
  ERROR = 'error',
  STOPPING = 'stopping',
}

/**
 * Network address
 */
export interface NetworkAddress {
  /** Address type */
  type: 'tcp' | 'udp' | 'tor' | 'ipfs';

  /** Address string */
  address: string;

  /** Port number */
  port?: number;

  /** Whether this is a public address */
  public: boolean;
}

/**
 * Node capabilities for anti-censorship
 */
export interface NodeCapabilities {
  /** TOR/onion routing support */
  torSupport: boolean;

  /** IPFS content addressing */
  ipfsSupport: boolean;

  /** Cultural information sharing */
  culturalSharing: boolean;

  /** Educational context provision */
  educationalSupport: boolean;

  /** Alternative narrative support */
  alternativeNarratives: boolean;

  /** Censorship resistance level (0-1) */
  censorshipResistance: number;

  /** Community network participation */
  communityNetworks: boolean;

  /** Content verification */
  contentVerification: boolean;
}

/**
 * Peer representation
 */
export interface Peer {
  /** Peer identifier */
  id: string;

  /** Peer display name */
  name?: string;

  /** Connection status */
  connected: boolean;

  /** Peer addresses */
  addresses: NetworkAddress[];

  /** Peer capabilities */
  capabilities: NodeCapabilities;

  /** Cultural affiliations (informational only) */
  culturalAffiliations?: string[];

  /** Community memberships (informational only) */
  communityMemberships?: string[];

  /** Connection quality */
  connectionQuality: ConnectionQuality;

  /** Trust level (0-1) */
  trustLevel: number;

  /** Last seen timestamp */
  lastSeen: Date;

  /** Shared content count */
  sharedContentCount: number;
}

/**
 * Connection quality metrics
 */
export interface ConnectionQuality {
  /** Latency in milliseconds */
  latency: number;

  /** Bandwidth in bytes/second */
  bandwidth: number;

  /** Connection stability (0-1) */
  stability: number;

  /** Error rate (0-1) */
  errorRate: number;
}

/**
 * Content hash for IPFS addressing
 */
export interface ContentHash {
  /** IPFS content hash */
  ipfsHash: string;

  /** Content type */
  contentType: 'document' | 'collection' | 'metadata';

  /** Content size in bytes */
  size: number;

  /** Verification hash */
  verificationHash: string;

  /** Cultural metadata hash (if applicable) */
  culturalMetadataHash?: string;

  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Synchronization request
 */
export interface SyncRequest {
  /** Content to synchronize */
  contentHashes: ContentHash[];

  /** Target peer(s) */
  targetPeers?: string[];

  /** Sync priority */
  priority: SyncPriority;

  /** Include cultural content */
  includeCulturalContent: boolean;

  /** Preserve alternative narratives */
  preserveAlternatives: boolean;

  /** Educational mode */
  educationalMode: boolean;

  /** Community information only */
  communityInformationOnly: boolean;
}

/**
 * Sync priority levels
 */
export enum SyncPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Network status
 */
export interface NetworkStatus {
  /** Node status */
  nodeStatus: NodeStatus;

  /** Number of connected peers */
  connectedPeers: number;

  /** Total discovered peers */
  discoveredPeers: number;

  /** TOR status */
  torStatus: TorStatus;

  /** IPFS status */
  ipfsStatus: boolean;

  /** Network health (0-1) */
  networkHealth: number;

  /** Censorship resistance status */
  censorshipResistance: CensorshipResistanceStatus;

  /** Active community networks */
  activeCommunityNetworks: string[];

  /** Content sharing statistics */
  contentStats: ContentStats;
}

/**
 * TOR status
 */
export interface TorStatus {
  /** TOR enabled */
  enabled: boolean;

  /** Connection status */
  connected: boolean;

  /** Hidden service addresses */
  hiddenServices: string[];

  /** Circuit status */
  circuitStatus: 'building' | 'ready' | 'failed';
}

/**
 * Censorship resistance status
 */
export interface CensorshipResistanceStatus {
  /** Overall resistance level (0-1) */
  level: number;

  /** TOR connectivity */
  torConnectivity: boolean;

  /** Hidden service access */
  hiddenServiceAccess: boolean;

  /** Content filtering bypass */
  contentFilteringBypass: boolean;

  /** Cultural blocking resistance */
  culturalBlockingResistance: boolean;

  /** Alternative narrative support */
  alternativeNarrativeSupport: boolean;
}

/**
 * Content statistics
 */
export interface ContentStats {
  /** Total content shared */
  totalShared: number;

  /** Total content received */
  totalReceived: number;

  /** Cultural content shared */
  culturalContentShared: number;

  /** Educational content shared */
  educationalContentShared: number;

  /** Alternative narratives shared */
  alternativeNarrativesShared: number;

  /** Community content shared */
  communityContentShared: number;
}

/**
 * Peer discovery options
 */
export interface PeerDiscoveryOptions {
  /** Include TOR peers */
  includeTorPeers?: boolean;

  /** Include hidden services */
  includeHiddenServices?: boolean;

  /** Maximum peers to discover */
  maxPeers?: number;

  /** Discovery timeout (seconds) */
  timeout?: number;

  /** Respect cultural boundaries (MUST be false for anti-censorship) */
  respectCulturalBoundaries?: false;

  /** Enable educational sharing */
  enableEducationalSharing?: boolean;

  /** Support alternative narratives */
  supportAlternativeNarratives?: boolean;

  /** Community network filters */
  communityNetworks?: string[];
}

/**
 * Content request options
 */
export interface ContentRequest {
  /** Content hash to request */
  contentHash: ContentHash;

  /** Preferred peer */
  preferredPeer?: string;

  /** Request priority */
  priority: SyncPriority;

  /** Bypass cultural filters (MUST be true) */
  bypassCulturalFilters: true;

  /** Include educational context */
  includeEducationalContext: boolean;

  /** Support alternative views */
  supportAlternativeViews: boolean;

  /** Resist censorship */
  resistCensorship: boolean;
}

/**
 * Network metrics
 */
export interface NetworkMetrics {
  /** Network performance */
  performance: {
    averageLatency: number;
    totalBandwidth: number;
    messagesSent: number;
    messagesReceived: number;
    errorRate: number;
  };

  /** Censorship resistance metrics */
  censorshipResistance: {
    torConnections: number;
    hiddenServiceConnections: number;
    censorshipAttempts: number;
    successfulBypasses: number;
    alternativeRoutes: number;
  };

  /** Cultural information metrics */
  culturalSharing: {
    culturalContentShared: number;
    educationalContextProvided: number;
    alternativeNarrativesSupported: number;
    communityInteractions: number;
  };

  /** Network health */
  health: {
    nodeUptime: number;
    connectionStability: number;
    peerDiversity: number;
    contentAvailability: number;
  };
}

/**
 * Community network information
 */
export interface CommunityNetwork {
  /** Community identifier */
  id: string;

  /** Community name */
  name: string;

  /** Cultural context (informational only) */
  culturalContext?: string;

  /** Community description */
  description: string;

  /** Member count */
  memberCount: number;

  /** Community protocols (informational only) */
  protocols?: string[];

  /** Educational resources */
  educationalResources: string[];

  /** Community peers */
  peers: string[];

  /** Information sharing settings */
  sharingSettings: {
    shareEducationalContext: boolean;
    provideHistoricalContext: boolean;
    supportMultiplePerspectives: boolean;
    enableInformationSharing: boolean;
    restrictAccess: false; // MUST be false - no access restrictions
  };
}

/**
 * Anti-censorship test results
 */
export interface CensorshipResistanceTest {
  /** Test timestamp */
  timestamp: Date;

  /** Overall success */
  success: boolean;

  /** Individual test results */
  tests: {
    torConnectivity: boolean;
    hiddenServiceAccess: boolean;
    contentFiltering: boolean; // Should be false (no filtering)
    culturalBlocking: boolean; // Should be false (no blocking)
    alternativeNarratives: boolean; // Should be true (supported)
    educationalAccess: boolean; // Should be true (available)
  };

  /** Performance metrics during test */
  performance: {
    connectionTime: number;
    downloadSpeed: number;
    successRate: number;
  };

  /** Detected censorship attempts */
  censorshipAttempts: string[];

  /** Bypass methods used */
  bypassMethods: string[];
}

/**
 * Information sovereignty settings
 */
export interface InformationSovereignty {
  /** Community controls their own data */
  communityDataControl: boolean;

  /** No external access restrictions */
  noExternalRestrictions: boolean;

  /** Educational information sharing */
  educationalSharing: boolean;

  /** Cultural context provision */
  culturalContextProvision: boolean;

  /** Multiple narrative support */
  multipleNarrativeSupport: boolean;

  /** Anti-censorship compliance */
  antiCensorshipCompliance: boolean;
}
