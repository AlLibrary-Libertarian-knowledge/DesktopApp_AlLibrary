import { Component, createResource, createSignal, onCleanup, onMount } from 'solid-js';
import styles from './P2POverview.module.css';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Shield, Network, Globe, Plug, RefreshCw } from 'lucide-solid';
import { torAdapter } from '@/services/network/torAdapter';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';

export const P2POverview: Component = () => {
  // Manual refresh signal; increment to refetch resources without reloading page
  const [refreshTick, setRefreshTick] = createSignal(0);

  const startPrivateNetwork = async () => {
    await torAdapter.start({ bridgeSupport: true });
    await p2pNetworkService.initializeNode({ torSupport: true } as any);
    await p2pNetworkService.startNode();
    await p2pNetworkService.enableTorRouting();
    setRefreshTick(t => t + 1);
  };

  // Lightweight resources (no auto-polling)
  const [torStatus] = createResource(refreshTick, async () => torAdapter.status());
  const [nodeStatus] = createResource(refreshTick, async () => p2pNetworkService.getNodeStatus());
  const [metrics] = createResource(refreshTick, async () => p2pNetworkService.getNetworkMetrics());

  const rotateCircuit = async () => {
    try {
      await torAdapter.rotateCircuit();
      setRefreshTick(t => t + 1);
    } catch (e) {
      console.error('Failed to rotate circuit', e);
    }
  };

  // Optional: tiny, gentle auto-refresh that does not re-render the whole page
  const [autoRefresh, setAutoRefresh] = createSignal(false);
  let intervalId: number | undefined;
  onMount(() => {
    // kick first load
    setRefreshTick(t => t + 1);
  });
  onCleanup(() => {
    if (intervalId) globalThis.clearInterval(intervalId);
  });
  const toggleAuto = () => {
    const next = !autoRefresh();
    setAutoRefresh(next);
    if (intervalId) {
      globalThis.clearInterval(intervalId);
      intervalId = undefined;
    }
    if (next) {
      intervalId = globalThis.setInterval(() => setRefreshTick(t => t + 1), 5000) as unknown as number;
    }
  };

  return (
    <div class={styles.page}>
      <section class={styles.hero}>
        <div class={styles.title}>Private P2P Network over Tor</div>
        <div class={styles.subtitle}>Anonymous-by-default connections, educational-only cultural context, and censorship resistance.</div>
        <div class={styles.pill}><Network size={12}/> Internet + TOR</div>
        <div style={{ 'margin-top': '14px', display: 'flex', gap: '10px' }}>
          <Button variant="primary" onClick={startPrivateNetwork}><Shield size={16} /> Enable Private Networking</Button>
          <Button variant="outline" disabled={!torStatus()?.supportsControl} onClick={rotateCircuit} title={torStatus()?.supportsControl ? 'Request a new Tor circuit' : 'Unavailable with external Tor SOCKS'}>
            <RefreshCw size={16} /> Rotate Circuit
          </Button>
          <Button variant="ghost" onClick={() => setRefreshTick(t => t + 1)}>Refresh Status</Button>
          <Button variant={autoRefresh() ? 'secondary' : 'ghost'} onClick={toggleAuto}>{autoRefresh() ? 'Auto: ON' : 'Auto: OFF'}</Button>
        </div>
        <div class={styles.metrics}>
          <div class={styles.metricCard}>
            <div class={styles.metricLabel}>Peers Connected</div>
            <div class={styles.metricValue}>{nodeStatus()?.connectedPeers ?? 0}</div>
          </div>
          <div class={styles.metricCard}>
            <div class={styles.metricLabel}>Avg Latency</div>
            <div class={styles.metricValue}>{metrics()?.performance?.averageLatency ?? 0}ms</div>
          </div>
          <div class={styles.metricCard}>
            <div class={styles.metricLabel}>Anonymity Level</div>
            <div class={styles.metricValue}>{torStatus()?.circuitEstablished ? 'High' : 'Low'}</div>
          </div>
        </div>
      </section>

      <div class={styles.grid}>
        <Card class={`${styles.card} ${styles.wide}` as string}>
          <div class={styles.cardTitle}><Network size={16} /> How your connection flows</div>
          <svg class={`${styles.diagram} ${styles.svgFlow}`} viewBox="0 0 800 240">
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stop-color="#00ffd5" stop-opacity="0.9"/>
                <stop offset="100%" stop-color="#00a2ff" stop-opacity="0.9"/>
              </linearGradient>
            </defs>
            <circle cx="80" cy="120" r="28" fill="url(#g1)" opacity="0.9" />
            <text x="80" y="124" text-anchor="middle" font-size="10">You</text>
            <line x1="120" y1="120" x2="300" y2="120" stroke="url(#g1)" stroke-width="3"/>
            <rect x="300" y="92" width="90" height="56" rx="10" ry="10" fill="none" stroke="url(#g1)" stroke-width="2" />
            <text x="345" y="124" text-anchor="middle" font-size="10">Tor SOCKS</text>
            <line x1="390" y1="120" x2="560" y2="120" stroke="url(#g1)" stroke-width="3"/>
            <rect x="560" y="92" width="110" height="56" rx="10" ry="10" fill="none" stroke="url(#g1)" stroke-width="2" />
            <text x="615" y="124" text-anchor="middle" font-size="10">Onion Service</text>
          </svg>
          <div class={styles.legend}>
            <span class={`${styles.chip} ${styles.pulse}`}><Plug size={12}/> All traffic goes through Tor</span>
            <span class={styles.chip}><Globe size={12}/> No public IP exposure</span>
            <span class={styles.chip}><Shield size={12}/> Info-only cultural context (no gating)</span>
          </div>
        </Card>

        <Card class={styles.card as string}>
          <div class={styles.cardTitle}><Globe size={16} /> What happens when you click "Enable TOR"</div>
          <ol class={styles.steps}>
            <li class={styles.step}>We check if Tor Browser SOCKS is running (127.0.0.1:9150). If not, we start the bundled tor.</li>
            <li class={styles.step}>We establish a SOCKS route and request a fresh circuit for anonymity.</li>
            <li class={styles.step}>We initialize a P2P node configured to never apply cultural filtering.</li>
            <li class={styles.step}>We discover peers and hidden services and start searching/sharing over Tor.</li>
          </ol>
        </Card>

        <Card class={styles.card as string}>
          <div class={styles.cardTitle}><Shield size={16} /> Your privacy & cultural guarantees</div>
          <ul style={{ 'margin-top': '6px', 'line-height': '1.6' }}>
            <li>Anonymous-by-default routing through Tor (no IP sharing).</li>
            <li>Cultural context is educational only; access is never restricted.</li>
            <li>Multiple perspectives are preserved; no centralized censorship.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default P2POverview;


