import { createSignal } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { enableTorAndP2P } from '@/services/network/bootstrap';
import { transferFacade } from '@/services/network/transferFacade';
import type { DocumentInfo } from '@/services/documentService';

export function useP2PTransfers() {
  const [enabled, setEnabled] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [lastOp, setLastOp] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const enable = async () => {
    setBusy(true);
    setError(null);
    try {
      await enableTorAndP2P();
      setEnabled(true);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const seedFile = async (path: string) => {
    setBusy(true);
    setError(null);
    setLastOp('seed:file');
    try {
      const info = await invoke<DocumentInfo>('get_document_info', { filePath: path });
      if (!info.is_treated) {
        throw new Error('Document must complete treatment (steps 0–7) before seeding.');
      }
      await transferFacade.addShare(path);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const seedFolder = async (dir: string, files: string[]) => {
    setBusy(true);
    setError(null);
    setLastOp('seed:folder');
    try {
      for (const f of files) {
        await transferFacade.addShare(`${dir}/${f}`);
      }
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
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

  return { enabled, busy, lastOp, error, enable, seedFile, seedFolder, downloadByHash };
}
