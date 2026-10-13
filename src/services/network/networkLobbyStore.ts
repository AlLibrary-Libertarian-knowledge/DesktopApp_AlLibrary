/**
 * Singleton lobby + peers cache — one event listener and one poll timer for the whole app.
 */

import {
  createEffect,
  createRoot,
  createSignal,
  getOwner,
  runWithOwner,
  type Accessor,
} from 'solid-js';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import {
  networkFacade,
  type NetworkFileView,
  type NetworkLobbyView,
} from '@/services/network/networkFacade';
import type { NetworkLobby } from '@/services/network/onionShareService';
import {
  mapPeer,
  mergePeerViews,
  peersFromLobbyFiles,
  type NetworkPeerView,
} from '@/hooks/api/networkPeerView';
import { isTorSettled, networkPresence } from '@/hooks/network/useNetworkPresence';

const POLL_MS = 30_000;
const EVENT_DEBOUNCE_MS = 250;
/**
 * Safety valve: if presence never leaves `idle` (bootstrap not kicked, unexpected state), start
 * the lobby anyway instead of leaving the UI empty forever.
 */
const TOR_SETTLE_GRACE_MS = 45_000;

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);
}

function mapWireLobby(
  lobby: NetworkLobby,
  lastSyncAt: Date | null,
  syncError?: string
): NetworkLobbyView {
  const files: NetworkFileView[] = (lobby.files || []).map(file => ({
    contentHash: file.content_hash,
    name: file.name,
    size: file.size,
    link: file.link,
    peerCount: file.peer_count,
    peers: (file.peers || []).map(p => ({
      nodeId: p.node_id,
      onion: p.onion,
      link: p.link,
      fileId: p.file_id,
    })),
  }));
  return {
    onlineNodes: lobby.online_nodes ?? 0,
    files,
    totalBytes: files.reduce((sum, f) => sum + f.size, 0),
    lastSyncAt,
    syncError,
  };
}

function lobbyFingerprint(view: NetworkLobbyView): string {
  const hashes = view.files
    .map(f => f.contentHash)
    .sort()
    .join(',');
  return `${view.onlineNodes}:${hashes}`;
}

function isNetworkLobby(payload: unknown): payload is NetworkLobby {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'online_nodes' in payload &&
    'files' in payload
  );
}

export interface NetworkLobbyStore {
  onlineNodes: Accessor<number>;
  files: Accessor<NetworkFileView[]>;
  totalBytes: Accessor<number>;
  lastSyncAt: Accessor<Date | null>;
  syncError: Accessor<string | undefined>;
  isLoading: Accessor<boolean>;
  peers: Accessor<NetworkPeerView[]>;
  peerCount: Accessor<number>;
  refresh: (force?: boolean) => Promise<void>;
  ensureStarted: () => void;
}

