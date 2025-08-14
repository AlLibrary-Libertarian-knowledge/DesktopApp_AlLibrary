import { invoke } from '@tauri-apps/api/core';

export interface FavoriteToggleResult {
  success: boolean;
  isFavorite: boolean;
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

  async listFavorites(): Promise<string[]> {
    try {
      const result = await invoke<{ documentIds: string[] }>('list_favorites');
      return result.documentIds || [];
    } catch {
      return Array.from(this.readLocal());
    }
  }

  async getFavoriteCount(documentId: string): Promise<number> {
    try {
      const result = await invoke<{ count: number }>('get_favorite_count', { documentId });
      return result.count ?? 0;
    } catch {
      // Local fallback cannot know others' favorites; use 0/1 based on local state
      return (await this.isFavorite(documentId)) ? 1 : 0;
    }
  }
}

export const favoriteService = new FavoriteServiceImpl();




