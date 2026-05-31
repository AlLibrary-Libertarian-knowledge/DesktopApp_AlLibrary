import { transferFacade } from '@/services/network/transferFacade';
import type { ToastActions } from '@/hooks/ui/useToast';

export async function downloadWithToast(
  fileName: string,
  startDownload: () => Promise<unknown>,
  toast: Pick<ToastActions, 'show' | 'error'>
): Promise<void> {
  try {
    await startDownload();
    toast.show({
      type: 'success',
      title: 'Download started',
      message: `"${fileName}" is downloading. Track progress in Sharing & downloads.`,
      duration: 8000,
      actionLabel: 'Open transfers',
      onAction: () => {
        if (window.location.pathname !== '/transfers') {
          window.history.pushState({}, '', '/transfers');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    toast.error(msg);
    throw e;
  }
}

export async function downloadNetworkFileWithToast(
  linkOrHash: string,
  fileName: string,
  toast: Pick<ToastActions, 'show' | 'error'>,
  outDir?: string
): Promise<string> {
  let result = '';
  await downloadWithToast(
    fileName,
    async () => {
      result = await transferFacade.downloadByHashOrLink(linkOrHash, fileName, outDir);
    },
    toast
  );
  return result;
}
