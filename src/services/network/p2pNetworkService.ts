/**
 * P2P Network Service - Core Decentralized Networking
 *
 * Implements censorship-resistant peer-to-peer networking with IPFS content addressing,
 * TOR integration, and community-controlled information sharing.
 *
 * ANTI-CENSORSHIP PRINCIPLES:
 * - No cultural content filtering or blocking
 * - Information flows freely between peers
 * - Cultural context shared as educational information only
 * - Community sovereignty over their own data, not others' access
 * - Multiple perspectives supported equally
 */

import { invoke } from '@tauri-apps/api/core';
import { readDir, watch } from '@tauri-apps/plugin-fs';
import { settingsService } from '@/services/storage/settingsService';
import { torAdapter } from './torAdapter';
import type {
  P2PNode,
  Peer,
  NetworkConfig,
  ContentHash,
  SyncRequest,
  NetworkStatus,
  PeerDiscoveryOptions,
  NetworkMetrics,
} from '../../types/Network';
import type { Collection } from '../../types/Collection';
import type { Document } from '../../types/Document';
import type { CulturalMetadata } from '../../types/Cultural';
import type {
  SearchOptions,
  SearchResult,
} from '../../components/domain/network/P2PSearchInterface/types';
import type {
  CommunityNetwork,
  NetworkParticipation,
  JoinNetworkRequest,
} from '../../components/cultural/CommunityNetworks/types/CommunityNetworksTypes';

/**
 * P2P Network Service Interface
 */
export interface P2PNetworkService {
  // Node lifecycle
  initializeNode(config?: Partial<NetworkConfig>): Promise<P2PNode>;
  startNode(): Promise<void>;
  stopNode(): Promise<void>;
  getNodeStatus(): Promise<NetworkStatus>;

  // Peer management
  discoverPeers(options?: PeerDiscoveryOptions): Promise<Peer[]>;
  connectToPeer(peerId: string): Promise<void>;
  disconnectFromPeer(peerId: string): Promise<void>;
  getConnectedPeers(): Promise<Peer[]>;

  // Content sharing
  publishContent(content: Document | Collection, metadata?: CulturalMetadata): Promise<ContentHash>;
  requestContent(contentHash: ContentHash, peerId?: string): Promise<Document | Collection>;
  syncContent(syncRequest: SyncRequest): Promise<void>;

  // Cultural and community features
  discoverCommunityNetworks(): Promise<CommunityNetwork[]>;
  getNetworkParticipation(): Promise<NetworkParticipation[]>;
  joinCommunityNetwork(request: JoinNetworkRequest): Promise<void>;
  leaveCommunityNetwork(communityId: string): Promise<void>;
  shareWithCommunity(content: Document | Collection, communityId: string): Promise<void>;

  // Anti-censorship features
   enableTorRouting(): Promise<void>;
  disableTorRouting(): Promise<void>;
  createHiddenService(): Promise<string>; // Returns onion address

  // Network health and metrics
  getNetworkMetrics(): Promise<NetworkMetrics>;
  testCensorshipResistance(): Promise<boolean>;

  // Search functionality
  searchNetwork(query: string, options: SearchOptions): Promise<SearchResult[]>;
}

/**
 * P2P Network Service Implementation
 */
class P2PNetworkServiceImpl implements P2PNetworkService {
  private nodeId: string | null = null;
  private isRunning: boolean = false;
  private connectedPeers: Map<string, Peer> = new Map();
  private torEnabled: boolean = false;
  private communityNetworks: Set<string> = new Set();

