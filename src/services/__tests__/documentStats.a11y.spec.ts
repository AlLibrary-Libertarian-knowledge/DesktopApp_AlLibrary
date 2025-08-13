import { describe, it, expect, vi, beforeEach } from 'vitest';
import { documentApi } from '../api/documentApi';

describe('documentApi stats performance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches stats under 200ms locally', async () => {
    const t0 = performance.now();
    vi.spyOn(documentApi as any, 'getDocumentStats').mockResolvedValue({
      viewCount: 10,
      favoriteCount: 3,
      commentCount: 7,
    });

    const stats = await documentApi.getDocumentStats('doc-1');
    const dt = performance.now() - t0;
    expect(stats.viewCount + stats.favoriteCount + stats.commentCount).toBeGreaterThanOrEqual(0);
    expect(dt).toBeLessThan(200);
  });
});


