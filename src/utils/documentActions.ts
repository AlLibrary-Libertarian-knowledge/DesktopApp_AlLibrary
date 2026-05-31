import { transferFacade } from '@/services/network/transferFacade';
import { enableTorAndP2P } from '@/services/network/bootstrap';
import type { ToastActions } from '@/hooks/ui/useToast';

export interface ShareableDocument {
  title: string;
  filePath: string;
}

async function ensureOnionReady(): Promise<void> {
  const status = await transferFacade.getOnionStatus();
  if (status.running) return;
  await enableTorAndP2P();
  const after = await transferFacade.getOnionStatus();
  if (!after.running) {
    throw new Error(
      'Onion sharing is not running. Start it from Sharing & Downloads or Configurations.'
    );
  }
}

export async function shareWithToast(
  doc: ShareableDocument,
  toast: Pick<ToastActions, 'show'>
): Promise<{ link: string; contentHash: string; name: string }> {
  if (!doc.filePath?.trim()) {
    throw new Error('Document has no file path to share.');
  }

  await ensureOnionReady();
  const entry = await transferFacade.addShare(doc.filePath);

  toast.show({
    type: 'success',
    title: 'Shared on network',
    message: `${doc.title} is available via onion link.`,
    duration: 8000,
    actionLabel: 'Copy link',
    onAction: () => {
      void navigator.clipboard.writeText(entry.link);
    },
  });

  return { link: entry.link, contentHash: entry.contentHash, name: entry.name };
}

export async function copyNetworkLinkWithToast(
  link: string,
  title: string,
  toast: Pick<ToastActions, 'show'>
): Promise<void> {
  if (!link.trim()) {
    throw new Error('No network link available for this document.');
  }
  await navigator.clipboard.writeText(link);
  toast.show({
    type: 'success',
    title: 'Link copied',
    message: `Onion link for "${title}" copied to clipboard.`,
    duration: 5000,
  });
}
