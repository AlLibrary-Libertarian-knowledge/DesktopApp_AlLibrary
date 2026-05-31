import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRoot } from 'solid-js';

const listSharesMock = vi.fn(async () => [
  {
    fileId: 'f1',
    name: 'doc.pdf',
    size: 100,
    contentHash: 'abc',
    link: 'http://x.onion/f/1',
  },
]);

const subscribeTransfersMock = vi.fn(
  (listener: (active: unknown[], completed: unknown[]) => void) => {
    listener(
      [{ id: 'd1', direction: 'inbound', name: 'a.pdf', status: 'active', progress: 0.5 }],
      []
    );
    return () => {};
  }
);

vi.mock('@/services/network/transferFacade', () => ({
  transferFacade: {
    listShares: () => listSharesMock(),
    listTransfers: vi.fn(() => ({ active: [], completed: [] })),
    subscribeTransfers: subscribeTransfersMock,
    getOnionStatus: vi.fn(async () => ({ running: true, onion: 'test.onion' })),
    addShare: vi.fn(),
    removeShare: vi.fn(),
    downloadLink: vi.fn(),
    downloadByHashOrLink: vi.fn(async () => 'dl-1'),
    startOnionShare: vi.fn(),
    stopOnionShare: vi.fn(),
  },
}));

describe('useTransferState', () => {
  beforeEach(() => {
    listSharesMock.mockClear();
    subscribeTransfersMock.mockClear();
    globalThis.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    } as unknown as Storage;
  });

  it('loads shares and subscribes to transfers on mount', async () => {
    const { useTransferState } = await import('../useTransferState');

    await new Promise<void>(resolve => {
      createRoot(dispose => {
        const state = useTransferState();
        globalThis.setTimeout(() => {
          expect(subscribeTransfersMock).toHaveBeenCalled();
          expect(listSharesMock).toHaveBeenCalled();
          expect(state.shares()).toHaveLength(1);
          expect(state.onionRunning()).toBe(true);
          expect(state.canDownload()).toBe(true);
          expect(state.activeCount()).toBe(1);
          expect(state.hasActiveDownloads()).toBe(true);
          dispose();
          resolve();
        }, 0);
      });
    });
  });

  it('startDownload delegates to transferFacade.downloadByHashOrLink', async () => {
    const { transferFacade } = await import('@/services/network/transferFacade');
    const { useTransferState } = await import('../useTransferState');

    await new Promise<void>(resolve => {
      createRoot(async dispose => {
        const state = useTransferState();
        await state.startDownload('hash-abc', 'file.pdf');
        expect(transferFacade.downloadByHashOrLink).toHaveBeenCalledWith(
          'hash-abc',
          'file.pdf',
          undefined
        );
        dispose();
        resolve();
      });
    });
  });
});
