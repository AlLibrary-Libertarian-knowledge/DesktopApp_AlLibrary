import { describe, expect, it } from 'vitest';
import { mergePeerViews, peersFromLobbyFiles, type NetworkPeerView } from '../networkPeerView';
import type { NetworkFileView } from '@/services/network/networkFacade';

const files: NetworkFileView[] = [
  {
    contentHash: 'aaa',
    name: 'a.pdf',
    size: 10,
    link: 'opoc://a',
    peerCount: 2,
    peers: [
      { nodeId: 'self-1', onion: 'aaa.onion', link: 'l1', fileId: 'f1' },
      { nodeId: 'peer-2', onion: 'bbb.onion', link: 'l2', fileId: 'f2' },
    ],
  },
  {
    contentHash: 'bbb',
    name: 'b.pdf',
    size: 20,
    link: 'opoc://b',
    peerCount: 1,
    peers: [{ nodeId: 'peer-3', onion: 'ccc.onion', link: 'l3', fileId: 'f3' }],
  },
];

describe('peersFromLobbyFiles / mergePeerViews', () => {
  it('extracts unique peers from lobby files', () => {
    const peers = peersFromLobbyFiles(files, '2026-10-12T00:00:00.000Z');
    expect(peers.map(p => p.nodeId).sort()).toEqual(['peer-2', 'peer-3', 'self-1']);
    expect(peers.find(p => p.nodeId === 'peer-2')?.fileCount).toBe(1);
  });

  it('fills empty SQLite cache from lobby files', () => {
    const merged = mergePeerViews([], peersFromLobbyFiles(files));
    expect(merged).toHaveLength(3);
  });

  it('keeps cache rows and adds file-only peers', () => {
    const cache: NetworkPeerView[] = [
      {
        nodeId: 'peer-2',
        onion: 'bbb.onion',
        lastSeenAt: '2026-10-12T00:00:00.000Z',
        displayName: 'peer-2',
        onionShort: 'bbb.onion',
        lastSeenLabel: 'just now',
        fileCount: 0,
      },
    ];
    const merged = mergePeerViews(cache, peersFromLobbyFiles(files));
    expect(merged.map(p => p.nodeId).sort()).toEqual(['peer-2', 'peer-3', 'self-1']);
    expect(merged.find(p => p.nodeId === 'peer-2')?.fileCount).toBe(1);
  });
});
