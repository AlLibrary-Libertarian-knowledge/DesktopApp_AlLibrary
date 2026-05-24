/**
 * Header/sidebar presence: reflects onion-share / POC tracker overlay (Tor hidden service up).
 */
import { createSignal, onCleanup, onMount } from 'solid-js';
import { listen } from '@tauri-apps/api/event';
import { fetchNetworkPresence } from '@/services/network/onionShareService';

export interface NetworkPresence {
  online: boolean;
  onionActive: boolean;
}

const POLL_MS = 15_000;

export function useNetworkPresenceResource() {
  const [presence, setPresence] = createSignal<NetworkPresence>({
    online: false,
    onionActive: false,
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
