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
  status: 'active' | 'queued' | 'resolving' | 'completed' | 'failed' | 'seeding';
  progress: number;
  link?: string;
  sourceInput?: string;
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
    status: item.status,
    progress: item.progress,
    link: item.link,
    sourceInput: item.sourceInput,
    localPath: item.outDir || undefined,
    error: item.error,
  };
}

async function assertCanDownload(resolvedLink: string): Promise<void> {
  const status = await onionShareStatus();
  if (!status.running) {
    throw new Error(
      'Tor onion sharing service is not running. Start it from Sharing & Downloads first.'
    );
  }
  if (status.onion && resolvedLink.includes(status.onion)) {
    throw new Error(
      'You are already sharing this file locally. The Tor network cannot download from yourself without creating a circuit loop.'
    );
  }
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

  async beginDownload(
    linkOrHash: string,
    fileName: string,
    outDir?: string
  ): Promise<{ id: string }> {
    const targetDir = await resolveOutputDir(outDir);
    const id = downloadManager.enqueueDownload(fileName, linkOrHash, targetDir);
    return { id };
  },

  async runDownload(id: string): Promise<string> {
    const item = downloadManager.getById(id);
    if (!item) {
      throw new Error('Download not found in queue.');
    }

    downloadManager.updateItem(id, { status: 'resolving' });

    try {
      const resolved = await resolveDownloadLinkFull(item.sourceInput || item.link, true);
      if (
        !resolved.available &&
        resolved.peerCount === 0 &&
        !looksLikeDownloadLink(resolved.link) &&
        !looksLikeDownloadLink(item.sourceInput || '')
      ) {
        throw new Error('No online peers are seeding this file.');
      }

      const trimmedLink =
        resolved.linkKind === 'swarm' && looksLikeDownloadLink(item.sourceInput || '')
          ? (item.sourceInput || resolved.link).trim()
          : resolved.link.trim();
      if (!trimmedLink) {
        throw new Error('Could not resolve a download link for this file.');
      }

      await assertCanDownload(trimmedLink);
      downloadManager.updateItem(id, { link: trimmedLink, status: 'active', progress: 0 });
      return await downloadManager.executeFetch(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      downloadManager.failActive(id, msg);
      throw err;
    }
  },

  async downloadLink(link: string, fileName: string, outDir?: string): Promise<string> {
    const { id } = await this.beginDownload(link, fileName, outDir);
    return this.runDownload(id);
  },

  async downloadByHashOrLink(
    contentHashOrLink: string,
    fileName: string,
    outDir?: string
  ): Promise<string> {
    const { id } = await this.beginDownload(contentHashOrLink, fileName, outDir);
    return this.runDownload(id);
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
      if (
        downloadManager
          .getActive()
          .some(a => a.sourceInput === link || a.link === link || a.name === item.name)
      ) {
        continue;
      }
      if (link && completedLinks.has(link)) continue;
      const { id } = await this.beginDownload(link || item.name, item.name || link, outDir);
      void this.runDownload(id);
    }
  },

  async syncAllEnabledSeeds(): Promise<number> {
    return syncAllEnabledSeeds();
  },

  async setDocumentSeedEnabled(filePath: string, enabled: boolean): Promise<DocumentInfo> {
    return invoke<DocumentInfo>('set_document_seed_enabled', { filePath, enabled });
  },
};
