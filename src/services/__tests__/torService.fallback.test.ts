import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (cmd: string, args?: any) => {
    switch (cmd) {
      case 'init_tor_node':
        return { id: 'tor1', config: { enableCulturalFiltering: false, enableContentBlocking: false } };
      case 'start_tor':
        return true;
      case 'get_tor_status':
        return { bootstrapped: true, circuitEstablished: true };
      case 'enable_tor_bridges':
        return true;
      case 'disable_tor_bridges':
        return true;
      case 'rotate_tor_circuit':
        return true;
      case 'test_tor_censorship_resistance':
        return true;
      default:
        return true;
    }
  }),
}));

import { torService } from '../network/torService';

describe('TOR fallback and censorship resistance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('enables bridges and rotates circuits successfully', async () => {
    const svc: any = torService;
    await svc.initializeTor({ bridgeSupport: true });
    await svc.startTor();
    await svc.enableBridges?.(['obfs4 1.2.3.4:443']);
    await svc.rotateTorCircuit?.();
    const ok = await svc.testCensorshipResistance?.();
    expect(ok).toBe(true);
  });
});


