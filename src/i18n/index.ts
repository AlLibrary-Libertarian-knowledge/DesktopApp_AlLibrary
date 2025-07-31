/**
 * i18n Module - Main Export
 *
 * Centralized internationalization system for AlLibrary
 * Provides translation functions, language management, and cultural context
 *
 * @cultural-considerations
 * - Supports cultural languages without access restrictions
 * - Provides educational context for traditional scripts
 * - Maintains anti-censorship principles through information-only approach
 */

// Core exports
export * from './types';
export * from './config';
export * from './service';
export * from './hooks';

// Re-export main utilities
export { createI18nService, loadTranslationFile } from './service';
export { useTranslation, useLanguage, useCulturalTranslation } from './hooks';
export {
  SUPPORTED_LANGUAGES,
  FLAG_ICONS,
  I18N_CONFIG,
  detectBrowserLanguage,
  getStoredLanguage,
  setStoredLanguage,
} from './config';

// Types re-export for convenience
export type {
  SupportedLocale,
  LanguageInfo,
  TranslationFunction,
  TranslationKey,
  CulturalTranslationContext,
} from './types';

// Import directly to avoid circular dependency issues
import { detectBrowserLanguage as detectLang } from './config';
import { createI18nService } from './service';
import type { SupportedLocale } from './types';

// Create the i18n service instance
const i18nService = createI18nService();

/**
 * Initialize i18n system
 * Call this in your app root to set up the translation system
 */
export const initializeI18n = async (defaultLocale?: SupportedLocale) => {
  const locale = defaultLocale || detectLang() || 'en';
  await i18nService.setLanguage(locale);
  return i18nService;
};

/**
 * Get the current i18n service instance
 * Use this to access translation functions directly
 */
export const getI18nService = () => i18nService;
