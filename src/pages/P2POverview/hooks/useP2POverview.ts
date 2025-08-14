import { createResource, createSignal, onCleanup, onMount } from 'solid-js';
import { torAdapter } from '@/services/network/torAdapter';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';

export const useP2POverview = () => {
  // Manual refresh tick
  const [tick, setTick] = createSignal(0);

  // Resources (no implicit polling)
  const [torStatus, { refetch: refetchTor }] = createResource(tick, async () => torAdapter.status());
  const [nodeStatus, { refetch: refetchNode }] = createResource(tick, async () => p2pNetworkService.getNodeStatus());
  const [metrics, { refetch: refetchMetrics }] = createResource(tick, async () => p2pNetworkService.getNetworkMetrics());

  // Actions
  const refresh = async () => {
    setTick(t => t + 1);
    // call refetch to ensure immediate update in Solid's scheduler
    await Promise.all([refetchTor(), refetchNode(), refetchMetrics()]);
  };

  const enablePrivateNetworking = async () => {
    await torAdapter.start({ bridgeSupport: true });
    await p2pNetworkService.initializeNode({ torSupport: true } as any);
    await p2pNetworkService.startNode();
    await p2pNetworkService.enableTorRouting();
    await refresh();
  };

  const rotateCircuit = async () => {
    try {
      await torAdapter.rotateCircuit();
      await refresh();
    } catch (e) {
      console.error('Rotate circuit failed', e);
    }
  };

  // Optional gentle auto-refresh
  const [auto, setAuto] = createSignal(false);
  let intervalId: number | undefined;
  onMount(() => {
    refresh();
  });
  onCleanup(() => {
    if (intervalId) globalThis.clearInterval(intervalId);
  });
  const toggleAuto = () => {
    const next = !auto();
    setAuto(next);
    if (intervalId) {
      globalThis.clearInterval(intervalId);
      intervalId = undefined;
    }
    if (next) {
      intervalId = globalThis.setInterval(refresh, 5000) as unknown as number;
    }
  };

  return {
    // data
    torStatus,
    nodeStatus,
    metrics,
    // controls
    refresh,
    enablePrivateNetworking,
    rotateCircuit,
    auto,
    toggleAuto,
  };
};




