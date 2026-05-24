import { createSignal, onCleanup, onMount } from 'solid-js';
import {
  transferFacade,
  type ShareEntryView,
  type TransferView,
} from '@/services/network/transferFacade';

export function useTransferState() {
  const [shares, setShares] = createSignal<ShareEntryView[]>([]);
  const [activeDownloads, setActiveDownloads] = createSignal<TransferView[]>([]);
  const [completedDownloads, setCompletedDownloads] = createSignal<TransferView[]>([]);
  const [onionRunning, setOnionRunning] = createSignal(false);
  const [onionAddress, setOnionAddress] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const refreshOnionStatus = async () => {
    try {
      const st = await transferFacade.getOnionStatus();
      setOnionRunning(st.running);
      setOnionAddress(st.onion);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const refreshShares = async () => {
    setError(null);
    try {
      const list = await transferFacade.listShares();
      setShares(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const refreshAll = async () => {
    await Promise.all([refreshOnionStatus(), refreshShares()]);
  };

  onMount(() => {
    const { active, completed } = transferFacade.listTransfers();
    setActiveDownloads(active);
    setCompletedDownloads(completed);

    void refreshAll();

    const unsub = transferFacade.subscribeTransfers((activeList, completedList) => {
      setActiveDownloads(activeList);
      setCompletedDownloads(completedList);
    });

    onCleanup(() => unsub());
  });

  const addShare = async (path: string) => {
    setBusy(true);
    setError(null);
    try {
      await transferFacade.addShare(path);
      await refreshShares();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const removeShare = async (fileId: string) => {
    setBusy(true);
    setError(null);
    try {
      await transferFacade.removeShare(fileId);
      await refreshShares();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const downloadLink = async (link: string, fileName: string, outDir?: string) => {
    setError(null);
    try {
      return await transferFacade.downloadLink(link, fileName, outDir);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      throw e;
    }
  };

  const startOnionShare = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await transferFacade.startOnionShare();
      setOnionRunning(true);
      setOnionAddress(res.onion);
      await refreshShares();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const stopOnionShare = async () => {
    setBusy(true);
    setError(null);
    try {
      await transferFacade.stopOnionShare();
      setOnionRunning(false);
      setOnionAddress(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  };

  return {
    shares,
    activeDownloads,
    completedDownloads,
    onionRunning,
    onionAddress,
    error,
    busy,
    refreshShares,
    refreshAll,
    addShare,
    removeShare,
    downloadLink,
    startOnionShare,
    stopOnionShare,
  };
}
