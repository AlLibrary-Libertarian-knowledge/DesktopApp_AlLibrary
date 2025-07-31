/**
 * i18n Configuration
 *
 * Configuration for internationalization system with language definitions,
 * flag support, and performance settings
 */

import type { I18nConfig, LanguageInfo, SupportedLocale, FlagIconMapping } from './types';

// Language definitions with beautiful flag support
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    flagIcon: '/flags/us.svg',
    rtl: false,
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    flagIcon: '/flags/es.svg',
    rtl: false,
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    flagIcon: '/flags/fr.svg',
    rtl: false,
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    flagIcon: '/flags/pt.svg',
    rtl: false,
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    flagIcon: '/flags/de.svg',
    rtl: false,
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    flagIcon: '/flags/it.svg',
    rtl: false,
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    flagIcon: '/flags/cn.svg',
    rtl: false,
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    flagIcon: '/flags/jp.svg',
    rtl: false,
  },
  // RTL Language Support
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    flagIcon: '/flags/sa.svg',
    rtl: true,
  },
  // Indigenous Language Support
  {
    code: 'qu',
    name: 'Quechua',
    nativeName: 'Runa Simi',
    flag: '🇵🇪',
    flagIcon: '/flags/pe.svg',
    rtl: false,
  },
  {
    code: 'mi',
    name: 'Maori',
    nativeName: 'Te Reo Māori',
    flag: '🇳🇿',
    flagIcon: '/flags/nz.svg',
    rtl: false,
  },
  {
    code: 'nv',
    name: 'Navajo',
    nativeName: 'Diné Bizaad',
    flag: '🇺🇸',
    flagIcon: '/flags/us-navajo.svg',
    rtl: false,
  },
];

// Flag icon mapping for enhanced visual display
export const FLAG_ICONS: FlagIconMapping = {
  en: {
    emoji: '🇺🇸',
    unicode: 'U+1F1FA U+1F1F8',
    svg: '/flags/us.svg',
    png: '/flags/us.png',
  },
  es: {
    emoji: '🇪🇸',
    unicode: 'U+1F1EA U+1F1F8',
    svg: '/flags/es.svg',
    png: '/flags/es.png',
  },
  fr: {
    emoji: '🇫🇷',
    unicode: 'U+1F1EB U+1F1F7',
    svg: '/flags/fr.svg',
    png: '/flags/fr.png',
  },
  pt: {
    emoji: '🇧🇷',
    unicode: 'U+1F1E7 U+1F1F7',
    svg: '/flags/pt.svg',
    png: '/flags/pt.png',
  },
  de: {
    emoji: '🇩🇪',
    unicode: 'U+1F1E9 U+1F1EA',
    svg: '/flags/de.svg',
    png: '/flags/de.png',
  },
  it: {
    emoji: '🇮🇹',
    unicode: 'U+1F1EE U+1F1F9',
    svg: '/flags/it.svg',
    png: '/flags/it.png',
  },
  zh: {
    emoji: '🇨🇳',
    unicode: 'U+1F1E8 U+1F1F3',
    svg: '/flags/cn.svg',
    png: '/flags/cn.png',
  },
  ja: {
    emoji: '🇯🇵',
    unicode: 'U+1F1EF U+1F1F5',
    svg: '/flags/jp.svg',
    png: '/flags/jp.png',
  },
  // RTL Language Support
  ar: {
    emoji: '🇸🇦',
    unicode: 'U+1F1F8 U+1F1E6',
    svg: '/flags/sa.svg',
    png: '/flags/sa.png',
  },
  // Indigenous Language Support
  qu: {
    emoji: '🇵🇪',
    unicode: 'U+1F1F5 U+1F1EA',
    svg: '/flags/pe.svg',
    png: '/flags/pe.png',
  },
  mi: {
    emoji: '🇳🇿',
    unicode: 'U+1F1F3 U+1F1FF',
    svg: '/flags/nz.svg',
    png: '/flags/nz.png',
  },
  nv: {
    emoji: '🇺🇸',
    unicode: 'U+1F1FA U+1F1F8',
    svg: '/flags/us-navajo.svg',
    png: '/flags/us-navajo.png',
  },
};

