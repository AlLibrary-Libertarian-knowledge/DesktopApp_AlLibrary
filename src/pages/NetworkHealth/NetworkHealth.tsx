/**
 * NetworkHealth Page - Advanced P2P Network Health Monitoring
 *
 * Futuristic network monitoring dashboard with real-time analytics,
 * interactive diagnostics, and comprehensive health visualization
 */

import { Component, createSignal, createEffect, onMount, onCleanup, For, Show } from 'solid-js';
import { Button, Card, Modal } from '@/components/foundation';
import { NetworkHealthDashboard } from '@/components/composite/NetworkHealthDashboard';
import {
  RefreshCw,
  Activity,
  Shield,
  Globe,
  CheckCircle,
  Clock,
  Network,
  Server,
  Terminal,
  Layers,
  BarChart3,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Wifi,
  Zap,
  AlertTriangle,
  Users,
  TrendingUp,
} from 'lucide-solid';
import styles from './NetworkHealth.module.css';
import { useNetworkStore } from '@/stores/network/networkStore';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';

interface NetworkNode {
  id: string;
  ip: string;
  location: string;
  latency: number;
  status: 'online' | 'offline' | 'warning';
  bandwidth: number;
  uptime: number;
  country: string;
}

interface NetworkMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

interface SecurityAlert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export const NetworkHealth: Component = () => {
  // Core state
  const [refreshing, setRefreshing] = createSignal(false);
  const [monitoring, setMonitoring] = createSignal(true);
  const [autoRefresh, setAutoRefresh] = createSignal(true);
  const [refreshInterval, setRefreshInterval] = createSignal(5000);

  // Advanced monitoring state
  const [selectedMetric, setSelectedMetric] = createSignal<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = createSignal(false);
  const [showTerminal, setShowTerminal] = createSignal(false);
  // const [showSecurityPanel, setShowSecurityPanel] = createSignal(false);

  // Visualization controls
  const [viewMode, setViewMode] = createSignal<'overview' | 'detailed' | 'topology'>('overview');
  const [timeRange, setTimeRange] = createSignal<'1h' | '6h' | '24h' | '7d'>('1h');

  // Live network data (peers)
  const [networkNodes, setNetworkNodes] = createSignal<NetworkNode[]>([]);

  // Live high-level metrics
  const [networkMetrics, setNetworkMetrics] = createSignal<NetworkMetric[]>([]);

  const [securityAlerts, setSecurityAlerts] = createSignal<SecurityAlert[]>([]);

  let refreshTimer: number;
  const net = useNetworkStore();

