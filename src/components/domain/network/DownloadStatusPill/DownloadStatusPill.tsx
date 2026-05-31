import { type Component, Show } from 'solid-js';
import { Download } from 'lucide-solid';
import { useNavigate } from '@solidjs/router';
import { useTransferState } from '@/hooks/api/useTransferState';
import styles from './DownloadStatusPill.module.css';

export const DownloadStatusPill: Component = () => {
  const transfer = useTransferState();
  const navigate = useNavigate();

  const label = () => {
    const n = transfer.activeCount();
    if (n === 0) return '';
    const pending = transfer.pendingCount();
    if (pending > 0 && pending === n) {
      return n === 1 ? '1 in queue' : `${n} in queue`;
    }
    return n === 1 ? '1 downloading' : `${n} downloading`;
  };

  return (
    <Show when={transfer.hasPendingOrActive()}>
      <button
        type="button"
        class={styles.pill}
        onClick={() => navigate('/transfers')}
        aria-label={`${transfer.activeCount()} active downloads. Open download queue.`}
      >
        <Download size={14} aria-hidden />
        <span>{label()}</span>
      </button>
    </Show>
  );
};

export default DownloadStatusPill;
