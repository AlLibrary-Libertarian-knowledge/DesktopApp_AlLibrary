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
      title: 'Added to downloads',
      message: `"${fileName}" was added to your download queue. Track progress in Sharing & downloads.`,
      duration: 8000,
      actionLabel: 'View queue',
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

export async function enqueueDownloadWithToast(
  fileName: string,
  enqueue: () => Promise<string>,
  toast: Pick<ToastActions, 'show' | 'error'>
): Promise<string> {
  let id = '';
  await downloadWithToast(
    fileName,
    async () => {
      id = await enqueue();
    },
    toast
  );
  return id;
}
