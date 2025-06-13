import { Component, ParentProps, JSX, Show, onCleanup, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import styles from './Modal.module.css';

export interface ModalProps extends ParentProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  centered?: boolean;
  footer?: JSX.Element;
  header?: JSX.Element;
  class?: string;
  overlayClass?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const Modal: Component<ModalProps> = props => {
  let modalRef: HTMLDivElement | undefined;
  let previousFocus: HTMLElement | null = null;

  // Handle escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.closeOnEscape !== false && props.onClose) {
      props.onClose();
    }
  };

  // Handle overlay click
  const handleOverlayClick = (e: MouseEvent) => {
    if (props.closeOnOverlayClick !== false && e.target === e.currentTarget && props.onClose) {
      props.onClose();
    }
  };

  // Focus management
  createEffect(() => {
    if (props.open) {
      previousFocus = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);

      // Focus the modal
      setTimeout(() => {
        modalRef?.focus();
      }, 10);
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (previousFocus) {
        previousFocus.focus();
      }
    }
  });

  onCleanup(() => {
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKeyDown);
  });

  const modalClasses = () =>
    [
      styles['modal-content'],
      styles[`modal-${props.size || 'md'}`],
      props.centered && styles['modal-centered'],
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  const overlayClasses = () =>
    [styles['modal-overlay'], props.open && styles['modal-overlay-open'], props.overlayClass]
      .filter(Boolean)
      .join(' ');

  return (
    <Show when={props.open}>
      <Portal>
        <div
          class={overlayClasses()}
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby={props.title ? 'modal-title' : undefined}
        >
          <div ref={modalRef} class={modalClasses()} tabindex={-1} role="document">
            <Show when={props.header || props.title || props.closable !== false}>
              <div class={styles['modal-header']}>
                <Show when={props.header}>{props.header}</Show>
                <Show when={!props.header && props.title}>
                  <h2 id="modal-title" class={styles['modal-title']}>
                    {props.title}
                  </h2>
                </Show>
                <Show when={props.closable !== false}>
                  <button
                    class={styles['modal-close']}
                    onClick={props.onClose}
                    aria-label="Close modal"
                    type="button"
                  >
                    ✕
                  </button>
                </Show>
              </div>
            </Show>

            <div class={styles['modal-body']}>{props.children}</div>

            <Show when={props.footer}>
              <div class={styles['modal-footer']}>{props.footer}</div>
            </Show>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default Modal;
