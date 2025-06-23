/**
 * Network Resilience Tools Component
 *
 * A comprehensive network resilience interface that provides censorship detection,
 * route-around capabilities, network health monitoring, and anti-censorship tools.
 *
 * ANTI-CENSORSHIP CORE: Network resilience tools for detecting and circumventing
 * censorship with educational transparency and information freedom principles.
 */

import { Component, createSignal, Show, For, onMount, createEffect } from 'solid-js';
import { Card, Button, Badge, Modal, Progress } from '../../foundation';
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings,
  Eye,
  Route,
  Zap,
  Globe,
  Brain,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Play,
  Pause,
  Target,
  Network,
} from 'lucide-solid';
import { p2pNetworkService } from '../../../services/network/p2pNetworkService';
import type {
  NetworkResilienceToolsProps,
  ResilienceState,
  NetworkHealth,
  CensorshipDetection,
  RouteOptimization,
  ResilienceTool,
  LearningOpportunity,
  HealthComponent,
  CensorshipEvent,
  NetworkRoute,
} from './NetworkResilienceToolsTypes';
import styles from './NetworkResilienceTools.module.css';

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

const mockNetworkHealth = (): NetworkHealth => ({
  overallScore: 87,
  components: [
    {
      name: 'Connectivity',
      type: 'connectivity' as const,
      score: 92,
      status: 'excellent' as const,
      description: 'Strong P2P connections across multiple protocols',
      lastChecked: new Date(),
      trend: 'stable' as const,
      alerts: [],
      recommendations: ['Consider adding more TOR bridges for redundancy'],
    },
    {
      name: 'Throughput',
      type: 'throughput' as const,
      score: 85,
      status: 'good' as const,
      description: 'Good bandwidth utilization with room for improvement',
      lastChecked: new Date(),
      trend: 'improving' as const,
      alerts: [],
      recommendations: ['Optimize mesh routing for better throughput'],
    },
    {
      name: 'Censorship Resistance',
      type: 'censorship' as const,
      score: 95,
      status: 'excellent' as const,
      description: 'Multiple route-around capabilities active',
      lastChecked: new Date(),
      trend: 'stable' as const,
      alerts: [],
      recommendations: [],
    },
    {
      name: 'Cultural Routing',
      type: 'cultural_routing' as const,
      score: 78,
      status: 'good' as const,
      description: 'Cultural network integration functional',
      lastChecked: new Date(),
      trend: 'improving' as const,
      alerts: [],
      recommendations: ['Expand cultural node network for better coverage'],
    },
  ],
  timestamp: new Date(),
  trend: {
    direction: 'improving' as const,
    rate: 2.3,
    confidence: 85,
    timeframe: 3600000, // 1 hour
  },
  alerts: [],
  recommendations: [],
  connectivity: {
    activeConnections: 45,
    maxConnections: 100,
    connectionSuccess: 94,
    peerReachability: 89,
    networkReachability: 92,
    protocolSuccess: [],
  },
  throughput: {
    downloadSpeed: 2048000,
    uploadSpeed: 1024000,
    averageSpeed: 1536000,
    speedConsistency: 85,
    networkEfficiency: 78,
    bottlenecks: [],
  },
  latency: {
    averageLatency: 150,
    minLatency: 50,
    maxLatency: 300,
    jitter: 25,
    timeouts: 2,
    qualityScore: 82,
  },
  reliability: {
    uptime: 98.5,
    connectionStability: 94,
    dataIntegrity: 99.2,
    errorRate: 0.8,
    recoveryTime: 2500,
    failureHistory: [],
  },
  security: {
    encryptionStatus: 'full_encryption' as any,
    authenticityVerification: 96,
    privacyLevel: 88,
    securityThreats: [],
    vulnerabilities: [],
    protectionLevel: 'high' as any,
  },
  censorship: {
    censorshipRisk: 15,
    blockingDetected: false,
    throttlingDetected: false,
    filteringDetected: false,
    routeAroundSuccess: 98,
    resistanceLevel: 95,
  },
});