function createNetworkLobbyStore(): NetworkLobbyStore {
  /** Root owner of the singleton — effects created later must attach here, not to a caller. */
  const storeOwner = getOwner();
  const [onlineNodes, setOnlineNodes] = createSignal(0);
  const [files, setFiles] = createSignal<NetworkFileView[]>([]);
  const [totalBytes, setTotalBytes] = createSignal(0);
  const [lastSyncAt, setLastSyncAt] = createSignal<Date | null>(null);
  const [syncError, setSyncError] = createSignal<string | undefined>();
  const [isLoading, setIsLoading] = createSignal(false);
  const [peers, setPeers] = createSignal<NetworkPeerView[]>([]);
  const [peerCount, setPeerCount] = createSignal(0);

  let started = false;
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  const unlisteners: UnlistenFn[] = [];
  let lastAppliedFingerprint = '';

  const applyPeers = (
    rawPeers: Awaited<ReturnType<typeof networkFacade.listPeers>>,
    lobbyFiles: NetworkFileView[]
  ) => {
    const fromCache = rawPeers.map(p => mapPeer(p, lobbyFiles));
    const merged = mergePeerViews(fromCache, peersFromLobbyFiles(lobbyFiles));
    setPeers(merged);
    setPeerCount(merged.length);
  };

  const applyPeersFromFiles = (lobbyFiles: NetworkFileView[]) => {
    const fromFiles = peersFromLobbyFiles(lobbyFiles);
    const merged = mergePeerViews(peers(), fromFiles);
    setPeers(merged);
    setPeerCount(merged.length);
  };

  const applyLobby = (lobby: NetworkLobbyView) => {
    const fp = lobbyFingerprint(lobby);
    if (fp === lastAppliedFingerprint && !lobby.syncError) {
      if (lobby.lastSyncAt) setLastSyncAt(lobby.lastSyncAt);
      // Still refresh peer topology from files — online count can stay stable
      // while peer rows on files change, and SQLite peers may be empty.
      applyPeersFromFiles(lobby.files);
      return;
    }
    lastAppliedFingerprint = fp;
    setOnlineNodes(lobby.onlineNodes);
    setFiles(lobby.files);
    setTotalBytes(lobby.totalBytes);
    setLastSyncAt(lobby.lastSyncAt);
    setSyncError(lobby.syncError);
    applyPeersFromFiles(lobby.files);
  };

  const refresh = async (force = false) => {
    if (force) setIsLoading(true);
    if (!force) setSyncError(undefined);
    try {
      const lobby = force ? await networkFacade.refreshLobby() : await networkFacade.getLobby();
      applyLobby(lobby);
      // Always refresh SQLite peers after lobby — not only on force.
      // Status uses online_nodes; graph needs peer rows (TTL can empty the cache).
      try {
        const rawPeers = await networkFacade.listPeers();
        applyPeers(rawPeers, lobby.files);
      } catch {
        applyPeersFromFiles(lobby.files);
      }
    } catch (e: unknown) {
      setSyncError(e instanceof Error ? e.message : String(e));
    } finally {
      if (force) setIsLoading(false);
    }
  };

  const refreshPeersQuiet = async (lobbyFiles: NetworkFileView[]) => {
    try {
      const rawPeers = await networkFacade.listPeers();
      applyPeers(rawPeers, lobbyFiles);
    } catch {
      applyPeersFromFiles(lobbyFiles);
    }
  };

  const applyLobbyFromEvent = (wire: NetworkLobby) => {
    const lobby = mapWireLobby(wire, lastSyncAt());
    applyLobby(lobby);
  };

  const scheduleEventRefresh = (wire?: NetworkLobby) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      if (wire) {
        applyLobbyFromEvent(wire);
      } else {
        void refresh(false);
      }
    }, EVENT_DEBOUNCE_MS);
  };

  const syncTimestampQuiet = async () => {
    try {
      const diag = await networkFacade.getSyncDiagnostics();
      if (diag?.atEpochMs) setLastSyncAt(new Date(diag.atEpochMs));
    } catch {
      /* ignore */
    }
  };

  /** Actual lobby bring-up: first forced sync, Tauri event listeners, poll timer. */
  const begin = () => {
    void refresh(true);

    void (async () => {
      try {
        const u1 = await listen<NetworkLobby>('lobby-updated', ev => {
          if (isNetworkLobby(ev.payload)) {
            scheduleEventRefresh(ev.payload);
          } else {
            scheduleEventRefresh();
          }
        });
        unlisteners.push(u1);
        const u2 = await listen('tracker-sync-done', () => {
          void syncTimestampQuiet();
        });
        unlisteners.push(u2);
      } catch {
        /* not in Tauri webview */
      }
    })();

    pollTimer = setInterval(() => {
      void refresh(false);
      void refreshPeersQuiet(files());
    }, POLL_MS);
  };

  /**
   * Do not touch the tracker (or show cached peers as if live) while Tor is still bootstrapping.
   * Wait for the overlay to settle — `ready`, or `degraded`/`failed` where the localhost / LAN
   * fallback is the legitimate path — then bring the lobby up. Outside Tauri (tests, browser
   * dev) there is no bootstrap to wait for.
   */
  const start = () => {
    if (started) return;
    started = true;

    if (!isTauriRuntime()) {
      begin();
      return;
    }

    let begun = false;
    let graceTimer: ReturnType<typeof setTimeout> | undefined;
    const beginOnce = () => {
      if (begun) return;
      begun = true;
      if (graceTimer) clearTimeout(graceTimer);
      begin();
    };
    graceTimer = setTimeout(() => {
      if (!begun && networkPresence().mode === 'idle') beginOnce();
    }, TOR_SETTLE_GRACE_MS);

    // `ensureStarted()` is called from components; attach the effect to the store root so it
    // survives whichever component happened to call first.
    const watch = () =>
      createEffect(() => {
        if (isTorSettled(networkPresence())) beginOnce();
      });
    if (storeOwner) runWithOwner(storeOwner, watch);
    else watch();
  };

  return {
    onlineNodes,
    files,
    totalBytes,
    lastSyncAt,
    syncError,
    isLoading,
    peers,
    peerCount,
    refresh,
    ensureStarted: start,
  };
}

let store: NetworkLobbyStore | undefined;

export function getNetworkLobbyStore(): NetworkLobbyStore {
  if (!store) {
    store = createRoot(() => createNetworkLobbyStore());
  }
  store.ensureStarted();
  return store;
}