  /**
   * Initialize P2P node with anti-censorship configuration
   */
  async initializeNode(config: Partial<NetworkConfig> = {}): Promise<P2PNode> {
    try {
      const defaultConfig: NetworkConfig = {
        name: 'AlLibrary Node',
        torSupport: config.torSupport !== false,
        ipfsEnabled: true,
        maxConnections: 100,
        ports: { p2p: 4001, http: 8080, tor: 9050 },
        // Anti-censorship mandatory flags
        enableCulturalFiltering: false,
        enableContentBlocking: false,
        educationalMode: true,
        communityInformationOnly: true,
        resistCensorship: true,
        preserveAlternatives: true,
        communityNetworks: [],
        contentSharing: {
          autoShare: true,
          shareCulturalContext: true,
          supportMultiplePerspectives: true,
          enableEducationalSharing: true,
          maxContentSize: 1024 * 1024 * 1024, // 1GB
          allowedContentTypes: ['pdf', 'epub', 'txt', 'json'],
        },
        security: {
          encryption: true,
          encryptionAlgorithm: 'xchacha20poly1305',
          verifyContent: true,
          verifyPeers: true,
          keyRotationInterval: 24,
        },
      };

      const mergedConfig: NetworkConfig = {
        ...defaultConfig,
        ...config,
        ports: { ...defaultConfig.ports, ...(config.ports || {}) },
        contentSharing: { ...defaultConfig.contentSharing, ...(config.contentSharing as any || {}) },
        security: { ...defaultConfig.security, ...(config.security as any || {}) },
      } as NetworkConfig;

      // If Tor is up, pass socks proxy explicitly to backend
      let socksProxy: string | undefined = undefined;
      try {
        const { torAdapter } = await import('./torAdapter');
        const tor = await torAdapter.status();
        if (tor?.circuitEstablished && tor?.socks) socksProxy = tor.socks;
      } catch { /* best-effort, continue without socks */ }

      const node = await invoke<P2PNode>('init_p2p_node', {
        config: { ...mergedConfig, socks_proxy: socksProxy },
      });

      this.nodeId = node.id;

      // Validate anti-censorship configuration
      if (node.config.enableCulturalFiltering || node.config.enableContentBlocking) {
        throw new Error(
          'Anti-censorship violation: Node cannot be configured with content filtering'
        );
      }

      return node;
    } catch (error) {
      console.error('Failed to initialize P2P node:', error);
      throw new Error('Unable to initialize P2P network node');
    }
  }

  /**
   * Start P2P node and begin peer discovery
   */
  async startNode(): Promise<void> {
    try {
      if (!this.nodeId) {
        throw new Error('Node must be initialized before starting');
      }

      await invoke('start_p2p_node', { nodeId: this.nodeId });
      this.isRunning = true;

      // Start anti-censorship peer discovery
      await this.discoverPeers({
        includeTorPeers: true,
        includeHiddenServices: true,
        respectCulturalBoundaries: false, // NO cultural boundaries for peer discovery
        enableEducationalSharing: true,
      });
    } catch (error) {
      console.error('Failed to start P2P node:', error);
      throw new Error('Unable to start P2P network');
    }
  }

  /**
   * Stop P2P node gracefully
   */
  async stopNode(): Promise<void> {
    try {
      if (!this.nodeId || !this.isRunning) {
        return;
      }

      await invoke('stop_p2p_node', { nodeId: this.nodeId });
      this.isRunning = false;
      this.connectedPeers.clear();
    } catch (error) {
      console.error('Failed to stop P2P node:', error);
      throw new Error('Unable to stop P2P network');
    }
  }

  /**
   * Get current network status
   */
  async getNodeStatus(): Promise<NetworkStatus> {
    try {
      const raw: any = await invoke<any>('get_p2p_node_status', {
        nodeId: this.nodeId,
      });
      // Adapt backend (snake_case) to frontend types
      const statusStr: string = raw?.nodeStatus || raw?.status || 'offline';
      const toEnum = (s: string): any => {
        const n = (s || '').toLowerCase();
        if (n === 'online') return 'online';
        if (n === 'starting') return 'starting';
        if (n === 'connecting') return 'connecting';
        if (n === 'error') return 'error';
        if (n === 'stopping') return 'stopping';
        return 'offline';
      };
      const connectedPeers = Number(raw?.connectedPeers ?? raw?.connected_peers ?? 0);
      const discoveredPeers = Number(raw?.discoveredPeers ?? raw?.discovered_peers ?? connectedPeers);
      const networkHealth = Number(raw?.networkHealth ?? raw?.network_health ?? 0);
      const torStatus = raw?.torStatus || undefined;
      const ipfsStatus = Boolean(raw?.ipfsStatus ?? raw?.ipfs_status ?? false);
      const censorshipResistance = raw?.censorshipResistance || undefined;
      const activeCommunityNetworks = raw?.activeCommunityNetworks || [];
      const contentStats = raw?.contentStats || { totalShared: 0, totalReceived: 0, culturalContentShared: 0, educationalContentShared: 0, alternativeNarrativesShared: 0, communityContentShared: 0 };

      const result: NetworkStatus = {
        nodeStatus: toEnum(statusStr),
        connectedPeers,
        discoveredPeers,
        torStatus: torStatus as any,
        ipfsStatus,
        networkHealth,
        censorshipResistance: censorshipResistance as any,
        activeCommunityNetworks,
        contentStats: contentStats as any,
      };
      return result;
    } catch (error) {
      console.error('Failed to get node status:', error);
      throw new Error('Unable to retrieve network status');
    }
  }

