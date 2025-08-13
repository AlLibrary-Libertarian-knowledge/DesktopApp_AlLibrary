import { describe, it, expect, vi, beforeEach } from 'vitest';

let lastInvokeArgs: Record<string, any> = {};

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (cmd: string, args?: any) => {
    lastInvokeArgs[cmd] = args;
    switch (cmd) {
      case 'init_ipfs_node':
        return { id: 'ipfs1', config: { enableCulturalFiltering: false, enableContentBlocking: false } };
      case 'start_ipfs_node':
        return true;
      case 'add_content_to_ipfs':
        return { ipfsHash: 'QmABC', timestamp: Date.now() };
      case 'pin_content':
        return true;
      case 'create_redundant_copies':
        return ['QmCopy1', 'QmCopy2', 'QmCopy3'];
      case 'ensure_content_availability':
        return true;
      case 'replicate_content':
        return true;
      case 'find_content_providers':
        return ['nodeA', 'nodeB', 'nodeC'];
      case 'get_ipfs_stats':
        return { peers: 5, repoSize: 123456, blocks: 789, uptimeSec: 3600 };
      default:
        return true;
    }
  }),
}));

import { ipfsService } from '../network/ipfsService';

describe('IPFS replication and availability', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    lastInvokeArgs = {};
  });

  it('creates redundant copies and ensures availability', async () => {
    const svc: any = ipfsService;
    await svc.initializeNode({ redundantPinning: 3 });
    await svc.startNode();

    const hash = await svc.addContent?.({ id: 'doc1', title: 'traditional knowledge' }, { sensitivityLevel: 2, culturalOrigin: 'origin' });
    expect(hash.ipfsHash).toBe('QmABC');

    // Pin with redundancy and verify call shape includes anti-censorship flags
    await svc.pinContent?.('QmABC', { redundancy: 3, priority: 'high' });
    expect(lastInvokeArgs['pin_content'].strategy.antiCensorship).toBe(true);

    // Redundant copies created
    expect(Array.isArray(lastInvokeArgs['create_redundant_copies'].distributionStrategy)).toBeFalsy();
    const copies = await svc.createRedundantCopies?.('QmABC', 3);
    expect(copies.length).toBeGreaterThanOrEqual(3);

    // Availability check passes with anti-censorship requirements
    const available = await svc.ensureAvailability?.('QmABC');
    expect(available).toBe(true);
    expect(lastInvokeArgs['ensure_content_availability'].requirements.verifyCensorshipResistance).toBe(true);
  });

  it('finds providers and announces content', async () => {
    const svc: any = ipfsService;
    await svc.initializeNode({});
    const providers = await svc.findProviders?.('QmABC');
    expect(providers.length).toBeGreaterThan(0);

    await svc.announceContent?.('QmABC');
    expect(lastInvokeArgs['announce_content'].announcement.enableAntiCensorship).toBe(true);
  });
});


