/**
 * NetworkHealthDashboard — live metrics from networkStore with rolling history chart.
 */

import { type Component, createMemo, createSignal, For, Show } from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Badge } from '@/components/foundation/Badge';
import {
  useNetworkStore,
  type MetricsHistoryRange,
  type MetricsSparklineKey,
} from '@/stores/network/networkStore';
import { useNetworkPresenceResource } from '@/hooks/network/useNetworkPresence';
import type { NetworkHealthDashboardProps, NetworkIssue } from './types';
import styles from './NetworkHealthDashboard.module.css';

const getConnectionQuality = (peerCount: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (peerCount >= 20) return 'excellent';
  if (peerCount >= 10) return 'good';
  if (peerCount >= 5) return 'fair';
  return 'poor';
};

const getQualityBadgeVariant = (quality: string) => {
  switch (quality) {
    case 'excellent':
    case 'good':
      return 'success';
    case 'fair':
      return 'warning';
    default:
      return 'error';
  }
};

const formatMbps = (mbps: number): string => `${mbps.toFixed(2)} MB/s`;

export const NetworkHealthDashboard: Component<NetworkHealthDashboardProps> = props => {
  const net = useNetworkStore();
  const { presence, isBootstrapping } = useNetworkPresenceResource();
  const [chartSeries, setChartSeries] = createSignal<MetricsSparklineKey>('peers');

  const timeRange = (): MetricsHistoryRange => props.timeRange ?? '1h';

  const connectedPeers = () => net.connectedPeers();
  const connectionQuality = () => getConnectionQuality(connectedPeers());
  const downloadMbps = () => net.downloadMbpsNumber();
  const uploadMbps = () => net.uploadMbpsNumber();
  const activeDownloads = () => net.activeDownloads();
  const activeSeeding = () => net.activeSeeding();

  const currentIssues = createMemo((): NetworkIssue[] => {
    net.lastSyncAt();
    const peers = connectedPeers();
    const issues: NetworkIssue[] = [];

    if (peers < 1 && net.onionShareRunning()) {
      issues.push({
        id: 'low-peers',
        type: 'connection',
        severity: 'medium',
        title: 'No tracker peers in cache',
        description: 'Lobby sync may be pending or the tracker is unreachable.',
        timestamp: Date.now(),
        resolved: false,
        recommendations: [
          'Check Configurations → Advanced → Refresh lobby',
          'Verify tracker URL in Configurations',
        ],
      });
    }

    if (!net.onionShareRunning()) {
      issues.push({
        id: 'onion-stopped',
        type: 'connection',
        severity: 'low',
        title: 'Onion share not running',
        description: 'Start onion share from Sharing & Downloads to join the network.',
        timestamp: Date.now(),
        resolved: false,
        recommendations: ['Open Sharing & Downloads and start onion share'],
      });
    }

    return issues;
  });

  const chartHistory = createMemo(() => {
    net.metricsHistory();
    return net.historyForRange(timeRange());
  });

  const chartBars = createMemo(() => {
    const series = chartSeries();
    const points = chartHistory();
    if (points.length === 0) return [];

    const values = points.map(p => {
      switch (series) {
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
    const max = Math.max(...values, 0.001);
    return values.map(v => Math.round((v / max) * 100));
  });

  const seriesLabel = () => {
    switch (chartSeries()) {
      case 'peers':
        return 'Peers';
      case 'downloadMbps':
        return 'Download Mbps';
      case 'activeDownloads':
        return 'Active downloads';
      default:
        return '';
    }
  };

  return (
    <div class={`${styles.dashboard} ${props.class || ''}`}>
      <div class={styles.dashboardHeader}>
        <h2 class={styles.title}>Network Health Dashboard</h2>
        <div class={styles.headerActions}>
          <Badge
            variant={isBootstrapping() ? 'warning' : connectedPeers() > 0 ? 'success' : 'error'}
            class={styles.statusBadge}
          >
            {isBootstrapping()
              ? `Connecting ${presence().bootstrapPercent > 0 ? `${presence().bootstrapPercent}%` : '…'}`
              : net.onionShareRunning()
                ? 'Onion running'
                : 'Onion stopped'}
          </Badge>
          <Button
            onClick={() => void net.refresh()}
            variant="secondary"
            size="sm"
            class={styles.refreshButton}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div class={styles.overviewGrid}>
        <Card class={styles.metricCard}>
          <div class={styles.metricHeader}>
            <h4>Connected Peers</h4>
            <Badge
              variant={getQualityBadgeVariant(connectionQuality())}
              class={styles.qualityBadge}
            >
              {connectionQuality()}
            </Badge>
          </div>
          <div class={styles.metricValue}>{connectedPeers()}</div>
        </Card>

        <Card class={styles.metricCard}>
          <div class={styles.metricHeader}>
            <h4>Download Rate</h4>
          </div>
          <div class={styles.metricValue}>{formatMbps(downloadMbps())}</div>
        </Card>

        <Card class={styles.metricCard}>
          <div class={styles.metricHeader}>
            <h4>Upload Rate</h4>
          </div>
          <div class={styles.metricValue}>{formatMbps(uploadMbps())}</div>
        </Card>

        <Card class={styles.metricCard}>
          <div class={styles.metricHeader}>
            <h4>Active Transfers</h4>
          </div>
          <div class={styles.metricValue}>
            {activeDownloads()}
            <span class={styles.metricSubtext}> downloads</span>
          </div>
        </Card>

        <Card class={styles.metricCard}>
          <div class={styles.metricHeader}>
            <h4>Seeding / Discovery</h4>
          </div>
          <div class={styles.metricValue}>
            {activeSeeding()}
            <span class={styles.metricSubtext}> / {net.activeDiscovery()} files</span>
          </div>
        </Card>
      </div>

      <div style={{ 'margin-top': '1rem', width: '100%' }}>
        <Card class={styles.resourceCard}>
          <div class={styles.metricHeader}>
            <h4 class={styles.resourceTitle}>Performance over time ({timeRange()})</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <For each={['peers', 'downloadMbps', 'activeDownloads'] as const}>
                {key => (
                  <Button
                    variant={chartSeries() === key ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setChartSeries(key)}
                  >
                    {key === 'peers' ? 'Peers' : key === 'downloadMbps' ? 'Download' : 'Transfers'}
                  </Button>
                )}
              </For>
            </div>
          </div>
          <p style={{ opacity: 0.75, 'font-size': '0.875rem', margin: '0.5rem 0' }}>
            {seriesLabel()} — sampled every ~3s while this page is open
          </p>
          <Show
            when={chartBars().length > 0}
            fallback={
              <p style={{ opacity: 0.7 }}>Collecting samples… leave this page open briefly.</p>
            }
          >
            <div
              style={{
                display: 'flex',
                'align-items': 'flex-end',
                gap: '2px',
                height: '120px',
                'margin-top': '0.75rem',
              }}
            >
              <For each={chartBars()}>
                {height => (
                  <div
                    style={{
                      flex: '1',
                      'min-width': '3px',
                      height: `${height}%`,
                      background: 'var(--color-primary, #3b82f6)',
                      'border-radius': '2px 2px 0 0',
                      opacity: '0.85',
                    }}
                  />
                )}
              </For>
            </div>
          </Show>
        </Card>
      </div>

      <Show when={currentIssues().length > 0}>
        <Card class={styles.issuesCard}>
          <h4 class={styles.sectionTitle}>Current Issues</h4>
          <div class={styles.issuesList}>
            <For each={currentIssues()}>
              {issue => (
                <div class={`${styles.issueItem} ${styles[`severity-${issue.severity}`]}`}>
                  <div class={styles.issueHeader}>
                    <h5 class={styles.issueTitle}>{issue.title}</h5>
                    <Badge
                      variant={issue.severity === 'medium' ? 'warning' : 'secondary'}
                      class={styles.severityBadge}
                    >
                      {issue.severity}
                    </Badge>
                  </div>
                  <p class={styles.issueDescription}>{issue.description}</p>
                  <div class={styles.issueRecommendations}>
                    <h6>Recommendations:</h6>
                    <ul class={styles.recommendationsList}>
                      <For each={issue.recommendations}>
                        {recommendation => (
                          <li class={styles.recommendationItem}>{recommendation}</li>
                        )}
                      </For>
                    </ul>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Card>
      </Show>
    </div>
  );
};
