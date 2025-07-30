/**
 * i18n Hooks
 *
 * SolidJS hooks for translation and language management
 * with reactive state and performance optimization
 */

import { createSignal, createMemo, createRoot } from 'solid-js';
import type {
  UseTranslationReturn,
  UseLanguageReturn,
  SupportedLocale,
  TranslationNamespace,
  TranslationFunction,
  PluralTranslationFunction,
  TranslationExistsFunction,
} from './types';
import { i18nService } from './service';

// Global state for language changes - wrapped in createRoot to prevent disposal warnings
const {
  globalLocale,
  setGlobalLocale,
  isLoading,
  setIsLoading,
  error,
  setError,
  translationVersion,
  setTranslationVersion,
} = createRoot(() => {
  const [globalLocale, setGlobalLocale] = createSignal<SupportedLocale>(i18nService.getLanguage());
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const [error, setError] = createSignal<string | null>(null);
  const [translationVersion, setTranslationVersion] = createSignal(0);

  return {
    globalLocale,
    setGlobalLocale,
    isLoading,
    setIsLoading,
    error,
    setError,
    translationVersion,
    setTranslationVersion,
  };
});

// Sync global state with service and force re-renders
i18nService.onLanguageChange(async locale => {
  setGlobalLocale(locale);
  // Force all translation functions to re-evaluate by incrementing version
  setTranslationVersion(prev => prev + 1);
});

/**
 * Main translation hook
 *
 * @param namespace - Optional namespace to prefix all translation keys
 * @returns Translation functions and language state
 */
export const useTranslation = (namespace?: TranslationNamespace): UseTranslationReturn => {
  // Translation function with optional namespace that is reactive to language changes
  const t: TranslationFunction = (key, params) => {
    // Access translationVersion to make this reactive to language changes
    translationVersion();
    const translationKey = namespace ? `${namespace}.${key}` : (key as any);
    return i18nService.t(translationKey, params);
  };

  // Plural translation function with optional namespace
  const tc: PluralTranslationFunction = (key, count, params) => {
    // Access translationVersion to make this reactive to language changes
    translationVersion();
    const translationKey = namespace ? `${namespace}.${key}` : (key as any);
    return i18nService.tc(translationKey, count, params);
  };

  // Translation existence check with optional namespace
  const te: TranslationExistsFunction = key => {
    // Access translationVersion to make this reactive to language changes
    translationVersion();
    const translationKey = namespace ? `${namespace}.${key}` : (key as any);
    return i18nService.te(translationKey);
  };

  // Language change function with immediate cache clearing
  const changeLanguage = async (locale: SupportedLocale): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Clear service cache first
      i18nService.clearCache();

      // Change language
      await i18nService.setLanguage(locale);

      // Force immediate update
      setTranslationVersion(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Language change failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reactive ready state
  const ready = createMemo(() => !isLoading() && !error());

  return {
    t: t as any,
    tc: tc as any,
    te: te as any,
    locale: globalLocale,
    changeLanguage,
    ready,
    isLoading,
    error,
  };
};

/**
 * Language management hook
 *
 * @returns Language information and management functions
 */
export const useLanguage = (): UseLanguageReturn => {
  // Current language info
  const languageInfo = createMemo(() => i18nService.getLanguageInfo());

  // Supported languages
  const supportedLanguages = createMemo(() => i18nService.getSupportedLanguages());

  // RTL detection
  const isRTL = createMemo(() => i18nService.isRTL());

  // Language change function
  const changeLanguage = async (locale: SupportedLocale): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await i18nService.setLanguage(locale);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Language change failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentLanguage: globalLocale,
    supportedLanguages,
    changeLanguage,
    isRTL,
    languageInfo,
    isLoading,
  };
};

/**
 * Cultural translation hook (information only)
 *
 * Provides cultural context and information without access control
 * Maintains anti-censorship principles
 *
 * @returns Cultural information display functions
 */
export const useCulturalTranslation = () => {
  const { t } = useTranslation('cultural');

  // Cultural sensitivity level display (information only)
  const getSensitivityLabel = (level: string) => {
    return t(`sensitivity.${level}` as any);
  };

  // Cultural context information (no restrictions)
  const getContextInfo = (type: string) => {
    return t(`context.${type}` as any);
  };

  // Educational cultural information
  const getEducationalInfo = (topic: string) => {
    return t(`education.${topic}` as any);
  };

  return {
    getSensitivityLabel,
    getContextInfo,
    getEducationalInfo,
    // Ensure anti-censorship compliance
    isInformationOnly: () => true,
    hasAccessRestrictions: () => false,
    supportsMultiplePerspectives: () => true,
  };
};
