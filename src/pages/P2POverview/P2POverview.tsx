import { Component, createSignal } from 'solid-js';
import styles from './P2POverview.module.css';
import { Card } from '@/components/foundation/Card';
import { Shield, Network, Globe } from 'lucide-solid';
import { useP2POverview } from './hooks/useP2POverview';
import HeaderActions from './components/HeaderActions';
import TorLogViewer from './components/TorLogViewer';
import { TorTerminal } from '@/components/domain/network/TorTerminal';

export const P2POverview: Component = () => {
  const {
    torStatus,
    nodeStatus,
    metrics,
    refresh,
    enablePrivateNetworking,
    rotateCircuit,
    auto,
    toggleAuto,
    // lastRefreshAt, // reserved for future granular refresh visuals
  } = useP2POverview();
  const [showLog, setShowLog] = createSignal(false);
  // Preserve scroll on manual refresh by avoiding full-page state churn
  const onRefreshClick = async () => {
    const y = window.scrollY;
    const x = window.scrollX;
    await refresh();
    // Defer scroll restore 1 frame to wait for DOM diff to settle
    globalThis.requestAnimationFrame(() => {
      try { window.scrollTo(x, y); } catch { /* ignore */ }
    });
  };

  return (
    <div class={styles.page}>
      <section class={styles.hero}>
        <div class={styles.title}>Private P2P Network over Tor</div>
        <div class={styles.subtitle}>Anonymous-by-default connections, educational-only cultural context, and censorship resistance.</div>
        <div class={styles.pill}><Network size={12}/> Internet + TOR</div>
        <div style={{ 'margin-top': '14px' }}>
          <HeaderActions
            onEnable={enablePrivateNetworking}
            onRotate={rotateCircuit}
            onShowLog={() => setShowLog(true)}
            onRefresh={onRefreshClick}
            supportsControl={!!torStatus()?.supportsControl}
            autoEnabled={auto()}
            onToggleAuto={toggleAuto}
          />
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
            <span class={`${styles.chip} ${styles.pulse}`}>All traffic goes through Tor</span>
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

        <Card class={styles.card as string}>
          <div class={styles.cardTitle}><Network size={16} /> Tor Logs</div>
          <TorTerminal lines={600} />
        </Card>
      </div>
      <TorLogViewer isOpen={showLog()} onClose={() => setShowLog(false)} />
    </div>
  );
};

export default P2POverview;


