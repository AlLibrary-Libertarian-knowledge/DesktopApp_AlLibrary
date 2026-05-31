import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  listenTransferProgress,
  onionShareFetch,
  type OnionShareFetchDonePayload,
  type TransferProgressPayload,
} from './onionShareService';

export interface DownloadItem {
  id: string;
  link: string;
  name: string;
  outDir: string;
  status: 'active' | 'queued' | 'completed' | 'failed';
  progress: number;
  sizeBytes?: number;
  error?: string;
  timestamp: number;
}

type Listener = (active: DownloadItem[], completed: DownloadItem[]) => void;

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
  private hydrated = false;

  constructor() {
    void this.hydrateCompleted();
  }

  private async hydrateCompleted() {
    this.completed = await loadCompletedFromDb();
    this.hydrated = true;
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

  private handleProgress(payload: TransferProgressPayload) {
    const item = this.active.find(i => i.link === payload.link || i.id === payload.id);
    if (!item) return;
    item.progress = Math.min(1, Math.max(0, payload.progress));
    if (payload.bytesMoved != null) {
      item.sizeBytes = payload.bytesMoved;
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
    const idx = this.active.findIndex(item => item.link === payload.link);
    if (idx !== -1) {
      this.active.splice(idx, 1);
      void this.refreshCompletedFromDb();
    }
  }

  public async startDownload(link: string, name: string, outDir: string): Promise<string> {
    const existing = this.active.find(item => item.link === link);
    if (existing) {
      throw new Error('Download is already in progress');
    }

    const newItem: DownloadItem = {
      id: `dl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      link,
      name,
      outDir,
      status: 'active',
      progress: 0,
      timestamp: Date.now(),
    };

    this.active.push(newItem);
    this.notify();

    try {
      const path = await onionShareFetch(link, outDir, name);
      return path;
    } catch (err) {
      const idx = this.active.findIndex(item => item.link === link);
      if (idx !== -1) {
        this.active.splice(idx, 1);
        void this.refreshCompletedFromDb();
      }
      throw err;
    }
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
