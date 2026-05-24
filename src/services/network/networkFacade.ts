/**
 * Unified network lobby facade — memory cache, SQLite fallback, tracker refresh.
 */

import { invoke } from '@tauri-apps/api/core';
import { createEffect, createRoot } from 'solid-js';
import {
  onionShareStatus,
  trackerGetCachedLobby,
  trackerGetLastSyncDiag,
  trackerRefreshLobby,
  type NetworkLobby,
  type TrackerSyncDiagnostics,
} from './onionShareService';
import { getNetworkLobbyStore } from './networkLobbyStore';

export interface NetworkFileView {
  contentHash: string;
  name: string;
  size: number;
  link: string;
  peerCount: number;
  peers: Array<{ nodeId: string; onion: string; link: string; fileId: string }>;
}

export interface NetworkLobbyView {
  onlineNodes: number;
  files: NetworkFileView[];
  totalBytes: number;
  lastSyncAt: Date | null;
  syncError?: string;
}

export interface SearchFilesOptions {
  limit?: number;
  extensions?: string[];
}

interface CachedNetworkFileWire {
  name: string;
  size: number;
  link: string;
  content_hash: string;
  peer_count: number;
  peers: Array<{
    node_id: string;
    onion: string;
    file_id: string;
    link: string;
  }>;
}

interface NetworkPeerWire {
  node_id: string;
  onion: string;
  last_seen_at: string;
}

function mapFile(file: CachedNetworkFileWire | NetworkLobby['files'][number]): NetworkFileView {
  return {
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
  };
}

function mapLobby(
  lobby: NetworkLobby,
  lastSyncAt: Date | null,
  syncError?: string
): NetworkLobbyView {
  const files = (lobby.files || []).map(mapFile);
  return {
    onlineNodes: lobby.online_nodes ?? 0,
    files,
    totalBytes: files.reduce((sum, f) => sum + f.size, 0),
    lastSyncAt,
    syncError,
  };
}

async function syncTimestamp(): Promise<Date | null> {
  try {
    const diag = await trackerGetLastSyncDiag();
    if (diag?.atEpochMs) return new Date(diag.atEpochMs);
  } catch {
    /* ignore */
  }
  return null;
}

function matchesExtension(name: string, extensions?: string[]): boolean {
  if (!extensions?.length) return true;
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return extensions.some(e => e.replace(/^\./, '').toLowerCase() === ext);
}

async function searchCached(query: string, limit?: number): Promise<NetworkFileView[]> {
  const rows = await invoke<CachedNetworkFileWire[]>('search_network_cached', {
    query,
    limit: limit ?? 100,
  });
  return rows.map(mapFile);
}

export const networkFacade = {
  async getLobby(): Promise<NetworkLobbyView> {
    const [lobby, lastSyncAt] = await Promise.all([trackerGetCachedLobby(), syncTimestamp()]);
    return mapLobby(lobby, lastSyncAt);
  },

  async refreshLobby(): Promise<NetworkLobbyView> {
    try {
      const lobby = await trackerRefreshLobby();
      const lastSyncAt = await syncTimestamp();
      return mapLobby(lobby, lastSyncAt);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      const fallback = await this.getLobby();
      return { ...fallback, syncError: message };
    }
  },

  async searchFiles(query: string, options: SearchFilesOptions = {}): Promise<NetworkFileView[]> {
    const q = query.trim();
    const limit = options.limit ?? 100;

    const filterFiles = (files: NetworkFileView[]): NetworkFileView[] => {
      let out = files;
      if (q) {
        const lower = q.toLowerCase();
        out = out.filter(
          f => f.name.toLowerCase().includes(lower) || f.contentHash.toLowerCase().includes(lower)
        );
      }
      if (options.extensions?.length) {
        out = out.filter(f => matchesExtension(f.name, options.extensions));
      }
      return out.slice(0, limit);
    };

    try {
      const presence = await this.getPresence();
      if (presence.running) {
        const lobby = await trackerRefreshLobby();
        return filterFiles((lobby.files || []).map(mapFile));
      }
    } catch {
      /* fall through to SQLite cache */
    }

    return filterFiles(await searchCached(q, limit));
  },

  async listPeers(): Promise<Array<{ nodeId: string; onion: string; lastSeenAt: string }>> {
    const rows = await invoke<NetworkPeerWire[]>('list_network_peers');
    return rows.map(r => ({
      nodeId: r.node_id,
      onion: r.onion,
      lastSeenAt: r.last_seen_at,
    }));
  },

  async getPresence(): Promise<{ onionActive: boolean; running: boolean; onion: string | null }> {
    const st = await onionShareStatus();
    return {
      onionActive: st.running && !!st.onion,
      running: st.running,
      onion: st.onion,
    };
  },

  async getSyncDiagnostics(): Promise<TrackerSyncDiagnostics | null> {
    try {
      return await trackerGetLastSyncDiag();
    } catch {
      return null;
    }
  },

  subscribeLobby(listener: (lobby: NetworkLobbyView) => void): () => void {
    const store = getNetworkLobbyStore();
    let lastKey = '';

    const disposer = createRoot(dispose => {
      createEffect(() => {
        const lobby: NetworkLobbyView = {
          onlineNodes: store.onlineNodes(),
          files: store.files(),
          totalBytes: store.totalBytes(),
          lastSyncAt: store.lastSyncAt(),
          syncError: store.syncError(),
        };
        const key = `${lobby.onlineNodes}:${lobby.files.length}:${lobby.totalBytes}`;
        if (key !== lastKey) {
          lastKey = key;
          listener(lobby);
        }
      });
      return dispose;
    });

    return () => disposer();
  },
};
