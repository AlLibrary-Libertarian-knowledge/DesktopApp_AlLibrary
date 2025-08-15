import { Component, createSignal, Show, createResource } from 'solid-js';
import { torAdapter } from '@/services/network/torAdapter';
import { Button } from '@/components/foundation/Button';
import { Input } from '@/components/foundation/Input';

export const NetworkSettingsPanel: Component = () => {
  const [enabled, setEnabled] = createSignal(false);
  const [status, setStatus] = createSignal<{ bootstrapped: boolean; circuitEstablished: boolean; bridgesEnabled: boolean; socks?: string } | null>(null);
  const [bridges, setBridges] = createSignal('');
  const [mode, setMode] = createSignal<'managed' | 'browser_socks'>('managed');
  const [externalSocks, setExternalSocks] = createSignal('127.0.0.1:9150');
  const [torStatus] = createResource(async () => torAdapter.status());

  const handleEnableTor = async () => {
    const st = await torAdapter.start({ bridgeSupport: true, socksAddr: mode() === 'browser_socks' ? externalSocks() : undefined });
    setStatus(st);
    setEnabled(true);
  };

  const handleRotate = async () => {
    await window.__TAURI_INVOKE__?.('rotate_tor_circuit');
    const st = await torAdapter.status();
    setStatus(st);
  };

  const handleApplyBridges = async () => {
    const list = bridges().split('\n').map(s => s.trim()).filter(Boolean);
    await torAdapter.enableBridges(list);
    const st = await torAdapter.status();
    setStatus(st);
  };

  return (
    <div>
      <h2>Network Settings</h2>
      <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '12px' }}>
        <div>
          <label>Tor Mode</label>
          <div style={{ display: 'flex', gap: '8px', 'margin-top': '4px' }}>
            <Button variant={mode() === 'managed' ? 'primary' : 'outline'} onClick={() => setMode('managed')}>Managed Tor</Button>
            <Button variant={mode() === 'browser_socks' ? 'primary' : 'outline'} onClick={() => setMode('browser_socks')}>Tor Browser SOCKS</Button>
          </div>
          <Show when={mode() === 'browser_socks'}>
            <div style={{ 'margin-top': '8px' }}>
              <label>SOCKS Address</label>
              <Input type="text" value={externalSocks()} onInput={(e: any) => setExternalSocks(e.currentTarget.value)} />
            </div>
          </Show>
          <div style={{ 'margin-top': '8px' }}>
            <Button onClick={handleEnableTor}>{enabled() ? 'TOR Enabled' : 'Enable TOR'}</Button>
            <Button variant="secondary" onClick={handleRotate} disabled={!torStatus()?.supportsControl}>Rotate Circuit</Button>
          </div>
        </div>

        <div>
          <label>Bridges (managed mode)</label>
          <Input type="text" value={bridges()} onInput={(e: any) => setBridges(e.currentTarget.value)} placeholder="obfs4 ..." />
          <Button onClick={handleApplyBridges} disabled={mode() !== 'managed'}>Apply Bridges</Button>
        </div>
      </div>
      <Show when={status()}>
        <div style={{ 'margin-top': '12px' }}>
          <div>Bootstrapped: {status()!.bootstrapped ? 'Yes' : 'No'}</div>
          <div>Circuit: {status()!.circuitEstablished ? 'Established' : 'Pending'}</div>
          <div>Bridges: {status()!.bridgesEnabled ? 'Enabled' : 'Disabled'}</div>
          <div>SOCKS: {status()!.socks ?? '-'}</div>
        </div>
      </Show>
    </div>
  );
};


