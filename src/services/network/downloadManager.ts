import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  listenTransferProgress,
  onionShareFetch,
  type OnionShareFetchDonePayload,
  type TransferProgressPayload,
} from './onionShareService';

export type DownloadItemStatus = 'queued' | 'resolving' | 'active' | 'completed' | 'failed';

export interface DownloadItem {
  id: string;
  link: string;
  sourceInput: string;
  name: string;
  outDir: string;
  status: DownloadItemStatus;
  progress: number;
  sizeBytes?: number;
  error?: string;
  timestamp: number;
}

type Listener = (active: DownloadItem[], completed: DownloadItem[]) => void;

export type DownloadOutcomeDetail = {
  name: string;
  ok: boolean;
  error?: string;
  path?: string;
};

function emitDownloadOutcome(detail: DownloadOutcomeDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('allibrary-download-outcome', { detail }));
}

interface TransferRow {
  id: string;
  link: string;
  name?: string;
  status: string;
  progress: number;
  bytesMoved: number;
  localPath?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

async function loadCompletedFromDb(): Promise<DownloadItem[]> {
  if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
    return [];
  }
  try {
    const rows = await invoke<TransferRow[]>('list_recent_transfers', { limit: 50 });
    return (rows ?? [])
      .filter(r => r.status === 'completed' || r.status === 'failed')
      .map(r => ({
        id: r.id,
        link: r.link,
        sourceInput: r.link,
        name: r.name?.trim() || r.link,
        outDir: r.localPath ?? '',
        status: r.status === 'completed' ? 'completed' : 'failed',
        progress: r.progress,
        sizeBytes: r.bytesMoved,
        error: r.error,
        timestamp: new Date(r.completedAt ?? r.startedAt).getTime(),
      }));
  } catch (e) {
    console.error('Failed to load transfers from SQLite:', e);
    return [];
  }
}

class DownloadManager {
  private active: DownloadItem[] = [];
  private completed: DownloadItem[] = [];
  private listeners: Set<Listener> = new Set();
  private initialized = false;

  constructor() {
    void this.hydrateCompleted();
  }

  private async hydrateCompleted() {
    this.completed = await loadCompletedFromDb();
    this.notify();
    try {
      globalThis.localStorage?.removeItem('allibrary_completed_downloads');
    } catch {
      // ignore
    }
  }

  private notify() {
    for (const listener of this.listeners) {
      listener([...this.active], [...this.completed]);
    }
  }

  private findActiveIndex(id: string): number {
    return this.active.findIndex(item => item.id === id);
  }

  private handleProgress(payload: TransferProgressPayload) {
    const item =
      this.active.find(i => i.id === payload.id) ??
      this.active.find(i => i.link === payload.link) ??
      this.active.find(i => i.sourceInput === payload.link);
    if (!item) return;
    item.progress = Math.min(1, Math.max(0, payload.progress));
    if (payload.bytesMoved != null) {
      item.sizeBytes = payload.bytesMoved;
    }
    if (item.status === 'queued' || item.status === 'resolving') {
      item.status = 'active';
    }
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener([...this.active], [...this.completed]);

    if (!this.initialized) {
      this.initialized = true;
      void listen<OnionShareFetchDonePayload>('onion-share-fetch-done', e => {
        this.handleFetchDone(e.payload);
      });
      void listenTransferProgress(payload => {
        this.handleProgress(payload);
      });
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  private async refreshCompletedFromDb() {
    this.completed = await loadCompletedFromDb();
    this.notify();
  }

  private handleFetchDone(payload: OnionShareFetchDonePayload) {
    const idx = this.active.findIndex(
      item =>
        item.id === payload.transferId ||
        item.link === payload.link ||
        (payload.transferId != null && item.id === payload.transferId)
    );
    const item = idx !== -1 ? this.active[idx] : undefined;
    if (idx !== -1) {
      this.active.splice(idx, 1);
    }
    void this.refreshCompletedFromDb().then(() => {
      if (item) {
        emitDownloadOutcome({
          name: item.name,
          ok: payload.ok,
          error: payload.error,
          path: payload.path,
        });
      }
    });
  }

  public getById(id: string): DownloadItem | undefined {
    return this.active.find(item => item.id === id);
  }

  public enqueueDownload(name: string, linkOrHash: string, outDir: string): string {
    const input = linkOrHash.trim();
    const existing = this.active.find(
      item =>
        item.sourceInput === input ||
        item.link === input ||
        (item.name === name && item.status !== 'failed')
    );
    if (existing) {
      return existing.id;
    }

    const id = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newItem: DownloadItem = {
      id,
      link: input,
      sourceInput: input,
      name,
      outDir,
      status: 'queued',
      progress: 0,
      timestamp: Date.now(),
    };

    this.active.push(newItem);
    this.notify();
    return id;
  }

  public updateItem(
    id: string,
    patch: Partial<Pick<DownloadItem, 'link' | 'status' | 'progress' | 'error' | 'sizeBytes'>>
  ): void {
    const item = this.getById(id);
    if (!item) return;
    Object.assign(item, patch);
    this.notify();
  }

  public removeActive(id: string): void {
    const idx = this.findActiveIndex(id);
    if (idx !== -1) {
      this.active.splice(idx, 1);
      this.notify();
    }
  }

  public failActive(id: string, error: string): void {
    const idx = this.findActiveIndex(id);
    if (idx === -1) return;
    const item = this.active[idx]!;
    const failed: DownloadItem = {
      ...item,
      status: 'failed',
      error,
      progress: item.progress,
    };
    this.active.splice(idx, 1);
    this.completed = [failed, ...this.completed.filter(c => c.id !== id)];
    this.notify();
    emitDownloadOutcome({ name: failed.name, ok: false, error });
    void this.refreshCompletedFromDb();
  }

  public async executeFetch(id: string): Promise<string> {
    const item = this.getById(id);
    if (!item) {
      throw new Error('Download not found in queue.');
    }

    const link = item.link.trim();
    if (!link) {
      throw new Error('Download link is empty.');
    }

    item.status = 'active';
    item.progress = 0;
    this.notify();

    try {
      const path = await onionShareFetch(link, item.outDir, item.name, id);
      return path;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.failActive(id, msg);
      throw err;
    }
  }

  /** Legacy blocking path: enqueue + caller must run pipeline separately. */
  public async startDownload(link: string, name: string, outDir: string): Promise<string> {
    const id = this.enqueueDownload(name, link, outDir);
    this.updateItem(id, { link, status: 'active' });
    return this.executeFetch(id);
  }

  public getActive(): DownloadItem[] {
    return [...this.active];
  }

  public getCompleted(): DownloadItem[] {
    return [...this.completed];
  }

  public clearCompleted() {
    this.completed = [];
    this.notify();
  }
}

export const downloadManager = new DownloadManager();
