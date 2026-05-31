import { describe, expect, it, vi, beforeEach } from 'vitest';

const onionShareFetchMock = vi.fn(async () => '/downloads/file.pdf');
const listenMock = vi.fn(async () => () => {});
const listenTransferProgressMock = vi.fn(() => () => {});

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => []),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: listenMock,
}));

vi.mock('../onionShareService', () => ({
  onionShareFetch: onionShareFetchMock,
  listenTransferProgress: listenTransferProgressMock,
}));

function lastCall<T>(calls: T[][]): T[] {
  const row = calls[calls.length - 1];
  if (!row) throw new Error('expected at least one listener call');
  return row;
}

describe('downloadManager', () => {
  beforeEach(() => {
    vi.resetModules();
    onionShareFetchMock.mockClear();
    listenMock.mockClear();
    listenTransferProgressMock.mockClear();
  });

  it('enqueueDownload notifies subscribers immediately with queued status', async () => {
    const { downloadManager } = await import('../downloadManager');
    const listener = vi.fn();
    downloadManager.subscribe(listener);

    const id = downloadManager.enqueueDownload('doc.pdf', 'hash-abc', '/tmp/dl');
    expect(id).toMatch(/^dl-/);
    expect(listener).toHaveBeenCalled();

    const [active] = lastCall(listener.mock.calls);
    expect(active).toHaveLength(1);
    expect(active[0]).toMatchObject({
      id,
      name: 'doc.pdf',
      sourceInput: 'hash-abc',
      status: 'queued',
      progress: 0,
    });
  });

  it('updateItem transitions status and re-notifies', async () => {
    const { downloadManager } = await import('../downloadManager');
    const listener = vi.fn();
    downloadManager.subscribe(listener);
    listener.mockClear();

    const id = downloadManager.enqueueDownload('doc.pdf', 'http://peer.onion/f/1', '/tmp/dl');
    downloadManager.updateItem(id, { status: 'resolving' });
    downloadManager.updateItem(id, { status: 'active', progress: 0.25 });

    const [active] = lastCall(listener.mock.calls);
    expect(active[0]).toMatchObject({ id, status: 'active', progress: 0.25 });
  });

  it('executeFetch invokes onionShareFetch and returns path', async () => {
    const { downloadManager } = await import('../downloadManager');
    const id = downloadManager.enqueueDownload('doc.pdf', 'http://peer.onion/f/1', '/tmp/dl');
    downloadManager.updateItem(id, { status: 'active' });

    const path = await downloadManager.executeFetch(id);
    expect(path).toBe('/downloads/file.pdf');
    expect(onionShareFetchMock).toHaveBeenCalledWith('http://peer.onion/f/1', '/tmp/dl', 'doc.pdf');
  });

  it('deduplicates enqueue by source input', async () => {
    const { downloadManager } = await import('../downloadManager');
    const id1 = downloadManager.enqueueDownload('doc.pdf', 'hash-abc', '/tmp/dl');
    const id2 = downloadManager.enqueueDownload('doc.pdf', 'hash-abc', '/tmp/dl');
    expect(id2).toBe(id1);
    expect(downloadManager.getActive()).toHaveLength(1);
  });
});
