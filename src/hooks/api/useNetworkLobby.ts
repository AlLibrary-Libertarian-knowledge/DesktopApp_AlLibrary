import { createSignal, onCleanup, onMount } from 'solid-js';
import { networkFacade, type NetworkFileView } from '@/services/network/networkFacade';

export function useNetworkLobby(options?: { pollIntervalMs?: number }) {
  const pollMs = options?.pollIntervalMs ?? 30000;

  const [onlineNodes, setOnlineNodes] = createSignal(0);
  const [files, setFiles] = createSignal<NetworkFileView[]>([]);
  const [totalBytes, setTotalBytes] = createSignal(0);
  const [lastSyncAt, setLastSyncAt] = createSignal<Date | null>(null);
  const [syncError, setSyncError] = createSignal<string | undefined>();
  const [isLoading, setIsLoading] = createSignal(false);

  const applyLobby = (lobby: Awaited<ReturnType<typeof networkFacade.getLobby>>) => {
    setOnlineNodes(lobby.onlineNodes);
    setFiles(lobby.files);
    setTotalBytes(lobby.totalBytes);
    setLastSyncAt(lobby.lastSyncAt);
    setSyncError(lobby.syncError);
  };

  const refresh = async (force = false) => {
    setIsLoading(true);
    try {
      const lobby = force ? await networkFacade.refreshLobby() : await networkFacade.getLobby();
      applyLobby(lobby);
    } catch (e: unknown) {
      setSyncError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  onMount(() => {
    void refresh();

    const unsubLobby = networkFacade.subscribeLobby(lobby => {
      applyLobby(lobby);
    });

    const timer = globalThis.setInterval(() => {
      void refresh();
    }, pollMs);

    onCleanup(() => {
      unsubLobby();
      globalThis.clearInterval(timer);
    });
  });

  return {
    onlineNodes,
    files,
    totalBytes,
    lastSyncAt,
    syncError,
    isLoading,
    refresh,
  };
}