  /**
   * Discover peers with anti-censorship focus
   */
  async discoverPeers(options: PeerDiscoveryOptions = {}): Promise<Peer[]> {
    try {
      const discoveryOptions = {
        ...options,
        // Anti-censorship peer discovery settings
        includeTorPeers: options.includeTorPeers !== false,
        includeHiddenServices: options.includeHiddenServices !== false,
        respectCulturalBoundaries: false, // NEVER restrict peer discovery by culture
        enableEducationalSharing: true,
        supportAlternativeNarratives: true,
        resistCensorship: true,
      };

      const peers = await invoke<Peer[]>('discover_peers', {
        nodeId: this.nodeId,
        options: discoveryOptions,
      });

      // Update connected peers list
      peers.forEach(peer => {
        if (peer.connected) {
          this.connectedPeers.set(peer.id, peer);
        }
      });

      return peers;
    } catch (error) {
      console.error('Failed to discover peers:', error);
      throw new Error('Unable to discover network peers');
    }
  }

  /**
   * Connect to a specific peer
   */
  async connectToPeer(peerId: string): Promise<void> {
    try {
      await invoke('connect_to_peer', {
        nodeId: this.nodeId,
        peerId,
        // Anti-censorship connection settings
        enableCulturalExchange: true,
        respectCulturalProtocols: true, // Information only, not restrictions
        shareEducationalContext: true,
        supportAlternativeViews: true,
      });

      // Update peer status
      const peer = await invoke<Peer>('get_peer_info', { peerId });
      this.connectedPeers.set(peerId, peer);
    } catch (error) {
      console.error(`Failed to connect to peer ${peerId}:`, error);
      throw new Error('Unable to connect to peer');
    }
  }

  /**
   * Disconnect from a peer
   */
  async disconnectFromPeer(peerId: string): Promise<void> {
    try {
      await invoke('disconnect_from_peer', {
        nodeId: this.nodeId,
        peerId,
      });

      this.connectedPeers.delete(peerId);
    } catch (error) {
      console.error(`Failed to disconnect from peer ${peerId}:`, error);
      throw new Error('Unable to disconnect from peer');
    }
  }

  /**
   * Get list of connected peers
   */
  async getConnectedPeers(): Promise<Peer[]> {
    try {
      const peers = await invoke<Peer[]>('get_connected_peers', {
        nodeId: this.nodeId,
      });

      return peers;
    } catch (error) {
      console.error('Failed to get connected peers:', error);
      throw new Error('Unable to retrieve connected peers');
    }
  }

  /**
   * Publish content to P2P network (no cultural restrictions)
   */
  async publishContent(
    content: Document | Collection,
    metadata?: CulturalMetadata
  ): Promise<ContentHash> {
    try {
      // ANTI-CENSORSHIP: Never block content publication based on cultural sensitivity
      const publishRequest = {
        content,
        metadata: metadata
          ? {
              ...metadata,
              // Provide cultural information without restrictions
              educationalContext:
                metadata.educationalContext || 'Cultural context provided for educational purposes',
              accessRestrictions: false, // NEVER restrict access
              informationOnly: true, // Cultural info is educational only
            }
          : undefined,
        antiCensorshipSettings: {
          enableTorDistribution: true,
          enableHiddenServiceSharing: true,
          resistContentBlocking: true,
          preserveAlternativeNarratives: true,
          supportMultiplePerspectives: true,
        },
      };

      const contentHash = await invoke<ContentHash>('publish_content', {
        nodeId: this.nodeId,
        publishRequest,
      });

      return contentHash;
    } catch (error) {
      console.error('Failed to publish content:', error);
      throw new Error('Unable to publish content to P2P network');
    }
  }

  /**
   * Request content from P2P network
   */
  async requestContent(contentHash: ContentHash, peerId?: string): Promise<Document | Collection> {
    try {
      const content = await invoke<Document | Collection>('request_content', {
        nodeId: this.nodeId,
        contentHash,
        peerId,
        // Anti-censorship request settings
        bypassCulturalFilters: true, // NEVER apply cultural filters
        includeEducationalContext: true, // Include cultural context for learning
        supportAlternativeViews: true, // Accept alternative narratives
        resistCensorship: true,
      });

      return content;
    } catch (error) {
      console.error(`Failed to request content ${contentHash}:`, error);
      throw new Error('Unable to retrieve content from P2P network');
    }
  }

