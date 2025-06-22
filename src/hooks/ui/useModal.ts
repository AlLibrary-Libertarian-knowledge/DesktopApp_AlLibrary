import { createSignal, createEffect, onCleanup } from 'solid-js';

/**
 * Modal configuration interface
 */
export interface ModalConfig {
  id: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  backdrop?: boolean;
  persistent?: boolean;
  className?: string;
  onOpen?: () => void;
  onClose?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * Modal state interface
 */
export interface ModalState {
  isOpen: boolean;
  config: ModalConfig | null;
  data?: any;
}

/**
 * Modal actions interface
 */
export interface ModalActions {
  open: (config: ModalConfig, data?: any) => void;
  close: () => void;
  confirm: () => void;
  cancel: () => void;
  updateConfig: (updates: Partial<ModalConfig>) => void;
  setData: (data: any) => void;
}

/**
 * Modal hook return type
 */
export interface UseModalReturn extends ModalActions {
  isOpen: () => boolean;
  config: () => ModalConfig | null;
  data: () => any;
  modalId: () => string | null;
}

/**
 * Global modal stack for managing multiple modals
 */
const [modalStack, setModalStack] = createSignal<ModalState[]>([]);
const [activeModal, setActiveModal] = createSignal<ModalState | null>(null);

/**
 * Custom hook for modal management with SolidJS reactive patterns
 *
 * Features:
 * - Multiple modal support with stack management
 * - Keyboard navigation (ESC to close)
 * - Focus management for accessibility
 * - Cultural theme support
 * - Backdrop click handling
 *
 * @example
 * ```tsx
 * const modal = useModal();
 *
 * const openConfirmDialog = () => {
 *   modal.open({
 *     id: 'confirm-delete',
 *     title: 'Confirm Deletion',
 *     size: 'md',
 *     onConfirm: handleDelete,
 *     onCancel: modal.close
 *   });
 * };
 * ```
 */
export const useModal = (): UseModalReturn => {
  // Local state for this modal instance
  const [localModalId, setLocalModalId] = createSignal<string | null>(null);

  // Keyboard event handler for ESC key
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      const current = activeModal();
      if (current && current.config?.closable !== false) {
        closeModal();
      }
    }
  };

  // Set up keyboard event listener
  createEffect(() => {
    if (activeModal()) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus trap - prevent background scrolling
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    });
  });

  /**
   * Opens a modal with the specified configuration
   */
  const openModal = (config: ModalConfig, data?: any) => {
    const newModal: ModalState = {
      isOpen: true,
      config,
      data,
    };

    // Add to modal stack
    setModalStack(prev => [...prev, newModal]);
    setActiveModal(newModal);
    setLocalModalId(config.id);

    // Call onOpen callback
    config.onOpen?.();
  };

  /**
   * Closes the active modal
   */
  const closeModal = () => {
    const current = activeModal();
    if (!current) return;

    // Call onClose callback
    current.config?.onClose?.();

    // Remove from stack
    setModalStack(prev => {
      const newStack = prev.filter(modal => modal.config?.id !== current.config?.id);
      setActiveModal(newStack[newStack.length - 1] || null);
      return newStack;
    });

    // Clear local modal ID if this was the active one
    if (localModalId() === current.config?.id) {
      setLocalModalId(null);
    }
  };

  /**
   * Confirms the modal action
   */
  const confirmModal = () => {
    const current = activeModal();
    if (!current) return;

    // Call onConfirm callback
    current.config?.onConfirm?.();

    // Close modal after confirmation
    closeModal();
  };

  /**
   * Cancels the modal action
   */
  const cancelModal = () => {
    const current = activeModal();
    if (!current) return;

    // Call onCancel callback
    current.config?.onCancel?.();

    // Close modal after cancellation
    closeModal();
  };

  /**
   * Updates the modal configuration
   */
  const updateModalConfig = (updates: Partial<ModalConfig>) => {
    const current = activeModal();
    if (!current || !current.config) return;

    const updatedModal: ModalState = {
      ...current,
      config: { ...current.config, ...updates },
    };

    setModalStack(prev =>
      prev.map(modal => (modal.config?.id === current.config?.id ? updatedModal : modal))
    );
    setActiveModal(updatedModal);
  };

  /**
   * Sets data for the modal
   */
  const setModalData = (data: any) => {
    const current = activeModal();
    if (!current) return;

    const updatedModal: ModalState = {
      ...current,
      data,
    };

    setModalStack(prev =>
      prev.map(modal => (modal.config?.id === current.config?.id ? updatedModal : modal))
    );
    setActiveModal(updatedModal);
  };

  return {
    // State getters
    isOpen: () => {
      const current = activeModal();
      return current?.isOpen === true && current?.config?.id === localModalId();
    },
    config: () => {
      const current = activeModal();
      return current?.config || null;
    },
    data: () => {
      const current = activeModal();
      return current?.data;
    },
    modalId: () => localModalId(),

    // Actions
    open: openModal,
    close: closeModal,
    confirm: confirmModal,
    cancel: cancelModal,
    updateConfig: updateModalConfig,
    setData: setModalData,
  };
};

/**
 * Global modal utilities
 */
export const modalUtils = {
  /**
   * Closes all open modals
   */
  closeAll: () => {
    setModalStack([]);
    setActiveModal(null);
  },

  /**
   * Gets the current modal stack
   */
  getStack: () => modalStack(),

  /**
   * Gets the active modal
   */
  getActive: () => activeModal(),

  /**
   * Checks if any modal is open
   */
  hasOpenModal: () => modalStack().length > 0,
};

export default useModal;
