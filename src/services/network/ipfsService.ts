/**
 * IPFS Content Addressing Service
 *
 * Provides decentralized content storage and addressing through IPFS,
 * ensuring content persistence and resistance to censorship.
 *
 * ANTI-CENSORSHIP PRINCIPLES:
 * - Content addressing independent of cultural sensitivity
 * - No content blocking based on cultural factors
 * - Educational cultural context included without restrictions
 * - Support for alternative narratives and multiple perspectives
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  ContentHash,
  IPFSConfig,
  IPFSNode,
  ContentMetadata,
  PinningStrategy,
  IPFSStats,
} from '../../types/IPFS';
import type { Document } from '../../types/Document';
import type { Collection } from '../../types/Collection';
import type { CulturalMetadata } from '../../types/Cultural';

/**
 * IPFS Service Interface
 */
export interface IPFSService {
  // Node management
  initializeNode(config: IPFSConfig): Promise<IPFSNode>;
  startNode(): Promise<void>;
  stopNode(): Promise<void>;
  getNodeInfo(): Promise<IPFSNode>;

  // Content operations
  addContent(content: Document | Collection, metadata?: CulturalMetadata): Promise<ContentHash>;
  getContent(hash: string): Promise<Document | Collection>;
  pinContent(hash: string, strategy?: PinningStrategy): Promise<void>;
  unpinContent(hash: string): Promise<void>;

  // Cultural and educational content
  addCulturalContent(
    content: Document | Collection,
    culturalMetadata: CulturalMetadata
  ): Promise<ContentHash>;
  getCulturalContext(hash: string): Promise<CulturalMetadata | null>;
  addEducationalContext(hash: string, context: string): Promise<void>;

  // Anti-censorship features
  replicateContent(hash: string, targetNodes: string[]): Promise<void>;
  ensureAvailability(hash: string): Promise<boolean>;
  createRedundantCopies(hash: string, redundancy: number): Promise<string[]>;

  // Network and statistics
  getStats(): Promise<IPFSStats>;
  findProviders(hash: string): Promise<string[]>;
  announceContent(hash: string): Promise<void>;
}

/**
 * IPFS Service Implementation
 */
class IPFSServiceImpl implements IPFSService {
  private node: IPFSNode | null = null;
  private isRunning: boolean = false;
  private pinnedContent: Set<string> = new Set();

  /**
   * Initialize IPFS node with anti-censorship configuration
   */
  async initializeNode(config: IPFSConfig): Promise<IPFSNode> {
    try {
      const nodeConfig = {
        ...config,
        // Anti-censorship settings
        enableCulturalFiltering: false, // NEVER filter cultural content
        enableContentBlocking: false, // NEVER block content
        educationalMode: true, // Always provide educational context
        preserveAlternatives: true, // Support alternative narratives
        resistCensorship: true, // Enable all anti-censorship features
        publicGateways: config.publicGateways ?? true, // Enable public access
        distributedStorage: true, // Maximize distribution
        redundantPinning: config.redundantPinning ?? 3, // Default 3x redundancy
      };

      this.node = await invoke<IPFSNode>('init_ipfs_node', { config: nodeConfig });

      // Validate anti-censorship configuration
      if (this.node.config.enableCulturalFiltering || this.node.config.enableContentBlocking) {
        throw new Error('Anti-censorship violation: IPFS node cannot filter or block content');
      }

      return this.node;
    } catch (error) {
      console.error('Failed to initialize IPFS node:', error);
      throw new Error('Unable to initialize IPFS node');
    }
  }

  /**
   * Start IPFS node
   */
  async startNode(): Promise<void> {
    try {
      if (!this.node) {
        throw new Error('IPFS node must be initialized before starting');
      }

      await invoke('start_ipfs_node', { nodeId: this.node.id });
      this.isRunning = true;

      // Announce anti-censorship capabilities
      await invoke('announce_capabilities', {
        nodeId: this.node.id,
        capabilities: {
          culturalContentSupport: true,
          educationalSharing: true,
          alternativeNarratives: true,
          censorshipResistance: true,
          openAccess: true,
        },
      });
    } catch (error) {
      console.error('Failed to start IPFS node:', error);
      throw new Error('Unable to start IPFS node');
    }
  }

  /**
   * Stop IPFS node
   */
  async stopNode(): Promise<void> {
    try {
      if (!this.node || !this.isRunning) {
        return;
      }

      await invoke('stop_ipfs_node', { nodeId: this.node.id });
      this.isRunning = false;
    } catch (error) {
      console.error('Failed to stop IPFS node:', error);
      throw new Error('Unable to stop IPFS node');
    }
  }

