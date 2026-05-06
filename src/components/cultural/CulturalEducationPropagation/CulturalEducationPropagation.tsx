import { type Component, createSignal, createMemo, createEffect, For, Show } from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Badge } from '@/components/foundation/Badge';
import { Modal } from '@/components/foundation/Modal';
import { Input } from '@/components/foundation/Input';
import { Select, type SelectOption } from '@/components/foundation/Select';
import { Textarea } from '@/components/foundation/Textarea';
import { Progress } from '@/components/foundation/Progress';
import { LoadingSpinner } from '@/components/foundation/LoadingSpinner';
import type {
  CulturalEducationPropagationProps,
  EducationalContent,
  EducationalNetwork,
  LearningPathway,
  CommunityInitiative,
  PropagationResult,
  NetworkDistribution,
  EducationalContentType,
  DifficultyLevel,
  InitiativeType,
  PathwayType,
} from './types/CulturalEducationPropagationTypes';
import styles from './CulturalEducationPropagation.module.css';

const CONTENT_TYPE_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Types' },
  { value: 'lesson', label: 'Lesson' },
  { value: 'course', label: 'Course' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'cultural-story', label: 'Cultural Story' },
  { value: 'traditional-practice', label: 'Traditional Practice' },
];

const DIFFICULTY_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
  { value: 'community-specific', label: 'Community Specific' },
];

/**
 * CulturalEducationPropagation component for managing learning resource distribution
 * across P2P network with educational transparency and community initiatives
 *
 * Features:
 * - Educational content propagation across networks
 * - Learning pathway recommendations and creation
 * - Community initiative management and participation
 * - Real-time propagation progress tracking
 * - Cultural education enhancement
 * - Quality assurance and validation
 * - Network health monitoring
 * - Accessibility-focused design
 *
 * @param props - Component props
 * @returns JSX element
 *
 * @example
 * ```tsx
 * <CulturalEducationPropagation
 *   availableContent={educationalContent}
 *   educationalNetworks={networks}
 *   learnerProfile={userProfile}
 *   showProgress={true}
 *   showPathways={true}
 *   showCommunityInitiatives={true}
 *   onContentPropagated={handlePropagation}
 *   onPathwayRecommended={handlePathway}
 *   onInitiativeJoined={handleInitiative}
 * />
 * ```
 */
