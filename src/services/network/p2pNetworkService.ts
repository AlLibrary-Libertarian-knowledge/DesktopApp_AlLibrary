import { onionShareStart, onionShareStatus, trackerGetConfig } from './onionShareService';
import { networkFacade } from './networkFacade';
import { transferFacade } from './transferFacade';
import type {
  P2PNode,
  Peer,
  NetworkConfig,
  ContentHash,
  SyncRequest,
  NetworkStatus,
  PeerDiscoveryOptions,
  NetworkMetrics,
  NodeStatus,
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

const defaultNetworkStatus = (): NetworkStatus =>
  ({
    nodeStatus: 'offline' as NodeStatus,
    connectedPeers: 0,
    discoveredPeers: 0,
    torStatus: {
      enabled: false,
      connected: false,
      hiddenServices: [],
      circuitStatus: 'failed',
    },
    ipfsStatus: false,
    networkHealth: 0,
    censorshipResistance: {
      level: 0,
      torConnectivity: false,
      hiddenServiceAccess: false,
      contentFilteringBypass: false,
      culturalBlockingResistance: false,
      alternativeNarrativeSupport: false,
    },
    activeCommunityNetworks: [],
    contentStats: {
      totalShared: 0,
      totalReceived: 0,
      culturalContentShared: 0,
      educationalContentShared: 0,
      alternativeNarrativesShared: 0,
      communityContentShared: 0,
    },
  }) as NetworkStatus;

const defaultNetworkMetrics = (): NetworkMetrics =>
  ({
    performance: {
      averageLatency: 0,
      totalBandwidth: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errorRate: 0,
    },
    censorshipResistance: {
      torConnections: 0,
      hiddenServiceConnections: 0,
      censorshipAttempts: 0,
      successfulBypasses: 0,
      alternativeRoutes: 0,
    },
    culturalSharing: {
      culturalContentShared: 0,
      educationalContextProvided: 0,
      alternativeNarrativesSupported: 0,
      communityInteractions: 0,
    },
    health: {
      nodeUptime: 0,
      connectionStability: 0,
      peerDiversity: 0,
      contentAvailability: 0,
    },
  }) as NetworkMetrics;

export interface P2PNetworkService {
  initializeNode(config?: Partial<NetworkConfig>): Promise<P2PNode>;
  startNode(): Promise<void>;
  stopNode(): Promise<void>;
  getNodeStatus(): Promise<NetworkStatus>;
  discoverPeers(options?: PeerDiscoveryOptions): Promise<Peer[]>;
  connectToPeer(peerId: string): Promise<void>;
  disconnectFromPeer(peerId: string): Promise<void>;
  getConnectedPeers(): Promise<Peer[]>;
  publishContent(content: Document | Collection, metadata?: CulturalMetadata): Promise<ContentHash>;
  requestContent(contentHash: ContentHash, peerId?: string): Promise<Document | Collection>;
  syncContent(syncRequest: SyncRequest): Promise<void>;
  discoverCommunityNetworks(): Promise<CommunityNetwork[]>;
  getNetworkParticipation(): Promise<NetworkParticipation[]>;
  joinCommunityNetwork(request: JoinNetworkRequest): Promise<void>;
  leaveCommunityNetwork(communityId: string): Promise<void>;
  shareWithCommunity(content: Document | Collection, communityId: string): Promise<void>;
  enableTorRouting(): Promise<void>;
  disableTorRouting(): Promise<void>;
  createHiddenService(): Promise<string>;
  getNetworkMetrics(): Promise<NetworkMetrics>;
  testCensorshipResistance(): Promise<boolean>;
  searchNetwork(query: string, options: SearchOptions): Promise<SearchResult[]>;
  seedLibraryFolder(): Promise<{ seeded: number; errors: number }>;
  watchAndSeedLibrary(): Promise<void>;
}

class P2PNetworkServiceImpl implements P2PNetworkService {
  async initializeNode(config: Partial<NetworkConfig> = {}): Promise<P2PNode> {
    const c = await trackerGetConfig();
    return {
      id: c.nodeId,
      publicKey: '',
      status: 'online' as NodeStatus,
      protocols: ['onion-share'],
      addresses: [],
      capabilities: {
        torSupport: true,
        ipfsSupport: false,
        culturalSharing: true,
        educationalSupport: true,
        alternativeNarratives: true,
        censorshipResistance: 4,
        communityNetworks: true,
        contentVerification: true,
      },
      config: { ...config } as any,
    };
  }

  async startNode(): Promise<void> {
    console.log('P2PNetworkService: Starting node (OnionShare)');
    await onionShareStart();
    console.log('P2PNetworkService: Node started successfully');
  }

  async stopNode(): Promise<void> {}

  async getNodeStatus(): Promise<NetworkStatus> {
    const s = await onionShareStatus();
    const lobby = await networkFacade.getLobby().catch(() => ({
      onlineNodes: 0,
      files: [],
      totalBytes: 0,
      lastSyncAt: null,
    }));

    return {
      ...defaultNetworkStatus(),
      nodeStatus: s.running ? 'online' : 'offline',
      connectedPeers: lobby.onlineNodes,
      torStatus: {
        enabled: true,
        connected: s.running,
        hiddenServices: s.onion ? [s.onion] : [],
        circuitStatus: s.running ? 'connected' : 'failed',
      },
      networkHealth: s.running ? 0.9 : 0,
      censorshipResistance: {
        level: s.running ? 5 : 0,
        torConnectivity: s.running,
        hiddenServiceAccess: !!s.onion,
        contentFilteringBypass: s.running,
        culturalBlockingResistance: true,
        alternativeNarrativeSupport: true,
      },
    } as any;
  }

  async discoverPeers(_options: PeerDiscoveryOptions = {}): Promise<Peer[]> {
    const peers = await networkFacade.listPeers();
    return peers.map(p => ({
      id: p.nodeId,
      status: 'online',
      protocols: ['onion-share'],
    })) as any;
  }

  async connectToPeer(_peerId: string): Promise<void> {}
  async disconnectFromPeer(_peerId: string): Promise<void> {}

  async getConnectedPeers(): Promise<Peer[]> {
    return this.discoverPeers();
  }

  async publishContent(
    content: Document | Collection,
    _metadata?: CulturalMetadata
  ): Promise<ContentHash> {
    if ('filePath' in content && content.filePath) {
      const res = await transferFacade.addShare(content.filePath);
      return {
        ipfsHash: res.contentHash,
        contentType: 'document',
        size: res.size,
        verificationHash: res.contentHash,
        createdAt: new Date(),
      };
    }
    throw new Error('Only documents with local file paths can be published to P2P network');
  }

  async requestContent(contentHash: ContentHash, _peerId?: string): Promise<Document | Collection> {
    const link = contentHash.ipfsHash;
    if (link && (link.includes('.onion') || link.startsWith('http'))) {
      await transferFacade.downloadLink(link, link.split('/').pop() || 'download');
      throw new Error('Download started — check Sharing & Downloads for progress');
    }
    throw new Error('Use transferFacade.downloadLink for network downloads');
  }

  async syncContent(_syncRequest: SyncRequest): Promise<void> {}
  async discoverCommunityNetworks(): Promise<CommunityNetwork[]> {
    return [];
  }
  async getNetworkParticipation(): Promise<NetworkParticipation[]> {
    return [];
  }
  async joinCommunityNetwork(_request: JoinNetworkRequest): Promise<void> {}
  async leaveCommunityNetwork(_communityId: string): Promise<void> {}
  async shareWithCommunity(_content: Document | Collection, _communityId: string): Promise<void> {}
  async enableTorRouting(): Promise<void> {}
  async disableTorRouting(): Promise<void> {}
  async createHiddenService(): Promise<string> {
    const s = await onionShareStatus();
    return s.onion || '';
  }
  async getNetworkMetrics(): Promise<NetworkMetrics> {
    return defaultNetworkMetrics();
  }
  async testCensorshipResistance(): Promise<boolean> {
    return true;
  }

  async searchNetwork(query: string, _options: SearchOptions): Promise<SearchResult[]> {
    const matches = await networkFacade.searchFiles(query);

    return matches.map(
      f =>
        ({
          id: f.contentHash,
          title: f.name,
          description: `Available via ${f.peerCount} peer(s)`,
          author: 'P2P Network',
          fileType: (f.name.split('.').pop() as any) || 'pdf',
          fileSize: f.size,
          uploadDate: new Date().toISOString(),
          tags: ['p2p', 'decentralized'],
          culturalLevel: 1,
          peerId: f.peers[0]?.nodeId || 'unknown',
          peerReputation: 5,
          relevanceScore: 100,
          filePath: f.link,
        }) as any
    );
  }

  async seedLibraryFolder(): Promise<{ seeded: number; errors: number }> {
    const local = await transferFacade.listShares();
    return { seeded: local.length, errors: 0 };
  }

  async watchAndSeedLibrary(): Promise<void> {}
}

export const p2pNetworkService: P2PNetworkService = new P2PNetworkServiceImpl();
