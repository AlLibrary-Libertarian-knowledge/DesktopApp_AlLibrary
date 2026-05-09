/**
 * NetworkHealthDashboard Component - Comprehensive P2P Network Monitoring
 *
 * Real-time dashboard for monitoring P2P network health.
 */

import {
  type Component,
  createSignal,
  createResource,
  createEffect,
  onMount,
  onCleanup,
  Show,
  For,
} from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Badge } from '@/components/foundation/Badge';
import { Progress } from '@/components/foundation/Progress';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';
import type {
  NetworkHealthDashboardProps,
  NetworkHealthMetrics,
  NetworkIssue,
  DashboardConfig,
  NetworkPerformanceHistory,
} from './types';
import styles from './NetworkHealthDashboard.module.css';

/**
 * NetworkHealthDashboard Component
 *
 * Dashboard for P2P network health monitoring
 */
export const NetworkHealthDashboard: Component<NetworkHealthDashboardProps> = props => {
  // State management
  const [isLoading, setIsLoading] = createSignal(true);
  const [refreshInterval, setRefreshInterval] = createSignal<number | null>(null);
  const [performanceHistory, setPerformanceHistory] = createSignal<NetworkPerformanceHistory[]>([]);
  const [currentIssues, setCurrentIssues] = createSignal<NetworkIssue[]>([]);

  // Default configuration
  const defaultConfig: DashboardConfig = {
    refreshInterval: 5000, // 5 seconds
    alertThresholds: {
      minPeers: 3,
      maxLatency: 1000,
      minStability: 0.8,
    },
    displayPreferences: {
      chartType: 'line',
      timeRange: '1h',
      detailLevel: 'detailed',
    },
  };

  const config = () => ({ ...defaultConfig, ...props.config });

  // Network health metrics resource
  const [networkMetrics, { refetch: refetchNetworkMetrics }] = createResource(
    () => props.enableRealTimeUpdates !== false,
    async (): Promise<NetworkHealthMetrics> => {
      try {
        const rawMetrics = (await p2pNetworkService.getNetworkMetrics()) || ({} as any);
        const nodeStatus = (await p2pNetworkService.getNodeStatus()) || ({} as any);

        const perf = rawMetrics.performance || {
          averageLatency: 0,
          totalBandwidth: 0,
          errorRate: 0,
        };
        const health = rawMetrics.health || {
          nodeUptime: 0,
          connectionStability: 0,
          contentAvailability: 0,
        };
        return {
          // Connection Health
          connectedPeers: Number(nodeStatus.connectedPeers || 0),
          maxPeers: 100, // From config
          connectionQuality: getConnectionQuality(Number(nodeStatus.connectedPeers || 0)),
          averageLatency: Number(perf.averageLatency || 0),
          bandwidthUsage: {
            upload: Number(perf.totalBandwidth || 0) * 0.4, // Estimate upload as 40%
            download: Number(perf.totalBandwidth || 0) * 0.6, // Estimate download as 60%
            total: Number(perf.totalBandwidth || 0),
          },

          // Network Stability
          uptime: Number(health.nodeUptime || 0),
          disconnectionEvents: Number(perf.errorRate || 0) * 100, // Convert error rate to events
          reconnectionRate: Number(health.connectionStability || 0),
          networkStability: Number(health.connectionStability || 0),

          // Content Distribution
          contentShared: Number(nodeStatus.contentStats?.totalShared || 0),
          contentReceived: Number(nodeStatus.contentStats?.totalReceived || 0),
          replicationFactor: Number(health.contentAvailability || 0),
          storageUsage: {
            used: Number(perf.messagesSent || 0) * 1024, // Estimate storage from messages
            available: 1000000000, // 1GB available (mock)
            total: 1000000000 + Number(perf.messagesSent || 0) * 1024,
          },
        };
      } catch (error) {
        console.error('Failed to fetch network metrics:', error);
        throw error;
      }
    }
  );

  // Helper functions
  const getConnectionQuality = (peerCount: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (peerCount >= 20) return 'excellent';
    if (peerCount >= 10) return 'good';
    if (peerCount >= 5) return 'fair';
    return 'poor';
  };

  const getQualityBadgeVariant = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'success';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Real-time updates
  createEffect(() => {
    if (props.enableRealTimeUpdates !== false) {
      const interval = setInterval(() => {
        refetchNetworkMetrics();
      }, config().refreshInterval);

      setRefreshInterval(interval);

      onCleanup(() => {
        if (interval) clearInterval(interval);
      });
    }
  });

  // Update performance history
  createEffect(() => {
    const metrics = networkMetrics();
    if (metrics) {
      const historyPoint: NetworkPerformanceHistory = {
        timestamp: Date.now(),
        metrics: {
          peerCount: metrics.connectedPeers,
          latency: metrics.averageLatency,
          bandwidth: metrics.bandwidthUsage.total,
          stability: metrics.networkStability,
        },
      };

      setPerformanceHistory(prev => {
        const updated = [...prev, historyPoint];
        // Keep only last 100 points
        return updated.slice(-100);
      });

      // Trigger callbacks
      if (props.onMetricsUpdate) {
        props.onMetricsUpdate(metrics);
      }
    }
  });

  // Monitor for issues
  createEffect(() => {
    const metrics = networkMetrics();
    if (metrics) {
      const issues: NetworkIssue[] = [];

      // Check thresholds
      if (metrics.connectedPeers < config().alertThresholds.minPeers) {
        issues.push({
          id: 'low-peers',
          type: 'connection',
          severity: 'medium',
          title: 'Low Peer Count',
          description: `Only ${metrics.connectedPeers} peers connected (minimum: ${config().alertThresholds.minPeers})`,
          timestamp: Date.now(),
          resolved: false,
          recommendations: [
            'Check network connectivity',
            'Verify firewall settings',
            'Enable TOR for more peer discovery',
          ],
        });
      }

      if (metrics.averageLatency > config().alertThresholds.maxLatency) {
        issues.push({
          id: 'high-latency',
          type: 'performance',
          severity: 'medium',
          title: 'High Network Latency',
          description: `Average latency is ${metrics.averageLatency}ms (maximum: ${config().alertThresholds.maxLatency}ms)`,
          timestamp: Date.now(),
          resolved: false,
          recommendations: [
            'Check internet connection quality',
            'Consider using TOR for alternative routes',
            'Optimize network configuration',
          ],
        });
      }

      setCurrentIssues(issues);

      // Trigger issue callbacks
      issues.forEach(issue => {
        if (props.onIssueDetected) {
          props.onIssueDetected(issue);
        }
      });
    }
  });

  onMount(() => {
    setIsLoading(false);
  });

  return (
    <div class={`${styles.dashboard} ${props.class || ''}`}>
      {/* Dashboard Header */}
      <div class={styles.dashboardHeader}>
        <h2 class={styles.title}>Network Health Dashboard</h2>
        <div class={styles.headerActions}>
          <Badge
            variant={(networkMetrics()?.connectedPeers ?? 0) > 0 ? 'success' : 'error'}
            class={styles.statusBadge}
          >
            {(networkMetrics()?.connectedPeers ?? 0) > 0 ? 'Online' : 'Offline'}
          </Badge>
          <Button
            onClick={() => {
              refetchNetworkMetrics();
            }}
            variant="secondary"
            size="sm"
            class={styles.refreshButton}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Network Overview */}
      <div class={styles.overviewGrid}>
        <Card class={styles.metricCard}>
          <div class={styles.metricHeader}>
            <h4>Connected Peers</h4>
            <Badge
              variant={getQualityBadgeVariant(networkMetrics()?.connectionQuality || 'poor')}
              class={styles.qualityBadge}
            >
              {networkMetrics()?.connectionQuality || 'Unknown'}
            </Badge>
          </div>
          <div class={styles.metricValue}>
            {networkMetrics()?.connectedPeers || 0}
            <span class={styles.metricSubtext}>/ {networkMetrics()?.maxPeers || 100} max</span>
          </div>
        </Card>

        <Card class={styles.metricCard}>
          <div class={styles.metricHeader}>
            <h4>Network Latency</h4>
          </div>
          <div class={styles.metricValue}>
            {networkMetrics()?.averageLatency || 0}
            <span class={styles.metricSubtext}>ms</span>
          </div>
        </Card>

        <Card class={styles.metricCard}>
          <div class={styles.metricHeader}>
            <h4>Uptime</h4>
          </div>
          <div class={styles.metricValue}>{formatUptime(networkMetrics()?.uptime || 0)}</div>
        </Card>

        <Card class={styles.metricCard}>
          <div class={styles.metricHeader}>
            <h4>Network Stability</h4>
          </div>
          <div class={styles.metricValue}>
            {Math.round((networkMetrics()?.networkStability || 0) * 100)}%
          </div>
          <Progress
            value={(networkMetrics()?.networkStability || 0) * 100}
            class={styles.stabilityProgress}
          />
        </Card>
      </div>

      {/* Bandwidth and Storage */}
      <div class={styles.resourcesGrid}>
        <Card class={styles.resourceCard}>
          <h4 class={styles.resourceTitle}>Bandwidth Usage</h4>
          <div class={styles.bandwidthStats}>
            <div class={styles.bandwidthItem}>
              <span class={styles.bandwidthLabel}>Upload:</span>
              <span class={styles.bandwidthValue}>
                {formatBytes(networkMetrics()?.bandwidthUsage.upload || 0)}/s
              </span>
            </div>
            <div class={styles.bandwidthItem}>
              <span class={styles.bandwidthLabel}>Download:</span>
              <span class={styles.bandwidthValue}>
                {formatBytes(networkMetrics()?.bandwidthUsage.download || 0)}/s
              </span>
            </div>
            <div class={styles.bandwidthItem}>
              <span class={styles.bandwidthLabel}>Total:</span>
              <span class={styles.bandwidthValue}>
                {formatBytes(networkMetrics()?.bandwidthUsage.total || 0)}/s
              </span>
            </div>
          </div>
        </Card>

        <Card class={styles.resourceCard}>
          <h4 class={styles.resourceTitle}>Storage Usage</h4>
          <div class={styles.storageStats}>
            <Progress
              value={
                networkMetrics()?.storageUsage.total
                  ? (networkMetrics()!.storageUsage.used / networkMetrics()!.storageUsage.total) *
                    100
                  : 0
              }
              class={styles.storageProgress}
            />
            <div class={styles.storageDetails}>
              <span class={styles.storageLabel}>
                {formatBytes(networkMetrics()?.storageUsage.used || 0)} used
              </span>
              <span class={styles.storageLabel}>
                {formatBytes(networkMetrics()?.storageUsage.available || 0)} available
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Current Issues */}
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
                      variant={
                        issue.severity === 'critical'
                          ? 'error'
                          : issue.severity === 'high'
                            ? 'error'
                            : issue.severity === 'medium'
                              ? 'warning'
                              : 'secondary'
                      }
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
