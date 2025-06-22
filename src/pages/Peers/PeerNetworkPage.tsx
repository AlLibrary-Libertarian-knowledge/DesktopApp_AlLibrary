/**
 * Peer Network Monitoring Page
 *
 * Real-time P2P network monitoring and management interface.
 * Enforces decentralization and anti-censorship principles.
 */

import { Component, createSignal, For, Show, ErrorBoundary } from 'solid-js';
import { createAsync } from '@solidjs/router';
import {
  peerApi,
  type PeerInfo,
  type NetworkHealth,
  PeerStatus,
  PeerCapability,
} from '../../services/api';
import { LoadingSpinner } from '../../components/foundation/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/foundation/ErrorMessage/ErrorMessage';
import styles from './PeerNetworkPage.module.css';

export const PeerNetworkPage: Component = () => {
  const [viewMode, setViewMode] = createSignal<'overview' | 'peers' | 'health' | 'emergency'>(
    'overview'
  );
  const [isLoading, setIsLoading] = createSignal(false);

  // Network data
  const networkHealth = createAsync(async () => {
    try {
      const response = await peerApi.getNetworkHealth();
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Failed to load network health:', err);
      return null;
    }
  });

  const connectedPeers = createAsync(async () => {
    try {
      const response = await peerApi.getConnectedPeers();
      return response.success ? response.data : [];
    } catch (err) {
      console.error('Failed to load peers:', err);
      return [];
    }
  });

  const handleEmergencyProtocols = async () => {
    setIsLoading(true);
    try {
      await peerApi.enableEmergencyProtocols();
    } catch (err) {
      console.error('Emergency protocols failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary
      fallback={err => (
        <ErrorMessage message="Failed to load peer network page" details={err.message} />
      )}
    >
      <div class={styles.peerNetworkPage}>
        <header class={styles.pageHeader}>
          <h1 class={styles.pageTitle}>Peer Network Monitor</h1>
          <p class={styles.pageSubtitle}>
            Decentralized P2P network status and anti-censorship monitoring
          </p>

          <div class={styles.viewControls}>
            <button
              class={`${styles.viewButton} ${viewMode() === 'overview' ? styles.active : ''}`}
              onClick={() => setViewMode('overview')}
            >
              Overview
            </button>
            <button
              class={`${styles.viewButton} ${viewMode() === 'peers' ? styles.active : ''}`}
              onClick={() => setViewMode('peers')}
            >
              Connected Peers
            </button>
            <button
              class={`${styles.viewButton} ${viewMode() === 'health' ? styles.active : ''}`}
              onClick={() => setViewMode('health')}
            >
              Network Health
            </button>
            <button
              class={`${styles.viewButton} ${viewMode() === 'emergency' ? styles.active : ''}`}
              onClick={() => setViewMode('emergency')}
            >
              Emergency Protocols
            </button>
          </div>
        </header>

        <main class={styles.mainContent}>
          {/* Overview */}
          <Show when={viewMode() === 'overview' && networkHealth()}>
            <div class={styles.overviewSection}>
              <div class={styles.metricsGrid}>
                <div class={styles.metricCard}>
                  <h3>Connected Peers</h3>
                  <div class={styles.metricValue}>{networkHealth()?.connectedPeers || 0}</div>
                </div>
                <div class={styles.metricCard}>
                  <h3>Decentralization Score</h3>
                  <div class={styles.metricValue}>
                    {networkHealth()?.decentralizationScore || 0}%
                  </div>
                </div>
                <div class={styles.metricCard}>
                  <h3>Censorship Resistance</h3>
                  <div class={styles.metricValue}>
                    {networkHealth()?.censorshipResistance || 0}%
                  </div>
                </div>
                <div class={styles.metricCard}>
                  <h3>Cultural Diversity</h3>
                  <div class={styles.metricValue}>
                    {networkHealth()?.culturalDiversity.representedCommunities || 0}
                  </div>
                </div>
              </div>
            </div>
          </Show>

          {/* Connected Peers */}
          <Show when={viewMode() === 'peers'}>
            <div class={styles.peersSection}>
              <div class={styles.peersList}>
                <For each={connectedPeers()}>
                  {peer => (
                    <div class={styles.peerCard}>
                      <div class={styles.peerHeader}>
                        <h3 class={styles.peerName}>{peer.nickname || 'Anonymous Peer'}</h3>
                        <span class={`${styles.status} ${styles[peer.status]}`}>{peer.status}</span>
                      </div>

                      <div class={styles.peerInfo}>
                        <div class={styles.infoItem}>
                          <span class={styles.label}>Latency:</span>
                          <span class={styles.value}>{peer.latency}ms</span>
                        </div>
                        <div class={styles.infoItem}>
                          <span class={styles.label}>Shared Documents:</span>
                          <span class={styles.value}>{peer.sharedContent.totalDocuments}</span>
                        </div>
                        <div class={styles.infoItem}>
                          <span class={styles.label}>Cultural Contributions:</span>
                          <span class={styles.value}>
                            {peer.sharedContent.culturalContributions}
                          </span>
                        </div>
                      </div>

                      <div class={styles.capabilities}>
                        <For each={peer.capabilities}>
                          {capability => <span class={styles.capabilityTag}>{capability}</span>}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Emergency Protocols */}
          <Show when={viewMode() === 'emergency'}>
            <div class={styles.emergencySection}>
              <div class={styles.emergencyControls}>
                <h2>Anti-Censorship Emergency Protocols</h2>
                <p>
                  Activate emergency protocols to bypass network restrictions and maintain
                  information access.
                </p>

                <button
                  class={styles.emergencyButton}
                  onClick={handleEmergencyProtocols}
                  disabled={isLoading()}
                >
                  {isLoading() ? 'Activating...' : 'Activate Emergency Protocols'}
                </button>
              </div>
            </div>
          </Show>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default PeerNetworkPage;
