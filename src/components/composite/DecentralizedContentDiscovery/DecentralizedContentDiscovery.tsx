/**
 * Decentralized Content Discovery Component
 *
 * A comprehensive P2P content discovery interface that provides alternative
 * source finding, cultural context integration, and anti-censorship capabilities.
 *
 * ANTI-CENSORSHIP CORE: P2P content discovery across multiple networks with
 * educational cultural context and resistance to information blocking.
 */

import { Component, createSignal, Show, For, onMount } from 'solid-js';
import { Card, Button, Badge, Modal, Input } from '../../foundation';
import {
  Search,
  Globe,
  Shield,
  Users,
  Brain,
  BookOpen,
  Filter,
  Settings,
  Download,
  Clock,
} from 'lucide-solid';
import { p2pNetworkService } from '../../../services/network/p2pNetworkService';
import type {
  DecentralizedContentDiscoveryProps,
  DiscoveryState,
  DiscoveryResult,
  DiscoveryMethod,
  DiscoveryFilters,
  ContentType,
  LearningOpportunity,
  DiscoverySummary,
} from './DecentralizedContentDiscoveryTypes';
import styles from './DecentralizedContentDiscovery.module.css';

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

const mockDiscoveryMethods: DiscoveryMethod[] = [
  {
    id: 'libp2p-dht',
    name: 'LibP2P DHT',
    type: 'dht',
    capabilities: [
      {
        capability: 'distributed_search',
        confidence: 90,
        description: 'Distributed hash table search',
        requirements: ['libp2p connection'],
        limitations: ['Limited by network size'],
      },
    ],
    networks: [
      {
        name: 'AlLibrary Network',
        version: '1.0',
        type: 'libp2p',
        decentralized: true,
        encrypted: true,
        anonymous: false,
        censorshipResistant: true,
        endpoints: ['multiaddr1', 'multiaddr2'],
        status: 'connected',
        peerCount: 156,
        latency: 120,
        bandwidth: 1024000,
        reliability: 92,
        supportsCulturalRouting: true,
        culturalNodeCount: 45,
        educationalResourceCount: 1200,
      },
    ],
    speed: 85,
    coverage: 90,
    accuracy: 88,
    censorshipResistance: 85,
    anonymityLevel: 30,
    routeAroundBlocking: true,
    educationalContext: ['Distributed systems', 'P2P networks'],
    learningOpportunities: ['DHT principles', 'Decentralized search'],
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const DecentralizedContentDiscovery: Component<
  DecentralizedContentDiscoveryProps
> = props => {
  // ============================================================================
  // COMPONENT STATE
  // ============================================================================

  const [discoveryState, setDiscoveryState] = createSignal<DiscoveryState>({
    isDiscovering: false,
    discoveryProgress: {
      currentPhase: 'initializing',
      completedPhases: [],
      overallProgress: 0,
      methodProgress: [],
      networkProgress: [],
      resultsFound: 0,
      resultsProcessed: 0,
      resultsVerified: 0,
      startTime: new Date(),
      elapsedTime: 0,
    },
    results: [],
    filteredResults: [],
    recentDiscoveries: [],
    savedQueries: [],
    activeTab: {
      id: 'results',
      name: 'Results',
      type: 'results',
      active: true,
    },
    selectedMethods: mockDiscoveryMethods.map(m => m.id),
    filters: {
      contentTypes: ['document', 'book', 'article'],
      languages: ['en'],
      dateRange: {},
      sizeRange: {},
      minQuality: 50,
      minTrust: 60,
      requireVerification: false,
      culturalOrigins: [],
      sensitivityLevels: [1, 2, 3],
      traditionalKnowledge: true,
      sourceTypes: ['peer', 'archive', 'library'],
      networks: [],
      includeAnonymous: true,
      censorshipResistant: props.prioritizeCensorshipResistant ?? true,
      hasAlternativeRoutes: true,
      minAnonymity: 0,
    },
    networkStatus: 'connected',
    connectedNetworks: mockDiscoveryMethods.map(m => m.id),
    availableMethods: mockDiscoveryMethods,
    culturalContext: props.showCulturalContext ?? true,
    culturalFilters: {
      showCulturalContext: true,
      showTraditionalKnowledge: true,
      showEducationalContent: true,
      educationalLevel: ['beginner', 'intermediate'],
      learningObjectives: [],
      culturalInterests: [],
      culturalLanguages: props.culturalLanguages ?? ['en'],
      traditionalScripts: false,
      communityInformation: true,
      informationOnly: true,
      educationalPurpose: true,
      accessUnrestricted: true,
    },
    educationalMode: props.showEducationalContent ?? true,
  });

  const [searchQuery, setSearchQuery] = createSignal(props.initialQuery ?? '');
  const [selectedResult, setSelectedResult] = createSignal<DiscoveryResult | null>(null);
  const [showFiltersModal, setShowFiltersModal] = createSignal(false);
  const [showMethodsModal, setShowMethodsModal] = createSignal(false);
  const [showLearningModal, setShowLearningModal] = createSignal(false);
  const [selectedLearningOpportunity, setSelectedLearningOpportunity] =
    createSignal<LearningOpportunity | null>(null);

  // ============================================================================
  // DISCOVERY LOGIC
  // ============================================================================

  const startDiscovery = async () => {
    const query = searchQuery().trim();
    if (!query) return;

    setDiscoveryState(prev => ({
      ...prev,
      isDiscovering: true,
      discoveryProgress: {
        ...prev.discoveryProgress,
        currentPhase: 'initializing',
        overallProgress: 0,
        startTime: new Date(),
      },
    }));

    try {
      // Simulate discovery process
      await simulateDiscovery(query);
      const results = generateMockDiscoveryResults();

      setDiscoveryState(prev => ({
        ...prev,
        results,
        filteredResults: results,
        isDiscovering: false,
      }));

      props.onResultsFound?.(results);
    } catch (error) {
      console.error('Discovery failed:', error);
      props.onError?.(error instanceof Error ? error.message : 'Discovery failed');
    }
  };

  const simulateDiscovery = async (query: string) => {
    const phases = ['connecting', 'searching', 'verifying', 'filtering', 'ranking'];

    for (let i = 0; i < phases.length; i++) {
      setDiscoveryState(prev => ({
        ...prev,
        discoveryProgress: {
          ...prev.discoveryProgress,
          currentPhase: phases[i] as any,
          overallProgress: ((i + 1) / phases.length) * 100,
        },
      }));

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const generateMockDiscoveryResults = (): DiscoveryResult[] => {
    return [
      {
        resultId: `result-${Date.now()}-1`,
        discoveryId: `discovery-${Date.now()}`,
        timestamp: new Date(),
        content: {
          id: 'content-1',
          title: 'Digital Libraries and Cultural Preservation',
          description:
            'A comprehensive guide to preserving cultural heritage through digital libraries and P2P networks.',
          contentType: 'document' as ContentType,
          language: 'en',
          size: 2048000,
          format: 'PDF',
          checksum: 'sha256:abc123...',
          createdAt: new Date('2023-06-15'),
          modifiedAt: new Date('2023-06-20'),
          discoveredAt: new Date(),
          tags: ['digital libraries', 'cultural preservation', 'P2P'],
          categories: ['Technology', 'Culture'],
          subjects: ['Library Science', 'Cultural Heritage'],
          culturalOrigin: 'Global Indigenous Communities',
          culturalSignificance: 'Community knowledge preservation',
          traditionalCategory: 'Knowledge Systems',
          sensitivityLevel: 2,
        },
        sources: [
          {
            sourceId: 'source-1',
            sourceName: 'Cultural Heritage Archive',
            sourceType: 'archive',
            networkProtocol: 'libp2p',
            nodeId: 'peer-abc123',
            isAnonymous: false,
            trustLevel: 85,
            verificationStatus: 'community_verified',
            historicalAccuracy: 92,
            availability: 95,
            responseTime: 120,
            bandwidth: 1024000,
            culturalAffiliation: 'Indigenous Digital Alliance',
            communityRole: 'Knowledge Keeper',
            traditionalKnowledgeKeeper: true,
            censorshipResistance: 88,
            routeStability: 90,
            hasAlternativeRoutes: true,
          },
        ],
        discoveryMethod: 'libp2p-dht',
        networkPath: [
          {
            hopId: 'hop-1',
            nodeId: 'node-1',
            protocol: 'libp2p',
            isAnonymous: false,
            isEncrypted: true,
            latency: 120,
            culturalRouting: true,
            communityNode: true,
            educationalHub: false,
            trustLevel: 85,
            securityLevel: 90,
            verificationMethod: 'community_verification',
          },
        ],
        verificationLevel: 'community',
        relevanceScore: 92,
        qualityScore: 88,
        trustScore: 85,
        culturalContext: {
          culturalOrigin: 'Global Indigenous Communities',
          culturalGroup: 'Digital Preservation Alliance',
          traditionalName: 'Knowledge Keepers Network',
          significance: {
            level: 2,
            type: 'traditional',
            description: 'Important for preserving traditional knowledge systems',
            educationalContext: [
              'Learn about digital preservation methods',
              'Understand community-driven knowledge systems',
            ],
            historicalImportance: 'Represents modern adaptation of traditional knowledge sharing',
          },
          protocols: [
            {
              protocolType: 'sharing_protocol',
              description: 'Community-approved sharing guidelines',
              educationalValue: 'Learn respectful knowledge sharing practices',
              learningOpportunity: 'Understanding cultural protocols in digital spaces',
              communityInformation: 'Shared with community blessing for educational purposes',
            },
          ],
          context: [
            'This content represents collaborative efforts between indigenous communities and technologists',
            'Focuses on preserving traditional knowledge through modern P2P networks',
          ],
          educationalResources: [
            {
              resourceId: 'edu-1',
              title: 'Introduction to Cultural Digital Preservation',
              type: 'course',
              description: 'Learn the basics of preserving cultural heritage digitally',
              url: 'learning://cultural-preservation-101',
              difficulty: 'beginner',
            },
          ],
          learningPathways: [
            {
              pathwayId: 'pathway-1',
              name: 'Cultural Technology Bridge',
              description: 'Learn to bridge traditional knowledge with modern technology',
              steps: ['Cultural awareness', 'Technology foundations', 'Ethical implementation'],
              duration: '4 weeks',
              prerequisites: ['Basic computer literacy'],
            },
          ],
          culturalEducation: [
            'Understanding the importance of community consent in knowledge sharing',
            'Learning about traditional knowledge systems and their digital representation',
          ],
          communityInformation: {
            communityName: 'Indigenous Digital Alliance',
            role: 'Knowledge Preservation',
            information:
              'Dedicated to preserving indigenous knowledge through respectful digital means',
            educationalContext: 'Promotes learning while respecting cultural boundaries',
            learningOpportunities: [
              'Cultural awareness workshops',
              'Digital preservation training',
            ],
          },
          traditionKeepers: ['Elder Maria Santos', 'Knowledge Keeper John Crow Feather'],
          informationOnly: true,
          educationalPurpose: true,
          accessGranted: true,
        },
        censorshipRisk: {
          riskLevel: 'low',
          riskScore: 15,
          geographicRisk: [],
          protocolRisk: [],
          contentRisk: [],
          mitigationStrategies: [
            {
              strategyId: 'strategy-1',
              name: 'P2P Distribution',
              type: 'redundancy',
              effectiveness: 95,
              requirements: ['Multiple peers'],
              limitations: ['Requires network participants'],
              tradeoffs: ['Higher bandwidth usage'],
              educationalContext: ['Learn about decentralized distribution'],
              learningResources: ['P2P networking courses'],
            },
          ],
          alternativeRoutes: ['IPFS mirror', 'TOR hidden service'],
          backupMethods: ['Local archive', 'Community mirrors'],
          censorshipEducation: [
            'P2P networks resist censorship through decentralization',
            'Multiple copies across many nodes prevent single points of failure',
          ],
          resistanceEducation: [
            'Learn how distributed networks maintain information availability',
            'Understand the principles of censorship-resistant systems',
          ],
          rightsEducation: [
            'Information freedom is a fundamental human right',
            'Communities have the right to preserve and share their knowledge',
          ],
        },
        alternativeSources: [],
        routeResilience: 88,
        learningOpportunities: [
          {
            opportunityId: 'learn-1',
            title: 'Cultural Digital Preservation',
            description: 'Learn how to respectfully preserve cultural knowledge in digital formats',
            type: 'course',
            resources: ['Video tutorials', 'Interactive exercises', 'Community discussions'],
            difficulty: 'intermediate',
          },
        ],
        relatedContent: [
          {
            contentId: 'related-1',
            title: 'Community-Driven Digital Archives',
            relevance: 85,
            contentType: 'article',
            culturalConnection: 'Similar focus on community-controlled preservation',
          },
        ],
      },
    ];
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSearch = () => {
    if (searchQuery().trim()) {
      startDiscovery();
    }
  };

  const handleResultClick = (result: DiscoveryResult) => {
    setSelectedResult(result);
    props.onResultSelected?.(result);
  };

  const handleLearningOpportunityClick = (opportunity: LearningOpportunity) => {
    setSelectedLearningOpportunity(opportunity);
    setShowLearningModal(true);
    props.onLearningOpportunitySelected?.(opportunity);
  };

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  onMount(() => {
    if (props.autoStart && props.initialQuery) {
      startDiscovery();
    }
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div class={styles.discoveryContainer}>
      {/* Header Section */}
      <Card class={styles.headerCard}>
        <div class={styles.headerContent}>
          <div class={styles.headerLeft}>
            <div class={styles.headerIcon}>
              <Globe size={32} />
            </div>
            <div class={styles.headerText}>
              <h2 class={styles.title}>Decentralized Content Discovery</h2>
              <p class={styles.subtitle}>
                Discover content across P2P networks with cultural context and anti-censorship
                capabilities
              </p>
            </div>
          </div>
          <div class={styles.headerRight}>
            <Badge variant="success" class={styles.statusBadge}>
              <Shield size={16} />
              Anti-Censorship Active
            </Badge>
          </div>
        </div>

        {/* Search Interface */}
        <div class={styles.searchSection}>
          <div class={styles.searchRow}>
            <Input
              value={searchQuery()}
              onInput={setSearchQuery}
              placeholder="Search for content across P2P networks..."
              class={styles.searchInput}
            />
            <Button
              onClick={handleSearch}
              disabled={!searchQuery().trim() || discoveryState().isDiscovering}
              class={styles.searchButton}
            >
              <Search size={20} />
              Discover
            </Button>
          </div>

          <div class={styles.searchControls}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFiltersModal(true)}
              class={styles.controlButton}
            >
              <Filter size={16} />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMethodsModal(true)}
              class={styles.controlButton}
            >
              <Settings size={16} />
              Methods ({discoveryState().selectedMethods.length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Discovery Progress */}
      <Show when={discoveryState().isDiscovering}>
        <Card class={styles.progressCard}>
          <div class={styles.progressHeader}>
            <h3>Discovery in Progress</h3>
            <span class={styles.progressStatus}>
              {discoveryState().discoveryProgress.currentPhase}
            </span>
          </div>
          <div class={styles.progressBar}>
            <div
              class={styles.progressFill}
              style={{ width: `${discoveryState().discoveryProgress.overallProgress}%` }}
            />
          </div>
          <div class={styles.progressDetails}>
            <span>Phase: {discoveryState().discoveryProgress.currentPhase}</span>
            <span>Results Found: {discoveryState().discoveryProgress.resultsFound}</span>
            <span>Networks: {discoveryState().connectedNetworks.length}</span>
          </div>
        </Card>
      </Show>

      {/* Results Section */}
      <Show when={discoveryState().filteredResults.length > 0}>
        <Card class={styles.resultsCard}>
          <div class={styles.resultsHeader}>
            <h3>Discovery Results ({discoveryState().filteredResults.length})</h3>
            <div class={styles.resultsSummary}>
              <Badge variant="info">
                <Users size={14} />
                {discoveryState().filteredResults.length} Sources
              </Badge>
              <Badge variant="success">
                <Shield size={14} />
                Censorship Resistant
              </Badge>
              <Badge variant="cultural">
                <BookOpen size={14} />
                Cultural Content
              </Badge>
            </div>
          </div>

          <div class={styles.resultsList}>
            <For each={discoveryState().filteredResults}>
              {result => (
                <div class={styles.resultItem} onClick={() => handleResultClick(result)}>
                  <div class={styles.resultHeader}>
                    <h4 class={styles.resultTitle}>{result.content.title}</h4>
                    <div class={styles.resultBadges}>
                      <Badge variant="outline" size="sm">
                        {result.content.contentType}
                      </Badge>
                      <Badge variant="success" size="sm">
                        Quality: {result.qualityScore}%
                      </Badge>
                      <Show when={result.culturalContext}>
                        <Badge variant="cultural" size="sm">
                          <BookOpen size={12} />
                          Cultural Context
                        </Badge>
                      </Show>
                    </div>
                  </div>

                  <p class={styles.resultDescription}>{result.content.description}</p>

                  <div class={styles.resultMetadata}>
                    <span class={styles.metadataItem}>
                      <Clock size={14} />
                      {result.content.createdAt.toLocaleDateString()}
                    </span>
                    <span class={styles.metadataItem}>
                      <Download size={14} />
                      {Math.round(result.content.size / 1024)} KB
                    </span>
                    <span class={styles.metadataItem}>
                      <Users size={14} />
                      {result.sources.length} source{result.sources.length !== 1 ? 's' : ''}
                    </span>
                    <Show when={result.learningOpportunities.length > 0}>
                      <span class={styles.metadataItem}>
                        <Brain size={14} />
                        {result.learningOpportunities.length} learning opportunities
                      </span>
                    </Show>
                  </div>

                  {/* Cultural Context Preview */}
                  <Show when={result.culturalContext && props.showCulturalContext}>
                    <div class={styles.culturalPreview}>
                      <div class={styles.culturalHeader}>
                        <BookOpen size={16} />
                        <span>Cultural Context Available</span>
                      </div>
                      <p class={styles.culturalDescription}>
                        {result.culturalContext?.significance.description}
                      </p>
                    </div>
                  </Show>

                  {/* Learning Opportunities */}
                  <Show
                    when={result.learningOpportunities.length > 0 && props.showEducationalContent}
                  >
                    <div class={styles.learningPreview}>
                      <div class={styles.learningHeader}>
                        <Brain size={16} />
                        <span>Learning Opportunities</span>
                      </div>
                      <div class={styles.learningList}>
                        <For each={result.learningOpportunities.slice(0, 2)}>
                          {opportunity => (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e: Event) => {
                                e.stopPropagation();
                                handleLearningOpportunityClick(opportunity);
                              }}
                              class={styles.learningButton}
                            >
                              <Brain size={12} />
                              {opportunity.title}
                            </Button>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Card>
      </Show>

      {/* Modals */}
      <Modal
        isOpen={showFiltersModal()}
        onClose={() => setShowFiltersModal(false)}
        title="Discovery Filters"
      >
        <div class={styles.filtersModal}>
          <p>Configure content discovery filters and preferences.</p>
          <p>Cultural context is always displayed for educational purposes.</p>
        </div>
      </Modal>

      <Modal
        isOpen={showMethodsModal()}
        onClose={() => setShowMethodsModal(false)}
        title="Discovery Methods"
      >
        <div class={styles.methodsModal}>
          <p>Select which discovery methods to use for content search.</p>
          <For each={mockDiscoveryMethods}>
            {method => (
              <div class={styles.methodItem}>
                <h4>{method.name}</h4>
                <p>{method.educationalContext.join(', ')}</p>
                <div class={styles.methodStats}>
                  <span>Speed: {method.speed}%</span>
                  <span>Coverage: {method.coverage}%</span>
                  <span>Censorship Resistance: {method.censorshipResistance}%</span>
                </div>
              </div>
            )}
          </For>
        </div>
      </Modal>

      <Modal
        isOpen={showLearningModal()}
        onClose={() => setShowLearningModal(false)}
        title={selectedLearningOpportunity()?.title ?? 'Learning Opportunity'}
      >
        <div class={styles.learningModal}>
          <Show when={selectedLearningOpportunity()}>
            <p>{selectedLearningOpportunity()!.description}</p>
            <div class={styles.learningDetails}>
              <p>
                <strong>Type:</strong> {selectedLearningOpportunity()!.type}
              </p>
              <p>
                <strong>Difficulty:</strong> {selectedLearningOpportunity()!.difficulty}
              </p>
              <p>
                <strong>Resources:</strong> {selectedLearningOpportunity()!.resources.join(', ')}
              </p>
            </div>
          </Show>
        </div>
      </Modal>
    </div>
  );
};

export default DecentralizedContentDiscovery;
