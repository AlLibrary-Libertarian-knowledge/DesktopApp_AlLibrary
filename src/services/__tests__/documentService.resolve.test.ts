import { describe, expect, it, vi, beforeEach } from 'vitest';

const invokeMock = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock('@/services/storage/settingsService', () => ({
  settingsService: {
    getProjectFolder: vi.fn(async () => 'D:\\AlLibrary'),
  },
}));

vi.mock('@/services/network/networkFacade', () => ({
  networkFacade: {
    searchFiles: vi.fn(async () => []),
  },
}));

vi.mock('@/services/network/transferFacade', () => ({
  transferFacade: {
    addShare: vi.fn(),
  },
}));

describe('documentService.resolveDocumentById', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('resolves local document by content hash from scan', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'scan_documents_folder') {
        return {
          documents_found: 1,
          total_size: 100,
          scan_duration_ms: 1,
          documents: [
            {
              id: 'hash-abc',
              filename: 'paper.pdf',
              file_path: 'D:\\AlLibrary\\paper.pdf',
              file_size: 100,
              document_type: 'pdf',
              created_at: '1',
              modified_at: '2',
              metadata: { tags: [], categories: [] },
            },
          ],
          errors: [],
        };
      }
      throw new Error(`unexpected ${cmd}`);
    });

    const { documentService } = await import('../documentService');
    const doc = await documentService.resolveDocumentById('hash-abc');
    expect(doc).not.toBeNull();
    expect(doc?.source).toBe('local');
    expect(doc?.title).toBe('paper.pdf');
    expect(doc?.filePath).toBe('D:\\AlLibrary\\paper.pdf');
  });

  it('returns null when id is unknown', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'scan_documents_folder') {
        return {
          documents_found: 0,
          total_size: 0,
          scan_duration_ms: 1,
          documents: [],
          errors: [],
        };
      }
      if (cmd === 'search_network_cached') {
        return [];
      }
      throw new Error(`unexpected ${cmd}`);
    });

    const { networkFacade } = await import('@/services/network/networkFacade');
    vi.mocked(networkFacade.searchFiles).mockResolvedValue([]);

    const { documentService } = await import('../documentService');
    const doc = await documentService.resolveDocumentById('missing-id');
    expect(doc).toBeNull();
  });
});
