/**
 * i18n TypeScript Definitions
 *
 * Comprehensive type definitions for internationalization system
 * with cultural sensitivity and anti-censorship compliance
 */

// Supported locales (major languages first)
export type SupportedLocale =
  | 'en' // English (US)
  | 'es' // Spanish
  | 'fr' // French
  | 'pt' // Portuguese
  | 'de' // German
  | 'it' // Italian
  | 'zh' // Chinese (Simplified)
  | 'ja' // Japanese
  | 'ar' // Arabic (RTL)
  | 'qu' // Quechua (Indigenous)
  | 'mi' // Maori (Indigenous)
  | 'nv'; // Navajo (Indigenous)

// Language information with flag support
export interface LanguageInfo {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string; // Flag emoji
  flagIcon?: string; // Optional flag icon path
  rtl?: boolean; // Right-to-left text direction
}

// Translation namespaces
export type TranslationNamespace =
  | 'common'
  | 'pages'
  | 'components'
  | 'cultural'
  | 'errors'
  | 'validation'
  | 'navigation'
  | 'accessibility';

// Translation interpolation parameters
export interface TranslationParams {
  [key: string]: string | number | boolean;
}

// Translation key paths (auto-generated based on JSON structure)
export type TranslationKey =
  // Common translations
  | 'common.actions.save'
  | 'common.actions.cancel'
  | 'common.actions.delete'
  | 'common.actions.edit'
  | 'common.actions.share'
  | 'common.actions.upload'
  | 'common.actions.download'
  | 'common.actions.search'
  | 'common.actions.filter'
  | 'common.actions.sort'
  | 'common.actions.refresh'
  | 'common.actions.goBack'
  | 'common.actions.viewDetails'
  | 'common.actions.showMore'
  | 'common.actions.showLess'
  | 'common.status.loading'
  | 'common.status.saving'
  | 'common.status.uploading'
  | 'common.status.connecting'
  | 'common.status.syncing'
  | 'common.status.completed'
  | 'common.status.failed'
  | 'common.status.success'
  | 'common.status.error'
  | 'common.status.warning'
  | 'common.status.info'

  // Navigation translations
  | 'navigation.home'
  | 'navigation.documents'
  | 'navigation.collections'
  | 'navigation.search'
  | 'navigation.browse'
  | 'navigation.recent'
  | 'navigation.trending'
  | 'navigation.favorites'
  | 'navigation.peers'
  | 'navigation.network'
  | 'navigation.settings'
  | 'navigation.about'
  | 'navigation.cultural'
  | 'navigation.traditional'
  | 'navigation.community'
  | 'navigation.preservation'

  // Page translations
  | 'pages.home.title'
  | 'pages.home.subtitle'
  | 'pages.documents.title'
  | 'pages.documents.subtitle'
  | 'pages.collections.title'
  | 'pages.collections.subtitle'
  | 'pages.search.title'
  | 'pages.search.subtitle'
  | 'pages.settings.title'
  | 'pages.settings.subtitle'

  // Cultural translations (information only)
  | 'cultural.sensitivity.public'
  | 'cultural.sensitivity.educational'
  | 'cultural.sensitivity.community'
  | 'cultural.sensitivity.traditional'
  | 'cultural.sensitivity.guardian'
  | 'cultural.sensitivity.sacred'
  | 'cultural.sensitivity.ceremonial'
  | 'cultural.context.informationOnly'
  | 'cultural.context.educationalPurpose'
  | 'cultural.context.noAccessRestrictions'
  | 'cultural.context.multiplePerspectives'

  // Error translations
  | 'errors.documentNotFound'
  | 'errors.networkConnectionFailed'
  | 'errors.uploadFailed'
  | 'errors.searchFailed'
  | 'errors.accessDenied'
  | 'errors.validationFailed'

  // Component translations
  | 'components.button.loading'
  | 'components.modal.close'
  | 'components.modal.confirm'
  | 'components.input.required'
  | 'components.input.invalid'
  | 'components.search.placeholder'
  | 'components.languageSwitch.selectLanguage';

