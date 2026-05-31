/**
 * Unified transfer/share facade — downloads, local shares, onion status.
 */

import { invoke } from '@tauri-apps/api/core';
import { settingsService } from '@/services/storage/settingsService';
import { downloadManager, type DownloadItem } from './downloadManager';
import { networkFacade } from './networkFacade';
import {
  onionShareAddFile,
  onionShareListLocal,
  onionShareRemoveFile,
  onionShareStart,
  onionShareStatus,
  onionShareStop,
  type LocalShareEntry,
} from './onionShareService';

export interface ShareEntryView {
  fileId: string;
  name: string;
  size: number;
  contentHash: string;
  link: string;
  diskPath?: string;
}

export interface TransferView {
  id: string;
  direction: 'inbound' | 'outbound';
  name: string;
  status: 'active' | 'queued' | 'completed' | 'failed' | 'seeding';
  progress: number;
  link?: string;
  localPath?: string;
  error?: string;
}

interface CachedFileWire {
  name: string;
  link: string;
  content_hash: string;
}

function looksLikeDownloadLink(value: string): boolean {
  const v = value.trim();
  return v.startsWith('http://') || v.startsWith('https://') || v.includes('.onion');
}

function mapShare(entry: LocalShareEntry): ShareEntryView {
  return {
    fileId: entry.fileId,
    name: entry.name,
    size: entry.size,
    contentHash: entry.contentHash,
    link: entry.link,
    diskPath: entry.diskPath,
  };
}

function mapDownloadItem(item: DownloadItem): TransferView {
  return {
    id: item.id,
    direction: 'inbound',
    name: item.name,
    status: item.status === 'active' ? 'active' : item.status,
    progress: item.progress,
    link: item.link,
    error: item.error,
  };
}

async function resolveOutputDir(outDir?: string): Promise<string> {
  if (outDir?.trim()) return outDir.trim();
  return (
    (await settingsService.getDownloadFolder()) || (await settingsService.getProjectFolder()) || '.'
  );
}

export async function resolveDownloadLink(contentHashOrLink: string): Promise<string | null> {
  const value = contentHashOrLink.trim();
  if (!value) return null;
  if (looksLikeDownloadLink(value)) return value;

  const fromLobby = (await networkFacade.searchFiles('')).find(
    f => f.contentHash === value || f.link === value
  );
  if (fromLobby?.link) return fromLobby.link;

  try {
    const cached = await invoke<CachedFileWire[]>('search_network_cached', {
      query: value,
      limit: 10,
    });
    const hit = cached.find(f => f.content_hash === value);
    return hit?.link ?? null;
  } catch {
    return null;
  }
}

export const transferFacade = {
  async getOnionStatus(): Promise<{ running: boolean; onion: string | null }> {
    const st = await onionShareStatus();
    return { running: st.running, onion: st.onion };
  },

  async startOnionShare(): Promise<{ onion: string }> {
    const res = await onionShareStart();
    return { onion: res.onion };
  },

  async stopOnionShare(): Promise<void> {
    await onionShareStop();
  },

  async listShares(): Promise<ShareEntryView[]> {
    const entries = await onionShareListLocal();
    return entries.map(mapShare);
  },

  async addShare(path: string): Promise<ShareEntryView> {
    const res = await onionShareAddFile(path);
    return {
      fileId: res.fileId,
      name: res.fileName,
      size: res.fileSize,
      contentHash: res.contentHash,
      link: res.link,
      diskPath: path,
    };
  },

  async removeShare(fileId: string): Promise<void> {
    await onionShareRemoveFile(fileId);
  },

  async downloadLink(link: string, fileName: string, outDir?: string): Promise<string> {
    const trimmedLink = link.trim();
    if (!trimmedLink) {
      throw new Error('File download link is empty or missing.');
    }

    const status = await onionShareStatus();
    if (!status.running) {
      throw new Error(
        'Tor onion sharing service is not running. Start it from Sharing & Downloads first.'
      );
    }

    if (status.onion && trimmedLink.includes(status.onion)) {
      throw new Error(
        'You are already sharing this file locally. The Tor network cannot download from yourself without creating a circuit loop.'
      );
    }

    const targetDir = await resolveOutputDir(outDir);
    return downloadManager.startDownload(trimmedLink, fileName, targetDir);
  },

  async downloadByHashOrLink(
    contentHashOrLink: string,
    fileName: string,
    outDir?: string
  ): Promise<string> {
    const link = await resolveDownloadLink(contentHashOrLink);
    if (!link) {
      throw new Error(`No network file found for hash or link: ${contentHashOrLink}`);
    }
    return this.downloadLink(link, fileName, outDir);
  },

  listTransfers(): { active: TransferView[]; completed: TransferView[] } {
    return {
      active: downloadManager.getActive().map(mapDownloadItem),
      completed: downloadManager.getCompleted().map(mapDownloadItem),
    };
  },

  subscribeTransfers(
    listener: (active: TransferView[], completed: TransferView[]) => void
  ): () => void {
    return downloadManager.subscribe((active, completed) => {
      listener(active.map(mapDownloadItem), completed.map(mapDownloadItem));
    });
  },

  resolveDownloadLink,
};
