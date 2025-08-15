import { createResource, createSignal, onCleanup, onMount } from 'solid-js';
import { torAdapter } from '@/services/network/torAdapter';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';

export const useP2POverview = () => {
  // Resources (manual refetch only; avoid suspense loops)
  const [torStatus, { refetch: refetchTor }] = createResource(
    async () => torAdapter.status(),
    { initialValue: null as any }
  );
  const [nodeStatus, { refetch: refetchNode }] = createResource(
    async () => p2pNetworkService.getNodeStatus(),
    { initialValue: null as any }
  );
  const [metrics, { refetch: refetchMetrics }] = createResource(
    async () => p2pNetworkService.getNetworkMetrics(),
    { initialValue: null as any }
  );

  // Actions
  const [lastRefreshAt, setLastRefreshAt] = createSignal<number>(0);
  const refresh = async () => {
    setLastRefreshAt(Date.now());
    // Manual refetches only; do not change resource source to avoid suspense/route fallback
    await Promise.all([refetchTor(), refetchNode(), refetchMetrics()]);
    setLastRefreshAt(Date.now());
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
    // Initial one-shot fetch only; avoid periodic scrolling side-effects
    void refresh();
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
      // Component-friendly refresh: minimal data churn, no global scroll jumps
      intervalId = globalThis.setInterval(() => {
        setLastRefreshAt(Date.now());
        void Promise.all([refetchTor(), refetchNode(), refetchMetrics()]);
        setLastRefreshAt(Date.now());
      }, 5000) as unknown as number;
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
    lastRefreshAt,
  };
};




