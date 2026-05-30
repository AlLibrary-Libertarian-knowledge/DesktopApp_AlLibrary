import { invoke } from '@tauri-apps/api/core';
import { documentService, type DocumentDetailModel } from '@/services/documentService';

export type ActivityKind = 'view' | 'download' | 'upload' | 'share' | 'favorite';

export type ActivityTimeframe = 'today' | 'week' | 'month' | 'all';

export interface ActivityEntry {
  id: number;
  kind: ActivityKind;
  documentId: string | null;
  payloadJson?: string | null;
  createdAt: string;
}

export interface ActivityDocument {
  entry: ActivityEntry;
  resolved: DocumentDetailModel | null;
  title: string;
}

export interface ListActivitiesOptions {
  kind?: ActivityKind | 'all';
  since?: string | null;
  limit?: number;
}

interface ActivityPayload {
  title?: string;
  link?: string;
  path?: string;
  name?: string;
}

function parsePayload(raw?: string | null): ActivityPayload {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ActivityPayload;
  } catch {
    return {};
  }
}

function entryTitle(entry: ActivityEntry, resolved: DocumentDetailModel | null): string {
  if (resolved?.title) return resolved.title;
  const payload = parsePayload(entry.payloadJson);
  if (payload.title) return payload.title;
  if (payload.name) return payload.name;
  if (entry.documentId) return entry.documentId;
  return 'Unknown document';
}

class ActivityServiceImpl {
  sinceFromTimeframe(timeframe: ActivityTimeframe): string | null {
    if (timeframe === 'all') return null;
    const now = new Date();
    let start: Date;
    if (timeframe === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeframe === 'week') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return start.toISOString().slice(0, 19).replace('T', ' ');
  }

  async logActivity(
    kind: ActivityKind,
    documentId?: string | null,
    payload?: Record<string, unknown>
  ): Promise<void> {
    try {
      const payloadJson = payload ? JSON.stringify(payload) : null;
      await invoke<number>('log_activity', {
        kind,
        documentId: documentId ?? null,
        payloadJson,
      });
    } catch {
      // fire-and-forget
    }
  }

  async listActivities(options: ListActivitiesOptions = {}): Promise<ActivityEntry[]> {
    try {
      const kind = options.kind && options.kind !== 'all' ? options.kind : null;
      const result = await invoke<ActivityEntry[]>('list_activity', {
        kind,
        since: options.since ?? null,
        limit: options.limit ?? null,
      });
      if (!Array.isArray(result)) return [];
      return result.map(row => ({
        id: row.id,
        kind: row.kind as ActivityKind,
        documentId: row.documentId ?? null,
        payloadJson: row.payloadJson ?? null,
        createdAt: row.createdAt,
      }));
    } catch {
      return [];
    }
  }

  async loadActivityDocuments(options: ListActivitiesOptions = {}): Promise<ActivityDocument[]> {
    const entries = await this.listActivities(options);
    const resolved = await Promise.all(
      entries.map(async entry => {
        const docId = entry.documentId?.trim();
        const resolvedDoc = docId ? await documentService.resolveDocumentById(docId) : null;
        return {
          entry,
          resolved: resolvedDoc,
          title: entryTitle(entry, resolvedDoc),
        };
      })
    );
    return resolved;
  }

  async deleteActivity(id: number): Promise<void> {
    await invoke('delete_activity', { id });
  }
}

export const activityService = new ActivityServiceImpl();
