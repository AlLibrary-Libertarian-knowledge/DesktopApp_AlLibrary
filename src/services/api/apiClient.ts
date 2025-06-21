/**
 * Unified API Client for AlLibrary
 *
 * Provides consistent interface for all backend operations following SOLID principles.
 * Enforces anti-censorship standards and cultural information-only validation.
 */

import { invoke } from '@tauri-apps/api/core';
import type { CulturalAnalysis, CulturalInformation } from '../../types/Cultural';
import type { ValidationResult } from '../../types/Security';

/**
 * Base API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  culturalContext?: CulturalInformation;
  timestamp: string;
}

/**
 * API request configuration
 */
export interface ApiRequestConfig {
  timeout?: number;
  retries?: number;
  culturalValidation?: boolean;
  includeContext?: boolean;
}

/**
 * Cultural context for API requests
 */
export interface ApiCulturalContext {
  userCulturalBackground?: string[];
  requestedCulturalContext?: string[];
  educationalPurpose: boolean;
  respectProtocols: boolean;
}

/**
 * Unified API Client Class
 * Implements Single Responsibility Principle - handles all API communication
 */
class ApiClient {
  private readonly defaultTimeout = 10000;
  private readonly defaultRetries = 3;

  /**
   * Generic API call method with cultural context support
   */
  async call<T>(
    command: string,
    params: Record<string, any> = {},
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();

    try {
      // Add cultural context if validation requested
      if (config.culturalValidation) {
        params.culturalContext = this.buildCulturalContext();
      }

      // Invoke Tauri command
      const result = await invoke<T>(command, params);

      // Build successful response
      const response: ApiResponse<T> = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };

      // Add cultural context if requested
      if (config.includeContext) {
        response.culturalContext = await this.getCulturalInformation(command, params);
      }

      return response;
    } catch (error) {
      console.error(`API call failed: ${command}`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown API error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get operation with cultural awareness
   */
  async get<T>(
    endpoint: string,
    params: Record<string, any> = {},
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.call<T>(`get_${endpoint}`, params, {
      ...config,
      includeContext: true,
    });
  }

  /**
   * Create operation with cultural validation
   */
  async create<T>(
    endpoint: string,
    data: Record<string, any>,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.call<T>(`create_${endpoint}`, data, {
      ...config,
      culturalValidation: true,
    });
  }

  /**
   * Update operation with cultural validation
   */
  async update<T>(
    endpoint: string,
    id: string,
    data: Record<string, any>,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.call<T>(
      `update_${endpoint}`,
      { id, ...data },
      {
        ...config,
        culturalValidation: true,
      }
    );
  }

  /**
   * Delete operation with cultural validation
   */
  async delete<T>(
    endpoint: string,
    id: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.call<T>(
      `delete_${endpoint}`,
      { id },
      {
        ...config,
        culturalValidation: true,
      }
    );
  }

  /**
   * Search operation with cultural context
   */
  async search<T>(
    endpoint: string,
    query: string,
    filters: Record<string, any> = {},
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.call<T>(
      `search_${endpoint}`,
      { query, filters },
      {
        ...config,
        includeContext: true,
        culturalValidation: true,
      }
    );
  }

  /**
   * Batch operation with cultural validation
   */
  async batch<T>(
    operations: Array<{
      command: string;
      params: Record<string, any>;
    }>,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T[]>> {
    try {
      const results = await Promise.all(
        operations.map(op => this.call<T>(op.command, op.params, config))
      );

      return {
        success: results.every(r => r.success),
        data: results.map(r => r.data).filter(Boolean) as T[],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch operation failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Build cultural context for requests
   * ANTI-CENSORSHIP: Information only, never restricts access
   */
  private buildCulturalContext(): ApiCulturalContext {
    return {
      userCulturalBackground: [], // Could be populated from user preferences
      requestedCulturalContext: [],
      educationalPurpose: true, // Always educational in AlLibrary
      respectProtocols: true, // Always respect cultural protocols
    };
  }

  /**
   * Get cultural information for educational purposes
   * ANTI-CENSORSHIP: Educational context only, never blocks access
   */
  private async getCulturalInformation(
    command: string,
    params: Record<string, any>
  ): Promise<CulturalInformation | undefined> {
    try {
      // Only provide cultural context for educational enhancement
      // Never use for access control or restriction
      const culturalInfo = await invoke<CulturalInformation>('get_cultural_context', {
        command,
        params,
        purpose: 'educational',
      });

      return culturalInfo;
    } catch (error) {
      // Cultural context is optional - operation continues without it
      console.debug('Cultural context not available:', error);
      return undefined;
    }
  }

  /**
   * Validate cultural protocols for informational purposes only
   * ANTI-CENSORSHIP: Information only, never restricts functionality
   */
  async validateCulturalProtocols(data: Record<string, any>): Promise<ValidationResult> {
    try {
      const validation = await invoke<ValidationResult>('validate_cultural_protocols', {
        data,
        purpose: 'educational_information',
      });

      // Always return success - validation is informational only
      return {
        ...validation,
        valid: true, // Never block operations based on cultural validation
        informational: true,
      };
    } catch (error) {
      // Cultural validation failure doesn't block operations
      return {
        valid: true,
        informational: true,
        culturalNotes: 'Cultural context analysis not available',
      };
    }
  }

  /**
   * Health check for API connectivity
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.call('health_check', {}, { timeout: 5000 });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for use in other services
export type { ApiResponse, ApiRequestConfig, ApiCulturalContext };
