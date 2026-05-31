/**
 * NetworkHealth Page — live metrics from networkStore with rolling history charts.
 */

import { type Component, createSignal, createMemo, onMount, onCleanup, For, Show } from 'solid-js';
import { Button, Card, Modal } from '@/components/foundation';
import { NetworkHealthDashboard } from '@/components/composite/NetworkHealthDashboard';
import {
  RefreshCw,
  Activity,
  Network,
  BarChart3,
  Pause,
  Play,
  RotateCcw,
  Zap,
  Users,
  Download,
  TrendingUp,
} from 'lucide-solid';
import styles from './NetworkHealth.module.css';
import { useNetworkStore, type MetricsHistoryRange } from '@/stores/network/networkStore';
import { networkFacade } from '@/services/network/networkFacade';
import { useNetworkPresenceResource } from '@/hooks/network/useNetworkPresence';
import { TorBootstrapStatus } from '@/components/domain/network/TorBootstrapStatus';
import { bootstrapStatusLabel } from '@/utils/networkBootstrapSteps';

interface NetworkMetric {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

interface DiagnosticPeer {
  nodeId: string;
  onion: string;
  lastSeenAt: string;
}

export const NetworkHealth: Component = () => {
  const [refreshing, setRefreshing] = createSignal(false);
  const [monitoring, setMonitoring] = createSignal(true);
  const [autoRefresh, setAutoRefresh] = createSignal(true);
  const [refreshInterval, setRefreshInterval] = createSignal(5000);
  const [selectedMetric, setSelectedMetric] = createSignal<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = createSignal(false);
  const [diagnosticPeers, setDiagnosticPeers] = createSignal<DiagnosticPeer[]>([]);
  const [timeRange, setTimeRange] = createSignal<MetricsHistoryRange>('1h');

  const net = useNetworkStore();
  const { presence, bootstrapMessage, isBootstrapping } = useNetworkPresenceResource();

  const networkMetrics = createMemo((): NetworkMetric[] => {
    const range = timeRange();
    net.lastSyncAt();
    net.metricsHistory();
    presence();
    bootstrapMessage();

    const bootstrapping = isBootstrapping();
    const running = net.onionShareRunning() && !bootstrapping;
    const peers = net.connectedPeers();
    const dl = parseFloat(net.downloadMbps());
    const active = net.activeDownloads();
    const pct = presence().bootstrapPercent;

    return [
      {
        id: 'onion-share',
        name: 'Onion Share',
        value: bootstrapping
          ? pct > 0
            ? `${pct}%`
            : 'Connecting'
          : running
            ? 'Running'
            : 'Stopped',
        unit: bootstrapping ? '' : '',
        status: bootstrapping ? 'warning' : running ? 'good' : 'warning',
        trend: 'stable',
        history: [],
      },
      {
        id: 'active-peers',
        name: 'Active Peers',
        value: peers,
        unit: 'peers',
        status: peers > 0 ? 'good' : 'warning',
        trend: 'stable',
        history: net.historySparkline('peers', range),
      },
      {
        id: 'throughput',
        name: 'Download Rate',
        value: Math.round(dl * 10) / 10,
        unit: 'MB/s',
        status: 'good',
        trend: 'stable',
        history: net.historySparkline('downloadMbps', range),
      },
      {
        id: 'active-transfers',
        name: 'Active Transfers',
        value: active,
        unit: active === 1 ? 'download' : 'downloads',
        status: 'good',
        trend: 'stable',
        history: net.historySparkline('activeDownloads', range),
      },
    ];
  });

  onMount(() => {
    let timer: ReturnType<typeof globalThis.setInterval> | undefined;
    const tick = () => {
      if (autoRefresh() && monitoring()) void net.refresh();
    };
    timer = globalThis.setInterval(tick, refreshInterval());
    onCleanup(() => {
      if (timer) globalThis.clearInterval(timer);
    });
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await net.refresh();
    setRefreshing(false);
  };

  const openDiagnostics = async () => {
    setShowDiagnostics(true);
    const peers = await networkFacade.listPeers().catch(() => []);
    setDiagnosticPeers(peers);
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'var(--color-success)';
      case 'warning':
        return 'var(--color-warning)';
      case 'critical':
        return 'var(--color-error)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const getTrendIcon = () => <Activity size={14} />;

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'onion-share':
        return <Activity size={20} />;
      case 'active-peers':
        return <Users size={20} />;
      case 'throughput':
        return <Zap size={20} />;
      case 'active-transfers':
        return <Download size={20} />;
      default:
        return <TrendingUp size={20} />;
    }
  };

  const sparklineMax = (history: number[]) => Math.max(...history, 1);

  return (
    <div class={styles['network-health-page']}>
      <header class={`${styles['page-header']} ${styles.enhanced}`}>
        <div class={styles['header-content']}>
          <div class={styles['title-section']}>
            <h1 class={styles['page-title']}>
              <Network size={32} class={(styles['title-icon'] as string) ?? ''} />
              Network Health Monitor
            </h1>
            <p class={styles['page-subtitle']}>
              Live tracker peers, download throughput, and transfer activity from your node cache
            </p>
          </div>

          <div class={styles['monitoring-controls']}>
            <div class={styles['monitoring-status']}>
              <div
                class={`${styles['status-indicator']} ${monitoring() ? styles.active : styles.inactive}`}
              >
                <div class={styles['status-pulse']} />
              </div>
              <span class={styles['status-text']}>
                {isBootstrapping()
                  ? bootstrapStatusLabel(
                      presence().mode,
                      presence().bootstrapPercent,
                      bootstrapMessage()
                    )
                  : monitoring()
                    ? 'Live Monitoring'
                    : 'Monitoring Paused'}
              </span>
            </div>

            <div class={styles['control-buttons']}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMonitoring(!monitoring())}
                class={styles['monitoring-toggle'] as string}
              >
                {monitoring() ? <Pause size={16} /> : <Play size={16} />}
                {monitoring() ? 'Pause' : 'Resume'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing()}
                class={styles['refresh-button'] as string}
              >
                <RefreshCw size={16} class={(refreshing() ? styles.spinning : '') as string} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div class={styles['header-actions']}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void openDiagnostics()}
            class={styles['action-button'] as string}
          >
            <Activity size={16} />
            Peer diagnostics
          </Button>
        </div>
      </header>

