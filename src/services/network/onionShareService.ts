/**
 * Tor onion-share + tracker bridge (commands backed by vendored onion-poc Rust core).
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Custom wrapper to prevent test environments (like Vitest in Node) from failing on Tauri commands
async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
    if (cmd === 'tracker_get_config') {
      return {
        trackerUrl: 'http://127.0.0.1:8080',
        nodeId: 'network-disabled',
        sharePublicly: false,
      } as unknown as T;
    }
    if (cmd === 'onion_share_status') {
      return {
        running: false,
        onion: null,
        localPort: null,
        mode: 'idle',
        bootstrapPercent: 0,
        localOnly: false,
      } as unknown as T;
    }
    if (cmd === 'tracker_refresh_lobby' || cmd === 'tracker_get_cached_lobby_cmd') {
      return {
        online_nodes: 0,
        files: [],
      } as unknown as T;
    }
    if (cmd === 'search_network_cached') {
      return [] as unknown as T;
    }
    if (cmd === 'list_network_peers') {
      return [] as unknown as T;
    }
    if (cmd === 'onion_share_list_local') {
      return [] as unknown as T;
    }
    return Promise.resolve() as unknown as T;
  }
  return invoke<T>(cmd, args);
}

/** Persisted tracker settings (camelCase from Tauri serde). */
export interface TrackerNetworkConfig {
  trackerUrl: string;
  nodeId: string;
  sharePublicly: boolean;
  /** If true, retry announce to http://127.0.0.1:8080 when Tor to .onion fails (same-PC Docker). */
  tryLocalTrackerFallback?: boolean;
  /** Tor bridge lines (one per entry). */
  torBridges?: string[];
}

export type OnionShareMode = 'idle' | 'bootstrapping' | 'ready' | 'degraded' | 'failed';

export interface OnionShareStatus {
  running: boolean;
  onion: string | null;
  localPort: number | null;
  mode?: OnionShareMode;
  bootstrapPercent?: number;
  lastError?: string | null;
  localOnly?: boolean;
  retryCount?: number;
}

export interface TorBootstrapProgressPayload {
  mode: string;
  bootstrapPercent: number;
  message: string;
  lastError?: string | null;
  localOnly?: boolean;
  retryCount?: number;
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
  diskPath?: string;
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
  transferId?: string;
}

/** Emitted per chunk during onion share fetch. */
export interface TransferProgressPayload {
  id: string;
  link: string;
  progress: number;
  bytesMoved?: number;
}

/** Emitted during first-run Tor bundle download/extract (Windows) or quick detection. */
export interface TorSetupProgressPayload {
  progress: number;
  message: string;
}

/** Ensures Tor exists for onion share: detects PATH/bundle, downloads Expert Bundle on Windows, persists `AppConfig.tor_path`. */
export async function ensureTorForOnionShare(): Promise<string> {
  return safeInvoke<string>('ensure_tor_for_onion_share');
}

export async function onionShareStart(): Promise<OnionShareStartResponse> {
  return safeInvoke<OnionShareStartResponse>('onion_share_start');
}

/** Second startup stage after splash: Tor + onion share (blocking; emits init-progress). */
export async function bootstrapOnionOverlay(): Promise<OnionShareStartResponse> {
  return safeInvoke<OnionShareStartResponse>('bootstrap_onion_overlay');
}

/** Non-blocking bootstrap: app opens immediately; Tor connects in background. */
export async function bootstrapOnionOverlayBackground(): Promise<{
  started?: boolean;
  background?: boolean;
  alreadyRunning?: boolean;
  bootstrapping?: boolean;
  onion?: string;
  localPort?: number;
}> {
  return safeInvoke('bootstrap_onion_overlay_background');
}

export async function onionShareStop(): Promise<void> {
  return safeInvoke('onion_share_stop');
}

export async function onionShareAddFile(path: string): Promise<OnionShareAddFileResponse> {
  return safeInvoke<OnionShareAddFileResponse>('onion_share_add_file', { path });
}

export async function onionShareRemoveFile(fileId: string): Promise<void> {
  return safeInvoke('onion_share_remove_file', { fileId });
}

