import { describe, it, expect, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (cmd: string) => {
    switch (cmd) {
      case 'tracker_get_config':
        return {
          trackerUrl: 'http://127.0.0.1:8080',
          nodeId: 'network-disabled',
          sharePublicly: false,
        };
      case 'onion_share_status':
        return { running: false, onion: null, localPort: null };
      case 'tracker_refresh_lobby':
      case 'tracker_get_cached_lobby_cmd':
        return { online_nodes: 0, files: [] };
      case 'search_network_cached':
        return [];
      case 'list_network_peers':
        return [];
      default:
        return null;
    }
  }),
}));

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
