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

// Network & Peers
export { default as PeerNetworkPage } from './Peers/PeerNetworkPage';
export { NetworkHealth as NetworkHealthPage } from './NetworkHealth';
export { ConnectionManager as ConnectionManagerPage } from './ConnectionManager';
export { PeerTransfers as PeerTransfersPage } from './PeerTransfers';

// Export page route configurations for router
export const pageRoutes = [
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
    path: '/connection-manager',
    component: 'ConnectionManagerPage',
    title: 'Configurations - AlLibrary',
    description:
      'Mock runtime limits, bandwidth caps, resource budgets, and peer tuning until networking is restored',
  },
  {
    path: '/transfers',
    component: 'PeerTransfersPage',
    title: 'Sharing & downloads - AlLibrary',
    description: 'Unified outbound sharing and inbound download activity',
  },
] as const;
