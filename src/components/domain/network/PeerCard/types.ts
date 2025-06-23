/**
 * PeerCard Component Types
 *
 * TypeScript interfaces for the PeerCard component props and related functionality.
 */

import type { Peer } from '@/types/Network';

export interface PeerCardProps {
  // Core peer data
  peer: Peer;

  // Display options
  class?: string;
  variant?: 'default' | 'compact' | 'detailed';

  // Feature toggles
  showDetails?: boolean;
  showCulturalContext?: boolean;
  showCapabilities?: boolean;

  // Event handlers
  onConnect?: (peerId: string) => void;
  onDisconnect?: (peerId: string) => void;
  onViewDetails?: (peerId: string) => void;
}
