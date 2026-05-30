import { invoke } from '@tauri-apps/api/core';
import { documentService, type DocumentDetailModel } from '@/services/documentService';

export interface FavoriteToggleResult {
  success: boolean;
  isFavorite: boolean;
}

export interface FavoriteEntry {
  documentId: string;
  createdAt: string;
}

export interface FavoriteDocument {
  id: string;
  favoriteDate: Date;
  resolved: DocumentDetailModel | null;
}

class FavoriteServiceImpl {
  private storageKey = 'allibrary_favorites';

  private readLocal(): Set<string> {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set<string>();
    }
  }

  private writeLocal(set: Set<string>): void {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  }

  async isFavorite(documentId: string): Promise<boolean> {
    try {
      const result = await invoke<boolean>('is_favorite', { documentId });
      return !!result;
    } catch {
      const set = this.readLocal();
      return set.has(documentId);
    }
  }

  async toggleFavorite(documentId: string): Promise<FavoriteToggleResult> {
    try {
      const result = await invoke<{ success: boolean; isFavorite: boolean }>('toggle_favorite', {
        documentId,
      });
      return { success: !!result.success, isFavorite: !!result.isFavorite };
    } catch {
      const set = this.readLocal();
      if (set.has(documentId)) {
        set.delete(documentId);
        this.writeLocal(set);
        return { success: true, isFavorite: false };
      }
      set.add(documentId);
      this.writeLocal(set);
      return { success: true, isFavorite: true };
    }
  }

  async listFavoriteEntries(limit?: number): Promise<FavoriteEntry[]> {
    try {
      const result = await invoke<FavoriteEntry[]>('list_favorites', { limit: limit ?? null });
      if (!Array.isArray(result)) return [];
      return result.map(entry => ({
        documentId: entry.documentId,
        createdAt: entry.createdAt,
      }));
    } catch {
      const ids = Array.from(this.readLocal());
      return ids.map(documentId => ({
        documentId,
        createdAt: new Date().toISOString(),
      }));
    }
  }

  async listFavorites(): Promise<string[]> {
    const entries = await this.listFavoriteEntries();
    return entries.map(entry => entry.documentId);
  }

  async loadFavoriteDocuments(): Promise<FavoriteDocument[]> {
    const entries = await this.listFavoriteEntries();
    const resolved = await Promise.all(
      entries.map(async entry => {
        const doc = await documentService.resolveDocumentById(entry.documentId);
        return {
          id: entry.documentId,
          favoriteDate: new Date(entry.createdAt),
          resolved: doc,
        };
      })
    );
    return resolved;
  }

  async getFavoriteCount(documentId: string): Promise<number> {
    try {
      const result = await invoke<{ count: number }>('get_favorite_count', { documentId });
      return result.count ?? 0;
    } catch {
      return (await this.isFavorite(documentId)) ? 1 : 0;
    }
  }
}

export const favoriteService = new FavoriteServiceImpl();
