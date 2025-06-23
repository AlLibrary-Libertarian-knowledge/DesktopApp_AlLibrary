/**
 * CommunityNetworkPanel Component - Cultural Community Network Participation
 *
 * Enables cultural communities to participate in P2P networks with educational context
 * and community sovereignty tools.
 *
 * ANTI-CENSORSHIP PRINCIPLES:
 * - All communities accessible without restrictions
 * - Cultural context provided for educational purposes only
 * - Community sovereignty through technical empowerment
 * - Information freedom preserved throughout
 */

import { Component, createSignal, createResource, Show, For } from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Input } from '@/components/foundation/Input';
import { Badge } from '@/components/foundation/Badge';
import { Switch } from '@/components/foundation/Switch';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';
import type {
  CommunityNetworkPanelProps,
  CommunityDiscoveryResult,
  CommunityNetworkMetrics,
  JoinCommunityRequest,
  CommunityEngagementSettings,
} from './types';
import styles from './CommunityNetworkPanel.module.css';

/**
 * CommunityNetworkPanel Component
 *
 * Comprehensive interface for cultural community network participation
 * with educational context and sovereignty tools
 */
export const CommunityNetworkPanel: Component<CommunityNetworkPanelProps> = props => {
  // State management
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedCommunity, setSelectedCommunity] = createSignal<CommunityDiscoveryResult | null>(
    null
  );
  const [isJoining, setIsJoining] = createSignal(false);
  const [showEducationalModal, setShowEducationalModal] = createSignal(false);
  const [engagementSettings, setEngagementSettings] = createSignal<CommunityEngagementSettings>({
    shareEducationalContext: true,
    provideHistoricalContext: true,
    supportMultiplePerspectives: true,
    enableInformationSharing: true,
    participateInEducationalExchanges: true,
    respectCommunityProtocols: true,
    restrictAccess: false, // Always false
  });

  // Generate mock community data
  const generateMockCommunities = (query: string): CommunityDiscoveryResult[] => {
    const communities = [
      {
        id: 'indigenous-knowledge-circle',
        name: 'Indigenous Knowledge Circle',
        description:
          'Educational sharing of traditional ecological knowledge and cultural practices',
        memberCount: 245,
        culturalOrigin: 'Various Indigenous Communities',
        educationalResources: [
          'Traditional Ecological Knowledge',
          'Cultural Protocols',
          'Historical Context',
          'Language Preservation',
        ],
        protocols: [
          'Respectful engagement',
          'Educational purpose acknowledgment',
          'Source attribution',
          'Community consultation',
        ],
        joinable: true,
        isJoined: false,
        lastActivity: '2 hours ago',
        culturalContext: {
          sensitivityLevel: 3,
          description: 'Traditional knowledge shared for educational and preservation purposes',
          educationalValue: 'high' as const,
          traditionalKnowledge: ['Ecological practices', 'Cultural ceremonies', 'Language systems'],
        },
      },
      {
        id: 'global-heritage-network',
        name: 'Global Heritage Network',
        description:
          'Collaborative platform for sharing cultural heritage information and educational resources',
        memberCount: 567,
        culturalOrigin: 'International Communities',
        educationalResources: [
          'Cultural Heritage Documentation',
          'Historical Archives',
          'Educational Materials',
          'Community Stories',
        ],
        protocols: [
          'Cultural sensitivity awareness',
          'Educational context provision',
          'Multiple perspective support',
          'Information transparency',
        ],
        joinable: true,
        isJoined: true,
        lastActivity: '30 minutes ago',
        culturalContext: {
          sensitivityLevel: 2,
          description: 'Diverse cultural heritage shared for global education and understanding',
          educationalValue: 'high' as const,
          traditionalKnowledge: [
            'Cultural practices',
            'Historical narratives',
            'Artistic traditions',
          ],
        },
      },
      {
        id: 'academic-cultural-exchange',
        name: 'Academic Cultural Exchange',
        description: 'Scholarly network for cultural research and educational collaboration',
        memberCount: 189,
        culturalOrigin: 'Academic Institutions',
        educationalResources: [
          'Research Papers',
          'Cultural Analysis',
          'Educational Frameworks',
          'Scholarly Resources',
        ],
        protocols: ['Academic integrity', 'Peer review', 'Educational focus', 'Research ethics'],
        joinable: true,
        isJoined: false,
        lastActivity: '1 hour ago',
        culturalContext: {
          sensitivityLevel: 1,
          description: 'Academic research and educational content with cultural focus',
          educationalValue: 'high' as const,
          traditionalKnowledge: [
            'Research methodologies',
            'Cultural theories',
            'Educational approaches',
          ],
        },
      },
      {
        id: 'community-storytellers',
        name: 'Community Storytellers',
        description: 'Network for sharing oral traditions and community narratives',
        memberCount: 423,
        culturalOrigin: 'Oral Tradition Communities',
        educationalResources: [
          'Oral Histories',
          'Community Stories',
          'Cultural Narratives',
          'Storytelling Techniques',
        ],
        protocols: [
          'Story attribution',
          'Cultural context provision',
          'Respectful listening',
          'Educational sharing',
        ],
        joinable: true,
        isJoined: false,
        lastActivity: '4 hours ago',
        culturalContext: {
          sensitivityLevel: 2,
          description: 'Oral traditions and community stories shared for cultural preservation',
          educationalValue: 'medium' as const,
          traditionalKnowledge: ['Storytelling traditions', 'Cultural values', 'Community wisdom'],
        },
      },
    ];

    if (!query.trim()) return communities;

    return communities.filter(
      community =>
        community.name.toLowerCase().includes(query.toLowerCase()) ||
        community.description.toLowerCase().includes(query.toLowerCase()) ||
        community.culturalOrigin.toLowerCase().includes(query.toLowerCase())
    );
  };

  // Community discovery resource
  const [availableCommunities] = createResource(
    () => ({ query: searchQuery(), settings: engagementSettings() }),
    async ({ query }): Promise<CommunityDiscoveryResult[]> => {
      try {
        // Mock community data for development
        return generateMockCommunities(query);
      } catch (error) {
        console.error('Failed to discover communities:', error);
        return [];
      }
    }
  );

  // Network metrics resource
  const [networkMetrics] = createResource(async (): Promise<CommunityNetworkMetrics> => {
    try {
      const nodeStatus = await p2pNetworkService.getNodeStatus();

      return {
        totalCommunities: 25,
        joinedCommunities: nodeStatus.activeCommunityNetworks?.length || 0,
        availableEducationalResources: 150,
        culturalExchanges: 45,
        informationShared: 320,
        sovereigntyScore: 98,
      };
    } catch (error) {
      console.error('Failed to get network metrics:', error);
      return {
        totalCommunities: 0,
        joinedCommunities: 0,
        availableEducationalResources: 0,
        culturalExchanges: 0,
        informationShared: 0,
        sovereigntyScore: 0,
      };
    }
  });

  const handleJoinCommunity = async (community: CommunityDiscoveryResult) => {
    setIsJoining(true);
    setSelectedCommunity(community);

    try {
      const joinRequest: JoinCommunityRequest = {
        communityId: community.id,
        educationalPurpose: 'Learning and educational exchange',
        respectProtocols: engagementSettings().respectCommunityProtocols,
        shareEducationalContext: engagementSettings().shareEducationalContext,
      };

      await p2pNetworkService.joinCommunityNetwork(community.id);

      // Show educational context
      setShowEducationalModal(true);

      if (props.onCommunityJoin) {
        props.onCommunityJoin(community.id);
      }
    } catch (error) {
      console.error('Failed to join community:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveCommunity = async (communityId: string) => {
    try {
      await p2pNetworkService.leaveCommunityNetwork(communityId);

      if (props.onCommunityLeave) {
        props.onCommunityLeave(communityId);
      }
    } catch (error) {
      console.error('Failed to leave community:', error);
    }
  };

  const getCulturalBadgeVariant = (level: number): 'info' | 'warning' | 'error' => {
    if (level <= 1) return 'info';
    if (level <= 2) return 'warning';
    return 'error';
  };

  const getEducationalValueColor = (value: string) => {
    switch (value) {
      case 'high':
        return '#22c55e';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  return (
    <div class={`${styles.communityNetworkPanel} ${props.class || ''}`}>
      {/* Panel Header */}
      <Card class={styles.headerCard || ''}>
        <div class={styles.headerContent}>
          <h3 class={styles.title}>Cultural Community Networks</h3>
          <div class={styles.metricsRow}>
            <Show when={networkMetrics()}>
              <div class={styles.metric}>
                <span class={styles.metricValue}>{networkMetrics()?.totalCommunities || 0}</span>
                <span class={styles.metricLabel}>Available</span>
              </div>
              <div class={styles.metric}>
                <span class={styles.metricValue}>{networkMetrics()?.joinedCommunities || 0}</span>
                <span class={styles.metricLabel}>Joined</span>
              </div>
              <div class={styles.metric}>
                <span class={styles.metricValue}>{networkMetrics()?.sovereigntyScore || 0}%</span>
                <span class={styles.metricLabel}>Sovereignty</span>
              </div>
            </Show>
          </div>
        </div>
      </Card>

      {/* Search and Discovery */}
      <Card class={styles.discoveryCard}>
        <h4 class={styles.sectionTitle}>Community Discovery</h4>

        <div class={styles.searchSection}>
          <Input
            value={searchQuery()}
            onInput={setSearchQuery}
            placeholder="Search communities by name, culture, or focus..."
            class={styles.searchInput}
          />
          <div class={styles.searchInfo}>
            <span class={styles.infoIcon}>ℹ️</span>
            <span class={styles.infoText}>
              All communities are accessible. Joining provides additional educational resources and
              context.
            </span>
          </div>
        </div>

        {/* Engagement Settings */}
        <div class={styles.engagementSettings}>
          <h5 class={styles.settingsTitle}>Engagement Preferences</h5>
          <div class={styles.settingsGrid}>
            <div class={styles.settingItem}>
              <Switch
                checked={engagementSettings().shareEducationalContext}
                onChange={checked =>
                  setEngagementSettings(prev => ({ ...prev, shareEducationalContext: checked }))
                }
              />
              <label class={styles.settingLabel}>Share Educational Context</label>
            </div>
            <div class={styles.settingItem}>
              <Switch
                checked={engagementSettings().provideHistoricalContext}
                onChange={checked =>
                  setEngagementSettings(prev => ({ ...prev, provideHistoricalContext: checked }))
                }
              />
              <label class={styles.settingLabel}>Provide Historical Context</label>
            </div>
            <div class={styles.settingItem}>
              <Switch
                checked={engagementSettings().supportMultiplePerspectives}
                onChange={checked =>
                  setEngagementSettings(prev => ({ ...prev, supportMultiplePerspectives: checked }))
                }
              />
              <label class={styles.settingLabel}>Support Multiple Perspectives</label>
            </div>
            <div class={styles.settingItem}>
              <Switch
                checked={engagementSettings().participateInEducationalExchanges}
                onChange={checked =>
                  setEngagementSettings(prev => ({
                    ...prev,
                    participateInEducationalExchanges: checked,
                  }))
                }
              />
              <label class={styles.settingLabel}>Participate in Educational Exchanges</label>
            </div>
          </div>
        </div>
      </Card>

      {/* Communities List */}
      <Card class={styles.communitiesCard}>
        <h4 class={styles.sectionTitle}>Available Communities</h4>

        <Show
          when={availableCommunities() && availableCommunities()!.length > 0}
          fallback={
            <div class={styles.emptyState}>
              <div class={styles.emptyIcon}>🌍</div>
              <h5 class={styles.emptyTitle}>No Communities Found</h5>
              <p class={styles.emptyDescription}>
                Try adjusting your search terms or check your network connection.
              </p>
            </div>
          }
        >
          <div class={styles.communitiesList}>
            <For each={availableCommunities()}>
              {community => (
                <div class={styles.communityCard}>
                  <div class={styles.communityHeader}>
                    <div class={styles.communityInfo}>
                      <h5 class={styles.communityName}>{community.name}</h5>
                      <div class={styles.communityBadges}>
                        <Badge
                          variant={getCulturalBadgeVariant(
                            community.culturalContext.sensitivityLevel
                          )}
                        >
                          Cultural Level {community.culturalContext.sensitivityLevel}
                        </Badge>
                        <Badge variant="info">
                          {community.culturalContext.educationalValue} educational value
                        </Badge>
                        <Show when={community.isJoined}>
                          <Badge variant="success">Joined</Badge>
                        </Show>
                      </div>
                    </div>
                    <div class={styles.communityActions}>
                      <Show
                        when={!community.isJoined}
                        fallback={
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleLeaveCommunity(community.id)}
                          >
                            Leave
                          </Button>
                        }
                      >
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleJoinCommunity(community)}
                          disabled={isJoining()}
                        >
                          {isJoining() ? 'Joining...' : 'Join'}
                        </Button>
                      </Show>
                    </div>
                  </div>

                  <div class={styles.communityContent}>
                    <p class={styles.communityDescription}>{community.description}</p>

                    <div class={styles.communityMeta}>
                      <div class={styles.metaItem}>
                        <span class={styles.metaLabel}>Origin:</span>
                        <span class={styles.metaValue}>{community.culturalOrigin}</span>
                      </div>
                      <div class={styles.metaItem}>
                        <span class={styles.metaLabel}>Members:</span>
                        <span class={styles.metaValue}>{community.memberCount}</span>
                      </div>
                      <div class={styles.metaItem}>
                        <span class={styles.metaLabel}>Last Activity:</span>
                        <span class={styles.metaValue}>{community.lastActivity}</span>
                      </div>
                    </div>

                    {/* Cultural Context */}
                    <Show when={props.showEducationalContext !== false}>
                      <div class={styles.culturalContext}>
                        <h6 class={styles.contextTitle}>Cultural Context</h6>
                        <p class={styles.contextDescription}>
                          {community.culturalContext.description}
                        </p>
                        <div class={styles.traditionalKnowledge}>
                          <span class={styles.knowledgeLabel}>Traditional Knowledge Areas:</span>
                          <div class={styles.knowledgeList}>
                            <For each={community.culturalContext.traditionalKnowledge}>
                              {knowledge => <Badge variant="neutral">{knowledge}</Badge>}
                            </For>
                          </div>
                        </div>
                      </div>
                    </Show>

                    {/* Educational Resources */}
                    <div class={styles.educationalResources}>
                      <h6 class={styles.resourcesTitle}>Educational Resources</h6>
                      <div class={styles.resourcesList}>
                        <For each={community.educationalResources}>
                          {resource => (
                            <div class={styles.resourceItem}>
                              <span class={styles.resourceIcon}>📚</span>
                              <span class={styles.resourceName}>{resource}</span>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>

                    {/* Community Protocols */}
                    <div class={styles.communityProtocols}>
                      <h6 class={styles.protocolsTitle}>Community Protocols</h6>
                      <p class={styles.protocolsDescription}>
                        Guidelines for respectful engagement (informational only):
                      </p>
                      <ul class={styles.protocolsList}>
                        <For each={community.protocols}>
                          {protocol => <li class={styles.protocolItem}>{protocol}</li>}
                        </For>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Card>

      {/* Educational Modal */}
      <Show when={showEducationalModal() && selectedCommunity()}>
        <div class={styles.modalOverlay} onClick={() => setShowEducationalModal(false)}>
          <div class={styles.educationalModal} onClick={e => e.stopPropagation()}>
            <div class={styles.modalHeader}>
              <h4 class={styles.modalTitle}>Joined {selectedCommunity()?.name}</h4>
              <button class={styles.modalClose} onClick={() => setShowEducationalModal(false)}>
                ×
              </button>
            </div>
            <div class={styles.modalContent}>
              <div class={styles.welcomeMessage}>
                <p>
                  Welcome to the {selectedCommunity()?.name} community! You now have access to
                  educational resources and can participate in cultural information sharing.
                </p>
              </div>
              <div class={styles.educationalInfo}>
                <h5>What you can do:</h5>
                <ul>
                  <li>Access educational resources and cultural context</li>
                  <li>Participate in respectful cultural information exchange</li>
                  <li>Learn about traditional knowledge and practices</li>
                  <li>Contribute to community educational initiatives</li>
                </ul>
              </div>
              <div class={styles.sovereigntyInfo}>
                <h5>Community Sovereignty:</h5>
                <p>
                  This community maintains sovereignty over their cultural information. All content
                  is shared for educational purposes to promote understanding and preserve cultural
                  knowledge.
                </p>
              </div>
            </div>
            <div class={styles.modalActions}>
              <Button variant="primary" onClick={() => setShowEducationalModal(false)}>
                Start Learning
              </Button>
            </div>
          </div>
        </div>
      </Show>

      {/* Anti-Censorship Information */}
      <Show when={props.showEducationalContext !== false}>
        <Card class={styles.antiCensorshipCard}>
          <div class={styles.antiCensorshipInfo}>
            <div class={styles.infoHeader}>
              <span class={styles.infoIcon}>🛡️</span>
              <h5 class={styles.infoTitle}>Information Freedom & Community Sovereignty</h5>
            </div>
            <div class={styles.infoContent}>
              <p class={styles.infoDescription}>
                AlLibrary respects community sovereignty while ensuring information freedom.
                Cultural communities control their narrative and educational resources, but all
                information remains accessible for learning and understanding.
              </p>
              <ul class={styles.principlesList}>
                <li>Communities provide educational context, not access restrictions</li>
                <li>Cultural information enhances understanding without blocking content</li>
                <li>Multiple perspectives and alternative narratives are supported</li>
                <li>Educational resources flow freely for global learning</li>
              </ul>
            </div>
          </div>
        </Card>
      </Show>
    </div>
  );
};
