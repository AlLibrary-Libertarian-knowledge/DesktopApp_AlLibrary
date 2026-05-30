import { type Component, Show, For, createMemo } from 'solid-js';
import { AlertTriangle, Trash2 } from 'lucide-solid';
import { Modal } from '@/components/foundation/Modal';
import { Button } from '@/components/foundation/Button';
import { useTranslation } from '@/i18n/hooks';
import styles from './ConfirmDeleteModal.module.css';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  /** Primary item name or summary, e.g. document title */
  itemLabel: string;
  /** Optional count for batch deletes */
  count?: number;
  /** Names shown in batch mode (truncated in UI) */
  itemNames?: readonly string[];
  busy?: boolean;
}

export const ConfirmDeleteModal: Component<ConfirmDeleteModalProps> = props => {
  const { t } = useTranslation('components');

  const count = () => props.count ?? 1;
  const isBatch = () => count() > 1;

  const title = createMemo(() =>
    isBatch()
      ? t('confirmDeleteModal.titleBatch', { count: count() })
      : t('confirmDeleteModal.titleSingle')
  );

  const message = createMemo(() =>
    isBatch()
      ? t('confirmDeleteModal.messageBatch', { count: count() })
      : t('confirmDeleteModal.messageSingle', { title: props.itemLabel })
  );

  const confirmLabel = createMemo(() => {
    if (props.busy) return t('confirmDeleteModal.deleting');
    return isBatch()
      ? t('confirmDeleteModal.confirmBatch', { count: count() })
      : t('confirmDeleteModal.confirmSingle');
  });

  const handleConfirm = () => {
    void Promise.resolve(props.onConfirm());
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={title()}
      size="sm"
      closeOnOutsideClick={!props.busy}
      closeOnEsc={!props.busy}
      showCloseButton={!props.busy}
      data-testid="confirm-delete-modal"
      footer={
        <div class={styles.actions}>
          <Button variant="ghost" onClick={props.onClose} disabled={props.busy}>
            {t('modal.cancel')}
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={props.busy}>
            <Trash2 size={16} />
            {confirmLabel()}
          </Button>
        </div>
      }
    >
      <div class={styles.body}>
        <div class={styles.iconWrap} aria-hidden="true">
          <AlertTriangle size={28} />
        </div>
        <p class={styles.message}>{message()}</p>
        <Show when={isBatch() && props.itemNames?.length}>
          <ul class={styles.itemList}>
            <For each={props.itemNames!.slice(0, 5)}>{name => <li>{name}</li>}</For>
            <Show when={(props.itemNames?.length ?? 0) > 5}>
              <li>
                {t('confirmDeleteModal.andMore', {
                  count: (props.itemNames?.length ?? 0) - 5,
                })}
              </li>
            </Show>
          </ul>
        </Show>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
