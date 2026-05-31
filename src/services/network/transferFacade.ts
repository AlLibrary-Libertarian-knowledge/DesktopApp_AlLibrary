/**
 * Unified transfer/share facade — downloads, local shares, onion status.
 */

import { invoke } from '@tauri-apps/api/core';
import { settingsService } from '@/services/storage/settingsService';
import { downloadManager, type DownloadItem } from './downloadManager';
import {
  onionShareAddFile,
  onionShareListLocal,
  onionShareRemoveFile,
  onionShareStart,
  onionShareStatus,
  onionShareStop,
  syncAllEnabledSeeds,
  type LocalShareEntry,
} from './onionShareService';
import type { DocumentInfo } from '@/services/documentService';

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

export interface PeerLocationView {
  nodeId: string;
  onion: string;
  fileId: string;
  link: string;
}

export interface ResolvedDownloadLink {
  link: string;
  linkKind: 'swarm' | 'direct';
  contentHash: string;
  peerCount: number;
  available: boolean;
  peers: PeerLocationView[];
}

interface CachedNetworkFileWire {
  name: string;
  size: number;
  link: string;
  content_hash: string;
  peer_count: number;
  swarm_link?: string;
  peers: Array<{
    node_id: string;
    onion: string;
    file_id: string;
    link: string;
  }>;
}

interface ResolvedDownloadLinkWire {
  link: string;
  linkKind: string;
  contentHash: string;
  peerCount: number;
  available: boolean;
  peers: Array<{
    nodeId: string;
    onion: string;
    fileId: string;
    link: string;
  }>;
}

function looksLikeDownloadLink(value: string): boolean {
  const v = value.trim();
  return (
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('opoc://') ||
    v.startsWith('opocswarm://') ||
    v.includes('.onion')
  );
}

function isLikelyContentHash(value: string): boolean {
  const v = value.trim();
  return v.length >= 32 && /^[a-fA-F0-9]+$/.test(v);
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
    localPath: item.outDir || undefined,
    error: item.error,
  };
}

function mapResolved(wire: ResolvedDownloadLinkWire): ResolvedDownloadLink {
  return {
    link: wire.link,
    linkKind: wire.linkKind === 'direct' ? 'direct' : 'swarm',
    contentHash: wire.contentHash,
    peerCount: wire.peerCount,
    available: wire.available,
    peers: wire.peers ?? [],
  };
}

async function resolveOutputDir(outDir?: string): Promise<string> {
  if (outDir?.trim()) return outDir.trim();
  return (
    (await settingsService.getDownloadFolder()) || (await settingsService.getProjectFolder()) || '.'
  );
}

async function resolveDownloadLinkFull(
  contentHashOrLink: string,
  preferSwarm = true
): Promise<ResolvedDownloadLink> {
  const value = contentHashOrLink.trim();
  if (!value) {
    throw new Error('Download input is empty.');
  }

  if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
    try {
      const wire = await invoke<ResolvedDownloadLinkWire>('resolve_download_link', {
        input: value,
        preferSwarm: preferSwarm,
      });
      return mapResolved(wire);
    } catch {
      /* fall through to legacy resolution */
    }
  }

  if (looksLikeDownloadLink(value)) {
    return {
      link: value,
      linkKind: value.startsWith('opocswarm://') ? 'swarm' : 'direct',
      contentHash: '',
      peerCount: 0,
      available: true,
      peers: [],
    };
  }

  try {
    const cached = await invoke<CachedNetworkFileWire[]>('search_network_cached', {
      query: value,
      limit: 10,
    });
    const hit = cached.find(f => f.content_hash === value);
    if (hit) {
      const link =
        preferSwarm && hit.swarm_link ? hit.swarm_link : hit.link || hit.peers?.[0]?.link || '';
      return {
        link,
        linkKind: preferSwarm && hit.swarm_link ? 'swarm' : 'direct',
        contentHash: hit.content_hash,
        peerCount: hit.peer_count ?? hit.peers?.length ?? 0,
        available: (hit.peer_count ?? hit.peers?.length ?? 0) > 0,
        peers: (hit.peers ?? []).map(p => ({
          nodeId: p.node_id,
          onion: p.onion,
          fileId: p.file_id,
          link: p.link,
        })),
      };
    }
  } catch {
    /* ignore */
  }

  throw new Error(`No network file found for hash or link: ${value}`);
}

export async function resolveDownloadLink(contentHashOrLink: string): Promise<string | null> {
  try {
    const resolved = await resolveDownloadLinkFull(contentHashOrLink, true);
    return resolved.link || null;
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

  async getPeerAvailability(contentHash: string): Promise<ResolvedDownloadLink> {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const wire = await invoke<ResolvedDownloadLinkWire>('get_swarm_availability', {
          contentHash,
        });
        return mapResolved(wire);
      } catch {
        /* fall through */
      }
    }
    return resolveDownloadLinkFull(contentHash, true);
  },

  resolveDownloadLinkFull,

  async downloadLink(link: string, fileName: string, outDir?: string): Promise<string> {
    let trimmedLink = link.trim();
    if (!trimmedLink) {
      throw new Error('File download link is empty or missing.');
    }

    if (isLikelyContentHash(trimmedLink) || !looksLikeDownloadLink(trimmedLink)) {
      const resolved = await resolveDownloadLinkFull(trimmedLink, true);
      if (!resolved.available) {
        throw new Error('No online peers are seeding this file.');
      }
      trimmedLink = resolved.link;
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
    const resolved = await resolveDownloadLinkFull(contentHashOrLink, true);
    if (!resolved.available && resolved.peerCount === 0 && !looksLikeDownloadLink(resolved.link)) {
      throw new Error('No online peers are seeding this file.');
    }
    return this.downloadLink(resolved.link, fileName, outDir);
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

  async downloadAll(items: Array<{ link: string; name: string }>, outDir?: string): Promise<void> {
    const completedLinks = new Set(downloadManager.getCompleted().map(c => c.link));
    for (const item of items) {
      const link = item.link.trim();
      if (!link && !item.name) continue;
      const key = link || item.name;
      if (downloadManager.getActive().some(a => a.link === key || a.name === item.name)) continue;
      if (link && completedLinks.has(link)) continue;
      await this.downloadByHashOrLink(link || item.name, item.name || link, outDir);
    }
  },

  async syncAllEnabledSeeds(): Promise<number> {
    return syncAllEnabledSeeds();
  },

  async setDocumentSeedEnabled(filePath: string, enabled: boolean): Promise<DocumentInfo> {
    return invoke<DocumentInfo>('set_document_seed_enabled', { filePath, enabled });
  },
};
