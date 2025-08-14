import { Component, createSignal, Show } from 'solid-js';
import { torAdapter } from '@/services/network/torAdapter';
import { Button } from '@/components/foundation/Button';
import { Input } from '@/components/foundation/Input';

export const NetworkSettingsPanel: Component = () => {
  const [enabled, setEnabled] = createSignal(false);
  const [status, setStatus] = createSignal<{ bootstrapped: boolean; circuitEstablished: boolean; bridgesEnabled: boolean; socks?: string } | null>(null);
  const [bridges, setBridges] = createSignal('');

  const handleEnableTor = async () => {
    const st = await torAdapter.start({ bridgeSupport: true });
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
      <div>
        <Button onClick={handleEnableTor}>{enabled() ? 'TOR Enabled' : 'Enable TOR'}</Button>
        <Button variant="secondary" onClick={handleRotate}>Rotate Circuit</Button>
      </div>
      <Show when={status()}>
        <div style={{ 'margin-top': '12px' }}>
          <div>Bootstrapped: {status()!.bootstrapped ? 'Yes' : 'No'}</div>
          <div>Circuit: {status()!.circuitEstablished ? 'Established' : 'Pending'}</div>
          <div>Bridges: {status()!.bridgesEnabled ? 'Enabled' : 'Disabled'}</div>
          <div>SOCKS: {status()!.socks ?? '-'}</div>
        </div>
      </Show>
      <div style={{ 'margin-top': '12px' }}>
        <label>Bridges (one per line)</label>
        <Input type="text" value={bridges()} onInput={(e: any) => setBridges(e.currentTarget.value)} />
        <Button onClick={handleApplyBridges}>Apply Bridges</Button>
      </div>
    </div>
  );
};


