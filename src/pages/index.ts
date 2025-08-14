/**
 * Pages Index
 *
 * Central export for all page components in the AlLibrary application.
 * Updated to include all enhanced implementations with cultural awareness.
 */

// Core Pages
export { default as HomePage } from './Home/Home';
export { default as AboutPage } from './About/About';
export { default as LoadingScreen } from './LoadingScreen/LoadingScreen';

// Document Management
export { default as DocumentManagementPage } from './DocumentManagement/DocumentManagement';
export { default as FavoritesPage } from './Favorites/Favorites';
export { default as RecentPage } from './Recent/Recent';
export { default as CollectionsPage } from './Collections/Collections';

// Enhanced Browse & Discovery
export { default as BrowsePage } from './Browse/BrowsePage';
export { default as SearchPage } from './Search/Search';
export { default as TrendingPage } from './Trending/Trending';

// Cultural Education & Context
export { default as CulturalContextsPage } from './CulturalContexts/CulturalContextsPage';
export { default as TraditionalKnowledgePage } from './TraditionalKnowledge/TraditionalKnowledge';
export { default as CommunityGuidelinesPage } from './CommunityGuidelines/CommunityGuidelines';
export { default as PreservationPage } from './Preservation/Preservation';

// Network & Peers
export { default as PeerNetworkPage } from './Peers/PeerNetworkPage';
export { NetworkHealth as NetworkHealthPage } from './NetworkHealth';
export { P2PSearch as P2PSearchPage } from './P2PSearch';
export { ConnectionManager as ConnectionManagerPage } from './ConnectionManager';
export { default as P2POverview } from './P2POverview';

// Export page route configurations for router
export const pageRoutes = [
  {
    path: '/p2p-overview',
    component: 'P2POverview',
    title: 'P2P Overview - AlLibrary',
    description: 'Understand how private networking over Tor works in AlLibrary',
  },
  {
    path: '/',
    component: 'HomePage',
    title: 'Home - AlLibrary',
    description: 'Decentralized digital library for cultural heritage and knowledge sharing',
  },
  {
    path: '/about',
    component: 'AboutPage',
    title: 'About - AlLibrary',
    description:
      'Learn about our mission for cultural heritage preservation and information freedom',
  },
  {
    path: '/browse',
    component: 'BrowsePage',
    title: 'Browse Categories - AlLibrary',
    description: 'Explore content organized by categories and traditional knowledge systems',
  },
  {
    path: '/search',
    component: 'SearchPage',
    title: 'Search - AlLibrary',
    description: 'Search the decentralized network for documents and cultural content',
  },
  {
    path: '/trending',
    component: 'TrendingPage',
    title: 'Trending Content - AlLibrary',
    description: 'Discover popular and trending content across the network',
  },
  {
    path: '/documents',
    component: 'DocumentManagementPage',
    title: 'My Documents - AlLibrary',
    description: 'Manage your personal document collection',
  },
  {
    path: '/favorites',
    component: 'FavoritesPage',
    title: 'Favorites - AlLibrary',
    description: 'Your saved favorite documents and collections',
  },
  {
    path: '/recent',
    component: 'RecentPage',
    title: 'Recent Activity - AlLibrary',
    description: 'Recently viewed and accessed content',
  },
  {
    path: '/collections',
    component: 'CollectionsPage',
    title: 'Collections - AlLibrary',
    description: 'Organize and manage your document collections',
  },
  {
    path: '/cultural-contexts',
    component: 'CulturalContextsPage',
    title: 'Cultural Contexts - AlLibrary',
    description: 'Explore cultural knowledge systems with respect and understanding',
  },
  {
    path: '/traditional-knowledge',
    component: 'TraditionalKnowledgePage',
    title: 'Traditional Knowledge - AlLibrary',
    description: 'Respectful sharing of indigenous and traditional wisdom',
  },
  {
    path: '/community-guidelines',
    component: 'CommunityGuidelinesPage',
    title: 'Community Guidelines - AlLibrary',
    description: 'Guidelines for respectful participation in the decentralized network',
  },
  {
    path: '/preservation',
    component: 'PreservationPage',
    title: 'Digital Preservation - AlLibrary',
    description: 'Digital heritage preservation methods and archival systems',
  },
  {
    path: '/peers',
    component: 'PeerNetworkPage',
    title: 'Peer Network - AlLibrary',
    description: 'Monitor decentralized network health and anti-censorship protocols',
  },
  {
    path: '/network-health',
    component: 'NetworkHealthPage',
    title: 'Network Health - AlLibrary',
    description: 'Comprehensive P2P network health monitoring and cultural community status',
  },
  {
    path: '/p2p-search',
    component: 'P2PSearchPage',
    title: 'P2P Search - AlLibrary',
    description: 'Distributed search across the P2P network with cultural awareness',
  },
  {
    path: '/connection-manager',
    component: 'ConnectionManagerPage',
    title: 'Connection Manager - AlLibrary',
    description: 'Manage P2P connections, TOR integration, and cultural network participation',
  },
] as const;
