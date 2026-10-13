/**
 * Header/sidebar presence: reflects onion-share / tracker overlay (Tor hidden service).
 * Shared module-level state so bootstrap progress updates all indicators instantly.
 */
import { createSignal, onCleanup, onMount } from 'solid-js';
import { listen } from '@tauri-apps/api/event';
import {
  fetchNetworkPresence,
  listenTorBootstrapProgress,
  type OnionShareMode,
  type TorBootstrapProgressPayload,
  type TrackerPhase,
  type TrackerTransport,
} from '@/services/network/onionShareService';

export interface NetworkPresence {
  online: boolean;
  onionActive: boolean;
  mode: OnionShareMode;
  localOnly: boolean;
  lastError: string | null;
  bootstrapPercent: number;
  /** Tracker lobby sync state — independent from the Tor overlay `mode`. */
  trackerPhase: TrackerPhase;
  /** Tracker URL of the last successful sync. */
  trackerVia: string | null;
  trackerTransport: TrackerTransport | null;
}

const POLL_MS = 15_000;

const [presence, setPresence] = createSignal<NetworkPresence>({
  online: false,
  onionActive: false,
  mode: 'idle',
  localOnly: false,
  lastError: null,
  bootstrapPercent: 0,
  trackerPhase: 'idle',
  trackerVia: null,
  trackerTransport: null,
});

/**
 * Tor overlay reached a terminal state: `ready` (onion up) or gave up (`degraded` / `failed`).
 * Anything that talks to the tracker should wait for this instead of racing the bootstrap.
 */
export function isTorSettled(p: NetworkPresence): boolean {
  return p.onionActive || p.mode === 'degraded' || p.mode === 'failed';
}

/** Human label for where the lobby is coming from, e.g. "via .onion" / "via lab local". */
export function trackerSourceLabel(p: NetworkPresence): string {
  if (p.trackerPhase === 'syncing') return 'syncing lobby…';
  if (p.trackerPhase === 'failed') return 'lobby sync failed';
  if (p.trackerPhase !== 'connected') return '';
  switch (p.trackerTransport) {
    case 'onion':
      return 'lobby via .onion';
    case 'local':
      return 'lobby via lab local (127.0.0.1:8080)';
    case 'lan': {
      const host = (() => {
        try {
          return p.trackerVia ? new URL(p.trackerVia).host : '';
        } catch {
          return p.trackerVia ?? '';
        }
      })();
      return host ? `lobby via LAN ${host}` : 'lobby via LAN';
    }
    default:
      return 'lobby synced';
  }
}

const [bootstrapMessage, setBootstrapMessage] = createSignal<string | null>(null);

let subscriberCount = 0;
let pollIntervalId: ReturnType<typeof globalThis.setInterval> | undefined;
let unlisteners: Array<() => void> = [];

function applyBootstrapPayload(payload: TorBootstrapProgressPayload) {
  const mode = (payload.mode as OnionShareMode) || 'bootstrapping';
  setBootstrapMessage(payload.message?.trim() || null);
  setPresence(prev => ({
    ...prev,
    mode,
    bootstrapPercent: payload.bootstrapPercent ?? prev.bootstrapPercent,
    localOnly: payload.localOnly ?? prev.localOnly,
    lastError: payload.lastError ?? prev.lastError,
    online:
      mode === 'bootstrapping' || mode === 'ready' || prev.online || Boolean(payload.localOnly),
    onionActive: mode === 'ready' && !payload.localOnly,
    trackerPhase: payload.trackerPhase ?? prev.trackerPhase,
    trackerVia: payload.trackerVia === undefined ? prev.trackerVia : payload.trackerVia,
    trackerTransport:
      payload.trackerTransport === undefined ? prev.trackerTransport : payload.trackerTransport,
  }));
}

async function pollPresence() {
  try {
    const next = await fetchNetworkPresence();
    setPresence(next);
    if (next.mode !== 'bootstrapping') {
      setBootstrapMessage(null);
    }
  } catch {
    /* keep last value */
  }
}

function startPresenceSync() {
  void pollPresence();
  pollIntervalId = globalThis.setInterval(() => void pollPresence(), POLL_MS);

  const bump = () => void pollPresence();
  window.addEventListener('tor-status-updated', bump);

  void (async () => {
    try {
      for (const event of [
        'network-presence-changed',
        'tracker-ws-started',
        'tracker-sync-done',
      ] as const) {
        const u = await listen(event, bump);
        unlisteners.push(u);
      }
      const uTor = await listenTorBootstrapProgress(payload => {
        applyBootstrapPayload(payload);
      });
      unlisteners.push(uTor);
    } catch {
      /* not in Tauri webview */
    }
  })();

  unlisteners.push(() => window.removeEventListener('tor-status-updated', bump));
}

function stopPresenceSync() {
  if (pollIntervalId) {
    globalThis.clearInterval(pollIntervalId);
    pollIntervalId = undefined;
  }
  unlisteners.forEach(u => u());
  unlisteners = [];
}

export function useNetworkPresenceResource() {
  onMount(() => {
    subscriberCount += 1;
    if (subscriberCount === 1) {
      startPresenceSync();
    }
    onCleanup(() => {
      subscriberCount -= 1;
      if (subscriberCount <= 0) {
        subscriberCount = 0;
        stopPresenceSync();
      }
    });
  });

  return {
    presence,
    bootstrapMessage,
    isBootstrapping: () => presence().mode === 'bootstrapping',
    torSettled: () => isTorSettled(presence()),
  };
}

/** @deprecated Use destructuring from useNetworkPresenceResource().presence */
export function getPresenceSignal() {
  return presence;
}

/** Read-only presence accessor for non-component code (stores, services). */
export const networkPresence = presence;

export function onionBadgeLabel(presence: NetworkPresence): string {
  if (presence.onionActive) {
    return presence.trackerPhase === 'syncing' ? 'Onion · syncing' : 'Onion';
  }
  if (presence.mode === 'bootstrapping') {
    if (presence.bootstrapPercent > 0) return `${presence.bootstrapPercent}%`;
    return 'Connecting…';
  }
  if (presence.localOnly || presence.mode === 'degraded') return 'Local only';
  return 'No Onion';
}
