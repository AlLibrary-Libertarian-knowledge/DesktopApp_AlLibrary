/**
 * NetworkHealthDashboard Component Types
 *
 * Comprehensive types for P2P network health monitoring dashboard
 * with cultural network awareness and anti-censorship metrics.
 */

import type { Component } from 'solid-js';

/**
 * Network Health Metrics
 */
export interface NetworkHealthMetrics {
  // Connection Health
  connectedPeers: number;
  maxPeers: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  averageLatency: number;
  bandwidthUsage: {
    upload: number;
    download: number;
    total: number;
  };

  // Network Stability
  uptime: number;
  disconnectionEvents: number;
  reconnectionRate: number;
  networkStability: number; // 0-100 percentage

  // Content Distribution
  contentShared: number;
  contentReceived: number;
  replicationFactor: number;
  storageUsage: {
    used: number;
    available: number;
    total: number;
  };

  // Cultural Network Health
  culturalCommunities: number;
  culturalContentShared: number;
  educationalResourcesAvailable: number;
  communityParticipation: number;

  // Anti-Censorship Metrics
  torConnectionActive: boolean;
  alternativeRoutesAvailable: number;
  censorshipAttempts: number;
  informationIntegrityScore: number;
}

/**
 * Network Performance History
 */
export interface NetworkPerformanceHistory {
  timestamp: number;
  metrics: {
    peerCount: number;
    latency: number;
    bandwidth: number;
    stability: number;
    culturalActivity: number;
  };
}

/**
 * Network Issues and Alerts
 */
export interface NetworkIssue {
  id: string;
  type: 'connection' | 'performance' | 'security' | 'cultural' | 'censorship';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: number;
  resolved: boolean;
  recommendations: string[];
}

/**
 * Cultural Network Status
 */
export interface CulturalNetworkStatus {
  activeCommunities: {
    id: string;
    name: string;
    memberCount: number;
    culturalContext: {
      origin: string;
      sensitivityLevel: number;
      educationalContext?: string;
    };
    activity: 'high' | 'medium' | 'low';
  }[];

  educationalExchanges: {
    contentShared: number;
    knowledgeTransferred: number;
    culturalBridging: number;
  };

  sovereigntyMetrics: {
    communityControlled: number;
    decentralizedGovernance: number;
    informationFreedom: number;
  };
}

/**
 * Anti-Censorship Status
 */
export interface AntiCensorshipStatus {
  torIntegration: {
    active: boolean;
    hiddenServiceAvailable: boolean;
    circuitCount: number;
    anonymityLevel: 'low' | 'medium' | 'high';
  };

  censorshipResistance: {
    alternativeRoutes: number;
    contentMirroring: number;
    distributedBackups: number;
    integrityVerification: boolean;
  };

  informationFreedom: {
    accessibleContent: number;
    blockedAttempts: number;
    educationalContext: number;
    multiplePerspectives: number;
  };
}

/**
 * Dashboard Configuration
 */
export interface DashboardConfig {
  refreshInterval: number;
  showCulturalMetrics: boolean;
  showAntiCensorshipMetrics: boolean;
  alertThresholds: {
    minPeers: number;
    maxLatency: number;
    minStability: number;
    maxCensorshipAttempts: number;
  };
  displayPreferences: {
    chartType: 'line' | 'bar' | 'area';
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
    detailLevel: 'basic' | 'detailed' | 'expert';
  };
}

/**
 * Component Props
 */
export interface NetworkHealthDashboardProps {
  class?: string;
  config?: Partial<DashboardConfig>;
  onMetricsUpdate?: (metrics: NetworkHealthMetrics) => void;
  onIssueDetected?: (issue: NetworkIssue) => void;
  onCulturalActivityChange?: (activity: CulturalNetworkStatus) => void;
  onCensorshipAttempt?: (attempt: AntiCensorshipStatus) => void;
  showDetailedMetrics?: boolean;
  enableRealTimeUpdates?: boolean;
  culturalContextEnabled?: boolean;
  antiCensorshipMonitoring?: boolean;
}

/**
 * Dashboard State
 */
export interface DashboardState {
  metrics: NetworkHealthMetrics | null;
  history: NetworkPerformanceHistory[];
  issues: NetworkIssue[];
  culturalStatus: CulturalNetworkStatus | null;
  antiCensorshipStatus: AntiCensorshipStatus | null;
  isLoading: boolean;
  lastUpdate: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

/**
 * Chart Data Types
 */
export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
  category?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color: string;
  type: 'line' | 'bar' | 'area';
}

/**
 * Export component type
 */
export type NetworkHealthDashboardComponent = Component<NetworkHealthDashboardProps>;