  /**
   * Get IPFS node information
   */
  async getNodeInfo(): Promise<IPFSNode> {
    try {
      if (!this.node) {
        throw new Error('IPFS node not initialized');
      }

      const nodeInfo = await invoke<IPFSNode>('get_ipfs_node_info', {
        nodeId: this.node.id,
      });

      return nodeInfo;
    } catch (error) {
      console.error('Failed to get IPFS node info:', error);
      throw new Error('Unable to retrieve IPFS node information');
    }
  }

  /**
   * Add content to IPFS (no cultural restrictions)
   */
  async addContent(
    content: Document | Collection,
    metadata?: CulturalMetadata
  ): Promise<ContentHash> {
    try {
      const contentPackage = {
        content,
        metadata: metadata
          ? {
              ...metadata,
              // Ensure anti-censorship compliance
              accessRestrictions: false, // NEVER restrict access
              educationalPurpose: true, // Mark as educational
              informationOnly: true, // Cultural info is informational
              preserveAlternatives: true, // Support alternative views
            }
          : undefined,
        antiCensorshipSettings: {
          enablePublicAccess: true, // Enable public access
          enableDistribution: true, // Allow redistribution
          enableMirroring: true, // Allow mirroring
          resistCensorship: true, // Maximum censorship resistance
          supportEducation: true, // Support educational use
        },
      };

      const contentHash = await invoke<ContentHash>('add_content_to_ipfs', {
        nodeId: this.node?.id,
        contentPackage,
      });

      // Automatically pin important content
      if (
        metadata?.sensitivityLevel ||
        content.title?.includes('sacred') ||
        content.title?.includes('traditional')
      ) {
        await this.pinContent(contentHash.ipfsHash, {
          priority: 'high',
          redundancy: 5, // Extra redundancy for cultural content
          educationalAccess: true,
          antiCensorship: true,
        });
      }

      return contentHash;
    } catch (error) {
      console.error('Failed to add content to IPFS:', error);
      throw new Error('Unable to add content to IPFS');
    }
  }

  /**
   * Get content from IPFS
   */
  async getContent(hash: string): Promise<Document | Collection> {
    try {
      const content = await invoke<Document | Collection>('get_content_from_ipfs', {
        nodeId: this.node?.id,
        hash,
        // Anti-censorship retrieval settings
        bypassFilters: true, // NEVER apply filters
        includeEducationalContext: true, // Include cultural context
        supportAlternativeViews: true, // Support alternative narratives
        resistCensorship: true, // Use all anti-censorship methods
      });

      return content;
    } catch (error) {
      console.error(`Failed to get content from IPFS: ${hash}`, error);
      throw new Error('Unable to retrieve content from IPFS');
    }
  }

  /**
   * Pin content for persistence
   */
  async pinContent(hash: string, strategy: PinningStrategy = {}): Promise<void> {
    try {
      const pinningStrategy = {
        priority: strategy.priority || 'normal',
        redundancy: strategy.redundancy || 1,
        // Anti-censorship pinning settings
        educationalAccess: true, // Ensure educational access
        antiCensorship: true, // Maximum persistence
        culturalPreservation: true, // Preserve cultural content
        alternativeNarratives: true, // Preserve alternative views
        ...strategy,
      };

      await invoke('pin_content', {
        nodeId: this.node?.id,
        hash,
        strategy: pinningStrategy,
      });

      this.pinnedContent.add(hash);

      // Create redundant copies for important content
      if (pinningStrategy.redundancy > 1) {
        await this.createRedundantCopies(hash, pinningStrategy.redundancy);
      }
    } catch (error) {
      console.error(`Failed to pin content: ${hash}`, error);
      throw new Error('Unable to pin content');
    }
  }

  /**
   * Unpin content
   */
  async unpinContent(hash: string): Promise<void> {
    try {
      await invoke('unpin_content', {
        nodeId: this.node?.id,
        hash,
      });

      this.pinnedContent.delete(hash);
    } catch (error) {
      console.error(`Failed to unpin content: ${hash}`, error);
      throw new Error('Unable to unpin content');
    }
  }

  /**
   * Add cultural content with educational context
   */
  async addCulturalContent(
    content: Document | Collection,
    culturalMetadata: CulturalMetadata
  ): Promise<ContentHash> {
    try {
      // ANTI-CENSORSHIP: Cultural content gets same treatment as all content
      const enhancedMetadata = {
        ...culturalMetadata,
        // Enhance with educational context
        educationalContext:
          culturalMetadata.educationalContext ||
          'This content includes cultural information provided for educational purposes and cultural understanding.',
        // Ensure anti-censorship compliance
        accessRestrictions: false, // NEVER restrict access
        educationalPurpose: true, // Mark as educational
        informationOnly: true, // Cultural info is informational only
        preserveAlternatives: true, // Support alternative perspectives
        communityInformation: true, // Community provides information, not control
      };

      const contentHash = await this.addContent(content, enhancedMetadata);

      // Pin cultural content with high priority
      await this.pinContent(contentHash.ipfsHash, {
        priority: 'high',
        redundancy: 5,
        educationalAccess: true,
        culturalPreservation: true,
        antiCensorship: true,
      });

      // Add educational context
      await this.addEducationalContext(
        contentHash.ipfsHash,
        enhancedMetadata.educationalContext || 'Cultural content for educational purposes'
      );

      return contentHash;
    } catch (error) {
      console.error('Failed to add cultural content:', error);
      throw new Error('Unable to add cultural content to IPFS');
    }
  }

