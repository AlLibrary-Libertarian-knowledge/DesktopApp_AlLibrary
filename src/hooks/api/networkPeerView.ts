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
