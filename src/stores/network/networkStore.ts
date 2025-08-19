import { createSignal, onCleanup, onMount } from 'solid-js';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';
import { torAdapter } from '@/services/network/torAdapter';
import type { NetworkStatus as P2PStatus, NetworkMetrics as P2PMetrics } from '@/types/Network';

export interface NetworkSnapshot {
  status: P2PStatus | null;
  metrics: P2PMetrics | null;
  tor: { enabled: boolean; circuitEstablished: boolean } | null;
  lastSyncAt: number | null;
}

let pollingTimer: number | undefined;

const [status, setStatus] = createSignal<P2PStatus | null>(null);
const [metrics, setMetrics] = createSignal<P2PMetrics | null>(null);
const [tor, setTor] = createSignal<{ enabled: boolean; circuitEstablished: boolean } | null>(null);
const [lastSyncAt, setLastSyncAt] = createSignal<number | null>(null);

async function refreshOnce(): Promise<void> {
  try {
    const [st, met, torSt] = await Promise.all([
      p2pNetworkService.getNodeStatus().catch(() => null as any),
      p2pNetworkService.getNetworkMetrics().catch(() => null as any),
      torAdapter.status().catch(() => null as any),
    ]);
    if (st) setStatus(st as P2PStatus);
    if (met) setMetrics(met as P2PMetrics);
    if (torSt) setTor({ enabled: !!torSt, circuitEstablished: !!torSt?.circuitEstablished });
    setLastSyncAt(Date.now());
  } catch (e) {
    // best-effort
  }
}

function startPolling(intervalMs = 3000): void {
  if (pollingTimer) return;
  // Initial fetch
  void refreshOnce();
  pollingTimer = setInterval(() => void refreshOnce(), intervalMs) as unknown as number;
}

function stopPolling(): void {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = undefined;
  }
}

export function useNetworkStore() {
  onMount(() => startPolling());
  onCleanup(() => stopPolling());
  return {
    status,
    metrics,
    tor,
    lastSyncAt,
    refresh: refreshOnce,
    startPolling,
    stopPolling,
    snapshot: (): NetworkSnapshot => ({ status: status(), metrics: metrics(), tor: tor(), lastSyncAt: lastSyncAt() }),
    labelTorMode: () => (tor()?.circuitEstablished ? 'Internet + TOR' : 'Internet'),
    connectedPeers: () => status()?.connectedPeers ?? 0,
    networkHealthPct: () => {
      const h = status()?.networkHealth;
      if (typeof h === 'number' && !Number.isNaN(h) && h > 0 && h <= 1) return Math.round(h * 100);
      return 0;
    },
    downloadMbps: () => {
      const m = metrics() as any;
      // Support both shapes: { performance: { totalBandwidth } } or { download_rate }
      if (m?.performance?.totalBandwidth != null) return (m.performance.totalBandwidth / (1024 * 1024)).toFixed(1);
      if (typeof m?.download_rate === 'number') return (m.download_rate / (1024 * 1024)).toFixed(1);
      return '0.0';
    },
    uploadMbps: () => {
      const m = metrics() as any;
      if (typeof m?.upload_rate === 'number') return (m.upload_rate / (1024 * 1024)).toFixed(1);
      return '0.0';
    },
    transfers: () => (metrics() as any)?.transfers ?? [],
    activeDownloads: () => Number((metrics() as any)?.active_downloads ?? 0),
    activeSeeding: () => Number((metrics() as any)?.active_seeding ?? 0),
    activeDiscovery: () => Number((metrics() as any)?.active_discovery ?? 0),
  };
}


