import { Component, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import './NetworkGraph.css';

interface Node {
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
    downloading: Array<{
      fileName: string;
      fileSize: number;
      progress: number; // 0-100
      speed: number; // KB/s
      timeRemaining: number; // seconds
      fileType: 'pdf' | 'epub';
      culturalSensitivity: 'public' | 'restricted' | 'sacred';
    }>;
    uploading: Array<{
      fileName: string;
      fileSize: number;
      progress: number; // 0-100
      speed: number; // KB/s
      timeRemaining: number; // seconds
      fileType: 'pdf' | 'epub';
      culturalSensitivity: 'public' | 'restricted' | 'sacred';
    }>;
  };

  // Recently Shared/Received Files
  recentActivity?: Array<{
    fileName: string;
    action: 'sent' | 'received';
    timestamp: Date;
    fileSize: number;
    culturalContext?: string;
  }>;

  // Peer Capabilities
  capabilities?: {
    supportsSearch: boolean;
    supportsTor: boolean;
    maxFileSize: number;
    culturalSpecializations: string[];
    availableContent: number; // number of shared documents
    diskSpaceShared: number; // MB
  };

  // Network Statistics
  networkStats?: {
    totalDataShared: number; // MB
    totalDataReceived: number; // MB
    peersServed: number;
    uptime: number; // seconds
    lastSeen: Date;
  };
}

interface Link {
  source: string;
  target: string;
  strength: number;
  bandwidth: number;
  latency: number;
  status: 'active' | 'idle' | 'error';
}

interface NetworkGraphProps {
  width?: number | string;
  height?: number | string;
  interactive?: boolean;
  showStats?: boolean;
  theme?: 'light' | 'dark';
}