// Pluralization rules
export interface PluralRules {
  zero?: string;
  one: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

// Translation resource structure
export interface TranslationResource {
  [key: string]: string | TranslationResource | PluralRules;
}

// Complete translations for a locale
export interface LocaleTranslations {
  common: TranslationResource;
  pages: TranslationResource;
  components: TranslationResource;
  cultural: TranslationResource;
  errors: TranslationResource;
  validation: TranslationResource;
  navigation: TranslationResource;
  accessibility: TranslationResource;
}

// Translation function interface
export interface TranslationFunction {
  (key: TranslationKey, params?: TranslationParams): string;
}

// Plural translation function interface
export interface PluralTranslationFunction {
  (key: TranslationKey, count: number, params?: TranslationParams): string;
}

// Translation existence check function
export interface TranslationExistsFunction {
  (key: TranslationKey): boolean;
}

// Language change handler
export interface LanguageChangeHandler {
  (locale: SupportedLocale): Promise<void>;
}

// i18n service interface
export interface I18nService {
  // Core translation functions
  t: TranslationFunction;
  tc: PluralTranslationFunction;
  te: TranslationExistsFunction;

  // Language management
  setLanguage(locale: SupportedLocale): Promise<void>;
  getLanguage(): SupportedLocale;
  getSupportedLanguages(): LanguageInfo[];

  // Formatting utilities
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string;
  formatNumber(num: number, options?: Intl.NumberFormatOptions): string;
  formatCurrency(amount: number, currency: string): string;
  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit): string;

  // Event handling
  onLanguageChange(handler: LanguageChangeHandler): () => void;

  // Loading and caching
  preloadLanguage(locale: SupportedLocale): Promise<void>;
  clearCache(): void;

  // Utilities
  isRTL(locale?: SupportedLocale): boolean;
  getLanguageInfo(locale?: SupportedLocale): LanguageInfo;

  // Cultural language support functions
  getCulturalContext(locale: SupportedLocale): string;
  isIndigenousLanguage(locale?: SupportedLocale): boolean;
  getTraditionalScript(locale: SupportedLocale): string | null;
}

// Translation hook return type for SolidJS
export interface UseTranslationReturn {
  t: TranslationFunction;
  tc: PluralTranslationFunction;
  te: TranslationExistsFunction;
  locale: () => SupportedLocale;
  changeLanguage: (locale: SupportedLocale) => Promise<void>;
  ready: () => boolean;
  isLoading: () => boolean;
  error: () => string | null;
}

// Language hook return type
export interface UseLanguageReturn {
  currentLanguage: () => SupportedLocale;
  supportedLanguages: () => LanguageInfo[];
  changeLanguage: (locale: SupportedLocale) => Promise<void>;
  isRTL: () => boolean;
  languageInfo: () => LanguageInfo;
  isLoading: () => boolean;
}

// Translation loading state
export interface TranslationLoadingState {
  isLoading: boolean;
  error: string | null;
  progress: number;
  locale: SupportedLocale | null;
}

// Translation cache entry
export interface TranslationCacheEntry {
  translations: LocaleTranslations;
  timestamp: number;
  version: string;
}

// Cache configuration
export interface CacheConfig {
  maxSize: number;
  maxAge: number;
  persistent: boolean;
}

// i18n configuration
export interface I18nConfig {
  defaultLocale: SupportedLocale;
  fallbackLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  cache: CacheConfig;
  lazy: boolean;
  interpolation: {
    prefix: string;
    suffix: string;
    formatSeparator: string;
  };
  pluralization: {
    enabled: boolean;
    separator: string;
  };
  missing: {
    logMissing: boolean;
    fallbackValue: string;
  };
}

// Flag icon mapping for language switcher
export interface FlagIconMapping {
  [locale: string]: {
    emoji: string;
    unicode: string;
    svg?: string;
    png?: string;
  };
}

// Language switcher component props
export interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'grid' | 'compact';
  showFlags?: boolean;
  showNativeName?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  trigger?: 'click' | 'hover';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
}

// Cultural context for translations (information only)
export interface CulturalTranslationContext {
  region: string;
  culturalGroup?: string;
  traditionalContext?: string;
  educationalNotes?: string;
  // NO ACCESS CONTROL - information only
  informationOnly: true;
  noRestrictions: true;
}
