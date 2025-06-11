import type { Node, Link } from '../types';
import { physicsConfig } from '../config/physicsConfig';

// Function to initialize orbital properties for nodes
const initializeOrbitalProperties = (node: Node, centerX = 400, centerY = 300): Node => {
  if (node.type === 'self') {
    // Center node doesn't orbit
    return {
      ...node,
      angle: 0,
      orbitRadius: 0,
      orbitSpeed: 0,
    };
  }

  // Calculate initial angle based on current position
  const dx = node.x - centerX;
  const dy = node.y - centerY;
  const initialAngle = Math.atan2(dy, dx);
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Set orbital properties based on connection status and type
  const baseSpeed = physicsConfig.baseOrbitSpeed; // Use centralized physics config
  const speedVariation = physicsConfig.speedVariation;

  // Add subtle random modifier: ±40% variation per node
  const subtleModifier = 1 + (Math.random() - 0.5) * 0.8; // ±40% range

  const orbitSpeed = baseSpeed * (1 + Math.random() * speedVariation) * subtleModifier;

  return {
    ...node,
    angle: initialAngle,
    orbitRadius: Math.max(120, distance), // Ensure minimum orbit distance
    orbitSpeed: orbitSpeed, // Will be adjusted by physics engine based on connection status
  };
};