const NetworkGraph: Component<NetworkGraphProps> = props => {
  let canvasRef: HTMLCanvasElement | undefined;
  let animationId: number;

  const [hoveredNode, setHoveredNode] = createSignal<Node | null>(null);
  const [selectedNode, setSelectedNode] = createSignal<Node | null>(null);
  const [mousePosition, setMousePosition] = createSignal<{ x: number; y: number } | null>(null);
  const [draggedNode, setDraggedNode] = createSignal<Node | null>(null);
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragOffset, setDragOffset] = createSignal<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStartPosition, setDragStartPosition] = createSignal<{ x: number; y: number } | null>(
    null
  );
  const [hasDraggedDistance, setHasDraggedDistance] = createSignal(false);
  const [isLegendPinned, setIsLegendPinned] = createSignal(false);

  // Zoom and expanded view state
  const [expandedNode, setExpandedNode] = createSignal<Node | null>(null);
  const [isExpanding, setIsExpanding] = createSignal(false);
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [expandedPosition, setExpandedPosition] = createSignal<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const [networkStats, setNetworkStats] = createStore({
    totalPeers: 0,
    activePeers: 0,
    totalBandwidth: 0,
    averageLatency: 0,
    networkHealth: 0,
  });

  // Galaxy physics simulation parameters
  const physicsConfig = {
    minOrbitRadius: 80, // Minimum distance from center
    maxOrbitRadius: 300, // Maximum distance from center
    baseOrbitSpeed: 0.0002, // Base orbital speed (radians per frame) - made slower
    speedVariation: 0.3, // Random speed variation per node
    drag: 0.95, // Friction when dragging
    snapBackForce: 0.02, // Force to return to orbit when released
    centerAttraction: 0.001, // Gentle pull toward center
    nodeRadius: 35, // Visual radius of nodes
    atmosphereRadius: 160, // Invisible atmosphere around each node (much larger)
    maxRepulsionForce: 15.0, // Maximum repulsion strength (much stronger)
    minSafeDistance: 120, // Minimum safe distance between nodes (increased)
    emergencyRepulsion: 25.0, // Very strong force when too close (much stronger)
    atmosphereDamping: 0.95, // Speed reduction when entering atmosphere
    orbitAdjustmentSensitivity: 0.5, // How much dragging toward/away from center affects orbit
  };

  // AlLibrary P2P Network - Based on Real Project Architecture and Cultural Preservation Use Cases
  const [nodes, setNodes] = createStore<Node[]>([
    {
      id: 'self',
      label: 'You',
      type: 'self',
      status: 'connected',
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      orbitRadius: 0, // Center node doesn't orbit
      orbitSpeed: 0,
      isBeingDragged: false,
      connections: 8,
      bandwidth: 1024, // 1 Mbps upload capacity
      latency: 0,
      reliability: 100,
      userId: 'user_self',
      username: '192.168.1.157', // User's local IP
      location: 'Local Machine',
      networkType: 'hybrid',
      activeTransfers: {
        downloading: [
          {
            fileName: 'Indigenous_Rights_Brazil_2024.pdf',
            fileSize: 12288, // 12MB - realistic academic document
            progress: 73,
            speed: 512, // 512 KB/s - typical P2P speed
            timeRemaining: 240,
            fileType: 'pdf',
            culturalSensitivity: 'restricted',
          },
        ],
        uploading: [
          {
            fileName: 'Open_Science_Methods.epub',
            fileSize: 4096, // 4MB - realistic EPUB
            progress: 91,
            speed: 256,
            timeRemaining: 45,
            fileType: 'epub',
            culturalSensitivity: 'public',
          },
        ],
      },
      capabilities: {
        supportsSearch: true,
        supportsTor: true,
        maxFileSize: 102400, // 100MB max
        culturalSpecializations: ['academic', 'open_access'],
        availableContent: 47,
        diskSpaceShared: 5120, // 5GB shared
      },
      networkStats: {
        totalDataShared: 2048, // 2GB shared total
        totalDataReceived: 1536, // 1.5GB received
        peersServed: 12,
        uptime: 86400, // 24 hours
        lastSeen: new Date(),
      },
    },
    {
      id: 'indigenous-br',
      label: 'Fundação Nacional Indígena',
      type: 'institution',
      status: 'connected',
      x: 400 + 180 * Math.cos(0),
      y: 300 + 180 * Math.sin(0),
      vx: 0,
      vy: 0,
      angle: 0,
      orbitRadius: 180,
      orbitSpeed: 0.0008 + Math.random() * 0.0003,
      isBeingDragged: false,
      connections: 23,
      bandwidth: 512, // Institutional connection
      latency: 35, // Good Brazilian infrastructure
      reliability: 95,
      culturalContext: 'Brazilian Indigenous Heritage Preservation',
      userId: 'funai_br_001',
      username: 'FUNAI_Archive',
      location: 'Brasília, Brazil',
      networkType: 'internet',
      activeTransfers: {
        downloading: [],
        uploading: [
          {
            fileName: 'Tupi_Language_Dictionary.pdf',
            fileSize: 12288, // 12MB in KB - realistic for language dictionary
            progress: 42,
            speed: 128,
            timeRemaining: 320,
            fileType: 'pdf',
            culturalSensitivity: 'restricted',
          },
        ],
      },
      recentActivity: [
        {
          fileName: 'Amazonian_Medicinal_Plants.pdf',
          action: 'sent',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          fileSize: 12800,
          culturalContext: 'Traditional Knowledge - Community Approved',
        },
        {
          fileName: 'Ritual_Ceremonies_Guide.epub',
          action: 'received',
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          fileSize: 8192,
          culturalContext: 'Sacred Content - Elder Approved',
        },
      ],
      capabilities: {
        supportsSearch: true,
        supportsTor: false,
        maxFileSize: 102400, // 100MB in KB
        culturalSpecializations: ['indigenous_brazilian', 'traditional_medicine', 'tupi_language'],
        availableContent: 342,
        diskSpaceShared: 5120, // 5GB in MB
      },
      networkStats: {
        totalDataShared: 15360,
        totalDataReceived: 8192,
        peersServed: 156,
        uptime: 259200, // 3 days
        lastSeen: new Date(),
      },
    },
    {
      id: 'peer-2',
      label: 'Academic Library EU',
      type: 'institution',
      status: 'connected',
      x: 400 + 180 * Math.cos(Math.PI / 3), // 180px from center at 60 degrees
      y: 300 + 180 * Math.sin(Math.PI / 3),
      vx: 0,
      vy: 0,
      angle: Math.PI / 3,
      orbitRadius: 180,
      orbitSpeed: 0.001 + Math.random() * 0.0005,
      isBeingDragged: false,
      connections: 15,
      bandwidth: 2048,
      latency: 120,
      reliability: 98,
      userId: 'univ_eu_003',
      username: 'EuropeanDigitalLibrary',
      location: 'Amsterdam, Netherlands',
      networkType: 'hybrid',
      activeTransfers: {
        downloading: [
          {
            fileName: 'Climate_Research_2024.pdf',
            fileSize: 18432, // 18MB in KB - realistic for research paper
            progress: 23,
            speed: 1024,
            timeRemaining: 540,
            fileType: 'pdf',
            culturalSensitivity: 'public',
          },
          {
            fileName: 'European_History_Archives.epub',
            fileSize: 7168, // 7MB in KB - realistic for EPUB archive
            progress: 91,
            speed: 768,
            timeRemaining: 25,
            fileType: 'epub',
            culturalSensitivity: 'public',
          },
        ],
        uploading: [],
      },
      recentActivity: [
        {
          fileName: 'Open_Science_Handbook.pdf',
          action: 'sent',
          timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
          fileSize: 8192,
          culturalContext: 'Academic - Open Access',
        },
      ],
      capabilities: {
        supportsSearch: true,
        supportsTor: true,
        maxFileSize: 102400, // 100MB in KB
        culturalSpecializations: ['academic', 'european_history', 'open_science'],
        availableContent: 1247,
        diskSpaceShared: 51200, // 50GB in MB
      },
      networkStats: {
        totalDataShared: 102400,
        totalDataReceived: 76800,
        peersServed: 892,
        uptime: 604800, // 7 days
        lastSeen: new Date(),
      },
    },
    {
      id: 'peer-3',
      label: 'Community Archive',
      type: 'community',
      status: 'connecting',
      x: 400 + 200 * Math.cos((2 * Math.PI) / 3), // 200px from center at 120 degrees
      y: 300 + 200 * Math.sin((2 * Math.PI) / 3),
      vx: 0,
      vy: 0,
      angle: (2 * Math.PI) / 3,
      orbitRadius: 200,
      orbitSpeed: 0.0006 + Math.random() * 0.0003,
      isBeingDragged: false,
      connections: 3,
      bandwidth: 256,
      latency: 200,
      reliability: 78,
      culturalContext: 'Pacific Islander Stories',
      userId: 'comm_pac_007',
      username: 'PacificStoryKeepers',
      location: 'Fiji',
      networkType: 'tor',
      activeTransfers: {
        downloading: [],
        uploading: [],
      },
      recentActivity: [
        {
          fileName: 'Oral_Traditions_Collection.epub',
          action: 'sent',
          timestamp: new Date(Date.now() - 10800000), // 3 hours ago
          fileSize: 6144,
          culturalContext: 'Traditional Stories - Community Approved',
        },
      ],
      capabilities: {
        supportsSearch: false,
        supportsTor: true,
        maxFileSize: 51200, // 50MB in KB
        culturalSpecializations: ['pacific_islander', 'oral_traditions', 'storytelling'],
        availableContent: 89,
        diskSpaceShared: 1024, // 1GB in MB
      },
      networkStats: {
        totalDataShared: 3072,
        totalDataReceived: 1536,
        peersServed: 34,
        uptime: 172800, // 2 days
        lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
      },
    },
    {
      id: 'peer-4',
      label: 'Knowledge Hub',
      type: 'peer',
      status: 'connected',
      x: 400 + 160 * Math.cos(Math.PI), // 160px from center at 180 degrees
      y: 300 + 160 * Math.sin(Math.PI),
      vx: 0,
      vy: 0,
      angle: Math.PI,
      orbitRadius: 160,
      orbitSpeed: 0.0009 + Math.random() * 0.0004,
      isBeingDragged: false,
      connections: 6,
      bandwidth: 768,
      latency: 80,
      reliability: 88,
      userId: 'user_anon_042',
      username: 'KnowledgeSeeker42',
      location: 'Toronto, Canada',
      networkType: 'hybrid',
      activeTransfers: {
        downloading: [
          {
            fileName: 'Philosophy_Compendium.pdf',
            fileSize: 15360, // 15MB in KB - realistic for philosophy book
            progress: 15,
            speed: 384,
            timeRemaining: 720,
            fileType: 'pdf',
            culturalSensitivity: 'public',
          },
        ],
        uploading: [
          {
            fileName: 'Canadian_History_Notes.epub',
            fileSize: 4096, // 4MB in KB - realistic for notes
            progress: 67,
            speed: 192,
            timeRemaining: 85,
            fileType: 'epub',
            culturalSensitivity: 'public',
          },
        ],
      },
      recentActivity: [
        {
          fileName: 'Quantum_Physics_Basics.pdf',
          action: 'received',
          timestamp: new Date(Date.now() - 5400000), // 1.5 hours ago
          fileSize: 15360,
        },
      ],
      capabilities: {
        supportsSearch: true,
        supportsTor: true,
        maxFileSize: 51200, // 50MB in KB
        culturalSpecializations: ['philosophy', 'physics', 'canadian_history'],
        availableContent: 234,
        diskSpaceShared: 8192, // 8GB in MB
      },
      networkStats: {
        totalDataShared: 12288,
        totalDataReceived: 20480,
        peersServed: 67,
        uptime: 432000, // 5 days
        lastSeen: new Date(),
      },
    },
    {
      id: 'peer-5',
      label: 'Anonymous Node',
      type: 'peer',
      status: 'disconnected',
      x: 400 + 220 * Math.cos((4 * Math.PI) / 3), // 220px from center at 240 degrees
      y: 300 + 220 * Math.sin((4 * Math.PI) / 3),
      vx: 0,
      vy: 0,
      angle: (4 * Math.PI) / 3,
      orbitRadius: 220,
      orbitSpeed: -(0.0005 + Math.random() * 0.0002),
      isBeingDragged: false,
      connections: 0,
      bandwidth: 0,
      latency: 999,
      reliability: 0,
      userId: 'user_offline_999',
      username: 'AnonUser999',
      location: 'Unknown',
      networkType: 'tor',
      activeTransfers: {
        downloading: [],
        uploading: [],
      },
      recentActivity: [
        {
          fileName: 'Privacy_Guide.pdf',
          action: 'sent',
          timestamp: new Date(Date.now() - 86400000), // 24 hours ago
          fileSize: 4096,
          culturalContext: 'Digital Rights',
        },
      ],
      capabilities: {
        supportsSearch: false,
        supportsTor: true,
        maxFileSize: 10240, // 10MB in KB
        culturalSpecializations: ['privacy', 'digital_rights'],
        availableContent: 45,
        diskSpaceShared: 512, // 512MB in MB
      },
      networkStats: {
        totalDataShared: 2048,
        totalDataReceived: 1024,
        peersServed: 12,
        uptime: 0, // Currently offline
        lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
      },
    },
    {
      id: 'peer-6',
      label: 'Slow Connection Node',
      type: 'peer',
      status: 'connected',
      x: 400 + 140 * Math.cos((5 * Math.PI) / 3), // 140px from center at 300 degrees
      y: 300 + 140 * Math.sin((5 * Math.PI) / 3),
      vx: 0,
      vy: 0,
      angle: (5 * Math.PI) / 3,
      orbitRadius: 140,
      orbitSpeed: 0.0007 + Math.random() * 0.0003,
      isBeingDragged: false,
      connections: 2,
      bandwidth: 64,
      latency: 800,
      reliability: 45,
      userId: 'user_slow_123',
      username: 'SlowConnection123',
      location: 'Rural Australia',
      networkType: 'internet',
      activeTransfers: {
        downloading: [
          {
            fileName: 'Large_Dataset_Archive.pdf',
            fileSize: 51200, // 50MB - very large file taking 3+ days
            progress: 8,
            speed: 16, // Very slow - 16 KB/s
            timeRemaining: 259200, // 3+ days (72 hours)
            fileType: 'pdf',
            culturalSensitivity: 'public',
          },
        ],
        uploading: [],
      },
      capabilities: {
        supportsSearch: true,
        supportsTor: false,
        maxFileSize: 10240, // 10MB in KB
        culturalSpecializations: ['environmental_data'],
        availableContent: 23,
        diskSpaceShared: 2048, // 2GB in MB
      },
      networkStats: {
        totalDataShared: 512,
        totalDataReceived: 256,
        peersServed: 5,
        uptime: 86400, // 1 day
        lastSeen: new Date(),
      },
    },
    {
      id: 'peer-7',
      label: 'Corrupted Files Node',
      type: 'peer',
      status: 'error',
      x: 400 + 190 * Math.cos(Math.PI / 6), // 190px from center at 30 degrees
      y: 300 + 190 * Math.sin(Math.PI / 6),
      vx: 0,
      vy: 0,
      angle: Math.PI / 6,
      orbitRadius: 190,
      orbitSpeed: 0.0008 + Math.random() * 0.0004,
      isBeingDragged: false,
      connections: 1,
      bandwidth: 128,
      latency: 150,
      reliability: 25,
      userId: 'user_corrupt_456',
      username: 'TechTrouble456',
      location: 'Mumbai, India',
      networkType: 'internet',
      activeTransfers: {
        downloading: [],
        uploading: [],
      },
      capabilities: {
        supportsSearch: false,
        supportsTor: false,
        maxFileSize: 5120, // 5MB in KB
        culturalSpecializations: [],
        availableContent: 12,
        diskSpaceShared: 1024, // 1GB in MB
      },
      networkStats: {
        totalDataShared: 128,
        totalDataReceived: 64,
        peersServed: 2,
        uptime: 3600, // 1 hour
        lastSeen: new Date(),
      },
    },
    {
      id: 'peer-8',
      label: 'Reconnecting Node',
      type: 'community',
      status: 'connecting',
      x: 400 + 170 * Math.cos(Math.PI / 2), // 170px from center at 90 degrees
      y: 300 + 170 * Math.sin(Math.PI / 2),
      vx: 0,
      vy: 0,
      angle: Math.PI / 2,
      orbitRadius: 170,
      orbitSpeed: 0.0006 + Math.random() * 0.0003,
      isBeingDragged: false,
      connections: 4,
      bandwidth: 256,
      latency: 300,
      reliability: 60,
      userId: 'comm_reconnect_789',
      username: 'VillageLibrary789',
      location: 'Rural Kenya',
      networkType: 'internet',
      activeTransfers: {
        downloading: [],
        uploading: [],
      },
      capabilities: {
        supportsSearch: true,
        supportsTor: false,
        maxFileSize: 20480, // 20MB in KB
        culturalSpecializations: ['african_literature', 'swahili'],
        availableContent: 67,
        diskSpaceShared: 3072, // 3GB in MB
      },
      networkStats: {
        totalDataShared: 1024,
        totalDataReceived: 2048,
        peersServed: 15,
        uptime: 43200, // 12 hours
        lastSeen: new Date(Date.now() - 180000), // 3 minutes ago
      },
    },
    {
      id: 'peer-9',
      label: 'Verified Node',
      type: 'institution',
      status: 'connected',
      x: 400 + 210 * Math.cos((7 * Math.PI) / 4), // 210px from center at 315 degrees
      y: 300 + 210 * Math.sin((7 * Math.PI) / 4),
      vx: 0,
      vy: 0,
      angle: (7 * Math.PI) / 4,
      orbitRadius: 210,
      orbitSpeed: 0.0009 + Math.random() * 0.0004,
      isBeingDragged: false,
      connections: 18,
      bandwidth: 4096,
      latency: 25,
      reliability: 99,
      userId: 'inst_verified_001',
      username: 'NationalArchives',
      location: 'Washington DC, USA',
      networkType: 'hybrid',
      activeTransfers: {
        downloading: [],
        uploading: [],
      },
      capabilities: {
        supportsSearch: true,
        supportsTor: true,
        maxFileSize: 204800, // 200MB in KB
        culturalSpecializations: ['government_docs', 'historical_archives', 'public_records'],
        availableContent: 5000,
        diskSpaceShared: 102400, // 100GB in MB
      },
      networkStats: {
        totalDataShared: 512000,
        totalDataReceived: 256000,
        peersServed: 2500,
        uptime: 2592000, // 30 days
        lastSeen: new Date(),
      },
    },
  ]);

  // AlLibrary P2P Connection Network - Based on Real Network Topology
  const [links] = createStore<Link[]>([
    // Your node connections to major institutions and peers
    {
      source: 'self',
      target: 'indigenous-br',
      strength: 0.8,
      bandwidth: 512, // Active download from Brazilian institution
      latency: 35,
      status: 'active',
    },
    {
      source: 'self',
      target: 'peer-2',
      strength: 0.9,
      bandwidth: 1024, // Fast European research connection
      latency: 120,
      status: 'active',
    },
    {
      source: 'self',
      target: 'peer-3',
      strength: 0.4,
      bandwidth: 128, // Slow TOR connection to community archive
      latency: 450,
      status: 'idle',
    },
    {
      source: 'self',
      target: 'peer-4',
      strength: 0.6,
      bandwidth: 256, // Standard peer connection
      latency: 80,
      status: 'active',
    },
    // Inter-institutional connections
    {
      source: 'indigenous-br',
      target: 'peer-2',
      strength: 0.5,
      bandwidth: 256, // Brazil-Europe academic collaboration
      latency: 165,
      status: 'idle',
    },
    // Community archive connections through TOR
    {
      source: 'peer-3',
      target: 'peer-4',
      strength: 0.3,
      bandwidth: 64, // TOR network limitations
      latency: 520,
      status: 'active',
    },
    // Academic peer-to-peer sharing
    {
      source: 'peer-2',
      target: 'peer-4',
      strength: 0.7,
      bandwidth: 384, // European-Canadian academic exchange
      latency: 95,
      status: 'active',
    },
  ]);

  // Helper function to check if a node is connected to any other node
  const isNodeConnected = (nodeId: string): boolean => {
    return links.some(
      link =>
        (link.source === nodeId || link.target === nodeId) &&
        (link.status === 'active' || link.status === 'idle')
    );
  };

  // Recenter "You" node to the left side of the canvas
  const recenterCamera = () => {
    const selfNode = nodes.find(node => node.type === 'self');
    if (selfNode && canvasRef) {
      const rect = canvasRef.getBoundingClientRect();

      // Position more to the left (about 1/4 from left and 1/2 from top)
      const centerX = rect.width * 0.25;
      const centerY = rect.height * 0.48;

      // Move the "You" node to the center position
      setNodes(prevNodes =>
        prevNodes.map(node => (node.type === 'self' ? { ...node, x: centerX, y: centerY } : node))
      );
    }
  };

  // Handle node expansion
  const expandNode = (node: Node, clickX: number, clickY: number) => {
    if (expandedNode() === node) {
      // Close if already expanded
      closeExpandedNode();
      return;
    }

    setExpandedNode(node);
    setExpandedPosition({ x: clickX, y: clickY });
    setIsExpanding(true);

    // Faster expansion animation
    setTimeout(() => {
      setIsExpanded(true);
      setIsExpanding(false);
    }, 75); // Reduced from 100ms to 75ms for snappier feel
  };

  const closeExpandedNode = () => {
    setIsExpanded(false);
    setIsExpanding(true);

    // Faster close animation
    setTimeout(() => {
      setExpandedNode(null);
      setIsExpanding(false);
    }, 200); // Reduced from 300ms to 200ms
  };

  // Format time remaining for transfers
  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Format file size
  const formatFileSize = (sizeInKB: number) => {
    if (sizeInKB < 1024) {
      return `${sizeInKB} KB`;
    } else if (sizeInKB < 1024 * 1024) {
      return `${(sizeInKB / 1024).toFixed(1)} MB`;
    } else {
      return `${(sizeInKB / (1024 * 1024)).toFixed(1)} GB`;
    }
  };

  // Helper function to calculate repulsion force between two nodes (invisible atmosphere)
  const calculateRepulsionForce = (node1: Node, node2: Node): { fx: number; fy: number } => {
    const dx = node1.x - node2.x;
    const dy = node1.y - node2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0 && distance < physicsConfig.atmosphereRadius) {
      // Calculate atmosphere penetration (0 = edge of atmosphere, 1 = touching)
      const penetration = 1 - distance / physicsConfig.atmosphereRadius;

      // Exponential repulsion that gets stronger as nodes get closer
      const repulsionStrength = physicsConfig.maxRepulsionForce * Math.pow(penetration, 2);

      const forceX = (dx / distance) * repulsionStrength;
      const forceY = (dy / distance) * repulsionStrength;

      return { fx: forceX, fy: forceY };
    }

    return { fx: 0, fy: 0 };
  };

  // Apply atmosphere effects to all nodes (soft shield system)
  const applyAtmosphereEffects = (nodes: Node[]): Node[] => {
    return nodes.map((node, index) => {
      // Skip atmosphere effects for nodes being dragged
      if (node.isBeingDragged) return node;

      let totalForceX = 0;
      let totalForceY = 0;
      let atmosphereInfluence = 0;

      // Calculate repulsion from all other nodes and atmosphere influence
      nodes.forEach((otherNode, otherIndex) => {
        if (index !== otherIndex) {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Calculate atmosphere influence for speed damping
          if (distance < physicsConfig.atmosphereRadius) {
            const penetration = 1 - distance / physicsConfig.atmosphereRadius;
            atmosphereInfluence = Math.max(atmosphereInfluence, penetration);
          }

          // Calculate repulsion force
          const repulsion = calculateRepulsionForce(node, otherNode);
          totalForceX += repulsion.fx;
          totalForceY += repulsion.fy;
        }
      });

      // Apply speed damping based on atmosphere influence
      const speedDamping = 1 - atmosphereInfluence * 0.3; // Reduce speed by up to 30%

      // Apply repulsion forces with smooth damping
      const dampingFactor = 0.08; // Smooth, gentle movement

      return {
        ...node,
        x: node.x + totalForceX * dampingFactor,
        y: node.y + totalForceY * dampingFactor,
        // Store atmosphere influence for potential use in orbital speed
        atmosphereInfluence: speedDamping,
      };
    });
  };

  // Galaxy orbital physics simulation with draggable center
  const simulatePhysics = () => {
    const dragged = draggedNode();

    setNodes(prevNodes => {
      const centerNode = prevNodes.find(node => node.type === 'self');
      if (!centerNode) return prevNodes;

      let updatedNodes = prevNodes.map(node => {
        // Handle dragging for any node including the center
        if (dragged && dragged.id === node.id && isDragging()) {
          const mousePos = mousePosition();
          if (mousePos) {
            const dragOff = dragOffset();

            let newX = mousePos.x - dragOff.x;
            let newY = mousePos.y - dragOff.y;

            // No boundary constraints for infinite canvas

            // For non-center nodes, calculate new orbital distance based on drag position
            if (node.type !== 'self') {
              const dx = newX - centerNode.x;
              const dy = newY - centerNode.y;
              const newOrbitRadius = Math.sqrt(dx * dx + dy * dy);
              const newAngle = Math.atan2(dy, dx);

              // Constrain orbit radius within bounds
              const constrainedRadius = Math.max(
                physicsConfig.minOrbitRadius,
                Math.min(physicsConfig.maxOrbitRadius, newOrbitRadius)
              );

              // Calculate new speed based on distance and connection status
              const speedMultiplier = Math.pow(
                physicsConfig.minOrbitRadius /
                  Math.max(constrainedRadius, physicsConfig.minOrbitRadius),
                0.5
              );
              const baseSpeed =
                physicsConfig.baseOrbitSpeed *
                speedMultiplier *
                (1 + Math.random() * physicsConfig.speedVariation);

              // Make disconnected nodes orbit counterclockwise
              const isConnected = isNodeConnected(node.id);
              const newOrbitSpeed = isConnected ? baseSpeed : -baseSpeed;

              return {
                ...node,
                x: newX,
                y: newY,
                vx: 0,
                vy: 0,
                angle: newAngle,
                orbitRadius: constrainedRadius,
                orbitSpeed: newOrbitSpeed,
                isBeingDragged: true,
              };
            }

            return {
              ...node,
              x: newX,
              y: newY,
              vx: 0,
              vy: 0,
              isBeingDragged: true,
            };
          }
        }

        // For the center node, if not being dragged, just maintain position
        if (node.type === 'self') {
          return {
            ...node,
            isBeingDragged: dragged?.id === node.id,
          };
        }

        // For orbiting nodes, orbit around the center node
        if (!node.isBeingDragged) {
          const currentAngle = node.angle || 0;
          const radius = node.orbitRadius || 150;
          let speed = node.orbitSpeed || physicsConfig.baseOrbitSpeed;

          // Ensure disconnected nodes move counterclockwise
          const isConnected = isNodeConnected(node.id);
          if (!isConnected && speed > 0) {
            speed = -Math.abs(speed); // Make negative for counterclockwise
          } else if (isConnected && speed < 0) {
            speed = Math.abs(speed); // Make positive for clockwise
          }

          // Enhanced distance-based speed calculation (closer = much slower)
          const distanceFromCenter = Math.sqrt(
            (node.x - centerNode.x) ** 2 + (node.y - centerNode.y) ** 2
          );
          const speedMultiplier = Math.pow(
            physicsConfig.minOrbitRadius /
              Math.max(distanceFromCenter, physicsConfig.minOrbitRadius),
            0.7 // Higher exponent for more pronounced speed difference
          );
          const adjustedSpeed = speed * speedMultiplier;

          // Update angle for orbital motion
          const newAngle = currentAngle + adjustedSpeed;

          // Calculate target position based on orbital motion around the center node
          const targetX = centerNode.x + Math.cos(newAngle) * radius;
          const targetY = centerNode.y + Math.sin(newAngle) * radius;

          // Calculate repulsion forces from other nodes
          let repulsionX = 0;
          let repulsionY = 0;
          let maxAtmosphereInfluence = 0;

          prevNodes.forEach(otherNode => {
            if (node.id !== otherNode.id) {
              const dx = node.x - otherNode.x;
              const dy = node.y - otherNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              // Emergency repulsion for nodes that are too close
              if (distance > 0 && distance < physicsConfig.minSafeDistance) {
                const emergencyPenetration = 1 - distance / physicsConfig.minSafeDistance;
                const emergencyForce =
                  physicsConfig.emergencyRepulsion * Math.pow(emergencyPenetration, 1.5);

                repulsionX += (dx / distance) * emergencyForce;
                repulsionY += (dy / distance) * emergencyForce;
                maxAtmosphereInfluence = 1.0; // Maximum influence for emergency
              }
              // Normal atmosphere repulsion
              else if (distance > 0 && distance < physicsConfig.atmosphereRadius) {
                // Calculate atmosphere penetration
                const penetration = 1 - distance / physicsConfig.atmosphereRadius;
                maxAtmosphereInfluence = Math.max(maxAtmosphereInfluence, penetration);

                // Exponential repulsion that gets stronger as nodes get closer
                const repulsionStrength =
                  physicsConfig.maxRepulsionForce * Math.pow(penetration, 2);

                repulsionX += (dx / distance) * repulsionStrength;
                repulsionY += (dy / distance) * repulsionStrength;
              }
            }
          });

          // Apply strong repulsion to the target position (prioritize repulsion over orbit)
          const repulsionMultiplier = maxAtmosphereInfluence > 0.7 ? 8 : 4; // Much stronger when close
          const finalTargetX = targetX + repulsionX * repulsionMultiplier;
          const finalTargetY = targetY + repulsionY * repulsionMultiplier;

          // Smooth movement toward final target position (with repulsion)
          const currentX = node.x;
          const currentY = node.y;
          const lerpFactor = 0.1 * (1 - maxAtmosphereInfluence * 0.5); // Slower movement in atmosphere
          const newX = currentX + (finalTargetX - currentX) * lerpFactor;
          const newY = currentY + (finalTargetY - currentY) * lerpFactor;

          return {
            ...node,
            x: newX,
            y: newY,
            vx: 0,
            vy: 0,
            angle: newAngle,
            orbitSpeed: speed, // Update with corrected direction
            isBeingDragged: false,
          };
        }

        return node;
      });

      // Atmosphere effects are now integrated into orbital motion
      return updatedNodes;
    });
  };

  // Animation loop with physics simulation
  const animate = () => {
    if (
      !canvasRef ||
      typeof window === 'undefined' ||
      typeof requestAnimationFrame === 'undefined'
    ) {
      return;
    }

    simulatePhysics();
    drawNetwork();

    animationId = requestAnimationFrame(animate);
  };

  const drawNetwork = () => {
    if (!canvasRef) return;

    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.getBoundingClientRect();
    const width = rect.width || 500;
    const height = rect.height || 400;

    ctx.clearRect(0, 0, width, height);

    drawGrid(ctx, width, height);

    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);

      // Only draw links if BOTH nodes are connected
      if (
        sourceNode &&
        targetNode &&
        sourceNode.status === 'connected' &&
        targetNode.status === 'connected'
      ) {
        drawLink(ctx, sourceNode, targetNode, link);
      }
    });

    nodes.forEach(node => {
      drawNode(ctx, node);
    });

    // Draw UI elements (tooltip, etc.)
    const hovered = hoveredNode();
    const mousePos = mousePosition();
    if (hovered && mousePos) {
      drawTooltip(ctx, hovered, mousePos.x, mousePos.y, width, height);
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'var(--border-color)';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;

    const gridSize = 25;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  const drawLink = (ctx: CanvasRenderingContext2D, source: Node, target: Node, link: Link) => {
    let transferType = 'idle';
    let lineWidth = Math.max(1, (link.bandwidth / 1024) * 3);
    let isDirWithBandwidth = false;
    let uploadingNode: Node | null = null;
    let downloadingNode: Node | null = null;

    // Check BOTH nodes for active transfers to determine direction and color
    // Check source node for uploads/downloads
    if (source.activeTransfers) {
      if (source.activeTransfers.uploading.length > 0) {
        transferType = 'uploading';
        uploadingNode = source;
        lineWidth = Math.max(2, lineWidth * 1.5);
        isDirWithBandwidth = true;
      } else if (source.activeTransfers.downloading.length > 0) {
        transferType = 'downloading';
        downloadingNode = source;
        lineWidth = Math.max(2, lineWidth * 1.5);
        isDirWithBandwidth = true;
      }
    }

    // Check target node for uploads/downloads (prioritize uploads over downloads)
    if (target.activeTransfers) {
      if (target.activeTransfers.uploading.length > 0) {
        transferType = 'uploading';
        uploadingNode = target;
        lineWidth = Math.max(2, lineWidth * 1.5);
        isDirWithBandwidth = true;
      } else if (target.activeTransfers.downloading.length > 0 && transferType === 'idle') {
        transferType = 'downloading';
        downloadingNode = target;
        lineWidth = Math.max(2, lineWidth * 1.5);
        isDirWithBandwidth = true;
      }
    }

    // Enhanced color system based on transfer states
    const transferColors = {
      downloading: ['#2563eb', '#1d4ed8'], // Vivid blue - downloading
      uploading: ['#059669', '#047857'], // Dark green - uploading
      reconnecting: ['#f59e0b', '#d97706'], // Orange - reconnecting
      interrupted: ['#ef4444', '#dc2626'], // Red - interrupted
      corrupted: ['#dc2626', '#b91c1c'], // Dark red - corrupted
      slow: ['#8b5cf6', '#7c3aed'], // Purple - slow
      idle: ['#6b7280', '#9ca3af'], // Gray - idle
      verified: ['#16a34a', '#15803d'], // Dark green - verified
    } as const;

    const colors =
      transferColors[transferType as keyof typeof transferColors] || transferColors.idle;
    const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = link.strength;

    // Enhanced directional flow animations
    const time = Date.now() * 0.001;

    if (transferType === 'downloading') {
      // Flow TO the downloading node (inward to the node that's downloading)
      const flowOffset = (time * 30) % 30;
      ctx.setLineDash([8, 22]);
      ctx.lineDashOffset = downloadingNode === target ? -flowOffset : flowOffset;

      // Add glow effect for active downloads
      ctx.shadowColor = '#2563eb';
      ctx.shadowBlur = 8;
    } else if (transferType === 'uploading') {
      // Flow FROM the uploading node (outward from the node that's uploading)
      const flowOffset = (time * 25) % 25;
      ctx.setLineDash([6, 19]);
      ctx.lineDashOffset = uploadingNode === source ? -flowOffset : flowOffset;

      // Add glow effect for active uploads
      ctx.shadowColor = '#059669';
      ctx.shadowBlur = 6;
    } else if (link.status === 'active') {
      // General active connection
      const flowOffset = (time * 15) % 15;
      ctx.setLineDash([4, 11]);
      ctx.lineDashOffset = -flowOffset;
    } else {
      ctx.setLineDash([]);
    }

    // Draw the main line
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    // Add directional arrow for active transfers
    if (isDirWithBandwidth) {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const unitX = dx / length;
      const unitY = dy / length;

      // Position arrow based on transfer direction
      let arrowPos = 0.5; // Default center
      if (transferType === 'downloading' && downloadingNode) {
        // Arrow points TO the downloading node
        arrowPos = downloadingNode === target ? 0.75 : 0.25;
      } else if (transferType === 'uploading' && uploadingNode) {
        // Arrow points FROM the uploading node (toward the receiving node)
        arrowPos = uploadingNode === source ? 0.25 : 0.75;
      }

      const arrowX = source.x + dx * arrowPos;
      const arrowY = source.y + dy * arrowPos;

      // Draw animated arrow
      const arrowSize = 6 + Math.sin(time * 4) * 1;
      ctx.fillStyle = colors[1];
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * unitX - arrowSize * 0.5 * unitY,
        arrowY - arrowSize * unitY + arrowSize * 0.5 * unitX
      );
      ctx.lineTo(
        arrowX - arrowSize * unitX + arrowSize * 0.5 * unitY,
        arrowY - arrowSize * unitY - arrowSize * 0.5 * unitX
      );
      ctx.closePath();
      ctx.fill();
    }

    // Reset context
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: Node) => {
    const isHovered = hoveredNode()?.id === node.id;
    const isSelected = selectedNode()?.id === node.id;

    // Minimalistic size calculation - more subtle and refined
    const baseSize = 12;
    const connectionModifier = Math.min(node.connections * 0.5, 6); // Max +6px from connections

    // Transfer activity adds subtle size increase
    let activityModifier = 0;
    if (node.activeTransfers) {
      const hasDownloads = node.activeTransfers.downloading.length > 0;
      const hasUploads = node.activeTransfers.uploading.length > 0;
      activityModifier = (hasDownloads ? 2 : 0) + (hasUploads ? 2 : 0); // Max +4px for activity
    }

    const finalSize = baseSize + connectionModifier + activityModifier;

    // Enhanced color system based on transfer states and node status
    let nodeColor = '#6b7280'; // Default gray

    // Priority 1: Transfer state colors (highest priority)
    if (node.activeTransfers) {
      const downloads = node.activeTransfers.downloading;
      const uploads = node.activeTransfers.uploading;

      if (downloads.length > 0) {
        // Check for slow downloads (3+ days)
        const hasSlow = downloads.some(dl => dl.timeRemaining > 259200); // 3+ days
        if (hasSlow) {
          nodeColor = '#8b5cf6'; // Purple - slow downloads
        } else {
          nodeColor = '#2563eb'; // Blue - normal downloading
        }
      } else if (uploads.length > 0) {
        nodeColor = '#059669'; // Green - uploading
      }
    }

    // Priority 2: Node status colors (when no active transfers)
    if (nodeColor === '#6b7280') {
      if (node.status === 'connecting') {
        nodeColor = '#f59e0b'; // Orange - reconnecting
      } else if (node.status === 'disconnected') {
        nodeColor = '#ef4444'; // Red - stopped/interrupted
      } else if (node.status === 'error') {
        nodeColor = '#dc2626'; // Dark red - corrupted
      } else if (node.status === 'connected') {
        // Priority 3: Default node type colors for connected idle nodes
        const typeColors = {
          self: '#2563eb', // Blue
          peer: '#16a34a', // Verified green
          institution: '#7c3aed', // Purple
          community: '#ea580c', // Orange
        };
        nodeColor = typeColors[node.type];
      }
    }

    const statusColors = {
      connected: 1,
      connecting: 0.8,
      disconnected: 0.4,
      error: 0.6,
    };

    // Draw transfer progress indicators - more refined and subtle
    if (node.activeTransfers) {
      const time = Date.now() * 0.0008; // Slower, more elegant motion
      const { downloading, uploading } = node.activeTransfers;

      // Single elegant progress ring for downloads (if any)
      if (downloading.length > 0) {
        const primaryDownload = downloading[0];
        const progressAngle = (primaryDownload.progress / 100) * Math.PI * 2;
        const orbitRadius = finalSize + 12;

        // Subtle hash-based starting position
        let startAngle = 0;
        for (let i = 0; i < primaryDownload.fileName.length; i++) {
          startAngle += primaryDownload.fileName.charCodeAt(i);
        }
        startAngle = (startAngle % 360) * (Math.PI / 180);
        const currentAngle = startAngle + time * 0.6;

        // Background track - very subtle
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.15)';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, orbitRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Progress arc - clean and minimal
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(node.x, node.y, orbitRadius, currentAngle, currentAngle + progressAngle);
        ctx.stroke();

        // Progress indicator dot
        const progressDotX = node.x + Math.cos(currentAngle + progressAngle) * orbitRadius;
        const progressDotY = node.y + Math.sin(currentAngle + progressAngle) * orbitRadius;
        ctx.fillStyle = '#2563eb';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(progressDotX, progressDotY, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Single elegant progress ring for uploads (if any)
      if (uploading.length > 0) {
        const primaryUpload = uploading[0];
        const progressAngle = (primaryUpload.progress / 100) * Math.PI * 2;
        const orbitRadius = finalSize + 7;

        let startAngle = 0;
        for (let i = 0; i < primaryUpload.fileName.length; i++) {
          startAngle += primaryUpload.fileName.charCodeAt(i);
        }
        startAngle = (startAngle % 360) * (Math.PI / 180);
        const currentAngle = startAngle + time * -0.8; // Counter-clockwise

        // Background track
        ctx.strokeStyle = 'rgba(5, 150, 105, 0.15)';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, orbitRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Progress arc
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(node.x, node.y, orbitRadius, currentAngle, currentAngle + progressAngle);
        ctx.stroke();

        // Progress indicator dot
        const progressDotX = node.x + Math.cos(currentAngle + progressAngle) * orbitRadius;
        const progressDotY = node.y + Math.sin(currentAngle + progressAngle) * orbitRadius;
        ctx.fillStyle = '#059669';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(progressDotX, progressDotY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Reset context
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Subtle hover effect with scale animation
    if (isHovered || isSelected) {
      const time = Date.now() * 0.003;
      const scaleEffect = isHovered ? 1 + Math.sin(time) * 0.05 : 1; // Gentle pulsing when hovered

      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(node.x, node.y, (finalSize + 6) * scaleEffect, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Main node circle with clean styling
    ctx.fillStyle = nodeColor;
    ctx.globalAlpha = statusColors[node.status];
    ctx.beginPath();
    ctx.arc(node.x, node.y, finalSize, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight for depth
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.globalAlpha = statusColors[node.status] * 0.8;
    ctx.beginPath();
    ctx.arc(node.x, node.y - 1, finalSize * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Status-specific effects
    if (node.status === 'connecting') {
      const time = Date.now() * 0.002;
      const pulseAlpha = 0.3 + Math.sin(time) * 0.2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.globalAlpha = pulseAlpha;
      ctx.beginPath();
      ctx.arc(node.x, node.y, finalSize * 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (node.status === 'error') {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(node.x, node.y, finalSize + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Network type indicator - minimal and clean
    if (node.networkType && (isHovered || isSelected || node.type === 'self')) {
      const iconSize = 8;
      const iconX = node.x + finalSize + 8;
      const iconY = node.y - finalSize - 4;

      // Background circle for icon
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(iconX, iconY, iconSize, 0, Math.PI * 2);
      ctx.fill();

      // Icon
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 1;
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const networkIcons = {
        tor: '⚡',
        internet: '🌐',
        hybrid: '⚡',
      };

      const icon = networkIcons[node.networkType] || '◦';
      ctx.fillText(icon, iconX, iconY);
    }

    // Activity badge - show active transfer count
    const totalTransfers =
      (node.activeTransfers?.downloading.length || 0) +
      (node.activeTransfers?.uploading.length || 0);

    if (totalTransfers > 0) {
      const badgeX = node.x + finalSize - 4;
      const badgeY = node.y - finalSize + 4;
      const badgeRadius = 6;

      // Badge background
      ctx.fillStyle = '#f59e0b';
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Badge text
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 1;
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(totalTransfers.toString(), badgeX, badgeY);
    }

    // Clean label display
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    if (isHovered || isSelected || node.type === 'self') {
      // Node name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const displayName = node.username || node.label || 'Unknown';
      ctx.fillText(displayName, node.x, node.y + finalSize + 12);

      // Location (for non-self nodes)
      if (node.type !== 'self' && node.location) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(node.location, node.x, node.y + finalSize + 28);
      }

      // Connection count (minimal)
      if (node.connections > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(
          `${node.connections} peers`,
          node.x,
          node.y + finalSize + (node.location ? 42 : 28)
        );
      }
    }

    // Reset context
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
  };

  const drawTooltip = (
    ctx: CanvasRenderingContext2D,
    node: Node,
    mouseX: number,
    mouseY: number,
    width: number,
    height: number
  ) => {
    const padding = 16;
    const lineHeight = 20;

    const title = node.username || node.label || 'Unknown Node';

    // Create a clean, minimal summary with only essential info
    const lines: string[] = [];

    // Basic info - larger, readable text
    lines.push(
      `${node.type.charAt(0).toUpperCase() + node.type.slice(1)} • ${node.status.charAt(0).toUpperCase() + node.status.slice(1)}`
    );

    if (node.location && node.location !== 'Unknown') {
      lines.push(`📍 ${node.location}`);
    }

    // Active transfers - show only if there are any
    if (node.activeTransfers) {
      const downloads = node.activeTransfers.downloading;
      const uploads = node.activeTransfers.uploading;

      if (downloads.length > 0) {
        const dl = downloads[0]; // Show only primary download
        if (dl) {
          lines.push(`📥 ${dl.fileName.split('.')[0]}... (${dl.progress}%)`);
        }
      }

      if (uploads.length > 0) {
        const ul = uploads[0]; // Show only primary upload
        if (ul) {
          lines.push(`📤 ${ul.fileName.split('.')[0]}... (${ul.progress}%)`);
        }
      }
    }

    // Connection info - simplified
    if (node.connections > 0) {
      lines.push(`🔗 ${node.connections} peers connected`);
    }

    const titleFont = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const contentFont = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const hintFont = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Calculate dimensions with larger, more readable text
    ctx.font = titleFont;
    const titleWidth = ctx.measureText(title).width;

    ctx.font = contentFont;
    const maxContentWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const maxWidth = Math.max(titleWidth, maxContentWidth);

    const tooltipWidth = Math.min(maxWidth + padding * 2, 350);
    const tooltipHeight = (lines.length + 1) * lineHeight + padding * 2 + 30; // Extra space for hint

    const offset = 15;
    let tooltipX = mouseX + offset;
    let tooltipY = mouseY - tooltipHeight - offset;

    // Position adjustment to keep tooltip on screen
    if (tooltipX + tooltipWidth > width) {
      tooltipX = mouseX - tooltipWidth - offset;
    }

    if (tooltipY < 0) {
      tooltipY = mouseY + offset;
    }

    tooltipX = Math.max(5, Math.min(tooltipX, width - tooltipWidth - 5));
    tooltipY = Math.max(5, Math.min(tooltipY, height - tooltipHeight - 5));

    // Sleek gradient background
    const gradient = ctx.createLinearGradient(
      tooltipX,
      tooltipY,
      tooltipX,
      tooltipY + tooltipHeight
    );
    gradient.addColorStop(0, 'rgba(30, 41, 59, 0.95)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');

    // Enhanced shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 12);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Node type colored border
    const typeColors = {
      self: '#3b82f6',
      peer: '#10b981',
      institution: '#a855f7',
      community: '#f59e0b',
    };

    ctx.strokeStyle = typeColors[node.type];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 12);
    ctx.stroke();

    // Title with larger, bold text
    ctx.fillStyle = '#ffffff';
    ctx.font = titleFont;
    ctx.textAlign = 'left';
    ctx.fillText(title, tooltipX + padding, tooltipY + padding + 18);

    // Subtle separator line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tooltipX + padding, tooltipY + padding + 28);
    ctx.lineTo(tooltipX + tooltipWidth - padding, tooltipY + padding + 28);
    ctx.stroke();

    // Content with improved readability
    ctx.font = contentFont;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

    lines.forEach((line, index) => {
      const yPos = tooltipY + padding + 28 + 12 + (index + 1) * lineHeight;
      ctx.fillText(line, tooltipX + padding, yPos);
    });

    // Click hint with enhanced styling
    const hintY = tooltipY + tooltipHeight - 15;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = hintFont;
    ctx.textAlign = 'center';
    ctx.fillText('🖱️ Click for details', tooltipX + tooltipWidth / 2, hintY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });

    // Check if we've dragged a meaningful distance (threshold for distinguishing drag from click)
    const dragStart = dragStartPosition();
    if (isDragging() && dragStart) {
      const dragDistance = Math.sqrt((x - dragStart.x) ** 2 + (y - dragStart.y) ** 2);
      if (dragDistance > 5) {
        // 5px threshold
        setHasDraggedDistance(true);
      }
    }

    // Handle dragging
    if (isDragging() && draggedNode()) {
      // Dragging is handled in the physics simulation
      return;
    }

    // Normal hover detection when not dragging
    const hoveredNodeFound = nodes.find(node => {
      const baseSize = 12;
      const nodeSize = baseSize + node.connections * 1.5;
      const clickRadius = nodeSize + 4;

      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance < clickRadius;
    });

    setHoveredNode(hoveredNodeFound || null);
    canvasRef.style.cursor = hoveredNodeFound ? 'pointer' : 'default';
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find the node under the mouse (including the "You" node now)
    const clickedNode = nodes.find(node => {
      const baseSize = 12;
      const nodeSize = baseSize + node.connections * 1.5;
      const clickRadius = nodeSize + 4;

      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance < clickRadius;
    });

    if (clickedNode) {
      setDraggedNode(clickedNode);
      setIsDragging(true);
      setDragStartPosition({ x, y });
      setHasDraggedDistance(false); // Reset drag distance flag
      setDragOffset({ x: x - clickedNode.x, y: y - clickedNode.y });
      canvasRef.style.cursor = 'grabbing';

      // Mark the node as being dragged
      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === clickedNode.id ? { ...node, isBeingDragged: true } : node
        )
      );
    }
  };

  const handleMouseUp = () => {
    if (isDragging() && draggedNode()) {
      // Mark the node as no longer being dragged
      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === draggedNode()!.id ? { ...node, isBeingDragged: false } : node
        )
      );
    }

    // Reset drag tracking states
    setIsDragging(false);
    setDraggedNode(null);
    setDragStartPosition(null);
    // Note: Don't reset hasDraggedDistance here - we need it for the click handler

    if (canvasRef) {
      canvasRef.style.cursor = hoveredNode() ? 'pointer' : 'default';
    }
  };

  const handleClick = (e: MouseEvent) => {
    // Check if this was actually a drag operation
    if (hasDraggedDistance()) {
      // Reset the flag after a drag
      setHasDraggedDistance(false);
      return;
    }

    // Only handle click if we're not currently dragging
    if (isDragging()) return;

    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      const baseSize = 12;
      const nodeSize = baseSize + node.connections * 1.5;
      const clickRadius = nodeSize + 4;

      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance < clickRadius;
    });

    if (clickedNode) {
      // Small delay to ensure this is a true click and not the end of a drag
      setTimeout(() => {
        if (!hasDraggedDistance()) {
          // Expand the node with smooth animation
          expandNode(clickedNode, e.clientX, e.clientY);
        }
      }, 50);
    } else {
      // Close expanded node if clicking elsewhere
      if (expandedNode()) {
        closeExpandedNode();
      }
    }

    setSelectedNode(clickedNode || null);
  };

  createEffect(() => {
    const activePeers = nodes.filter(n => n.status === 'connected').length;
    const totalBandwidth = nodes.reduce((sum, n) => sum + n.bandwidth, 0);
    const averageLatency = nodes
      .filter(n => n.status === 'connected')
      .reduce((sum, n, _, arr) => sum + n.latency / arr.length, 0);
    const networkHealth = Math.round((activePeers / nodes.length) * 100);

    setNetworkStats({
      totalPeers: nodes.length - 1,
      activePeers: activePeers - 1,
      totalBandwidth,
      averageLatency: Math.round(averageLatency),
      networkHealth,
    });
  });

  onMount(() => {
    if (canvasRef) {
      const setupCanvas = () => {
        const rect = canvasRef!.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvasRef!.width = rect.width * dpr;
        canvasRef!.height = rect.height * dpr;

        const originalWidth = typeof props.width === 'string' ? props.width : `${rect.width}px`;
        const originalHeight = typeof props.height === 'string' ? props.height : `${rect.height}px`;

        canvasRef!.style.width = originalWidth;
        canvasRef!.style.height = originalHeight;

        const ctx = canvasRef!.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      };

      setupCanvas();

      const resizeObserver = new ResizeObserver(setupCanvas);
      resizeObserver.observe(canvasRef);

      canvasRef.addEventListener('mousemove', handleMouseMove);
      canvasRef.addEventListener('mousedown', handleMouseDown);
      canvasRef.addEventListener('mouseup', handleMouseUp);
      canvasRef.addEventListener('click', handleClick);

      // Add global mouse up to handle dragging that ends outside the canvas
      document.addEventListener('mouseup', handleMouseUp);

      animate();

      return () => {
        resizeObserver.disconnect();
        if (canvasRef) {
          canvasRef.removeEventListener('mousemove', handleMouseMove);
          canvasRef.removeEventListener('mousedown', handleMouseDown);
          canvasRef.removeEventListener('mouseup', handleMouseUp);
          canvasRef.removeEventListener('click', handleClick);
        }
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }

    return () => {};
  });

  onCleanup(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (canvasRef) {
      canvasRef.removeEventListener('mousemove', handleMouseMove);
      canvasRef.removeEventListener('mousedown', handleMouseDown);
      canvasRef.removeEventListener('mouseup', handleMouseUp);
      canvasRef.removeEventListener('click', handleClick);
    }
    document.removeEventListener('mouseup', handleMouseUp);
  });

  return (
    <div class={`network-graph ${props.theme || 'light'}`}>
      <canvas
        ref={canvasRef}
        style={{
          width: typeof props.width === 'string' ? props.width : `${props.width || 500}px`,
          height: typeof props.height === 'string' ? props.height : `${props.height || 400}px`,
        }}
        class="network-canvas"
      />

      {/* Modern Recenter Floating Action Button */}
      <div class="recenter-fab-container">
        <button
          class="recenter-fab"
          onClick={recenterCamera}
          title="Recenter view on You node"
          aria-label="Recenter camera view"
        >
          <div class="recenter-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="m12 1 0 6" />
              <path d="m12 17 0 6" />
              <path d="m1 12 6 0" />
              <path d="m17 12 6 0" />
            </svg>
          </div>
          <span class="recenter-text">Center</span>
        </button>

        {/* Ripple effect container */}
        <div class="recenter-ripple" />
      </div>

      {/* Transfer Progress Legend */}
      <div
        class={`transfer-legend ${isLegendPinned() ? 'pinned' : ''}`}
        onClick={e => {
          e.stopPropagation();
          setIsLegendPinned(!isLegendPinned());
        }}
      >
        <div class="legend-title">
          Transfer Status Guide
          {isLegendPinned() && (
            <div style="position: absolute; top: -4px; right: -4px; background: #f59e0b; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px;">
              📌
            </div>
          )}
        </div>
        <div class="legend-sections">
          {/* Active File Transfers */}
          <div class="legend-section">
            <div class="legend-section-title">Transfer States</div>
            <div class="legend-items">
              <div class="legend-item">
                <div class="legend-indicator downloading-active"></div>
                <span>Downloading Files</span>
              </div>
              <div class="legend-item">
                <div class="legend-indicator uploading-active"></div>
                <span>Uploading/Sending Files</span>
              </div>
              <div class="legend-item">
                <div class="legend-indicator reconnecting"></div>
                <span>Reconnecting (Disconnected)</span>
              </div>
              <div class="legend-item">
                <div class="legend-indicator interrupted"></div>
                <span>Stopped/Interrupted</span>
              </div>
            </div>
          </div>

          {/* File Issues */}
          <div class="legend-section">
            <div class="legend-section-title">File Status</div>
            <div class="legend-items">
              <div class="legend-item">
                <div class="legend-indicator corrupted"></div>
                <span>Corrupted Files</span>
              </div>
              <div class="legend-item">
                <div class="legend-indicator slow-transfer"></div>
                <span>Slow Downloads (3+ days)</span>
              </div>
              <div class="legend-item">
                <div class="legend-indicator verified"></div>
                <span>Verified/Complete</span>
              </div>
              <div class="legend-item">
                <div class="legend-indicator pending"></div>
                <span>Pending/Queued</span>
              </div>
            </div>
          </div>

          {/* Connection Lines */}
          <div class="legend-section">
            <div class="legend-section-title">Connection Types</div>
            <div class="legend-items">
              <div class="legend-item">
                <div class="legend-line solid-line"></div>
                <span>━ High Speed</span>
              </div>
              <div class="legend-item">
                <div class="legend-line dashed-line"></div>
                <span>┅ Medium Speed</span>
              </div>
              <div class="legend-item">
                <div class="legend-line dotted-line"></div>
                <span>⋯ Low/Unstable</span>
              </div>
            </div>
          </div>
        </div>

        <div class="legend-footer">
          <div class="legend-tip">
            💡 <strong>Hover to expand • Click to pin</strong> • Click nodes for detailed P2P info
          </div>
        </div>
      </div>

      {/* Expanded Node Overlay */}
      {expandedNode() && (
        <div
          class={`expanded-node-overlay ${isExpanded() ? 'expanded' : ''} ${isExpanding() ? 'expanding' : ''}`}
          onClick={e => {
            e.stopPropagation();
            closeExpandedNode();
          }}
        >
          <div class="expanded-node-content" onClick={e => e.stopPropagation()}>
            <div class="expanded-node-header">
              <div class="node-avatar">
                <div class={`node-type-indicator ${expandedNode()!.type}`}>
                  {expandedNode()!.networkType === 'tor'
                    ? '🧅'
                    : expandedNode()!.networkType === 'hybrid'
                      ? '🔄'
                      : '🌐'}
                </div>
              </div>
              <div class="node-info">
                <h3 class="node-title">{expandedNode()!.username || expandedNode()!.label}</h3>
                <p class="node-subtitle">
                  {expandedNode()!.location} •{' '}
                  {expandedNode()!.type.charAt(0).toUpperCase() + expandedNode()!.type.slice(1)}
                </p>
                <div class="node-status-badges">
                  <span class={`status-badge ${expandedNode()!.status}`}>
                    {expandedNode()!.status}
                  </span>
                  <span class="network-badge">{expandedNode()!.networkType?.toUpperCase()}</span>
                </div>
              </div>
              <button class="close-button" onClick={closeExpandedNode}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div class="expanded-node-body">
              <div class="content-columns">
                {/* Left Column - Active Transfers */}
                <div class="column-left">
                  {expandedNode()!.activeTransfers && (
                    <div class="section compact">
                      <h4 class="section-title">🔄 Active Transfers</h4>
                      <div class="transfers-horizontal">
                        {expandedNode()!.activeTransfers.downloading.length > 0 && (
                          <div class="transfer-group-compact">
                            <h5 class="transfer-type">📥 Downloading</h5>
                            {expandedNode()!.activeTransfers!.downloading.map((dl, index) => (
                              <div class="transfer-item-compact">
                                <div class="transfer-file-info">
                                  <span class="file-name-compact">{dl.fileName}</span>
                                  <span class="file-size-compact">
                                    {formatFileSize(dl.fileSize)}
                                  </span>
                                </div>
                                <div class="transfer-progress-compact">
                                  <div class="progress-bar-compact">
                                    <div
                                      class="progress-fill download-progress"
                                      style={`width: ${dl.progress}%`}
                                    ></div>
                                  </div>
                                  <span class="progress-text-compact">{dl.progress}%</span>
                                </div>
                                <div class="transfer-meta-compact">
                                  <span class="speed-compact">{dl.speed} KB/s</span>
                                  {dl.culturalSensitivity !== 'public' && (
                                    <span
                                      class={`sensitivity-badge-compact ${dl.culturalSensitivity}`}
                                    >
                                      🛡️ {dl.culturalSensitivity}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {expandedNode()!.activeTransfers!.uploading.length > 0 && (
                          <div class="transfer-group-compact">
                            <h5 class="transfer-type">📤 Uploading</h5>
                            {expandedNode()!.activeTransfers!.uploading.map((ul, index) => (
                              <div class="transfer-item-compact">
                                <div class="transfer-file-info">
                                  <span class="file-name-compact">{ul.fileName}</span>
                                  <span class="file-size-compact">
                                    {formatFileSize(ul.fileSize)}
                                  </span>
                                </div>
                                <div class="transfer-progress-compact">
                                  <div class="progress-bar-compact">
                                    <div
                                      class="progress-fill upload-progress"
                                      style={`width: ${ul.progress}%`}
                                    ></div>
                                  </div>
                                  <span class="progress-text-compact">{ul.progress}%</span>
                                </div>
                                <div class="transfer-meta-compact">
                                  <span class="speed-compact">{ul.speed} KB/s</span>
                                  {ul.culturalSensitivity !== 'public' && (
                                    <span
                                      class={`sensitivity-badge-compact ${ul.culturalSensitivity}`}
                                    >
                                      🛡️ {ul.culturalSensitivity}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {!expandedNode()!.activeTransfers.downloading.length &&
                          !expandedNode()!.activeTransfers.uploading.length && (
                            <p class="no-transfers-compact">No active transfers</p>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  {expandedNode()!.recentActivity && expandedNode()!.recentActivity!.length > 0 && (
                    <div class="section compact">
                      <h4 class="section-title">📋 Recent Activity</h4>
                      <div class="activity-list-compact">
                        {expandedNode()!
                          .recentActivity!.slice(0, 4)
                          .map((activity, index) => (
                            <div class="activity-item-compact">
                              <div class="activity-icon-compact">
                                {activity.action === 'sent' ? '📤' : '📥'}
                              </div>
                              <div class="activity-content-compact">
                                <span class="activity-file-compact">{activity.fileName}</span>
                                <div class="activity-meta-compact">
                                  <span class="activity-time-compact">
                                    {Math.floor(
                                      (Date.now() - activity.timestamp.getTime()) / 60000
                                    )}
                                    m ago
                                  </span>
                                  <span class="activity-size-compact">
                                    {formatFileSize(activity.fileSize)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Stats & Capabilities */}
                <div class="column-right">
                  {/* Network Statistics */}
                  {expandedNode()!.networkStats && (
                    <div class="section compact">
                      <h4 class="section-title">📊 Network Statistics</h4>
                      <div class="stats-grid-compact">
                        <div class="stat-item-compact">
                          <span class="stat-label-compact">Data Shared</span>
                          <span class="stat-value-compact">
                            {(expandedNode()!.networkStats!.totalDataShared / 1024).toFixed(1)} MB
                          </span>
                        </div>
                        <div class="stat-item-compact">
                          <span class="stat-label-compact">Data Received</span>
                          <span class="stat-value-compact">
                            {(expandedNode()!.networkStats!.totalDataReceived / 1024).toFixed(1)} MB
                          </span>
                        </div>
                        <div class="stat-item-compact">
                          <span class="stat-label-compact">Peers Served</span>
                          <span class="stat-value-compact">
                            {expandedNode()!.networkStats!.peersServed}
                          </span>
                        </div>
                        <div class="stat-item-compact">
                          <span class="stat-label-compact">Uptime</span>
                          <span class="stat-value-compact">
                            {expandedNode()!.networkStats!.uptime > 0
                              ? `${Math.floor(expandedNode()!.networkStats!.uptime / 3600)}h`
                              : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Capabilities */}
                  {expandedNode()!.capabilities && (
                    <div class="section compact">
                      <h4 class="section-title">⚡ Capabilities</h4>
                      <div class="capabilities-grid-compact">
                        <div class="capability-item-compact">
                          <span class="capability-label-compact">Available Files</span>
                          <span class="capability-value-compact">
                            {expandedNode()!.capabilities!.availableContent}
                          </span>
                        </div>
                        <div class="capability-item-compact">
                          <span class="capability-label-compact">Shared Space</span>
                          <span class="capability-value-compact">
                            {(expandedNode()!.capabilities!.diskSpaceShared / 1024).toFixed(1)} GB
                          </span>
                        </div>
                        <div class="capability-item-compact">
                          <span class="capability-label-compact">Max File Size</span>
                          <span class="capability-value-compact">
                            {formatFileSize(expandedNode()!.capabilities!.maxFileSize)}
                          </span>
                        </div>
                      </div>

                      {expandedNode()!.capabilities!.culturalSpecializations.length > 0 && (
                        <div class="specializations-compact">
                          <h5 class="specializations-title-compact">Cultural Specializations</h5>
                          <div class="specialization-tags-compact">
                            {expandedNode()!.capabilities!.culturalSpecializations.map(
                              (spec, index) => (
                                <span class="specialization-tag-compact">
                                  {spec.replace(/_/g, ' ')}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {props.showStats && (
        <div class="network-stats">
          <div class="network-stat-item">
            <span class="network-stat-label">Peers</span>
            <span class="network-stat-value">
              {networkStats.activePeers}/{networkStats.totalPeers}
            </span>
          </div>
          <div class="network-stat-item">
            <span class="network-stat-label">Bandwidth</span>
            <span class="network-stat-value">
              {(networkStats.totalBandwidth / 1024).toFixed(1)} MB/s
            </span>
          </div>
          <div class="network-stat-item">
            <span class="network-stat-label">Latency</span>
            <span class="network-stat-value">{networkStats.averageLatency}ms</span>
          </div>
          <div class="network-stat-item">
            <span class="network-stat-label">Health</span>
            <span
              class={`network-stat-value health-${networkStats.networkHealth > 80 ? 'good' : networkStats.networkHealth > 50 ? 'fair' : 'poor'}`}
            >
              {networkStats.networkHealth}%
            </span>
          </div>
        </div>
      )}

      {selectedNode() && (
        <div class="node-details">
          <h4>{selectedNode()!.label}</h4>
          <div class="detail-grid">
            <span>Type:</span> <span>{selectedNode()!.type}</span>
            <span>Status:</span>{' '}
            <span class={`status-${selectedNode()!.status}`}>{selectedNode()!.status}</span>
            <span>Connections:</span> <span>{selectedNode()!.connections}</span>
            <span>Bandwidth:</span> <span>{selectedNode()!.bandwidth} KB/s</span>
            <span>Latency:</span> <span>{selectedNode()!.latency}ms</span>
            <span>Reliability:</span> <span>{selectedNode()!.reliability}%</span>
          </div>
          {selectedNode()!.culturalContext && (
            <div class="cultural-context">
              <strong>Cultural Context:</strong>
              <p>{selectedNode()!.culturalContext}</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .recenter-fab-container {
          position: absolute;
          bottom: 20px;
          left: 20px;
          z-index: 20;
        }

        .recenter-fab {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(30, 41, 59, 0.85);
          color: white;
          border: none;
          border-radius: 24px;
          padding: 10px 16px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          letter-spacing: 0.2px;
          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.15),
            0 1px 3px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .recenter-fab:hover {
          transform: translateY(-1px);
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.2),
            0 2px 6px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          background: rgba(30, 41, 59, 0.95);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .recenter-fab:active {
          transform: translateY(0) scale(0.98);
          transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .recenter-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .recenter-fab:hover .recenter-icon {
          transform: rotate(90deg);
        }

        .recenter-text {
          opacity: 0.9;
          transition: opacity 0.2s ease;
        }

        .recenter-fab:hover .recenter-text {
          opacity: 1;
        }

        .recenter-ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%);
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .recenter-fab:active .recenter-ripple {
          width: 50px;
          height: 50px;
          opacity: 0;
        }

        /* Dark theme adjustments */
        .network-graph.dark .recenter-fab {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.25),
            0 1px 3px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .network-graph.dark .recenter-fab:hover {
          background: rgba(15, 23, 42, 0.95);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.3),
            0 2px 6px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        /* Subtle pulse animation for better discoverability */
        @keyframes subtle-pulse {
          0%,
          100% {
            box-shadow:
              0 2px 8px rgba(0, 0, 0, 0.15),
              0 1px 3px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow:
              0 3px 10px rgba(0, 0, 0, 0.2),
              0 2px 4px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.12);
          }
        }

        .recenter-fab {
          animation: subtle-pulse 4s ease-in-out infinite;
        }

        .recenter-fab:hover {
          animation: none;
        }

        /* Accessibility improvements */
        .recenter-fab:focus {
          outline: none;
          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.15),
            0 1px 3px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 2px rgba(59, 130, 246, 0.5);
        }

        @media (prefers-reduced-motion: reduce) {
          .recenter-fab,
          .recenter-icon,
          .recenter-ripple {
            transition: none !important;
            animation: none !important;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .recenter-fab-container {
            bottom: 16px;
            left: 16px;
          }

          .recenter-fab {
            padding: 8px 12px;
            font-size: 11px;
          }

          .recenter-text {
            display: none;
          }
        }

        /* Transfer Legend Styles */
        .transfer-legend {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(30, 41, 59, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 8px;
          backdrop-filter: blur(12px);
          box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.25),
            0 2px 8px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          width: 200px;
          z-index: 15;
          transform-origin: bottom right;
          transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          cursor: pointer;
          pointer-events: auto;
        }

        .transfer-legend:hover,
        .transfer-legend.pinned {
          position: absolute;
          left: 3%;
          right: 3%;
          bottom: 3%;
          top: 8%;
          width: auto;
          max-width: none;
          height: auto;
          transform: none;
          background: rgba(15, 23, 42, 0.98);
          box-shadow:
            0 8px 40px rgba(0, 0, 0, 0.6),
            0 4px 16px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.25);
          border-width: 1px;
          z-index: 50;
          padding: 20px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: stretch;
          overflow: hidden;
          min-height: 0;
        }

        .legend-title {
          color: #fbbf24;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 8px;
          text-align: center;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          transition: all 0.3s ease;
        }

        .transfer-legend:hover .legend-title,
        .transfer-legend.pinned .legend-title {
          font-size: 18px;
          margin-bottom: 16px;
          color: #fcd34d;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .legend-sections {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .transfer-legend:hover .legend-sections,
        .transfer-legend.pinned .legend-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
          flex: 1 1 auto;
          margin: 12px 0;
          min-height: 0;
          overflow: visible;
        }

        .legend-section {
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 4px;
        }

        .legend-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .legend-section-title {
          color: rgba(255, 255, 255, 0.85);
          font-size: 8px;
          font-weight: 600;
          margin-bottom: 3px;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          transition: all 0.3s ease;
        }

        .transfer-legend:hover .legend-section-title,
        .transfer-legend.pinned .legend-section-title {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.98);
          margin-bottom: 12px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .legend-items {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .transfer-legend:hover .legend-items,
        .transfer-legend.pinned .legend-items {
          gap: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 8px;
          color: rgba(255, 255, 255, 0.8);
          padding: 0;
          transition: all 0.3s ease;
        }

        .transfer-legend:hover .legend-item,
        .transfer-legend.pinned .legend-item {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.95);
          gap: 14px;
          padding: 6px 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .legend-indicator {
          width: 10px;
          height: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 7px;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .transfer-legend:hover .legend-indicator,
        .transfer-legend.pinned .legend-indicator {
          width: 18px;
          height: 18px;
          transform: scale(1.3);
          box-shadow: 0 0 14px currentColor;
        }

        .transfer-legend:hover .legend-line {
          width: 30px;
          height: 4px;
          transform: scale(1.2);
        }

        .legend-footer {
          margin-top: 6px;
          padding-top: 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .transfer-legend:hover .legend-footer,
        .transfer-legend.pinned .legend-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin-top: auto;
          padding-top: 12px;
          padding-bottom: 4px;
          text-align: center;
          flex-shrink: 0;
        }

        .legend-tip {
          font-size: 7px;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.1;
        }

        .transfer-legend:hover .legend-tip,
        .transfer-legend.pinned .legend-tip {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.4;
        }

        /* Active Transfer Indicators */
        .downloading-active {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border: 1px solid rgba(37, 99, 235, 0.6);
          box-shadow: 0 0 8px rgba(37, 99, 235, 0.3);
        }

        .uploading-active {
          background: linear-gradient(135deg, #059669, #047857);
          border: 1px solid rgba(5, 150, 105, 0.6);
          box-shadow: 0 0 8px rgba(5, 150, 105, 0.3);
        }

        .seeding-active {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: 1px solid rgba(34, 197, 94, 0.6);
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.3);
        }

        /* Connection Status Indicators */
        .reconnecting {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border: 1px solid rgba(245, 158, 11, 0.6);
          animation: reconnecting-pulse 2s infinite;
        }

        .interrupted {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border: 1px solid rgba(239, 68, 68, 0.6);
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
        }

        .slow-transfer {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          border: 1px solid rgba(139, 92, 246, 0.6);
          opacity: 0.7;
        }

        /* File Health Indicators */
        .corrupted {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          border: 1px solid rgba(220, 38, 38, 0.6);
          box-shadow: 0 0 8px rgba(220, 38, 38, 0.5);
          animation: corrupted-flash 3s infinite;
        }

        .verified {
          background: linear-gradient(135deg, #16a34a, #15803d);
          border: 1px solid rgba(22, 163, 74, 0.6);
          box-shadow: 0 0 6px rgba(22, 163, 74, 0.4);
        }

        .pending {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          border: 1px solid rgba(107, 114, 128, 0.6);
          animation: pending-fade 2s infinite alternate;
        }

        /* Connection Line Indicators */
        .legend-line {
          width: 20px;
          height: 2px;
          border-radius: 1px;
          flex-shrink: 0;
        }

        .solid-line {
          background: linear-gradient(90deg, #10b981, #059669);
          box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
        }

        .dashed-line {
          background: linear-gradient(90deg, #f59e0b, #d97706);
          background-image: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.3) 2px,
            rgba(0, 0, 0, 0.3) 4px
          );
        }

        .dotted-line {
          background: linear-gradient(90deg, #ef4444, #dc2626);
          background-image: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 1px,
            rgba(0, 0, 0, 0.4) 1px,
            rgba(0, 0, 0, 0.4) 2px
          );
        }

        /* Animations */
        @keyframes reconnecting-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        @keyframes corrupted-flash {
          0%, 90% { opacity: 1; }
          95% { opacity: 0.3; }
          100% { opacity: 1; }
        }

        @keyframes pending-fade {
          0% { opacity: 0.4; }
          100% { opacity: 0.8; }
        }

        .download-ring::after {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2563eb;
          opacity: 0.4;
        }

        .upload-ring::after {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #059669;
          opacity: 0.4;
        }

        /* Dark theme adjustments for legend */
        .network-graph.dark .transfer-legend {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.25),
            0 1px 3px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        /* Mobile responsiveness for legend */
        @media (max-width: 768px) {
          .transfer-legend {
            bottom: 16px;
            right: 16px;
            width: 180px;
            padding: 10px;
          }

          .legend-title {
            font-size: 10px;
            margin-bottom: 6px;
          }

          .legend-sections {
            gap: 6px;
          }

          .legend-section {
            padding-bottom: 4px;
          }

          .legend-section-title {
            font-size: 8px;
            margin-bottom: 3px;
          }

          .legend-item {
            font-size: 8px;
            gap: 5px;
          }

          .legend-indicator {
            width: 8px;
            height: 8px;
            font-size: 6px;
          }

          .legend-footer {
            margin-top: 6px;
            padding-top: 4px;
          }

          .legend-tip {
            font-size: 7px;
          }
        }

        /* Expanded Node Overlay Styles */
        .expanded-node-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .expanded-node-overlay.expanded {
          opacity: 1;
          visibility: visible;
        }

        .expanded-node-content {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
          border-radius: 24px;
          max-width: 1200px;
          max-height: 85vh;
          width: 95vw;
          box-shadow:
            0 20px 40px rgba(0, 0, 0, 0.3),
            0 8px 16px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          overflow: hidden;
          transform: scale(0.8) translateY(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .expanded-node-overlay.expanded .expanded-node-content {
          transform: scale(1) translateY(0);
        }

        .expanded-node-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1));
        }

        .node-avatar {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .node-type-indicator {
          font-size: 28px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .node-type-indicator.self {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .node-type-indicator.peer {
          background: linear-gradient(135deg, #10b981, #047857);
        }

        .node-type-indicator.institution {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
        }

        .node-type-indicator.community {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .node-info {
          flex: 1;
        }

        .node-title {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin: 0;
          margin-bottom: 4px;
        }

        .node-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          margin-bottom: 12px;
        }

        .node-status-badges {
          display: flex;
          gap: 8px;
        }

        .status-badge, .network-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.connected {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-badge.connecting {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .status-badge.disconnected {
          background: rgba(107, 114, 128, 0.2);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.3);
        }

        .network-badge {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .close-button {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: scale(1.05);
        }

        .expanded-node-body {
          padding: 20px;
          overflow: hidden;
        }

        .content-columns {
          display: flex;
          gap: 24px;
          height: 100%;
        }

        .column-left, .column-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .network-graph .section {
          margin-bottom: 32px;
        }

        .network-graph .section.compact {
          margin-bottom: 0;
        }

        .network-graph .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #fbbf24;
          margin: 0;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .network-graph .section.compact .section-title {
          font-size: 16px;
          margin-bottom: 12px;
        }

        .network-graph .transfer-group {
          margin-bottom: 20px;
        }

        .network-graph .transfer-type {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          margin-bottom: 12px;
        }

        .network-graph .transfer-item {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }

        .network-graph .transfer-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .network-graph .transfer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .network-graph .file-name {
          font-size: 14px;
          font-weight: 600;
          color: white;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .network-graph .file-size {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          margin-left: 12px;
        }

        .network-graph .progress-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .network-graph .progress-bar {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .network-graph .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .network-graph .download-progress {
          background: linear-gradient(90deg, #06b6d4, #0891b2);
        }

        .network-graph .upload-progress {
          background: linear-gradient(90deg, #10b981, #059669);
        }

        .network-graph .progress-text {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          min-width: 40px;
        }

        .network-graph .transfer-details {
          display: flex;
          gap: 16px;
          align-items: center;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
        }

        .network-graph .sensitivity-badge {
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 600;
        }

        .network-graph .sensitivity-badge.restricted {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .network-graph .sensitivity-badge.sacred {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .network-graph .no-transfers {
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
          padding: 20px;
        }

        .network-graph .stats-grid, .network-graph .capabilities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
        }

        .network-graph .stat-item, .network-graph .capability-item {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }

        .network-graph .stat-label, .network-graph .capability-label {
          display: block;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .network-graph .stat-value, .network-graph .capability-value {
          font-size: 18px;
          font-weight: 700;
          color: white;
        }

        .network-graph .specializations {
          margin-top: 16px;
        }

        .network-graph .specializations-title {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          margin-bottom: 8px;
        }

        .network-graph .specialization-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .network-graph .specialization-tag {
          background: rgba(168, 85, 247, 0.2);
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.3);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .network-graph .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .network-graph .activity-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }

        .network-graph .activity-icon {
          font-size: 16px;
          min-width: 24px;
          text-align: center;
        }

        .network-graph .activity-content {
          flex: 1;
        }

        .network-graph .activity-file {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
        }

        .network-graph .activity-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
        }

        .network-graph .cultural-context {
          color: #f59e0b;
          font-weight: 500;
        }

        /* Network Stats Styles */
        .network-stats {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(30, 41, 59, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 140px;
          backdrop-filter: blur(12px);
          z-index: 10;
        }

        .network-stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
        }

        .network-stat-label {
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .network-stat-value {
          color: white;
          font-weight: 600;
        }

        .network-stat-value.health-good {
          color: #10b981;
        }

        .network-stat-value.health-fair {
          color: #f59e0b;
        }

        .network-stat-value.health-poor {
          color: #ef4444;
        }

        /* Node Details Styles */
        .node-details {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(30, 41, 59, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 16px;
          min-width: 200px;
          backdrop-filter: blur(12px);
          z-index: 10;
        }

        .node-details h4 {
          margin: 0 0 12px 0;
          color: white;
          font-size: 16px;
          font-weight: 600;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 8px 12px;
          font-size: 12px;
        }

        .detail-grid span:nth-child(odd) {
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .detail-grid span:nth-child(even) {
          color: white;
          font-weight: 600;
          text-align: right;
        }

        .node-details .cultural-context {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .node-details .cultural-context strong {
          display: block;
          color: #fbbf24;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .node-details .cultural-context p {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: 11px;
          line-height: 1.4;
        }

        /* Status classes */
        .status-connected {
          color: #10b981;
        }

        .status-connecting {
          color: #f59e0b;
        }

        .status-disconnected {
          color: #6b7280;
        }

        .status-error {
          color: #ef4444;
        }

        /* Compact Layout Styles */
        .transfers-horizontal {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .transfer-group-compact {
          margin-bottom: 12px;
        }

        .transfer-item-compact {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 10px;
          margin-bottom: 6px;
          transition: all 0.2s ease;
        }

        .transfer-item-compact:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .transfer-file-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .file-name-compact {
          font-size: 12px;
          font-weight: 600;
          color: white;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 8px;
        }

        .file-size-compact {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        .transfer-progress-compact {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .progress-bar-compact {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-text-compact {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          min-width: 30px;
          text-align: right;
        }

        .transfer-meta-compact {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .speed-compact {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
        }

        .sensitivity-badge-compact {
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .sensitivity-badge-compact.restricted {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .sensitivity-badge-compact.sacred {
          background: rgba(168, 85, 247, 0.2);
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.3);
        }

        .no-transfers-compact {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          font-style: italic;
          text-align: center;
          padding: 20px;
          margin: 0;
        }

        /* Stats Grid Compact */
        .stats-grid-compact {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .stat-item-compact {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label-compact {
          color: rgba(255, 255, 255, 0.6);
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value-compact {
          color: white;
          font-size: 12px;
          font-weight: 700;
        }

        /* Capabilities Grid Compact */
        .capabilities-grid-compact {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6px;
          margin-bottom: 12px;
        }

        .capability-item-compact {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .capability-label-compact {
          color: rgba(255, 255, 255, 0.6);
          font-size: 9px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .capability-value-compact {
          color: white;
          font-size: 11px;
          font-weight: 700;
        }

        .specializations-compact {
          margin-top: 8px;
        }

        .specializations-title-compact {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 6px 0;
        }

        .specialization-tags-compact {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .specialization-tag-compact {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 600;
          text-transform: capitalize;
        }

        /* Activity List Compact */
        .activity-list-compact {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .activity-item-compact {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .activity-item-compact:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .activity-icon-compact {
          font-size: 12px;
          min-width: 16px;
          text-align: center;
        }

        .activity-content-compact {
          flex: 1;
          min-width: 0;
        }

        .activity-file-compact {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: white;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-meta-compact {
          display: flex;
          gap: 8px;
          font-size: 9px;
          color: rgba(255, 255, 255, 0.6);
        }

        .activity-time-compact, .activity-size-compact {
          white-space: nowrap;
        }

        /* Mobile responsiveness for expanded node */
        @media (max-width: 768px) {
          .expanded-node-content {
            width: 95vw;
            max-height: 85vh;
            border-radius: 16px;
          }

          .expanded-node-header {
            padding: 20px;
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          .node-avatar {
            width: 56px;
            height: 56px;
          }

          .node-title {
            font-size: 20px;
          }

          .expanded-node-body {
            padding: 16px;
            overflow-y: auto;
            max-height: 60vh;
          }

          .content-columns {
            flex-direction: column;
            gap: 16px;
          }

          .stats-grid-compact {
            grid-template-columns: 1fr;
          }

          .capabilities-grid-compact {
            grid-template-columns: 1fr 1fr;
          }

          .stats-grid, .capabilities-grid {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
          }

          .transfer-details {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default NetworkGraph;
