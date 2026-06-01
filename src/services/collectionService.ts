/**
 * Collection service — local SQLite-backed CRUD and document membership.
 */

import { invoke } from '@tauri-apps/api/core';
import {
  type Collection,
  type CollectionDocument,
  type CreateCollectionRequest,
  type UpdateCollectionRequest,
  mapCollection,
  mapCollectionDocument,
} from '../types/Collection';

export interface CollectionService {
  getCollections(): Promise<Collection[]>;
  getCollection(id: string, includeDocuments?: boolean): Promise<Collection | null>;
  createCollection(request: CreateCollectionRequest): Promise<Collection>;
  updateCollection(id: string, request: UpdateCollectionRequest): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;
  addDocumentsToCollection(collectionId: string, documentIds: string[]): Promise<void>;
  removeDocumentsFromCollection(collectionId: string, documentIds: string[]): Promise<void>;
  getCollectionDocuments(collectionId: string): Promise<CollectionDocument[]>;
}

class CollectionServiceImpl implements CollectionService {
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private collectionsCache: { data: Collection[]; timestamp: number } | null = null;
  private collectionCache = new Map<string, { data: Collection; timestamp: number }>();

  clearCache(): void {
    this.collectionsCache = null;
    this.collectionCache.clear();
  }

  async getCollections(): Promise<Collection[]> {
    if (this.collectionsCache && Date.now() - this.collectionsCache.timestamp < this.CACHE_TTL) {
      return this.collectionsCache.data;
    }

    const result = await invoke<Array<Parameters<typeof mapCollection>[0]>>('get_collections');
    const mapped = result.map(mapCollection);
    this.collectionsCache = { data: mapped, timestamp: Date.now() };
    return mapped;
  }

  async getCollection(id: string, includeDocuments = false): Promise<Collection | null> {
    const cacheKey = `${id}_${includeDocuments}`;
    const cached = this.collectionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const result = await invoke<Parameters<typeof mapCollection>[0] | null>('get_collection', {
      id,
      includeDocuments,
    });

    if (!result) {
      return null;
    }

    const mapped = mapCollection(result);
    this.collectionCache.set(cacheKey, { data: mapped, timestamp: Date.now() });
    return mapped;
  }

  async createCollection(request: CreateCollectionRequest): Promise<Collection> {
    validateCreateCollectionRequest(request);

    const result = await invoke<Parameters<typeof mapCollection>[0]>('create_collection', {
      request: {
        name: request.name,
        description: request.description,
        document_ids: request.documentIds,
      },
    });

    this.clearCache();
    return mapCollection(result);
  }

  async updateCollection(id: string, request: UpdateCollectionRequest): Promise<Collection> {
    const result = await invoke<Parameters<typeof mapCollection>[0]>('update_collection', {
      id,
      updates: request,
    });

    this.clearCache();
    return mapCollection(result);
  }

  async deleteCollection(id: string): Promise<void> {
    await invoke('delete_collection', { id });
    this.clearCache();
  }

  async addDocumentsToCollection(collectionId: string, documentIds: string[]): Promise<void> {
    await invoke('add_documents_to_collection', { collectionId, documentIds });
    this.clearCache();
  }

  async removeDocumentsFromCollection(collectionId: string, documentIds: string[]): Promise<void> {
    await invoke('remove_documents_from_collection', { collectionId, documentIds });
    this.clearCache();
  }

  async getCollectionDocuments(collectionId: string): Promise<CollectionDocument[]> {
    const result = await invoke<Array<Parameters<typeof mapCollectionDocument>[0]>>(
      'get_collection_documents',
      { collectionId }
    );
    return result.map(mapCollectionDocument);
  }
}

function validateCreateCollectionRequest(request: CreateCollectionRequest): void {
  if (!request.name || request.name.trim().length === 0) {
    throw new Error('Collection name is required');
  }
  if (request.name.length > 255) {
    throw new Error('Collection name must be less than 255 characters');
  }
  if (request.description && request.description.length > 2000) {
    throw new Error('Collection description must be less than 2000 characters');
  }
}

export const collectionService: CollectionService = new CollectionServiceImpl();
