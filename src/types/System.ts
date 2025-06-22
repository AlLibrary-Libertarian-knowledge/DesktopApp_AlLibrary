/**
 * System Types - TypeScript interfaces for system-related Tauri commands
 *
 * This file contains type definitions for system information and disk space
 * operations that interface with the Tauri backend.
 *
 * @fileoverview System types for AlLibrary application
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Disk space information for the project directory and containing disk
 */
export interface DiskSpaceInfo {
  /** Size of the project directory in bytes */
  project_size_bytes: number;
  /** Total disk space in bytes */
  total_disk_space_bytes: number;
  /** Available disk space in bytes */
  available_disk_space_bytes: number;
  /** Used disk space in bytes */
  used_disk_space_bytes: number;
  /** Project size as percentage of total disk space */
  project_percentage: number;
  /** Overall disk usage percentage */
  disk_usage_percentage: number;
  /** Path to the project directory */
  project_path: string;
  /** Name of the disk/drive */
  disk_name: string;
}

/**
 * System status information
 */
export interface SystemStatus {
  /** Whether database connection is active */
  database_connected: boolean;
  /** Whether file cache is initialized */
  file_cache_initialized: boolean;
  /** Application version */
  app_version: string;
  /** Total number of documents */
  total_documents: number;
  /** Cache statistics if available */
  cache_stats?: CacheStats;
}

/**
 * File cache statistics
 */
export interface CacheStats {
  /** Number of content entries in cache */
  content_entries: number;
  /** Number of metadata entries in cache */
  metadata_entries: number;
  /** Total size of cached content in bytes */
  total_content_size: number;
  /** Maximum number of cache entries allowed */
  max_entries: number;
}

/**
 * System API - Functions for interacting with system information
 */
export class SystemAPI {
  /**
   * Get disk space information for a specific project path
   * @param projectPath - Path to the project directory
   * @returns Promise resolving to disk space information
   */
  static async getDiskSpaceInfo(projectPath: string): Promise<DiskSpaceInfo> {
    return invoke<DiskSpaceInfo>('get_disk_space_info', { projectPath });
  }

  /**
   * Get overall system status
   * @returns Promise resolving to system status information
   */
  static async getSystemStatus(): Promise<SystemStatus> {
    return invoke<SystemStatus>('get_system_status');
  }

  /**
   * Check database health
   * @returns Promise resolving to boolean indicating database health
   */
  static async checkDatabaseHealth(): Promise<boolean> {
    return invoke<boolean>('check_database_health');
  }

  /**
   * Clear the file cache
   * @returns Promise resolving to boolean indicating success
   */
  static async clearCache(): Promise<boolean> {
    return invoke<boolean>('clear_cache');
  }
}

/**
 * Utility functions for formatting system information
 */
export class SystemUtils {
  /**
   * Format bytes to human-readable string
   * @param bytes - Number of bytes
   * @param decimals - Number of decimal places (default: 2)
   * @returns Formatted string (e.g., "1.23 GB")
   */
  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Format percentage to string with specified decimal places
   * @param percentage - Percentage value
   * @param decimals - Number of decimal places (default: 1)
   * @returns Formatted percentage string
   */
  static formatPercentage(percentage: number, decimals: number = 1): string {
    return `${percentage.toFixed(decimals)}%`;
  }

  /**
   * Get disk usage status based on percentage
   * @param percentage - Disk usage percentage
   * @returns Status string ('low', 'medium', 'high', 'critical')
   */
  static getDiskUsageStatus(percentage: number): 'low' | 'medium' | 'high' | 'critical' {
    if (percentage < 50) return 'low';
    if (percentage < 75) return 'medium';
    if (percentage < 90) return 'high';
    return 'critical';
  }

  /**
   * Get color for disk usage based on percentage
   * @param percentage - Disk usage percentage
   * @returns CSS color string
   */
  static getDiskUsageColor(percentage: number): string {
    if (percentage < 50) return '#10b981'; // green
    if (percentage < 75) return '#f59e0b'; // yellow
    if (percentage < 90) return '#f97316'; // orange
    return '#ef4444'; // red
  }
}

export default SystemAPI;
