import { type Component, For, Show, onCleanup, onMount } from 'solid-js';
import { X } from 'lucide-solid';
import { useToast, type ToastState } from '@/hooks/ui/useToast';
import type { DownloadOutcomeDetail } from '@/services/network/downloadManager';
import styles from './ToastHost.module.css';

function toastClass(type: ToastState['type']): string {
  switch (type) {
    case 'success':
      return styles.success ?? '';
    case 'error':
      return styles.error ?? '';
    case 'warning':
      return styles.warning ?? '';
    case 'cultural':
    case 'educational':
    case 'info':
    default:
      return styles.info ?? '';
  }
}

export const ToastHost: Component = () => {
  const toast = useToast();

  onMount(() => {
    const onOutcome = (event: Event) => {
      const detail = (event as CustomEvent<DownloadOutcomeDetail>).detail;
      if (!detail?.name) return;
      if (detail.ok) {
        toast.success(`"${detail.name}" is ready in your library.`, {
          title: 'Download complete',
          duration: 8000,
        });
      } else {
        const msg = detail.error ?? 'Download failed';
        toast.error(msg.length > 120 ? `${msg.slice(0, 117)}…` : msg, {
          title: `Could not download "${detail.name}"`,
          duration: 12000,
        });
      }
    };
    window.addEventListener('allibrary-download-outcome', onOutcome);
    onCleanup(() => window.removeEventListener('allibrary-download-outcome', onOutcome));
  });

  return (
    <div class={styles.host} aria-live="polite" aria-relevant="additions">
      <For each={toast.toasts()}>
        {item => (
          <div class={`${styles.toast} ${toastClass(item.type)}`} role="status">
            <div class={styles.body}>
              <Show when={item.title}>
                <strong class={styles.title}>{item.title}</strong>
              </Show>
              <p class={styles.message}>{item.message}</p>
              <Show when={item.actionLabel && item.onAction}>
                <button type="button" class={styles.action} onClick={() => item.onAction?.()}>
                  {item.actionLabel}
                </button>
              </Show>
            </div>
            <Show when={item.closable}>
              <button
                type="button"
                class={styles.dismiss}
                aria-label="Dismiss notification"
                onClick={() => toast.dismiss(item.id)}
              >
                <X size={14} />
              </button>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
};

export default ToastHost;
