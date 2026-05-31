/**
 * Header/sidebar presence: reflects onion-share / POC tracker overlay (Tor hidden service up).
 */
import { createSignal, onCleanup, onMount } from 'solid-js';
import { listen } from '@tauri-apps/api/event';
import {
  fetchNetworkPresence,
  listenTorBootstrapProgress,
  type OnionShareMode,
} from '@/services/network/onionShareService';

export interface NetworkPresence {
  online: boolean;
  onionActive: boolean;
  mode: OnionShareMode;
  localOnly: boolean;
  lastError: string | null;
  bootstrapPercent: number;
}

const POLL_MS = 15_000;

export function useNetworkPresenceResource() {
  const [presence, setPresence] = createSignal<NetworkPresence>({
    online: false,
    onionActive: false,
    mode: 'idle',
    localOnly: false,
    lastError: null,
    bootstrapPercent: 0,
  });

  onMount(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const next = await fetchNetworkPresence();
        if (!cancelled) setPresence(next);
      } catch {
        /* keep last value */
      }
    };

    void poll();
    const intervalId = globalThis.setInterval(() => void poll(), POLL_MS);

    const bump = () => void poll();
    window.addEventListener('tor-status-updated', bump);

    const unlisteners: Array<() => void> = [];
    void (async () => {
      try {
        for (const event of ['network-presence-changed', 'tracker-ws-started'] as const) {
          const u = await listen(event, bump);
          if (!cancelled) unlisteners.push(u);
          else u();
        }
        const uTor = await listenTorBootstrapProgress(() => bump());
        if (!cancelled) unlisteners.push(uTor);
        else uTor();
      } catch {
        /* not in Tauri webview */
      }
    })();

    onCleanup(() => {
      cancelled = true;
      globalThis.clearInterval(intervalId);
      window.removeEventListener('tor-status-updated', bump);
      unlisteners.forEach(u => u());
    });
  });

  return presence;
}

export function onionBadgeLabel(presence: NetworkPresence): string {
  if (presence.onionActive) return 'Onion';
  if (presence.mode === 'bootstrapping') return 'Connecting…';
  if (presence.localOnly || presence.mode === 'degraded') return 'Local only';
  return 'No Onion';
}
