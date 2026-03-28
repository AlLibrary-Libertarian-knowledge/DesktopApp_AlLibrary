/**
 * M5: POC-style onion HTTP chunk sharing + tracker (Tauri commands).
 */
import { invoke } from '@tauri-apps/api/core';

/** Persisted tracker settings (camelCase from Tauri). */
export interface TrackerNetworkConfig {
  trackerUrl: string;
  nodeId: string;
  sharePublicly: boolean;
}

export interface OnionShareStartResponse {
  onion: string;
  localPort: number;
}

export interface OnionShareAddFileResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  contentHash: string;
  link: string;
}

export interface LocalShareEntry {
  fileId: string;
  name: string;
  size: number;
  contentHash: string;
  link: string;
}

/** Matches POC tracker / Rust `NetworkLobby` (snake_case JSON). */
export interface NetworkLobby {
  online_nodes: number;
  files: Array<{
    name: string;
    size: number;
    link: string;
    content_hash: string;
    peer_count: number;
    peers: Array<{
      node_id: string;
      onion: string;
      file_id: string;
      link: string;
    }>;
  }>;
}

export async function onionShareStart(): Promise<OnionShareStartResponse> {
  return invoke('onion_share_start');
}

export async function onionShareStop(): Promise<void> {
  return invoke('onion_share_stop');
}

export async function onionShareAddFile(path: string): Promise<OnionShareAddFileResponse> {
  return invoke('onion_share_add_file', { path });
}

export async function onionShareRemoveFile(fileId: string): Promise<void> {
  return invoke('onion_share_remove_file', { fileId });
}

export async function onionShareListLocal(): Promise<LocalShareEntry[]> {
  return invoke('onion_share_list_local');
}

export async function onionShareStatus(): Promise<{
  running: boolean;
  onion: string | null;
  localPort: number | null;
}> {
  return invoke('onion_share_status');
}

export async function trackerGetConfig(): Promise<TrackerNetworkConfig> {
  return invoke('tracker_get_config');
}

export async function trackerSetConfig(config: TrackerNetworkConfig): Promise<void> {
  return invoke('tracker_set_config', { config });
}

export async function trackerRefreshLobby(): Promise<NetworkLobby> {
  return invoke('tracker_refresh_lobby');
}

export async function trackerGetCachedLobby(): Promise<NetworkLobby> {
  return invoke('tracker_get_cached_lobby_cmd');
}

export async function trackerStartWsLoop(): Promise<void> {
  return invoke('tracker_start_ws_loop');
}

export async function trackerStopWsLoop(): Promise<void> {
  return invoke('tracker_stop_ws_loop');
}

export async function onionShareFetch(link: string, outDir: string): Promise<string> {
  return invoke('onion_share_fetch', { link, outDir });
}
