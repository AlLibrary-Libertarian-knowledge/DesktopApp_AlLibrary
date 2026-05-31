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
        swarmLink: 'opocswarm://swarm/hash-abc#dHJhY2tlcg',
        contentHash: 'hash-abc',
        peerCount: 2,
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

  it('resolveDownloadLink resolves hash to swarm link when preferSwarm', async () => {
    invokeMock.mockImplementation(async (cmd: string, args?: { input?: string }) => {
      if (cmd === 'resolve_download_link' && args?.input === 'hash-abc') {
        return {
          link: 'opocswarm://swarm/hash-abc#dHJhY2tlcg',
          linkKind: 'swarm',
          contentHash: 'hash-abc',
          peerCount: 2,
          available: true,
          peers: [],
        };
      }
      return null;
    });

    const { transferFacade } = await import('../transferFacade');
    const resolved = await transferFacade.resolveDownloadLinkFull('hash-abc', true);
    expect(resolved.linkKind).toBe('swarm');
    expect(resolved.link).toContain('opocswarm://');
    expect(resolved.available).toBe(true);
  });

  it('downloadByHashOrLink fails fast when no peers available', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'resolve_download_link') {
        return {
          link: '',
          linkKind: 'direct',
          contentHash: 'deadbeef',
          peerCount: 0,
          available: false,
          peers: [],
        };
      }
      if (cmd === 'onion_share_status') {
        return { running: true, onion: 'other.onion', localPort: 17600 };
      }
      return null;
    });

    const { transferFacade } = await import('../transferFacade');
    await expect(transferFacade.downloadByHashOrLink('deadbeef', 'missing.pdf')).rejects.toThrow(
      /no online peers/i
    );
    expect(startDownloadMock).not.toHaveBeenCalled();
  });

  it('looksLikeDownloadLink accepts opocswarm links via resolve pass-through', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'onion_share_status') {
        return { running: true, onion: 'other.onion', localPort: 17600 };
      }
      return null;
    });

    const { transferFacade } = await import('../transferFacade');
    const swarm = 'opocswarm://swarm/abc123#dHJhY2tlcg';
    await transferFacade.downloadLink(swarm, 'swarm.pdf');
    expect(startDownloadMock).toHaveBeenCalledWith(swarm, 'swarm.pdf', '/home/user/downloads');
  });

  it('resolveDownloadLink resolves hash from cached search fallback', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'resolve_download_link') {
        throw new Error('not in tauri test');
      }
      if (cmd === 'search_network_cached') {
        return [
          {
            name: 'cached.pdf',
            link: 'http://peer.onion/f/cached',
            content_hash: 'hash-abc',
            peer_count: 1,
            swarm_link: 'opocswarm://swarm/hash-abc#dHJhY2tlcg',
            peers: [],
          },
        ];
      }
      return null;
    });

    const { transferFacade } = await import('../transferFacade');
    const link = await transferFacade.resolveDownloadLink('hash-abc');
    expect(link).toContain('opocswarm://');
  });
});
