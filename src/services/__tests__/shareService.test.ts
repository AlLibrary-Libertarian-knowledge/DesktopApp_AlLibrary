import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (cmd: string, args?: any) => {
    switch (cmd) {
      case 'share_document_p2p':
        return true;
      case 'create_share_link':
        return { url: `https://share.local/${args?.documentId}`, expiresAt: undefined };
      default:
        return true;
    }
  }),
}));

import { shareService } from '../sharing/shareService';

describe('shareService', () => {
  const docId = 'doc1';

  beforeEach(() => vi.clearAllMocks());

  it('shares document via P2P', async () => {
    const ok = await shareService.shareViaP2P(docId, ['peer1']);
    expect(ok).toBe(true);
  });

  it('creates a share link', async () => {
    const link = await shareService.createShareLink(docId);
    expect(link?.url).toContain(docId);
  });

  it('handles errors gracefully', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    (invoke as any).mockRejectedValueOnce(new Error('fail'));
    const ok = await shareService.shareViaP2P(docId, []);
    expect(ok).toBe(false);
  });
});


