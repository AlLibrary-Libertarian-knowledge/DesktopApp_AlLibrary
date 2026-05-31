import { describe, expect, it, vi, beforeEach } from 'vitest';

const invokeMock = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock('@/services/storage/settingsService', () => ({
  settingsService: {
    getDownloadFolder: vi.fn(async () => '/home/user/downloads'),
    getProjectFolder: vi.fn(async () => '/home/user/project'),
  },
}));

const startDownloadMock = vi.fn(async (_link: string, _name: string, _outDir: string) => 'dl-1');

vi.mock('../downloadManager', () => ({
  downloadManager: {
    startDownload: (link: string, name: string, outDir: string) =>
      startDownloadMock(link, name, outDir),
    getActive: vi.fn(() => []),
    getCompleted: vi.fn(() => []),
    subscribe: vi.fn(() => () => {}),
  },
}));

vi.mock('../networkFacade', () => ({
  networkFacade: {
    searchFiles: vi.fn(async () => [
      {
        name: 'cached.pdf',
        size: 100,
        link: 'http://peer.onion/f/cached',
        contentHash: 'hash-abc',
        peerCount: 1,
        peers: [],
      },
    ]),
  },
}));

describe('transferFacade', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    startDownloadMock.mockClear();
    (globalThis as any).window = { __TAURI_INTERNALS__: {} };
  });

  it('downloadLink rejects when link contains own onion address', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'onion_share_status') {
        return { running: true, onion: 'myonion123.onion', localPort: 17600 };
      }
      return null;
    });

    const { transferFacade } = await import('../transferFacade');
    await expect(
      transferFacade.downloadLink('http://myonion123.onion/f/1', 'file.pdf')
    ).rejects.toThrow(/already sharing this file locally/i);
    expect(startDownloadMock).not.toHaveBeenCalled();
  });

  it('downloadLink calls downloadManager.startDownload with resolved folder when onion is running', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'onion_share_status') {
        return { running: true, onion: 'other.onion', localPort: 17600 };
      }
      return null;
    });

    const { transferFacade } = await import('../transferFacade');
    const id = await transferFacade.downloadLink('http://peer.onion/f/1', 'report.pdf');
    expect(id).toBe('dl-1');
    expect(startDownloadMock).toHaveBeenCalledWith(
      'http://peer.onion/f/1',
      'report.pdf',
      '/home/user/downloads'
    );
  });

  it('resolveDownloadLink returns URL unchanged', async () => {
    const { transferFacade } = await import('../transferFacade');
    const link = await transferFacade.resolveDownloadLink('http://peer.onion/f/direct');
    expect(link).toBe('http://peer.onion/f/direct');
  });

  it('resolveDownloadLink resolves hash from cached search', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'search_network_cached') {
        return [
          {
            name: 'cached.pdf',
            link: 'http://peer.onion/f/cached',
            content_hash: 'hash-abc',
          },
        ];
      }
      return null;
    });

    const { transferFacade } = await import('../transferFacade');
    const link = await transferFacade.resolveDownloadLink('hash-abc');
    expect(link).toBe('http://peer.onion/f/cached');
  });
});
