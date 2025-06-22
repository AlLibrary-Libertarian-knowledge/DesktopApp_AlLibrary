/**
 * Peer Network API Service
 *
 * Manages P2P network operations and peer connections.
 * Enforces decentralization and anti-censorship principles.
 */

import { apiClient, type ApiResponse } from './apiClient';

/**
 * Peer network interfaces
 */
export interface PeerInfo {
  id: string;
  multiaddr: string;
  publicKey: string;
  nickname?: string;

  // Connection info
  status: PeerStatus;
  lastSeen: string;
  connectionTime: string;
  latency: number;

  // Network capabilities
  capabilities: PeerCapability[];
  protocols: string[];
  version: string;
  platform: string;

  // Network metrics
  bandwidth: {
    upload: number;
    download: number;
    available: number;
  };

  // Content sharing
  sharedContent: {
    totalDocuments: number;
    totalSize: number;
    categories: string[];
    culturalContributions: number;
  };

  // Trust and reputation (decentralized)
  reputation: {
    score: number;
    interactions: number;
    positiveExchanges: number;
    culturalRespect: number;
    lastCalculated: string;
  };

  // Privacy settings
  privacy: {
    shareStatistics: boolean;
    shareLocation: boolean;
    allowDirectConnect: boolean;
    culturalPreferences: string[];
  };
}

export enum PeerStatus {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  UNREACHABLE = 'unreachable',
  BLOCKED = 'blocked',
}

export enum PeerCapability {
  CONTENT_SHARING = 'content_sharing',
  SEARCH_PROVIDER = 'search_provider',
  CULTURAL_VALIDATION = 'cultural_validation',
  METADATA_PROVIDER = 'metadata_provider',
  STORAGE_PROVIDER = 'storage_provider',
  BRIDGE_NODE = 'bridge_node',
  TOR_GATEWAY = 'tor_gateway',
  IPFS_GATEWAY = 'ipfs_gateway',
}

export interface NetworkHealth {
  totalPeers: number;
  connectedPeers: number;
  networkLatency: number;
  contentAvailability: number;

  // Decentralization metrics
  decentralizationScore: number;
  nodeDistribution: Record<string, number>;
  redundancyLevel: number;

  // Anti-censorship metrics
  torGateways: number;
  bridgeNodes: number;
  censorshipResistance: number;

  // Cultural diversity
  culturalDiversity: {
    representedCommunities: number;
    culturalContributors: number;
    crossCulturalExchanges: number;
  };

  // Network resilience
  resilience: {
    nodeFailureThreshold: number;
    routingRedundancy: number;
    contentReplication: number;
  };
}

export interface ContentExchange {
  id: string;
  fromPeer: string;
  toPeer: string;
  contentHash: string;
  contentSize: number;

  // Exchange metadata
  initiatedAt: string;
  completedAt?: string;
  status: ExchangeStatus;
  progress: number;

  // Cultural context
  culturalContext?: {
    requiresRespect: boolean;
    culturalOrigin: string;
    communityGuidelines: string[];
  };

  // Verification
  verification: {
    hashVerified: boolean;
    culturallyValidated: boolean;
    communityEndorsed: boolean;
  };
}

export enum ExchangeStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Peer Network API Service Class
 * Implements decentralized network management
 */
export class PeerApiService {
  /**
   * Get connected peers with capabilities
   */
  async getConnectedPeers(): Promise<ApiResponse<PeerInfo[]>> {
    return apiClient.get<PeerInfo[]>('connected_peers', {
      includeCapabilities: true,
      includeMetrics: true,
      includeReputation: true,
    });
  }

  /**
   * Get detailed peer information
   */
  async getPeerInfo(peerId: string): Promise<ApiResponse<PeerInfo>> {
    return apiClient.get<PeerInfo>('peer_info', {
      peerId,
      includeFullDetails: true,
      includeHistory: true,
    });
  }

  /**
   * Search for peers with specific capabilities
   */
  async searchPeers(criteria: {
    capabilities?: PeerCapability[];
    culturalContributions?: boolean;
    minReputation?: number;
    maxLatency?: number;
    regions?: string[];
  }): Promise<ApiResponse<PeerInfo[]>> {
    return apiClient.search<PeerInfo[]>('peers', '', {
      ...criteria,
      respectPrivacy: true,
      culturalInclusion: true,
    });
  }

  /**
   * Connect to a specific peer
   */
  async connectToPeer(
    peerAddress: string,
    options: {
      priority?: 'low' | 'normal' | 'high';
      timeout?: number;
      persistConnection?: boolean;
    } = {}
  ): Promise<
    ApiResponse<{
      connectionId: string;
      status: PeerStatus;
      latency: number;
      capabilities: PeerCapability[];
    }>
  > {
    return apiClient.call('connect_to_peer', {
      peerAddress,
      ...options,
      respectNetworkProtocols: true,
    });
  }

  /**
   * Disconnect from a peer
   */
  async disconnectFromPeer(peerId: string, reason?: string): Promise<ApiResponse<void>> {
    return apiClient.call('disconnect_from_peer', {
      peerId,
      reason,
      gracefulDisconnect: true,
    });
  }

  /**
   * Get network health and metrics
   */
  async getNetworkHealth(): Promise<ApiResponse<NetworkHealth>> {
    return apiClient.get<NetworkHealth>('network_health', {
      includeDecentralizationMetrics: true,
      includeCensorshipResistance: true,
      includeCulturalDiversity: true,
    });
  }

