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

const enqueueDownloadMock = vi.fn((_name: string, _link: string, _outDir: string) => 'dl-1');
const updateItemMock = vi.fn();
const getByIdMock = vi.fn((id: string) => ({
  id,
  link: 'http://peer.onion/f/1',
  sourceInput: 'http://peer.onion/f/1',
  name: 'report.pdf',
  outDir: '/home/user/downloads',
  status: 'queued',
  progress: 0,
  timestamp: Date.now(),
}));
const executeFetchMock = vi.fn(async (_id: string) => '/home/user/downloads/report.pdf');
const removeActiveMock = vi.fn();

const failActiveMock = vi.fn();

vi.mock('../downloadManager', () => ({
  downloadManager: {
    enqueueDownload: (name: string, link: string, outDir: string) =>
      enqueueDownloadMock(name, link, outDir),
    updateItem: (id: string, patch: unknown) => updateItemMock(id, patch),
    getById: (id: string) => getByIdMock(id),
    executeFetch: (id: string) => executeFetchMock(id),
    removeActive: (id: string) => removeActiveMock(id),
    failActive: (id: string, error: string) => failActiveMock(id, error),
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
    enqueueDownloadMock.mockClear();
    updateItemMock.mockClear();
    executeFetchMock.mockClear();
    removeActiveMock.mockClear();
    getByIdMock.mockReset();
    getByIdMock.mockImplementation((id: string) => ({
      id,
      link: 'http://peer.onion/f/1',
      sourceInput: 'http://peer.onion/f/1',
      name: 'report.pdf',
      outDir: '/home/user/downloads',
      status: 'queued',
      progress: 0,
      timestamp: Date.now(),
    }));
    (globalThis as any).window = { __TAURI_INTERNALS__: {} };
  });

  it('downloadLink rejects when link contains own onion address', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'onion_share_status') {
        return { running: true, onion: 'myonion123.onion', localPort: 17600 };
      }
      return null;
    });

    getByIdMock.mockReturnValueOnce({
      id: 'dl-1',
      link: 'http://myonion123.onion/f/1',
      sourceInput: 'http://myonion123.onion/f/1',
      name: 'file.pdf',
      outDir: '/home/user/downloads',
      status: 'queued',
      progress: 0,
      timestamp: Date.now(),
    });

    const { transferFacade } = await import('../transferFacade');
    await expect(
      transferFacade.downloadLink('http://myonion123.onion/f/1', 'file.pdf')
    ).rejects.toThrow(/already sharing this file locally/i);
    expect(executeFetchMock).not.toHaveBeenCalled();
  });

  it('downloadLink enqueues then resolves and fetches when onion is running', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'onion_share_status') {
        return { running: true, onion: 'other.onion', localPort: 17600 };
      }
      return null;
    });

    const { transferFacade } = await import('../transferFacade');
    const path = await transferFacade.downloadLink('http://peer.onion/f/1', 'report.pdf');
    expect(path).toBe('/home/user/downloads/report.pdf');
    expect(enqueueDownloadMock).toHaveBeenCalledWith(
      'report.pdf',
      'http://peer.onion/f/1',
      '/home/user/downloads'
    );
    expect(updateItemMock).toHaveBeenCalledWith('dl-1', { status: 'resolving' });
    expect(executeFetchMock).toHaveBeenCalledWith('dl-1');
  });

  it('beginDownload returns id immediately without resolving', async () => {
    const { transferFacade } = await import('../transferFacade');
    const { id } = await transferFacade.beginDownload('hash-abc', 'doc.pdf');
    expect(id).toBe('dl-1');
    expect(enqueueDownloadMock).toHaveBeenCalledWith('doc.pdf', 'hash-abc', '/home/user/downloads');
    expect(executeFetchMock).not.toHaveBeenCalled();
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

  it('runDownload fails fast when no peers available', async () => {
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

    getByIdMock.mockReturnValueOnce({
      id: 'dl-1',
      link: 'deadbeef',
      sourceInput: 'deadbeef',
      name: 'missing.pdf',
      outDir: '/home/user/downloads',
      status: 'queued',
      progress: 0,
      timestamp: Date.now(),
    });

    const { transferFacade } = await import('../transferFacade');
    await expect(transferFacade.runDownload('dl-1')).rejects.toThrow(/no online peers/i);
    expect(executeFetchMock).not.toHaveBeenCalled();
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
    expect(enqueueDownloadMock).toHaveBeenCalledWith('swarm.pdf', swarm, '/home/user/downloads');
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
