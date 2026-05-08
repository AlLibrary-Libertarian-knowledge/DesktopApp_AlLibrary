export interface ShareLink {
  url: string;
  expiresAt?: string;
}

class ShareService {
  async shareViaP2P(_documentId: string, _peerIds?: string[]): Promise<boolean> {
    return false;
  }

  async createShareLink(_documentId: string): Promise<ShareLink | null> {
    return null;
  }
}

export const shareService = new ShareService();
