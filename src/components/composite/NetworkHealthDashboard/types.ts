/**
 * NetworkHealthDashboard Component Types
 *
 * Types for the P2P network health dashboard.
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
 * Dashboard Configuration
 */
export interface DashboardConfig {
  refreshInterval: number;
  alertThresholds: {
    minPeers: number;
    maxLatency: number;
    minStability: number;
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
  showDetailedMetrics?: boolean;
  enableRealTimeUpdates?: boolean;
  timeRange?: '1h' | '6h' | '24h' | '7d';
}

/**
 * Dashboard State
 */
export interface DashboardState {
  metrics: NetworkHealthMetrics | null;
  history: NetworkPerformanceHistory[];
  issues: NetworkIssue[];
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