  /**
   * Synchronize content with peers
   */
  async syncContent(syncRequest: SyncRequest): Promise<void> {
    try {
      await invoke('sync_content', {
        nodeId: this.nodeId,
        syncRequest: {
          ...syncRequest,
          // Anti-censorship sync settings
          includeCulturalContent: true, // NEVER exclude cultural content
          preserveAlternatives: true, // Keep alternative narratives
          educationalMode: true, // Provide cultural context
          communityInformationOnly: true, // Community info, not control
        },
      });
    } catch (error) {
      console.error('Failed to sync content:', error);
      throw new Error('Unable to synchronize content');
    }
  }

  /**
   * Discover available community networks
   */
  async discoverCommunityNetworks(): Promise<CommunityNetwork[]> {
    try {
      // Prefer real backend if available
      const networks = await invoke<CommunityNetwork[]>('discover_community_networks', {
        nodeId: this.nodeId,
      });
      if (Array.isArray(networks)) return networks;
    } catch (error) {
      console.warn('discoverCommunityNetworks falling back to mock:', error);
    }
    try {
      // Fallback: mock community networks for development
      const mockNetworks: CommunityNetwork[] = [
        {
          id: 'indigenous-knowledge-1',
          name: 'Indigenous Knowledge Sharing',
          description:
            'Educational network for sharing traditional indigenous knowledge and cultural practices',
          culturalSensitivityLevel: 2,
          culturalContext:
            'Traditional indigenous knowledge with educational context provided for learning',
          culturalRegion: 'Global Indigenous Communities',
          primaryLanguage: 'Multilingual',
          memberCount: 1247,
          createdAt: '2024-01-15T10:00:00Z',
          lastActivity: new Date().toISOString(),
          category: 'indigenous-knowledge',
          status: 'active',
          visibility: 'public',
          educationalResources: [
            'Traditional knowledge systems',
            'Cultural preservation methods',
            'Community protocols',
            'Historical context',
          ],
          knowledgeAreas: ['Traditional Medicine', 'Cultural Practices', 'Environmental Knowledge'],
        },
        {
          id: 'storytelling-traditions-1',
          name: 'Global Storytelling Traditions',
          description:
            'Sharing oral traditions and storytelling methods from diverse cultures worldwide',
          culturalSensitivityLevel: 1,
          culturalContext:
            'Cultural storytelling traditions for educational and entertainment purposes',
          culturalRegion: 'Worldwide',
          primaryLanguage: 'Multilingual',
          memberCount: 2156,
          createdAt: '2024-02-01T12:00:00Z',
          lastActivity: new Date().toISOString(),
          category: 'storytelling',
          status: 'active',
          visibility: 'public',
          educationalResources: [
            'Storytelling techniques',
            'Cultural narratives',
            'Oral tradition preservation',
            'Cross-cultural storytelling',
          ],
          knowledgeAreas: ['Oral Traditions', 'Cultural Narratives', 'Performance Arts'],
        },
        {
          id: 'academic-cultural-studies-1',
          name: 'Academic Cultural Studies Network',
          description:
            'Academic research and educational resources for cultural studies and anthropology',
          culturalSensitivityLevel: 3,
          culturalContext:
            'Academic research with comprehensive educational context and multiple perspectives',
          culturalRegion: 'Global Academic Community',
          primaryLanguage: 'English',
          memberCount: 892,
          createdAt: '2024-01-20T14:00:00Z',
          lastActivity: new Date().toISOString(),
          category: 'educational-initiatives',
          status: 'active',
          visibility: 'public',
          educationalResources: [
            'Academic papers',
            'Research methodologies',
            'Educational frameworks',
            'Peer review processes',
          ],
          knowledgeAreas: ['Cultural Studies', 'Anthropology', 'Sociology', 'Educational Research'],
        },
      ];

      return mockNetworks;
    } catch (error) {
      console.error('Failed to discover community networks:', error);
      return [];
    }
  }