const mockCensorshipDetections = (): CensorshipDetection[] => [
  {
    detectionId: `detection-${Date.now()}-1`,
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    detectionType: 'domain_blocking',
    severity: 'moderate',
    confidence: 87,
    targetResource: 'cultural-archives.example.com',
    blockingMethod: 'dns_blocking',
    affectedProtocols: ['HTTPS', 'HTTP'],
    geographicScope: 'regional' as any,
    evidence: [
      {
        evidenceType: 'dns_inconsistency',
        description: 'DNS queries return NXDOMAIN but direct IP access works',
        timestamp: new Date(Date.now() - 3600000),
        reliability: 90,
        source: 'automated_test',
        testMethod: 'dns_resolution_comparison',
        rawData: { dns_response: 'NXDOMAIN', ip_access: 'success' },
        educationalValue: 'Learn how DNS blocking affects information access',
      },
    ],
    testResults: [],
    confirmations: [],
    responseStrategy: 'route_around' as any,
    routeAroundOptions: [],
    educationalContent: {
      educationId: 'censorship-education-1',
      title: 'Understanding DNS Blocking',
      description: 'Learn how DNS blocking works and how to circumvent it',
      educationLevel: 'intermediate',
      concepts: [],
      principles: [],
      techniques: [],
      countermeasures: [],
      resources: [],
      exercises: [],
      assessments: [],
      culturalPerspectives: [],
      historicalContext: [],
      globalExamples: [],
      rightsEducation: [],
      ethicalConsiderations: [],
      responsibleUse: [],
    },
    culturalImpact: 'medium_impact' as any,
    affectedCommunities: ['Indigenous Digital Alliance'],
    culturalEducation: [
      'DNS blocking can disproportionately affect cultural content access',
      'Alternative access methods preserve cultural information sharing',
    ],
  },
];

