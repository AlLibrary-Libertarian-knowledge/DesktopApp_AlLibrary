import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRoot } from 'solid-js';
import { createSignal } from 'solid-js';

const refreshMock = vi.fn();

vi.mock('@/services/network/networkLobbyStore', () => ({
  getNetworkLobbyStore: () => {
    const [onlineNodes, setOnlineNodes] = createSignal(0);
    const [files, setFiles] = createSignal<
      Array<{
        contentHash: string;
        name: string;
        size: number;
        link: string;
        peerCount: number;
        peers: [];
      }>
    >([]);
    const [totalBytes, setTotalBytes] = createSignal(0);
    const [lastSyncAt, setLastSyncAt] = createSignal<Date | null>(null);
    const [syncError, setSyncError] = createSignal<string | undefined>();
    const [isLoading, setIsLoading] = createSignal(false);
    const ensureStarted = () => {
      setOnlineNodes(3);
      setFiles([
        {
          contentHash: 'a',
          name: 'f.pdf',
          size: 50,
          link: 'http://x.onion/f/1',
          peerCount: 1,
          peers: [],
        },
      ]);
      setTotalBytes(50);
      setLastSyncAt(new Date('2026-01-01'));
    };
    ensureStarted();
    return {
      onlineNodes,
      files,
      totalBytes,
      lastSyncAt,
      syncError,
      isLoading,
      peers: createSignal([])[0],
      peerCount: createSignal(0)[0],
      refresh: refreshMock,
      ensureStarted,
    };
  },
}));

describe('useNetworkLobby', () => {
  beforeEach(() => {
    refreshMock.mockClear();
  });

  it('reads lobby from shared store on mount', async () => {
    const { useNetworkLobby } = await import('../useNetworkLobby');

    await new Promise<void>(resolve => {
      createRoot(dispose => {
        const lobby = useNetworkLobby();
        globalThis.setTimeout(() => {
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