// Main i18n configuration
export const I18N_CONFIG: I18nConfig = {
  defaultLocale: 'en',
  fallbackLocale: 'en',
  supportedLocales: SUPPORTED_LANGUAGES.map(lang => lang.code),

  // Performance-optimized caching
  cache: {
    maxSize: 50, // Max number of cached translation sets
    maxAge: 1000 * 60 * 30, // 30 minutes cache TTL
    persistent: true, // Use localStorage for persistence
  },

  // Lazy loading for performance
  lazy: true,

  // Interpolation settings
  interpolation: {
    prefix: '{{',
    suffix: '}}',
    formatSeparator: ',',
  },

  // Pluralization support
  pluralization: {
    enabled: true,
    separator: '_',
  },

  // Missing translation handling
  missing: {
    logMissing: process.env.NODE_ENV === 'development',
    fallbackValue: '{{key}}', // Show key in development
  },
};

// Translation namespaces to preload
export const PRELOAD_NAMESPACES = ['common', 'navigation', 'components'];

// Performance settings
export const PERFORMANCE_CONFIG = {
  // Bundle splitting thresholds
  LAZY_LOAD_THRESHOLD: 3, // Load first 3 languages immediately
  PRELOAD_TIMEOUT: 5000, // 5 second timeout for preloading

  // Cache optimization
  MEMORY_CACHE_SIZE: 1000, // Max cached translations in memory
  STORAGE_KEY_PREFIX: 'allibrary_i18n_',

  // Network optimization
  PARALLEL_LOADS: 2, // Max parallel translation file loads
  RETRY_ATTEMPTS: 3, // Retry failed loads
  RETRY_DELAY: 1000, // Delay between retries
};

// Language detection settings
export const DETECTION_CONFIG = {
  // Detection order (first match wins)
  order: ['localStorage', 'navigator', 'htmlTag', 'default'],

  // Storage keys
  storageKey: 'allibrary_selected_language',

  // Navigator detection
  lookupFromNavigator: true,
  lookupFromHTMLTag: true,

  // Fallback behavior
  convertToSupportedLocale: true,
  fallbackOnEmpty: true,
};

// Formatting options for different locales
export const LOCALE_FORMATTING: Record<
  SupportedLocale,
  {
    currency: string;
    dateFormat: Intl.DateTimeFormatOptions;
    numberFormat: Intl.NumberFormatOptions;
    relativeTimeFormat: Intl.RelativeTimeFormatOptions;
  }
> = {
  en: {
    currency: 'USD',
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    numberFormat: {
      notation: 'standard',
    },
    relativeTimeFormat: {
      numeric: 'auto',
    },
  },
  es: {
    currency: 'EUR',
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    numberFormat: {
      notation: 'standard',
    },
    relativeTimeFormat: {
      numeric: 'auto',
    },
  },
  fr: {
    currency: 'EUR',
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    numberFormat: {
      notation: 'standard',
    },
    relativeTimeFormat: {
      numeric: 'auto',
    },
  },
  pt: {
    currency: 'BRL',
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    numberFormat: {
      notation: 'standard',
    },
    relativeTimeFormat: {
      numeric: 'auto',
    },
  },
  de: {
    currency: 'EUR',
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    numberFormat: {
      notation: 'standard',
    },
    relativeTimeFormat: {
      numeric: 'auto',
    },
  },
  it: {
    currency: 'EUR',
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    numberFormat: {
      notation: 'standard',
    },
    relativeTimeFormat: {
      numeric: 'auto',
    },
  },
  zh: {
    currency: 'CNY',
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    numberFormat: {
      notation: 'standard',
    },
    relativeTimeFormat: {
      numeric: 'auto',
    },
  },
  ja: {
    currency: 'JPY',
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    numberFormat: {
      notation: 'standard',
    },
    relativeTimeFormat: {
      numeric: 'auto',
    },
  },
  // RTL Language Support
  ar: {
    currency: 'SAR',
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    numberFormat: {
      notation: 'standard',
    },
    relativeTimeFormat: {
      numeric: 'auto',
    },
  },
  // Indigenous Language Support
  qu: {
    currency: 'PEN',
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    numberFormat: {
      notation: 'standard',
    },
    relativeTimeFormat: {
      numeric: 'auto',
    },
  },
  mi: {
    currency: 'NZD',
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    numberFormat: {
      notation: 'standard',
    },
    relativeTimeFormat: {
      numeric: 'auto',
    },
  },
  nv: {
    currency: 'USD',
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    numberFormat: {
      notation: 'standard',
    },
    relativeTimeFormat: {
      numeric: 'auto',
    },
  },
};

