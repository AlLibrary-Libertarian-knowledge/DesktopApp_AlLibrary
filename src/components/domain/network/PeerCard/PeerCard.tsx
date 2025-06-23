/**
 * PeerCard Component - Individual Peer Information Display
 *
 * Displays detailed information about P2P network peers with cultural context
 * and connection quality metrics.
 *
 * ANTI-CENSORSHIP PRINCIPLES:
 * - Displays peer information transparently
 * - Shows cultural context for educational purposes only
 * - Supports anonymous peer connections
 * - Provides trust metrics without censoring access
 */

import { Component, Show, createMemo } from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Badge } from '@/components/foundation/Badge';
import { Button } from '@/components/foundation/Button';
import { Progress } from '@/components/foundation/Progress';
import type { Peer } from '@/types/Network';
import type { PeerCardProps } from './types';
import styles from './PeerCard.module.css';

/**
 * PeerCard Component
 *
 * Displays comprehensive peer information with cultural context and connection metrics
 */
export const PeerCard: Component<PeerCardProps> = props => {
  const peer = () => props.peer;

  // Computed values
  const connectionStatusVariant = createMemo(() => {
    if (!peer().connected) return 'error';
    const quality = peer().connectionQuality?.stability || 0;
    if (quality > 0.8) return 'success';
    if (quality > 0.5) return 'warning';
    return 'error';
  });

  const trustLevelVariant = createMemo(() => {
    const trust = peer().trustLevel;
    if (trust > 0.8) return 'success';
    if (trust > 0.5) return 'warning';
    return 'error';
  });

  const formatLatency = (ms: number): string => {
    return `${ms}ms`;
  };

  const formatBandwidth = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B/s`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  const formatLastSeen = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleConnect = () => {
    if (props.onConnect) {
      props.onConnect(peer().id);
    }
  };

  const handleDisconnect = () => {
    if (props.onDisconnect) {
      props.onDisconnect(peer().id);
    }
  };

  const handleViewDetails = () => {
    if (props.onViewDetails) {
      props.onViewDetails(peer().id);
    }
  };

  return (
    <Card class={`${styles.peerCard} ${props.class || ''}`} variant={props.variant}>
      {/* Header */}
      <div class={styles.header}>
        <div class={styles.peerInfo}>
          <h4 class={styles.peerName}>{peer().name || `Peer ${peer().id.slice(0, 8)}`}</h4>
          <Badge variant={connectionStatusVariant()} class={styles.statusBadge}>
            {peer().connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        <div class={styles.actions}>
          <Show when={peer().connected}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDisconnect}
              class={styles.actionButton}
            >
              Disconnect
            </Button>
          </Show>
          <Show when={!peer().connected}>
            <Button variant="primary" size="sm" onClick={handleConnect} class={styles.actionButton}>
              Connect
            </Button>
          </Show>
          <Show when={props.showDetails !== false}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              class={styles.actionButton}
            >
              Details
            </Button>
          </Show>
        </div>
      </div>

      {/* Peer ID and Address */}
      <div class={styles.identifiers}>
        <div class={styles.identifier}>
          <span class={styles.label}>Peer ID:</span>
          <span class={styles.value} title={peer().id}>
            {peer().id.slice(0, 16)}...
          </span>
        </div>
        <Show when={peer().addresses?.length}>
          <div class={styles.identifier}>
            <span class={styles.label}>Address:</span>
            <span class={styles.value}>{peer().addresses[0]?.address || 'Unknown'}</span>
          </div>
        </Show>
      </div>

      {/* Connection Quality Metrics */}
      <Show when={peer().connected && peer().connectionQuality}>
        <div class={styles.metricsSection}>
          <h5 class={styles.sectionTitle}>Connection Quality</h5>
          <div class={styles.metricsGrid}>
            <div class={styles.metricItem}>
              <span class={styles.label}>Latency</span>
              <span class={styles.value}>
                {formatLatency(peer().connectionQuality?.latency || 0)}
              </span>
            </div>
            <div class={styles.metricItem}>
              <span class={styles.label}>Bandwidth</span>
              <span class={styles.value}>
                {formatBandwidth(peer().connectionQuality?.bandwidth || 0)}
              </span>
            </div>
            <div class={styles.metricItem}>
              <span class={styles.label}>Stability</span>
              <Progress
                value={(peer().connectionQuality?.stability || 0) * 100}
                class={styles.stabilityProgress}
              />
            </div>
            <div class={styles.metricItem}>
              <span class={styles.label}>Error Rate</span>
              <span class={styles.value}>
                {((peer().connectionQuality?.errorRate || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </Show>

      {/* Trust and Reputation */}
      <div class={styles.trustSection}>
        <div class={styles.trustHeader}>
          <h5 class={styles.sectionTitle}>Trust Level</h5>
          <Badge variant={trustLevelVariant()} class={styles.trustBadge}>
            {(peer().trustLevel * 100).toFixed(0)}%
          </Badge>
        </div>
        <Progress value={peer().trustLevel * 100} class={styles.trustProgress} />
        <div class={styles.trustInfo}>
          <span class={styles.sharedContent}>{peer().sharedContentCount} items shared</span>
          <span class={styles.lastSeen}>Last seen: {formatLastSeen(peer().lastSeen)}</span>
        </div>
      </div>

      {/* Cultural Context (Educational Only) */}
      <Show when={props.showCulturalContext && peer().culturalAffiliations?.length}>
        <div class={styles.culturalSection}>
          <h5 class={styles.sectionTitle}>Cultural Context</h5>
          <p class={styles.culturalDescription}>
            Educational context: This peer participates in cultural networks that provide
            educational resources and community-specific content.
          </p>
          <div class={styles.culturalAffiliations}>
            <For each={peer().culturalAffiliations || []}>
              {affiliation => (
                <Badge variant="info" class={styles.affiliationBadge}>
                  {affiliation}
                </Badge>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Community Networks */}
      <Show when={peer().communityMemberships?.length}>
        <div class={styles.communitySection}>
          <h5 class={styles.sectionTitle}>Community Networks</h5>
          <div class={styles.communityMemberships}>
            <For each={peer().communityMemberships || []}>
              {community => (
                <Badge variant="secondary" class={styles.communityBadge}>
                  {community}
                </Badge>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Anonymous Connection Info */}
      <Show when={peer().addresses?.some(addr => addr.type === 'tor')}>
        <div class={styles.anonymousSection}>
          <div class={styles.anonymousInfo}>
            <Badge variant="warning" class={styles.anonymousBadge}>
              Anonymous Connection
            </Badge>
            <span class={styles.anonymousText}>
              This peer connects through TOR for enhanced privacy
            </span>
          </div>
        </div>
      </Show>

      {/* Node Capabilities */}
      <Show when={props.showCapabilities && peer().capabilities}>
        <div class={styles.capabilitiesSection}>
          <h5 class={styles.sectionTitle}>Capabilities</h5>
          <div class={styles.capabilities}>
            <Show when={peer().capabilities?.torSupport}>
              <Badge variant="success" class={styles.capabilityBadge}>
                TOR Support
              </Badge>
            </Show>
            <Show when={peer().capabilities?.ipfsSupport}>
              <Badge variant="success" class={styles.capabilityBadge}>
                IPFS Support
              </Badge>
            </Show>
            <Show when={peer().capabilities?.culturalSharing}>
              <Badge variant="info" class={styles.capabilityBadge}>
                Cultural Sharing
              </Badge>
            </Show>
            <Show when={peer().capabilities?.educationalSupport}>
              <Badge variant="info" class={styles.capabilityBadge}>
                Educational Support
              </Badge>
            </Show>
            <Show when={peer().capabilities?.alternativeNarratives}>
              <Badge variant="primary" class={styles.capabilityBadge}>
                Alternative Narratives
              </Badge>
            </Show>
            <Show when={peer().capabilities?.contentVerification}>
              <Badge variant="success" class={styles.capabilityBadge}>
                Content Verification
              </Badge>
            </Show>
          </div>
          <div class={styles.resistanceLevel}>
            <span class={styles.label}>Censorship Resistance:</span>
            <Progress
              value={(peer().capabilities?.censorshipResistance || 0) * 100}
              class={styles.resistanceProgress}
            />
            <span class={styles.value}>
              {((peer().capabilities?.censorshipResistance || 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </Show>
    </Card>
  );
};

export default PeerCard;
