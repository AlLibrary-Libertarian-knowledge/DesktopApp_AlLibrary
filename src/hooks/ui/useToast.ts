import { createSignal, createUniqueId } from 'solid-js';

/**
 * Toast types for different message categories
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'cultural' | 'educational';

/**
 * Toast position options
 */
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Cultural context for educational toasts
 */
export interface CulturalContext {
  culturalOrigin?: string;
  sensitivityLevel?: number;
  educationalContent?: string;
  respectfulUsage?: string[];
  communityGuidelines?: string;
}

/**
 * Toast configuration interface
 */
export interface ToastConfig {
  id?: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // milliseconds, 0 for persistent
  position?: ToastPosition;
  closable?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  culturalContext?: CulturalContext;
  ariaLabel?: string;
  className?: string;
}

/**
 * Internal toast state
 */
export interface ToastState
  extends Required<Omit<ToastConfig, 'onAction' | 'onClose' | 'culturalContext'>> {
  id: string;
  createdAt: number;
  isVisible: boolean;
  onAction?: () => void;
  onClose?: () => void;
  culturalContext?: CulturalContext;
}

/**
 * Toast actions interface
 */
export interface ToastActions {
  show: (config: ToastConfig) => string;
  success: (message: string, options?: Partial<ToastConfig>) => string;
  error: (message: string, options?: Partial<ToastConfig>) => string;
  warning: (message: string, options?: Partial<ToastConfig>) => string;
  info: (message: string, options?: Partial<ToastConfig>) => string;
  cultural: (
    message: string,
    culturalContext: CulturalContext,
    options?: Partial<ToastConfig>
  ) => string;
  educational: (
    message: string,
    educationalContent: string,
    options?: Partial<ToastConfig>
  ) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  update: (id: string, updates: Partial<ToastConfig>) => void;
}

/**
 * Toast hook return type
 */
export interface UseToastReturn extends ToastActions {
  toasts: () => ToastState[];
  hasToasts: () => boolean;
  getToast: (id: string) => ToastState | undefined;
}

/**
 * Default toast configuration
 */
const DEFAULT_CONFIG: Partial<ToastConfig> = {
  duration: 5000,
  position: 'top-right',
  closable: true,
  type: 'info',
};

/**
 * Cultural toast templates for educational purposes
 */
const CULTURAL_TEMPLATES = {
  sensitivityNotice: (level: number) => ({
    title: 'Cultural Context Available',
    message: `This content includes cultural information (Level ${level}). Educational resources are available.`,
    type: 'cultural' as ToastType,
    duration: 8000,
  }),

  respectfulUsage: (culturalOrigin: string) => ({
    title: 'Cultural Respect Guidelines',
    message: `Content from ${culturalOrigin} culture. Please review respectful usage guidelines.`,
    type: 'educational' as ToastType,
    duration: 10000,
  }),

  communityContribution: (community: string) => ({
    title: 'Community Contribution',
    message: `This content was contributed by the ${community} community. Thank you for sharing knowledge.`,
    type: 'cultural' as ToastType,
    duration: 6000,
  }),

  educationalOpportunity: () => ({
    title: 'Learning Opportunity',
    message: 'Cultural education resources are available for this content. Click to explore.',
    type: 'educational' as ToastType,
    duration: 12000,
  }),
};

// Global toast state
const [toasts, setToasts] = createSignal<ToastState[]>([]);

/**
 * Custom hook for toast notifications with cultural context support
 *
 * Features:
 * - Multiple toast types including cultural and educational
 * - Cultural context display for educational purposes
 * - Accessibility support with ARIA labels
 * - Auto-dismiss with configurable duration
 * - Position management
 * - Action buttons and callbacks
 *
 * @example
 * ```tsx
 * const toast = useToast();
 *
 * // Show cultural context toast
 * toast.cultural(
 *   'Traditional knowledge content detected',
 *   {
 *     culturalOrigin: 'Indigenous Australian',
 *     sensitivityLevel: 2,
 *     educationalContent: 'Learn about respectful engagement...'
 *   }
 * );
 *
 * // Show success toast
 * toast.success('Document uploaded successfully');
 * ```
 */
