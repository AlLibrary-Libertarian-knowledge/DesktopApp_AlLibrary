import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Badge } from '@/components/foundation/Badge';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';
import type {
  CommunityNetworksProps,
  CommunityNetwork,
  NetworkParticipation,
} from './types/CommunityNetworksTypes';
import styles from './CommunityNetworks.module.css';

/**
 * CommunityNetworks component for displaying cultural community overlay networks
 *
 * @example
 * ```tsx
 * <CommunityNetworks
 *   onJoinNetwork={handleJoinNetwork}
 *   onLeaveNetwork={handleLeaveNetwork}
 *   showEducationalContext={true}
 * />
 * ```
 *
 * @cultural-considerations
 * - Displays community networks for educational purposes only
 * - Shows cultural context without restricting access
 * - Supports multiple perspectives and interpretations equally
 * - NO ACCESS CONTROL - information and participation only
 *
 * @accessibility
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - High contrast mode support
 * - Focus management for network interactions
 *
 * @performance
 * - Efficient network discovery and monitoring
 * - Optimized for real-time updates
 * - Minimal memory footprint
 */
export const CommunityNetworks: Component<CommunityNetworksProps> = props => {
  // State management
  const [availableNetworks, setAvailableNetworks] = createSignal<CommunityNetwork[]>([]);
  const [joinedNetworks, setJoinedNetworks] = createSignal<CommunityNetwork[]>([]);
  const [networkParticipation, setNetworkParticipation] = createSignal<NetworkParticipation[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [selectedNetwork, setSelectedNetwork] = createSignal<CommunityNetwork | null>(null);
  const [showEducationalPanel, setShowEducationalPanel] = createSignal(
    props.showEducationalContext ?? true
  );

  // Load available community networks
  createEffect(async () => {
    try {
      setIsLoading(true);

      // Discover available cultural community networks
      const networks = await p2pNetworkService.discoverCommunityNetworks();
      setAvailableNetworks(networks);

      // Get current participation status
      const participation = await p2pNetworkService.getNetworkParticipation();
      setNetworkParticipation(participation);

      // Filter joined networks
      const joined = networks.filter(network =>
        participation.some(p => p.networkId === network.id && p.isActive)
      );
      setJoinedNetworks(joined);
    } catch (error) {
      console.error('Failed to load community networks:', error);
    } finally {
      setIsLoading(false);
    }
  });

  // Handle network joining (information and voluntary participation only)
  const handleJoinNetwork = async (network: CommunityNetwork) => {
    try {
      setIsLoading(true);

      // Join community network for information sharing
      await p2pNetworkService.joinCommunityNetwork({
        networkId: network.id,
        participationType: 'information-sharing',
        educationalContext: true,
        respectCulturalProtocols: true,
      });

      // Update participation state
      const updatedParticipation = await p2pNetworkService.getNetworkParticipation();
      setNetworkParticipation(updatedParticipation);

      // Update joined networks
      const newJoined = [...joinedNetworks(), network];
      setJoinedNetworks(newJoined);

      // Notify parent component
      props.onJoinNetwork?.(network);
    } catch (error) {
      console.error('Failed to join community network:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle network leaving
  const handleLeaveNetwork = async (network: CommunityNetwork) => {
    try {
      setIsLoading(true);

      // Leave community network
      await p2pNetworkService.leaveCommunityNetwork(network.id);

      // Update participation state
      const updatedParticipation = await p2pNetworkService.getNetworkParticipation();
      setNetworkParticipation(updatedParticipation);

      // Update joined networks
      const filtered = joinedNetworks().filter(n => n.id !== network.id);
      setJoinedNetworks(filtered);

      // Notify parent component
      props.onLeaveNetwork?.(network);
    } catch (error) {
      console.error('Failed to leave community network:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get participation status for a network
  const getParticipationStatus = (networkId: string) => {
    return networkParticipation().find(p => p.networkId === networkId);
  };

  // Check if user is joined to a network
  const isJoinedToNetwork = (networkId: string) => {
    const participation = getParticipationStatus(networkId);
    return participation?.isActive ?? false;
  };

  // Get cultural sensitivity display class
  const getCulturalSensitivityClass = (level: number) => {
    switch (level) {
      case 1:
        return styles.sensitivityGeneral;
      case 2:
        return styles.sensitivityTraditional;
      case 3:
        return styles.sensitivityEducational;
      default:
        return styles.sensitivityGeneral;
    }
  };

  return (
    <div class={styles.communityNetworks}>
      {/* Header Section */}
      <div class={styles.header}>
        <h2 class={styles.title}>Cultural Community Networks</h2>
        <p class={styles.subtitle}>
          Discover and participate in cultural knowledge-sharing communities
        </p>

        <div class={styles.headerActions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEducationalPanel(!showEducationalPanel())}
            aria-label="Toggle educational context"
          >
            {showEducationalPanel() ? 'Hide' : 'Show'} Educational Context
          </Button>
        </div>
      </div>

      {/* Educational Context Panel */}
      <Show when={showEducationalPanel()}>
        <Card class={styles.educationalPanel}>
          <Card.Header>
            <Card.Title>Cultural Community Networks - Educational Context</Card.Title>
          </Card.Header>
          <Card.Content>
            <div class={styles.educationalContent}>
              <div class={styles.principleSection}>
                <h4>Information Sharing Principles</h4>
                <ul>
                  <li>• Networks provide educational and cultural context</li>
                  <li>• Participation is voluntary and information-based</li>
                  <li>• Multiple perspectives are supported equally</li>
                  <li>• No content access restrictions based on cultural factors</li>
                </ul>
              </div>

              <div class={styles.participationSection}>
                <h4>Community Participation</h4>
                <ul>
                  <li>• Join networks to access cultural educational resources</li>
                  <li>• Share knowledge and learn from community members</li>
                  <li>• Respect cultural protocols through education, not restriction</li>
                  <li>• Contribute to preserving and sharing cultural heritage</li>
                </ul>
              </div>
            </div>
          </Card.Content>
        </Card>
      </Show>

      {/* Currently Joined Networks */}
      <Show when={joinedNetworks().length > 0}>
        <section class={styles.joinedSection}>
          <h3 class={styles.sectionTitle}>Your Community Networks</h3>
          <div class={styles.networkGrid}>
            <For each={joinedNetworks()}>
              {network => {
                const participation = getParticipationStatus(network.id);
                return (
                  <Card class={`${styles.networkCard} ${styles.joinedCard}`}>
                    <Card.Header>
                      <div class={styles.networkHeader}>
                        <Card.Title class={styles.networkName}>{network.name}</Card.Title>
                        <Badge
                          variant="success"
                          class={getCulturalSensitivityClass(network.culturalSensitivityLevel)}
                        >
                          Active
                        </Badge>
                      </div>
                    </Card.Header>
                    <Card.Content>
                      <div class={styles.networkInfo}>
                        <p class={styles.networkDescription}>{network.description}</p>

                        <div class={styles.networkStats}>
                          <div class={styles.stat}>
                            <span class={styles.statLabel}>Members:</span>
                            <span class={styles.statValue}>{network.memberCount}</span>
                          </div>
                          <div class={styles.stat}>
                            <span class={styles.statLabel}>Cultural Level:</span>
                            <span class={styles.statValue}>
                              {network.culturalSensitivityLevel === 1 && 'General Educational'}
                              {network.culturalSensitivityLevel === 2 && 'Traditional Knowledge'}
                              {network.culturalSensitivityLevel === 3 && 'Educational Context'}
                            </span>
                          </div>
                          <Show when={participation}>
                            <div class={styles.stat}>
                              <span class={styles.statLabel}>Joined:</span>
                              <span class={styles.statValue}>
                                {new Date(participation!.joinedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </Show>
                        </div>

                        <div class={styles.culturalContext}>
                          <h4>Cultural Context</h4>
                          <p>{network.culturalContext}</p>
                        </div>
                      </div>
                    </Card.Content>
                    <Card.Actions>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedNetwork(network)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleLeaveNetwork(network)}
                        disabled={isLoading()}
                      >
                        Leave Network
                      </Button>
                    </Card.Actions>
                  </Card>
                );
              }}
            </For>
          </div>
        </section>
      </Show>

      {/* Available Networks to Join */}
      <section class={styles.availableSection}>
        <h3 class={styles.sectionTitle}>Discover Community Networks</h3>
        <div class={styles.networkGrid}>
          <For each={availableNetworks().filter(network => !isJoinedToNetwork(network.id))}>
            {network => (
              <Card class={styles.networkCard}>
                <Card.Header>
                  <div class={styles.networkHeader}>
                    <Card.Title class={styles.networkName}>{network.name}</Card.Title>
                    <Badge
                      variant="outline"
                      class={getCulturalSensitivityClass(network.culturalSensitivityLevel)}
                    >
                      Level {network.culturalSensitivityLevel}
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div class={styles.networkInfo}>
                    <p class={styles.networkDescription}>{network.description}</p>

                    <div class={styles.networkStats}>
                      <div class={styles.stat}>
                        <span class={styles.statLabel}>Members:</span>
                        <span class={styles.statValue}>{network.memberCount}</span>
                      </div>
                      <div class={styles.stat}>
                        <span class={styles.statLabel}>Language:</span>
                        <span class={styles.statValue}>{network.primaryLanguage}</span>
                      </div>
                      <div class={styles.stat}>
                        <span class={styles.statLabel}>Region:</span>
                        <span class={styles.statValue}>{network.culturalRegion}</span>
                      </div>
                    </div>

                    <div class={styles.culturalContext}>
                      <h4>Cultural Educational Context</h4>
                      <p>{network.culturalContext}</p>

                      <Show when={network.educationalResources?.length > 0}>
                        <div class={styles.educationalResources}>
                          <h5>Educational Resources Available:</h5>
                          <ul>
                            <For each={network.educationalResources}>
                              {resource => <li>• {resource}</li>}
                            </For>
                          </ul>
                        </div>
                      </Show>
                    </div>
                  </div>
                </Card.Content>
                <Card.Actions>
                  <Button variant="outline" size="sm" onClick={() => setSelectedNetwork(network)}>
                    Learn More
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleJoinNetwork(network)}
                    disabled={isLoading()}
                  >
                    Join for Learning
                  </Button>
                </Card.Actions>
              </Card>
            )}
          </For>
        </div>
      </section>

      {/* Network Loading State */}
      <Show when={isLoading()}>
        <div class={styles.loadingState}>
          <div class={styles.loadingSpinner}></div>
          <p>Connecting to community networks...</p>
        </div>
      </Show>

      {/* Empty State */}
      <Show when={availableNetworks().length === 0 && !isLoading()}>
        <Card class={styles.emptyState}>
          <Card.Content>
            <div class={styles.emptyContent}>
              <h3>No Community Networks Found</h3>
              <p>
                No cultural community networks are currently available. Check your P2P connection or
                try again later.
              </p>
              <Button variant="primary" onClick={() => window.location.reload()}>
                Refresh Networks
              </Button>
            </div>
          </Card.Content>
        </Card>
      </Show>
    </div>
  );
};