      <Show
        when={isBootstrapping()}
        fallback={
          <>
            <div class={styles['control-panel']}>
              <div class={styles['view-controls']}>
                <div class={styles['view-selector']}>
                  <button class={`${styles['view-option']} ${styles.active}`} type="button">
                    <BarChart3 size={16} />
                    Overview
                  </button>
                </div>

                <div class={styles['time-range-selector']}>
                  <For each={['1h', '6h', '24h', '7d'] as const}>
                    {range => (
                      <button
                        type="button"
                        class={`${styles['time-option']} ${timeRange() === range ? styles.active : ''}`}
                        onClick={() => setTimeRange(range)}
                      >
                        {range}
                      </button>
                    )}
                  </For>
                </div>
              </div>

              <div class={styles['filter-controls']}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh())}
                  class={
                    `${styles['auto-refresh']} ${autoRefresh() ? styles.active : ''}` as string
                  }
                >
                  <RotateCcw size={14} />
                  Auto-refresh
                </Button>

                <select
                  class={styles['refresh-interval']}
                  value={refreshInterval()}
                  onChange={e => setRefreshInterval(Number(e.currentTarget.value))}
                >
                  <option value={3000}>3s</option>
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                  <option value={30000}>30s</option>
                </select>
              </div>
            </div>

            <div class={styles['main-content']}>
              <div class={styles['metrics-grid']}>
                <For each={networkMetrics()}>
                  {metric => (
                    <Card
                      class={`${styles['metric-card']} ${selectedMetric() === metric.id ? styles.selected : ''}`}
                      onClick={() =>
                        setSelectedMetric(selectedMetric() === metric.id ? null : metric.id)
                      }
                    >
                      <div class={styles['metric-header']}>
                        <div class={styles['metric-icon']}>{getMetricIcon(metric.id)}</div>
                        <div class={styles['metric-trend']}>{getTrendIcon()}</div>
                      </div>

                      <div class={styles['metric-content']}>
                        <div class={styles['metric-value']}>
                          {metric.value}
                          <Show when={metric.unit}>
                            <span class={styles['metric-unit']}> {metric.unit}</span>
                          </Show>
                        </div>
                        <div class={styles['metric-name']}>{metric.name}</div>
                      </div>

                      <Show when={metric.history.length > 0}>
                        <div class={styles['metric-chart']}>
                          <div class={styles['chart-container']}>
                            <For each={metric.history}>
                              {(value, index) => (
                                <div
                                  class={styles['chart-bar']}
                                  style={{
                                    height: `${(value / sparklineMax(metric.history)) * 100}%`,
                                    'animation-delay': `${index() * 0.1}s`,
                                  }}
                                />
                              )}
                            </For>
                          </div>
                        </div>
                      </Show>

                      <div
                        class={styles['metric-status']}
                        style={{ color: getMetricStatusColor(metric.status) }}
                      >
                        <div class={styles['status-dot']} />
                        {metric.status}
                      </div>
                    </Card>
                  )}
                </For>
              </div>

              <div class={styles['dashboard-container']}>
                <NetworkHealthDashboard
                  enableRealTimeUpdates={monitoring()}
                  timeRange={timeRange()}
                />
              </div>
            </div>
          </>
        }
      >
        <div class={styles['bootstrap-view']}>
          <TorBootstrapStatus variant="banner" showSteps />
        </div>
      </Show>

      <Show when={showDiagnostics()}>
        <Modal
          isOpen={showDiagnostics()}
          onClose={() => setShowDiagnostics(false)}
          title="Network Diagnostics"
          size="xl"
          class={styles['diagnostics-modal'] as string}
        >
          <div class={styles['diagnostics-content']}>
            <p style={{ opacity: 0.85, 'margin-bottom': '1rem' }}>
              Cached tracker peers from SQLite. If sync fails, use Configurations → Advanced →
              Refresh lobby.
            </p>
            <div class={styles['diagnostic-results']}>
              <h4>Cached peers ({diagnosticPeers().length})</h4>
              <Show
                when={diagnosticPeers().length > 0}
                fallback={<p>No peers in cache yet. Start onion share and wait for lobby sync.</p>}
              >
                <div class={styles['results-grid']}>
                  <For each={diagnosticPeers()}>
                    {peer => (
                      <div class={styles['node-diagnostic']}>
                        <div class={styles['node-info']}>
                          <strong>{peer.nodeId}</strong>
                          <span>{peer.onion}</span>
                        </div>
                        <div class={styles['node-metrics']}>
                          <div class={styles['diagnostic-metric']}>
                            <span>Last seen:</span>
                            <span>{new Date(peer.lastSeenAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        </Modal>
      </Show>
    </div>
  );
};