  /**
   * Get cultural context for content
   */
  async getCulturalContext(hash: string): Promise<CulturalMetadata | null> {
    try {
      const context = await invoke<CulturalMetadata | null>('get_cultural_context', {
        nodeId: this.node?.id,
        hash,
      });

      return context;
    } catch (error) {
      console.error(`Failed to get cultural context: ${hash}`, error);
      return null; // Don't throw - cultural context is optional
    }
  }

  /**
   * Add educational context to content
   */
  async addEducationalContext(hash: string, context: string): Promise<void> {
    try {
      await invoke('add_educational_context', {
        nodeId: this.node?.id,
        hash,
        context: {
          text: context,
          purpose: 'educational',
          antiCensorshipNote:
            'This context is provided for educational purposes and does not restrict access to the content.',
          educationalValue: true,
          informationOnly: true,
        },
      });
    } catch (error) {
      console.error(`Failed to add educational context: ${hash}`, error);
      throw new Error('Unable to add educational context');
    }
  }

  /**
   * Replicate content across multiple nodes
   */
  async replicateContent(hash: string, targetNodes: string[]): Promise<void> {
    try {
      await invoke('replicate_content', {
        nodeId: this.node?.id,
        hash,
        targetNodes,
        replicationSettings: {
          priority: 'high',
          verifyIntegrity: true,
          enableEducationalAccess: true,
          supportCulturalSharing: true,
          resistCensorship: true,
        },
      });
    } catch (error) {
      console.error(`Failed to replicate content: ${hash}`, error);
      throw new Error('Unable to replicate content');
    }
  }

  /**
   * Ensure content availability
   */
  async ensureAvailability(hash: string): Promise<boolean> {
    try {
      const isAvailable = await invoke<boolean>('ensure_content_availability', {
        nodeId: this.node?.id,
        hash,
        requirements: {
          minimumProviders: 3,
          verifyIntegrity: true,
          checkEducationalAccess: true,
          verifyCensorshipResistance: true,
        },
      });

      return isAvailable;
    } catch (error) {
      console.error(`Failed to ensure availability: ${hash}`, error);
      return false;
    }
  }

  /**
   * Create redundant copies for censorship resistance
   */
  async createRedundantCopies(hash: string, redundancy: number): Promise<string[]> {
    try {
      const copies = await invoke<string[]>('create_redundant_copies', {
        nodeId: this.node?.id,
        hash,
        redundancy,
        distributionStrategy: {
          geographicDistribution: true, // Spread across regions
          networkDiversity: true, // Use different networks
          censorshipResistance: true, // Prioritize censorship-resistant nodes
          educationalAccess: true, // Ensure educational accessibility
        },
      });

      return copies;
    } catch (error) {
      console.error(`Failed to create redundant copies: ${hash}`, error);
      throw new Error('Unable to create redundant copies');
    }
  }

  /**
   * Get IPFS statistics
   */
  async getStats(): Promise<IPFSStats> {
    try {
      const stats = await invoke<IPFSStats>('get_ipfs_stats', {
        nodeId: this.node?.id,
      });

      return stats;
    } catch (error) {
      console.error('Failed to get IPFS stats:', error);
      throw new Error('Unable to retrieve IPFS statistics');
    }
  }

  /**
   * Find content providers
   */
  async findProviders(hash: string): Promise<string[]> {
    try {
      const providers = await invoke<string[]>('find_content_providers', {
        nodeId: this.node?.id,
        hash,
        searchCriteria: {
          includeCensorshipResistantNodes: true,
          includeEducationalNodes: true,
          includeCulturalNodes: true,
          verifyAntiCensorshipCapabilities: true,
        },
      });

      return providers;
    } catch (error) {
      console.error(`Failed to find providers: ${hash}`, error);
      throw new Error('Unable to find content providers');
    }
  }

  /**
   * Announce content availability
   */
  async announceContent(hash: string): Promise<void> {
    try {
      await invoke('announce_content', {
        nodeId: this.node?.id,
        hash,
        announcement: {
          enableEducationalAccess: true,
          supportCulturalSharing: true,
          enableAntiCensorship: true,
          supportAlternativeNarratives: true,
          openAccess: true,
        },
      });
    } catch (error) {
      console.error(`Failed to announce content: ${hash}`, error);
      throw new Error('Unable to announce content');
    }
  }
}

// Export singleton instance
export const ipfsService: IPFSService = new IPFSServiceImpl();
