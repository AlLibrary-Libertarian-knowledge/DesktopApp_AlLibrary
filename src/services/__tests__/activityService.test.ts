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
            fileSize: 2048,
            source: 'local' as const,
          }
    ),
  },
}));

describe('activityService', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('sinceFromTimeframe returns null for all', async () => {
    const { activityService } = await import('@/services/activityService');
    expect(activityService.sinceFromTimeframe('all')).toBeNull();
  });

  it('sinceFromTimeframe returns sqlite datetime string for today', async () => {
    const { activityService } = await import('@/services/activityService');
    const since = activityService.sinceFromTimeframe('today');
    expect(since).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('listActivities parses invoke response', async () => {
    invokeMock.mockResolvedValueOnce([
      {
        id: 1,
        kind: 'share',
        documentId: 'hash-1',
        payloadJson: '{"title":"Shared doc"}',
        createdAt: '2024-01-01 12:00:00',
      },
    ]);

    const { activityService } = await import('@/services/activityService');
    const rows = await activityService.listActivities({ limit: 10 });

    expect(invokeMock).toHaveBeenCalledWith('list_activity', {
      kind: null,
      since: null,
      limit: 10,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe('share');
  });

  it('loadActivityDocuments resolves titles and keeps unresolved entries', async () => {
    invokeMock.mockResolvedValueOnce([
      {
        id: 1,
        kind: 'view',
        documentId: 'ok',
        payloadJson: null,
        createdAt: '2024-01-01 12:00:00',
      },
      {
        id: 2,
        kind: 'download',
        documentId: 'missing',
        payloadJson: '{"title":"From payload"}',
        createdAt: '2024-01-02 12:00:00',
      },
    ]);

    const { activityService } = await import('@/services/activityService');
    const docs = await activityService.loadActivityDocuments();

    expect(docs[0]?.title).toBe('Doc ok');
    expect(docs[1]?.title).toBe('From payload');
    expect(docs[1]?.resolved).toBeNull();
  });
});
