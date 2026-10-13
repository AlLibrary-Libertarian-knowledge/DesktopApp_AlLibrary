import type { NetworkFileView } from '@/services/network/networkFacade';

export interface NetworkPeerView {
  nodeId: string;
  onion: string;
  lastSeenAt: string;
  displayName: string;
  onionShort: string;
  lastSeenLabel: string;
  fileCount: number;
}

export function truncateNodeId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…`;
}

export function truncateOnion(onion: string): string {
  const bare = onion.replace(/\.onion$/i, '');
  if (bare.length <= 12) return onion.endsWith('.onion') ? onion : `${onion}.onion`;
  return `${bare.slice(0, 6)}…${bare.slice(-6)}.onion`;
}

export function relativeTime(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return iso;
    const diff = Date.now() - then;
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return iso;
  }
}

function countFilesForPeer(nodeId: string, files: NetworkFileView[]): number {
  return files.filter(f => f.peers.some(p => p.nodeId === nodeId)).length;
}

export function mapPeer(
  raw: { nodeId: string; onion: string; lastSeenAt: string },
  files: NetworkFileView[]
): NetworkPeerView {
  return {
    nodeId: raw.nodeId,
    onion: raw.onion,
    lastSeenAt: raw.lastSeenAt,
    displayName: truncateNodeId(raw.nodeId),
    onionShort: truncateOnion(raw.onion),
    lastSeenLabel: relativeTime(raw.lastSeenAt),
    fileCount: countFilesForPeer(raw.nodeId, files),
  };
}

/**
 * Build peer rows from lobby file locations.
 * Status bar uses online_nodes; the graph historically used SQLite peers only —
 * when that cache is empty/stale, topology still needs these file peers.
 */
export function peersFromLobbyFiles(
  files: NetworkFileView[],
  lastSeenAt: string = new Date().toISOString()
): NetworkPeerView[] {
  const byId = new Map<string, { nodeId: string; onion: string }>();
  for (const f of files) {
    for (const p of f.peers) {
      if (!p.nodeId) continue;
      const prev = byId.get(p.nodeId);
      if (!prev) {
        byId.set(p.nodeId, { nodeId: p.nodeId, onion: p.onion || '' });
      } else if (!prev.onion && p.onion) {
        prev.onion = p.onion;
      }
    }
  }
  return [...byId.values()].map(p => mapPeer({ ...p, lastSeenAt }, files));
}

/** Prefer SQLite peer rows; fill gaps from lobby file peer lists. */
export function mergePeerViews(
  fromCache: NetworkPeerView[],
  fromFiles: NetworkPeerView[]
): NetworkPeerView[] {
  const byId = new Map<string, NetworkPeerView>();
  for (const p of fromFiles) byId.set(p.nodeId, p);
  for (const p of fromCache) {
    const existing = byId.get(p.nodeId);
    if (!existing) {
      byId.set(p.nodeId, p);
      continue;
    }
    byId.set(p.nodeId, {
      ...existing,
      ...p,
      onion: p.onion || existing.onion,
      onionShort: p.onion ? p.onionShort : existing.onionShort,
      fileCount: Math.max(p.fileCount, existing.fileCount),
    });
  }
  return [...byId.values()];
}
