import { invoke } from '@tauri-apps/api/core';

export interface ShareLink {
  url: string;
  expiresAt?: string;
}

class ShareService {
  async shareViaP2P(documentId: string, peerIds?: string[]): Promise<boolean> {
    try {
      return await invoke<boolean>('share_document_p2p', { documentId, peerIds: peerIds ?? [] });
    } catch (error) {
      console.error('Failed to share via P2P:', error);
      return false;
    }
  }

  async createShareLink(documentId: string): Promise<ShareLink | null> {
    try {
      const link = await invoke<ShareLink>('create_share_link', { documentId });
      return link ?? null;
    } catch (error) {
      console.error('Failed to create share link:', error);
      return null;
    }
  }
}

export const shareService = new ShareService();




