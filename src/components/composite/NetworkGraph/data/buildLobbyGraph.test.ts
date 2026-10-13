import { describe, expect, it } from 'vitest';
import { buildLobbyGraph } from './buildLobbyGraph';
import type { NetworkFileView } from '@/services/network/networkFacade';

const files: NetworkFileView[] = [
  {
    contentHash: 'hash1',
    name: 'doc.pdf',
    size: 1000,
    link: 'opoc://1',
    peerCount: 2,
    peers: [
      { nodeId: 'me', onion: 'me.onion', link: 'l1', fileId: 'f1' },
      { nodeId: 'other', onion: 'other.onion', link: 'l2', fileId: 'f2' },
    ],
  },
];

describe('buildLobbyGraph', () => {
  it('shows remote peers from lobby files even when SQLite peer list is empty', () => {
    const { nodes, links } = buildLobbyGraph({
      selfOnion: 'me.onion',
      selfNodeId: 'me',
      peers: [],
      files,
      centerX: 400,
      centerY: 300,
    });

    expect(nodes.some(n => n.type === 'self')).toBe(true);
    expect(nodes.filter(n => n.type === 'peer')).toHaveLength(1);
    expect(nodes.find(n => n.id === 'other')).toBeTruthy();
    expect(links.some(l => l.target === 'other')).toBe(true);
  });
});