export async function onionShareListLocal(): Promise<LocalShareEntry[]> {
  return safeInvoke<LocalShareEntry[]>('onion_share_list_local');
}

export async function onionShareStatus(): Promise<OnionShareStatus> {
  return safeInvoke<OnionShareStatus>('onion_share_status');
}

/** Used by header/sidebar: reflects Tor hidden service and bootstrap mode. */
export async function fetchNetworkPresence(): Promise<{
  online: boolean;
  onionActive: boolean;
  mode: OnionShareMode;
  localOnly: boolean;
  lastError: string | null;
  bootstrapPercent: number;
}> {
  try {
    const s = await onionShareStatus();
    const mode = (s.mode ?? 'idle') as OnionShareMode;
    const onionActive =
      mode === 'ready' && Boolean(s.running && s.onion && String(s.onion).trim().length > 0);
    const localOnly = Boolean(s.localOnly || mode === 'degraded');
    const online = Boolean(s.running || localOnly || mode === 'bootstrapping');
    return {
      online,
      onionActive,
      mode,
      localOnly,
      lastError: s.lastError ?? null,
      bootstrapPercent: s.bootstrapPercent ?? 0,
    };
  } catch {
    return {
      online: false,
      onionActive: false,
      mode: 'idle',
      localOnly: false,
      lastError: null,
      bootstrapPercent: 0,
    };
  }
}

export async function resetTorOverlayData(): Promise<{
  cleared: boolean;
  fallbackRenamed: boolean;
  path: string;
}> {
  return safeInvoke('reset_tor_overlay_data');
}

/** Manual retry — same as Start onion share. */
export async function retryOnionShare(): Promise<OnionShareStartResponse> {
  return onionShareStart();
}

export function listenTorBootstrapProgress(
  handler: (payload: TorBootstrapProgressPayload) => void
): Promise<() => void> {
  return listen<TorBootstrapProgressPayload>('tor-bootstrap-progress', e => handler(e.payload));
}

export async function trackerGetConfig(): Promise<TrackerNetworkConfig> {
  return safeInvoke<TrackerNetworkConfig>('tracker_get_config');
}

export async function trackerSetConfig(config: TrackerNetworkConfig): Promise<void> {
  return safeInvoke('tracker_set_config', { config });
}

/** Re-announce all seed-eligible treated documents (after library scan or resume global seeding). */
export async function syncAllEnabledSeeds(): Promise<number> {
  return safeInvoke<number>('sync_all_enabled_seeds_cmd');
}

export async function trackerGetLastSyncDiag(): Promise<TrackerSyncDiagnostics | null> {
  const v = await safeInvoke<TrackerSyncDiagnostics | null>('tracker_get_last_sync_diag');
  if (v === null || typeof v !== 'object') return null;
  return v as TrackerSyncDiagnostics;
}

export async function trackerRefreshLobby(): Promise<NetworkLobby> {
  return safeInvoke<NetworkLobby>('tracker_refresh_lobby');
}

export async function trackerGetCachedLobby(): Promise<NetworkLobby> {
  return safeInvoke<NetworkLobby>('tracker_get_cached_lobby_cmd');
}

export async function trackerStartWsLoop(): Promise<void> {
  return safeInvoke('tracker_start_ws_loop');
}

export async function trackerStopWsLoop(): Promise<void> {
  return safeInvoke('tracker_stop_ws_loop');
}

/**
 * Starts a background download; resolves with saved path when `onion-share-fetch-done` matches `link`.
 */
export async function onionShareFetch(
  link: string,
  outDir: string,
  fileName?: string
): Promise<string> {
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
        await safeInvoke('onion_share_fetch', {
          link: linkTrim,
          outDir,
          fileName: fileName ?? null,
        });
      } catch (err) {
        unlisten();
        reject(err);
      }
    })();
  });
}

export function listenTransferProgress(
  handler: (payload: TransferProgressPayload) => void
): Promise<() => void> {
  return listen<TransferProgressPayload>('transfer-progress', e => handler(e.payload));
}

export function listenOnionShareFetchDone(
  handler: (payload: OnionShareFetchDonePayload) => void
): Promise<() => void> {
  return listen<OnionShareFetchDonePayload>('onion-share-fetch-done', e => handler(e.payload));
}