  /**
   * Get peer discovery suggestions
   */
  async discoverPeers(
    preferences: {
      culturalInterests?: string[];
      contentTypes?: string[];
      capabilities?: PeerCapability[];
      regions?: string[];
    } = {}
  ): Promise<ApiResponse<PeerInfo[]>> {
    return apiClient.get<PeerInfo[]>('discover_peers', {
      preferences,
      includeRecommendations: true,
      respectPrivacy: true,
    });
  }

  /**
   * Share content with the network
   */
  async shareContent(
    contentHash: string,
    metadata: {
      title: string;
      description: string;
      culturalContext?: string;
      categories: string[];
      tags: string[];
    }
  ): Promise<
    ApiResponse<{
      shareId: string;
      networkPeers: number;
      estimatedReach: number;
      culturalValidation?: string;
    }>
  > {
    return apiClient.call('share_content', {
      contentHash,
      metadata,
      respectCulturalProtocols: true,
      ensureDecentralization: true,
    });
  }

  /**
   * Request content from the network
   */
  async requestContent(
    contentHash: string,
    options: {
      priority?: 'low' | 'normal' | 'high';
      maxPeers?: number;
      timeout?: number;
      culturallyRespectful?: boolean;
    } = {}
  ): Promise<
    ApiResponse<{
      requestId: string;
      availablePeers: number;
      estimatedTime: number;
      culturalContext?: string;
    }>
  > {
    return apiClient.call('request_content', {
      contentHash,
      ...options,
      culturallyRespectful: options.culturallyRespectful ?? true,
    });
  }

  /**
   * Get content exchange history
   */
  async getExchangeHistory(
    filters: {
      peerId?: string;
      dateRange?: { from: string; to: string };
      status?: ExchangeStatus;
      culturalContent?: boolean;
    } = {}
  ): Promise<ApiResponse<ContentExchange[]>> {
    return apiClient.get<ContentExchange[]>('exchange_history', {
      ...filters,
      includeMetrics: true,
      includeCulturalContext: true,
    });
  }

  /**
   * Update peer reputation (decentralized consensus)
   */
  async updatePeerReputation(
    peerId: string,
    interaction: {
      type: 'content_exchange' | 'cultural_respect' | 'network_contribution';
      rating: number; // 1-5
      comment?: string;
      culturalRespect?: boolean;
    }
  ): Promise<
    ApiResponse<{
      reputationUpdated: boolean;
      newScore: number;
      consensusReached: boolean;
    }>
  > {
    return apiClient.call('update_peer_reputation', {
      peerId,
      interaction,
      decentralizedConsensus: true,
      culturalSensitivity: true,
    });
  }

  /**
   * Configure network settings
   */
  async configureNetwork(settings: {
    maxConnections?: number;
    bandwidth?: { upload: number; download: number };
    privacy?: {
      shareLocation: boolean;
      shareStatistics: boolean;
      allowDirectConnect: boolean;
    };
    cultural?: {
      sharePreferences: boolean;
      culturalContributions: boolean;
      respectProtocols: boolean;
    };
    antiCensorship?: {
      enableTor: boolean;
      enableBridges: boolean;
      enableIPFS: boolean;
    };
  }): Promise<
    ApiResponse<{
      applied: boolean;
      activeSettings: any;
      networkImpact: string[];
    }>
  > {
    return apiClient.call('configure_network', {
      settings,
      validateDecentralization: true,
      ensureCensorshipResistance: true,
    });
  }

  /**
   * Get bootstrap peers for initial connection
   */
  async getBootstrapPeers(): Promise<
    ApiResponse<{
      peers: PeerInfo[];
      torGateways: string[];
      ipfsGateways: string[];
      bridgeNodes: string[];
    }>
  > {
    return apiClient.get('bootstrap_peers', {
      includeAnonymousGateways: true,
      includeCensorshipResistance: true,
      includeCulturalDiversity: true,
    });
  }

  /**
   * Report network issues for community resolution
   */
  async reportNetworkIssue(issue: {
    type: 'censorship' | 'peer_misconduct' | 'cultural_insensitivity' | 'technical';
    description: string;
    peerId?: string;
    evidence?: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<
    ApiResponse<{
      reportId: string;
      communityReview: boolean;
      expectedResolution: string;
      supportResources: string[];
    }>
  > {
    return apiClient.call('report_network_issue', {
      issue,
      communityModeration: true,
      transparentProcess: true,
    });
  }

  /**
   * Get network statistics for transparency
   */
  async getNetworkStatistics(): Promise<
    ApiResponse<{
      totalNodes: number;
      activeNodes: number;
      contentShared: number;
      culturalExchanges: number;
      censorshipAttempts: number;
      successfulResistance: number;
      communityContributions: number;
      crossCulturalConnections: number;
      networkResilience: number;
      decentralizationScore: number;
    }>
  > {
    return apiClient.get('network_statistics', {
      includeAntiCensorshipMetrics: true,
      includeCulturalMetrics: true,
      includeResilienceMetrics: true,
    });
  }

  /**
   * Enable emergency protocols for censorship events
   */
  async enableEmergencyProtocols(): Promise<
    ApiResponse<{
      protocolsActivated: string[];
      alternativeRoutes: string[];
      torCircuits: number;
      bridgeConnections: number;
      estimatedBypassSuccess: number;
    }>
  > {
    return apiClient.call('enable_emergency_protocols', {
      activateAllDefenses: true,
      notifyCommunity: true,
      preserveInformationAccess: true,
    });
  }
}

// Export singleton instance
export const peerApi = new PeerApiService();
