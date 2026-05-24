import { describe, expect, it, vi, beforeEach } from 'vitest';

const invokeMock = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(async () => () => {}),
}));

describe('networkFacade', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    (globalThis as any).window = { __TAURI_INTERNALS__: {} };
  });

  it('searchFiles filters by query from cached search when onion is offline', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'onion_share_status') {
        return { running: false, onion: null, localPort: null };
      }
      if (cmd === 'search_network_cached') {
        return [
          {
            name: 'report.pdf',
            size: 100,
            link: 'http://x.onion/f/1',
            content_hash: 'abc',
            peer_count: 1,
            peers: [],
          },
          {
            name: 'notes.txt',
            size: 50,
            link: 'http://x.onion/f/2',
            content_hash: 'def',
            peer_count: 1,
            peers: [],
          },
        ];
      }
      return null;
    });

    const { networkFacade } = await import('../networkFacade');
    const hits = await networkFacade.searchFiles('pdf');
    expect(hits).toHaveLength(1);
    expect(hits[0]?.name).toBe('report.pdf');
  });

  it('refreshLobby returns cached lobby with syncError when refresh fails', async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === 'tracker_refresh_lobby') {
        throw new Error('tracker down');
      }
      if (cmd === 'tracker_get_cached_lobby_cmd') {
        return { online_nodes: 2, files: [] };
      }
      if (cmd === 'tracker_get_last_sync_diag') {
        return { ok: false, atEpochMs: 1 };
      }
      return null;
    });

    const { networkFacade } = await import('../networkFacade');
    const lobby = await networkFacade.refreshLobby();
    expect(lobby.onlineNodes).toBe(2);
    expect(lobby.syncError).toContain('tracker down');
  });
});
