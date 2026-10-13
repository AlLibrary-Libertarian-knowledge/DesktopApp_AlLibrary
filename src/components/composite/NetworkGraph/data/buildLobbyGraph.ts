import type { NetworkFileView } from '@/services/network/networkFacade';
import {
  mergePeerViews,
  peersFromLobbyFiles,
  type NetworkPeerView,
} from '@/hooks/api/networkPeerView';
import type { Link, Node } from '../types';
import { physicsConfig } from '../config/physicsConfig';

export interface LobbyGraphInput {
  selfOnion: string | null;
  selfNodeId: string | null;
  peers: NetworkPeerView[];
  files: NetworkFileView[];
  centerX?: number;
  centerY?: number;
}

function filesForPeer(nodeId: string, files: NetworkFileView[]) {
  return files
    .filter(f => f.peers.some(p => p.nodeId === nodeId))
    .map(f => ({
      name: f.name,
      size: f.size,
      contentHash: f.contentHash,
      link: f.link || f.swarmLink,
    }));
}

function onionShortFrom(onion: string | null | undefined): string | undefined {
  if (!onion) return undefined;
  const bare = onion.replace(/^https?:\/\//, '').replace(/\.onion$/i, '');
  if (bare.length <= 14) return `${bare}.onion`;
  return `${bare.slice(0, 6)}…${bare.slice(-6)}.onion`;
}

function withOrbit(node: Node, centerX: number, centerY: number): Node {
  if (node.type === 'self') {
    return { ...node, angle: 0, orbitRadius: 0, orbitSpeed: 0 };
  }
  const dx = node.x - centerX;
  const dy = node.y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy) || 160;
  const subtleModifier = 1 + (Math.random() - 0.5) * 0.5;
  return {
    ...node,
    angle: Math.atan2(dy, dx),
    orbitRadius: Math.max(physicsConfig.minOrbitRadius, distance),
    orbitSpeed:
      physicsConfig.baseOrbitSpeed *
      (1 + Math.random() * physicsConfig.speedVariation) *
      subtleModifier,
  };
}

/** Preserve simulation state when lobby refreshes. */
export function mergeGraphPositions(prev: Node[], next: Node[]): Node[] {
  const prevById = new Map(prev.map(n => [n.id, n]));
  return next.map(n => {
    const old = prevById.get(n.id);
    if (!old) return n;
    return {
      ...n,
      x: old.x,
      y: old.y,
      vx: old.vx,
      vy: old.vy,
      angle: old.angle,
      orbitRadius: old.orbitRadius,
      orbitSpeed: old.orbitSpeed,
      isBeingDragged: old.isBeingDragged,
    };
  });
}

export function buildLobbyGraph(input: LobbyGraphInput): { nodes: Node[]; links: Link[] } {
  const centerX = input.centerX ?? 400;
  const centerY = input.centerY ?? 300;

  const selfFiles = input.selfNodeId
    ? filesForPeer(input.selfNodeId, input.files)
    : input.files
        .filter(f => (input.selfOnion ? f.peers.some(p => p.onion === input.selfOnion) : false))
        .map(f => ({
          name: f.name,
          size: f.size,
          contentHash: f.contentHash,
          link: f.link || f.swarmLink,
        }));

  const selfBytes = selfFiles.reduce((s, f) => s + f.size, 0);
  const selfOnionShort = onionShortFrom(input.selfOnion);

  const selfNode: Node = withOrbit(
    {
      id: 'self',
      label: 'Você',
      type: 'self',
      status: 'connected',
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      connections: Math.max(selfFiles.length, input.peers.length),
      bandwidth: 0,
      latency: 0,
      reliability: 100,
      userId: input.selfNodeId ?? 'local',
      username: 'Você',
      location: selfOnionShort || 'Nó local',
      networkType: input.selfOnion ? 'tor' : 'hybrid',
      onionAddress: input.selfOnion ?? undefined,
      onionShort: selfOnionShort,
      sharedFileCount: selfFiles.length,
      sharedBytes: selfBytes,
      sharedFiles: selfFiles,
      lastSeenLabel: 'agora',
      isLocalSelf: true,
      activeTransfers: { downloading: [], uploading: [] },
    },
    centerX,
    centerY
  );

  // Lobby files always carry peer locations; SQLite peer cache can lag or TTL-expire
  // while status still shows online_nodes > 0 — merge so topology matches reality.
  const peers = mergePeerViews(input.peers, peersFromLobbyFiles(input.files)).filter(
    p => p.nodeId !== input.selfNodeId
  );
  const angleStep = peers.length > 0 ? (Math.PI * 2) / peers.length : 0;

  const peerNodes: Node[] = peers.map((p, i) => {
    const shared = filesForPeer(p.nodeId, input.files);
    const sharedBytes = shared.reduce((s, f) => s + f.size, 0);
    const radius = 150 + (i % 3) * 28;
    const angle = i * angleStep - Math.PI / 2;
    const seenMs = Date.parse(p.lastSeenAt);
    const fresh = !Number.isNaN(seenMs) && Date.now() - seenMs < 90_000;

    return withOrbit(
      {
        id: p.nodeId,
        label: p.onionShort || p.displayName,
        type: 'peer',
        status: fresh ? 'connected' : 'connecting',
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        connections: shared.length,
        bandwidth: 0,
        latency: 0,
        reliability: fresh ? 92 : 55,
        userId: p.nodeId,
        username: p.onionShort || p.displayName,
        location: p.lastSeenLabel,
        networkType: 'tor',
        onionAddress: p.onion,
        onionShort: p.onionShort,
        sharedFileCount: shared.length,
        sharedBytes,
        sharedFiles: shared,
        lastSeenLabel: p.lastSeenLabel,
        isLocalSelf: false,
        activeTransfers: { downloading: [], uploading: [] },
      },
      centerX,
      centerY
    );
  });

  const links: Link[] = peerNodes.map(n => ({
    source: 'self',
    target: n.id,
    strength: n.status === 'connected' ? 0.85 : 0.45,
    bandwidth: 0,
    latency: 0,
    status: n.status === 'connected' ? 'active' : 'idle',
  }));

  // Light mesh between first few peers so the graph doesn't look star-only
  for (let i = 0; i < peerNodes.length - 1 && i < 4; i++) {
    const a = peerNodes[i]!;
    const b = peerNodes[i + 1]!;
    links.push({
      source: a.id,
      target: b.id,
      strength: 0.35,
      bandwidth: 0,
      latency: 0,
      status: 'idle',
    });
  }

  return { nodes: [selfNode, ...peerNodes], links };
}

export function nodeHitRadius(node: Node): number {
  const baseSize = 12;
  const connectionModifier = Math.min(node.connections * 0.5, 6);
  let activityModifier = 0;
  if (node.activeTransfers) {
    activityModifier =
      (node.activeTransfers.downloading.length > 0 ? 2 : 0) +
      (node.activeTransfers.uploading.length > 0 ? 2 : 0);
  }
  // Generous pad — orbiting nodes are hard to click otherwise
  return baseSize + connectionModifier + activityModifier + 22;
}
