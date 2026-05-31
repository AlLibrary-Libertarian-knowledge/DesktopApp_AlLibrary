import { type Component, createSignal, Show, onMount } from 'solid-js';
import { Button } from '@/components/foundation/Button';
import { Switch } from '@/components/foundation/Switch';
import {
  onionShareStatus,
  onionShareStart,
  resetTorOverlayData,
  trackerGetConfig,
  trackerSetConfig,
  syncAllEnabledSeeds,
  type OnionShareStatus,
} from '@/services/network/onionShareService';

export const NetworkSettingsPanel: Component = () => {
  const [status, setStatus] = createSignal<OnionShareStatus | null>(null);
  const [bridges, setBridges] = createSignal('');
  const [pauseAllSeeding, setPauseAllSeeding] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [message, setMessage] = createSignal<string | null>(null);

  const refreshStatus = async () => {
    const st = await onionShareStatus();
    setStatus(st);
  };

  onMount(async () => {
    try {
      const cfg = await trackerGetConfig();
      setBridges((cfg.torBridges ?? []).join('\n'));
      setPauseAllSeeding(!(cfg.sharePublicly ?? true));
    } catch {
      /* ignore */
    }
    await refreshStatus();
  });

  const handleRetry = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await onionShareStart();
      setMessage('Tor connection retry started.');
      await refreshStatus();
    } catch (e: unknown) {
      setMessage(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await resetTorOverlayData();
      setMessage(
        result.cleared
          ? `Tor data cleared at ${result.path}`
          : result.fallbackRenamed
            ? `Tor data renamed (locked); fresh dir will be used on retry`
            : `Reset incomplete at ${result.path}; retry may use alternate dir`
      );
      await refreshStatus();
    } catch (e: unknown) {
      setMessage(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveBridges = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const cfg = await trackerGetConfig();
      const list = bridges()
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
      await trackerSetConfig({ ...cfg, torBridges: list });
      setMessage('Bridges saved. Retry Tor connection to apply.');
    } catch (e: unknown) {
      setMessage(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSeedingPause = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const cfg = await trackerGetConfig();
      await trackerSetConfig({ ...cfg, sharePublicly: !pauseAllSeeding() });
      await syncAllEnabledSeeds();
      setMessage(pauseAllSeeding() ? 'All seeding paused.' : 'Seeding resumed for eligible files.');
    } catch (e: unknown) {
      setMessage(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>Network Settings</h2>
      <div style={{ 'margin-bottom': '16px' }}>
        <Switch
          checked={pauseAllSeeding()}
          onChange={setPauseAllSeeding}
          label="Pause all seeding"
          description="Like qBittorrent pause-all: stops announces but keeps per-file preferences."
        />
        <div style={{ 'margin-top': '8px' }}>
          <Button onClick={handleSaveSeedingPause} disabled={busy()}>
            Save seeding pause
          </Button>
        </div>
      </div>
      <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '12px' }}>
        <div>
          <h3>Tor / Onion status</h3>
          <Show when={status()}>
            <div style={{ 'font-size': '14px', 'line-height': '1.6' }}>
              <div>Mode: {status()!.mode ?? 'idle'}</div>
              <div>Bootstrap: {status()!.bootstrapPercent ?? 0}%</div>
              <div>Running: {status()!.running ? 'Yes' : 'No'}</div>
              <div>Onion: {status()!.onion ?? '—'}</div>
              <Show when={status()!.lastError}>
                <div style={{ color: '#b45309' }}>Last error: {status()!.lastError}</div>
              </Show>
            </div>
          </Show>
          <div style={{ display: 'flex', gap: '8px', 'margin-top': '12px', 'flex-wrap': 'wrap' }}>
            <Button onClick={handleRetry} disabled={busy()}>
              Retry Tor connection
            </Button>
            <Button variant="secondary" onClick={handleReset} disabled={busy()}>
              Reset Tor data
            </Button>
          </div>
        </div>

        <div>
          <label>Tor bridges (one per line)</label>
          <textarea
            value={bridges()}
            onInput={e => setBridges(e.currentTarget.value)}
            placeholder="obfs4 127.0.0.1:1234 cert=…"
            rows={6}
            style={{
              width: '100%',
              'margin-top': '4px',
              'font-family': 'monospace',
              'font-size': '12px',
            }}
          />
          <div style={{ 'margin-top': '8px' }}>
            <Button onClick={handleSaveBridges} disabled={busy()}>
              Save bridges
            </Button>
          </div>
        </div>
      </div>
      <Show when={message()}>
        <p style={{ 'margin-top': '12px', 'font-size': '14px' }}>{message()}</p>
      </Show>
    </div>
  );
};