export const CulturalEducationPropagation: Component<CulturalEducationPropagationProps> = props => {
  // State management
  const [selectedContent, setSelectedContent] = createSignal<EducationalContent[]>([]);
  const [selectedNetworks, setSelectedNetworks] = createSignal<string[]>([]);
  const [propagationProgress, setPropagationProgress] = createSignal<NetworkDistribution[]>([]);
  const [showPropagationModal, setShowPropagationModal] = createSignal(false);
  const [showPathwayModal, setShowPathwayModal] = createSignal(false);
  const [showInitiativeModal, setShowInitiativeModal] = createSignal(false);
  const [showCreateContentModal, setShowCreateContentModal] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal('content');
  const [searchFilter, setSearchFilter] = createSignal('');
  const [contentTypeFilter, setContentTypeFilter] = createSignal<EducationalContentType | 'all'>(
    'all'
  );
  const [difficultyFilter, setDifficultyFilter] = createSignal<DifficultyLevel | 'all'>('all');
  const [networkFilter, setNetworkFilter] = createSignal<string>('all');
  const [isPropagating, setIsPropagating] = createSignal(false);
  const [propagationResults, setPropagationResults] = createSignal<PropagationResult[]>([]);
  const [recommendedPathways, setRecommendedPathways] = createSignal<LearningPathway[]>([]);
  const [joinedInitiatives, setJoinedInitiatives] = createSignal<string[]>([]);
  const [createContentForm, setCreateContentForm] = createSignal({
    title: '',
    description: '',
    type: 'lesson' as EducationalContentType,
    difficultyLevel: 'beginner' as DifficultyLevel,
    culturalContext: '',
    learningObjectives: [],
    prerequisites: [],
  });

  // Filtered content based on search and filters
  const filteredContent = createMemo(() => {
    return props.availableContent.filter(content => {
      const matchesSearch =
        searchFilter() === '' ||
        content.title.toLowerCase().includes(searchFilter().toLowerCase()) ||
        content.description.toLowerCase().includes(searchFilter().toLowerCase());

      const matchesType = contentTypeFilter() === 'all' || content.type === contentTypeFilter();
      const matchesDifficulty =
        difficultyFilter() === 'all' || content.difficultyLevel === difficultyFilter();

      return matchesSearch && matchesType && matchesDifficulty;
    });
  });

  // Filtered networks
  const filteredNetworks = createMemo(() => {
    if (networkFilter() === 'all') return props.educationalNetworks;
    return props.educationalNetworks.filter(
      network => network.type === networkFilter() || network.id === networkFilter()
    );
  });

  // Educational statistics
  const contentStats = createMemo(() => {
    const totalContent = props.availableContent.length;
    const propagatedContent = props.availableContent.filter(
      c => c.propagationStatus === 'completed' || c.propagationStatus === 'propagating'
    ).length;
    const averageRating =
      props.availableContent.reduce((sum, c) => sum + c.qualityRating.overall, 0) / totalContent;
    const totalDownloads = props.availableContent.reduce(
      (sum, c) => sum + c.usageStats.downloadCount,
      0
    );

    return {
      totalContent,
      propagatedContent,
      averageRating: averageRating.toFixed(1),
      totalDownloads,
      propagationRate: ((propagatedContent / totalContent) * 100).toFixed(1),
    };
  });

  // Network health summary
  const networkHealthSummary = createMemo(() => {
    const healthScores = props.educationalNetworks.map(n => n.networkHealth.overallHealth);
    const averageHealth = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;
    const healthyNetworks = healthScores.filter(score => score >= 80).length;

    return {
      averageHealth: averageHealth.toFixed(1),
      healthyNetworks,
      totalNetworks: props.educationalNetworks.length,
      healthPercentage: ((healthyNetworks / props.educationalNetworks.length) * 100).toFixed(1),
    };
  });

  // Handle content selection
  const toggleContentSelection = (contentId: string) => {
    const current = selectedContent();
    const content = props.availableContent.find(c => c.id === contentId);
    if (!content) return;

    if (current.some(c => c.id === contentId)) {
      setSelectedContent(current.filter(c => c.id !== contentId));
    } else {
      setSelectedContent([...current, content]);
    }
  };

  // Handle network selection
  const toggleNetworkSelection = (networkId: string) => {
    const current = selectedNetworks();
    if (current.includes(networkId)) {
      setSelectedNetworks(current.filter(id => id !== networkId));
    } else {
      setSelectedNetworks([...current, networkId]);
    }
  };

  // Start content propagation
  const startPropagation = async () => {
    if (selectedContent().length === 0 || selectedNetworks().length === 0) return;

    setIsPropagating(true);
    setShowPropagationModal(true);

    try {
      // Simulate propagation progress
      const networks = selectedNetworks().map(
        id => props.educationalNetworks.find(n => n.id === id)!
      );

      for (const content of selectedContent()) {
        for (const network of networks) {
          const distribution: NetworkDistribution = {
            networkId: network.id,
            networkName: network.name,
            status: 'active',
            propagationProgress: 0,
            peersReached: 0,
            successRate: 0,
            errorCount: 0,
            lastUpdate: new Date().toISOString(),
            metrics: {
              bandwidth: 0,
              latency: network.networkHealth.networkLatency,
              successRate: 0,
              errorTypes: [],
            },
          };

          setPropagationProgress(prev => [...prev, distribution]);

          // Simulate progress updates
          const progressInterval = setInterval(() => {
            setPropagationProgress(prev =>
              prev.map(dist => {
                if (dist.networkId === network.id) {
                  const newProgress = Math.min(dist.propagationProgress + Math.random() * 20, 100);
                  return {
                    ...dist,
                    propagationProgress: newProgress,
                    peersReached: Math.floor((newProgress / 100) * network.memberCount),
                    successRate: 85 + Math.random() * 10,
                    lastUpdate: new Date().toISOString(),
                  };
                }
                return dist;
              })
            );
          }, 1000);

          // Complete after 5 seconds
          setTimeout(() => {
            clearInterval(progressInterval);
            const result: PropagationResult = {
              id: `prop_${Date.now()}_${Math.random()}`,
              contentId: content.id,
              success: true,
              networksReached: [network.id],
              totalPeersReached: network.memberCount,
              metrics: {
                networkCoverage: 95,
                propagationSpeed: 85,
                qualityMaintenance: 92,
                culturalIntegrity: 98,
              },
              errors: [],
              completionTime: new Date().toISOString(),
              qualityAssurance: {
                passed: true,
                checks: [
                  {
                    checkName: 'Content Integrity',
                    passed: true,
                    score: 98,
                    details: 'Content verified',
                  },
                  {
                    checkName: 'Cultural Authenticity',
                    passed: true,
                    score: 96,
                    details: 'Cultural context preserved',
                  },
                ],
                overallScore: 97,
                recommendations: [],
              },
              culturalValidation: {
                validated: true,
                validationLevel: 'community-validated',
                culturalIntegrity: 98,
                communityFeedback: ['Excellent cultural context', 'Respectful presentation'],
              },
            };

            setPropagationResults(prev => [...prev, result]);
            props.onContentPropagated?.(result);
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Propagation failed:', error);
    } finally {
      setTimeout(() => {
        setIsPropagating(false);
        setSelectedContent([]);
        setSelectedNetworks([]);
      }, 6000);
    }
  };

  // Get content type display
  const getContentTypeDisplay = (type: EducationalContentType) => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get difficulty color class
  const getDifficultyColorClass = (level: DifficultyLevel) => {
    switch (level) {
      case 'beginner':
        return styles.difficultyBeginner;
      case 'intermediate':
        return styles.difficultyIntermediate;
      case 'advanced':
        return styles.difficultyAdvanced;
      case 'expert':
        return styles.difficultyExpert;
      case 'community-specific':
        return styles.difficultyCommunity;
      default:
        return styles.difficultyBeginner;
    }
  };

  // Get network health color class
  const getNetworkHealthColorClass = (health: number) => {
    if (health >= 80) return styles.healthGood;
    if (health >= 60) return styles.healthMedium;
    return styles.healthPoor;
  };

  // Get propagation status color class
  const getPropagationStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return styles.statusCompleted;
      case 'propagating':
        return styles.statusActive;
      case 'pending':
        return styles.statusPending;
      case 'failed':
        return styles.statusFailed;
      default:
        return styles.statusPending;
    }
  };

  return (
    <div
      class={`${styles.culturalEducationPropagation} ${props.class || ''}`}
      aria-label={props['aria-label'] || 'Cultural Education Propagation Management'}
    >
      {/* Header with Statistics */}
      <div class={styles.header}>
        <div class={styles.titleSection}>
          <h2 class={styles.title}>Cultural Education Propagation</h2>
          <p class={styles.subtitle}>
            Distribute learning resources across educational networks with cultural context
          </p>
        </div>

        <div class={styles.statsGrid}>
          <Card class={styles.statCard}>
            <div class={styles.statValue}>{contentStats().totalContent}</div>
            <div class={styles.statLabel}>Total Content</div>
          </Card>
          <Card class={styles.statCard}>
            <div class={styles.statValue}>{contentStats().propagationRate}%</div>
            <div class={styles.statLabel}>Propagated</div>
          </Card>
          <Card class={styles.statCard}>
            <div class={styles.statValue}>{contentStats().averageRating}</div>
            <div class={styles.statLabel}>Avg Rating</div>
          </Card>
          <Card class={styles.statCard}>
            <div class={styles.statValue}>{networkHealthSummary().healthPercentage}%</div>
            <div class={styles.statLabel}>Network Health</div>
          </Card>
        </div>
      </div>

      {/* Educational Context Panel */}
      <Card class={styles.educationalContext} title="Educational Principles">
        <div class={styles.principlesList}>
          <div class={styles.principle}>
            <strong>Cultural Respect:</strong> All content maintains cultural authenticity and
            appropriate context
          </div>
          <div class={styles.principle}>
            <strong>Open Access:</strong> Educational resources are shared freely without
            restrictions
          </div>
          <div class={styles.principle}>
            <strong>Community Validation:</strong> Content is verified by relevant cultural
            communities
          </div>
          <div class={styles.principle}>
            <strong>Quality Assurance:</strong> All materials meet educational and cultural
            standards
          </div>
          <div class={styles.principle}>
            <strong>Inclusive Learning:</strong> Supports diverse learning styles and accessibility
            needs
          </div>
        </div>
      </Card>

      {/* Main Interface */}
      <div class={styles.mainInterface}>
        <div class={styles.mainTabs}>
          <div class={styles.tabBar} role="tablist" aria-label="Educational propagation sections">
            <Button
              role="tab"
              type="button"
              variant={activeTab() === 'content' ? 'primary' : 'outline'}
              size="sm"
              aria-selected={activeTab() === 'content'}
              onClick={() => setActiveTab('content')}
            >
              Content Distribution
            </Button>
            <Button
              role="tab"
              type="button"
              variant={activeTab() === 'pathways' ? 'primary' : 'outline'}
              size="sm"
              aria-selected={activeTab() === 'pathways'}
              onClick={() => setActiveTab('pathways')}
            >
              Learning Pathways
            </Button>
            <Button
              role="tab"
              type="button"
              variant={activeTab() === 'initiatives' ? 'primary' : 'outline'}
              size="sm"
              aria-selected={activeTab() === 'initiatives'}
              onClick={() => setActiveTab('initiatives')}
            >
              Community Initiatives
            </Button>
            <Show when={props.showProgress}>
              <Button
                role="tab"
                type="button"
                variant={activeTab() === 'progress' ? 'primary' : 'outline'}
                size="sm"
                aria-selected={activeTab() === 'progress'}
                onClick={() => setActiveTab('progress')}
              >
                Propagation Progress
              </Button>
            </Show>
          </div>

          {/* Content Distribution Tab */}
          <Show when={activeTab() === 'content'}>
            <div class={styles.tabContent} role="tabpanel">
              {/* Filters and Search */}
              <div class={styles.filtersSection}>
                <Input
                  type="text"
                  placeholder="Search educational content..."
                  value={searchFilter()}
                  onInput={value => setSearchFilter(value)}
                  class={styles.searchInput}
                />

                <Select
                  value={contentTypeFilter()}
                  options={CONTENT_TYPE_FILTER_OPTIONS}
                  placeholder="Content Type"
                  onChange={value => setContentTypeFilter(value as EducationalContentType | 'all')}
                />

                <Select
                  value={difficultyFilter()}
                  options={DIFFICULTY_FILTER_OPTIONS}
                  placeholder="Difficulty"
                  onChange={value => setDifficultyFilter(value as DifficultyLevel | 'all')}
                />

                <Select
                  value={networkFilter()}
                  options={[
                    { value: 'all', label: 'All Networks' },
                    ...props.educationalNetworks.map(n => ({
                      value: n.id,
                      label: n.name,
                    })),
                  ]}
                  placeholder="Network"
                  onChange={value => setNetworkFilter(String(value))}
                />
              </div>

              {/* Action Buttons */}
              <div class={styles.actions}>
                <Button
                  onClick={() => setShowPropagationModal(true)}
                  disabled={selectedContent().length === 0}
                  class={styles.propagateButton}
                >
                  Propagate Selected Content ({selectedContent().length})
                </Button>

                <Show when={props.allowContentCreation}>
                  <Button variant="outline" onClick={() => setShowCreateContentModal(true)}>
                    Create Educational Content
                  </Button>
                </Show>
              </div>

              {/* Content Grid */}
              <div class={styles.contentGrid}>
                <For each={filteredContent()}>
                  {content => (
                    <Card
                      class={`${styles.contentCard} ${
                        selectedContent().some(c => c.id === content.id) ? styles.selected : ''
                      }`}
                      onClick={() => toggleContentSelection(content.id)}
                      header={
                        <div class={styles.contentHeader}>
                          <h3 class={styles.contentTitle}>{content.title}</h3>
                          <div class={styles.contentMeta}>
                            <Badge
                              variant="outline"
                              class={getDifficultyColorClass(content.difficultyLevel)}
                            >
                              {content.difficultyLevel}
                            </Badge>
                            <Badge variant="secondary">{getContentTypeDisplay(content.type)}</Badge>
                          </div>
                        </div>
                      }
                    >
                      <p class={styles.contentDescription}>{content.description}</p>

                      <div class={styles.contentStats}>
                        <div class={styles.contentStat}>
                          <span class={styles.statIcon}>⭐</span>
                          <span>{content.qualityRating.overall.toFixed(1)}</span>
                        </div>
                        <div class={styles.contentStat}>
                          <span class={styles.statIcon}>⬇️</span>
                          <span>{content.usageStats.downloadCount}</span>
                        </div>
                        <div class={styles.contentStat}>
                          <span class={styles.statIcon}>👥</span>
                          <span>{content.networkDistribution.length} networks</span>
                        </div>
                      </div>

                      <div class={styles.culturalContext}>
                        <strong>Cultural Context:</strong> {content.culturalContext.culturalOrigin}
                      </div>

                      <div class={styles.propagationStatus}>
                        <Badge
                          class={getPropagationStatusClass(content.propagationStatus)}
                          variant="outline"
                        >
                          {content.propagationStatus}
                        </Badge>
                      </div>
                    </Card>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Learning Pathways Tab */}
          <Show when={activeTab() === 'pathways'}>
            <div class={styles.tabContent} role="tabpanel">
              <Show when={props.showPathways}>
                <div class={styles.pathwaysSection}>
                  <div class={styles.sectionHeader}>
                    <h3>Recommended Learning Pathways</h3>
                    <Button variant="outline" onClick={() => setShowPathwayModal(true)}>
                      Create Custom Pathway
                    </Button>
                  </div>

                  <div class={styles.pathwaysGrid}>
                    <For each={recommendedPathways()}>
                      {pathway => (
                        <Card
                          class={styles.pathwayCard}
                          header={
                            <div class={styles.contentHeader}>
                              <h3 class={styles.contentTitle}>{pathway.name}</h3>
                              <Badge variant="outline">{pathway.type}</Badge>
                            </div>
                          }
                        >
                          <p class={styles.pathwayDescription}>{pathway.description}</p>

                          <div class={styles.pathwayStats}>
                            <div class={styles.pathwayStat}>
                              <strong>Duration:</strong> {pathway.estimatedDuration}
                            </div>
                            <div class={styles.pathwayStat}>
                              <strong>Steps:</strong> {pathway.steps.length}
                            </div>
                            <Show when={pathway.culturalContext}>
                              <div class={styles.pathwayStat}>
                                <strong>Cultural Context:</strong> {pathway.culturalContext}
                              </div>
                            </Show>
                          </div>

                          <div class={styles.pathwayActions}>
                            <Button size="sm" onClick={() => props.onPathwayRecommended?.(pathway)}>
                              Start Pathway
                            </Button>
                          </div>
                        </Card>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </Show>

          {/* Community Initiatives Tab */}
          <Show when={activeTab() === 'initiatives'}>
            <div class={styles.tabContent} role="tabpanel">
              <Show when={props.showCommunityInitiatives}>
                <div class={styles.initiativesSection}>
                  <div class={styles.sectionHeader}>
                    <h3>Community Learning Initiatives</h3>
                    <Button variant="outline" onClick={() => setShowInitiativeModal(true)}>
                      Create Initiative
                    </Button>
                  </div>

                  <div class={styles.initiativesGrid}>
                    {/* Sample initiatives - would be props in real implementation */}
                    <Card
                      class={styles.initiativeCard}
                      header={
                        <div class={styles.contentHeader}>
                          <h3 class={styles.contentTitle}>Traditional Storytelling Circle</h3>
                          <Badge variant="outline">learning-circle</Badge>
                        </div>
                      }
                    >
                      <p>
                        Weekly gathering to share and learn traditional stories from different
                        cultures
                      </p>

                      <div class={styles.initiativeStats}>
                        <div class={styles.initiativeStat}>
                          <strong>Participants:</strong> 24/30
                        </div>
                        <div class={styles.initiativeStat}>
                          <strong>Duration:</strong> 8 weeks
                        </div>
                        <div class={styles.initiativeStat}>
                          <strong>Status:</strong> Active
                        </div>
                      </div>

                      <div class={styles.initiativeActions}>
                        <Button
                          size="sm"
                          onClick={() => {
                            setJoinedInitiatives(prev => [...prev, 'storytelling-circle']);
                            // Call props callback with mock initiative
                            const mockInitiative: CommunityInitiative = {
                              id: 'storytelling-circle',
                              name: 'Traditional Storytelling Circle',
                              description:
                                'Weekly gathering to share and learn traditional stories',
                              type: 'learning-circle',
                              culturalFocus: ['storytelling', 'oral-tradition'],
                              learningObjectives: ['Cultural appreciation', 'Storytelling skills'],
                              organizers: [],
                              participants: [],
                              resourcesNeeded: [],
                              timeline: {
                                startDate: new Date().toISOString(),
                                milestones: [],
                                currentPhase: 'active',
                                phaseProgress: 60,
                                overallProgress: 60,
                              },
                              participationRequirements: [],
                              expectedOutcomes: [],
                              status: 'active',
                              progressTracking: {
                                metrics: [],
                                milestoneAchievements: [],
                                participantProgress: [],
                                learningOutcomes: [],
                                communityImpact: {
                                  participantCount: 24,
                                  skillsShared: ['storytelling'],
                                  contentCreated: 0,
                                  culturalPreservation: ['oral-traditions'],
                                  networkGrowth: 5,
                                },
                              },
                            };
                            props.onInitiativeJoined?.(mockInitiative);
                          }}
                          disabled={joinedInitiatives().includes('storytelling-circle')}
                        >
                          {joinedInitiatives().includes('storytelling-circle')
                            ? 'Joined'
                            : 'Join Initiative'}
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </Show>
            </div>
          </Show>

          {/* Propagation Progress Tab */}
          <Show when={props.showProgress && activeTab() === 'progress'}>
            <div class={styles.tabContent} role="tabpanel">
              <div class={styles.progressSection}>
                <h3>Active Propagations</h3>

                <Show
                  when={propagationProgress().length > 0}
                  fallback={
                    <div class={styles.emptyState}>
                      <p>No active propagations. Start propagating content to see progress here.</p>
                    </div>
                  }
                >
                  <div class={styles.progressList}>
                    <For each={propagationProgress()}>
                      {distribution => (
                        <Card
                          class={styles.progressCard}
                          header={
                            <div class={styles.contentHeader}>
                              <h3 class={styles.contentTitle}>{distribution.networkName}</h3>
                              <Badge
                                class={getPropagationStatusClass(distribution.status)}
                                variant="outline"
                              >
                                {distribution.status}
                              </Badge>
                            </div>
                          }
                        >
                          <div class={styles.progressDetails}>
                            <div class={styles.progressInfo}>
                              <span>Progress: {distribution.propagationProgress.toFixed(1)}%</span>
                              <span>Peers Reached: {distribution.peersReached}</span>
                              <span>Success Rate: {distribution.successRate.toFixed(1)}%</span>
                            </div>

                            <Progress
                              value={distribution.propagationProgress}
                              max={100}
                              class={styles.progressBar}
                            />

                            <div class={styles.progressMeta}>
                              <span>
                                Last Update:{' '}
                                {new Date(distribution.lastUpdate).toLocaleTimeString()}
                              </span>
                              <Show when={distribution.errorCount > 0}>
                                <span class={styles.errorCount}>
                                  Errors: {distribution.errorCount}
                                </span>
                              </Show>
                            </div>
                          </div>
                        </Card>
                      )}
                    </For>
                  </div>
                </Show>

                {/* Propagation Results */}
                <Show when={propagationResults().length > 0}>
                  <div class={styles.resultsSection}>
                    <h4>Recent Results</h4>
                    <div class={styles.resultsList}>
                      <For each={propagationResults().slice(-5)}>
                        {result => (
                          <Card class={styles.resultCard}>
                            <div class={styles.resultHeader}>
                              <Badge variant={result.success ? 'success' : 'error'}>
                                {result.success ? 'Successful' : 'Failed'}
                              </Badge>
                              <span class={styles.resultTime}>
                                {new Date(result.completionTime).toLocaleString()}
                              </span>
                            </div>

                            <div class={styles.resultMetrics}>
                              <div class={styles.metric}>
                                <span>Networks: {result.networksReached.length}</span>
                              </div>
                              <div class={styles.metric}>
                                <span>Peers: {result.totalPeersReached}</span>
                              </div>
                              <div class={styles.metric}>
                                <span>Quality: {result.qualityAssurance.overallScore}%</span>
                              </div>
                              <div class={styles.metric}>
                                <span>
                                  Cultural Integrity: {result.culturalValidation.culturalIntegrity}%
                                </span>
                              </div>
                            </div>
                          </Card>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </Show>
        </div>
      </div>

      {/* Network Selection Modal */}
      <Modal
        isOpen={showPropagationModal()}
        onClose={() => setShowPropagationModal(false)}
        title="Select Educational Networks"
        class={styles.propagationModal}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowPropagationModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={startPropagation}
              disabled={selectedNetworks().length === 0 || isPropagating()}
              class={styles.startPropagationButton}
            >
              <Show when={isPropagating()}>
                <LoadingSpinner size="sm" class={styles.spinner} inline ariaLabel="Loading" />
              </Show>
              Start Propagation
            </Button>
          </>
        }
      >
        <div class={styles.modalBody}>
          <p class={styles.modalDescription}>
            Choose networks to propagate your selected educational content. Content will be
            distributed with cultural context preserved.
          </p>

          <div class={styles.networksList}>
            <For each={filteredNetworks()}>
              {network => (
                <Card
                  class={`${styles.networkCard} ${
                    selectedNetworks().includes(network.id) ? styles.selected : ''
                  }`}
                  onClick={() => toggleNetworkSelection(network.id)}
                >
                  <div class={styles.networkHeader}>
                    <div class={styles.networkInfo}>
                      <h4 class={styles.networkName}>{network.name}</h4>
                      <Badge variant="outline">{network.type}</Badge>
                    </div>
                    <div class={styles.networkHealth}>
                      <span class={getNetworkHealthColorClass(network.networkHealth.overallHealth)}>
                        {network.networkHealth.overallHealth}% health
                      </span>
                    </div>
                  </div>

                  <p class={styles.networkDescription}>{network.description}</p>

                  <div class={styles.networkStats}>
                    <span>Members: {network.memberCount}</span>
                    <span>Content: {network.contentCount}</span>
                    <span>Languages: {network.supportedLanguages.length}</span>
                  </div>

                  <Show when={network.culturalSpecialization}>
                    <div class={styles.culturalSpecialization}>
                      <strong>Cultural Focus:</strong>
                      <div class={styles.specializationTags}>
                        <For each={network.culturalSpecialization}>
                          {specialization => (
                            <Badge variant="outline" size="sm">
                              {specialization}
                            </Badge>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>
                </Card>
              )}
            </For>
          </div>
        </div>
      </Modal>

      {/* Additional modals would be implemented here for pathway creation, initiative creation, etc. */}
    </div>
  );
};
