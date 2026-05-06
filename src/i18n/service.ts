/**
 * i18n Service
 *
 * Core translation service that handles loading, caching, and translating text
 * with performance optimization and cultural sensitivity support
 */

import { createSignal, createResource, createEffect, createRoot } from 'solid-js';
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
  isRTL as isRTLConfig,
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

// Enhanced pluralization helper with indigenous language support
const getPluralRule = (count: number, locale: SupportedLocale): string => {
  // Special handling for indigenous languages
  if (locale === 'qu') {
    // Quechua has different plural rules
    return count === 1 ? 'one' : 'other';
  }
  if (locale === 'mi') {
    // Maori has different plural rules
    return count === 1 ? 'one' : 'other';
  }
  if (locale === 'nv') {
    // Navajo has different plural rules
    return count === 1 ? 'one' : 'other';
  }

  try {
    const rules = new Intl.PluralRules(locale);
    return rules.select(count);
  } catch {
    // Fallback for unsupported locales
    return count === 1 ? 'one' : 'other';
  }
};

// Enhanced key interpolation helper with RTL support
const interpolate = (
  template: string,
  params: TranslationParams = {},
  locale?: SupportedLocale
): string => {
  let result = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });

  // Apply RTL text direction if needed
  if (locale && isRTLConfig(locale)) {
    result = `\u202B${result}\u202C`; // RLE (Right-to-Left Embedding) and PDF (Pop Directional Format)
  }

  return result;
};

// Enhanced nested key resolver with cultural context support
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

// Enhanced translation loader with indigenous language support
const loadTranslations = async (locale: SupportedLocale): Promise<LocaleTranslations> => {
  try {
    // Load all translation files for the locale
    const [common, pages, components, cultural, errors, validation, navigation, accessibility] =
      await Promise.all([
        import(`./locales/${locale}/common.json`).then(m => m.default),
        import(`./locales/${locale}/pages.json`).then(m => m.default),
        import(`./locales/${locale}/components.json`).then(m => m.default).catch(() => ({})),
        import(`./locales/${locale}/cultural.json`).then(m => m.default).catch(() => ({})),
        import(`./locales/${locale}/errors.json`).then(m => m.default).catch(() => ({})),
        import(`./locales/${locale}/validation.json`).then(m => m.default).catch(() => ({})),
        import(`./locales/${locale}/navigation.json`).then(m => m.default),
        import(`./locales/${locale}/accessibility.json`).then(m => m.default).catch(() => ({})),
      ]);

    return {
      common,
      pages,
      components,
      cultural,
      errors,
      validation,
      navigation,
      accessibility,
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
      accessibility: {},
    };
  }
};

// Create the main i18n service
export const createI18nService = (): I18nService => {
  const cache = new TranslationCache();
  const { currentLocale, setCurrentLocale, translations, refetch, changeHandlers } = createRoot(
    () => {
      const [currentLocale, setCurrentLocale] = createSignal<SupportedLocale>(getInitialLanguage());
      const [translations, { refetch }] = createResource(currentLocale, loadTranslations);
      const changeHandlers = new Set<LanguageChangeHandler>();

      // Auto-save language preference
      createEffect(() => {
        const locale = currentLocale();
        saveLanguagePreference(locale);
        changeHandlers.forEach(handler => handler(locale));
      });

      return { currentLocale, setCurrentLocale, translations, refetch, changeHandlers };
    }
  );

  // Enhanced translation function with RTL and cultural support
  const t: TranslationFunction = (key: TranslationKey, params?: TranslationParams): string => {
    const locale = currentLocale();

    // Check cache first
    const cached = cache.get(key, locale);
    if (cached) {
      return interpolate(cached, params, locale);
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

    // Interpolate and return with RTL support
    return interpolate(result, params, locale);
  };

  // Enhanced plural translation function with indigenous language support
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

  // Enhanced translation existence check
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

  // Enhanced language change with RTL support
  const setLanguage = async (locale: SupportedLocale): Promise<void> => {
    try {
      setCurrentLocale(locale);
      await refetch();

      // Apply RTL styles to document if needed
      if (isRTLConfig(locale)) {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', locale);
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', locale);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const getLanguage = (): SupportedLocale => currentLocale();

  const getSupportedLanguages = (): LanguageInfo[] => SUPPORTED_LANGUAGES;

  // Enhanced formatting functions with cultural sensitivity
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    const locale = currentLocale();
    const formattingOptions = getFormattingOptions(locale);
    return new Intl.DateTimeFormat(locale, { ...formattingOptions.dateFormat, ...options }).format(
      date
    );
  };

  const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
    const locale = currentLocale();
    const formattingOptions = getFormattingOptions(locale);
    return new Intl.NumberFormat(locale, { ...formattingOptions.numberFormat, ...options }).format(
      num
    );
  };

  const formatCurrency = (amount: number, currency: string): string => {
    const locale = currentLocale();
    const formattingOptions = getFormattingOptions(locale);
    return new Intl.NumberFormat(locale, {
      ...formattingOptions.numberFormat,
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatRelativeTime = (value: number, unit: Intl.RelativeTimeFormatUnit): string => {
    const locale = currentLocale();
    return new Intl.RelativeTimeFormat(locale).format(value, unit);
  };

  const onLanguageChange = (handler: LanguageChangeHandler): (() => void) => {
    changeHandlers.add(handler);
    return () => changeHandlers.delete(handler);
  };

  const preloadLanguage = async (locale: SupportedLocale): Promise<void> => {
    try {
      await loadTranslations(locale);
    } catch (error) {
      console.warn(`Failed to preload language: ${locale}`, error);
    }
  };

  const clearCache = (): void => {
    cache.clear();
  };

  // Enhanced RTL detection with indigenous language support
  const isRTL = (locale?: SupportedLocale): boolean => {
    const targetLocale = locale || currentLocale();
    const languageInfo = getLanguageInfo(targetLocale);
    return languageInfo.rtl || false;
  };

  const getLanguageInfoUtil = (locale?: SupportedLocale): LanguageInfo => {
    const targetLocale = locale || currentLocale();
    return getLanguageInfo(targetLocale);
  };

  // New: Cultural language support functions
  const getCulturalContext = (locale: SupportedLocale): string => {
    const languageInfo = getLanguageInfo(locale);
    return languageInfo.nativeName;
  };

  const isIndigenousLanguage = (locale?: SupportedLocale): boolean => {
    const targetLocale = locale || currentLocale();
    return ['qu', 'mi', 'nv'].includes(targetLocale);
  };

  const getTraditionalScript = (locale: SupportedLocale): string | null => {
    // Return traditional script information for indigenous languages
    const scripts = {
      qu: 'Latin', // Quechua uses Latin script
      mi: 'Latin', // Maori uses Latin script
      nv: 'Latin', // Navajo uses Latin script
    };
    return scripts[locale as keyof typeof scripts] || null;
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
    getCulturalContext,
    isIndigenousLanguage,
    getTraditionalScript,
  };
};

// Enhanced translation file loader
export const loadTranslationFile = async (
  locale: SupportedLocale,
  namespace: keyof LocaleTranslations
): Promise<TranslationResource> => {
  try {
    const module = await import(`./locales/${locale}/${namespace}.json`);
    return module.default;
  } catch (error) {
    console.warn(`Failed to load translation file: ${locale}/${namespace}.json`, error);
    return {};
  }
};
