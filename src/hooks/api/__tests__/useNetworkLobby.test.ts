import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRoot } from 'solid-js';

const getLobbyMock = vi.fn(async () => ({
  onlineNodes: 3,
  files: [
    {
      contentHash: 'a',
      name: 'f.pdf',
      size: 50,
      link: 'http://x.onion/f/1',
      peerCount: 1,
      peers: [],
    },
  ],
  totalBytes: 50,
  lastSyncAt: new Date('2026-01-01'),
  syncError: undefined,
}));

vi.mock('@/services/network/networkFacade', () => ({
  networkFacade: {
    getLobby: () => getLobbyMock(),
    refreshLobby: vi.fn(),
    subscribeLobby: vi.fn(() => () => {}),
  },
}));

describe('useNetworkLobby', () => {
  beforeEach(() => {
    getLobbyMock.mockClear();
  });

  it('loads lobby on mount', async () => {
    const { useNetworkLobby } = await import('../useNetworkLobby');

    await new Promise<void>(resolve => {
      createRoot(dispose => {
        const lobby = useNetworkLobby({ pollIntervalMs: 60000 });
        globalThis.setTimeout(() => {
          expect(getLobbyMock).toHaveBeenCalled();
          expect(lobby.onlineNodes()).toBe(3);
          expect(lobby.files()).toHaveLength(1);
          expect(lobby.totalBytes()).toBe(50);
          dispose();
          resolve();
        }, 20);
      });
    });
  });
});
