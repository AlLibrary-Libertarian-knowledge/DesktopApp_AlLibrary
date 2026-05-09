import { describe, it, expect } from 'vitest';
import { p2pNetworkService } from '../network/p2pNetworkService';

describe('P2P distributed search (shell)', () => {
  it('returns no rows while networking is disabled', async () => {
    await p2pNetworkService.initializeNode({ torSupport: true });
    const results = await p2pNetworkService.searchNetwork('history', {
      includeCulturalContext: true,
      supportAlternativeNarratives: true,
      resistCensorship: true,
      includeAnonymous: true,
      maxResults: 10,
    } as any);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});
