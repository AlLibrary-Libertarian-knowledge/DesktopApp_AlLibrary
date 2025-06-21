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
export type { PeerInfo, NetworkHealth, ContentExchange } from './peerApi';
export { PeerStatus, PeerCapability, ExchangeStatus } from './peerApi';

/**
 * Unified API facade for common operations
 * Implements Facade pattern for simplified access
 */
export class AlLibraryAPI {
  /**
   * Initialize all API services
   */
  static async initialize(): Promise<{
    apiHealthy: boolean;
    networkConnected: boolean;
    culturalServicesReady: boolean;
    errors: string[];
  }> {
    const results = {
      apiHealthy: false,
      networkConnected: false,
      culturalServicesReady: false,
      errors: [] as string[],
    };

    try {
      // Test API health
      const healthCheck = await apiClient.healthCheck();
      results.apiHealthy = healthCheck.success;

      if (!healthCheck.success) {
        results.errors.push(`API health check failed: ${healthCheck.error}`);
      }
    } catch (error) {
      results.errors.push(`API initialization failed: ${error}`);
    }

    try {
      // Test network connectivity
      const networkHealth = await peerApi.getNetworkHealth();
      results.networkConnected =
        networkHealth.success && (networkHealth.data?.connectedPeers ?? 0) > 0;

      if (!results.networkConnected) {
        results.errors.push('No peer network connections available');
      }
    } catch (error) {
      results.errors.push(`Network initialization failed: ${error}`);
    }

    try {
      // Test cultural services
      const culturalContexts = await culturalApi.searchCulturalContexts('', {});
      results.culturalServicesReady = culturalContexts.success;

      if (!culturalContexts.success) {
        results.errors.push('Cultural services not available');
      }
    } catch (error) {
      results.errors.push(`Cultural services initialization failed: ${error}`);
    }

    return results;
  }

  /**
   * Get system status for monitoring
   */
  static async getSystemStatus(): Promise<{
    api: boolean;
    network: boolean;
    cultural: boolean;
    categories: boolean;
    overall: 'healthy' | 'degraded' | 'offline';
  }> {
    const status = {
      api: false,
      network: false,
      cultural: false,
      categories: false,
      overall: 'offline' as const,
    };

    // Parallel health checks for efficiency
    const [apiHealth, networkHealth, culturalTest, categoryTest] = await Promise.allSettled([
      apiClient.healthCheck(),
      peerApi.getNetworkHealth(),
      culturalApi.searchCulturalContexts('', {}),
      categoryApi.getFeaturedCategories(1),
    ]);

    status.api = apiHealth.status === 'fulfilled' && apiHealth.value.success;
    status.network = networkHealth.status === 'fulfilled' && networkHealth.value.success;
    status.cultural = culturalTest.status === 'fulfilled' && culturalTest.value.success;
    status.categories = categoryTest.status === 'fulfilled' && categoryTest.value.success;

    // Determine overall status
    const healthyServices = [status.api, status.network, status.cultural, status.categories].filter(
      Boolean
    ).length;

    if (healthyServices === 4) {
      status.overall = 'healthy';
    } else if (healthyServices >= 2) {
      status.overall = 'degraded';
    } else {
      status.overall = 'offline';
    }

    return status;
  }

  /**
   * Emergency protocols for censorship events
   */
  static async activateEmergencyProtocols(): Promise<{
    activated: boolean;
    protocolsEnabled: string[];
    alternativeAccess: string[];
    networkBypass: boolean;
    culturalProtection: boolean;
  }> {
    try {
      const emergencyResponse = await peerApi.enableEmergencyProtocols();

      return {
        activated: emergencyResponse.success,
        protocolsEnabled: emergencyResponse.data?.protocolsActivated ?? [],
        alternativeAccess: emergencyResponse.data?.alternativeRoutes ?? [],
        networkBypass: (emergencyResponse.data?.torCircuits ?? 0) > 0,
        culturalProtection: true, // Cultural information always protected
      };
    } catch (error) {
      console.error('Emergency protocols activation failed:', error);

      return {
        activated: false,
        protocolsEnabled: [],
        alternativeAccess: [],
        networkBypass: false,
        culturalProtection: true, // Always protect cultural information
      };
    }
  }

  /**
   * Validate cultural content for educational purposes
   * ANTI-CENSORSHIP: Information only, never blocks access
   */
  static async validateContent(content: any): Promise<{
    culturallyInformed: boolean;
    educationalValue: number;
    respectfulPresentation: boolean;
    recommendations: string[];
    culturalContext: string[];
  }> {
    try {
      const validation = await culturalApi.validateCulturalContent(content);

      return {
        culturallyInformed: validation.success,
        educationalValue: validation.data?.educationalValue ?? 0,
        respectfulPresentation: (validation.data?.respectfulPresentation ?? 0) > 0.7,
        recommendations: validation.data?.recommendations ?? [],
        culturalContext: validation.data?.culturalContext ?? [],
      };
    } catch (error) {
      // Validation failure doesn't block content - information only
      return {
        culturallyInformed: false,
        educationalValue: 0,
        respectfulPresentation: true, // Default to allowing access
        recommendations: ['Cultural context analysis not available'],
        culturalContext: [],
      };
    }
  }
}

// Export the unified API class
export { AlLibraryAPI };
