/**
 * Collection Service with Cultural Integration and P2P Sharing
 *
 * Provides comprehensive collection management with respect for cultural heritage,
 * community collaboration, and decentralized sharing capabilities.
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  Collection,
  CollectionType,
  CollectionVisibility,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  CollectionSearchFilters,
  CollectionSearchOptions,
  CollectionAnalytics,
  CollectionStatistics,
  P2PSharingConfig,
  CulturalValidationStatus,
  CollectionOrganization,
} from '../types/Collection';
import type { Document } from '../types/Document';
import type { CulturalMetadata, CulturalInformation } from '../types/Cultural';

/**
 * Collection service interface
 */
export interface CollectionService {
  // Core CRUD operations
  getCollections(
    filters?: CollectionSearchFilters,
    options?: CollectionSearchOptions
  ): Promise<Collection[]>;
  getCollection(id: string, includeDocuments?: boolean): Promise<Collection | null>;
  createCollection(request: CreateCollectionRequest): Promise<Collection>;
  updateCollection(id: string, request: UpdateCollectionRequest): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;

  // Document management
  addDocumentsToCollection(collectionId: string, documentIds: string[]): Promise<void>;
  removeDocumentsFromCollection(collectionId: string, documentIds: string[]): Promise<void>;
  getCollectionDocuments(collectionId: string, filters?: any): Promise<Document[]>;

  // Organization and tagging
  organizeCollection(
    collectionId: string,
    organization: Partial<CollectionOrganization>
  ): Promise<void>;
  addTagsToCollection(collectionId: string, tags: string[]): Promise<void>;
  removeTagsFromCollection(collectionId: string, tags: string[]): Promise<void>;
  categorizeCollection(collectionId: string, categories: string[]): Promise<void>;

  // Cultural validation
  validateCulturalAccess(
    collectionId: string,
    culturalMetadata: CulturalMetadata
  ): Promise<CulturalInformation>;
  requestCulturalValidation(collectionId: string): Promise<CulturalValidationStatus>;
  updateCulturalMetadata(collectionId: string, metadata: Partial<CulturalMetadata>): Promise<void>;

  // Collaboration
  addCollaborator(collectionId: string, userId: string, permission: string): Promise<void>;
  removeCollaborator(collectionId: string, userId: string): Promise<void>;
  updateCollaboratorPermission(
    collectionId: string,
    userId: string,
    permission: string
  ): Promise<void>;

  // P2P sharing
  enableP2PSharing(collectionId: string, config: Partial<P2PSharingConfig>): Promise<void>;
  disableP2PSharing(collectionId: string): Promise<void>;
  syncCollection(collectionId: string): Promise<void>;
  shareCollectionWithPeer(collectionId: string, peerId: string): Promise<void>;

  // Analytics and statistics
  getCollectionAnalytics(
    collectionId: string,
    period?: { start: Date; end: Date }
  ): Promise<CollectionAnalytics>;
  getCollectionStatistics(collectionId: string): Promise<CollectionStatistics>;

  // Search and discovery
  searchCollections(query: string, filters?: CollectionSearchFilters): Promise<Collection[]>;
  getRecommendedCollections(userId: string, limit?: number): Promise<Collection[]>;
  getPopularCollections(limit?: number): Promise<Collection[]>;

  // Import/Export
  exportCollection(collectionId: string, format: 'json' | 'csv' | 'bibtex'): Promise<string>;
  importCollection(data: string, format: 'json' | 'csv' | 'bibtex'): Promise<Collection>;
}

/**
 * Collection service implementation
 */
