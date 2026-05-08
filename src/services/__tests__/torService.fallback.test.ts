import { describe, it, expect, beforeEach } from 'vitest';
import { torService } from '../network/torService';

describe('TOR service shell', () => {
  beforeEach(() => {
    // singleton; no mocks — implementation is frontend-only stubs
  });

  it('exposes resilient no-op entry points and reports resistance checks as inactive', async () => {
    const svc = torService;
    await expect(svc.initializeTor({ bridgeSupport: true } as any)).resolves.toBeTruthy();
    await expect(svc.startTor()).resolves.toBeUndefined();
    await expect(svc.enableBridges(['obfs4 1.2.3.4:443'])).resolves.toBeUndefined();
    await expect(svc.rotateTorCircuit()).resolves.toBeUndefined();

    const ok = await svc.testCensorshipResistance?.();
    expect(ok).toBe(false);
  });
});