// Helper functions
export const getLanguageInfo = (locale: SupportedLocale): LanguageInfo => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === locale) ?? SUPPORTED_LANGUAGES[0]!;
};

export const getFlagIcon = (locale: SupportedLocale): FlagIconMapping[string] => {
  return FLAG_ICONS[locale] ?? FLAG_ICONS['en']!;
};

export const isRTL = (locale: SupportedLocale): boolean => {
  const info = getLanguageInfo(locale);
  return info.rtl ?? false;
};

export const getFormattingOptions = (locale: SupportedLocale) => {
  return LOCALE_FORMATTING[locale] || LOCALE_FORMATTING['en'];
};

// Language detection utility for Tauri V2
export const detectBrowserLanguage = (): SupportedLocale => {
  // Check if we're in Tauri environment first
  if (typeof window !== 'undefined' && window.__TAURI__) {
    try {
      // For Tauri V2, we'll use system locale detection
      // This will be enhanced with Tauri APIs when available
      const systemLang = Intl.DateTimeFormat().resolvedOptions().locale;
      if (systemLang) {
        const langCode = systemLang.split('-')[0] as SupportedLocale;
        if (SUPPORTED_LANGUAGES.some(lang => lang.code === langCode)) {
          return langCode;
        }
      }
    } catch (error) {
      console.warn('Failed to detect system language:', error);
    }
  }

  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    try {
      // Try to detect from browser/navigator
      const browserLang = window.navigator?.language || window.navigator?.languages?.[0];

      if (browserLang) {
        // Extract language code (e.g., 'en-US' -> 'en')
        const langCode = browserLang.split('-')[0] as SupportedLocale;

        // Check if we support this language
        if (SUPPORTED_LANGUAGES.some(lang => lang.code === langCode)) {
          return langCode;
        }
      }
    } catch (error) {
      console.warn('Failed to detect browser language:', error);
    }
  }

  // Fallback to default
  return I18N_CONFIG.defaultLocale;
};

// Storage utilities
export const saveLanguagePreference = (locale: SupportedLocale): void => {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(DETECTION_CONFIG.storageKey, locale);
  } catch (error) {
    console.warn('Failed to save language preference:', error);
  }
};

export const loadLanguagePreference = (): SupportedLocale | null => {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(DETECTION_CONFIG.storageKey);
    if (stored && SUPPORTED_LANGUAGES.some(lang => lang.code === stored)) {
      return stored as SupportedLocale;
    }
  } catch (error) {
    console.warn('Failed to load language preference:', error);
  }

  return null;
};

// Initial language detection
export const getInitialLanguage = (): SupportedLocale => {
  return loadLanguagePreference() || detectBrowserLanguage();
};

// Convenience aliases for consistent API
export const getStoredLanguage = loadLanguagePreference;
export const setStoredLanguage = saveLanguagePreference;
