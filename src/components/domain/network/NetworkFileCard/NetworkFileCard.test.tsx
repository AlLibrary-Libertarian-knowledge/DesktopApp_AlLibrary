import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { NetworkFileCard } from './NetworkFileCard';

vi.mock('@/services/network/transferFacade', () => ({
  transferFacade: {
    downloadLink: vi.fn().mockResolvedValue('/downloads/file.pdf'),
    downloadByHashOrLink: vi.fn().mockResolvedValue('/downloads/file.pdf'),
  },
}));

import { transferFacade } from '@/services/network/transferFacade';

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

  it('calls transferFacade.downloadByHashOrLink when download clicked (swarm-first)', async () => {
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
      expect(transferFacade.downloadByHashOrLink).toHaveBeenCalledWith(
        'content-hash-123',
        'Doc.pdf'
      );
    });
    expect(transferFacade.downloadLink).not.toHaveBeenCalled();
  });

  it('shows inline progress when downloadProgress is set', () => {
    render(() => (
      <NetworkFileCard
        contentHash="hash"
        name="Doc.pdf"
        peerCount={1}
        downloadProgress={0.42}
        canDownload
      />
    ));
    expect(screen.getByText('42%')).toBeInTheDocument();
  });
});
