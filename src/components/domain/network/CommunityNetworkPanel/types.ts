/**
 * CommunityNetworkPanel Component Types
 *
 * TypeScript interfaces for cultural community network participation
 * with educational context and anti-censorship compliance.
 */

import type { CommunityNetwork } from '../../../../types/Network';
import type { CommunityInformation } from '../../../../types/Cultural';

export interface CommunityNetworkPanelProps {
  // Display options
  class?: string;
  maxCommunities?: number;

  // Feature toggles
  showEducationalContext?: boolean;
  showCommunityInfo?: boolean;
  showJoinedCommunities?: boolean;
  enableCommunityDiscovery?: boolean;

  // Event handlers
  onCommunityJoin?: (communityId: string) => void;
  onCommunityLeave?: (communityId: string) => void;
  onCommunitySelect?: (community: CommunityNetwork) => void;
  onEducationalResourceAccess?: (resource: string) => void;
}

export interface CommunityDiscoveryResult {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  culturalOrigin: string;
  educationalResources: string[];
  protocols: string[];
  joinable: boolean;
  isJoined: boolean;
  lastActivity: string;
  culturalContext: {
    sensitivityLevel: number;
    description: string;
    educationalValue: 'high' | 'medium' | 'low';
    traditionalKnowledge: string[];
  };
  communityInfo?: CommunityInformation;
}

export interface CommunityNetworkMetrics {
  totalCommunities: number;
  joinedCommunities: number;
  availableEducationalResources: number;
  culturalExchanges: number;
  informationShared: number;
  sovereigntyScore: number;
}

export interface JoinCommunityRequest {
  communityId: string;
  educationalPurpose: string;
  respectProtocols: boolean;
  shareEducationalContext: boolean;
}

export interface CommunityEngagementSettings {
  shareEducationalContext: boolean;
  provideHistoricalContext: boolean;
  supportMultiplePerspectives: boolean;
  enableInformationSharing: boolean;
  participateInEducationalExchanges: boolean;
  respectCommunityProtocols: boolean;
  // Always false - no access restrictions
  readonly restrictAccess: false;
}
