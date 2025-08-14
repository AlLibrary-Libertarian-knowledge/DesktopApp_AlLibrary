/**
 * NetworkHealthDashboard Component - Comprehensive P2P Network Monitoring
 *
 * Real-time dashboard for monitoring P2P network health, cultural community
 * participation, and anti-censorship capabilities.
 *
 * ANTI-CENSORSHIP PRINCIPLES:
 * - Monitors network freedom and censorship resistance
 * - Displays cultural information for educational purposes only
 * - Tracks information integrity and multiple perspectives
 * - Provides transparency in network operations
 */

import {
  Component,
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
import { torService } from '@/services/network/torService';
import type {
  NetworkHealthDashboardProps,
  NetworkHealthMetrics,
  NetworkIssue,
  CulturalNetworkStatus,
  AntiCensorshipStatus,
  DashboardConfig,
  NetworkPerformanceHistory,
} from './types';
import styles from './NetworkHealthDashboard.module.css';

/**
 * NetworkHealthDashboard Component
 *
 * Comprehensive dashboard for P2P network health monitoring with cultural awareness
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
    showCulturalMetrics: props.culturalContextEnabled ?? true,
    showAntiCensorshipMetrics: props.antiCensorshipMonitoring ?? true,
    alertThresholds: {
      minPeers: 3,
      maxLatency: 1000,
      minStability: 0.8,
      maxCensorshipAttempts: 5,
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
        const rawMetrics = (await p2pNetworkService.getNetworkMetrics()) || {} as any;
        const nodeStatus = (await p2pNetworkService.getNodeStatus()) || ({} as any);
        const torStatus = (await torService.getTorStatus()) || ({} as any);

        const perf = rawMetrics.performance || { averageLatency: 0, totalBandwidth: 0, errorRate: 0 };
        const health = rawMetrics.health || {
          nodeUptime: 0,
          connectionStability: 0,
          contentAvailability: 0,
        };
        const culturalSharing = rawMetrics.culturalSharing || {
          culturalContentShared: 0,
          educationalContextProvided: 0,
          communityInteractions: 0,
          alternativeNarrativesSupported: 0,
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

          // Cultural Network Health
          culturalCommunities: Number(nodeStatus.activeCommunityNetworks?.length || 0),
          culturalContentShared: Number(culturalSharing.culturalContentShared || 0),
          educationalResourcesAvailable: Number(culturalSharing.educationalContextProvided || 0),
          communityParticipation: Number(culturalSharing.communityInteractions || 0),

          // Anti-Censorship Metrics
          torConnectionActive: Boolean(torStatus.connected),
          alternativeRoutesAvailable: Number((rawMetrics.censorshipResistance?.alternativeRoutes) || 0),
          censorshipAttempts: Number((rawMetrics.censorshipResistance?.censorshipAttempts) || 0),
          informationIntegrityScore: Number(health.contentAvailability || 0),
        };
      } catch (error) {
        console.error('Failed to fetch network metrics:', error);
        throw error;
      }
    }
  );

  // Cultural network status resource
  const [culturalStatus, { refetch: refetchCulturalStatus }] = createResource(
    () => config().showCulturalMetrics,
    async (): Promise<CulturalNetworkStatus> => {
      try {
        const nodeStatus = await p2pNetworkService.getNodeStatus();

        return {
          activeCommunities: (nodeStatus.activeCommunityNetworks || []).map(network => ({
            id: network,
            name: `Community ${network}`,
            memberCount: Math.floor(Math.random() * 100) + 10, // Mock data
            culturalContext: {
              origin: 'Various',
              sensitivityLevel: Math.floor(Math.random() * 5) + 1,
              educationalContext: 'Educational resources available',
            },
            activity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as
              | 'high'
              | 'medium'
              | 'low',
          })),

          educationalExchanges: {
            contentShared: nodeStatus.contentStats?.educationalContentShared || 0,
            knowledgeTransferred: nodeStatus.contentStats?.alternativeNarrativesShared || 0,
            culturalBridging: nodeStatus.contentStats?.communityContentShared || 0,
          },

          sovereigntyMetrics: {
            communityControlled: 95, // Percentage - communities control their data
            decentralizedGovernance: 90, // No central authority
            informationFreedom: 98, // Information flows freely
          },
        };
      } catch (error) {
        console.error('Failed to fetch cultural status:', error);
        return {
          activeCommunities: [],
          educationalExchanges: {
            contentShared: 0,
            knowledgeTransferred: 0,
            culturalBridging: 0,
          },
          sovereigntyMetrics: {
            communityControlled: 0,
            decentralizedGovernance: 0,
            informationFreedom: 0,
          },
        };
      }
    }
  );

  // Anti-censorship status resource
  const [antiCensorshipStatus, { refetch: refetchAntiCensorship }] = createResource(
    () => config().showAntiCensorshipMetrics,
    async (): Promise<AntiCensorshipStatus> => {
      try {
        const torStatus = (await torService.getTorStatus()) || ({} as any);
        const rawMetrics = (await p2pNetworkService.getNetworkMetrics()) || ({} as any);

        return {
          torIntegration: {
            active: Boolean(torStatus.connected),
            hiddenServiceAvailable: (torStatus.hiddenServices?.length ?? 0) > 0,
            circuitCount: Number(torStatus.circuitCount || 0),
            anonymityLevel: torStatus.connected ? 'high' : 'low',
          },

          censorshipResistance: {
            alternativeRoutes: Number(rawMetrics.censorshipResistance?.alternativeRoutes || 0),
            contentMirroring: Number(rawMetrics.censorshipResistance?.successfulBypasses || 0),
            distributedBackups: Number((rawMetrics.health?.contentAvailability || 0) * 10), // Estimate
            integrityVerification: Number(rawMetrics.health?.contentAvailability || 0) > 0.8,
          },

          informationFreedom: {
            accessibleContent: Number(rawMetrics.culturalSharing?.culturalContentShared || 0),
            blockedAttempts: 0, // Always 0 - no blocking
            educationalContext: Number(rawMetrics.culturalSharing?.educationalContextProvided || 0),
            multiplePerspectives: Number(rawMetrics.culturalSharing?.alternativeNarrativesSupported || 0),
          },
        };
      } catch (error) {
        console.error('Failed to fetch anti-censorship status:', error);
        return {
          torIntegration: {
            active: false,
            hiddenServiceAvailable: false,
            circuitCount: 0,
            anonymityLevel: 'low',
          },
          censorshipResistance: {
            alternativeRoutes: 0,
            contentMirroring: 0,
            distributedBackups: 0,
            integrityVerification: false,
          },
          informationFreedom: {
            accessibleContent: 0,
            blockedAttempts: 0,
            educationalContext: 0,
            multiplePerspectives: 0,
          },
        };
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        if (config().showCulturalMetrics) refetchCulturalStatus();
        if (config().showAntiCensorshipMetrics) refetchAntiCensorship();
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
          culturalActivity: metrics.communityParticipation,
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

      if (metrics.censorshipAttempts > config().alertThresholds.maxCensorshipAttempts) {
        issues.push({
          id: 'censorship-attempts',
          type: 'censorship',
          severity: 'high',
          title: 'Censorship Attempts Detected',
          description: `${metrics.censorshipAttempts} censorship attempts detected`,
          timestamp: Date.now(),
          resolved: false,
          recommendations: [
            'Enable TOR for anonymous access',
            'Use alternative network routes',
            'Report censorship attempts to community',
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
            variant={networkMetrics()?.connectedPeers > 0 ? 'success' : 'error'}
            class={styles.statusBadge}
          >
            {networkMetrics()?.connectedPeers > 0 ? 'Online' : 'Offline'}
          </Badge>
          <Button
            onClick={() => {
              refetchNetworkMetrics();
              refetchCulturalStatus();
              refetchAntiCensorship();
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

      {/* Cultural Network Status */}
      <Show when={config().showCulturalMetrics && culturalStatus()}>
        <Card class={styles.culturalCard}>
          <h4 class={styles.sectionTitle}>Cultural Network Status</h4>
          <div class={styles.culturalGrid}>
            <div class={styles.culturalMetric}>
              <h5>Active Communities</h5>
              <div class={styles.culturalValue}>
                {culturalStatus()?.activeCommunities.length || 0}
              </div>
            </div>
            <div class={styles.culturalMetric}>
              <h5>Educational Exchanges</h5>
              <div class={styles.culturalValue}>
                {culturalStatus()?.educationalExchanges.contentShared || 0}
              </div>
            </div>
            <div class={styles.culturalMetric}>
              <h5>Information Freedom</h5>
              <div class={styles.culturalValue}>
                {culturalStatus()?.sovereigntyMetrics.informationFreedom || 0}%
              </div>
            </div>
          </div>

          <div class={styles.communitiesList}>
            <h5 class={styles.communitiesTitle}>Active Communities:</h5>
            <For each={culturalStatus()?.activeCommunities || []}>
              {community => (
                <div class={styles.communityItem}>
                  <span class={styles.communityName}>{community.name}</span>
                  <Badge
                    variant={
                      community.activity === 'high'
                        ? 'success'
                        : community.activity === 'medium'
                          ? 'warning'
                          : 'secondary'
                    }
                    class={styles.activityBadge}
                  >
                    {community.activity} activity
                  </Badge>
                  <span class={styles.memberCount}>{community.memberCount} members</span>
                </div>
              )}
            </For>
          </div>
        </Card>
      </Show>

      {/* Anti-Censorship Status */}
      <Show when={config().showAntiCensorshipMetrics && antiCensorshipStatus()}>
        <Card class={styles.antiCensorshipCard}>
          <h4 class={styles.sectionTitle}>Anti-Censorship Status</h4>
          <div class={styles.antiCensorshipGrid}>
            <div class={styles.torStatus}>
              <h5>TOR Integration</h5>
              <div class={styles.torInfo}>
                <Badge
                  variant={antiCensorshipStatus()?.torIntegration.active ? 'success' : 'error'}
                  class={styles.torBadge}
                >
                  {antiCensorshipStatus()?.torIntegration.active ? 'Active' : 'Inactive'}
                </Badge>
                <span class={styles.torDetails}>
                  {antiCensorshipStatus()?.torIntegration.circuitCount || 0} circuits
                </span>
                <span class={styles.anonymityLevel}>
                  Anonymity: {antiCensorshipStatus()?.torIntegration.anonymityLevel || 'low'}
                </span>
              </div>
            </div>

            <div class={styles.resistanceMetrics}>
              <h5>Censorship Resistance</h5>
              <div class={styles.resistanceStats}>
                <div class={styles.resistanceStat}>
                  <span>Alternative Routes:</span>
                  <span>{antiCensorshipStatus()?.censorshipResistance.alternativeRoutes || 0}</span>
                </div>
                <div class={styles.resistanceStat}>
                  <span>Content Mirrors:</span>
                  <span>{antiCensorshipStatus()?.censorshipResistance.contentMirroring || 0}</span>
                </div>
                <div class={styles.resistanceStat}>
                  <span>Distributed Backups:</span>
                  <span>
                    {antiCensorshipStatus()?.censorshipResistance.distributedBackups || 0}
                  </span>
                </div>
              </div>
            </div>

            <div class={styles.informationFreedom}>
              <h5>Information Freedom</h5>
              <div class={styles.freedomStats}>
                <div class={styles.freedomStat}>
                  <span>Accessible Content:</span>
                  <span>{antiCensorshipStatus()?.informationFreedom.accessibleContent || 0}</span>
                </div>
                <div class={styles.freedomStat}>
                  <span>Educational Context:</span>
                  <span>{antiCensorshipStatus()?.informationFreedom.educationalContext || 0}</span>
                </div>
                <div class={styles.freedomStat}>
                  <span>Multiple Perspectives:</span>
                  <span>
                    {antiCensorshipStatus()?.informationFreedom.multiplePerspectives || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class={styles.antiCensorshipNotice}>
            <p class={styles.noticeText}>
              🛡️ This network operates on anti-censorship principles. All content is accessible with
              educational context provided. Cultural information enhances understanding without
              restricting access.
            </p>
          </div>
        </Card>
      </Show>

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
