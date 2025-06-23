/**
 * i18n Utilities
 *
 * Utility functions for internationalization management,
 * performance monitoring, and translation quality assurance
 */

import type { SupportedLocale, LocaleTranslations } from '../types';
import { SUPPORTED_LANGUAGES } from '../config';

/**
 * Translation Statistics
 */
export interface TranslationStats {
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  coverage: number;
  lastUpdated: string;
}

export interface I18nPerformanceMetrics {
  avgTranslationTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  bundleSize: number;
}

/**
 * Load locale translations
 */
const loadLocaleTranslations = async (locale: SupportedLocale): Promise<LocaleTranslations> => {
  try {
    const [common, pages, components, navigation, cultural] = await Promise.all([
      import(`../locales/${locale}/common.json`).then(m => m.default).catch(() => ({})),
      import(`../locales/${locale}/pages.json`).then(m => m.default).catch(() => ({})),
      import(`../locales/${locale}/components.json`).then(m => m.default).catch(() => ({})),
      import(`../locales/${locale}/navigation.json`).then(m => m.default).catch(() => ({})),
      import(`../locales/${locale}/cultural.json`).then(m => m.default).catch(() => ({})),
    ]);

    return {
      common,
      pages,
      components,
      navigation,
      cultural,
      errors: {},
      validation: {},
    };
  } catch (error) {
    console.warn(`Failed to load translations for ${locale}:`, error);
    return {
      common: {},
      pages: {},
      components: {},
      navigation: {},
      cultural: {},
      errors: {},
      validation: {},
    };
  }
};

/**
 * Extract all translation keys from a locale
 */
