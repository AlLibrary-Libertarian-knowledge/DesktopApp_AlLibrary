import { describe, it, expect, beforeEach } from 'vitest';
import { p2pNetworkService } from '../network/p2pNetworkService';

describe('P2P network shell (backend disabled)', () => {
  let svc: typeof p2pNetworkService;

  beforeEach(() => {
    svc = p2pNetworkService;
  });

  it('reports a stable disabled node and empty peer topology', async () => {
    const node = await svc.initializeNode({ torSupport: true });
    expect(node.id).toBe('network-disabled');

    await svc.startNode();
    const peers = await svc.discoverPeers({ includeTorPeers: true });
    expect(peers).toEqual([]);

    await svc.connectToPeer('peer-would-not-connect');
    const connected = await svc.getConnectedPeers();
    expect(Array.isArray(connected)).toBe(true);
    expect(connected).toHaveLength(0);
  });

  it('refuses replication while network layer is disconnected', async () => {
    await svc.initializeNode({ torSupport: true });
    await expect(
      svc.publishContent(
        { id: 'doc1' } as any,
        {
          sensitivityLevel: 2,
          culturalOrigin: 'origin',
        } as any
      )
    ).rejects.toThrow(/local file paths/);

    await expect(svc.requestContent({ ipfsHash: 'Qm123' } as any, 'peer1')).rejects.toThrow(
      /specific download UI/
    );
  });

  it('searchNetwork returns an array (empty) with no backend', async () => {
    await svc.initializeNode({ torSupport: true });
    const results = await svc.searchNetwork('query', { respectCulturalBoundaries: false } as any);
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(0);
  });
});
