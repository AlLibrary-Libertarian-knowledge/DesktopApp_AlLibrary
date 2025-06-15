import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  Collection,
  CreateCollectionRequest,
  CollectionSearchFilters,
} from '../../types/Collection';
import { CollectionType, CollectionVisibility } from '../../types/Collection';
import type { CulturalMetadata } from '../../types/Cultural';
import { CulturalSensitivityLevel } from '../../types/Cultural';

// Mock Tauri
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { collectionService } from '../collectionService';

describe('CollectionService', () => {
  let mockInvoke: any;

  beforeEach(async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    mockInvoke = vi.mocked(invoke);
    mockInvoke.mockClear();
  });

  describe('Anti-Censorship Enforcement', () => {
    it('never blocks collection creation based on cultural content', async () => {
      const culturalCollection: CreateCollectionRequest = {
        name: 'Indigenous Sacred Texts',
        description: 'Traditional spiritual knowledge from various tribes',
        type: CollectionType.CULTURAL,
        visibility: CollectionVisibility.PUBLIC,
        culturalMetadata: {
          sensitivityLevel: CulturalSensitivityLevel.SACRED,
          culturalOrigin: 'Indigenous',
          traditionalProtocols: ['sacred', 'traditional'],
        } as CulturalMetadata,
        tags: ['sacred', 'traditional', 'spiritual'],
      };

      const expectedResult = {
        id: '1',
        ...culturalCollection,
        documentIds: [],
        collaborators: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        statistics: {} as any,
        p2pSharing: {} as any,
        culturalValidation: {} as any,
        organization: {} as any,
        accessHistory: [],
        relationships: [],
        syncStatus: {} as any,
        ownerId: 'user1',
        categories: [],
      };
      mockInvoke.mockResolvedValue(expectedResult);

      const result = await collectionService.createCollection(culturalCollection);

      expect(result).toBeDefined();
      expect(mockInvoke).toHaveBeenCalledWith('create_collection', expect.any(Object));
      // Verify no cultural blocking occurred
      expect(result.culturalMetadata?.sensitivityLevel).toBe(CulturalSensitivityLevel.SACRED);
    });

    it('provides cultural context without restricting access', async () => {
      const collectionId = '1';
      const mockCollection = {
        id: collectionId,
        name: 'Cultural Heritage Collection',
        type: CollectionType.CULTURAL,
        visibility: CollectionVisibility.PUBLIC,
        documentIds: [],
        collaborators: [],
        culturalMetadata: {
          sensitivityLevel: CulturalSensitivityLevel.GUARDIAN,
          culturalOrigin: 'Aboriginal Australian',
          traditionalProtocols: ['dreamtime', 'educational'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        categories: [],
        statistics: {} as any,
        p2pSharing: {} as any,
        culturalValidation: {} as any,
        organization: {} as any,
        accessHistory: [],
        relationships: [],
        syncStatus: {} as any,
        ownerId: 'user1',
      };

      mockInvoke.mockResolvedValue(mockCollection);

      const result = await collectionService.getCollection(collectionId);

      expect(result?.culturalMetadata).toBeDefined();
      expect(result?.culturalMetadata?.sensitivityLevel).toBe(CulturalSensitivityLevel.GUARDIAN);
    });

    it('supports multiple cultural perspectives equally', async () => {
      const searchFilters: CollectionSearchFilters = {
        culturalOrigin: ['western', 'indigenous', 'eastern'],
        query: 'history',
      };

      const multiculturalResults = [
        {
          id: '1',
          name: 'Western History',
          type: CollectionType.EDUCATIONAL,
          visibility: CollectionVisibility.PUBLIC,
          culturalMetadata: {
            sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
            culturalOrigin: 'western',
          },
          documentIds: [],
          collaborators: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          categories: [],
          statistics: {} as any,
          p2pSharing: {} as any,
          culturalValidation: {} as any,
          organization: {} as any,
          accessHistory: [],
          relationships: [],
          syncStatus: {} as any,
          ownerId: 'user1',
        },
        {
          id: '2',
          name: 'Indigenous History',
          type: CollectionType.CULTURAL,
          visibility: CollectionVisibility.PUBLIC,
          culturalMetadata: {
            sensitivityLevel: CulturalSensitivityLevel.COMMUNITY,
            culturalOrigin: 'indigenous',
          },
          documentIds: [],
          collaborators: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          categories: [],
          statistics: {} as any,
          p2pSharing: {} as any,
          culturalValidation: {} as any,
          organization: {} as any,
          accessHistory: [],
          relationships: [],
          syncStatus: {} as any,
          ownerId: 'user2',
        },
        {
          id: '3',
          name: 'Eastern History',
          type: CollectionType.THEMATIC,
          visibility: CollectionVisibility.PUBLIC,
          culturalMetadata: {
            sensitivityLevel: CulturalSensitivityLevel.EDUCATIONAL,
            culturalOrigin: 'eastern',
          },
          documentIds: [],
          collaborators: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          categories: [],
          statistics: {} as any,
          p2pSharing: {} as any,
          culturalValidation: {} as any,
          organization: {} as any,
          accessHistory: [],
          relationships: [],
          syncStatus: {} as any,
          ownerId: 'user3',
        },
      ] as Collection[];

      mockInvoke.mockResolvedValue(multiculturalResults);

      const results = await collectionService.getCollections(searchFilters);

      expect(results).toHaveLength(3);
      expect(mockInvoke).toHaveBeenCalledWith(
        'get_collections',
        expect.objectContaining({
          filters: expect.objectContaining({
            culturalOrigin: ['western', 'indigenous', 'eastern'],
            query: 'history',
          }),
        })
      );
    });

    it('preserves alternative narratives without validation', async () => {
      const alternativeCollection: CreateCollectionRequest = {
        name: 'Alternative History Collection',
        description: 'Challenging mainstream historical narratives',
        type: CollectionType.RESEARCH,
        visibility: CollectionVisibility.PUBLIC,
        culturalMetadata: {
          sensitivityLevel: CulturalSensitivityLevel.EDUCATIONAL,
        },
        tags: ['alternative', 'controversial'],
      };

      const expectedResult = {
        id: '1',
        ...alternativeCollection,
        documentIds: [],
        collaborators: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [],
        statistics: {} as any,
        p2pSharing: {} as any,
        culturalValidation: {} as any,
        organization: {} as any,
        accessHistory: [],
        relationships: [],
        syncStatus: {} as any,
        ownerId: 'user1',
      };
      mockInvoke.mockResolvedValue(expectedResult);

      const result = await collectionService.createCollection(alternativeCollection);

      expect(result.tags).toContain('alternative');
      expect(result.tags).toContain('controversial');
    });
  });

  describe('Core Functionality', () => {
    it('creates collections with proper data structure', async () => {
      const newCollection: CreateCollectionRequest = {
        name: 'Science Fiction Collection',
        description: 'Speculative fiction and sci-fi works',
        type: CollectionType.PERSONAL,
        visibility: CollectionVisibility.PRIVATE,
        culturalMetadata: {
          sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
        },
        tags: ['sci-fi', 'fiction', 'technology'],
      };

      const expectedResult = {
        id: '1',
        ...newCollection,
        documentIds: [],
        collaborators: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        categories: [],
        statistics: {} as any,
        p2pSharing: {} as any,
        culturalValidation: {} as any,
        organization: {} as any,
        accessHistory: [],
        relationships: [],
        syncStatus: {} as any,
        ownerId: 'user1',
      };
      mockInvoke.mockResolvedValue(expectedResult);

      const result = await collectionService.createCollection(newCollection);

      expect(result).toEqual(expectedResult);
      expect(mockInvoke).toHaveBeenCalledWith('create_collection', expect.any(Object));
    });

    it('retrieves collections by ID', async () => {
      const collectionId = '123';
      const expectedCollection = {
        id: collectionId,
        name: 'Test Collection',
        description: 'Test description',
        type: CollectionType.PERSONAL,
        visibility: CollectionVisibility.PRIVATE,
        documentIds: [],
        collaborators: [],
        culturalMetadata: {
          sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        categories: [],
        statistics: {} as any,
        p2pSharing: {} as any,
        culturalValidation: {} as any,
        organization: {} as any,
        accessHistory: [],
        relationships: [],
        syncStatus: {} as any,
        ownerId: 'user1',
      };

      mockInvoke.mockResolvedValue(expectedCollection);

      const result = await collectionService.getCollection(collectionId);

      expect(result).toEqual(expectedCollection);
      expect(mockInvoke).toHaveBeenCalledWith('get_collection', {
        id: collectionId,
        includeDocuments: false,
      });
    });

    it('updates collections correctly', async () => {
      const collectionId = '1';
      const updates = {
        name: 'Updated Collection Name',
        description: 'Updated description',
      };

      const expectedResult = {
        id: collectionId,
        ...updates,
        type: CollectionType.PERSONAL,
        visibility: CollectionVisibility.PRIVATE,
        documentIds: [],
        collaborators: [],
        culturalMetadata: {
          sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        categories: [],
        statistics: {} as any,
        p2pSharing: {} as any,
        culturalValidation: {} as any,
        organization: {} as any,
        accessHistory: [],
        relationships: [],
        syncStatus: {} as any,
        ownerId: 'user1',
      };
      mockInvoke.mockResolvedValue(expectedResult);

      const result = await collectionService.updateCollection(collectionId, updates);

      expect(result).toEqual(expectedResult);
      expect(mockInvoke).toHaveBeenCalledWith('update_collection', {
        id: collectionId,
        updates,
      });
    });

    it('deletes collections', async () => {
      const collectionId = '1';
      mockInvoke.mockResolvedValue(undefined);

      await collectionService.deleteCollection(collectionId);

      expect(mockInvoke).toHaveBeenCalledWith('delete_collection', { id: collectionId });
    });

    it('lists all collections', async () => {
      const expectedCollections = [
        {
          id: '1',
          name: 'Collection 1',
          type: CollectionType.PERSONAL,
          visibility: CollectionVisibility.PRIVATE,
          documentIds: [],
          collaborators: [],
          culturalMetadata: {
            sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          categories: [],
          statistics: {} as any,
          p2pSharing: {} as any,
          culturalValidation: {} as any,
          organization: {} as any,
          accessHistory: [],
          relationships: [],
          syncStatus: {} as any,
          ownerId: 'user1',
        },
        {
          id: '2',
          name: 'Collection 2',
          type: CollectionType.PERSONAL,
          visibility: CollectionVisibility.PRIVATE,
          documentIds: [],
          collaborators: [],
          culturalMetadata: {
            sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          categories: [],
          statistics: {} as any,
          p2pSharing: {} as any,
          culturalValidation: {} as any,
          organization: {} as any,
          accessHistory: [],
          relationships: [],
          syncStatus: {} as any,
          ownerId: 'user2',
        },
      ];

      mockInvoke.mockResolvedValue(expectedCollections);

      const result = await collectionService.getCollections();

      expect(result).toEqual(expectedCollections);
      expect(mockInvoke).toHaveBeenCalledWith('get_collections', expect.any(Object));
    });
  });

  describe('Search and Filtering', () => {
    it('performs text search across collections', async () => {
      const query = 'science fiction';
      const expectedResults = [
        {
          id: '1',
          name: 'Sci-Fi Collection',
          type: CollectionType.THEMATIC,
          visibility: CollectionVisibility.PUBLIC,
          documentIds: [],
          collaborators: [],
          culturalMetadata: {
            sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          categories: [],
          statistics: {} as any,
          p2pSharing: {} as any,
          culturalValidation: {} as any,
          organization: {} as any,
          accessHistory: [],
          relationships: [],
          syncStatus: {} as any,
          ownerId: 'user1',
        },
        {
          id: '2',
          name: 'Science Books',
          type: CollectionType.EDUCATIONAL,
          visibility: CollectionVisibility.PUBLIC,
          documentIds: [],
          collaborators: [],
          culturalMetadata: {
            sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          categories: [],
          statistics: {} as any,
          p2pSharing: {} as any,
          culturalValidation: {} as any,
          organization: {} as any,
          accessHistory: [],
          relationships: [],
          syncStatus: {} as any,
          ownerId: 'user2',
        },
      ] as Collection[];

      mockInvoke.mockResolvedValue(expectedResults);

      const results = await collectionService.searchCollections(query);

      expect(results).toEqual(expectedResults);
      expect(mockInvoke).toHaveBeenCalledWith(
        'get_collections',
        expect.objectContaining({
          filters: expect.objectContaining({ query }),
        })
      );
    });

    it('applies complex search filters', async () => {
      const filters: CollectionSearchFilters = {
        tags: ['fiction', 'sci-fi'],
        culturalSensitivity: [CulturalSensitivityLevel.PUBLIC],
        dateRange: {
          start: new Date('2020-01-01'),
          end: new Date('2024-01-01'),
        },
      };

      mockInvoke.mockResolvedValue([]);

      await collectionService.getCollections(filters);

      expect(mockInvoke).toHaveBeenCalledWith(
        'get_collections',
        expect.objectContaining({
          filters: expect.objectContaining({
            tags: filters.tags,
            culturalSensitivity: filters.culturalSensitivity,
            dateRange: filters.dateRange,
          }),
        })
      );
    });

    it('handles empty search results gracefully', async () => {
      mockInvoke.mockResolvedValue([]);

      const results = await collectionService.searchCollections('nonexistent');

      expect(results).toEqual([]);
    });
  });

  describe('Document Management', () => {
    it('adds documents to collections', async () => {
      const collectionId = '1';
      const documentIds = ['doc1', 'doc2'];

      mockInvoke.mockResolvedValue(undefined);

      await collectionService.addDocumentsToCollection(collectionId, documentIds);

      expect(mockInvoke).toHaveBeenCalledWith('add_documents_to_collection', {
        collectionId,
        documentIds,
      });
    });

    it('removes documents from collections', async () => {
      const collectionId = '1';
      const documentIds = ['doc1'];

      mockInvoke.mockResolvedValue(undefined);

      await collectionService.removeDocumentsFromCollection(collectionId, documentIds);

      expect(mockInvoke).toHaveBeenCalledWith('remove_documents_from_collection', {
        collectionId,
        documentIds,
      });
    });

    it('lists documents in collection', async () => {
      const collectionId = '1';
      const expectedDocuments = [
        { id: '1', title: 'Document 1', author: 'Author 1' },
        { id: '2', title: 'Document 2', author: 'Author 2' },
      ];

      mockInvoke.mockResolvedValue(expectedDocuments);

      const result = await collectionService.getCollectionDocuments(collectionId);

      expect(result).toEqual(expectedDocuments);
      expect(mockInvoke).toHaveBeenCalledWith('get_collection_documents', {
        collectionId,
        filters: {},
      });
    });
  });

  describe('Performance Requirements', () => {
    it('completes search operations within 500ms', async () => {
      const startTime = Date.now();

      mockInvoke.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      await collectionService.searchCollections('test query');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });

    it('handles large collection lists efficiently', async () => {
      const largeCollectionList = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        name: `Collection ${i}`,
        type: CollectionType.PERSONAL,
        visibility: CollectionVisibility.PRIVATE,
        documentIds: [],
        collaborators: [],
        culturalMetadata: {
          sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        categories: [],
        statistics: {} as any,
        p2pSharing: {} as any,
        culturalValidation: {} as any,
        organization: {} as any,
        accessHistory: [],
        relationships: [],
        syncStatus: {} as any,
        ownerId: 'user1',
      }));

      mockInvoke.mockResolvedValue(largeCollectionList);

      const startTime = Date.now();
      const result = await collectionService.getCollections();
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(1000);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('handles backend errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Database connection failed'));

      await expect(collectionService.getCollection('1')).rejects.toThrow(
        'Unable to load collection'
      );
    });

    it('handles invalid collection IDs', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await collectionService.getCollection('invalid-id');

      expect(result).toBeNull();
    });

    it('validates required fields for creation', async () => {
      const invalidCollection = {
        description: 'Missing name',
        type: CollectionType.PERSONAL,
        visibility: CollectionVisibility.PRIVATE,
        culturalMetadata: {
          sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
        },
      } as CreateCollectionRequest;

      await expect(collectionService.createCollection(invalidCollection)).rejects.toThrow(
        'Collection name is required'
      );
    });
  });

  describe('SOLID Architecture Compliance', () => {
    it('maintains single responsibility for collection operations', () => {
      expect(collectionService).toHaveProperty('createCollection');
      expect(collectionService).toHaveProperty('getCollection');
      expect(collectionService).toHaveProperty('updateCollection');
      expect(collectionService).toHaveProperty('deleteCollection');
      expect(collectionService).toHaveProperty('searchCollections');

      // Should not have unrelated responsibilities
      expect(collectionService).not.toHaveProperty('validateUser');
      expect(collectionService).not.toHaveProperty('sendEmail');
    });

    it('provides consistent interface for all operations', () => {
      expect(typeof collectionService.createCollection).toBe('function');
      expect(typeof collectionService.getCollection).toBe('function');
      expect(typeof collectionService.searchCollections).toBe('function');
    });
  });

  describe('P2P and Decentralization', () => {
    it('enables P2P sharing for collections', async () => {
      const collectionId = '1';
      const p2pConfig = {
        enabled: true,
        peerDiscovery: true,
      };

      mockInvoke.mockResolvedValue(undefined);

      await collectionService.enableP2PSharing(collectionId, p2pConfig);

      expect(mockInvoke).toHaveBeenCalledWith('enable_p2p_sharing', {
        collectionId,
        config: p2pConfig,
      });
    });

    it('syncs collections with peers', async () => {
      const collectionId = '1';

      mockInvoke.mockResolvedValue(undefined);

      await collectionService.syncCollection(collectionId);

      expect(mockInvoke).toHaveBeenCalledWith('sync_collection', {
        collectionId,
      });
    });
  });
});