const extractAllKeys = (translations: LocaleTranslations): string[] => {
  const keys: string[] = [];

  const extractFromObject = (obj: any, currentPrefix: string) => {
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = currentPrefix ? `${currentPrefix}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        extractFromObject(value, fullKey);
      } else {
        keys.push(fullKey);
      }
    });
  };

  Object.entries(translations).forEach(([namespace, content]) => {
    extractFromObject(content, namespace);
  });

  return keys;
};

/**
 * Calculate translation coverage for a locale
 */
export const calculateTranslationCoverage = async (
  locale: SupportedLocale,
  baseLocale: SupportedLocale = 'en'
): Promise<TranslationStats> => {
  try {
    const [baseTranslations, targetTranslations] = await Promise.all([
      loadLocaleTranslations(baseLocale),
      loadLocaleTranslations(locale),
    ]);

    const baseKeys = extractAllKeys(baseTranslations);
    const targetKeys = extractAllKeys(targetTranslations);

    const missingKeys = baseKeys.filter(key => !targetKeys.includes(key));
    const coverage = Math.round((targetKeys.length / baseKeys.length) * 100);

    return {
      totalKeys: baseKeys.length,
      translatedKeys: targetKeys.length,
      missingKeys,
      coverage,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.warn(`Failed to calculate coverage for ${locale}:`, error);
    return {
      totalKeys: 0,
      translatedKeys: 0,
      missingKeys: [],
      coverage: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
};

/**
 * Get available languages with their coverage
 */
export const getLanguageStats = async (): Promise<Record<SupportedLocale, TranslationStats>> => {
  const stats: Record<string, TranslationStats> = {};
  const supportedLocales = SUPPORTED_LANGUAGES.map(lang => lang.code);

  for (const locale of supportedLocales) {
    stats[locale] = await calculateTranslationCoverage(locale);
  }

  return stats as Record<SupportedLocale, TranslationStats>;
};

/**
 * Validate translation key format
 */
export const validateTranslationKey = (key: string): boolean => {
  // Valid format: namespace.section.key or namespace.key
  const keyPattern = /^[a-z][a-zA-Z]*(\.[a-z][a-zA-Z]*)*$/;
  return keyPattern.test(key);
};

/**
 * Performance monitoring utilities
 */
export class I18nPerformanceMonitor {
  private translationTimes: number[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private memoryStartUsage = 0;

  startMonitoring(): void {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      this.memoryStartUsage = (window as any).performance.memory.usedJSHeapSize;
    }
  }

  recordTranslationTime(duration: number): void {
    this.translationTimes.push(duration);

    // Keep only last 100 measurements
    if (this.translationTimes.length > 100) {
      this.translationTimes.shift();
    }
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  getMetrics(): I18nPerformanceMetrics {
    const avgTranslationTime =
      this.translationTimes.length > 0
        ? this.translationTimes.reduce((sum, time) => sum + time, 0) / this.translationTimes.length
        : 0;

    const totalCacheAttempts = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalCacheAttempts > 0 ? (this.cacheHits / totalCacheAttempts) * 100 : 0;

    let memoryUsage = 0;
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      memoryUsage = (window as any).performance.memory.usedJSHeapSize - this.memoryStartUsage;
    }

    return {
      avgTranslationTime: Math.round(avgTranslationTime * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      memoryUsage: Math.round((memoryUsage / 1024 / 1024) * 100) / 100, // MB
      bundleSize: 0, // TODO: Calculate actual bundle size
    };
  }

  reset(): void {
    this.translationTimes = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.startMonitoring();
  }
}

/**
 * Cultural language support utilities
 */
export const getCulturalLanguageInfo = (locale: SupportedLocale) => {
  const culturalLanguages = {
    qu: {
      // Quechua
      name: 'Runa Simi',
      nativeName: 'Runa Simi',
      script: 'Latin',
      rtl: false,
      culturalContext: 'Andean cultural heritage',
      regions: ['Peru', 'Bolivia', 'Ecuador', 'Colombia'],
    },
    gn: {
      // Guaraní
      name: 'Guaraní',
      nativeName: "Avañe'ẽ",
      script: 'Latin with diacritics',
      rtl: false,
      culturalContext: 'South American indigenous',
      regions: ['Paraguay', 'Argentina', 'Brazil', 'Bolivia'],
    },
    mi: {
      // Māori
      name: 'Māori',
      nativeName: 'Te Reo Māori',
      script: 'Latin with macrons',
      rtl: false,
      culturalContext: 'Pacific Polynesian culture',
      regions: ['New Zealand', 'Polynesia'],
    },
  };

  return culturalLanguages[locale as keyof typeof culturalLanguages] || null;
};

/**
 * Format pluralization key
 */
export const formatPluralKey = (
  baseKey: string,
  count: number,
  locale: SupportedLocale
): string => {
  // Simple English pluralization rules
  if (locale === 'en') {
    return count === 1 ? `${baseKey}_one` : `${baseKey}_other`;
  }

  // Add more complex pluralization rules for other languages
  // For now, default to simple rule
  return count === 1 ? `${baseKey}_one` : `${baseKey}_other`;
};

/**
 * Generate translation report
 */
export const generateTranslationReport = async (): Promise<{
  overview: {
    totalLanguages: number;
    averageCoverage: number;
    missingTranslations: number;
  };
  languages: Record<SupportedLocale, TranslationStats>;
  recommendations: string[];
}> => {
  const languageStats = await getLanguageStats();

  const totalLanguages = Object.keys(languageStats).length;
  const averageCoverage =
    Object.values(languageStats).reduce((sum, stats) => sum + stats.coverage, 0) / totalLanguages;

  const missingTranslations = Object.values(languageStats).reduce(
    (sum, stats) => sum + stats.missingKeys.length,
    0
  );

  const recommendations: string[] = [];

  Object.entries(languageStats).forEach(([locale, stats]) => {
    if (stats.coverage < 80) {
      recommendations.push(`${locale}: Needs attention (${stats.coverage}% coverage)`);
    }
    if (stats.missingKeys.length > 50) {
      recommendations.push(
        `${locale}: Many missing translations (${stats.missingKeys.length} keys)`
      );
    }
  });

  return {
    overview: {
      totalLanguages,
      averageCoverage: Math.round(averageCoverage),
      missingTranslations,
    },
    languages: languageStats,
    recommendations,
  };
};

// Global performance monitor instance
export const performanceMonitor = new I18nPerformanceMonitor();
