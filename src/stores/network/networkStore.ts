import { createSignal, onCleanup, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { networkFacade } from '@/services/network/networkFacade';
import { getNetworkLobbyStore } from '@/services/network/networkLobbyStore';
import { torAdapter } from '@/services/network/torAdapter';
import type { NetworkStatus as P2PStatus, NetworkMetrics as P2PMetrics } from '@/types/Network';

export interface NetworkSnapshot {
  status: P2PStatus | null;
  metrics: P2PMetrics | null;
  tor: { enabled: boolean; circuitEstablished: boolean } | null;
  lastSyncAt: number | null;
}

export interface MetricsHistoryPoint {
  at: number;
  peers: number;
  downloadMbps: number;
  uploadMbps: number;
  activeDownloads: number;
  activeSeeding: number;
}

export type MetricsHistoryRange = '1h' | '6h' | '24h' | '7d';
export type MetricsSparklineKey = 'peers' | 'downloadMbps' | 'activeDownloads';

const RANGE_MS: Record<MetricsHistoryRange, number> = {
  '1h': 3_600_000,
  '6h': 6 * 3_600_000,
  '24h': 24 * 3_600_000,
  '7d': 7 * 24 * 3_600_000,
};

const MAX_HISTORY_AGE_MS = 24 * 3_600_000;
const MAX_HISTORY_POINTS = 720;

let pollingTimer: number | undefined;

const [status, setStatus] = createSignal<P2PStatus | null>(null);
const [metrics, setMetrics] = createSignal<P2PMetrics | null>(null);
const [tor, setTor] = createSignal<{ enabled: boolean; circuitEstablished: boolean } | null>(null);
const [lastSyncAt, setLastSyncAt] = createSignal<number | null>(null);
const [metricsHistory, setMetricsHistory] = createSignal<MetricsHistoryPoint[]>([]);

function parseDownloadMbps(m: P2PMetrics | null): number {
  const raw = m as Record<string, unknown> | null;
  const perf = raw?.performance as { totalBandwidth?: number } | undefined;
  if (perf?.totalBandwidth != null) return perf.totalBandwidth / (1024 * 1024);
  if (typeof raw?.download_rate === 'number') return raw.download_rate / (1024 * 1024);
  return 0;
}

function parseUploadMbps(m: P2PMetrics | null): number {
  const raw = m as Record<string, unknown> | null;
  if (typeof raw?.upload_rate === 'number') return raw.upload_rate / (1024 * 1024);
  return 0;
}

function appendHistory(st: P2PStatus | null, met: P2PMetrics | null): void {
  const point: MetricsHistoryPoint = {
    at: Date.now(),
    peers: st?.connectedPeers ?? 0,
    downloadMbps: parseDownloadMbps(met),
    uploadMbps: parseUploadMbps(met),
    activeDownloads: Number((met as Record<string, unknown> | null)?.active_downloads ?? 0),
    activeSeeding: Number((met as Record<string, unknown> | null)?.active_seeding ?? 0),
  };

  setMetricsHistory(prev => {
    const cutoff = Date.now() - MAX_HISTORY_AGE_MS;
    const updated = [...prev.filter(p => p.at >= cutoff), point];
    return updated.slice(-MAX_HISTORY_POINTS);
  });
}

export function historyForRange(
  history: MetricsHistoryPoint[],
  range: MetricsHistoryRange
): MetricsHistoryPoint[] {
  const cutoff = Date.now() - RANGE_MS[range];
  return history.filter(p => p.at >= cutoff);
}

export function historySparkline(
  history: MetricsHistoryPoint[],
  metric: MetricsSparklineKey,
  range: MetricsHistoryRange = '1h'
): number[] {
  const points = historyForRange(history, range);
  const values = points.map(p => {
    switch (metric) {
      case 'peers':
        return p.peers;
      case 'downloadMbps':
        return p.downloadMbps;
      case 'activeDownloads':
        return p.activeDownloads;
      default:
        return 0;
    }
  });
  if (values.length === 0) return [];
  const max = Math.max(...values, 0.001);
  return values.map(v => Math.round((v / max) * 100));
}

async function fetchNetworkMetrics(): Promise<P2PMetrics | null> {
  try {
    const raw = await invoke<{
      active_downloads?: number;
      active_seeding?: number;
      active_discovery?: number;
      download_rate?: number;
      upload_rate?: number;
      transfers?: unknown[];
    }>('get_network_metrics', { nodeId: null });
    if (!raw || typeof raw !== 'object') return null;
    return {
      performance: {
        averageLatency: 0,
        totalBandwidth: Number(raw.download_rate ?? 0) + Number(raw.upload_rate ?? 0),
        messagesSent: 0,
        messagesReceived: 0,
        errorRate: 0,
      },
      ...(raw as object),
    } as P2PMetrics;
  } catch {
    return null;
  }
}

async function buildNodeStatus(presence: {
  running: boolean;
  onionActive: boolean;
  onion: string | null;
}): Promise<P2PStatus> {
  const lobby = getNetworkLobbyStore();
  return {
    nodeStatus: presence.running ? 'online' : 'offline',
    connectedPeers: lobby.onlineNodes(),
    discoveredPeers: lobby.onlineNodes(),
    torStatus: {
      enabled: true,
      connected: presence.running,
      hiddenServices: presence.onion ? [presence.onion] : [],
      circuitStatus: presence.running ? 'connected' : 'failed',
    },
    ipfsStatus: false,
    networkHealth: presence.onionActive ? 0.9 : presence.running ? 0.5 : 0,
    censorshipResistance: {
      level: presence.running ? 5 : 0,
      torConnectivity: presence.running,
      hiddenServiceAccess: !!presence.onion,
      contentFilteringBypass: presence.running,
      culturalBlockingResistance: true,
      alternativeNarrativeSupport: true,
    },
    activeCommunityNetworks: [],
    contentStats: {
      totalShared: 0,
      totalReceived: 0,
      culturalContentShared: 0,
      educationalContentShared: 0,
      alternativeNarrativesShared: 0,
      communityContentShared: 0,
    },
  } as P2PStatus;
}

async function refreshOnce(): Promise<void> {
  try {
    const [presence, met, torSt] = await Promise.all([
      networkFacade.getPresence().catch(() => null),
      fetchNetworkMetrics(),
      torAdapter.status().catch(() => null),
    ]);
    if (presence) {
      setStatus(await buildNodeStatus(presence));
    }
    if (met) setMetrics(met);
    if (torSt) setTor({ enabled: !!torSt, circuitEstablished: !!torSt?.circuitEstablished });
    appendHistory(status(), met ?? metrics());
    setLastSyncAt(Date.now());
  } catch {
    // best-effort
  }
}

function startPolling(intervalMs = 3000): void {
  if (pollingTimer) return;
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

  const historyFor = (range: MetricsHistoryRange) => historyForRange(metricsHistory(), range);

  const sparkline = (metric: MetricsSparklineKey, range?: MetricsHistoryRange) =>
    historySparkline(metricsHistory(), metric, range ?? '1h');

  return {
    status,
    metrics,
    tor,
    lastSyncAt,
    metricsHistory,
    refresh: refreshOnce,
    startPolling,
    stopPolling,
    historyForRange: historyFor,
    historySparkline: sparkline,
    snapshot: (): NetworkSnapshot => ({
      status: status(),
      metrics: metrics(),
      tor: tor(),
      lastSyncAt: lastSyncAt(),
    }),
    labelTorMode: () => (tor()?.circuitEstablished ? 'Internet + TOR' : 'Internet'),
    connectedPeers: () => status()?.connectedPeers ?? 0,
    onionShareRunning: () => status()?.nodeStatus === 'online',
    networkHealthPct: () => {
      const h = status()?.networkHealth;
      if (typeof h === 'number' && !Number.isNaN(h) && h > 0 && h <= 1) return Math.round(h * 100);
      return 0;
    },
    downloadMbps: () => parseDownloadMbps(metrics()).toFixed(1),
    downloadMbpsNumber: () => parseDownloadMbps(metrics()),
    uploadMbps: () => parseUploadMbps(metrics()).toFixed(1),
    uploadMbpsNumber: () => parseUploadMbps(metrics()),
    transfers: () => (metrics() as Record<string, unknown> | null)?.transfers ?? [],
    activeDownloads: () =>
      Number((metrics() as Record<string, unknown> | null)?.active_downloads ?? 0),
    activeSeeding: () => Number((metrics() as Record<string, unknown> | null)?.active_seeding ?? 0),
    activeDiscovery: () =>
      Number((metrics() as Record<string, unknown> | null)?.active_discovery ?? 0),
  };
}
