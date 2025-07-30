/**
 * LanguageSwitcher Component
 *
 * Beautiful language switcher with country flags, supporting dropdown layouts
 * with smooth animations and excellent accessibility
 */

import { Component, createSignal, createMemo, For, Show } from 'solid-js';
import type { SupportedLocale } from '@/i18n/types';
import { useLanguage } from '@/i18n/hooks';
import { SUPPORTED_LANGUAGES } from '@/i18n/config';
import styles from './LanguageSwitcher.module.css';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'compact';
  showFlags?: boolean;
  showNativeName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  onLanguageChange?: (locale: SupportedLocale) => void;
}

export const LanguageSwitcher: Component<LanguageSwitcherProps> = props => {
  const {
    variant = 'dropdown',
    showFlags = true,
    showNativeName = true,
    size = 'md',
    className = '',
    ariaLabel,
    onLanguageChange,
  } = props;

  // Use the i18n system for language management
  const { currentLanguage, changeLanguage, isLoading } = useLanguage();

  const [isOpen, setIsOpen] = createSignal(false);
  const [isChanging, setIsChanging] = createSignal(false);

  // Get current language info
  const currentLanguageInfo = createMemo(
    () =>
      SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage()) ?? SUPPORTED_LANGUAGES[0]!
  );

  // CSS classes for styling
  const containerClasses = createMemo(() =>
    [
      styles.languageSwitcher,
      styles[`variant--${variant}`],
      styles[`size--${size}`],
      isOpen() ? styles.open : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')
  );

  // Handle language selection
  const handleLanguageSelect = async (languageCode: SupportedLocale) => {
    if (languageCode === currentLanguage()) {
      setIsOpen(false);
      return;
    }

    try {
      setIsChanging(true);

      // Call the i18n system to change language with immediate update
      await changeLanguage(languageCode);

      // Also call the optional prop callback
      if (onLanguageChange) {
        await onLanguageChange(languageCode);
      }

      setIsOpen(false);
      console.log('Language changed to:', languageCode);

      // Force a small delay to ensure all components have updated
      await new Promise(resolve => window.setTimeout(resolve, 1));
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  // Handle dropdown toggle
  const handleToggle = () => {
    setIsOpen(!isOpen());
  };

  // Close dropdown when clicking outside
  const handleBackdropClick = () => {
    setIsOpen(false);
  };

  // Check if we're currently loading/changing language
  const isLoadingState = createMemo(() => isLoading() || isChanging());

  // Current language display
  const CurrentLanguageDisplay: Component = () => (
    <div class={styles.currentLanguage}>
      <Show when={showFlags}>
        <span class={styles.flag} role="img" aria-label={currentLanguageInfo().name}>
          {currentLanguageInfo().flag}
        </span>
      </Show>
      <span class={styles.languageName}>
        {showNativeName ? currentLanguageInfo().nativeName : currentLanguageInfo().name}
      </span>
      <Show when={variant === 'dropdown'}>
        <svg class={styles.chevron} viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </Show>
    </div>
  );

  // Language option component
  const LanguageOption: Component<{ language: (typeof SUPPORTED_LANGUAGES)[0] }> = ({
    language,
  }) => (
    <button
      class={[styles.languageOption, language.code === currentLanguage() ? styles.active : ''].join(
        ' '
      )}
      onClick={() => handleLanguageSelect(language.code)}
      disabled={isLoadingState()}
      aria-selected={language.code === currentLanguage()}
      role="option"
    >
      <Show when={showFlags}>
        <span class={styles.flag} role="img" aria-label={language.name}>
          {language.flag}
        </span>
      </Show>
      <div class={styles.languageInfo}>
        <span class={styles.languageName}>
          {showNativeName ? language.nativeName : language.name}
        </span>
        <Show when={showNativeName && language.name !== language.nativeName}>
          <span class={styles.languageCode}>{language.name}</span>
        </Show>
      </div>
      <Show when={language.code === currentLanguage()}>
        <svg class={styles.checkmark} viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </Show>
    </button>
  );

  // Dropdown variant
  const DropdownVariant: Component = () => (
    <div class={styles.dropdown}>
      <button
        class={styles.trigger}
        onClick={handleToggle}
        aria-label={ariaLabel || 'Select Language'}
        aria-expanded={isOpen()}
        aria-haspopup="listbox"
        disabled={isLoadingState()}
      >
        <CurrentLanguageDisplay />
      </button>

      <Show when={isOpen()}>
        <div class={styles.backdrop} onClick={handleBackdropClick} />
        <div class={styles.menu} role="listbox" aria-label="Available languages">
          <div class={styles.menuHeader}>
            <h3 class={styles.menuTitle}>Select Language</h3>
          </div>
          <div class={styles.menuContent}>
            <For each={SUPPORTED_LANGUAGES}>
              {language => <LanguageOption language={language} />}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );

  // Compact variant
  const CompactVariant: Component = () => (
    <div class={styles.compact}>
      <button
        class={styles.compactTrigger}
        onClick={handleToggle}
        aria-label={ariaLabel || `Current Language: ${currentLanguageInfo().nativeName}`}
        aria-expanded={isOpen()}
        disabled={isLoadingState()}
        title={currentLanguageInfo().nativeName}
      >
        <Show when={showFlags}>
          <span class={styles.flag} role="img" aria-label={currentLanguageInfo().name}>
            {currentLanguageInfo().flag}
          </span>
        </Show>
        <Show when={showNativeName}>
          <span class={styles.languageCode}>{currentLanguage().toUpperCase()}</span>
        </Show>
      </button>

      <Show when={isOpen()}>
        <div class={styles.backdrop} onClick={handleBackdropClick} />
        <div class={styles.compactMenu} role="listbox">
          <For each={SUPPORTED_LANGUAGES}>
            {language => (
              <button
                class={[
                  styles.compactOption,
                  language.code === currentLanguage() ? styles.active : '',
                ].join(' ')}
                onClick={() => handleLanguageSelect(language.code)}
                disabled={isLoadingState()}
                aria-selected={language.code === currentLanguage()}
                role="option"
                title={language.nativeName}
              >
                <span class={styles.flag} role="img" aria-label={language.name}>
                  {language.flag}
                </span>
                <Show when={showNativeName}>
                  <span class={styles.compactCode}>{language.code.toUpperCase()}</span>
                </Show>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );

  return (
    <div class={containerClasses()}>
      <Show when={variant === 'dropdown'}>
        <DropdownVariant />
      </Show>
      <Show when={variant === 'compact'}>
        <CompactVariant />
      </Show>

      {/* Loading overlay */}
      <Show when={isLoadingState()}>
        <div class={styles.loadingOverlay}>
          <div class={styles.loadingSpinner} />
        </div>
      </Show>
    </div>
  );
};
