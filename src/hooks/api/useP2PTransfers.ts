import { createSignal } from 'solid-js';
import { transferFacade } from '@/services/network/transferFacade';
import type { DocumentInfo } from '@/services/documentService';

export function useP2PTransfers() {
  const [busy, setBusy] = createSignal(false);
  const [lastOp, setLastOp] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const setSeedEnabled = async (path: string, enabled: boolean): Promise<DocumentInfo> => {
    setBusy(true);
    setError(null);
    setLastOp(enabled ? 'seed:on' : 'seed:off');
    try {
      return await transferFacade.setDocumentSeedEnabled(path, enabled);
    } catch (e: unknown) {
      const msg = String(e instanceof Error ? e.message : e);
      setError(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const downloadByHash = async (hash: string, outDir: string, fileName?: string) => {
    setBusy(true);
    setError(null);
    setLastOp('download');
    try {
      await transferFacade.downloadByHashOrLink(hash, fileName || hash, outDir);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
      throw e;
    } finally {
      setBusy(false);
    }
  };

  return { busy, lastOp, error, setSeedEnabled, downloadByHash };
}
