import { type Component, Show, createSignal, onCleanup, onMount } from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Switch } from '@/components/foundation/Switch';
import type { ConnectionManagerProps } from './types';
import {
  trackerGetConfig,
  trackerSetConfig,
  trackerGetLastSyncDiag,
  trackerSmartConnect,
  onionShareStatus,
  DEFAULT_LOCAL_TRACKER_URL,
  type TrackerNetworkConfig,
  type TrackerSyncDiagnostics,
} from '@/services/network/onionShareService';
import { transferFacade } from '@/services/network/transferFacade';
import { invoke } from '@tauri-apps/api/core';
import { networkFacade } from '@/services/network/networkFacade';
import type { AppSettings } from '@/types/Settings';
import styles from './ConnectionManager.module.css';

const TRACKER_PLACEHOLDER =
  'http://….onion — do not add :8080 (POC hidden service is on Tor port 80)';

export const ConnectionManager: Component<ConnectionManagerProps> = props => {
  const [trackerUrl, setTrackerUrl] = createSignal('');
  const [hubUrl, setHubUrl] = createSignal('');
  const [nodeId, setNodeId] = createSignal('');
  const [pauseAllSeeding, setPauseAllSeeding] = createSignal(false);
  const [trackerBusy, setTrackerBusy] = createSignal(false);
  const [connectBusy, setConnectBusy] = createSignal(false);
  const [trackerToast, setTrackerToast] = createSignal('');
  const [syncDiag, setSyncDiag] = createSignal<TrackerSyncDiagnostics | null>(null);
  const [resolvedDbPath, setResolvedDbPath] = createSignal('');
  const [advancedOpen, setAdvancedOpen] = createSignal(false);
  const [lobbySyncBusy, setLobbySyncBusy] = createSignal(false);
  const [myOnion, setMyOnion] = createSignal<string | null>(null);
  const [onionRunning, setOnionRunning] = createSignal(false);
  const [onionPort, setOnionPort] = createSignal<number | null>(null);
  const [copyToast, setCopyToast] = createSignal('');
  const [lastGood, setLastGood] = createSignal('');

  const loadMyOnion = async () => {
    try {
      const st = await onionShareStatus();
      const onion = (st.onion || '').trim() || null;
      setMyOnion(onion);
      setOnionRunning(Boolean(st.running && onion));
      setOnionPort(st.localPort ?? null);
    } catch {
      setMyOnion(null);
      setOnionRunning(false);
      setOnionPort(null);
    }
  };

  const loadTrackerConfig = async () => {
    setTrackerBusy(true);
    setTrackerToast('');
    try {
      const c = await trackerGetConfig();
      setTrackerUrl(c.trackerUrl?.trim() ?? '');
      setHubUrl(c.preferredHubUrl?.trim() ?? '');
      setLastGood(c.lastGoodTrackerUrl?.trim() ?? '');
      setNodeId(c.nodeId ?? '');
      setPauseAllSeeding(!(c.sharePublicly ?? true));
      const diag = await trackerGetLastSyncDiag();
      setSyncDiag(diag);
      await loadMyOnion();
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

  const copyMyOnion = async () => {
    const onion = myOnion();
    if (!onion) return;
    const link = onion.startsWith('http') ? onion : `http://${onion}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopyToast('Copied this machine’s .onion link');
      window.setTimeout(() => setCopyToast(''), 2500);
    } catch {
      setCopyToast('Could not copy — select the field manually');
      window.setTimeout(() => setCopyToast(''), 3000);
    }
  };

  onMount(() => {
    void loadTrackerConfig();
    const id = window.setInterval(() => {
      void loadMyOnion();
    }, 8000);
    onCleanup(() => window.clearInterval(id));
  });

  const buildCfg = (): TrackerNetworkConfig => ({
    trackerUrl: trackerUrl().trim(),
    nodeId: nodeId(),
    sharePublicly: !pauseAllSeeding(),
    preferredHubUrl: hubUrl().trim(),
    lastGoodTrackerUrl: lastGood() || undefined,
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
      const cfg = buildCfg();
      await trackerSetConfig(cfg);
      await transferFacade.syncAllEnabledSeeds();
      const diag = await trackerGetLastSyncDiag();
      setSyncDiag(diag);
      props.onConfigChange?.(cfg);
      setTrackerToast(
        pauseAllSeeding() ? 'All seeding paused. Per-file settings preserved.' : 'Settings saved.'
      );
      window.setTimeout(() => setTrackerToast(''), 5000);
    } catch (e) {
      setTrackerToast(String(e instanceof Error ? e.message : e));
    } finally {
      setTrackerBusy(false);
    }
  };

  const connectAndSync = async () => {
    setConnectBusy(true);
    setTrackerToast('');
    try {
      // Persist hub URL first so smart connect can use it.
      const url = trackerUrl().trim() || DEFAULT_LOCAL_TRACKER_URL;
      await trackerSetConfig({
        ...buildCfg(),
        trackerUrl: url,
      });
      const result = await trackerSmartConnect();
      await loadTrackerConfig();
      if (result.ok) {
        try {
          await transferFacade.syncAllEnabledSeeds();
        } catch {
          /* optional */
        }
        setTrackerToast(
          `Connected via ${result.urlUsed}` +
            (result.onlineNodes != null ? ` · ${result.onlineNodes} nodes` : '')
        );
        props.onConfigChange?.(await trackerGetConfig());
      } else {
        setTrackerToast(
          result.error ||
            'Could not reach any tracker. On a family PC set Hub LAN URL to the hub IP:8080.'
        );
      }
      window.setTimeout(() => setTrackerToast(''), 8000);
    } catch (e) {
      setTrackerToast(String(e instanceof Error ? e.message : e));
    } finally {
      setConnectBusy(false);
    }
  };

  const manualLobbySync = async () => {
    setLobbySyncBusy(true);
    setTrackerToast('');
    try {
      await networkFacade.refreshLobby();
      const diag = await trackerGetLastSyncDiag();
      setSyncDiag(diag);
      setTrackerToast('Lobby refreshed from tracker.');
      window.setTimeout(() => setTrackerToast(''), 4000);
    } catch (e) {
      setTrackerToast(String(e instanceof Error ? e.message : e));
    } finally {
      setLobbySyncBusy(false);
    }
  };

  return (
    <div class={`${styles.connectionManager} ${props.class || ''}`}>
      <Card class={styles.sectionCard}>
        <div class={styles.sectionHeader}>
          <h3 class={styles.title}>Global tracker (Tor lobby)</h3>
          <span class={`${styles.badge} ${styles.badgeLive}`}>Live</span>
        </div>
        <p class={styles.subtitle}>
          Use <strong>Connect &amp; sync lobby</strong> to auto-pick a reachable tracker (hub LAN →
          last good → lab local → onion). Family PCs must set <strong>Hub LAN URL</strong> to the
          hub machine IP — not <code class={styles.inlineCode}>127.0.0.1</code>.
        </p>

        <div class={styles.connectHero}>
          <Button
            variant="primary"
            loading={connectBusy()}
            disabled={connectBusy() || trackerBusy()}
            onClick={() => void connectAndSync()}
          >
            Connect &amp; sync lobby
          </Button>
          <p class={styles.subtitle}>
            Probes and reconnects in one click. Avoids dead localhost fallbacks on other PCs.
          </p>
        </div>

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

        <label class={styles.fieldLabel}>
          Hub LAN URL (household PCs)
          <input
            class={styles.trackerUrlField}
            type="url"
            placeholder="http://192.168.x.x:8080 — IP of the PC running TrackerRust Docker"
            value={hubUrl()}
            onInput={e => setHubUrl(e.currentTarget.value)}
            spellcheck={false}
            autocomplete="off"
          />
        </label>
        <Show when={lastGood()}>
          <p class={styles.subtitle}>
            Last good tracker: <code class={styles.inlineCode}>{lastGood()}</code>
          </p>
        </Show>

        <div class={styles.myOnionBlock}>
          <div class={styles.sectionHeader}>
            <label class={styles.fieldLabel} style={{ margin: 0, flex: 1 }}>
              This machine’s .onion (share endpoint)
              <input
                class={styles.trackerUrlField}
                type="text"
                readonly
                value={
                  myOnion()
                    ? myOnion()!.startsWith('http')
                      ? myOnion()!
                      : `http://${myOnion()}`
                    : onionRunning()
                      ? 'Waiting for hidden service…'
                      : 'Onion share not running — start Tor / onion share first'
                }
                title="Published by this PC’s Tor hidden service. Share file links use this host."
                spellcheck={false}
              />
            </label>
            <span class={`${styles.badge} ${onionRunning() ? styles.badgeLive : styles.badgeIdle}`}>
              {onionRunning() ? 'Published' : 'Offline'}
            </span>
          </div>
          <Show when={onionPort() != null}>
            <p class={styles.subtitle}>
              Local Axum port: <code class={styles.inlineCode}>{onionPort()}</code> (Tor maps
              virtual 80 → this port)
            </p>
          </Show>
          <div class={styles.actionBar}>
            <Button
              variant="outline"
              size="sm"
              disabled={!myOnion()}
              onClick={() => void copyMyOnion()}
            >
              Copy .onion link
            </Button>
            <Button variant="outline" size="sm" onClick={() => void loadMyOnion()}>
              Refresh onion
            </Button>
          </div>
          <Show when={copyToast()}>
            <div class={styles.toast}>{copyToast()}</div>
          </Show>
        </div>
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
            disabled={trackerBusy() || connectBusy()}
            onClick={() => void loadTrackerConfig()}
          >
            Reload from disk
          </Button>
          <Button
            variant="outline"
            loading={trackerBusy()}
            disabled={trackerBusy() || connectBusy()}
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
          <h3 class={styles.title}>Advanced</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAdvancedOpen(!advancedOpen())}>
          {advancedOpen() ? 'Hide advanced' : 'Show advanced'}
        </Button>
        <Show when={advancedOpen()}>
          <div class={styles.trackerMeta}>
            <p class={styles.subtitle}>
              Manual lobby sync retries the current saved tracker URL only.
            </p>
            <Button
              variant="primary"
              size="sm"
              loading={lobbySyncBusy()}
              disabled={lobbySyncBusy()}
              onClick={() => void manualLobbySync()}
            >
              Refresh lobby now
            </Button>
          </div>
        </Show>
      </Card>
    </div>
  );
};
