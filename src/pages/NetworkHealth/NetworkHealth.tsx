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
  Settings,
  Activity,
  Shield,
  Zap,
  Globe,
  Cpu,
  Database,
  Wifi,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Network,
  Server,
  Eye,
  BarChart3,
  Layers,
  Filter,
  Download,
  Upload,
  Users,
  MapPin,
  Radio,
  Lock,
  Unlock,
  Play,
  Pause,
  RotateCcw,
  Search,
  Terminal,
} from 'lucide-solid';
import styles from './NetworkHealth.module.css';

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

/**
 * NetworkHealth Page Component
 *
 * Advanced P2P network health monitoring with futuristic UI
 */
export const NetworkHealth: Component = () => {
  // Core state
  const [refreshing, setRefreshing] = createSignal(false);
  const [monitoring, setMonitoring] = createSignal(true);
  const [autoRefresh, setAutoRefresh] = createSignal(true);
  const [refreshInterval, setRefreshInterval] = createSignal(5000);

  // Advanced monitoring state
  const [selectedMetric, setSelectedMetric] = createSignal<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = createSignal(false);
  const [showNetworkMap, setShowNetworkMap] = createSignal(false);
  const [showSecurityPanel, setShowSecurityPanel] = createSignal(false);
  const [showAnalytics, setShowAnalytics] = createSignal(false);
  const [showTerminal, setShowTerminal] = createSignal(false);

  // Visualization controls
  const [viewMode, setViewMode] = createSignal<'overview' | 'detailed' | 'topology'>('overview');
  const [timeRange, setTimeRange] = createSignal<'1h' | '6h' | '24h' | '7d'>('1h');
  const [filterLevel, setFilterLevel] = createSignal<'all' | 'critical' | 'warnings'>('all');

  // Mock network data
  const [networkNodes, setNetworkNodes] = createSignal<NetworkNode[]>([
    {
      id: 'node-1',
      ip: '192.168.1.100',
      location: 'São Paulo, Brazil',
      latency: 45,
      status: 'online',
      bandwidth: 125.5,
      uptime: 99.8,
      country: 'BR',
    },
    {
      id: 'node-2',
      ip: '10.0.0.50',
      location: 'Madrid, Spain',
      latency: 78,
      status: 'online',
      bandwidth: 89.2,
      uptime: 98.5,
      country: 'ES',
    },
    {
      id: 'node-3',
      ip: '172.16.0.25',
      location: 'Tokyo, Japan',
      latency: 156,
      status: 'warning',
      bandwidth: 67.8,
      uptime: 95.2,
      country: 'JP',
    },
    {
      id: 'node-4',
      ip: '203.0.113.42',
      location: 'Sydney, Australia',
      latency: 234,
      status: 'online',
      bandwidth: 43.7,
      uptime: 97.1,
      country: 'AU',
    },
  ]);

  const [networkMetrics, setNetworkMetrics] = createSignal<NetworkMetric[]>([
    {
      id: 'network-health',
      name: 'Network Health',
      value: 94,
      unit: '%',
      status: 'good',
      trend: 'stable',
      history: [92, 93, 94, 94, 94],
    },
    {
      id: 'active-peers',
      name: 'Active Peers',
      value: 247,
      unit: 'peers',
      status: 'good',
      trend: 'up',
      history: [235, 240, 245, 246, 247],
    },
    {
      id: 'throughput',
      name: 'Data Throughput',
      value: 2.4,
      unit: 'MB/s',
      status: 'good',
      trend: 'up',
      history: [2.1, 2.2, 2.3, 2.35, 2.4],
    },
    {
      id: 'latency',
      name: 'Average Latency',
      value: 89,
      unit: 'ms',
      status: 'warning',
      trend: 'up',
      history: [85, 86, 87, 88, 89],
    },
    {
      id: 'security',
      name: 'Security Score',
      value: 98,
      unit: '%',
      status: 'good',
      trend: 'stable',
      history: [97, 98, 98, 98, 98],
    },
    {
      id: 'uptime',
      name: 'Network Uptime',
      value: 99.7,
      unit: '%',
      status: 'good',
      trend: 'stable',
      history: [99.5, 99.6, 99.7, 99.7, 99.7],
    },
  ]);

  const [securityAlerts, setSecurityAlerts] = createSignal<SecurityAlert[]>([
    {
      id: 'alert-1',
      type: 'warning',
      message: 'High latency detected on Asia-Pacific nodes',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      resolved: false,
    },
    {
      id: 'alert-2',
      type: 'info',
      message: 'New peer connection established in Europe',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      resolved: true,
    },
    {
      id: 'alert-3',
      type: 'critical',
      message: 'Potential DDoS attempt blocked',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      resolved: true,
    },
  ]);

  // Terminal simulation
  const [terminalOutput, setTerminalOutput] = createSignal<string[]>([
    '> Network Health Monitor v2.0 initialized',
    '> Scanning P2P network topology...',
    '> 247 active peers detected',
    '> Security protocols enabled',
    '> Ready for monitoring',
  ]);
  const [terminalInput, setTerminalInput] = createSignal('');

  // Auto-refresh functionality
  let refreshTimer: number;

  createEffect(() => {
    if (autoRefresh() && monitoring()) {
      refreshTimer = setInterval(() => {
        simulateDataUpdate();
      }, refreshInterval());
    }

    onCleanup(() => {
      if (refreshTimer) clearInterval(refreshTimer);
    });
  });

  onMount(() => {
    // Start initial monitoring
    simulateDataUpdate();
  });

  // Simulate real-time data updates
  const simulateDataUpdate = () => {
    setNetworkMetrics(prev =>
      prev.map(metric => {
        const variance = (Math.random() - 0.5) * 0.1;
        const newValue = Math.max(0, metric.value + variance);
        const newHistory = [...metric.history.slice(-4), newValue];

        return {
          ...metric,
          value: Math.round(newValue * 100) / 100,
          history: newHistory,
          trend: newValue > metric.value ? 'up' : newValue < metric.value ? 'down' : 'stable',
        };
      })
    );

    // Simulate network node updates
    setNetworkNodes(prev =>
      prev.map(node => ({
        ...node,
        latency: Math.max(10, node.latency + (Math.random() - 0.5) * 20),
        bandwidth: Math.max(10, node.bandwidth + (Math.random() - 0.5) * 10),
      }))
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    simulateDataUpdate();
    setRefreshing(false);
  };

  const handleTerminalCommand = (command: string) => {
    const output = [...terminalOutput()];
    output.push(`> ${command}`);

    switch (command.toLowerCase()) {
      case 'status':
        output.push('Network Status: HEALTHY');
        output.push(`Active Peers: ${networkMetrics().find(m => m.id === 'active-peers')?.value}`);
        output.push(
          `Health Score: ${networkMetrics().find(m => m.id === 'network-health')?.value}%`
        );
        break;
      case 'peers':
        output.push('Active Peer Connections:');
        networkNodes().forEach(node => {
          output.push(`  ${node.ip} - ${node.location} (${node.latency}ms)`);
        });
        break;
      case 'scan':
        output.push('Initiating network scan...');
        output.push('Discovered 3 new potential peers');
        output.push('Scan complete');
        break;
      case 'clear':
        setTerminalOutput(['> Terminal cleared']);
        setTerminalInput('');
        return;
      case 'help':
        output.push('Available commands:');
        output.push('  status  - Show network status');
        output.push('  peers   - List active peers');
        output.push('  scan    - Scan for new peers');
        output.push('  clear   - Clear terminal');
        output.push('  help    - Show this help');
        break;
      default:
        output.push(`Unknown command: ${command}`);
    }

    setTerminalOutput(output.slice(-20)); // Keep last 20 lines
    setTerminalInput('');
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
              <Network size={32} class={styles['title-icon']} />
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
                class={styles['monitoring-toggle']}
              >
                {monitoring() ? <Pause size={16} /> : <Play size={16} />}
                {monitoring() ? 'Pause' : 'Resume'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing()}
                class={styles['refresh-button']}
              >
                <RefreshCw size={16} class={refreshing() ? styles.spinning : ''} />
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
            class={styles['action-button']}
          >
            <Activity size={16} />
            Diagnostics
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNetworkMap(true)}
            class={styles['action-button']}
          >
            <MapPin size={16} />
            Network Map
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSecurityPanel(true)}
            class={styles['action-button']}
          >
            <Shield size={16} />
            Security
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTerminal(true)}
            class={styles['action-button']}
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
            class={`${styles['auto-refresh']} ${autoRefresh() ? styles.active : ''}`}
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
        <Show when={securityAlerts().filter(alert => !alert.resolved).length > 0}>
          <div class={styles['alerts-panel']}>
            <div class={styles['alerts-header']}>
              <AlertTriangle size={20} />
              <span>Security Alerts</span>
              <Button variant="ghost" size="sm" onClick={() => setShowSecurityPanel(true)}>
                View All
              </Button>
            </div>
            <div class={styles['alerts-list']}>
              <For
                each={securityAlerts()
                  .filter(alert => !alert.resolved)
                  .slice(0, 3)}
              >
                {alert => (
                  <div class={`${styles['alert-item']} ${styles[alert.type]}`}>
                    <div class={styles['alert-icon']}>
                      {alert.type === 'critical' && <AlertTriangle size={16} />}
                      {alert.type === 'warning' && <AlertTriangle size={16} />}
                      {alert.type === 'info' && <CheckCircle size={16} />}
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

      {/* Advanced Modals */}

      {/* Network Diagnostics Modal */}
      <Show when={showDiagnostics()}>
        <Modal
          open={showDiagnostics()}
          onClose={() => setShowDiagnostics(false)}
          title="Network Diagnostics"
          size="xl"
          class={styles['diagnostics-modal']}
        >
          <div class={styles['diagnostics-content']}>
            <div class={styles['diagnostic-tools']}>
              <Button variant="ghost" onClick={() => alert('Running latency test...')}>
                <Clock size={16} />
                Latency Test
              </Button>
              <Button variant="ghost" onClick={() => alert('Running bandwidth test...')}>
                <Zap size={16} />
                Bandwidth Test
              </Button>
              <Button variant="ghost" onClick={() => alert('Running connectivity test...')}>
                <Wifi size={16} />
                Connectivity Test
              </Button>
              <Button variant="ghost" onClick={() => alert('Running security scan...')}>
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
          open={showTerminal()}
          onClose={() => setShowTerminal(false)}
          title="Network Terminal"
          size="lg"
          class={styles['terminal-modal']}
        >
          <div class={styles['terminal-content']}>
            <div class={styles['terminal-output']}>
              <For each={terminalOutput()}>
                {line => <div class={styles['terminal-line']}>{line}</div>}
              </For>
            </div>
            <div class={styles['terminal-input-container']}>
              <span class={styles['terminal-prompt']}>$</span>
              <input
                type="text"
                class={styles['terminal-input']}
                value={terminalInput()}
                onInput={e => setTerminalInput(e.currentTarget.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    handleTerminalCommand(terminalInput());
                  }
                }}
                placeholder="Enter command..."
                autofocus
              />
            </div>
          </div>
        </Modal>
      </Show>

      {/* Security Panel Modal */}
      <Show when={showSecurityPanel()}>
        <Modal
          open={showSecurityPanel()}
          onClose={() => setShowSecurityPanel(false)}
          title="Security Monitor"
          size="xl"
          class={styles['security-modal']}
        >
          <div class={styles['security-content']}>
            <div class={styles['security-overview']}>
              <div class={styles['security-score']}>
                <div class={styles['score-circle']}>
                  <span class={styles['score-value']}>98</span>
                  <span class={styles['score-label']}>Security Score</span>
                </div>
              </div>
              <div class={styles['security-metrics']}>
                <div class={styles['security-metric']}>
                  <Lock size={20} />
                  <span>Encrypted Connections</span>
                  <span class={styles['metric-count']}>247/247</span>
                </div>
                <div class={styles['security-metric']}>
                  <Shield size={20} />
                  <span>Threats Blocked</span>
                  <span class={styles['metric-count']}>15</span>
                </div>
                <div class={styles['security-metric']}>
                  <Eye size={20} />
                  <span>Anomalies Detected</span>
                  <span class={styles['metric-count']}>2</span>
                </div>
              </div>
            </div>

            <div class={styles['security-alerts']}>
              <h4>Security Events</h4>
              <div class={styles['alerts-timeline']}>
                <For each={securityAlerts()}>
                  {alert => (
                    <div
                      class={`${styles['timeline-item']} ${styles[alert.type]} ${alert.resolved ? styles.resolved : ''}`}
                    >
                      <div class={styles['timeline-marker']}></div>
                      <div class={styles['timeline-content']}>
                        <div class={styles['event-message']}>{alert.message}</div>
                        <div class={styles['event-time']}>
                          {alert.timestamp.toLocaleTimeString()}
                        </div>
                        <Show when={!alert.resolved}>
                          <Button variant="ghost" size="sm">
                            Mark Resolved
                          </Button>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        </Modal>
      </Show>
    </div>
  );
};