  /**
   * Get current network participation status
   */
  async getNetworkParticipation(): Promise<NetworkParticipation[]> {
    try {
      // Prefer real backend if available
      const participation = await invoke<NetworkParticipation[]>('get_network_participation', {
        nodeId: this.nodeId,
      });
      if (Array.isArray(participation)) return participation;
    } catch (error) {
      console.warn('getNetworkParticipation falling back to mock:', error);
    }
    try {
      // Fallback: mock participation data for development
      const mockParticipation: NetworkParticipation[] = Array.from(this.communityNetworks).map(
        networkId => ({
          networkId,
          userId: this.nodeId || 'anonymous-user',
          isActive: true,
          joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastInteraction: new Date().toISOString(),
          participationType: 'information-sharing',
          educationalProgress: {
            pathsEnrolled: Math.floor(Math.random() * 5) + 1,
            pathsCompleted: Math.floor(Math.random() * 3),
            learningStreak: Math.floor(Math.random() * 30),
            lastActivity: new Date().toISOString(),
            certificatesEarned: ['Cultural Awareness 101'],
            competencyAreas: ['Cultural Context', 'Educational Sharing'],
          },
          culturalLearningCompleted: [
            'Cultural Sensitivity Training',
            'Information Sharing Ethics',
          ],
          contributions: [
            {
              id: 'contrib-1',
              type: 'knowledge-share',
              title: 'Educational resource contribution',
              contributedAt: new Date().toISOString(),
              appreciationReceived: Math.floor(Math.random() * 50),
              educationalImpact: Math.floor(Math.random() * 100),
            },
          ],
        })
      );

      return mockParticipation;
    } catch (error) {
      console.error('Failed to get network participation:', error);
      return [];
    }
  }

  /**
   * Join a community network for information sharing
   */
  async joinCommunityNetwork(request: JoinNetworkRequest): Promise<void> {
    try {
      await invoke('join_community_network', {
        nodeId: this.nodeId,
        communityId: request.networkId,
        participationType: request.participationType,
        settings: {
          // Community provides information, not access control
          receiveEducationalContext: request.educationalContext,
          shareCulturalInformation: true,
          respectTraditionalProtocols: request.respectCulturalProtocols, // Information only, not restrictions
          supportCommunityNarratives: true,
          enableInformationSharing: true,
          blockAccessControl: false, // Communities cannot block access to others' content
          learningInterests: request.learningInterests,
          backgroundInfo: request.backgroundInfo,
        },
      });

      this.communityNetworks.add(request.networkId);
    } catch (error) {
      console.error(`Failed to join community network ${request.networkId}:`, error);
      throw new Error('Unable to join community network');
    }
  }

  /**
   * Leave a community network
   */
  async leaveCommunityNetwork(communityId: string): Promise<void> {
    try {
      await invoke('leave_community_network', {
        nodeId: this.nodeId,
        communityId,
      });

      this.communityNetworks.delete(communityId);
    } catch (error) {
      console.error(`Failed to leave community network ${communityId}:`, error);
      throw new Error('Unable to leave community network');
    }
  }

  /**
   * Share content with community (information sharing, not control)
   */
  async shareWithCommunity(content: Document | Collection, communityId: string): Promise<void> {
    try {
      await invoke('share_with_community', {
        nodeId: this.nodeId,
        content,
        communityId,
        sharingSettings: {
          provideEducationalContext: true,
          includeCulturalInformation: true,
          supportMultiplePerspectives: true,
          enableInformationSharing: true,
          restrictAccess: false, // NEVER restrict access based on community membership
        },
      });
    } catch (error) {
      console.error(`Failed to share with community ${communityId}:`, error);
      throw new Error('Unable to share content with community');
    }
  }

  /**
   * Enable TOR routing for censorship resistance
   */
  async enableTorRouting(): Promise<void> {
    try {
      // If Tor SOCKS is available, inform backend before enabling routing
      try {
        const status = await torAdapter.status();
        if (status?.socks) {
          await torAdapter.useSocks(status.socks);
        }
      } catch {
        // Intentionally ignore optional SOCKS pre-configuration failures
      }

      // Provide socks to backend runtime so transports route over Tor
      try {
        const { torAdapter } = await import('./torAdapter');
        const tor = await torAdapter.status();
        await invoke('enable_tor_routing', { nodeId: this.nodeId, socksProxy: tor?.socks });
      } catch { await invoke('enable_tor_routing', { nodeId: this.nodeId, socksProxy: null }); }
      this.torEnabled = true;
    } catch (error) {
      console.error('Failed to enable TOR routing:', error);
      throw new Error('Unable to enable TOR routing');
    }
  }

  /**
   * Disable TOR routing
   */
  async disableTorRouting(): Promise<void> {
    try {
      await invoke('disable_tor_routing', { nodeId: this.nodeId });
      this.torEnabled = false;
    } catch (error) {
      console.error('Failed to disable TOR routing:', error);
      throw new Error('Unable to disable TOR routing');
    }
  }

