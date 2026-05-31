import { type Component, For, Show, createSignal, onMount } from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Select } from '@/components/foundation/Select';
import { Switch } from '@/components/foundation/Switch';
import type { ConnectionManagerProps } from './types';
import {
  trackerGetConfig,
  trackerSetConfig,
  syncAllEnabledSeeds,
  trackerGetLastSyncDiag,
  type TrackerNetworkConfig,
  type TrackerSyncDiagnostics,
} from '@/services/network/onionShareService';
import { invoke } from '@tauri-apps/api/core';
import type { AppSettings } from '@/types/Settings';
import styles from './ConnectionManager.module.css';

type ConfigProfile = 'balanced' | 'lowBandwidth' | 'highThroughput' | 'conservative';

interface MockUsageMetric {
  label: string;
  current: number;
  max: number;
  unit: string;
}

const TRACKER_PLACEHOLDER =
  'http://….onion — do not add :8080 (POC hidden service is on Tor port 80)';

export const ConnectionManager: Component<ConnectionManagerProps> = props => {
  const [profile, setProfile] = createSignal<ConfigProfile>('balanced');
  const [saveMessage, setSaveMessage] = createSignal('');

  const [trackerUrl, setTrackerUrl] = createSignal('');
  const [nodeId, setNodeId] = createSignal('');
  const [pauseAllSeeding, setPauseAllSeeding] = createSignal(false);
  const [trackerBusy, setTrackerBusy] = createSignal(false);
  const [trackerToast, setTrackerToast] = createSignal('');
  const [syncDiag, setSyncDiag] = createSignal<TrackerSyncDiagnostics | null>(null);
  const [resolvedDbPath, setResolvedDbPath] = createSignal('');

  const [downloadLimitMbps, setDownloadLimitMbps] = createSignal(24);
  const [uploadLimitMbps, setUploadLimitMbps] = createSignal(8);
  const [globalSpeedCapMbps, setGlobalSpeedCapMbps] = createSignal(40);

  const [ramBudgetMb, setRamBudgetMb] = createSignal(1024);
  const [cacheBudgetMb, setCacheBudgetMb] = createSignal(512);
  const [autoThrottle, setAutoThrottle] = createSignal(true);

  const [maxPeers, setMaxPeers] = createSignal(32);
  const [minPeers, setMinPeers] = createSignal(6);
  const [peerDiscoveryIntervalSec, setPeerDiscoveryIntervalSec] = createSignal(30);
  const [connectTimeoutSec, setConnectTimeoutSec] = createSignal(10);
  const [retryPolicy, setRetryPolicy] = createSignal('exponential');

  const usageMetrics = (): MockUsageMetric[] => [
    { label: 'RAM usage', current: 612, max: ramBudgetMb(), unit: 'MB' },
    { label: 'Cache usage', current: 308, max: cacheBudgetMb(), unit: 'MB' },
    { label: 'Download throughput', current: 12, max: downloadLimitMbps(), unit: 'Mbps' },
    { label: 'Upload throughput', current: 3, max: uploadLimitMbps(), unit: 'Mbps' },
    { label: 'Connected peers', current: 9, max: maxPeers(), unit: '' },
  ];

  const applyProfile = (next: ConfigProfile) => {
    setProfile(next);
    if (next === 'balanced') {
      setDownloadLimitMbps(24);
      setUploadLimitMbps(8);
      setGlobalSpeedCapMbps(40);
      setRamBudgetMb(1024);
      setCacheBudgetMb(512);
      setMaxPeers(32);
      setMinPeers(6);
      setPeerDiscoveryIntervalSec(30);
      setConnectTimeoutSec(10);
      setRetryPolicy('exponential');
      setAutoThrottle(true);
    } else if (next === 'lowBandwidth') {
      setDownloadLimitMbps(8);
      setUploadLimitMbps(3);
      setGlobalSpeedCapMbps(12);
      setRamBudgetMb(768);
      setCacheBudgetMb(256);
      setMaxPeers(12);
      setMinPeers(3);
      setPeerDiscoveryIntervalSec(45);
      setConnectTimeoutSec(12);
      setRetryPolicy('linear');
      setAutoThrottle(true);
    } else if (next === 'highThroughput') {
      setDownloadLimitMbps(80);
      setUploadLimitMbps(40);
      setGlobalSpeedCapMbps(120);
      setRamBudgetMb(2048);
      setCacheBudgetMb(1024);
      setMaxPeers(64);
      setMinPeers(10);
      setPeerDiscoveryIntervalSec(20);
      setConnectTimeoutSec(8);
      setRetryPolicy('exponential');
      setAutoThrottle(false);
    } else {
      setDownloadLimitMbps(12);
      setUploadLimitMbps(4);
      setGlobalSpeedCapMbps(18);
      setRamBudgetMb(896);
      setCacheBudgetMb(384);
      setMaxPeers(16);
      setMinPeers(4);
      setPeerDiscoveryIntervalSec(40);
      setConnectTimeoutSec(10);
      setRetryPolicy('fixed');
      setAutoThrottle(true);
    }
  };

  const loadTrackerConfig = async () => {
    setTrackerBusy(true);
    setTrackerToast('');
    try {
      const c = await trackerGetConfig();
      setTrackerUrl(c.trackerUrl?.trim() ?? '');
      setNodeId(c.nodeId ?? '');
      setPauseAllSeeding(!(c.sharePublicly ?? true));
      const diag = await trackerGetLastSyncDiag();
      setSyncDiag(diag);
      try {
        const settings = await invoke<AppSettings>('load_app_settings');
        if (settings.resolvedPaths?.databaseFile) {
          setResolvedDbPath(settings.resolvedPaths.databaseFile);
        }
      } catch {
        // ignore outside Tauri
      }
    } catch (e) {
      setTrackerToast(String(e instanceof Error ? e.message : e));
    } finally {
      setTrackerBusy(false);
    }
  };

  onMount(() => {
    void loadTrackerConfig();
  });

  const saveTrackerConfig = async () => {
    setTrackerBusy(true);
    setTrackerToast('');
    try {
      const url = trackerUrl().trim();
      if (!url) {
        setTrackerToast('Tracker URL cannot be empty.');
        return;
      }
      const cfg: TrackerNetworkConfig = {
        trackerUrl: url,
        nodeId: nodeId(),
        sharePublicly: !pauseAllSeeding(),
      };
      await trackerSetConfig(cfg);
      await syncAllEnabledSeeds();
      const diag = await trackerGetLastSyncDiag();
      setSyncDiag(diag);
      props.onConfigChange?.(cfg);
      setTrackerToast(
        pauseAllSeeding()
          ? 'All seeding paused. Per-file settings preserved.'
          : 'Seeding resumed. Eligible files will re-announce.'
      );
      window.setTimeout(() => setTrackerToast(''), 5000);
    } catch (e) {
      setTrackerToast(String(e instanceof Error ? e.message : e));
    } finally {
      setTrackerBusy(false);
    }
  };

  const saveMockConfig = () => {
    setSaveMessage('Mock configuration saved locally (preview only — not applied to transfers).');
    props.onStatusChange?.('started');
    window.setTimeout(() => setSaveMessage(''), 2600);
  };

  const resetConfig = () => applyProfile('balanced');

  return (
    <div class={`${styles.connectionManager} ${props.class || ''}`}>
      <Card class={styles.sectionCard}>
        <div class={styles.sectionHeader}>
          <h3 class={styles.title}>Global tracker (Tor lobby)</h3>
          <span class={`${styles.badge} ${styles.badgeLive}`}>Live</span>
        </div>
        <p class={styles.subtitle}>
          Same role as POC-Tracker-Onion-Share Docker: announce files and fetch the public lobby.
          Use <code class={styles.inlineCode}>http://…onion</code> only (no{' '}
          <code class={styles.inlineCode}>:8080</code>) — the compose stack exposes the tracker on
          Tor virtual port <strong>80</strong>, mapped to 8080 inside the container.
        </p>
        <label class={styles.fieldLabel}>
          Tracker base URL
          <textarea
            class={styles.trackerUrlField}
            rows={2}
            placeholder={TRACKER_PLACEHOLDER}
            value={trackerUrl()}
            onInput={e => setTrackerUrl(e.currentTarget.value)}
            spellcheck={false}
            autocomplete="off"
          />
        </label>
        <div class={styles.trackerMeta}>
          <label class={styles.fieldLabelInline}>
            Node ID (anonymous identity)
            <input
              class={styles.input}
              type="text"
              readonly
              value={nodeId()}
              title="Stored in onion-share config; delete config.json to regenerate if duplicated across PCs."
            />
          </label>
          <Switch
            checked={pauseAllSeeding()}
            onChange={setPauseAllSeeding}
            label="Pause all seeding"
            description="Stops lobby announces for every file. Per-file toggles are kept."
          />
        </div>
        <div class={styles.actionBar}>
          <Button
            variant="outline"
            disabled={trackerBusy()}
            onClick={() => void loadTrackerConfig()}
          >
            Reload from disk
          </Button>
          <Button
            variant="primary"
            loading={trackerBusy()}
            disabled={trackerBusy()}
            onClick={() => void saveTrackerConfig()}
          >
            Save tracker settings
          </Button>
        </div>
        {trackerToast() && <div class={styles.toast}>{trackerToast()}</div>}
        <Show when={syncDiag()}>
          {diag => (
            <div class={styles.trackerMeta}>
              <p class={styles.subtitle}>
                Last lobby sync: {diag().ok ? 'OK' : 'Failed'}
                {diag().urlUsed ? ` via ${diag().urlUsed}` : ''}
                {diag().usedLocalhostFallback ? ' (localhost fallback)' : ''}
                {diag().error ? ` — ${diag().error}` : ''}
              </p>
            </div>
          )}
        </Show>
        <Show when={resolvedDbPath()}>
          <p class={styles.subtitle}>
            Node database: <code class={styles.inlineCode}>{resolvedDbPath()}</code>
          </p>
        </Show>
      </Card>

      <Card class={styles.sectionCard}>
        <div class={styles.sectionHeader}>
          <h3 class={styles.title}>Configuration Center</h3>
          <span class={styles.badge}>Simulation</span>
        </div>
        <p class={styles.subtitle}>
          Preview-only limits for UI exploration; they are not yet wired to the onion chunk server.
        </p>
      </Card>

      <Card class={styles.sectionCard}>
        <h4 class={styles.sectionTitle}>Performance Profile</h4>
        <div class={styles.profileRow}>
          <Button
            variant={profile() === 'balanced' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => applyProfile('balanced')}
          >
            Balanced
          </Button>
          <Button
            variant={profile() === 'lowBandwidth' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => applyProfile('lowBandwidth')}
          >
            Low Bandwidth
          </Button>
          <Button
            variant={profile() === 'highThroughput' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => applyProfile('highThroughput')}
          >
            High Throughput
          </Button>
          <Button
            variant={profile() === 'conservative' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => applyProfile('conservative')}
          >
            Conservative
          </Button>
        </div>
      </Card>

      <div class={styles.gridTwo}>
        <Card class={styles.sectionCard}>
          <h4 class={styles.sectionTitle}>Bandwidth & Speed Limits</h4>
          <label class={styles.fieldLabel}>
            Download limit: <strong>{downloadLimitMbps()} Mbps</strong>
            <input
              class={styles.range}
              type="range"
              min="2"
              max="200"
              value={downloadLimitMbps()}
              onInput={e => setDownloadLimitMbps(Number(e.currentTarget.value))}
            />
          </label>
          <label class={styles.fieldLabel}>
            Upload limit: <strong>{uploadLimitMbps()} Mbps</strong>
            <input
              class={styles.range}
              type="range"
              min="1"
              max="100"
              value={uploadLimitMbps()}
              onInput={e => setUploadLimitMbps(Number(e.currentTarget.value))}
            />
          </label>
          <label class={styles.fieldLabel}>
            Global speed cap: <strong>{globalSpeedCapMbps()} Mbps</strong>
            <input
              class={styles.range}
              type="range"
              min="5"
              max="250"
              value={globalSpeedCapMbps()}
              onInput={e => setGlobalSpeedCapMbps(Number(e.currentTarget.value))}
            />
          </label>
        </Card>

        <Card class={styles.sectionCard}>
          <h4 class={styles.sectionTitle}>Resource Budgets</h4>
          <label class={styles.fieldLabel}>
            RAM budget: <strong>{ramBudgetMb()} MB</strong>
            <input
              class={styles.range}
              type="range"
              min="256"
              max="4096"
              step="64"
              value={ramBudgetMb()}
              onInput={e => setRamBudgetMb(Number(e.currentTarget.value))}
            />
          </label>
          <label class={styles.fieldLabel}>
            Cache budget: <strong>{cacheBudgetMb()} MB</strong>
            <input
              class={styles.range}
              type="range"
              min="128"
              max="2048"
              step="64"
              value={cacheBudgetMb()}
              onInput={e => setCacheBudgetMb(Number(e.currentTarget.value))}
            />
          </label>
          <Switch
            checked={autoThrottle()}
            onChange={setAutoThrottle}
            label="Enable auto-throttle when usage is near limits"
          />
        </Card>
      </div>

      <Card class={styles.sectionCard}>
        <h4 class={styles.sectionTitle}>Peer Network Tuning</h4>
        <div class={styles.gridFour}>
          <label class={styles.fieldLabel}>
            Max peers
            <input
              class={styles.input}
              type="number"
              min="1"
              max="200"
              value={maxPeers()}
              onInput={e => setMaxPeers(Number(e.currentTarget.value))}
            />
          </label>
          <label class={styles.fieldLabel}>
            Min peers
            <input
              class={styles.input}
              type="number"
              min="1"
              max="100"
              value={minPeers()}
              onInput={e => setMinPeers(Number(e.currentTarget.value))}
            />
          </label>
          <label class={styles.fieldLabel}>
            Discovery interval (s)
            <input
              class={styles.input}
              type="number"
              min="5"
              max="300"
              value={peerDiscoveryIntervalSec()}
              onInput={e => setPeerDiscoveryIntervalSec(Number(e.currentTarget.value))}
            />
          </label>
          <label class={styles.fieldLabel}>
            Connect timeout (s)
            <input
              class={styles.input}
              type="number"
              min="3"
              max="120"
              value={connectTimeoutSec()}
              onInput={e => setConnectTimeoutSec(Number(e.currentTarget.value))}
            />
          </label>
        </div>
        <div class={styles.selectRow}>
          <Select
            value={retryPolicy()}
            onChange={setRetryPolicy}
            options={[
              { value: 'fixed', label: 'Retry policy: Fixed interval' },
              { value: 'linear', label: 'Retry policy: Linear backoff' },
              { value: 'exponential', label: 'Retry policy: Exponential backoff' },
            ]}
          />
        </div>
      </Card>

      <Card class={styles.sectionCard}>
        <h4 class={styles.sectionTitle}>Live Mock Utilization</h4>
        <div class={styles.metrics}>
          <For each={usageMetrics()}>
            {metric => {
              const pct = Math.min(
                100,
                Math.round((metric.current / Math.max(metric.max, 1)) * 100)
              );
              return (
                <div class={styles.metric}>
                  <div class={styles.metricTop}>
                    <span>{metric.label}</span>
                    <span>
                      {metric.current}
                      {metric.unit} / {metric.max}
                      {metric.unit}
                    </span>
                  </div>
                  <div class={styles.progressTrack}>
                    <div class={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Card>

      <div class={styles.actionBar}>
        <Button variant="outline" onClick={resetConfig}>
          Reset to Balanced
        </Button>
        <Button variant="primary" onClick={saveMockConfig}>
          Save Mock Configuration
        </Button>
      </div>

      {saveMessage() && <div class={styles.toast}>{saveMessage()}</div>}
    </div>
  );
};
