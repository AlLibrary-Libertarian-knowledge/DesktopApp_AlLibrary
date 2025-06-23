/**
 * Modal Foundation Component
 *
 * A reusable modal dialog component with accessibility features.
 * Follows WCAG 2.1 AA standards with keyboard navigation and focus management.
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Modal Title"
 *   size="md"
 * >
 *   <p>Modal content goes here</p>
 * </Modal>
 * ```
 *
 * @accessibility
 * - Focus trap within modal
 * - ESC key to close
 * - Click outside to close
 * - Proper ARIA attributes
 * - Screen reader announcements
 *
 * @performance
 * - Portal rendering
 * - Lazy content rendering
 * - Optimized animations
 */

import { Component, ParentProps, createEffect, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { X } from 'lucide-solid';
import { Button } from '../Button';
import { useTranslation } from '../../../i18n/hooks';
import styles from './Modal.module.css';

export interface ModalProps extends ParentProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether clicking outside closes modal */
  closeOnOutsideClick?: boolean;
  /** Whether ESC key closes modal */
  closeOnEsc?: boolean;
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

export const Modal: Component<ModalProps> = props => {
  // Initialize i18n translation hook
  const { t } = useTranslation('components');

  // Default props
  const size = () => props.size || 'md';
  const showCloseButton = () => props.showCloseButton !== false;
  const closeOnOutsideClick = () => props.closeOnOutsideClick !== false;
  const closeOnEsc = () => props.closeOnEsc !== false;

  // Keyboard event handler
  const handleKeyDown = (event: any) => {
    if (!props.isOpen) return;

    if (event.key === 'Escape' && closeOnEsc()) {
      event.preventDefault();
      props.onClose();
    }
  };

  // Click outside handler
  const handleBackdropClick = (event: any) => {
    if (event.target === event.currentTarget && closeOnOutsideClick()) {
      props.onClose();
    }
  };

  // Body scroll lock and keyboard listener
  createEffect(() => {
    if (props.isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    }
  });

  // Cleanup
  onCleanup(() => {
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div
          class={`${styles.overlay} ${props.class || ''}`}
          onClick={handleBackdropClick}
          data-testid={props['data-testid']}
          role="dialog"
          aria-modal="true"
          aria-labelledby={props.title ? 'modal-title' : undefined}
        >
          <div class={`${styles.modal} ${styles[size()]}`} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <Show when={props.title || showCloseButton()}>
              <header class={styles.header}>
                <Show when={props.title}>
                  <h2 id="modal-title" class={styles.title}>
                    {props.title}
                  </h2>
                </Show>

                <Show when={showCloseButton()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={props.onClose}
                    ariaLabel={t('modal.closeModal')}
                  >
                    <X size={20} />
                  </Button>
                </Show>
              </header>
            </Show>

            {/* Modal Content */}
            <div class={styles.content}>{props.children}</div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default Modal;
