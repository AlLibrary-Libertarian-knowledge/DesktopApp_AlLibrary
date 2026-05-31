import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { NetworkFileCard } from './NetworkFileCard';

const { beginDownloadMock, runDownloadMock } = vi.hoisted(() => ({
  beginDownloadMock: vi.fn().mockResolvedValue({ id: 'dl-1' }),
  runDownloadMock: vi.fn().mockResolvedValue('/downloads/file.pdf'),
}));

vi.mock('@/services/network/transferFacade', () => ({
  transferFacade: {
    beginDownload: beginDownloadMock,
    runDownload: runDownloadMock,
  },
}));

describe('NetworkFileCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders file name and hash snippet', () => {
    render(() => (
      <NetworkFileCard
        contentHash="abc123def4567890abcdef"
        name="Sample Document.pdf"
        size={1024}
        link="http://example.onion/file"
      />
    ));
    expect(screen.getByText('Sample Document.pdf')).toBeInTheDocument();
    expect(screen.getByText('abc123de…abcdef')).toBeInTheDocument();
  });

  it('disables download when canDownload is false', () => {
    render(() => (
      <NetworkFileCard
        contentHash="hash"
        name="Doc.pdf"
        link="http://example.onion/file"
        canDownload={false}
      />
    ));
    expect(screen.getByRole('button', { name: /Download/i })).toBeDisabled();
  });

  it('disables download when peerCount is zero', () => {
    render(() => <NetworkFileCard contentHash="hash" name="Doc.pdf" peerCount={0} canDownload />);
    expect(screen.getByRole('button', { name: /Download/i })).toBeDisabled();
    expect(screen.getByText(/No peers online/i)).toBeInTheDocument();
  });

  it('calls beginDownload and runDownload when download clicked', async () => {
    render(() => (
      <NetworkFileCard
        contentHash="content-hash-123"
        name="Doc.pdf"
        link="http://example.onion/file"
        peerCount={2}
        canDownload
      />
    ));
    fireEvent.click(screen.getByRole('button', { name: /Download/i }));
    await waitFor(() => {
      expect(beginDownloadMock).toHaveBeenCalledWith('content-hash-123', 'Doc.pdf');
      expect(runDownloadMock).toHaveBeenCalledWith('dl-1');
    });
  });

  it('shows In queue when downloadStatus is queued', () => {
    render(() => (
      <NetworkFileCard
        contentHash="hash"
        name="Doc.pdf"
        peerCount={1}
        downloadStatus="queued"
        canDownload
      />
    ));
    expect(screen.getByRole('button', { name: /In queue/i })).toBeInTheDocument();
  });

  it('shows inline progress when downloadProgress is set', () => {
    render(() => (
      <NetworkFileCard
        contentHash="hash"
        name="Doc.pdf"
        peerCount={1}
        downloadProgress={0.42}
        downloadStatus="active"
        canDownload
      />
    ));
    expect(screen.getAllByText('42%').length).toBeGreaterThan(0);
  });
});