class CollectionServiceImpl implements CollectionService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private collectionsCache = new Map<string, { data: Collection[]; timestamp: number }>();
  private collectionCache = new Map<string, { data: Collection; timestamp: number }>();

  /**
   * Get collections with filtering and search
   */
  async getCollections(
    filters: CollectionSearchFilters = {},
    options: CollectionSearchOptions = {}
  ): Promise<Collection[]> {
    try {
      // Check cache first
      const cacheKey = JSON.stringify({ filters, options });
      const cached = this.collectionsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      const result = await invoke<Collection[]>('get_collections', {
        filters: {
          query: filters.query,
          type: filters.type,
          visibility: filters.visibility,
          culturalOrigin: filters.culturalOrigin,
          culturalSensitivity: filters.culturalSensitivity,
          ownerId: filters.ownerId,
          collaboratorId: filters.collaboratorId,
          tags: filters.tags,
          categories: filters.categories,
          dateRange: filters.dateRange,
          documentCountRange: filters.documentCountRange,
          sizeRange: filters.sizeRange,
          culturalValidationStatus: filters.culturalValidationStatus,
          p2pEnabled: filters.p2pEnabled,
        },
        options: {
          sortBy: options.sortBy || 'updated',
          sortOrder: options.sortOrder || 'desc',
          maxResults: options.maxResults || 50,
          includeDocuments: options.includeDocuments || false,
          includeStatistics: options.includeStatistics || true,
          includeCollaborators: options.includeCollaborators || false,
          respectCulturalBoundaries: options.respectCulturalBoundaries !== false,
          showEducationalContext: options.showEducationalContext !== false,
        },
      });

      // Process cultural validation for each collection
      const processedCollections = await Promise.all(
        result.map(async collection => {
          if (options.respectCulturalBoundaries) {
            const culturalInfo = await this.validateCulturalAccess(
              collection.id,
              collection.culturalMetadata
            );

            // Always return collection with cultural information
            return {
              ...collection,
              culturalInformation: culturalInfo,
            };
          }
          return collection;
        })
      );

      // Cache the results
      this.collectionsCache.set(cacheKey, {
        data: processedCollections,
        timestamp: Date.now(),
      });

      return processedCollections;
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      throw new Error('Unable to load collections');
    }
  }

  /**
   * Get a single collection by ID
   */
  async getCollection(id: string, includeDocuments = false): Promise<Collection | null> {
    try {
      // Check cache first
      const cacheKey = `${id}_${includeDocuments}`;
      const cached = this.collectionCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      const result = await invoke<Collection | null>('get_collection', {
        id,
        includeDocuments,
      });

      if (!result) {
        return null;
      }

      // Validate cultural access
      const culturalInfo = await this.validateCulturalAccess(result.id, result.culturalMetadata);

      const processedCollection = {
        ...result,
        culturalInformation: culturalInfo,
      };

      // Cache the result
      this.collectionCache.set(cacheKey, {
        data: processedCollection,
        timestamp: Date.now(),
      });

      return processedCollection;
    } catch (error) {
      console.error(`Failed to fetch collection ${id}:`, error);
      throw new Error('Unable to load collection');
    }
  }

  /**
   * Create a new collection
   */
  async createCollection(request: CreateCollectionRequest): Promise<Collection> {
    try {
      // Validate input
      this.validateCreateCollectionRequest(request);

      // Cultural validation for sensitive content
      if (
        request.culturalMetadata.sensitivityLevel &&
        request.culturalMetadata.sensitivityLevel > 2
      ) {
        const culturalValidation = await this.requestCulturalValidation(request.name);
        // Note: Cultural validation provides information only, never blocks creation
      }

      const result = await invoke<Collection>('create_collection', {
        name: request.name,
        description: request.description,
        type: request.type,
        visibility: request.visibility,
        documentIds: request.documentIds || [],
        culturalMetadata: {
          sensitivityLevel: request.culturalMetadata.sensitivityLevel || 1,
          culturalOrigin: request.culturalMetadata.culturalOrigin,
          communityId: request.culturalMetadata.communityId,
          traditionalProtocols: request.culturalMetadata.traditionalProtocols || [],
          educationalContext: request.culturalMetadata.educationalContext,
          culturalContext: request.culturalMetadata.culturalContext,
          sourceAttribution: request.culturalMetadata.sourceAttribution,
          culturalGroup: request.culturalMetadata.culturalGroup,
          relatedConcepts: request.culturalMetadata.relatedConcepts || [],
          communityNotes: request.culturalMetadata.communityNotes,
        },
        tags: request.tags || [],
        categories: request.categories || [],
        p2pSharing: {
          enabled: request.p2pSharing?.enabled || false,
          peerDiscovery: request.p2pSharing?.peerDiscovery || false,
          allowedNetworks: request.p2pSharing?.allowedNetworks || [],
          restrictions: {
            requireCulturalApproval:
              request.p2pSharing?.restrictions?.requireCulturalApproval || false,
            communityMembersOnly: request.p2pSharing?.restrictions?.communityMembersOnly || false,
            educationalUseOnly: request.p2pSharing?.restrictions?.educationalUseOnly || false,
            noCommercialUse: request.p2pSharing?.restrictions?.noCommercialUse || true,
          },
          encryption: {
            enabled: request.p2pSharing?.encryption?.enabled || false,
          },
          syncPreferences: {
            autoSync: request.p2pSharing?.syncPreferences?.autoSync || false,
            syncFrequency: request.p2pSharing?.syncPreferences?.syncFrequency || 60,
            conflictResolution: request.p2pSharing?.syncPreferences?.conflictResolution || 'manual',
          },
        },
        organization: {
          defaultSort: {
            field: request.organization?.defaultSort?.field || 'date',
            order: request.organization?.defaultSort?.order || 'desc',
          },
          grouping: {
            enabled: request.organization?.grouping?.enabled || false,
            groupBy: request.organization?.grouping?.groupBy || 'cultural_origin',
          },
          filtering: {
            defaultFilters: request.organization?.filtering?.defaultFilters || [],
            hiddenSensitivityLevels: request.organization?.filtering?.hiddenSensitivityLevels || [],
            showEducationalOnly: request.organization?.filtering?.showEducationalOnly || false,
          },
          display: {
            viewMode: request.organization?.display?.viewMode || 'grid',
            thumbnailSize: request.organization?.display?.thumbnailSize || 'medium',
            showCulturalContext: request.organization?.display?.showCulturalContext !== false,
            showStatistics: request.organization?.display?.showStatistics !== false,
          },
          autoOrganization: {
            enabled: request.organization?.autoOrganization?.enabled || false,
            rules: request.organization?.autoOrganization?.rules || [],
          },
        },
        collaborators: request.collaborators || [],
      });

      // Clear cache
      this.collectionsCache.clear();

      return result;
    } catch (error) {
      console.error('Failed to create collection:', error);
      throw new Error('Unable to create collection');
    }
  }

  /**
   * Update an existing collection
   */
  async updateCollection(id: string, request: UpdateCollectionRequest): Promise<Collection> {
    try {
      const result = await invoke<Collection>('update_collection', {
        id,
        updates: request,
      });

      // Clear cache
      this.collectionsCache.clear();
      this.collectionCache.delete(id);

      return result;
    } catch (error) {
      console.error(`Failed to update collection ${id}:`, error);
      throw new Error('Unable to update collection');
    }
  }

  /**
   * Delete a collection
   */
  async deleteCollection(id: string): Promise<void> {
    try {
      await invoke('delete_collection', { id });

      // Clear cache
      this.collectionsCache.clear();
      this.collectionCache.delete(id);
    } catch (error) {
      console.error(`Failed to delete collection ${id}:`, error);
      throw new Error('Unable to delete collection');
    }
  }

  /**
   * Add documents to a collection
   */
  async addDocumentsToCollection(collectionId: string, documentIds: string[]): Promise<void> {
    try {
      await invoke('add_documents_to_collection', {
        collectionId,
        documentIds,
      });

      // Clear cache
      this.collectionCache.delete(collectionId);
    } catch (error) {
      console.error(`Failed to add documents to collection ${collectionId}:`, error);
      throw new Error('Unable to add documents to collection');
    }
  }

  /**
   * Remove documents from a collection
   */
  async removeDocumentsFromCollection(collectionId: string, documentIds: string[]): Promise<void> {
    try {
      await invoke('remove_documents_from_collection', {
        collectionId,
        documentIds,
      });

      // Clear cache
      this.collectionCache.delete(collectionId);
    } catch (error) {
      console.error(`Failed to remove documents from collection ${collectionId}:`, error);
      throw new Error('Unable to remove documents from collection');
    }
  }

  /**
   * Get documents in a collection
   */
  async getCollectionDocuments(collectionId: string, filters: any = {}): Promise<Document[]> {
    try {
      return await invoke<Document[]>('get_collection_documents', {
        collectionId,
        filters,
      });
    } catch (error) {
      console.error(`Failed to get documents for collection ${collectionId}:`, error);
      throw new Error('Unable to load collection documents');
    }
  }

  /**
   * Organize collection with new settings
   */
  async organizeCollection(
    collectionId: string,
    organization: Partial<CollectionOrganization>
  ): Promise<void> {
    try {
      await invoke('organize_collection', {
        collectionId,
        organization,
      });

      // Clear cache
      this.collectionCache.delete(collectionId);
    } catch (error) {
      console.error(`Failed to organize collection ${collectionId}:`, error);
      throw new Error('Unable to organize collection');
    }
  }

  /**
   * Add tags to collection
   */
  async addTagsToCollection(collectionId: string, tags: string[]): Promise<void> {
    try {
      await invoke('add_tags_to_collection', {
        collectionId,
        tags,
      });

      // Clear cache
      this.collectionCache.delete(collectionId);
    } catch (error) {
      console.error(`Failed to add tags to collection ${collectionId}:`, error);
      throw new Error('Unable to add tags to collection');
    }
  }

  /**
   * Remove tags from collection
   */
  async removeTagsFromCollection(collectionId: string, tags: string[]): Promise<void> {
    try {
      await invoke('remove_tags_from_collection', {
        collectionId,
        tags,
      });

      // Clear cache
      this.collectionCache.delete(collectionId);
    } catch (error) {
      console.error(`Failed to remove tags from collection ${collectionId}:`, error);
      throw new Error('Unable to remove tags from collection');
    }
  }

  /**
   * Categorize collection
   */
  async categorizeCollection(collectionId: string, categories: string[]): Promise<void> {
    try {
      await invoke('categorize_collection', {
        collectionId,
        categories,
      });

      // Clear cache
      this.collectionCache.delete(collectionId);
    } catch (error) {
      console.error(`Failed to categorize collection ${collectionId}:`, error);
      throw new Error('Unable to categorize collection');
    }
  }

  /**
   * Validate cultural access (information only, no restriction)
   */
  async validateCulturalAccess(
    collectionId: string,
    culturalMetadata: CulturalMetadata
  ): Promise<CulturalInformation> {
    try {
      const result = await invoke<CulturalInformation>('validate_cultural_access', {
        collectionId,
        culturalMetadata,
      });

      // Always return cultural information for educational purposes
      return {
        ...result,
        informationOnly: true,
        educationalPurpose: true,
      };
    } catch (error) {
      console.error(`Failed to validate cultural access for collection ${collectionId}:`, error);

      // Return basic cultural information even on error
      return {
        sensitivityLevel: culturalMetadata.sensitivityLevel,
        culturalContext: culturalMetadata.culturalContext,
        educationalResources: [],
        traditionalProtocols: culturalMetadata.traditionalProtocols || [],
        informationOnly: true,
        educationalPurpose: true,
      };
    }
  }

  /**
   * Request cultural validation (information gathering, not approval)
   */
  async requestCulturalValidation(collectionId: string): Promise<CulturalValidationStatus> {
    try {
      return await invoke<CulturalValidationStatus>('request_cultural_validation', {
        collectionId,
      });
    } catch (error) {
      console.error(`Failed to request cultural validation for collection ${collectionId}:`, error);
      throw new Error('Unable to request cultural validation');
    }
  }

  /**
   * Update cultural metadata
   */
  async updateCulturalMetadata(
    collectionId: string,
    metadata: Partial<CulturalMetadata>
  ): Promise<void> {
    try {
      await invoke('update_cultural_metadata', {
        collectionId,
        metadata,
      });

      // Clear cache
      this.collectionCache.delete(collectionId);
    } catch (error) {
      console.error(`Failed to update cultural metadata for collection ${collectionId}:`, error);
      throw new Error('Unable to update cultural metadata');
    }
  }

  /**
   * Add collaborator to collection
   */
  async addCollaborator(collectionId: string, userId: string, permission: string): Promise<void> {
    try {
      await invoke('add_collaborator', {
        collectionId,
        userId,
        permission,
      });

      // Clear cache
      this.collectionCache.delete(collectionId);
    } catch (error) {
      console.error(`Failed to add collaborator to collection ${collectionId}:`, error);
      throw new Error('Unable to add collaborator');
    }
  }

  /**
   * Remove collaborator from collection
   */
  async removeCollaborator(collectionId: string, userId: string): Promise<void> {
    try {
      await invoke('remove_collaborator', {
        collectionId,
        userId,
      });

      // Clear cache
      this.collectionCache.delete(collectionId);
    } catch (error) {
      console.error(`Failed to remove collaborator from collection ${collectionId}:`, error);
      throw new Error('Unable to remove collaborator');
    }
  }

  /**
   * Update collaborator permission
   */
  async updateCollaboratorPermission(
    collectionId: string,
    userId: string,
    permission: string
  ): Promise<void> {
    try {
      await invoke('update_collaborator_permission', {
        collectionId,
        userId,
        permission,
      });

      // Clear cache
      this.collectionCache.delete(collectionId);
    } catch (error) {
      console.error(
        `Failed to update collaborator permission for collection ${collectionId}:`,
        error
      );
      throw new Error('Unable to update collaborator permission');
    }
  }

  /**
   * Enable P2P sharing for collection
   */
  async enableP2PSharing(collectionId: string, config: Partial<P2PSharingConfig>): Promise<void> {
    try {
      await invoke('enable_p2p_sharing', {
        collectionId,
        config,
      });

      // Clear cache
      this.collectionCache.delete(collectionId);
    } catch (error) {
      console.error(`Failed to enable P2P sharing for collection ${collectionId}:`, error);
      throw new Error('Unable to enable P2P sharing');
    }
  }

  /**
   * Disable P2P sharing for collection
   */
  async disableP2PSharing(collectionId: string): Promise<void> {
    try {
      await invoke('disable_p2p_sharing', {
        collectionId,
      });

      // Clear cache
      this.collectionCache.delete(collectionId);
    } catch (error) {
      console.error(`Failed to disable P2P sharing for collection ${collectionId}:`, error);
      throw new Error('Unable to disable P2P sharing');
    }
  }

  /**
   * Sync collection with peers
   */
  async syncCollection(collectionId: string): Promise<void> {
    try {
      await invoke('sync_collection', {
        collectionId,
      });
    } catch (error) {
      console.error(`Failed to sync collection ${collectionId}:`, error);
      throw new Error('Unable to sync collection');
    }
  }

  /**
   * Share collection with specific peer
   */
  async shareCollectionWithPeer(collectionId: string, peerId: string): Promise<void> {
    try {
      await invoke('share_collection_with_peer', {
        collectionId,
        peerId,
      });
    } catch (error) {
      console.error(`Failed to share collection ${collectionId} with peer ${peerId}:`, error);
      throw new Error('Unable to share collection with peer');
    }
  }

  /**
   * Get collection analytics
   */
  async getCollectionAnalytics(
    collectionId: string,
    period?: { start: Date; end: Date }
  ): Promise<CollectionAnalytics> {
    try {
      return await invoke<CollectionAnalytics>('get_collection_analytics', {
        collectionId,
        period,
      });
    } catch (error) {
      console.error(`Failed to get analytics for collection ${collectionId}:`, error);
      throw new Error('Unable to load collection analytics');
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStatistics(collectionId: string): Promise<CollectionStatistics> {
    try {
      return await invoke<CollectionStatistics>('get_collection_statistics', {
        collectionId,
      });
    } catch (error) {
      console.error(`Failed to get statistics for collection ${collectionId}:`, error);
      throw new Error('Unable to load collection statistics');
    }
  }

  /**
   * Search collections
   */
  async searchCollections(
    query: string,
    filters: CollectionSearchFilters = {}
  ): Promise<Collection[]> {
    try {
      return await this.getCollections(
        { ...filters, query },
        { sortBy: 'relevance', respectCulturalBoundaries: true }
      );
    } catch (error) {
      console.error('Failed to search collections:', error);
      throw new Error('Unable to search collections');
    }
  }

  /**
   * Get recommended collections for user
   */
  async getRecommendedCollections(userId: string, limit = 10): Promise<Collection[]> {
    try {
      return await invoke<Collection[]>('get_recommended_collections', {
        userId,
        limit,
      });
    } catch (error) {
      console.error(`Failed to get recommended collections for user ${userId}:`, error);
      throw new Error('Unable to load recommended collections');
    }
  }

  /**
   * Get popular collections
   */
  async getPopularCollections(limit = 10): Promise<Collection[]> {
    try {
      return await invoke<Collection[]>('get_popular_collections', {
        limit,
      });
    } catch (error) {
      console.error('Failed to get popular collections:', error);
      throw new Error('Unable to load popular collections');
    }
  }

  /**
   * Export collection
   */
  async exportCollection(collectionId: string, format: 'json' | 'csv' | 'bibtex'): Promise<string> {
    try {
      return await invoke<string>('export_collection', {
        collectionId,
        format,
      });
    } catch (error) {
      console.error(`Failed to export collection ${collectionId}:`, error);
      throw new Error('Unable to export collection');
    }
  }

  /**
   * Import collection
   */
  async importCollection(data: string, format: 'json' | 'csv' | 'bibtex'): Promise<Collection> {
    try {
      const result = await invoke<Collection>('import_collection', {
        data,
        format,
      });

      // Clear cache
      this.collectionsCache.clear();

      return result;
    } catch (error) {
      console.error('Failed to import collection:', error);
      throw new Error('Unable to import collection');
    }
  }

  /**
   * Validate create collection request
   */
  private validateCreateCollectionRequest(request: CreateCollectionRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Collection name is required');
    }

    if (request.name.length > 255) {
      throw new Error('Collection name must be less than 255 characters');
    }

    if (!Object.values(CollectionType).includes(request.type)) {
      throw new Error('Invalid collection type');
    }

    if (!Object.values(CollectionVisibility).includes(request.visibility)) {
      throw new Error('Invalid collection visibility');
    }

    if (request.description && request.description.length > 2000) {
      throw new Error('Collection description must be less than 2000 characters');
    }

    if (request.tags && request.tags.length > 50) {
      throw new Error('Collection cannot have more than 50 tags');
    }

    if (request.categories && request.categories.length > 20) {
      throw new Error('Collection cannot have more than 20 categories');
    }
  }
}

// Export singleton instance
export const collectionService: CollectionService = new CollectionServiceImpl();