  /**
   * Create hidden service for censorship resistance
   */
  async createHiddenService(): Promise<string> {
    try {
      const onionAddress = await invoke<string>('create_hidden_service', {
        nodeId: this.nodeId,
        serviceConfig: {
          enableCulturalSharing: true, // Share cultural information
          enableEducationalAccess: true, // Provide educational access
          resistCensorship: true, // Maximum censorship resistance
          supportAlternatives: true, // Support alternative narratives
          blockContentFiltering: true, // Block any content filtering attempts
        },
      });

      return onionAddress;
    } catch (error) {
      console.error('Failed to create hidden service:', error);
      throw new Error('Unable to create hidden service');
    }
  }

  /**
   * Get network health and performance metrics
   */
  async getNetworkMetrics(): Promise<NetworkMetrics> {
    try {
      return await invoke<NetworkMetrics>('get_network_metrics', { nodeId: this.nodeId });
    } catch (error) {
      console.error('Failed to get network metrics:', error);
      throw new Error('Unable to retrieve network metrics');
    }
  }

  /**
   * Test censorship resistance capabilities
   */
  async testCensorshipResistance(): Promise<boolean> {
    try {
      const result = await invoke<boolean>('test_censorship_resistance', {
        nodeId: this.nodeId,
        tests: {
          torConnectivity: true,
          hiddenServiceAccess: true,
          contentFiltering: true, // Test that content is NOT filtered
          culturalBlocking: true, // Test that cultural content is NOT blocked
          alternativeNarratives: true, // Test support for alternative views
          educationalAccess: true, // Test educational context provision
        },
      });

      return result;
    } catch (error) {
      console.error('Failed to test censorship resistance:', error);
      throw new Error('Unable to test censorship resistance');
    }
  }

  /**
   * Search across the P2P network for content
   */
  async searchNetwork(query: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      const searchRequest = {
        query: query.trim(),
        options: {
          ...options,
          // Anti-censorship search settings
          bypassCulturalFilters: true, // NEVER apply cultural filters
          includeEducationalContext: options.includeCulturalContext,
          supportAlternativeViews: options.supportAlternativeNarratives,
          resistCensorship: options.resistCensorship,
          enableAnonymousSearch: options.includeAnonymous,
        },
      };

      const results = await invoke<SearchResult[]>('search_p2p_network', {
        nodeId: this.nodeId,
        searchRequest,
      });

      return results || [];
    } catch (error) {
      console.error('Failed to search P2P network:', error);
      // Do not return mocked results; surface empty array to avoid fake data
      return [];
    }
  }

  /**
   * Seed all PDF/EPUB files from the selected library folder.
   * - Reads folder path from settingsService
   * - Walks files (shallow) and invokes Tauri publish_content for each
   */
  async seedLibraryFolder(): Promise<{ seeded: number; errors: number }> {
    try {
      const folder = await settingsService.getProjectFolder();
      if (!folder) return { seeded: 0, errors: 0 };
      const entries = await readDir(folder, { recursive: true });
      let seeded = 0; let errors = 0;
      for (const entry of entries) {
        if (entry.children) continue;
        const p = entry.path || entry.name;
        if (!p) continue;
        const lower = p.toLowerCase();
        if (lower.endsWith('.pdf') || lower.endsWith('.epub')) {
          try {
            await invoke<string>('publish_content', { path: p });
            seeded += 1;
          } catch { errors += 1; }
        }
      }
      return { seeded, errors };
    } catch (_) { return { seeded: 0, errors: 1 }; }
  }

  /**
   * Watch the library folder and auto-seed new/changed files
   */
  async watchAndSeedLibrary(): Promise<void> {
    const folder = await settingsService.getProjectFolder();
    if (!folder) return;
    try {
      const unwatch = await watch(folder, async (event) => {
        try {
          const path = (event as any).path as string | undefined;
          if (!path) return;
          const lower = path.toLowerCase();
          if (lower.endsWith('.pdf') || lower.endsWith('.epub')) {
            await invoke<string>('publish_content', { path });
          }
        } catch { /* ignore */ }
      }, { recursive: true });
      // optional: store unwatch somewhere if needed later
      void unwatch; // avoid linter warning
    } catch { /* noop */ }
  }

 
}

// Export singleton instance
export const p2pNetworkService: P2PNetworkService = new P2PNetworkServiceImpl();

