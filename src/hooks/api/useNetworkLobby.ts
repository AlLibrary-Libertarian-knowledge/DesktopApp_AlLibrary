import { getNetworkLobbyStore } from '@/services/network/networkLobbyStore';

/** Shared lobby state — one poll loop and one event listener app-wide. */
export function useNetworkLobby() {
  const store = getNetworkLobbyStore();
  return {
    onlineNodes: store.onlineNodes,
    files: store.files,
    totalBytes: store.totalBytes,
    lastSyncAt: store.lastSyncAt,
    syncError: store.syncError,
    isLoading: store.isLoading,
    refresh: store.refresh,
  };
}
