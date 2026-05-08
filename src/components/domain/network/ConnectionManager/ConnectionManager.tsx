import { type Component, For, createSignal } from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Select } from '@/components/foundation/Select';
import { Switch } from '@/components/foundation/Switch';
import type { ConnectionManagerProps } from './types';
import styles from './ConnectionManager.module.css';

type ConfigProfile = 'balanced' | 'lowBandwidth' | 'highThroughput' | 'conservative';

interface MockUsageMetric {
  label: string;
  current: number;
  max: number;
  unit: string;
}

export const ConnectionManager: Component<ConnectionManagerProps> = props => {
  const [profile, setProfile] = createSignal<ConfigProfile>('balanced');
  const [saveMessage, setSaveMessage] = createSignal('');

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

  const saveMockConfig = () => {
    setSaveMessage('Mock configuration saved locally (network backend is disabled).');
    props.onStatusChange?.('started');
    window.setTimeout(() => setSaveMessage(''), 2600);
  };

  const resetConfig = () => applyProfile('balanced');

  return (
    <div class={`${styles.connectionManager} ${props.class || ''}`}>
      <Card class={styles.sectionCard}>
        <div class={styles.sectionHeader}>
          <h3 class={styles.title}>Configuration Center</h3>
          <span class={styles.badge}>Mock Mode</span>
        </div>
        <p class={styles.subtitle}>
          Tune useful runtime limits and peer behavior now; these settings are mocked until the
          networking layer is reintroduced.
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
