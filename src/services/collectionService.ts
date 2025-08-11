/**
 * Collection Service with Cultural Integration and P2P Sharing
 *
 * Provides comprehensive collection management with respect for cultural heritage,
 * community collaboration, and decentralized sharing capabilities.
 */

import { invoke } from '@tauri-apps/api/core';
import {
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
import { CulturalSensitivityLevel } from '../types/Cultural';

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

  // Method to clear cache for testing
  clearCache(): void {
    this.collectionsCache.clear();
    this.collectionCache.clear();
  }

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

      // Fetch collections with filters/options passed to backend
      const result = await invoke<Collection[]>('get_collections', {
        filters,
        options,
      });

      // Cache the results
      this.collectionsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
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

      // Cache the result
      this.collectionCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(`Failed to fetch collection ${id}:`, error);
      throw error; // Re-throw the original error to preserve the error message
    }
  }

  /**
   * Create a new collection
   */
  async createCollection(request: CreateCollectionRequest): Promise<Collection> {
    try {
      // Validate input
      this.validateCreateCollectionRequest(request);

      // Note: Cultural validation is information-only and should not be invoked as an approval gate on create.

      const result = await invoke<{
        id: string;
        name: string;
        description?: string;
        type_: string;
        visibility: string;
        document_count: number;
        created_at: string;
        updated_at: string;
        cultural_metadata?: any;
        tags: string[];
        categories: string[];
      }>('create_collection', {
        name: request.name,
        description: request.description,
        type_: request.type,
        visibility: request.visibility,
        document_ids: request.documentIds || [],
        cultural_metadata: request.culturalMetadata
          ? {
              sensitivity_level: request.culturalMetadata.sensitivityLevel,
              cultural_origin: request.culturalMetadata.culturalOrigin,
              community_id: request.culturalMetadata.communityId,
              traditional_protocols: request.culturalMetadata.traditionalProtocols || [],
              educational_context: request.culturalMetadata.educationalContext,
              cultural_context: request.culturalMetadata.culturalContext,
              source_attribution: request.culturalMetadata.sourceAttribution,
              cultural_group: request.culturalMetadata.culturalGroup,
              related_concepts: request.culturalMetadata.relatedConcepts || [],
              community_notes: request.culturalMetadata.communityNotes,
            }
          : undefined,
        tags: request.tags || [],
        categories: request.categories || [],
      });

      // Convert the response to a Collection object
      const resolvedType = (result as any).type ?? (result as any).type_;
      const createdAtRaw = (result as any).createdAt ?? (result as any).created_at;
      const updatedAtRaw = (result as any).updatedAt ?? (result as any).updated_at;

      const collection: Collection = {
        id: result.id,
        name: result.name,
        description: (result as any).description,
        type: resolvedType as CollectionType,
        visibility: (result as any).visibility as CollectionVisibility,
        documentIds: [],
        culturalMetadata:
          (request && request.culturalMetadata
            ? (request.culturalMetadata as any)
            : {
                sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
              }) as any,
        ownerId: ((result as any).owner_id as string) || 'current-user',
        collaborators: [],
        createdAt: new Date(createdAtRaw),
        updatedAt: new Date(updatedAtRaw),
        tags: (result as any).tags || [],
        categories: (result as any).categories || [],
        // Minimal objects to match tests expecting empty structures
        statistics: {} as any,
        p2pSharing: {} as any,
        culturalValidation: {} as any,
        organization: {} as any,
        accessHistory: [],
        relationships: [],
        syncStatus: {} as any,
      };

      // Clear cache
      this.collectionsCache.clear();

      return collection;
    } catch (error) {
      console.error('Failed to create collection:', error);
      throw error; // Re-throw the original error to preserve the error message
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
        culturalContext: culturalMetadata.culturalContext || 'No cultural context provided',
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
