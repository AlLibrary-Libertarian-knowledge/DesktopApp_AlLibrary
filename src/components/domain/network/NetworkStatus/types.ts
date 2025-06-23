/**
 * NetworkStatus Component Types
 *
 * TypeScript interfaces for the NetworkStatus component and related data structures.
 */

import type { CulturalMetadata } from '@/types/Cultural';

export interface NetworkStatusProps {
  // Display options
  class?: string;
  variant?: 'default' | 'compact' | 'detailed';

  // Auto-refresh configuration
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds

  // Feature toggles
  showMetrics?: boolean;
  showLastUpdated?: boolean;
  showRefreshButton?: boolean;
  showEducationalContext?: boolean;

  // Event handlers
  onStatusChange?: (status: NetworkStatusType) => void;
  onRefresh?: () => void;
}

export type NetworkStatusType = 'connected' | 'connecting' | 'disconnected' | 'error' | 'unknown';

export interface NetworkHealth {
  status: NetworkStatusType;
  nodeId?: string;
  connectedPeers: number;
  torEnabled?: boolean;
  culturalNetworks?: CulturalMetadata[];
  lastConnected?: Date;
  errorMessage?: string;
}

export interface NetworkMetrics {
  downloadSpeed: number; // bytes per second
  uploadSpeed: number; // bytes per second
  averageLatency: number; // milliseconds
  successRate: number; // 0-1 decimal
  totalConnections: number;
  activeConnections: number;
  dataTransferred: {
    sent: number; // bytes
    received: number; // bytes
  };
}

export interface PeerInfo {
  id: string;
  name?: string;
  address: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastSeen: Date;
  culturalContext?: CulturalMetadata;
  isAnonymous?: boolean;
  connectionType?: 'direct' | 'tor' | 'relay';
}

// Status display configuration
export interface StatusDisplayConfig {
  showIcon: boolean;
  showText: boolean;
  showDetails: boolean;
  compactMode: boolean;
}

// Network configuration options
export interface NetworkConfigDisplay {
  torSupport: boolean;
  ipfsEnabled: boolean;
  culturalNetworksEnabled: boolean;
  anonymousMode: boolean;
}
