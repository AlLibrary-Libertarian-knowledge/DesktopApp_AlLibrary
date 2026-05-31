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

  it('calls transferFacade.downloadLink when download clicked', async () => {
    render(() => (
      <NetworkFileCard
        contentHash="hash"
        name="Doc.pdf"
        link="http://example.onion/file"
        canDownload
      />
    ));
    fireEvent.click(screen.getByRole('button', { name: /Download/i }));
    await waitFor(() => {
      expect(transferFacade.downloadLink).toHaveBeenCalledWith(
        'http://example.onion/file',
        'Doc.pdf'
      );
    });
  });

  it('uses hash fallback when link is empty', async () => {
    render(() => <NetworkFileCard contentHash="content-hash-123" name="Doc.pdf" canDownload />);
    fireEvent.click(screen.getByRole('button', { name: /Download/i }));
    await waitFor(() => {
      expect(transferFacade.downloadByHashOrLink).toHaveBeenCalledWith(
        'content-hash-123',
        'Doc.pdf'
      );
    });
  });
});
