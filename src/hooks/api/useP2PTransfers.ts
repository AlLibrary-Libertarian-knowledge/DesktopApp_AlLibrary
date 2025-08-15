import { createSignal } from 'solid-js';
import { enableTorAndP2P } from '@/services/network/bootstrap';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';

export function useP2PTransfers() {
  const [enabled, setEnabled] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [lastOp, setLastOp] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const enable = async () => {
    setBusy(true); setError(null);
    try { await enableTorAndP2P(); setEnabled(true); } catch (e: any) { setError(String(e)); }
    finally { setBusy(false); }
  };

  const seedFile = async (path: string) => {
    setBusy(true); setError(null); setLastOp('seed:file');
    try { await p2pNetworkService.publishContent(path); } catch (e: any) { setError(String(e)); }
    finally { setBusy(false); }
  };

  const seedFolder = async (dir: string, files: string[]) => {
    setBusy(true); setError(null); setLastOp('seed:folder');
    try { for (const f of files) await p2pNetworkService.publishContent(`${dir}/${f}`); }
    catch (e: any) { setError(String(e)); }
    finally { setBusy(false); }
  };

  const downloadByHash = async (hash: string, outDir: string) => {
    setBusy(true); setError(null); setLastOp('download');
    try { await p2pNetworkService.fetchContent(hash, `${outDir}/${hash}.bin`); }
    catch (e: any) { setError(String(e)); }
    finally { setBusy(false); }
  };

  return { enabled, busy, lastOp, error, enable, seedFile, seedFolder, downloadByHash };
}