// AlLibrary P2P Network - Based on Real Project Architecture and Cultural Preservation Use Cases
export const createMockNodes = (): Node[] => {
  const baseNodes: Node[] = [
    {
      id: 'self',
      label: 'You',
      type: 'self',
      status: 'connected',
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      connections: 8,
      bandwidth: 1024,
      latency: 0,
      reliability: 100,
      userId: 'user_self',
      username: '192.168.1.157',
      location: 'Local Machine',
      networkType: 'hybrid',
      activeTransfers: {
        downloading: [
          {
            fileName: 'Indigenous_Rights_Brazil_2024.pdf',
            fileSize: 12288,
            progress: 73,
            speed: 512,
            timeRemaining: 240,
            fileType: 'pdf',
            culturalSensitivity: 'restricted',
          },
        ],
        uploading: [
          {
            fileName: 'Open_Science_Methods.epub',
            fileSize: 4096,
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
        maxFileSize: 102400,
        culturalSpecializations: ['academic', 'open_access'],
        availableContent: 47,
        diskSpaceShared: 5120,
      },
      networkStats: {
        totalDataShared: 2048,
        totalDataReceived: 1536,
        peersServed: 12,
        uptime: 86400,
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
      connections: 23,
      bandwidth: 512,
      latency: 35,
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
            fileSize: 12288,
            progress: 42,
            speed: 128,
            timeRemaining: 320,
            fileType: 'pdf',
            culturalSensitivity: 'restricted',
          },
        ],
      },
      capabilities: {
        supportsSearch: true,
        supportsTor: false,
        maxFileSize: 102400,
        culturalSpecializations: ['indigenous_brazilian', 'traditional_medicine', 'tupi_language'],
        availableContent: 342,
        diskSpaceShared: 5120,
      },
      networkStats: {
        totalDataShared: 15360,
        totalDataReceived: 8192,
        peersServed: 156,
        uptime: 259200,
        lastSeen: new Date(),
      },
    },
    {
      id: 'peer-2',
      label: 'European Research Node',
      type: 'peer',
      status: 'connected',
      x: 400 + 160 * Math.cos(Math.PI / 3),
      y: 300 + 160 * Math.sin(Math.PI / 3),
      vx: 0,
      vy: 0,
      connections: 15,
      bandwidth: 1024,
      latency: 120,
      reliability: 88,
      culturalContext: 'European Academic Research',
      userId: 'eu_research_42',
      username: 'EuroAcademic',
      location: 'Berlin, Germany',
      networkType: 'internet',
      activeTransfers: {
        downloading: [
          {
            fileName: 'Digital_Humanities_Methods.pdf',
            fileSize: 8192,
            progress: 67,
            speed: 384,
            timeRemaining: 180,
            fileType: 'pdf',
            culturalSensitivity: 'public',
          },
        ],
        uploading: [],
      },
      capabilities: {
        supportsSearch: true,
        supportsTor: true,
        maxFileSize: 51200,
        culturalSpecializations: ['european_history', 'digital_humanities', 'open_science'],
        availableContent: 128,
        diskSpaceShared: 2560,
      },
      networkStats: {
        totalDataShared: 8192,
        totalDataReceived: 12288,
        peersServed: 89,
        uptime: 172800,
        lastSeen: new Date(),
      },
    },
    {
      id: 'peer-3',
      label: 'Community Archive',
      type: 'community',
      status: 'disconnected',
      x: 400 + 140 * Math.cos(Math.PI),
      y: 300 + 140 * Math.sin(Math.PI),
      vx: 0,
      vy: 0,
      connections: 8,
      bandwidth: 256,
      latency: 250,
      reliability: 60,
      culturalContext: 'Grassroots Community Knowledge',
      userId: 'community_archive_7',
      username: 'LocalHistory',
      location: 'Rural Argentina',
      networkType: 'hybrid',
      activeTransfers: {
        downloading: [],
        uploading: [],
      },
      capabilities: {
        supportsSearch: false,
        supportsTor: true,
        maxFileSize: 10240,
        culturalSpecializations: ['local_history', 'oral_traditions', 'community_knowledge'],
        availableContent: 45,
        diskSpaceShared: 512,
      },
      networkStats: {
        totalDataShared: 1024,
        totalDataReceived: 2048,
        peersServed: 23,
        uptime: 43200,
        lastSeen: new Date(Date.now() - 3600000),
      },
    },
    {
      id: 'peer-4',
      label: 'Privacy Advocate',
      type: 'peer',
      status: 'connecting',
      x: 400 + 200 * Math.cos(-Math.PI / 4),
      y: 300 + 200 * Math.sin(-Math.PI / 4),
      vx: 0,
      vy: 0,
      connections: 5,
      bandwidth: 768,
      latency: 80,
      reliability: 75,
      culturalContext: 'Digital Rights and Privacy',
      userId: 'privacy_guardian_11',
      username: 'SecureShare',
      location: 'Tor Network',
      networkType: 'tor',
      activeTransfers: {
        downloading: [],
        uploading: [],
      },
      capabilities: {
        supportsSearch: true,
        supportsTor: true,
        maxFileSize: 25600,
        culturalSpecializations: ['digital_rights', 'privacy_tools', 'security_research'],
        availableContent: 67,
        diskSpaceShared: 1024,
      },
      networkStats: {
        totalDataShared: 3072,
        totalDataReceived: 4096,
        peersServed: 34,
        uptime: 86400,
        lastSeen: new Date(),
      },
    },
  ];

  // Initialize orbital properties for all nodes
  return baseNodes.map(node => initializeOrbitalProperties(node));
};

// AlLibrary P2P Connection Network - Based on Real Network Topology
export const createMockLinks = (): Link[] => [
  {
    source: 'self',
    target: 'indigenous-br',
    strength: 0.8,
    bandwidth: 512,
    latency: 35,
    status: 'active',
  },
  {
    source: 'self',
    target: 'peer-2',
    strength: 0.9,
    bandwidth: 1024,
    latency: 120,
    status: 'active',
  },
  {
    source: 'self',
    target: 'peer-4',
    strength: 0.6,
    bandwidth: 256,
    latency: 80,
    status: 'idle',
  },
  {
    source: 'indigenous-br',
    target: 'peer-2',
    strength: 0.7,
    bandwidth: 384,
    latency: 150,
    status: 'active',
  },
];

export const mockNetworkData = {
  nodes: createMockNodes(),
  links: createMockLinks(),
};
