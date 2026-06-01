import { type Component, Show, createSignal, onMount } from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Switch } from '@/components/foundation/Switch';
import type { ConnectionManagerProps } from './types';
import {
  trackerGetConfig,
  trackerSetConfig,
  trackerGetLastSyncDiag,
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
  const [nodeId, setNodeId] = createSignal('');
  const [pauseAllSeeding, setPauseAllSeeding] = createSignal(false);
  const [trackerBusy, setTrackerBusy] = createSignal(false);
  const [trackerToast, setTrackerToast] = createSignal('');
  const [syncDiag, setSyncDiag] = createSignal<TrackerSyncDiagnostics | null>(null);
  const [resolvedDbPath, setResolvedDbPath] = createSignal('');
  const [advancedOpen, setAdvancedOpen] = createSignal(false);
  const [lobbySyncBusy, setLobbySyncBusy] = createSignal(false);

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
      await transferFacade.syncAllEnabledSeeds();
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
          <h3 class={styles.title}>Advanced</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAdvancedOpen(!advancedOpen())}>
          {advancedOpen() ? 'Hide advanced' : 'Show advanced'}
        </Button>
        <Show when={advancedOpen()}>
          <div class={styles.trackerMeta}>
            <p class={styles.subtitle}>
              Manual lobby sync retries the tracker when automatic sync fails (Tor must be running).
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