  // Pull live P2P status and metrics, and map into page state
  const updateFromLive = async () => {
    try {
      await net.refresh();
      const status = net.status();
      const metrics = net.metrics() as any;
      const peers = await p2pNetworkService.getConnectedPeers().catch(() => [] as any[]);

      // Map peers to nodes
      const nodes: NetworkNode[] = (peers || []).map((p: any, i: number) => ({
        id: p.id || `peer-${i}`,
        ip: (p.addresses?.[0]?.multiaddr || p.addresses?.[0]?.address || 'unknown'),
        location: p.location || '—',
        latency: Number(p.connectionQuality?.latency || metrics?.performance?.averageLatency || 0),
        status: (p.connected ? 'online' : 'offline') as any,
        bandwidth: Number(p.connectionQuality?.bandwidth || metrics?.performance?.totalBandwidth || 0) / (1024 * 1024),
        uptime: Number(metrics?.health?.nodeUptime || 0),
        country: p.country || '—',
      }));
      setNetworkNodes(nodes);

      const healthPct = (() => {
        const h = status?.networkHealth;
        if (typeof h === 'number' && h > 0 && h <= 1) return Math.round(h * 100);
        return Number(h || 0);
      })();

      const dl = (() => {
        if (metrics?.performance?.totalBandwidth != null) return (metrics.performance.totalBandwidth * 0.6) / (1024 * 1024);
        if (typeof metrics?.download_rate === 'number') return metrics.download_rate / (1024 * 1024);
        return 0;
      })();
      const ul = (() => {
        if (metrics?.performance?.totalBandwidth != null) return (metrics.performance.totalBandwidth * 0.4) / (1024 * 1024);
        if (typeof metrics?.upload_rate === 'number') return metrics.upload_rate / (1024 * 1024);
        return 0;
      })();
      const avgLat = Number(metrics?.performance?.averageLatency || 0);

      // Build cards
      const cards: NetworkMetric[] = [
        { id: 'network-health', name: 'Network Health', value: healthPct, unit: '%', status: healthPct > 80 ? 'good' : healthPct > 60 ? 'warning' : 'critical', trend: 'stable', history: [] },
        { id: 'active-peers', name: 'Active Peers', value: Number(status?.connectedPeers || 0), unit: 'peers', status: 'good', trend: 'stable', history: [] },
        { id: 'throughput', name: 'Data Throughput', value: Math.round((dl + ul) * 10) / 10, unit: 'MB/s', status: 'good', trend: 'stable', history: [] },
        { id: 'latency', name: 'Average Latency', value: avgLat, unit: 'ms', status: avgLat < 100 ? 'good' : avgLat < 200 ? 'warning' : 'critical', trend: 'stable', history: [] },
      ];
      const uptime = Number((metrics as any)?.health?.nodeUptime || 0);
      if (uptime) cards.push({ id: 'uptime', name: 'Network Uptime', value: Math.round(uptime), unit: '%', status: 'good', trend: 'stable', history: [] });
      setNetworkMetrics(cards);

      // Security alerts
      const errRate = Number(metrics?.performance?.errorRate || 0);
      const alerts: SecurityAlert[] = [];
      if (avgLat > 200) alerts.push({ id: 'latency', type: 'warning', message: 'High average latency detected', timestamp: new Date(), resolved: false });
      if (errRate > 0.05) alerts.push({ id: 'errors', type: 'critical', message: 'Elevated network error rate', timestamp: new Date(), resolved: false });
      setSecurityAlerts(alerts);
    } catch {
      // keep previous state on failure
    }
  };

  createEffect(() => {
    if (autoRefresh() && monitoring()) {
      // Solid types for timer
      refreshTimer = globalThis.setInterval(() => { void updateFromLive(); }, refreshInterval()) as unknown as number;
    }
    onCleanup(() => { if (refreshTimer) globalThis.clearInterval(refreshTimer as unknown as number); });
  });

  onMount(() => { void updateFromLive(); });

  const handleRefresh = async () => { setRefreshing(true); await updateFromLive(); setRefreshing(false); };

