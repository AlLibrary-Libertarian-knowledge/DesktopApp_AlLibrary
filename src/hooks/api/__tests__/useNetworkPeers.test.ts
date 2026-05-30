import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRoot, createSignal } from 'solid-js';

const refreshMock = vi.fn();

vi.mock('@/services/network/networkLobbyStore', () => ({
  getNetworkLobbyStore: () => {
    const [peers, setPeers] = createSignal([
      {
        nodeId: 'node-abc123456789',
        onion: 'abcdefghijklmnop.onion',
        lastSeenAt: new Date(Date.now() - 120_000).toISOString(),
        displayName: 'node-abc…',
        onionShort: 'abcdef…klmnop.onion',
        lastSeenLabel: '2m ago',
        fileCount: 1,
      },
    ]);
    const [peerCount, setPeerCount] = createSignal(1);
    const [isLoading, setIsLoading] = createSignal(false);
    const [syncError, setSyncError] = createSignal<string | undefined>();
    return {
      peers,
      peerCount,
      isLoading,
      syncError,
      refresh: refreshMock,
      ensureStarted: () => {},
      onlineNodes: createSignal(0)[0],
      files: createSignal([])[0],
      totalBytes: createSignal(0)[0],
      lastSyncAt: createSignal<Date | null>(null)[0],
    };
  },
}));

describe('useNetworkPeers', () => {
  beforeEach(() => {
    refreshMock.mockClear();
  });

  it('reads peers from shared store on mount', async () => {
    const { useNetworkPeers } = await import('../useNetworkPeers');

    await new Promise<void>(resolve => {
      createRoot(dispose => {
        const peerState = useNetworkPeers();
        globalThis.setTimeout(() => {
          expect(peerState.peerCount()).toBe(1);
          const row = peerState.peers()[0];
          expect(row).toBeDefined();
          expect(row!.nodeId).toBe('node-abc123456789');
          expect(row!.fileCount).toBe(1);
          dispose();
          resolve();
        }, 20);
      });
    });
  });
});
