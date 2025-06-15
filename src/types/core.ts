/**
 * Core application types
 *
 * Central type definitions for the AlLibrary project including projects,
 * configurations, and system information.
 */

export interface Project {
  id: number;
  name: string;
  description?: string;
  path: string;
  created_at: string;
  updated_at: string;

  // Cultural and anti-censorship properties
  cultural_focus?: string;
  sensitive_content?: boolean;
  alternative_perspectives?: boolean;
  controversial_content?: boolean;

  // Decentralization features
  offline_mode?: boolean;
  tor_support?: boolean;
  p2p_enabled?: boolean;

  // Community control
  community_controlled?: boolean;
  decentralized_governance?: boolean;
  information_sovereignty?: boolean;
}

export interface ProjectConfig {
  auto_backup?: boolean;
  backup_interval?: number; // seconds
  max_file_size?: number; // bytes
  allowed_formats?: string[];

  cultural_settings?: {
    display_warnings: boolean;
    provide_context: boolean;
    restrict_access: boolean; // Should always be false for anti-censorship
  };

  p2p_settings?: {
    enabled?: boolean;
    tor_support?: boolean;
    peer_discovery?: boolean;
  };
}

export interface StorageInfo {
  total_size: number;
  used_size: number;
  available_size: number;
  file_count: number;
  directory_count: number;
}
