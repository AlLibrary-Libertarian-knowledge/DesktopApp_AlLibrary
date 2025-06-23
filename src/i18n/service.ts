/**
 * i18n Service
 *
 * Core translation service that handles loading, caching, and translating text
 * with performance optimization and cultural sensitivity support
 */

import { createSignal, createResource, createEffect } from 'solid-js';
import type {
  I18nService,
  SupportedLocale,
  TranslationResource,
  LocaleTranslations,
  TranslationFunction,
  PluralTranslationFunction,
  TranslationExistsFunction,
  LanguageChangeHandler,
  TranslationParams,
  TranslationKey,
  LanguageInfo,
} from './types';
import {
  I18N_CONFIG,
  SUPPORTED_LANGUAGES,
  getLanguageInfo,
  getFormattingOptions,
  saveLanguagePreference,
  getInitialLanguage,
} from './config';

// Translation cache for performance
class TranslationCache {
  private cache = new Map<string, string>();

  get(key: string, locale: string): string | null {
    return this.cache.get(`${locale}:${key}`) || null;
  }

  set(key: string, locale: string, value: string): void {
    // Limit cache size for performance
    if (this.cache.size >= 1000) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(`${locale}:${key}`, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Pluralization helper
const getPluralRule = (count: number, locale: SupportedLocale): string => {
  const rules = new Intl.PluralRules(locale);
  return rules.select(count);
};

// Key interpolation helper
const interpolate = (template: string, params: TranslationParams = {}): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
};

// Nested key resolver
const resolveNestedKey = (obj: TranslationResource, path: string): string | null => {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }

  return typeof current === 'string' ? current : null;
};

// Mock translation loader (will be replaced with real loader)
const loadTranslations = async (locale: SupportedLocale): Promise<LocaleTranslations> => {
  try {
    // Load all translation files for the locale
    const [common, pages, components, cultural, errors, validation, navigation] = await Promise.all(
      [
        import(`./locales/${locale}/common.json`).then(m => m.default),
        import(`./locales/${locale}/pages.json`).then(m => m.default),
        import(`./locales/${locale}/components.json`).then(m => m.default).catch(() => ({})),
        import(`./locales/${locale}/cultural.json`).then(m => m.default).catch(() => ({})),
        import(`./locales/${locale}/errors.json`).then(m => m.default).catch(() => ({})),
        import(`./locales/${locale}/validation.json`).then(m => m.default).catch(() => ({})),
        import(`./locales/${locale}/navigation.json`).then(m => m.default),
      ]
    );

    return {
      common,
      pages,
      components,
      cultural,
      errors,
      validation,
      navigation,
    };
  } catch (error) {
    console.warn(`Failed to load translations for locale: ${locale}`, error);
    // Return English as fallback if not English already
    if (locale !== 'en') {
      return await loadTranslations('en');
    }
    // If even English fails, return empty structure
    return {
      common: {},
      pages: {},
      components: {},
      cultural: {},
      errors: {},
      validation: {},
      navigation: {},
    };
  }
};

// Create the main i18n service
export const createI18nService = (): I18nService => {
  const cache = new TranslationCache();
  const [currentLocale, setCurrentLocale] = createSignal<SupportedLocale>(getInitialLanguage());
  const [translations, { refetch }] = createResource(currentLocale, loadTranslations);

  // Language change handlers
  const changeHandlers = new Set<LanguageChangeHandler>();

  // Save language preference when it changes
  createEffect(() => {
    const locale = currentLocale();
    saveLanguagePreference(locale);

    // Notify handlers
    changeHandlers.forEach(handler => {
      handler(locale).catch(error => {
        console.warn('Language change handler failed:', error);
      });
    });
  });

  // Translation function
  const t: TranslationFunction = (key: TranslationKey, params?: TranslationParams): string => {
    const locale = currentLocale();

    // Check cache first
    const cached = cache.get(key, locale);
    if (cached) {
      return interpolate(cached, params);
    }

    // Get current translations
    const currentTranslations = translations();
    if (!currentTranslations) {
      return key; // Return key if translations not loaded
    }

    // Resolve the key
    const [namespace, ...keyParts] = key.split('.');
    const keyPath = keyParts.join('.');

    let result: string | null = null;

    if (namespace && namespace in currentTranslations) {
      const namespaceTranslations = currentTranslations[namespace as keyof LocaleTranslations];
      result = resolveNestedKey(namespaceTranslations, keyPath);
    }

    // Fallback to key if not found
    if (!result) {
      if (I18N_CONFIG.missing.logMissing) {
        console.warn(`Missing translation: ${key} for locale: ${locale}`);
      }
      result = I18N_CONFIG.missing.fallbackValue.replace('{{key}}', key);
    }

    // Cache the result
    cache.set(key, locale, result);

    // Interpolate and return
    return interpolate(result, params);
  };

  // Plural translation function
  const tc: PluralTranslationFunction = (
    key: TranslationKey,
    count: number,
    params?: TranslationParams
  ): string => {
    const locale = currentLocale();
    const pluralRule = getPluralRule(count, locale);

    // Try specific plural form first
    const pluralKey = `${key}_${pluralRule}` as TranslationKey;
    const pluralTranslation = t(pluralKey, { ...params, count });

    // If specific plural form not found, fallback to base key
    if (pluralTranslation === pluralKey) {
      return t(key, { ...params, count });
    }

    return pluralTranslation;
  };

  // Translation existence check
  const te: TranslationExistsFunction = (key: TranslationKey): boolean => {
    const currentTranslations = translations();

    if (!currentTranslations) return false;

    const [namespace, ...keyParts] = key.split('.');
    const keyPath = keyParts.join('.');

    if (namespace && namespace in currentTranslations) {
      const namespaceTranslations = currentTranslations[namespace as keyof LocaleTranslations];
      return resolveNestedKey(namespaceTranslations, keyPath) !== null;
    }

    return false;
  };

  // Language management
  const setLanguage = async (locale: SupportedLocale): Promise<void> => {
    if (locale === currentLocale()) return;

    // Validate locale
    if (!SUPPORTED_LANGUAGES.some(lang => lang.code === locale)) {
      throw new Error(`Unsupported locale: ${locale}`);
    }

    setCurrentLocale(locale);
    await refetch();
  };

  const getLanguage = (): SupportedLocale => currentLocale();

  const getSupportedLanguages = (): LanguageInfo[] => SUPPORTED_LANGUAGES;

  // Formatting utilities using Intl API
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    const locale = currentLocale();
    const formatOptions = options || getFormattingOptions(locale).dateFormat;
    return new Intl.DateTimeFormat(locale, formatOptions).format(date);
  };

