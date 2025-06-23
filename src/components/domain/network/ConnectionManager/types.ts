/**
 * ConnectionManager Component Types
 *
 * TypeScript interfaces for the ConnectionManager component and P2P network management.
 */

export interface ConnectionManagerProps {
  // Display options
  class?: string;
  variant?: 'default' | 'compact' | 'detailed';

  // Feature toggles
  showCulturalContext?: boolean;
  showAdvancedSettings?: boolean;

  // Event handlers
  onStatusChange?: (status: 'started' | 'stopped' | 'error') => void;
  onPeerConnect?: (peerId: string) => void;
  onPeerDisconnect?: (peerId: string) => void;
  onConfigChange?: (config: any) => void;
}
