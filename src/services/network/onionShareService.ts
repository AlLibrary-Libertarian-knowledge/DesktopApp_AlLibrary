/**
 * Network shell mode: onion share commands disabled.
 */

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
  return Promise.reject(new Error('coming_soon'));
}

export async function onionShareStop(): Promise<void> {
  return;
}

export async function onionShareAddFile(path: string): Promise<OnionShareAddFileResponse> {
  void path;
  return Promise.reject(new Error('coming_soon'));
}

export async function onionShareRemoveFile(fileId: string): Promise<void> {
  void fileId;
  return;
}

export async function onionShareListLocal(): Promise<LocalShareEntry[]> {
  return [];
}

export async function onionShareStatus(): Promise<{
  running: boolean;
  onion: string | null;
  localPort: number | null;
}> {
  return { running: false, onion: null, localPort: null };
}

export async function trackerGetConfig(): Promise<TrackerNetworkConfig> {
  return { trackerUrl: '', nodeId: 'network-disabled', sharePublicly: false };
}

export async function trackerSetConfig(config: TrackerNetworkConfig): Promise<void> {
  void config;
  return;
}

export async function trackerRefreshLobby(): Promise<NetworkLobby> {
  return { online_nodes: 0, files: [] };
}

export async function trackerGetCachedLobby(): Promise<NetworkLobby> {
  return { online_nodes: 0, files: [] };
}

export async function trackerStartWsLoop(): Promise<void> {
  return;
}

export async function trackerStopWsLoop(): Promise<void> {
  return;
}

export async function onionShareFetch(link: string, outDir: string): Promise<string> {
  void link;
  void outDir;
  return Promise.reject(new Error('coming_soon'));
}