  const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
    const locale = currentLocale();
    const formatOptions = options || getFormattingOptions(locale).numberFormat;
    return new Intl.NumberFormat(locale, formatOptions).format(num);
  };

  const formatCurrency = (amount: number, currency: string): string => {
    const locale = currentLocale();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatRelativeTime = (value: number, unit: Intl.RelativeTimeFormatUnit): string => {
    const locale = currentLocale();
    const formatOptions = getFormattingOptions(locale).relativeTimeFormat;
    return new Intl.RelativeTimeFormat(locale, formatOptions).format(value, unit);
  };

  // Event handling
  const onLanguageChange = (handler: LanguageChangeHandler): (() => void) => {
    changeHandlers.add(handler);
    return () => changeHandlers.delete(handler);
  };

  // Preloading
  const preloadLanguage = async (locale: SupportedLocale): Promise<void> => {
    await loadTranslations(locale);
  };

  // Cache management
  const clearCache = (): void => {
    cache.clear();
  };

  // Utilities
  const isRTL = (locale?: SupportedLocale): boolean => {
    const targetLocale = locale || currentLocale();
    const info = getLanguageInfo(targetLocale);
    return info.rtl;
  };

  const getLanguageInfoUtil = (locale?: SupportedLocale): LanguageInfo => {
    const targetLocale = locale || currentLocale();
    return getLanguageInfo(targetLocale);
  };

  return {
    t,
    tc,
    te,
    setLanguage,
    getLanguage,
    getSupportedLanguages,
    formatDate,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
    onLanguageChange,
    preloadLanguage,
    clearCache,
    isRTL,
    getLanguageInfo: getLanguageInfoUtil,
  };
};

// Global i18n service instance
export const i18nService = createI18nService();

/**
 * Load translation file (for use with dynamic imports)
 * This will be used to load specific translation files when needed
 */
export const loadTranslationFile = async (
  locale: SupportedLocale,
  namespace: keyof LocaleTranslations
): Promise<TranslationResource> => {
  try {
    // TODO: Replace with actual dynamic imports
    // For now, return empty object
    return {};
  } catch (error) {
    console.warn(`Failed to load translation file: ${locale}/${namespace}`, error);
    return {};
  }
};
