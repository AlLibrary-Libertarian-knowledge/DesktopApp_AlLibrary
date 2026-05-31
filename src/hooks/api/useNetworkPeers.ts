import { getNetworkLobbyStore } from '@/services/network/networkLobbyStore';

export type { NetworkPeerView } from './networkPeerView';

/** Shared peers state — backed by the same singleton as useNetworkLobby. */
export function useNetworkPeers() {
  const store = getNetworkLobbyStore();
  return {
    peers: store.peers,
    peerCount: store.peerCount,
    isLoading: store.isLoading,
    error: store.syncError,
    refresh: store.refresh,
  };
}
