/**
 * API Services Index
 *
 * Unified export for all API services following SOLID principles.
 * Provides centralized access to backend operations with cultural awareness.
 */

// Core API client
export { apiClient } from './apiClient';
export type { ApiResponse, ApiRequestConfig, ApiCulturalContext } from './apiClient';

// Category management API
export { categoryApi } from './categoryApi';
export type {
  Category,
  CategoryNode,
  CategoryTree,
  CategoryFilters,
  CategorySearchResult,
} from './categoryApi';
export { CategoryType } from './categoryApi';

// Cultural context API
export { culturalApi } from './culturalApi';
export type {
  CulturalContext,
  TraditionalClassification,
  CulturalEducationContent,
} from './culturalApi';

// Peer network API
export { peerApi } from './peerApi';
export type { PeerInfo as PeerApiInfo, NetworkHealth, ContentExchange } from './peerApi';
export { PeerStatus, PeerCapability, ExchangeStatus } from './peerApi';

// Network operations API
export { networkApi } from './networkApi';
export type {
  PeerInfo as NetworkPeerInfo,
  NetworkSearchParams,
  NetworkSearchResult,
  NetworkStatus,
  ContentSharingConfig,
} from './networkApi';
