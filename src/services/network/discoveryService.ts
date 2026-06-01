import { invoke } from '@tauri-apps/api/core';

export interface BrowseCategory {
  id: string;
  name: string;
  documentCount: number;
  source: 'local' | 'network';
}

export interface NetworkFileRow {
  name: string;
  size: number;
  link: string;
  content_hash: string;
  peer_count: number;
  peers: Array<{
    node_id: string;
    onion: string;
    file_id: string;
    link: string;
  }>;
}

export interface LocalDocumentRow {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  localPath?: string;
  contentHash?: string;
  isTreated: boolean;
  createdAt: string;
}

export interface RecentItem {
  id: string;
  title: string;
  fileSize: number;
  createdAt: string;
  source: 'local' | 'network';
  link?: string;
  contentHash?: string;
}

async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
    return [] as unknown as T;
  }
  return invoke<T>(cmd, args);
}

export async function listBrowseCategories(): Promise<BrowseCategory[]> {
  const rows =
    await safeInvoke<Array<{ id: string; name: string; documentCount: number; source: string }>>(
      'list_browse_categories'
    );
  return (rows ?? []).map(r => ({
    id: r.id,
    name: r.name,
    documentCount: r.documentCount,
    source: r.source === 'network' ? 'network' : 'local',
  }));
}

export async function listTrendingNetworkFiles(limit = 50): Promise<NetworkFileRow[]> {
  return safeInvoke<NetworkFileRow[]>('list_trending_network_files', { limit });
}

export async function listRecentNetworkFiles(
  sinceDays = 7,
  limit = 100
): Promise<NetworkFileRow[]> {
  return safeInvoke<NetworkFileRow[]>('list_recent_network_files', { sinceDays, limit });
}

export async function listRecentLocalDocuments(
  sinceDays = 7,
  limit = 100
): Promise<LocalDocumentRow[]> {
  const rows = await safeInvoke<
    Array<{
      id: string;
      title: string;
      fileType: string;
      fileSize: number;
      localPath?: string;
      contentHash?: string;
      isTreated: boolean;
      createdAt: string;
    }>
  >('list_recent_local_documents', { sinceDays, limit });
  return (rows ?? []).map(r => ({
    id: r.id,
    title: r.title,
    fileType: r.fileType,
    fileSize: r.fileSize,
    localPath: r.localPath,
    contentHash: r.contentHash,
    isTreated: r.isTreated,
    createdAt: r.createdAt,
  }));
}

export function timeFilterToSinceDays(filter: string): number {
  switch (filter) {
    case 'today':
      return 1;
    case 'yesterday':
      return 2;
    case 'last-week':
      return 7;
    case 'last-month':
      return 30;
    case 'last-3-months':
      return 90;
    case 'last-6-months':
      return 180;
    case 'last-year':
      return 365;
    default:
      return 7;
  }
}

export async function listRecentItems(sinceDays: number, limit = 100): Promise<RecentItem[]> {
  const [network, local] = await Promise.all([
    listRecentNetworkFiles(sinceDays, limit),
    listRecentLocalDocuments(sinceDays, limit),
  ]);

  const merged: RecentItem[] = [
    ...network.map(f => ({
      id: f.content_hash,
      title: f.name,
      fileSize: f.size,
      createdAt: new Date().toISOString(),
      source: 'network' as const,
      link: f.link,
      contentHash: f.content_hash,
    })),
    ...local.map(d => ({
      id: d.id,
      title: d.title,
      fileSize: d.fileSize,
      createdAt: d.createdAt,
      source: 'local' as const,
      contentHash: d.contentHash,
    })),
  ];

  merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return merged.slice(0, limit);
}
