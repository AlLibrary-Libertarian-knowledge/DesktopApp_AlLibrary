import { type Component, For, Show } from 'solid-js';
import { X } from 'lucide-solid';
import { useToast, type ToastState } from '@/hooks/ui/useToast';
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
