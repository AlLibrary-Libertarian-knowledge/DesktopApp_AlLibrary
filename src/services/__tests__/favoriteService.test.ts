import { describe, expect, it, vi, beforeEach } from 'vitest';

const invokeMock = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock('@/services/documentService', () => ({
  documentService: {
    resolveDocumentById: vi.fn(async (id: string) =>
      id === 'missing'
        ? null
        : {
            id,
            title: `Doc ${id}`,
            filePath: `/files/${id}.pdf`,
            format: 'pdf',
            fileSize: 1024,
            source: 'local' as const,
          }
    ),
  },
}));

describe('favoriteService', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    localStorage.clear();
  });

  it('listFavoriteEntries parses FavoriteEntry array from invoke', async () => {
    invokeMock.mockResolvedValueOnce([
      { documentId: 'a', createdAt: '2024-01-01T00:00:00Z' },
      { documentId: 'b', createdAt: '2024-01-02T00:00:00Z' },
    ]);

    const { favoriteService } = await import('@/services/favoriteService');
    const entries = await favoriteService.listFavoriteEntries();

    expect(invokeMock).toHaveBeenCalledWith('list_favorites', { limit: null });
    expect(entries).toEqual([
      { documentId: 'a', createdAt: '2024-01-01T00:00:00Z' },
      { documentId: 'b', createdAt: '2024-01-02T00:00:00Z' },
    ]);
  });

  it('listFavorites maps entries to document ids', async () => {
    invokeMock.mockResolvedValueOnce([
      { documentId: 'x', createdAt: '2024-01-01T00:00:00Z' },
      { documentId: 'y', createdAt: '2024-01-02T00:00:00Z' },
    ]);

    const { favoriteService } = await import('@/services/favoriteService');
    const ids = await favoriteService.listFavorites();

    expect(ids).toEqual(['x', 'y']);
  });

  it('loadFavoriteDocuments resolves documents and keeps stale entries', async () => {
    invokeMock.mockResolvedValueOnce([
      { documentId: 'ok', createdAt: '2024-01-01T00:00:00Z' },
      { documentId: 'missing', createdAt: '2024-01-02T00:00:00Z' },
    ]);

    const { favoriteService } = await import('@/services/favoriteService');
    const docs = await favoriteService.loadFavoriteDocuments();

    expect(docs).toHaveLength(2);
    expect(docs[0]?.resolved?.title).toBe('Doc ok');
    expect(docs[1]?.resolved).toBeNull();
  });
});
