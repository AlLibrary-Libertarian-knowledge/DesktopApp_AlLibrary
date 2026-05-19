import { listen } from '@tauri-apps/api/event';
import {
  onionShareFetch,
  onionShareAddFile,
  type OnionShareFetchDonePayload,
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
        JSON.stringify(this.completed.slice(0, 50)) // Limit to last 50
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

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Initial call
    listener([...this.active], [...this.completed]);

    // Setup global listener once
    if (!this.initialized) {
      this.initialized = true;
      void listen<OnionShareFetchDonePayload>('onion-share-fetch-done', e => {
        const p = e.payload;
        this.handleFetchDone(p);
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

      // Automatically add to local shares (seeding) if download was successful
      if (payload.ok && payload.path) {
        const filePath = payload.path;
        void onionShareAddFile(filePath)
          .then(() => {
            console.log(`Auto-seeding started for downloaded file: ${filePath}`);
            try {
              const data = globalThis.localStorage?.getItem('allibrary_shared_paths');
              const paths: string[] = data ? JSON.parse(data) : [];
              if (!paths.includes(filePath)) {
                paths.push(filePath);
                globalThis.localStorage?.setItem('allibrary_shared_paths', JSON.stringify(paths));
              }
            } catch (err) {
              console.error('Failed to save auto-seeded file to shared paths:', err);
            }
          })
          .catch(err => {
            console.error('Failed to auto-seed completed download:', err);
          });
      }
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
      progress: 0.1, // Show initial progress
      timestamp: Date.now(),
    };

    this.active.push(newItem);
    this.notify();

    // Spawn an interval to simulate minor progress steps (since Tor download is slow and we don't have block-level events)
    const interval = setInterval(() => {
      const current = this.active.find(item => item.link === link);
      if (current && current.progress < 0.9) {
        current.progress = parseFloat((current.progress + 0.05).toFixed(2));
        this.notify();
      } else {
        clearInterval(interval);
      }
    }, 4000);

    try {
      const path = await onionShareFetch(link, outDir);
      clearInterval(interval);
      return path;
    } catch (err) {
      clearInterval(interval);
      // Remove from active if it failed immediately before emitting event
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
