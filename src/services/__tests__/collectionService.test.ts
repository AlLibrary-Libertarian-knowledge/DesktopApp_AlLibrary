import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CreateCollectionRequest } from '../../types/Collection';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { collectionService } from '../collectionService';
import { mapCollection } from '../../types/Collection';

describe('CollectionService', () => {
  let mockInvoke: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    mockInvoke = vi.mocked(invoke);
    mockInvoke.mockReset();
    (collectionService as { clearCache?: () => void }).clearCache?.();
  });

  const rawCollection = {
    id: 'col-1',
    name: 'Research',
    description: 'Papers',
    document_count: 2,
    document_ids: ['doc-1', 'doc-2'],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
  };

  it('loads collections from backend', async () => {
    mockInvoke.mockResolvedValue([rawCollection]);

    const result = await collectionService.getCollections();

    expect(mockInvoke).toHaveBeenCalledWith('get_collections');
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Research');
    expect(result[0]?.documentCount).toBe(2);
  });

  it('creates a collection with optional documents', async () => {
    mockInvoke.mockResolvedValue(rawCollection);

    const request: CreateCollectionRequest = {
      name: 'Research',
      description: 'Papers',
      documentIds: ['doc-1'],
    };

    const result = await collectionService.createCollection(request);

    expect(mockInvoke).toHaveBeenCalledWith('create_collection', {
      request: {
        name: 'Research',
        description: 'Papers',
        document_ids: ['doc-1'],
      },
    });
    expect(result.id).toBe('col-1');
  });

  it('rejects empty collection names', async () => {
    await expect(collectionService.createCollection({ name: '   ' })).rejects.toThrow(
      'Collection name is required'
    );
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('updates and deletes collections', async () => {
    mockInvoke.mockResolvedValue({ ...rawCollection, name: 'Renamed' });

    const updated = await collectionService.updateCollection('col-1', { name: 'Renamed' });
    expect(mockInvoke).toHaveBeenCalledWith('update_collection', {
      id: 'col-1',
      updates: { name: 'Renamed' },
    });
    expect(updated.name).toBe('Renamed');

    mockInvoke.mockResolvedValue(true);
    await collectionService.deleteCollection('col-1');
    expect(mockInvoke).toHaveBeenCalledWith('delete_collection', { id: 'col-1' });
  });

  it('manages document membership', async () => {
    mockInvoke.mockResolvedValue(undefined);

    await collectionService.addDocumentsToCollection('col-1', ['doc-3']);
    expect(mockInvoke).toHaveBeenCalledWith('add_documents_to_collection', {
      collectionId: 'col-1',
      documentIds: ['doc-3'],
    });

    await collectionService.removeDocumentsFromCollection('col-1', ['doc-1']);
    expect(mockInvoke).toHaveBeenCalledWith('remove_documents_from_collection', {
      collectionId: 'col-1',
      documentIds: ['doc-1'],
    });
  });

  it('maps collection documents', async () => {
    mockInvoke.mockResolvedValue([
      {
        id: 'doc-1',
        title: 'Paper',
        file_type: 'pdf',
        file_size: 1024,
        local_path: '/tmp/paper.pdf',
      },
    ]);

    const docs = await collectionService.getCollectionDocuments('col-1');
    expect(docs[0]).toEqual({
      id: 'doc-1',
      title: 'Paper',
      fileType: 'pdf',
      fileSize: 1024,
      localPath: '/tmp/paper.pdf',
    });
  });

  it('maps snake_case responses consistently', () => {
    const mapped = mapCollection(rawCollection);
    expect(mapped.documentIds).toEqual(['doc-1', 'doc-2']);
    expect(mapped.createdAt).toBeInstanceOf(Date);
  });
});