export const useToast = (): UseToastReturn => {
  /**
   * Creates a new toast with the given configuration
   */
  const createToast = (config: ToastConfig): ToastState => {
    const id = config.id || createUniqueId();

    const toast: ToastState = {
      id,
      type: config.type,
      title: config.title || '',
      message: config.message,
      duration: config.duration ?? DEFAULT_CONFIG.duration!,
      position: config.position || DEFAULT_CONFIG.position!,
      closable: config.closable ?? DEFAULT_CONFIG.closable!,
      actionLabel: config.actionLabel || '',
      ariaLabel: config.ariaLabel || config.message,
      className: config.className || '',
      createdAt: Date.now(),
      isVisible: true,
      onAction: config.onAction,
      onClose: config.onClose,
      culturalContext: config.culturalContext,
    };

    return toast;
  };

  /**
   * Shows a toast notification
   */
  const showToast = (config: ToastConfig): string => {
    const toast = createToast(config);

    setToasts(prev => [...prev, toast]);

    // Auto-dismiss if duration is set
    if (toast.duration > 0) {
      setTimeout(() => {
        dismissToast(toast.id);
      }, toast.duration);
    }

    return toast.id;
  };

  /**
   * Dismisses a specific toast
   */
  const dismissToast = (id: string) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id);
      if (toast?.onClose) {
        toast.onClose();
      }
      return prev.filter(t => t.id !== id);
    });
  };

  /**
   * Dismisses all toasts
   */
  const dismissAllToasts = () => {
    setToasts(prev => {
      prev.forEach(toast => {
        if (toast.onClose) {
          toast.onClose();
        }
      });
      return [];
    });
  };

  /**
   * Updates a toast configuration
   */
  const updateToast = (id: string, updates: Partial<ToastConfig>) => {
    setToasts(prev => prev.map(toast => (toast.id === id ? { ...toast, ...updates } : toast)));
  };

  /**
   * Shows a success toast
   */
  const showSuccess = (message: string, options: Partial<ToastConfig> = {}): string => {
    return showToast({
      ...options,
      type: 'success',
      message,
      ariaLabel: options.ariaLabel || `Success: ${message}`,
    });
  };

  /**
   * Shows an error toast
   */
  const showError = (message: string, options: Partial<ToastConfig> = {}): string => {
    return showToast({
      ...options,
      type: 'error',
      message,
      duration: options.duration || 8000, // Longer duration for errors
      ariaLabel: options.ariaLabel || `Error: ${message}`,
    });
  };

  /**
   * Shows a warning toast
   */
  const showWarning = (message: string, options: Partial<ToastConfig> = {}): string => {
    return showToast({
      ...options,
      type: 'warning',
      message,
      duration: options.duration || 7000,
      ariaLabel: options.ariaLabel || `Warning: ${message}`,
    });
  };

  /**
   * Shows an info toast
   */
  const showInfo = (message: string, options: Partial<ToastConfig> = {}): string => {
    return showToast({
      ...options,
      type: 'info',
      message,
      ariaLabel: options.ariaLabel || `Information: ${message}`,
    });
  };

  /**
   * Shows a cultural context toast (information only)
   */
  const showCultural = (
    message: string,
    culturalContext: CulturalContext,
    options: Partial<ToastConfig> = {}
  ): string => {
    return showToast({
      ...options,
      type: 'cultural',
      message,
      culturalContext,
      duration: options.duration || 10000, // Longer for cultural context
      ariaLabel: options.ariaLabel || `Cultural context: ${message}`,
      actionLabel: options.actionLabel || 'Learn More',
      onAction:
        options.onAction ||
        (() => {
          // Default action: show cultural education
          console.info('Cultural Context Information:', culturalContext);
        }),
    });
  };

  /**
   * Shows an educational toast
   */
  const showEducational = (
    message: string,
    educationalContent: string,
    options: Partial<ToastConfig> = {}
  ): string => {
    return showToast({
      ...options,
      type: 'educational',
      message,
      culturalContext: {
        educationalContent,
      },
      duration: options.duration || 12000, // Longer for educational content
      ariaLabel: options.ariaLabel || `Educational content: ${message}`,
      actionLabel: options.actionLabel || 'Explore',
      onAction:
        options.onAction ||
        (() => {
          // Default action: show educational content
          console.info('Educational Content:', educationalContent);
        }),
    });
  };

  /**
   * Gets a specific toast by ID
   */
  const getToast = (id: string): ToastState | undefined => {
    return toasts().find(toast => toast.id === id);
  };

  return {
    // State
    toasts,
    hasToasts: () => toasts().length > 0,
    getToast,

    // Actions
    show: showToast,
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    cultural: showCultural,
    educational: showEducational,
    dismiss: dismissToast,
    dismissAll: dismissAllToasts,
    update: updateToast,
  };
};

/**
 * Pre-configured cultural toast helpers
 */
export const culturalToasts = {
  /**
   * Shows a cultural sensitivity notice
   */
  sensitivityNotice: (level: number, culturalOrigin?: string) => {
    const toast = useToast();
    const template = CULTURAL_TEMPLATES.sensitivityNotice(level);

    return toast.cultural(
      template.message,
      {
        sensitivityLevel: level,
        culturalOrigin,
        educationalContent: `Cultural sensitivity level ${level} indicates traditional knowledge or cultural content. Educational resources are available to help you understand the cultural context and engage respectfully.`,
      },
      {
        title: template.title,
        duration: template.duration,
      }
    );
  },

  /**
   * Shows respectful usage guidelines
   */
  respectfulUsage: (culturalOrigin: string, guidelines: string[]) => {
    const toast = useToast();
    const template = CULTURAL_TEMPLATES.respectfulUsage(culturalOrigin);

    return toast.educational(
      template.message,
      `Respectful usage guidelines for ${culturalOrigin} cultural content:\n${guidelines.join('\n')}`,
      {
        title: template.title,
        duration: template.duration,
      }
    );
  },

  /**
   * Acknowledges community contribution
   */
  communityContribution: (community: string) => {
    const toast = useToast();
    const template = CULTURAL_TEMPLATES.communityContribution(community);

    return toast.cultural(
      template.message,
      {
        specific_community: community,
        educationalContent: `This content was generously shared by the ${community} community as part of their commitment to preserving and sharing knowledge.`,
      },
      {
        title: template.title,
        duration: template.duration,
      }
    );
  },

  /**
   * Highlights educational opportunities
   */
  educationalOpportunity: (culturalContext: CulturalContext) => {
    const toast = useToast();
    const template = CULTURAL_TEMPLATES.educationalOpportunity();

    return toast.educational(
      template.message,
      culturalContext.educationalContent ||
        'Cultural education resources are available to enhance your understanding of this content.',
      {
        title: template.title,
        duration: template.duration,
        culturalContext,
      }
    );
  },
};

export default useToast;
