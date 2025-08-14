import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (cmd: string, args?: any) => {
    switch (cmd) {
      case 'list_comments':
        return [
          { id: 'c1', documentId: args?.documentId, authorId: 'u1', text: 'hello', createdAt: '2025-01-01T00:00:00Z' },
        ];
      case 'add_comment':
        return { id: 'c2', documentId: args?.input?.documentId, authorId: 'u1', text: args?.input?.text, createdAt: new Date().toISOString() };
      case 'edit_comment':
        return true;
      case 'delete_comment':
        return true;
      default:
        return true;
    }
  }),
}));

import { commentService } from '../comments/commentService';

describe('commentService', () => {
  const docId = 'doc1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists comments for a document', async () => {
    const result = await commentService.list(docId);
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].documentId).toBe(docId);
  });

  it('adds a comment', async () => {
    const created = await commentService.add({ documentId: docId, text: 'new' });
    expect(created?.id).toBeTruthy();
    expect(created?.text).toBe('new');
  });

  it('edits a comment', async () => {
    const ok = await commentService.edit('c1', 'updated');
    expect(ok).toBe(true);
  });

  it('deletes a comment', async () => {
    const ok = await commentService.remove('c1');
    expect(ok).toBe(true);
  });

  it('handles backend failure gracefully', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    (invoke as any).mockRejectedValueOnce(new Error('fail'));
    const list = await commentService.list(docId);
    expect(list).toEqual([]);
  });
});


