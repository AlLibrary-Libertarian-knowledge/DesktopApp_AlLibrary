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
  progress: number; // 0 to 1
  sizeBytes?: number;
  error?: string;
  timestamp: number;
}

type Listener = (active: DownloadItem[], completed: DownloadItem[]) => void;

class DownloadManager {
  private active: DownloadItem[] = [];
  private completed: DownloadItem[] = [];
  private listeners: Set<Listener> = new Set();
  private initialized = false;

  constructor() {
    this.loadCompleted();
  }

  private loadCompleted() {
    try {
      const data = globalThis.localStorage?.getItem('allibrary_completed_downloads');
      if (data) {
        this.completed = JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load completed downloads:', e);
    }
  }

  private saveCompleted() {
    try {
      globalThis.localStorage?.setItem(
        'allibrary_completed_downloads',
        JSON.stringify(this.completed.slice(0, 50))
      );
    } catch (e) {
      console.error('Failed to save completed downloads:', e);
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

  private handleFetchDone(payload: OnionShareFetchDonePayload) {
    const idx = this.active.findIndex(item => item.link === payload.link);
    if (idx !== -1) {
      const item = this.active[idx];
      if (!item) return;
      this.active.splice(idx, 1);

      const completedItem: DownloadItem = {
        id: item.id,
        link: item.link,
        name: item.name,
        outDir: item.outDir,
        status: payload.ok ? 'completed' : 'failed',
        progress: 1,
        sizeBytes: item.sizeBytes,
        error: payload.error,
        timestamp: Date.now(),
      };

      this.completed.unshift(completedItem);
      this.saveCompleted();
      this.notify();
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
        const item = this.active[idx];
        if (!item) throw new Error('Download item not found in active list');
        this.active.splice(idx, 1);
        this.completed.unshift({
          id: item.id,
          link: item.link,
          name: item.name,
          outDir: item.outDir,
          status: 'failed',
          progress: 0,
          sizeBytes: item.sizeBytes,
          error: String(err instanceof Error ? err.message : err),
          timestamp: Date.now(),
        });
        this.saveCompleted();
        this.notify();
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
    this.saveCompleted();
    this.notify();
  }
}

export const downloadManager = new DownloadManager();
