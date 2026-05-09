/**
 * Tor onion-share + tracker bridge (commands backed by vendored onion-poc Rust core).
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

/** Persisted tracker settings (camelCase from Tauri serde). */
export interface TrackerNetworkConfig {
  trackerUrl: string;
  nodeId: string;
  sharePublicly: boolean;
  /** If true, retry announce to http://127.0.0.1:8080 when Tor to .onion fails (same-PC Docker). */
  tryLocalTrackerFallback?: boolean;
}

export type TrackerSyncDiagnostics = {
  ok: boolean;
  atEpochMs?: number;
  urlUsed?: string;
  usedLocalhostFallback?: boolean;
  error?: string;
};

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

/** Payload emitted when background fetch completes. */
export interface OnionShareFetchDonePayload {
  ok: boolean;
  path?: string;
  error?: string;
  link: string;
}

/** Emitted during first-run Tor bundle download/extract (Windows) or quick detection. */
export interface TorSetupProgressPayload {
  progress: number;
  message: string;
}

/** Ensures Tor exists for onion share: detects PATH/bundle, downloads Expert Bundle on Windows, persists `AppConfig.tor_path`. */
export async function ensureTorForOnionShare(): Promise<string> {
  return invoke<string>('ensure_tor_for_onion_share');
}

export async function onionShareStart(): Promise<OnionShareStartResponse> {
  return invoke<OnionShareStartResponse>('onion_share_start');
}

/** Second startup stage after splash: Tor + onion share (same as Start button; emits init-progress). */
export async function bootstrapOnionOverlay(): Promise<OnionShareStartResponse> {
  return invoke<OnionShareStartResponse>('bootstrap_onion_overlay');
}

export async function onionShareStop(): Promise<void> {
  return invoke('onion_share_stop');
}

export async function onionShareAddFile(path: string): Promise<OnionShareAddFileResponse> {
  return invoke<OnionShareAddFileResponse>('onion_share_add_file', { path });
}

export async function onionShareRemoveFile(fileId: string): Promise<void> {
  return invoke('onion_share_remove_file', { fileId });
}

export async function onionShareListLocal(): Promise<LocalShareEntry[]> {
  return invoke<LocalShareEntry[]>('onion_share_list_local');
}

export async function onionShareStatus(): Promise<{
  running: boolean;
  onion: string | null;
  localPort: number | null;
}> {
  return invoke('onion_share_status');
}

/** Used by header/sidebar: true when Tor hidden service is up (onion share active with an address). */
export async function fetchNetworkPresence(): Promise<{
  online: boolean;
  onionActive: boolean;
}> {
  try {
    const s = await onionShareStatus();
    const onionActive = Boolean(s.running && s.onion && String(s.onion).trim().length > 0);
    return { online: onionActive, onionActive };
  } catch {
    return { online: false, onionActive: false };
  }
}

export async function trackerGetConfig(): Promise<TrackerNetworkConfig> {
  return invoke<TrackerNetworkConfig>('tracker_get_config');
}

export async function trackerSetConfig(config: TrackerNetworkConfig): Promise<void> {
  return invoke('tracker_set_config', { config });
}

export async function trackerGetLastSyncDiag(): Promise<TrackerSyncDiagnostics | null> {
  const v = await invoke<TrackerSyncDiagnostics | null>('tracker_get_last_sync_diag');
  if (v === null || typeof v !== 'object') return null;
  return v as TrackerSyncDiagnostics;
}

export async function trackerRefreshLobby(): Promise<NetworkLobby> {
  return invoke<NetworkLobby>('tracker_refresh_lobby');
}

export async function trackerGetCachedLobby(): Promise<NetworkLobby> {
  return invoke<NetworkLobby>('tracker_get_cached_lobby_cmd');
}

export async function trackerStartWsLoop(): Promise<void> {
  return invoke('tracker_start_ws_loop');
}

export async function trackerStopWsLoop(): Promise<void> {
  return invoke('tracker_stop_ws_loop');
}

/**
 * Starts a background download; resolves when `onion-share-fetch-done` matches `link`.
 */
export async function onionShareFetch(link: string, outDir: string): Promise<string> {
  const linkTrim = link.trim();
  return new Promise((resolve, reject) => {
    void (async () => {
      const unlisten = await listen<OnionShareFetchDonePayload>('onion-share-fetch-done', e => {
        const p = e.payload;
        if (p.link !== linkTrim) return;
        unlisten();
        if (p.ok && p.path) resolve(p.path);
        else reject(new Error(p.error ?? 'download failed'));
      });
      try {
        await invoke('onion_share_fetch', { link: linkTrim, outDir });
      } catch (err) {
        unlisten();
        reject(err);
      }
    })();
  });
}

export function listenOnionShareFetchDone(
  handler: (payload: OnionShareFetchDonePayload) => void
): Promise<() => void> {
  return listen<OnionShareFetchDonePayload>('onion-share-fetch-done', e => handler(e.payload));
}
