import { describe, it, expect } from 'vitest';
import { shareService } from '../sharing/shareService';

describe('shareService (P2P / links disabled)', () => {
  const docId = 'doc1';

  it('does not claim P2P share success when networking is unavailable', async () => {
    const ok = await shareService.shareViaP2P(docId, ['peer1']);
    expect(ok).toBe(false);
  });

  it('does not produce share links until sharing backend exists', async () => {
    const link = await shareService.createShareLink(docId);
    expect(link).toBeNull();
  });
});
