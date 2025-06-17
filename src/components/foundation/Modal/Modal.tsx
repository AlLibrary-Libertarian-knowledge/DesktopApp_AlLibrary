import { Component, ParentProps, JSX, Show, onCleanup, createEffect, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { CULTURAL_SENSITIVITY_LEVELS, CULTURAL_LABELS } from '../../../constants/cultural';
import styles from './Modal.module.css';

/**
 * Cultural Theme Types for Modal Styling
 * Provides cultural context through visual design without access restriction
 */
export type CulturalTheme =
  | 'indigenous'
  | 'traditional'
  | 'modern'
  | 'ceremonial'
  | 'community'
  | 'default';

/**
 * Modal Content Types
 * Defines different content categories for cultural context
 */
export type ModalContentType =
  | 'document'
  | 'collection'
  | 'cultural'
  | 'educational'
  | 'community'
  | 'general'
  | 'confirmation'
  | 'form';

/**
 * Enhanced Modal Props Interface
 * Follows SOLID principles with comprehensive accessibility and cultural support
 */
export interface ModalProps extends ParentProps {
  // Core Modal Properties
  open: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  centered?: boolean;
  footer?: JSX.Element;
  header?: JSX.Element;
  class?: string;
  overlayClass?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: CulturalTheme;
  culturalSensitivityLevel?: number;
  culturalContext?: string;
  showCulturalIndicator?: boolean;
  contentType?: ModalContentType;
  traditionalLayout?: boolean;

  // Accessibility Properties
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  role?: string;

  // Security Properties
  requiresVerification?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'failed' | 'unverified';
  securityLevel?: 'low' | 'medium' | 'high' | 'critical';

  // Event Handlers
  onOpen?: () => void;
  onAfterOpen?: () => void;
  onBeforeClose?: () => void;
  onAfterClose?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;

  // Metadata Properties
  id?: string;
  dataTestId?: string;
  preventScroll?: boolean;
  lockFocus?: boolean;
}

/**
 * Modal Component
 *
 * A comprehensive, accessible modal component with cultural theme support
 * and security validation. Cultural information is displayed for educational
 * purposes only - never for access restriction.
 *
 * @example
 * ```tsx
 * <Modal
 *   open={isOpen()}
 *   onClose={() => setIsOpen(false)}
 *   culturalTheme="indigenous"
 *   culturalContext="Traditional knowledge modal"
 *   ariaLabel="Traditional knowledge content"
 *   contentType="cultural"
 * >
 *   <p>Traditional knowledge content</p>
 * </Modal>
 * ```
 */
const Modal: Component<ModalProps> = props => {
  let modalRef: HTMLDivElement | undefined;
  let previousFocus: HTMLElement | null = null;
  let focusableElements: HTMLElement[] = [];

  // Internal state for accessibility and cultural context
  const [isOpen, setIsOpen] = createSignal(false);
  const [showCulturalTooltip, setShowCulturalTooltip] = createSignal(false);

  /**
   * Generate Cultural Context Tooltip
   */
  const getCulturalTooltip = () => {
    if (!props.culturalContext && !props.culturalSensitivityLevel) return null;

    const sensitivityLabel = props.culturalSensitivityLevel
      ? CULTURAL_LABELS[props.culturalSensitivityLevel] || 'Cultural Context'
      : null;

    return {
      title: props.culturalContext || sensitivityLabel,
      description: 'Cultural context provided for educational purposes only',
      sensitivityLevel: sensitivityLabel,
      contentType: props.contentType,
    };
  };

  /**
   * Get all focusable elements within the modal
   */
  const getFocusableElements = () => {
    if (!modalRef) return [];

    return Array.from(
      modalRef.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];
  };

  /**
   * Handle escape key with cultural context
   */
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.closeOnEscape !== false && props.onClose) {
      e.preventDefault();
      props.onClose();
    }

    // Handle tab trapping for accessibility
    if (e.key === 'Tab' && props.lockFocus !== false) {
      const elements = getFocusableElements();
      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    props.onKeyDown?.(e);
  };

  /**
   * Handle overlay click with cultural context
   */
  const handleOverlayClick = (e: MouseEvent) => {
    if (props.closeOnOverlayClick !== false && e.target === e.currentTarget && props.onClose) {
      props.onClose();
    }
  };

  /**
   * Handle modal open
   */
  const handleOpen = () => {
    setIsOpen(true);
    props.onOpen?.();
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    props.onBeforeClose?.();
    setIsOpen(false);
    props.onClose?.();
    props.onAfterClose?.();
  };

  /**
   * Focus management with cultural context
   */
  createEffect(() => {
    if (props.open) {
      previousFocus = document.activeElement as HTMLElement;

      if (props.preventScroll !== false) {
        document.body.style.overflow = 'hidden';
      }

      document.addEventListener('keydown', handleKeyDown);

      // Focus the modal after a short delay
      setTimeout(() => {
        if (modalRef) {
          modalRef.focus();
          focusableElements = getFocusableElements();
        }
        props.onAfterOpen?.();
      }, 10);

      handleOpen();
    } else {
      if (props.preventScroll !== false) {
        document.body.style.overflow = '';
      }

      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (previousFocus) {
        previousFocus.focus();
      }
    }
  });

  onCleanup(() => {
    if (props.preventScroll !== false) {
      document.body.style.overflow = '';
    }
    document.removeEventListener('keydown', handleKeyDown);
  });

  /**
   * Generate CSS Classes
   */
  const modalClasses = () =>
    [
      styles['modal-content'],
      styles[`modal-${props.size || 'md'}`],
      props.culturalTheme && styles[`modal-cultural-${props.culturalTheme}`],
      props.contentType && styles[`modal-content-${props.contentType}`],
      props.centered && styles['modal-centered'],
      props.traditionalLayout && styles['modal-traditional'],
      props.requiresVerification && styles['modal-verification-required'],
      props.verificationStatus && styles[`modal-verification-${props.verificationStatus}`],
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  const overlayClasses = () =>
    [styles['modal-overlay'], props.open && styles['modal-overlay-open'], props.overlayClass]
      .filter(Boolean)
      .join(' ');

  /**
   * Generate ARIA Attributes
   */
  const ariaAttributes = () => ({
    'aria-label': props.ariaLabel,
    'aria-describedby': props.ariaDescribedBy,
    'aria-labelledby': props.ariaLabelledBy || (props.title ? 'modal-title' : undefined),
    'aria-modal': 'true',
    role: props.role || 'dialog',
  });

  /**
   * Get Verification Status Icon
   */
  const getVerificationIcon = () => {
    switch (props.verificationStatus) {
      case 'verified':
        return '✅';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏳';
      case 'unverified':
        return '⚠️';
      default:
        return null;
    }
  };

  const culturalTooltip = getCulturalTooltip();

  return (
    <Show when={props.open}>
      <Portal>
        <div
          class={overlayClasses()}
          onClick={handleOverlayClick}
          {...ariaAttributes()}
          onMouseEnter={() => {
            if (culturalTooltip) setShowCulturalTooltip(true);
          }}
          onMouseLeave={() => {
            setShowCulturalTooltip(false);
          }}
        >
          <div
            ref={modalRef}
            class={modalClasses()}
            tabindex={-1}
            role="document"
            id={props.id}
            data-testid={props.dataTestId}
          >
            {/* Cultural Indicator */}
            <Show when={props.showCulturalIndicator && props.culturalTheme}>
              <div
                class={styles['modal-cultural-indicator']}
                aria-label={`Cultural theme: ${props.culturalTheme}`}
              >
                🌿
              </div>
            </Show>

            {/* Verification Status */}
            <Show when={props.requiresVerification}>
              <div
                class={styles['modal-verification-status']}
                aria-label={`Verification status: ${props.verificationStatus || 'unverified'}`}
              >
                {getVerificationIcon()}
              </div>
            </Show>

            {/* Header */}
            <Show when={props.header || props.title || props.subtitle || props.closable !== false}>
              <div class={styles['modal-header']}>
                <Show when={props.header}>{props.header}</Show>
                <Show when={!props.header && (props.title || props.subtitle)}>
                  <div class={styles['modal-title-section']}>
                    <Show when={props.title}>
                      <h2 id="modal-title" class={styles['modal-title']}>
                        {props.title}
                      </h2>
                    </Show>
                    <Show when={props.subtitle}>
                      <p class={styles['modal-subtitle']}>{props.subtitle}</p>
                    </Show>
                  </div>
                </Show>
                <Show when={props.closable !== false}>
                  <button
                    class={styles['modal-close']}
                    onClick={handleClose}
                    aria-label="Close modal"
                    type="button"
                  >
                    ✕
                  </button>
                </Show>
              </div>
            </Show>

            {/* Body */}
            <div class={styles['modal-body']}>{props.children}</div>

            {/* Footer */}
            <Show when={props.footer}>
              <div class={styles['modal-footer']}>{props.footer}</div>
            </Show>

            {/* Cultural Context Tooltip */}
            <Show when={showCulturalTooltip() && culturalTooltip}>
              <div class={styles['modal-cultural-tooltip']} role="tooltip">
                <div class={styles['tooltip-content']}>
                  <strong>{culturalTooltip?.title}</strong>
                  {culturalTooltip?.sensitivityLevel && (
                    <div class={styles['sensitivity-level']}>
                      {culturalTooltip.sensitivityLevel}
                    </div>
                  )}
                  {culturalTooltip?.contentType && (
                    <div class={styles['content-type']}>
                      Content Type: {culturalTooltip.contentType}
                    </div>
                  )}
                  <div class={styles['tooltip-description']}>{culturalTooltip?.description}</div>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default Modal;
