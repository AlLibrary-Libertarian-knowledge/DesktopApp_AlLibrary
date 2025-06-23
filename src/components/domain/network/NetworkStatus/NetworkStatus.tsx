/**
 * NetworkStatus Component - Real-time P2P Network Health Display
 *
 * Integrates with existing p2pNetworkService to provide real-time network status,
 * peer connectivity, and cultural network information display.
 *
 * ANTI-CENSORSHIP PRINCIPLES:
 * - Displays network health information only - never restricts access
 * - Shows cultural network context for educational purposes
 * - Supports anonymous TOR networking status
 * - Provides transparent network health metrics
 */

import { Component, createSignal, createResource, onMount, onCleanup, Show, For } from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Badge } from '@/components/foundation/Badge';
import { Progress } from '@/components/foundation/Progress';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';
import { NodeStatus } from '@/types/Network';
import type { NetworkStatus as NetworkStatusData, NetworkMetrics, Peer } from '@/types/Network';
import type { NetworkStatusProps } from './types';
import styles from './NetworkStatus.module.css';

/**
 * NetworkStatus Component
 *
 * Displays real-time P2P network health with cultural context and anti-censorship features
 */
export const NetworkStatus: Component<NetworkStatusProps> = props => {
  const [refreshInterval, setRefreshInterval] = createSignal<number | null>(null);
  const [lastUpdated, setLastUpdated] = createSignal<Date>(new Date());

  // Real-time network status resource
  const [networkStatus, { refetch: refetchStatus }] = createResource(
    () => props.autoRefresh,
    async (): Promise<NetworkStatusData> => {
      try {
        const status = await p2pNetworkService.getNodeStatus();
        setLastUpdated(new Date());
        return status;
      } catch (error) {
        console.error('Failed to fetch network status:', error);
        throw error;
      }
    }
  );

  // Network metrics resource
  const [networkMetrics, { refetch: refetchMetrics }] = createResource(
    () => props.showMetrics,
    async (): Promise<NetworkMetrics | null> => {
      if (!props.showMetrics) return null;
      try {
        return await p2pNetworkService.getNetworkMetrics();
      } catch (error) {
        console.error('Failed to fetch network metrics:', error);
        return null;
      }
    }
  );

  // Connected peers resource
  const [connectedPeers, { refetch: refetchPeers }] = createResource(async (): Promise<Peer[]> => {
    try {
      return await p2pNetworkService.getConnectedPeers();
    } catch (error) {
      console.error('Failed to fetch connected peers:', error);
      return [];
    }
  });

  // Auto-refresh setup
  onMount(() => {
    if (props.autoRefresh && props.refreshInterval) {
      const interval = window.setInterval(() => {
        refetchStatus();
        refetchMetrics();
        refetchPeers();
      }, props.refreshInterval * 1000);

      setRefreshInterval(interval);
    }
  });

  onCleanup(() => {
    const interval = refreshInterval();
    if (interval) {
      window.clearInterval(interval);
    }
  });

  // Helper functions
  const getStatusColor = (status: NodeStatus): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case NodeStatus.ONLINE:
        return 'success';
      case NodeStatus.CONNECTING:
      case NodeStatus.STARTING:
        return 'warning';
      case NodeStatus.OFFLINE:
      case NodeStatus.STOPPING:
        return 'error';
      case NodeStatus.ERROR:
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getStatusText = (status: NodeStatus): string => {
    switch (status) {
      case NodeStatus.ONLINE:
        return 'Connected to P2P Network';
      case NodeStatus.CONNECTING:
        return 'Connecting to P2P Network';
      case NodeStatus.STARTING:
        return 'Starting P2P Network';
      case NodeStatus.OFFLINE:
        return 'Disconnected from P2P Network';
      case NodeStatus.STOPPING:
        return 'Stopping P2P Network';
      case NodeStatus.ERROR:
        return 'Network Connection Error';
      default:
        return 'Unknown Network Status';
    }
  };

  const formatBandwidth = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B/s`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  const formatLatency = (ms: number): string => {
    return `${ms}ms`;
  };

  const handleRefresh = () => {
    refetchStatus();
    refetchMetrics();
    refetchPeers();
    if (props.onRefresh) {
      props.onRefresh();
    }
  };

  const currentStatus = () => networkStatus();
  const currentMetrics = () => networkMetrics();
  const currentPeers = () => connectedPeers();

  return (
    <Card class={`${styles.networkStatus} ${props.class || ''}`}>
      {/* Header */}
      <div class={styles.header}>
        <h3 class={styles.title}>Network Status</h3>
        <Show when={currentStatus()}>
          <Badge
            variant={getStatusColor(currentStatus()?.nodeStatus || NodeStatus.OFFLINE)}
            class={styles.statusBadge}
          >
            {getStatusText(currentStatus()?.nodeStatus || NodeStatus.OFFLINE)}
          </Badge>
        </Show>
        <Show when={props.showRefreshButton !== false}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            class={styles.refreshButton}
          >
            Refresh
          </Button>
        </Show>
      </div>

      <Show when={props.showLastUpdated}>
        <div class={styles.lastUpdated}>Last updated: {lastUpdated().toLocaleTimeString()}</div>
      </Show>

      {/* Content */}
      <div class={styles.content}>
        <Show when={networkStatus.loading}>
          <div class={styles.loading}>
            <Progress value={50} class={styles.loadingProgress} />
            <p>Loading network status...</p>
          </div>
        </Show>

        <Show when={networkStatus.error}>
          <div class={styles.error}>
            <p>Failed to load network status: {(networkStatus.error as Error)?.message}</p>
            <Button onClick={handleRefresh} variant="secondary" size="sm">
              Retry
            </Button>
          </div>
        </Show>

        <Show when={currentStatus() && !networkStatus.loading}>
          <div class={styles.statusGrid}>
            {/* Connection Status */}
            <div class={styles.statusItem}>
              <span class={styles.label}>Connection Status</span>
              <span class={styles.value}>
                {getStatusText(currentStatus()?.nodeStatus || NodeStatus.OFFLINE)}
              </span>
            </div>

            {/* Connected Peers */}
            <div class={styles.statusItem}>
              <span class={styles.label}>Connected Peers</span>
              <span class={styles.value}>{currentStatus()?.connectedPeers || 0}</span>
            </div>

            {/* Network Health */}
            <div class={styles.statusItem}>
              <span class={styles.label}>Network Health</span>
              <span class={styles.value}>
                {((currentStatus()?.networkHealth || 0) * 100).toFixed(1)}%
              </span>
            </div>

            {/* TOR Status */}
            <Show when={currentStatus()?.torStatus}>
              <div class={styles.statusItem}>
                <span class={styles.label}>TOR Status</span>
                <Badge
                  variant={currentStatus()?.torStatus?.connected ? 'success' : 'error'}
                  class={styles.torBadge}
                >
                  {currentStatus()?.torStatus?.connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </Show>

            {/* IPFS Status */}
            <div class={styles.statusItem}>
              <span class={styles.label}>IPFS Status</span>
              <Badge
                variant={currentStatus()?.ipfsStatus ? 'success' : 'error'}
                class={styles.ipfsBadge}
              >
                {currentStatus()?.ipfsStatus ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Network Health Progress */}
            <div class={styles.statusItem}>
              <span class={styles.label}>Network Health</span>
              <Progress
                value={(currentStatus()?.networkHealth || 0) * 100}
                class={styles.healthProgress}
              />
            </div>
          </div>
        </Show>

        {/* Network Metrics */}
        <Show when={props.showMetrics && currentMetrics() && !networkMetrics.loading}>
          <div class={styles.metricsSection}>
            <h4 class={styles.sectionTitle}>Performance Metrics</h4>
            <div class={styles.metricsGrid}>
              <div class={styles.metricItem}>
                <span class={styles.label}>Average Latency</span>
                <span class={styles.value}>
                  {formatLatency(currentMetrics()?.performance?.averageLatency || 0)}
                </span>
              </div>
              <div class={styles.metricItem}>
                <span class={styles.label}>Total Bandwidth</span>
                <span class={styles.value}>
                  {formatBandwidth(currentMetrics()?.performance?.totalBandwidth || 0)}
                </span>
              </div>
              <div class={styles.metricItem}>
                <span class={styles.label}>Messages Sent</span>
                <span class={styles.value}>{currentMetrics()?.performance?.messagesSent || 0}</span>
              </div>
              <div class={styles.metricItem}>
                <span class={styles.label}>Messages Received</span>
                <span class={styles.value}>
                  {currentMetrics()?.performance?.messagesReceived || 0}
                </span>
              </div>
              <div class={styles.metricItem}>
                <span class={styles.label}>Error Rate</span>
                <span class={styles.value}>
                  {((currentMetrics()?.performance?.errorRate || 0) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </Show>

        {/* Cultural Information Section */}
        <Show
          when={props.showEducationalContext && currentStatus()?.activeCommunityNetworks?.length}
        >
          <div class={styles.culturalSection}>
            <h4 class={styles.sectionTitle}>Cultural Networks</h4>
            <div class={styles.culturalInfo}>
              <p class={styles.culturalDescription}>
                Connected to {currentStatus()?.activeCommunityNetworks?.length || 0} cultural
                community networks. This provides educational context for cultural content and
                supports community sovereignty.
              </p>
              <div class={styles.communityNetworks}>
                <For each={currentStatus()?.activeCommunityNetworks || []}>
                  {network => (
                    <Badge variant="neutral" class={styles.networkBadge}>
                      {network}
                    </Badge>
                  )}
                </For>
              </div>
            </div>
          </div>
        </Show>

        {/* Connected Peers List */}
        <Show when={currentPeers()?.length && !connectedPeers.loading}>
          <div class={styles.peersSection}>
            <h4 class={styles.sectionTitle}>Connected Peers ({currentPeers()?.length || 0})</h4>
            <div class={styles.peersList}>
              <For each={currentPeers()?.slice(0, 5) || []}>
                {peer => (
                  <div class={styles.peerItem}>
                    <div class={styles.peerInfo}>
                      <span class={styles.peerId}>{peer.name || peer.id.slice(0, 8)}...</span>
                      <Badge
                        variant={peer.connected ? 'success' : 'error'}
                        class={styles.peerStatus}
                      >
                        {peer.connected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                    <div class={styles.peerMetrics}>
                      <span class={styles.peerLatency}>
                        {formatLatency(peer.connectionQuality?.latency || 0)}
                      </span>
                      <span class={styles.peerTrust}>
                        Trust: {(peer.trustLevel * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
              </For>
              <Show when={(currentPeers()?.length || 0) > 5}>
                <div class={styles.moreInfo}>
                  ...and {(currentPeers()?.length || 0) - 5} more peers
                </div>
              </Show>
            </div>
          </div>
        </Show>

        {/* Anti-Censorship Status */}
        <Show when={currentStatus()?.censorshipResistance}>
          <div class={styles.censorshipSection}>
            <h4 class={styles.sectionTitle}>Anti-Censorship Status</h4>
            <div class={styles.censorshipInfo}>
              <div class={styles.resistanceLevel}>
                <span class={styles.label}>Resistance Level</span>
                <Progress
                  value={(currentStatus()?.censorshipResistance?.level || 0) * 100}
                  class={styles.resistanceProgress}
                />
                <span class={styles.value}>
                  {((currentStatus()?.censorshipResistance?.level || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div class={styles.resistanceFeatures}>
                <Badge
                  variant={
                    currentStatus()?.censorshipResistance?.torConnectivity ? 'success' : 'error'
                  }
                >
                  TOR Connectivity
                </Badge>
                <Badge
                  variant={
                    currentStatus()?.censorshipResistance?.contentFilteringBypass
                      ? 'success'
                      : 'error'
                  }
                >
                  Content Filtering Bypass
                </Badge>
                <Badge
                  variant={
                    currentStatus()?.censorshipResistance?.alternativeNarrativeSupport
                      ? 'success'
                      : 'error'
                  }
                >
                  Alternative Narratives
                </Badge>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </Card>
  );
};

export default NetworkStatus;
