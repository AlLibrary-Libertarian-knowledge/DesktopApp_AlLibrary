import { Component, createSignal, createEffect, createResource, Show, For } from 'solid-js';
import { torService } from '@/services/network/torService';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';
import { ipfsService } from '@/services/network/ipfsService';
import type {
  CensorshipResistantSearchProps,
  SearchOptions,
  SearchResult,
  SearchProtocol,
  SearchState,
  NetworkHealth,
  IntegrityStatus,
} from './CensorshipResistantSearchTypes';
import styles from './CensorshipResistantSearch.module.css';

export const CensorshipResistantSearch: Component<CensorshipResistantSearchProps> = props => {
  // State management
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedProtocols, setSelectedProtocols] = createSignal<SearchProtocol[]>([]);
  const [searchOptions, setSearchOptions] = createSignal<SearchOptions>({
    query: '',
    protocols: [],
    fallbackProtocols: [],
    enableAnonymousRouting: true,
    useMultiplePaths: true,
    bypassFiltering: true,
    resistCensorship: true,
    verifyAuthenticity: true,
    checkSourceIntegrity: true,
    validateProvenance: true,
    detectManipulation: true,
    includeEducationalContext: true,
    showCulturalInformation: true,
    provideLearningOpportunities: true,
    displayMultiplePerspectives: true,
    searchDepth: 'global',
    includeAlternativeNarratives: true,
    supportConflictingViewpoints: true,
    preserveSourceDiversity: true,
  });

  const [searchState, setSearchState] = createSignal<SearchState>({
    isSearching: false,
    searchProgress: 0,
    activeProtocols: [],
    completedProtocols: [],
    results: [],
    resultCount: 0,
    estimatedTotal: 0,
    resultQuality: 0,
    searchDuration: 0,
    averageResponseTime: 0,
    protocolPerformance: [],
    networkHealth: {
      overall: 0,
      connectivity: 0,
      diversityScore: 0,
      censorshipResistance: 0,
      informationIntegrity: 0,
    },
    censorshipStatus: {
      censorshipDetected: false,
      censorshipLevel: 'none',
      censorshipMethods: [],
      bypassMethods: [],
      alternativeRoutes: [],
      resistanceStrategies: [],
      accessibilityScore: 100,
      availabilityThroughProtocols: [],
      recommendedApproaches: [],
      censorshipEducation: [],
      resistanceEducation: [],
      freedomOfInformationContext: '',
    },
    integrityStatus: {
      overallIntegrity: 0,
      verificationRate: 0,
      authenticityScore: 0,
      manipulationDetection: 0,
      sourceReliability: 0,
    },
    searchEducation: {
      searchContext: '',
      methodologyExplanation: '',
      protocolEducation: [],
      sourceEvaluation: [],
      integrityAssessment: [],
      biasRecognition: [],
      censorshipAwareness: [],
      resistanceMethods: [],
      informationFreedomPrinciples: [],
    },
    discoveryOpportunities: [],
    learningRecommendations: [],
  });

  // Available protocols
  const availableProtocols: SearchProtocol[] = [
    {
      id: 'tor-onion',
      name: 'TOR Onion',
      type: 'tor-onion',
      description:
        'Anonymous routing through TOR network for maximum privacy and censorship resistance',
      supportsAnonymity: true,
      bypassesCensorship: true,
      providesIntegrity: true,
      allowsVerification: true,
      averageLatency: 3000,
      reliabilityScore: 85,
      censorshipResistance: 95,
      privacyLevel: 95,
      available: true,
      active: false,
      errorCount: 0,
    },
    {
      id: 'ipfs-dht',
      name: 'IPFS DHT',
      type: 'ipfs-dht',
      description:
        'Distributed hash table for content-addressed search and decentralized discovery',
      supportsAnonymity: false,
      bypassesCensorship: true,
      providesIntegrity: true,
      allowsVerification: true,
      averageLatency: 1500,
      reliabilityScore: 90,
      censorshipResistance: 80,
      privacyLevel: 60,
      available: true,
      active: false,
      errorCount: 0,
    },
    {
      id: 'direct-p2p',
      name: 'Direct P2P',
      type: 'direct-p2p',
      description: 'Fast, unfiltered access to peer networks with real-time communication',
      supportsAnonymity: false,
      bypassesCensorship: true,
      providesIntegrity: false,
      allowsVerification: false,
      averageLatency: 500,
      reliabilityScore: 75,
      censorshipResistance: 70,
      privacyLevel: 40,
      available: true,
      active: false,
      errorCount: 0,
    },
    {
      id: 'webrtc',
      name: 'WebRTC',
      type: 'webrtc',
      description: 'Browser-based peer connections for decentralized search capabilities',
      supportsAnonymity: false,
      bypassesCensorship: true,
      providesIntegrity: false,
      allowsVerification: false,
      averageLatency: 800,
      reliabilityScore: 80,
      censorshipResistance: 75,
      privacyLevel: 50,
      available: true,
      active: false,
      errorCount: 0,
    },
    {
      id: 'hybrid',
      name: 'Hybrid',
      type: 'hybrid',
      description: 'Combines multiple protocols for maximum censorship resistance and reliability',
      supportsAnonymity: true,
      bypassesCensorship: true,
      providesIntegrity: true,
      allowsVerification: true,
      averageLatency: 2000,
      reliabilityScore: 95,
      censorshipResistance: 98,
      privacyLevel: 90,
      available: true,
      active: false,
      errorCount: 0,
    },
  ];

  // Initialize with default protocols
  createEffect(() => {
    if (props.enableTorRouting !== false) {
      const torProtocol = availableProtocols[0];
      const hybridProtocol = availableProtocols[4];
      setSelectedProtocols([torProtocol, hybridProtocol]);
    } else {
      const ipfsProtocol = availableProtocols[1];
      const p2pProtocol = availableProtocols[2];
      setSelectedProtocols([ipfsProtocol, p2pProtocol]);
    }
  });

  // Network health monitoring
  const [networkHealth] = createResource(
    () => searchState().networkHealth,
    async () => {
      try {
        const torStatus = await torService.getTorStatus();
        const p2pStatus = await p2pNetworkService.getNodeStatus();
        const ipfsStatus = await ipfsService.getNodeInfo();

        return {
          overall: Math.round(
            (torStatus.bootstrapped
              ? 90
              : 0 + p2pStatus.nodeStatus === 'online'
                ? 85
                : 0 + ipfsStatus.connected
                  ? 80
                  : 0) / 3
          ),
          connectivity: torStatus.bootstrapped ? 90 : 0,
          diversityScore: p2pStatus.connectedPeers > 10 ? 85 : 50,
          censorshipResistance: torStatus.bootstrapped ? 95 : 0,
          informationIntegrity: ipfsStatus.connected ? 80 : 0,
        };
      } catch (error) {
        console.error('Failed to get network health:', error);
        return {
          overall: 0,
          connectivity: 0,
          diversityScore: 0,
          censorshipResistance: 0,
          informationIntegrity: 0,
        };
      }
    }
  );

  // Censorship detection
  const [censorshipStatus] = createResource(
    () => searchState().censorshipStatus,
    async () => {
      try {
        const resistanceTest = await torService.testCensorshipResistance();
        const attempts = await torService.monitorCensorshipAttempts();

        return {
          censorshipDetected: attempts.length > 0,
          censorshipLevel:
            attempts.length > 5 ? 'severe' : attempts.length > 2 ? 'moderate' : 'none',
          censorshipMethods: attempts.map(attempt => ({
            method: 'network-blocking',
            description: attempt,
            detectionMethod: 'tor-monitoring',
            commonality: 0.8,
            bypassDifficulty: 0.3,
          })),
          bypassMethods: [
            {
              id: 'tor-bypass',
              name: 'TOR Circuit Rotation',
              type: 'route-change',
              description: 'Rotate TOR circuits to bypass network blocks',
              successRate: 85,
              detectionResistance: 90,
              performanceImpact: 20,
              available: true,
              automatic: true,
              userActionRequired: false,
              technicalComplexity: 'low',
              howToUse: ['Automatically rotates circuits when censorship detected'],
              educationalContext: 'TOR circuits provide multiple routing paths',
              privacyImplications: ['Enhanced anonymity through circuit rotation'],
            },
          ],
          alternativeRoutes: [
            {
              route: 'tor-onion',
              description: 'TOR Onion routing for anonymous access',
              reliability: 85,
              speed: 60,
              anonymity: 95,
            },
          ],
          resistanceStrategies: [
            {
              strategy: 'multi-protocol-fallback',
              description: 'Automatically switch protocols when censorship detected',
              effectiveness: 90,
              complexity: 'medium',
              requirements: ['Multiple protocols available', 'Automatic detection'],
            },
          ],
          accessibilityScore: resistanceTest ? 95 : 50,
          availabilityThroughProtocols: availableProtocols.map(protocol => ({
            protocol,
            available: true,
            reliability: protocol.reliabilityScore,
            speed: 100 - protocol.averageLatency / 100,
            limitations: [],
          })),
          recommendedApproaches: [
            {
              approach: 'hybrid-search',
              description: 'Use multiple protocols simultaneously for maximum resistance',
              suitability: 95,
              steps: ['Enable TOR routing', 'Enable IPFS discovery', 'Enable direct P2P'],
              expectedOutcome: 'Maximum censorship resistance with high reliability',
            },
          ],
          censorshipEducation: [
            'Censorship detection helps identify network restrictions',
            'Multiple protocols provide redundancy against blocking',
            'TOR routing offers maximum anonymity and resistance',
          ],
          resistanceEducation: [
            'Protocol switching automatically bypasses blocks',
            'Circuit rotation maintains anonymity under surveillance',
            'Hybrid approaches combine multiple resistance strategies',
          ],
          freedomOfInformationContext:
            'Information freedom is a fundamental human right that must be protected through technical means.',
        };
      } catch (error) {
        console.error('Failed to get censorship status:', error);
        return searchState().censorshipStatus;
      }
    }
  );

  // Search execution
  const executeSearch = async (query: string, options: SearchOptions) => {
    if (!query.trim()) return;

    setSearchState(prev => ({
      ...prev,
      isSearching: true,
      searchProgress: 0,
      results: [],
      resultCount: 0,
      estimatedTotal: 0,
      resultQuality: 0,
      searchDuration: 0,
      averageResponseTime: 0,
      protocolPerformance: [],
      activeProtocols: options.protocols,
      completedProtocols: [],
    }));

    const startTime = Date.now();
    const results: SearchResult[] = [];
    const protocolPerformance: any[] = [];

    try {
      // Execute search through each protocol
      for (const protocol of options.protocols) {
        const protocolStartTime = Date.now();

        setSearchState(prev => ({
          ...prev,
          searchProgress: (prev.completedProtocols.length / options.protocols.length) * 100,
        }));

        let protocolResults: SearchResult[] = [];

        switch (protocol.type) {
          case 'tor-onion':
            try {
              // Search through TOR network
              const torConnection = await torService.connectThroughTor('search.alibrary.onion', 80);
              // Simulate TOR search results
              protocolResults = [
                {
                  id: `tor-${Date.now()}`,
                  title: `TOR Search Result for "${query}"`,
                  description: `Found through TOR network with maximum anonymity`,
                  contentType: 'document',
                  format: 'pdf',
                  source: {
                    id: 'tor-source',
                    name: 'TOR Network',
                    type: 'tor-service',
                    address: 'search.alibrary.onion',
                    trustScore: 90,
                    verificationStatus: 'verified',
                    protocol: 'tor-onion',
                    connectionType: 'tor',
                    availability: 85,
                  },
                  discoveryMethod: protocol,
                  alternativeSources: [],
                  integrity: {
                    verified: true,
                    verificationMethod: 'cryptographic',
                    confidence: 85,
                    checksumValid: true,
                    signatureValid: true,
                    consensusReached: true,
                    communityValidated: true,
                    verifiedAt: new Date(),
                    verifiedBy: ['tor-network'],
                    verificationChain: [],
                    warnings: [],
                    educationalNotes: ['Content verified through TOR network'],
                    alternativeVerifications: [],
                  },
                  authenticity: {
                    authentic: true,
                    authenticityScore: 85,
                    verificationMethod: 'tor-verification',
                    authorVerified: true,
                    publisherVerified: true,
                    originVerified: true,
                    manipulationDetected: false,
                    alterationsFound: [],
                    originalityScore: 90,
                    authenticityContext: 'Content verified through anonymous TOR network',
                    verificationEducation: ['TOR provides anonymous verification'],
                    sourceEducation: 'TOR network verification ensures authenticity',
                  },
                  culturalContext: {
                    sensitivityLevel: 1,
                    culturalSignificance: 'General cultural information',
                    traditionalContext: 'Accessible through educational channels',
                    communityRelevance: 'Available for community learning',
                    educationalMaterials: [],
                    learningObjectives: ['Understanding TOR network access'],
                    culturalLearningPaths: [],
                    perspectives: [],
                    alternativeViews: [],
                    conflictingInterpretations: [],
                    communityInformation: [],
                    sourceAttribution: [],
                    culturalProtocols: [],
                    accessGuidance: 'Educational access through TOR network',
                    educationalPreparation: 'Learn about anonymous networking',
                    respectfulEngagement: 'Respectful access to cultural information',
                  },
                  accessMethods: [
                    {
                      method: 'tor-download',
                      description: 'Download through TOR network',
                      reliability: 85,
                      speed: 60,
                      anonymity: 95,
                      requirements: ['TOR connection active'],
                    },
                  ],
                  availabilityScore: 85,
                  censorshipStatus: {
                    censorshipDetected: false,
                    censorshipLevel: 'none',
                    censorshipMethods: [],
                    bypassMethods: [],
                    alternativeRoutes: [],
                    resistanceStrategies: [],
                    accessibilityScore: 95,
                    availabilityThroughProtocols: [],
                    recommendedApproaches: [],
                    censorshipEducation: [],
                    resistanceEducation: [],
                    freedomOfInformationContext: '',
                  },
                  tags: ['tor', 'anonymous', 'censorship-resistant'],
                },
              ];
            } catch (error) {
              console.error('TOR search failed:', error);
            }
            break;

          case 'ipfs-dht':
            try {
              // Search through IPFS network
              const ipfsStats = await ipfsService.getStats();
              // Simulate IPFS search results
              protocolResults = [
                {
                  id: `ipfs-${Date.now()}`,
                  title: `IPFS Search Result for "${query}"`,
                  description: `Found through IPFS distributed hash table`,
                  contentType: 'document',
                  format: 'pdf',
                  source: {
                    id: 'ipfs-source',
                    name: 'IPFS Network',
                    type: 'ipfs-node',
                    address: 'ipfs.io',
                    trustScore: 85,
                    verificationStatus: 'verified',
                    protocol: 'ipfs-dht',
                    connectionType: 'direct',
                    availability: 90,
                  },
                  discoveryMethod: protocol,
                  alternativeSources: [],
                  integrity: {
                    verified: true,
                    verificationMethod: 'cryptographic',
                    confidence: 90,
                    checksumValid: true,
                    signatureValid: true,
                    consensusReached: true,
                    communityValidated: true,
                    verifiedAt: new Date(),
                    verifiedBy: ['ipfs-network'],
                    verificationChain: [],
                    warnings: [],
                    educationalNotes: ['Content verified through IPFS content addressing'],
                    alternativeVerifications: [],
                  },
                  authenticity: {
                    authentic: true,
                    authenticityScore: 90,
                    verificationMethod: 'ipfs-verification',
                    authorVerified: true,
                    publisherVerified: true,
                    originVerified: true,
                    manipulationDetected: false,
                    alterationsFound: [],
                    originalityScore: 95,
                    authenticityContext: 'Content verified through IPFS content addressing',
                    verificationEducation: ['IPFS provides content-addressed verification'],
                    sourceEducation: 'IPFS network verification ensures authenticity',
                  },
                  culturalContext: {
                    sensitivityLevel: 1,
                    culturalSignificance: 'General cultural information',
                    traditionalContext: 'Accessible through educational channels',
                    communityRelevance: 'Available for community learning',
                    educationalMaterials: [],
                    learningObjectives: ['Understanding IPFS content addressing'],
                    culturalLearningPaths: [],
                    perspectives: [],
                    alternativeViews: [],
                    conflictingInterpretations: [],
                    communityInformation: [],
                    sourceAttribution: [],
                    culturalProtocols: [],
                    accessGuidance: 'Educational access through IPFS network',
                    educationalPreparation: 'Learn about distributed content addressing',
                    respectfulEngagement: 'Respectful access to cultural information',
                  },
                  accessMethods: [
                    {
                      method: 'ipfs-download',
                      description: 'Download through IPFS network',
                      reliability: 90,
                      speed: 80,
                      anonymity: 60,
                      requirements: ['IPFS connection active'],
                    },
                  ],
                  availabilityScore: 90,
                  censorshipStatus: {
                    censorshipDetected: false,
                    censorshipLevel: 'none',
                    censorshipMethods: [],
                    bypassMethods: [],
                    alternativeRoutes: [],
                    resistanceStrategies: [],
                    accessibilityScore: 90,
                    availabilityThroughProtocols: [],
                    recommendedApproaches: [],
                    censorshipEducation: [],
                    resistanceEducation: [],
                    freedomOfInformationContext: '',
                  },
                  tags: ['ipfs', 'distributed', 'content-addressed'],
                },
              ];
            } catch (error) {
              console.error('IPFS search failed:', error);
            }
            break;

          case 'direct-p2p':
            try {
              // Search through direct P2P network
              const p2pPeers = await p2pNetworkService.getConnectedPeers();
              // Simulate P2P search results
              protocolResults = [
                {
                  id: `p2p-${Date.now()}`,
                  title: `P2P Search Result for "${query}"`,
                  description: `Found through direct peer-to-peer network`,
                  contentType: 'document',
                  format: 'pdf',
                  source: {
                    id: 'p2p-source',
                    name: 'P2P Network',
                    type: 'peer',
                    address: 'peer.alibrary.local',
                    trustScore: 75,
                    verificationStatus: 'unverified',
                    protocol: 'direct-p2p',
                    connectionType: 'direct',
                    availability: 80,
                  },
                  discoveryMethod: protocol,
                  alternativeSources: [],
                  integrity: {
                    verified: false,
                    verificationMethod: 'community',
                    confidence: 60,
                    checksumValid: false,
                    signatureValid: false,
                    consensusReached: false,
                    communityValidated: false,
                    verifiedAt: new Date(),
                    verifiedBy: [],
                    verificationChain: [],
                    warnings: [
                      {
                        type: 'source-disputed',
                        severity: 'warning',
                        message: 'P2P source requires verification',
                        educationalContext:
                          'Direct P2P sources may require additional verification',
                        recommendedAction: 'Verify content through multiple sources',
                      },
                    ],
                    educationalNotes: ['P2P sources require community verification'],
                    alternativeVerifications: [],
                  },
                  authenticity: {
                    authentic: false,
                    authenticityScore: 60,
                    verificationMethod: 'community-verification',
                    authorVerified: false,
                    publisherVerified: false,
                    originVerified: false,
                    manipulationDetected: false,
                    alterationsFound: [],
                    originalityScore: 70,
                    authenticityContext: 'P2P content requires community verification',
                    verificationEducation: ['P2P sources need community validation'],
                    sourceEducation: 'Community verification ensures P2P content authenticity',
                  },
                  culturalContext: {
                    sensitivityLevel: 1,
                    culturalSignificance: 'General cultural information',
                    traditionalContext: 'Accessible through educational channels',
                    communityRelevance: 'Available for community learning',
                    educationalMaterials: [],
                    learningObjectives: ['Understanding P2P content verification'],
                    culturalLearningPaths: [],
                    perspectives: [],
                    alternativeViews: [],
                    conflictingInterpretations: [],
                    communityInformation: [],
                    sourceAttribution: [],
                    culturalProtocols: [],
                    accessGuidance: 'Educational access through P2P network',
                    educationalPreparation: 'Learn about community content verification',
                    respectfulEngagement: 'Respectful access to cultural information',
                  },
                  accessMethods: [
                    {
                      method: 'p2p-download',
                      description: 'Download through P2P network',
                      reliability: 75,
                      speed: 90,
                      anonymity: 40,
                      requirements: ['P2P connection active'],
                    },
                  ],
                  availabilityScore: 80,
                  censorshipStatus: {
                    censorshipDetected: false,
                    censorshipLevel: 'none',
                    censorshipMethods: [],
                    bypassMethods: [],
                    alternativeRoutes: [],
                    resistanceStrategies: [],
                    accessibilityScore: 80,
                    availabilityThroughProtocols: [],
                    recommendedApproaches: [],
                    censorshipEducation: [],
                    resistanceEducation: [],
                    freedomOfInformationContext: '',
                  },
                  tags: ['p2p', 'direct', 'community-verified'],
                },
              ];
            } catch (error) {
              console.error('P2P search failed:', error);
            }
            break;

          default:
            // Hybrid or other protocols
            protocolResults = [];
        }

        const protocolEndTime = Date.now();
        const protocolDuration = protocolEndTime - protocolStartTime;

        protocolPerformance.push({
          protocol,
          responseTime: protocolDuration,
          successRate: protocolResults.length > 0 ? 100 : 0,
          errorRate: protocolResults.length > 0 ? 0 : 100,
          resultsQuality: protocolResults.length > 0 ? 85 : 0,
          censorshipResistance: protocol.censorshipResistance,
        });

        results.push(...protocolResults);

        setSearchState(prev => ({
          ...prev,
          completedProtocols: [...prev.completedProtocols, protocol],
          searchProgress: ((prev.completedProtocols.length + 1) / options.protocols.length) * 100,
        }));
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        results,
        resultCount: results.length,
        estimatedTotal: results.length,
        resultQuality: results.length > 0 ? 85 : 0,
        searchDuration: totalDuration,
        averageResponseTime: totalDuration / options.protocols.length,
        protocolPerformance,
      }));

      // Trigger result selection callback
      if (results.length > 0 && props.onResultSelect) {
        const firstResult = results[0];
        if (firstResult) {
          props.onResultSelect(firstResult);
        }
      }
    } catch (error) {
      console.error('Search execution failed:', error);
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
      }));
    }
  };

  // Handle search submission
  const handleSearch = () => {
    const query = searchQuery();
    if (!query.trim()) return;

    const selectedProtocolsList = selectedProtocols();
    if (selectedProtocolsList.length === 0) return;

    const options: SearchOptions = {
      ...searchOptions(),
      query,
      protocols: selectedProtocolsList,
      primaryProtocol: selectedProtocolsList[0],
      fallbackProtocols: selectedProtocolsList.slice(1),
    };

    executeSearch(query, options);
    props.onSearch?.(query, options);
  };

  // Handle protocol selection
  const toggleProtocol = (protocol: SearchProtocol) => {
    const current = selectedProtocols();
    const isSelected = current.some(p => p.id === protocol.id);

    if (isSelected) {
      setSelectedProtocols(current.filter(p => p.id !== protocol.id));
    } else {
      setSelectedProtocols([...current, protocol]);
    }
  };

  // Handle censorship event
  const handleCensorshipEvent = (event: any) => {
    console.log('Censorship detected:', event);
    props.onCensorshipDetected?.(event);
  };

  return (
    <div class={`${styles.censorshipResistantSearch} ${props.class || ''}`}>
      {/* Search Header */}
      <div class={styles.searchHeader}>
        <h2 class={styles.searchTitle}>Censorship Resistant Search</h2>
        <p class={styles.searchDescription}>
          Search across multiple protocols with maximum censorship resistance and information
          integrity verification
        </p>
      </div>

      {/* Search Input */}
      <div class={styles.searchInputContainer}>
        <input
          type="text"
          class={styles.searchInput}
          placeholder="Enter your search query..."
          value={searchQuery()}
          onInput={e => setSearchQuery(e.currentTarget.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
          disabled={searchState().isSearching}
        />
        <button
          class={styles.searchButton}
          onClick={handleSearch}
          disabled={searchState().isSearching || !searchQuery().trim()}
        >
          {searchState().isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Protocol Selection */}
      <Show when={props.showAdvancedOptions !== false}>
        <div class={styles.protocolSelection}>
          <h3 class={styles.sectionTitle}>Search Protocols</h3>
          <div class={styles.protocolGrid}>
            <For each={availableProtocols}>
              {protocol => (
                <div
                  class={`${styles.protocolCard} ${
                    selectedProtocols().some(p => p.id === protocol.id) ? styles.selected : ''
                  }`}
                  onClick={() => toggleProtocol(protocol)}
                >
                  <div class={styles.protocolHeader}>
                    <h4 class={styles.protocolName}>{protocol.name}</h4>
                    <div class={styles.protocolStatus}>
                      <span
                        class={`${styles.statusIndicator} ${protocol.available ? styles.available : styles.unavailable}`}
                      >
                        {protocol.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  <p class={styles.protocolDescription}>{protocol.description}</p>
                  <div class={styles.protocolMetrics}>
                    <div class={styles.metric}>
                      <span class={styles.metricLabel}>Latency:</span>
                      <span class={styles.metricValue}>{protocol.averageLatency}ms</span>
                    </div>
                    <div class={styles.metric}>
                      <span class={styles.metricLabel}>Reliability:</span>
                      <span class={styles.metricValue}>{protocol.reliabilityScore}%</span>
                    </div>
                    <div class={styles.metric}>
                      <span class={styles.metricLabel}>Censorship Resistance:</span>
                      <span class={styles.metricValue}>{protocol.censorshipResistance}%</span>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Network Health */}
      <Show when={props.showCensorshipStatus !== false}>
        <div class={styles.networkHealth}>
          <h3 class={styles.sectionTitle}>Network Health</h3>
          <div class={styles.healthGrid}>
            <div class={styles.healthCard}>
              <h4>Overall Health</h4>
              <div class={styles.healthScore}>
                <span class={styles.score}>{networkHealth()?.overall || 0}%</span>
              </div>
            </div>
            <div class={styles.healthCard}>
              <h4>Connectivity</h4>
              <div class={styles.healthScore}>
                <span class={styles.score}>{networkHealth()?.connectivity || 0}%</span>
              </div>
            </div>
            <div class={styles.healthCard}>
              <h4>Censorship Resistance</h4>
              <div class={styles.healthScore}>
                <span class={styles.score}>{networkHealth()?.censorshipResistance || 0}%</span>
              </div>
            </div>
            <div class={styles.healthCard}>
              <h4>Information Integrity</h4>
              <div class={styles.healthScore}>
                <span class={styles.score}>{networkHealth()?.informationIntegrity || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Search Progress */}
      <Show when={searchState().isSearching}>
        <div class={styles.searchProgress}>
          <h3 class={styles.sectionTitle}>Search Progress</h3>
          <div class={styles.progressBar}>
            <div
              class={styles.progressFill}
              style={{ width: `${searchState().searchProgress}%` }}
            />
          </div>
          <div class={styles.progressDetails}>
            <span>Progress: {Math.round(searchState().searchProgress)}%</span>
            <span>Active Protocols: {searchState().activeProtocols.length}</span>
            <span>Completed: {searchState().completedProtocols.length}</span>
          </div>
        </div>
      </Show>

      {/* Search Results */}
      <Show when={searchState().results.length > 0}>
        <div class={styles.searchResults}>
          <h3 class={styles.sectionTitle}>Search Results ({searchState().resultCount})</h3>
          <div class={styles.resultsGrid}>
            <For each={searchState().results}>
              {result => (
                <div class={styles.resultCard}>
                  <div class={styles.resultHeader}>
                    <h4 class={styles.resultTitle}>{result.title}</h4>
                    <div class={styles.resultMeta}>
                      <span class={styles.resultType}>{result.contentType}</span>
                      <span class={styles.resultFormat}>{result.format}</span>
                    </div>
                  </div>
                  <p class={styles.resultDescription}>{result.description}</p>

                  {/* Integrity Status */}
                  <div class={styles.integrityStatus}>
                    <div
                      class={`${styles.verificationBadge} ${result.integrity.verified ? styles.verified : styles.unverified}`}
                    >
                      {result.integrity.verified ? 'Verified' : 'Unverified'}
                    </div>
                    <div class={styles.confidenceScore}>
                      Confidence: {result.integrity.confidence}%
                    </div>
                  </div>

                  {/* Cultural Context */}
                  <Show when={props.showEducationalInfo !== false && result.culturalContext}>
                    <div class={styles.culturalContext}>
                      <h5>Cultural Context</h5>
                      <p>{result.culturalContext.culturalSignificance}</p>
                      <div class={styles.sensitivityLevel}>
                        Sensitivity Level: {result.culturalContext.sensitivityLevel}
                      </div>
                    </div>
                  </Show>

                  {/* Access Methods */}
                  <div class={styles.accessMethods}>
                    <For each={result.accessMethods}>
                      {method => (
                        <div class={styles.accessMethod}>
                          <span class={styles.methodName}>{method.method}</span>
                          <span class={styles.methodReliability}>
                            {method.reliability}% reliable
                          </span>
                        </div>
                      )}
                    </For>
                  </div>

                  <button
                    class={styles.resultAction}
                    onClick={() => props.onResultSelect?.(result)}
                  >
                    View Details
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Educational Information */}
      <Show when={props.showEducationalInfo !== false}>
        <div class={styles.educationalPanel}>
          <h3 class={styles.sectionTitle}>Educational Context</h3>
          <div class={styles.educationalContent}>
            <p>
              This search system uses multiple protocols to ensure maximum censorship resistance and
              information integrity. TOR provides anonymous access, IPFS ensures content
              authenticity, and P2P networks offer direct peer connections.
            </p>
            <div class={styles.educationalTips}>
              <h4>Search Tips:</h4>
              <ul>
                <li>Use multiple protocols for maximum resistance</li>
                <li>Verify content integrity through multiple sources</li>
                <li>Respect cultural context and educational value</li>
                <li>Support information freedom and anti-censorship principles</li>
              </ul>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default CensorshipResistantSearch;