const mockResilienceTools = (): ResilienceTool[] => [
  {
    toolId: 'tor-bridge-manager',
    toolName: 'TOR Bridge Manager',
    toolType: 'traffic_obfuscator',
    description: 'Manages TOR bridges for censorship circumvention',
    capabilities: [
      {
        capability: 'Bridge Discovery',
        effectiveness: 85,
        reliability: 92,
        requirements: ['TOR network access'],
        limitations: ['May have higher latency'],
        educationalValue: 'Learn how TOR bridges work to bypass censorship',
      },
    ],
    supportedProtocols: ['TOR', 'OBFS4', 'Snowflake'],
    operatingModes: [],
    configuration: {
      configId: 'tor-config-1',
      parameters: [],
      presets: [],
      customizations: [],
      culturalSettings: 'default' as any,
    },
    requirements: [],
    limitations: [],
    status: 'active' as any,
    performance: 'good' as any,
    usage: 'moderate' as any,
    educationalResources: [],
    usageGuide: 'basic_guide' as any,
    troubleshooting: 'standard_troubleshooting' as any,
    culturalSupport: 'compatible' as any,
    communityEndorsement: [],
    traditionalEquivalent: undefined,
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const NetworkResilienceTools: Component<NetworkResilienceToolsProps> = props => {
  // ============================================================================
  // COMPONENT STATE
  // ============================================================================

  const [resilienceState, setResilienceState] = createSignal<ResilienceState>({
    isMonitoring: false,
    lastCheck: new Date(),
    monitoringStarted: new Date(),
    networkHealth: mockNetworkHealth(),
    connectionStatus: {
      status: 'connected',
      activeConnections: 45,
      totalAttempts: 50,
      successRate: 90,
      lastConnected: new Date(),
      connectionQuality: 85,
    },
    routingStatus: {
      primaryRoute: {
        routeId: 'route-1',
        routeName: 'Primary P2P Route',
        routeType: 'hybrid',
        protocols: [],
        hops: [],
        endpoints: [],
        intermediates: [],
        characteristics: 'optimized' as any,
        performance: {
          latency: 150,
          throughput: 2048000,
          reliability: 94,
          efficiency: 85,
          qualityScore: 87,
          measurementTime: new Date(),
        },
        reliability: 'high' as any,
        security: 'encrypted' as any,
        censorshipResistance: 'high' as any,
        routeAroundCapability: 'multiple_methods' as any,
        culturalSupport: 'enabled' as any,
        communityNodes: [],
        traditionalPaths: [],
      },
      backupRoutes: [],
      activeOptimizations: [],
      routeChanges: [],
      routingEfficiency: 87,
    },
    censorshipDetections: mockCensorshipDetections(),
    activeCensorship: [],
    censorshipHistory: [],
    activeRoutes: [],
    backupRoutes: [],
    optimizedRoutes: [],
    routePerformance: [],
    availableTools: mockResilienceTools(),
    activeTools: ['tor-bridge-manager'],
    toolsConfig: {
      configId: 'main-config',
      globalSettings: 'default' as any,
      toolSpecificSettings: {},
      culturalSettings: 'respectful' as any,
      educationalSettings: 'enabled' as any,
    },
    learningOpportunities: [
      {
        opportunityId: 'learn-censorship-detection',
        title: 'Understanding Censorship Detection',
        description: 'Learn how to identify and analyze network censorship',
        type: 'tutorial',
        difficulty: 'intermediate',
        content: [],
        activities: [],
        resources: [],
        culturalRelevance: 'high_relevance' as any,
        communityConnection: 'strong' as any,
        traditionalKnowledge: 'applicable' as any,
        objectives: [],
        competencies: [],
        assessments: [],
      },
    ],
    educationalMode: props.showEducationalContent ?? true,
    censorshipEducation: {
      educationId: 'main-education',
      title: 'Network Resilience Education',
      description: 'Comprehensive education about network resilience and censorship resistance',
      educationLevel: 'intermediate',
      concepts: [],
      principles: [],
      techniques: [],
      countermeasures: [],
      resources: [],
      exercises: [],
      assessments: [],
      culturalPerspectives: [],
      historicalContext: [],
      globalExamples: [],
      rightsEducation: [],
      ethicalConsiderations: [],
      responsibleUse: [],
    },
    culturalNetworks: [],
    culturalRouting: {
      routingId: 'cultural-routing-1',
      culturalPreferences: [],
      respectfulRouting: 'enabled' as any,
      communityPriorities: [],
      traditionalPaths: [],
      educationalRouting: 'active' as any,
    },
    communityNetworkStatus: {
      statusId: 'community-status-1',
      timestamp: new Date(),
      overallHealth: 82,
      activeMembers: 156,
      participationRate: 78,
      engagementLevel: 85,
      culturalActivity: [],
      traditionalPractices: [],
      knowledgePreservation: [],
      learningActivities: [],
      educationalContributions: [],
      knowledgeTransfer: [],
      censorshipResistance: 88,
      routeResilience: 91,
      informationIntegrity: 94,
    },
  });

  const [selectedTool, setSelectedTool] = createSignal<ResilienceTool | null>(null);
  const [showToolsModal, setShowToolsModal] = createSignal(false);
  const [showHealthModal, setShowHealthModal] = createSignal(false);
  const [showEducationModal, setShowEducationModal] = createSignal(false);
  const [selectedLearningOpportunity, setSelectedLearningOpportunity] =
    createSignal<LearningOpportunity | null>(null);

  // ============================================================================
  // MONITORING LOGIC
  // ============================================================================

  const startMonitoring = async () => {
    setResilienceState(prev => ({
      ...prev,
      isMonitoring: true,
      monitoringStarted: new Date(),
    }));

    try {
      // Simulate monitoring process
      await performNetworkHealthCheck();
      await performCensorshipDetection();
      await optimizeRoutes();

      props.onNetworkHealthChanged?.(resilienceState().networkHealth);
    } catch (error) {
      console.error('Monitoring failed:', error);
      props.onError?.(error instanceof Error ? error.message : 'Monitoring failed');
    }
  };

  const stopMonitoring = () => {
    setResilienceState(prev => ({
      ...prev,
      isMonitoring: false,
    }));
  };

  const performNetworkHealthCheck = async () => {
    // Simulate health check
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedHealth = mockNetworkHealth();
    setResilienceState(prev => ({
      ...prev,
      networkHealth: updatedHealth,
      lastCheck: new Date(),
    }));
  };

  const performCensorshipDetection = async () => {
    // Simulate censorship detection
    await new Promise(resolve => setTimeout(resolve, 500));

    const detections = mockCensorshipDetections();
    if (detections.length > 0) {
      setResilienceState(prev => ({
        ...prev,
        censorshipDetections: detections,
      }));

      detections.forEach(detection => {
        props.onCensorshipDetected?.(detection);
      });
    }
  };

  const optimizeRoutes = async () => {
    // Simulate route optimization
    await new Promise(resolve => setTimeout(resolve, 750));

    const optimization: RouteOptimization = {
      optimizationId: `optimization-${Date.now()}`,
      timestamp: new Date(),
      optimizationType: 'censorship_avoidance',
      trigger: 'scheduled_optimization',
      originalRoute: resilienceState().routingStatus.primaryRoute,
      originalPerformance: resilienceState().routingStatus.primaryRoute.performance,
      optimizedRoute: resilienceState().routingStatus.primaryRoute,
      expectedPerformance: resilienceState().routingStatus.primaryRoute.performance,
      optimizationSteps: [],
      algorithms: [],
      constraints: [],
      improvementMetrics: 'significant_improvement' as any,
      qualityScore: 92,
      stabilityScore: 88,
      culturalRouting: true,
      communityPreferences: 'respected' as any,
      educationalValue: ['Route optimization improves censorship resistance'],
    };

    props.onRouteOptimized?.(optimization);
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleToolSelection = (tool: ResilienceTool) => {
    setSelectedTool(tool);
    setShowToolsModal(true);
  };

  const handleLearningOpportunitySelection = (opportunity: LearningOpportunity) => {
    setSelectedLearningOpportunity(opportunity);
    setShowEducationModal(true);
    props.onLearningOpportunitySelected?.(opportunity);
  };

  const handleRefreshHealth = async () => {
    await performNetworkHealthCheck();
  };

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  onMount(() => {
    if (props.showNetworkHealth !== false) {
      performNetworkHealthCheck();
    }
  });

  createEffect(() => {
    if (resilienceState().isMonitoring && props.monitoringInterval) {
      const interval = setInterval(performNetworkHealthCheck, props.monitoringInterval);
      return () => clearInterval(interval);
    }
  });

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle size={16} class={styles.excellentIcon} />;
      case 'good':
        return <CheckCircle size={16} class={styles.goodIcon} />;
      case 'fair':
        return <AlertTriangle size={16} class={styles.fairIcon} />;
      case 'poor':
      case 'critical':
        return <AlertTriangle size={16} class={styles.criticalIcon} />;
      default:
        return <Minus size={16} class={styles.unknownIcon} />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp size={14} class={styles.improvingIcon} />;
      case 'degrading':
        return <TrendingDown size={14} class={styles.degradingIcon} />;
      default:
        return <Minus size={14} class={styles.stableIcon} />;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div class={styles.resilienceContainer}>
      {/* Header Section */}
      <Card class={styles.headerCard}>
        <div class={styles.headerContent}>
          <div class={styles.headerLeft}>
            <div class={styles.headerIcon}>
              <Shield size={32} />
            </div>
            <div class={styles.headerText}>
              <h2 class={styles.title}>Network Resilience Tools</h2>
              <p class={styles.subtitle}>
                Monitor network health, detect censorship, and optimize routes for maximum
                resilience
              </p>
            </div>
          </div>
          <div class={styles.headerRight}>
            <Badge
              variant={resilienceState().networkHealth.overallScore > 80 ? 'success' : 'warning'}
              class={styles.healthBadge}
            >
              <Activity size={16} />
              Health: {resilienceState().networkHealth.overallScore}%
            </Badge>
          </div>
        </div>

        {/* Control Panel */}
        <div class={styles.controlPanel}>
          <div class={styles.controlButtons}>
            <Button
              onClick={resilienceState().isMonitoring ? stopMonitoring : startMonitoring}
              variant={resilienceState().isMonitoring ? 'outline' : 'primary'}
              class={styles.monitorButton}
            >
              {resilienceState().isMonitoring ? <Pause size={20} /> : <Play size={20} />}
              {resilienceState().isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
            <Button variant="outline" onClick={handleRefreshHealth} class={styles.refreshButton}>
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowToolsModal(true)}
              class={styles.toolsButton}
            >
              <Settings size={16} />
              Tools ({resilienceState().activeTools.length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Network Health Dashboard */}
      <Show when={props.showNetworkHealth !== false}>
        <Card class={styles.healthCard}>
          <div class={styles.healthHeader}>
            <h3>Network Health Overview</h3>
            <div class={styles.healthScore}>
              <span class={styles.scoreValue}>{resilienceState().networkHealth.overallScore}%</span>
              <span class={styles.scoreLabel}>Overall Health</span>
            </div>
          </div>

          <div class={styles.healthComponents}>
            <For each={resilienceState().networkHealth.components}>
              {component => (
                <div class={styles.healthComponent}>
                  <div class={styles.componentHeader}>
                    <div class={styles.componentInfo}>
                      {getHealthStatusIcon(component.status)}
                      <span class={styles.componentName}>{component.name}</span>
                      {getTrendIcon(component.trend)}
                    </div>
                    <span class={styles.componentScore}>{component.score}%</span>
                  </div>
                  <div class={styles.componentProgress}>
                    <Progress value={component.score} max={100} class={styles.progressBar} />
                  </div>
                  <p class={styles.componentDescription}>{component.description}</p>
                </div>
              )}
            </For>
          </div>
        </Card>
      </Show>

      {/* Censorship Detection */}
      <Show when={props.showCensorshipDetection !== false}>
        <Card class={styles.censorshipCard}>
          <div class={styles.censorshipHeader}>
            <h3>Censorship Detection</h3>
            <Badge
              variant={resilienceState().censorshipDetections.length === 0 ? 'success' : 'warning'}
              class={styles.detectionBadge}
            >
              <Eye size={14} />
              {resilienceState().censorshipDetections.length} Detection
              {resilienceState().censorshipDetections.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <Show when={resilienceState().censorshipDetections.length === 0}>
            <div class={styles.noCensorship}>
              <CheckCircle size={48} class={styles.noCensorshipIcon} />
              <h4>No Censorship Detected</h4>
              <p>Your network connections appear to be free from censorship attempts.</p>
            </div>
          </Show>

          <Show when={resilienceState().censorshipDetections.length > 0}>
            <div class={styles.detectionsList}>
              <For each={resilienceState().censorshipDetections}>
                {detection => (
                  <div class={styles.detectionItem}>
                    <div class={styles.detectionHeader}>
                      <div class={styles.detectionInfo}>
                        <AlertTriangle size={16} class={styles.detectionIcon} />
                        <span class={styles.detectionType}>
                          {detection.detectionType.replace('_', ' ')}
                        </span>
                        <Badge
                          variant={detection.severity === 'severe' ? 'error' : 'warning'}
                          size="sm"
                        >
                          {detection.severity}
                        </Badge>
                      </div>
                      <span class={styles.detectionTime}>
                        {detection.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p class={styles.detectionTarget}>Target: {detection.targetResource}</p>
                    <p class={styles.detectionMethod}>
                      Method: {detection.blockingMethod.replace('_', ' ')}
                    </p>

                    <Show when={detection.culturalEducation.length > 0}>
                      <div class={styles.culturalEducation}>
                        <BookOpen size={14} />
                        <span>Cultural Context Available</span>
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Card>
      </Show>

      {/* Route Optimization */}
      <Show when={props.showRouteOptimization !== false}>
        <Card class={styles.routeCard}>
          <div class={styles.routeHeader}>
            <h3>Route Optimization</h3>
            <div class={styles.routeStats}>
              <Badge variant="info" size="sm">
                <Route size={14} />
                Efficiency: {resilienceState().routingStatus.routingEfficiency}%
              </Badge>
              <Badge variant="success" size="sm">
                <Target size={14} />
                Quality: {resilienceState().routingStatus.primaryRoute.performance.qualityScore}%
              </Badge>
            </div>
          </div>

          <div class={styles.routeInfo}>
            <div class={styles.primaryRoute}>
              <h4>Primary Route</h4>
              <div class={styles.routeDetails}>
                <span>
                  <strong>Type:</strong> {resilienceState().routingStatus.primaryRoute.routeType}
                </span>
                <span>
                  <strong>Latency:</strong>{' '}
                  {resilienceState().routingStatus.primaryRoute.performance.latency}ms
                </span>
                <span>
                  <strong>Throughput:</strong>{' '}
                  {Math.round(
                    resilienceState().routingStatus.primaryRoute.performance.throughput / 1024
                  )}
                  KB/s
                </span>
                <span>
                  <strong>Reliability:</strong>{' '}
                  {resilienceState().routingStatus.primaryRoute.performance.reliability}%
                </span>
              </div>
            </div>

            <Show when={resilienceState().routingStatus.primaryRoute.culturalSupport}>
              <div class={styles.culturalRouting}>
                <Globe size={16} />
                <span>Cultural Routing Enabled</span>
                <p class={styles.culturalDescription}>
                  Routes respect cultural network preferences and community priorities
                </p>
              </div>
            </Show>
          </div>
        </Card>
      </Show>

      {/* Learning Opportunities */}
      <Show
        when={
          props.showEducationalContent !== false &&
          resilienceState().learningOpportunities.length > 0
        }
      >
        <Card class={styles.learningCard}>
          <div class={styles.learningHeader}>
            <h3>Learning Opportunities</h3>
            <Badge variant="info" class={styles.learningBadge}>
              <Brain size={14} />
              {resilienceState().learningOpportunities.length} Available
            </Badge>
          </div>

          <div class={styles.learningList}>
            <For each={resilienceState().learningOpportunities}>
              {opportunity => (
                <div
                  class={styles.learningItem}
                  onClick={() => handleLearningOpportunitySelection(opportunity)}
                >
                  <div class={styles.learningInfo}>
                    <h4 class={styles.learningTitle}>{opportunity.title}</h4>
                    <p class={styles.learningDescription}>{opportunity.description}</p>
                    <div class={styles.learningMeta}>
                      <Badge variant="outline" size="sm">
                        {opportunity.type}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        {opportunity.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <Brain size={24} class={styles.learningIcon} />
                </div>
              )}
            </For>
          </div>
        </Card>
      </Show>

      {/* Modals */}
      <Modal
        isOpen={showToolsModal()}
        onClose={() => setShowToolsModal(false)}
        title="Resilience Tools"
      >
        <div class={styles.toolsModal}>
          <p>Configure and manage network resilience tools for optimal performance.</p>
          <div class={styles.toolsList}>
            <For each={resilienceState().availableTools}>
              {tool => (
                <div class={styles.toolItem}>
                  <div class={styles.toolInfo}>
                    <h4>{tool.toolName}</h4>
                    <p>{tool.description}</p>
                    <Badge
                      variant={
                        resilienceState().activeTools.includes(tool.toolId) ? 'success' : 'outline'
                      }
                      size="sm"
                    >
                      {resilienceState().activeTools.includes(tool.toolId) ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleToolSelection(tool)}>
                    Configure
                  </Button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEducationModal()}
        onClose={() => setShowEducationModal(false)}
        title={selectedLearningOpportunity()?.title ?? 'Learning Opportunity'}
      >
        <div class={styles.educationModal}>
          <Show when={selectedLearningOpportunity()}>
            <p>{selectedLearningOpportunity()!.description}</p>
            <div class={styles.educationDetails}>
              <p>
                <strong>Type:</strong> {selectedLearningOpportunity()!.type}
              </p>
              <p>
                <strong>Difficulty:</strong> {selectedLearningOpportunity()!.difficulty}
              </p>
              <p>
                <strong>Cultural Relevance:</strong> High - Supports community network resilience
              </p>
            </div>
            <div class={styles.educationContent}>
              <h4>What You'll Learn:</h4>
              <ul>
                <li>How to identify network censorship patterns</li>
                <li>Techniques for route optimization and redundancy</li>
                <li>Cultural considerations in network design</li>
                <li>Community-driven resilience strategies</li>
              </ul>
            </div>
          </Show>
        </div>
      </Modal>
    </div>
  );
};

export default NetworkResilienceTools;
