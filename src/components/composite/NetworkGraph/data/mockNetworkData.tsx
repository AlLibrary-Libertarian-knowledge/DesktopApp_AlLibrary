import type { Node, Link } from '../types';
import { physicsConfig } from '../config/physicsConfig';

/** Live tracker lobby by default; pass `useMockData={true}` for demos/tests. */
export const USE_MOCK_NETWORK_GRAPH = false;

const initializeOrbitalProperties = (node: Node, centerX = 400, centerY = 300): Node => {
  if (node.type === 'self') {
    return { ...node, angle: 0, orbitRadius: 0, orbitSpeed: 0 };
  }

  const dx = node.x - centerX;
  const dy = node.y - centerY;
  const initialAngle = Math.atan2(dy, dx);
  const distance = Math.sqrt(dx * dx + dy * dy);
  const subtleModifier = 1 + (Math.random() - 0.5) * 0.8;
  const orbitSpeed =
    physicsConfig.baseOrbitSpeed *
    (1 + Math.random() * physicsConfig.speedVariation) *
    subtleModifier;

  return {
    ...node,
    angle: initialAngle,
    orbitRadius: Math.max(physicsConfig.minOrbitRadius, distance),
    orbitSpeed,
  };
};

/** Demo topology for the planetary graph (modal + rings + stats). */
export const createMockNodes = (centerX = 400, centerY = 300): Node[] => {
  const baseNodes: Node[] = [
    {
      id: 'self',
      label: 'Você',
      type: 'self',
      status: 'connected',
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      connections: 4,
      bandwidth: 1024,
      latency: 0,
      reliability: 100,
      userId: 'local-demo-node',
      username: 'Você',
      location: 'Nó local',
      networkType: 'hybrid',
      onionAddress: 'http://7xdemoYouLocalNodeAlLibraryLab.onion',
      onionShort: '7xdemo…ryLab.onion',
      sharedFileCount: 3,
      sharedBytes: 18_874_368,
      sharedFiles: [
        {
          name: 'Direitos_Indigenas_Brasil_2024.pdf',
          size: 12_582_912,
          contentHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f901234abcd',
          link: 'http://7xdemoYouLocalNodeAlLibraryLab.onion/f/doc1',
        },
        {
          name: 'Metodos_Ciencia_Aberta.epub',
          size: 4_194_304,
          contentHash: 'f0e1d2c3b4a5968778695a4b3c2d1e0f99887766',
          link: 'http://7xdemoYouLocalNodeAlLibraryLab.onion/f/doc2',
        },
        {
          name: 'Catalogo_Patrimonio_Digital.pdf',
          size: 2_097_152,
          contentHash: '11223344556677889900aabbccddeeff00112233',
          link: 'http://7xdemoYouLocalNodeAlLibraryLab.onion/f/doc3',
        },
      ],
      lastSeenLabel: 'agora',
      isLocalSelf: true,
      activeTransfers: {
        downloading: [
          {
            fileName: 'Direitos_Indigenas_Brasil_2024.pdf',
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
            fileName: 'Metodos_Ciencia_Aberta.epub',
            fileSize: 4096,
            progress: 91,
            speed: 256,
            timeRemaining: 45,
            fileType: 'epub',
            culturalSensitivity: 'public',
          },
        ],
      },
    },
    {
      id: 'peer-funai',
      label: 'FUNAI Archive',
      type: 'institution',
      status: 'connected',
      x: centerX + 180 * Math.cos(0),
      y: centerY + 180 * Math.sin(0),
      vx: 0,
      vy: 0,
      connections: 5,
      bandwidth: 512,
      latency: 35,
      reliability: 95,
      userId: 'funai-br-001',
      username: 'FUNAI Archive',
      location: 'Brasília',
      networkType: 'internet',
      onionAddress: 'http://funaiDemoArchiveNodeLabAlLibrary99.onion',
      onionShort: 'funaiD…ry99.onion',
      sharedFileCount: 5,
      sharedBytes: 42_000_000,
      sharedFiles: [
        {
          name: 'Dicionario_Tupi.pdf',
          size: 12_582_912,
          contentHash: 'aa11bb22cc33dd44ee55ff6677889900aabbccdd',
          link: 'http://funaiDemoArchiveNodeLabAlLibrary99.onion/f/tupi',
        },
        {
          name: 'Mapas_Terras_Indigenas.pdf',
          size: 18_874_368,
          contentHash: 'bb22cc33dd44ee55ff6677889900aabbccddee11',
          link: 'http://funaiDemoArchiveNodeLabAlLibrary99.onion/f/mapas',
        },
        {
          name: 'Relatorio_Patrimonio_2023.pdf',
          size: 5_242_880,
          contentHash: 'cc33dd44ee55ff6677889900aabbccddeeff2211',
        },
        {
          name: 'Oralidades_Amazonia.epub',
          size: 3_145_728,
          contentHash: 'dd44ee55ff6677889900aabbccddeeff11223344',
        },
        {
          name: 'Guia_Preservacao_Digital.pdf',
          size: 2_154_112,
          contentHash: 'ee55ff6677889900aabbccddeeff112233445566',
        },
      ],
      lastSeenLabel: 'agora',
      isLocalSelf: false,
      activeTransfers: {
        downloading: [],
        uploading: [
          {
            fileName: 'Dicionario_Tupi.pdf',
            fileSize: 12288,
            progress: 42,
            speed: 128,
            timeRemaining: 320,
            fileType: 'pdf',
            culturalSensitivity: 'restricted',
          },
        ],
      },
    },
    {
      id: 'peer-euro',
      label: 'EuroAcademic',
      type: 'peer',
      status: 'connected',
      x: centerX + 160 * Math.cos(Math.PI / 3),
      y: centerY + 160 * Math.sin(Math.PI / 3),
      vx: 0,
      vy: 0,
      connections: 3,
      bandwidth: 1024,
      latency: 120,
      reliability: 88,
      userId: 'eu-research-42',
      username: 'EuroAcademic',
      location: 'Berlin',
      networkType: 'internet',
      onionAddress: 'http://euroAcademicDemoPeerBerlinAlLib.onion',
      onionShort: 'euroAc…AlLib.onion',
      sharedFileCount: 3,
      sharedBytes: 22_000_000,
      sharedFiles: [
        {
          name: 'Digital_Humanities_Methods.pdf',
          size: 8_388_608,
          contentHash: '1122aabbccddeeff99887766554433221100ffee',
          link: 'http://euroAcademicDemoPeerBerlinAlLib.onion/f/dh',
        },
        {
          name: 'Open_Science_Handbook.pdf',
          size: 6_291_456,
          contentHash: '2233bbccddeeffaa00998877665544332211ffdd',
        },
        {
          name: 'European_Archives_Index.epub',
          size: 4_194_304,
          contentHash: '3344ccddeeffaabb11009988776655443322ffcc',
        },
      ],
      lastSeenLabel: 'há 2 min',
      isLocalSelf: false,
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
    },
    {
      id: 'peer-community',
      label: 'LocalHistory',
      type: 'community',
      status: 'disconnected',
      x: centerX + 140 * Math.cos(Math.PI),
      y: centerY + 140 * Math.sin(Math.PI),
      vx: 0,
      vy: 0,
      connections: 1,
      bandwidth: 256,
      latency: 250,
      reliability: 60,
      userId: 'community-archive-7',
      username: 'LocalHistory',
      location: 'Argentina',
      networkType: 'hybrid',
      onionAddress: 'http://localHistoryCommunityArchiveAR.onion',
      onionShort: 'localH…veAR.onion',
      sharedFileCount: 1,
      sharedBytes: 1_048_576,
      sharedFiles: [
        {
          name: 'Historias_Orais_Pampa.pdf',
          size: 1_048_576,
          contentHash: '5566ddeeffaabbcc22110099887766554433ffbb',
        },
      ],
      lastSeenLabel: 'há 1 h',
      isLocalSelf: false,
      activeTransfers: { downloading: [], uploading: [] },
    },
    {
      id: 'peer-tor',
      label: 'SecureShare',
      type: 'peer',
      status: 'connecting',
      x: centerX + 200 * Math.cos(-Math.PI / 4),
      y: centerY + 200 * Math.sin(-Math.PI / 4),
      vx: 0,
      vy: 0,
      connections: 2,
      bandwidth: 768,
      latency: 80,
      reliability: 75,
      userId: 'privacy-guardian-11',
      username: 'SecureShare',
      location: 'Tor',
      networkType: 'tor',
      onionAddress: 'http://secureSharePrivacyTorDemoNode99.onion',
      onionShort: 'secure…de99.onion',
      sharedFileCount: 2,
      sharedBytes: 7_340_032,
      sharedFiles: [
        {
          name: 'Privacy_Toolkit_Guide.pdf',
          size: 3_145_728,
          contentHash: '6677eeffaabbccdd33221100998877665544ffaa',
          link: 'http://secureSharePrivacyTorDemoNode99.onion/f/privacy',
        },
        {
          name: 'Tor_Hidden_Services_Notes.pdf',
          size: 4_194_304,
          contentHash: '7788ffaabbccddee44332211009988776655ff99',
        },
      ],
      lastSeenLabel: 'agora',
      isLocalSelf: false,
      activeTransfers: { downloading: [], uploading: [] },
    },
  ];

  return baseNodes.map(node => initializeOrbitalProperties(node, centerX, centerY));
};

export const createMockLinks = (): Link[] => [
  {
    source: 'self',
    target: 'peer-funai',
    strength: 0.8,
    bandwidth: 512,
    latency: 35,
    status: 'active',
  },
  {
    source: 'self',
    target: 'peer-euro',
    strength: 0.9,
    bandwidth: 1024,
    latency: 120,
    status: 'active',
  },
  {
    source: 'self',
    target: 'peer-tor',
    strength: 0.6,
    bandwidth: 256,
    latency: 80,
    status: 'idle',
  },
  {
    source: 'peer-funai',
    target: 'peer-euro',
    strength: 0.7,
    bandwidth: 384,
    latency: 150,
    status: 'active',
  },
];

export function buildMockGraph(centerX = 400, centerY = 300): { nodes: Node[]; links: Link[] } {
  return {
    nodes: createMockNodes(centerX, centerY),
    links: createMockLinks(),
  };
}

export const mockNetworkData = {
  nodes: createMockNodes(),
  links: createMockLinks(),
};
