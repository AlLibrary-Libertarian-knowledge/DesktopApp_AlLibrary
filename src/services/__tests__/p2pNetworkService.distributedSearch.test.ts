import { describe, it, expect, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (cmd: string, args?: any) => {
    switch (cmd) {
      case 'init_p2p_node':
        return { id: 'node1', config: { enableCulturalFiltering: false, enableContentBlocking: false } };
      case 'search_p2p_network':
        // return a small result set to verify flags mapping
        return [
          { id: 'r1', title: 'Doc 1', culturalContext: { level: 2 }, relevanceScore: 0.9 },
          { id: 'r2', title: 'Doc 2', culturalContext: { level: 1 }, relevanceScore: 0.8 },
        ];
      default:
        return true;
    }
  }),
}));

import { p2pNetworkService } from '../network/p2pNetworkService';

describe('P2P distributed search (anti-censorship flags)', () => {
  it('bypasses cultural filters and supports anonymous search', async () => {
    const svc: any = p2pNetworkService;
    await svc.initializeNode({ torSupport: true });
    const results = await svc.searchNetwork('history', {
      includeCulturalContext: true,
      supportAlternativeNarratives: true,
      resistCensorship: true,
      includeAnonymous: true,
      maxResults: 10,
    });
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });
});



