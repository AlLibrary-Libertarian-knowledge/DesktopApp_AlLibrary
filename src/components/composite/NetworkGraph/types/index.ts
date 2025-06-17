export interface Node {
  id: string;
  label: string;
  type: 'self' | 'peer' | 'institution' | 'community';
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  angle?: number; // orbital angle
  orbitRadius?: number; // distance from center
  orbitSpeed?: number; // orbital speed
  isBeingDragged?: boolean; // drag state
  connections: number;
  bandwidth: number;
  latency: number;
  reliability: number;
  culturalContext?: string;

  // Enhanced P2P Data
  userId?: string;
  username?: string;
  location?: string;
  networkType?: 'internet' | 'tor' | 'hybrid';

  // Active File Transfers
  activeTransfers?: {
    downloading: Array<FileTransfer>;
    uploading: Array<FileTransfer>;
  };

  // Recently Shared/Received Files
  recentActivity?: Array<FileActivity>;

  // Peer Capabilities
  capabilities?: NodeCapabilities;

  // Network Statistics
  networkStats?: NetworkStats;
}

export interface FileTransfer {
  fileName: string;
  fileSize: number;
  progress: number; // 0-100
  speed: number; // KB/s
  timeRemaining: number; // seconds
  fileType: 'pdf' | 'epub';
  culturalSensitivity: 'public' | 'restricted' | 'sacred';
}

export interface FileActivity {
  fileName: string;
  action: 'sent' | 'received';
  timestamp: Date;
  fileSize: number;
  culturalContext?: string;
}

export interface NodeCapabilities {
  supportsSearch: boolean;
  supportsTor: boolean;
  maxFileSize: number;
  culturalSpecializations: string[];
  availableContent: number; // number of shared documents
  diskSpaceShared: number; // MB
}

export interface NetworkStats {
  totalDataShared: number; // MB
  totalDataReceived: number; // MB
  peersServed: number;
  uptime: number; // seconds
  lastSeen: Date;
}

export interface Link {
  source: string;
  target: string;
  strength: number;
  bandwidth: number;
  latency: number;
  status: 'active' | 'idle' | 'error';
}

export interface NetworkGraphProps {
  width?: number | string;
  height?: number | string;
  interactive?: boolean;
  showStats?: boolean;
  theme?: 'light' | 'dark';
}

export interface PhysicsConfig {
  minOrbitRadius: number;
  maxOrbitRadius: number;
  baseOrbitSpeed: number;
  speedVariation: number;
  drag: number;
  snapBackForce: number;
  centerAttraction: number;
  nodeRadius: number;
  atmosphereRadius: number;
  maxRepulsionForce: number;
  minSafeDistance: number;
  emergencyRepulsion: number;
  atmosphereDamping: number;
  orbitAdjustmentSensitivity: number;
}

export interface NetworkStatsState {
  totalPeers: number;
  activePeers: number;
  totalBandwidth: number;
  averageLatency: number;
  networkHealth: number;
}

export interface MousePosition {
  x: number;
  y: number;
}

export interface DragState {
  isDragging: boolean;
  draggedNode: Node | null;
  dragOffset: MousePosition;
  dragStartPosition: MousePosition | null;
  hasDraggedDistance: boolean;
}

export interface ExpansionState {
  expandedNode: Node | null;
  isExpanding: boolean;
  isExpanded: boolean;
  expandedPosition: MousePosition;
}

export interface PerformanceStats {
  nodeCount: number;
  renderTime: number;
  memoryUsage: number;
  frameRate: number;
  lastFrameTime: number;
  frameCount: number;
}