  // Terminal omitted in this trimmed version

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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} />;
      case 'down':
        return <TrendingUp size={14} style="transform: rotate(180deg)" />;
      default:
        return <Activity size={14} />;
    }
  };

  return (
    <div class={styles['network-health-page']}>
      {/* Enhanced Futuristic Header */}
      <header class={`${styles['page-header']} ${styles.enhanced}`}>
        <div class={styles['header-content']}>
          <div class={styles['title-section']}>
            <h1 class={styles['page-title']}>
              <Network size={32} class={(styles['title-icon'] as string) ?? ''} />
              Network Health Monitor
            </h1>
            <p class={styles['page-subtitle']}>
              Advanced P2P network diagnostics and real-time health monitoring
            </p>
          </div>

          <div class={styles['monitoring-controls']}>
            <div class={styles['monitoring-status']}>
              <div
                class={`${styles['status-indicator']} ${monitoring() ? styles.active : styles.inactive}`}
              >
                <div class={styles['status-pulse']}></div>
              </div>
              <span class={styles['status-text']}>
                {monitoring() ? 'Live Monitoring' : 'Monitoring Paused'}
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

        {/* Advanced Network Visualization */}
        <div class={styles['network-visualization']}>
          <div class={styles['network-grid']}>
            <div class={styles['grid-lines']}></div>

            <div class={styles['network-topology']}>
              <div class={styles['central-node']}>
                <div class={styles['node-core']}>
                  <Server size={24} />
                </div>
                <div class={styles['node-rings']}>
                  <div class={styles['ring-1']}></div>
                  <div class={styles['ring-2']}></div>
                  <div class={styles['ring-3']}></div>
                </div>
              </div>

              <For each={networkNodes()}>
                {(node, index) => (
                  <div
                    class={`${styles['peer-node']} ${styles[node.status]}`}
                    style={{
                      '--node-index': index(),
                      '--node-delay': `${index() * 0.5}s`,
                    }}
                    onClick={() => setSelectedMetric(node.id)}
                  >
                    <div class={styles['peer-indicator']}>
                      <Globe size={12} />
                    </div>
                    <div class={styles['peer-pulse']}></div>
                    <div class={styles['connection-line']}></div>
                  </div>
                )}
              </For>
            </div>

            <div class={styles['data-streams']}>
              <div class={styles['upload-stream']}>
                <div class={styles['stream-particles']}></div>
              </div>
              <div class={styles['download-stream']}>
                <div class={styles['stream-particles']}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div class={styles['header-actions']}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDiagnostics(true)}
            class={styles['action-button'] as string}
          >
            <Activity size={16} />
            Diagnostics
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDiagnostics(true)}
            class={styles['action-button'] as string}
          >
            <MapPin size={16} />
            Network Map
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDiagnostics(true)}
            class={styles['action-button'] as string}
          >
            <Shield size={16} />
            Security
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTerminal(true)}
            class={styles['action-button'] as string}
          >
            <Terminal size={16} />
            Terminal
          </Button>
        </div>
      </header>

      {/* Enhanced Control Panel */}
      <div class={styles['control-panel']}>
        <div class={styles['view-controls']}>
          <div class={styles['view-selector']}>
            <button
              class={`${styles['view-option']} ${viewMode() === 'overview' ? styles.active : ''}`}
              onClick={() => setViewMode('overview')}
            >
              <BarChart3 size={16} />
              Overview
            </button>
            <button
              class={`${styles['view-option']} ${viewMode() === 'detailed' ? styles.active : ''}`}
              onClick={() => setViewMode('detailed')}
            >
              <Layers size={16} />
              Detailed
            </button>
            <button
              class={`${styles['view-option']} ${viewMode() === 'topology' ? styles.active : ''}`}
              onClick={() => setViewMode('topology')}
            >
              <Network size={16} />
              Topology
            </button>
          </div>

          <div class={styles['time-range-selector']}>
            <For each={['1h', '6h', '24h', '7d'] as const}>
              {range => (
                <button
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
            class={`${styles['auto-refresh']} ${autoRefresh() ? styles.active : ''}` as string}
          >
            <RotateCcw size={14} />
            Auto-refresh
          </Button>

          <select
            class={styles['refresh-interval']}
            value={refreshInterval()}
            onChange={e => setRefreshInterval(Number(e.currentTarget.value))}
          >
            <option value={1000}>1s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div class={styles['main-content']}>
        {/* Metrics Grid */}
        <div class={styles['metrics-grid']}>
          <For each={networkMetrics()}>
            {metric => (
              <Card
                class={`${styles['metric-card']} ${selectedMetric() === metric.id ? styles.selected : ''}`}
                onClick={() => setSelectedMetric(selectedMetric() === metric.id ? null : metric.id)}
              >
                <div class={styles['metric-header']}>
                  <div class={styles['metric-icon']}>
                    {metric.id === 'network-health' && <Activity size={20} />}
                    {metric.id === 'active-peers' && <Users size={20} />}
                    {metric.id === 'throughput' && <Zap size={20} />}
                    {metric.id === 'latency' && <Clock size={20} />}
                    {metric.id === 'security' && <Shield size={20} />}
                    {metric.id === 'uptime' && <CheckCircle size={20} />}
                  </div>
                  <div class={styles['metric-trend']}>{getTrendIcon(metric.trend)}</div>
                </div>

                <div class={styles['metric-content']}>
                  <div class={styles['metric-value']}>
                    {metric.value}
                    <span class={styles['metric-unit']}>{metric.unit}</span>
                  </div>
                  <div class={styles['metric-name']}>{metric.name}</div>
                </div>

                <div class={styles['metric-chart']}>
                  <div class={styles['chart-container']}>
                    <For each={metric.history}>
                      {(value, index) => (
                        <div
                          class={styles['chart-bar']}
                          style={{
                            height: `${(value / Math.max(...metric.history)) * 100}%`,
                            'animation-delay': `${index() * 0.1}s`,
                          }}
                        />
                      )}
                    </For>
                  </div>
                </div>

                <div
                  class={styles['metric-status']}
                  style={{ color: getMetricStatusColor(metric.status) }}
                >
                  <div class={styles['status-dot']}></div>
                  {metric.status}
                </div>
              </Card>
            )}
          </For>
        </div>

        {/* Dashboard Container */}
        <div class={styles['dashboard-container']}>
          <NetworkHealthDashboard
            enableRealTimeUpdates={monitoring()}
            culturalContextEnabled={true}
            antiCensorshipMonitoring={true}
            showDetailedMetrics={viewMode() === 'detailed'}
          />
        </div>

        {/* Security Alerts Panel */}
        <Show when={securityAlerts().filter(a => !a.resolved).length > 0}>
          <div class={styles['alerts-panel']}>
            <div class={styles['alerts-header']}>
              <AlertTriangle size={20} />
              <span>Security Alerts</span>
              <Button variant="ghost" size="sm" onClick={() => setShowDiagnostics(true)}>
                View All
              </Button>
            </div>
            <div class={styles['alerts-list']}>
              <For each={securityAlerts().filter(a => !a.resolved).slice(0, 3)}>
                {alert => (
                  <div class={`${styles['alert-item']} ${styles[alert.type]}`}>
                    <div class={styles['alert-icon']}>
                      <AlertTriangle size={16} />
                    </div>
                    <div class={styles['alert-content']}>
                      <div class={styles['alert-message']}>{alert.message}</div>
                      <div class={styles['alert-time']}>
                        {Math.round((Date.now() - alert.timestamp.getTime()) / 60000)}m ago
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>

      {/* Diagnostics Modal */}
      <Show when={showDiagnostics()}>
        <Modal
          isOpen={showDiagnostics()}
          onClose={() => setShowDiagnostics(false)}
          title="Network Diagnostics"
          size="xl"
          class={styles['diagnostics-modal'] as string}
        >
          <div class={styles['diagnostics-content']}>
            <div class={styles['diagnostic-tools']}>
              <Button variant="ghost" onClick={() => { /* run latency test */ }}>
                <Clock size={16} />
                Latency Test
              </Button>
              <Button variant="ghost" onClick={() => { /* run bandwidth test */ }}>
                <Zap size={16} />
                Bandwidth Test
              </Button>
              <Button variant="ghost" onClick={() => { /* run connectivity test */ }}>
                <Wifi size={16} />
                Connectivity Test
              </Button>
              <Button variant="ghost" onClick={() => { /* run security scan */ }}>
                <Shield size={16} />
                Security Scan
              </Button>
            </div>

            <div class={styles['diagnostic-results']}>
              <h4>Network Analysis</h4>
              <div class={styles['results-grid']}>
                <For each={networkNodes()}>
                  {node => (
                    <div class={styles['node-diagnostic']}>
                      <div class={styles['node-info']}>
                        <strong>{node.location}</strong>
                        <span>{node.ip}</span>
                      </div>
                      <div class={styles['node-metrics']}>
                        <div class={styles['diagnostic-metric']}>
                          <span>Latency:</span>
                          <span>{node.latency}ms</span>
                        </div>
                        <div class={styles['diagnostic-metric']}>
                          <span>Bandwidth:</span>
                          <span>{node.bandwidth.toFixed(1)} MB/s</span>
                        </div>
                        <div class={styles['diagnostic-metric']}>
                          <span>Uptime:</span>
                          <span>{node.uptime}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        </Modal>
      </Show>

      {/* Terminal Modal */}
      <Show when={showTerminal()}>
        <Modal
          isOpen={showTerminal()}
          onClose={() => setShowTerminal(false)}
          title="Network Terminal"
          size="lg"
          class={styles['terminal-modal'] as string}
        >
          <div class={styles['terminal-content']}>
            {/* terminal UI omitted for brevity */}
          </div>
        </Modal>
      </Show>
    </div>
  );
};
