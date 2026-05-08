// Modal management
export { useModal, modalUtils } from './useModal';
export type { ModalConfig, ModalState, ModalActions, UseModalReturn } from './useModal';

// Theme management + shared UI accents (foundation components use UICulturalTheme)
export type { UICulturalTheme } from '@/types/core';
export { useTheme } from './useTheme';
export type {
  ThemeMode,
  CulturalTheme,
  AccessibilityTheme,
  ThemePreferences,
  UseThemeReturn,
} from './useTheme';

// Toast notifications
export { useToast, culturalToasts } from './useToast';
export type {
  ToastType,
  ToastPosition,
  CulturalContext as ToastCulturalContext,
  ToastConfig,
  ToastState,
  ToastActions,
  UseToastReturn,
} from './useToast';
