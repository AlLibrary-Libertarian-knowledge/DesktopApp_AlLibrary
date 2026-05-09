/**
 * Header/sidebar presence: reflects onion-share / POC tracker overlay (Tor hidden service up).
 */
import { createResource, createSignal, onCleanup, onMount } from 'solid-js';
import { listen } from '@tauri-apps/api/event';
import { fetchNetworkPresence } from '@/services/network/onionShareService';

export interface NetworkPresence {
  /** Hidden service is up — participating in the onion P2P overlay. */
  online: boolean;
  /** Same signal for the Onion badge (Tor HS address known). */
  onionActive: boolean;
}

const POLL_MS = 5000;

export function useNetworkPresenceResource() {
  const [tick, setTick] = createSignal(0);

  const [presence] = createResource(
    tick,
    async (): Promise<NetworkPresence> => fetchNetworkPresence()
  );

  onMount(() => {
    setTick(t => t + 1);
    const intervalId = globalThis.setInterval(
      () => setTick(t => t + 1),
      POLL_MS
    ) as unknown as number;

    let disposed = false;
    const unlisteners: Array<() => void> = [];

    const torDomHandler = () => setTick(t => t + 1);
    window.addEventListener('tor-status-updated', torDomHandler);

    void (async () => {
      try {
        const u1 = await listen('network-presence-changed', () => setTick(t => t + 1));
        if (!disposed) unlisteners.push(u1);
        else u1();
      } catch {
        /* not running inside Tauri webview */
      }
      try {
        const u2 = await listen('tracker-ws-started', () => setTick(t => t + 1));
        if (!disposed) unlisteners.push(u2);
        else u2();
      } catch {
        /* same */
      }
    })();

    onCleanup(() => {
      disposed = true;
      globalThis.clearInterval(intervalId);
      window.removeEventListener('tor-status-updated', torDomHandler);
      unlisteners.forEach(u => u());
    });
  });

  return presence;
}
