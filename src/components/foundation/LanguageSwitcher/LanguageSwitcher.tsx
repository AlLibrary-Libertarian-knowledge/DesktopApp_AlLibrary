/**
 * LanguageSwitcher — compact header control + dark dropdown
 */

import { type Component, createSignal, createMemo, For, Show } from 'solid-js';
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
  const variant = () => props.variant ?? 'dropdown';
  const showNativeName = () => props.showNativeName !== false;
  const size = () => props.size ?? 'md';
  const className = () => props.className ?? '';

  const { currentLanguage, changeLanguage, isLoading } = useLanguage();
  const [isOpen, setIsOpen] = createSignal(false);
  const [isChanging, setIsChanging] = createSignal(false);

  const currentLanguageInfo = createMemo(
    () =>
      SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage()) ?? SUPPORTED_LANGUAGES[0]!
  );

  const containerClasses = createMemo(() =>
    [styles.languageSwitcher, styles[`size--${size()}`], isOpen() ? styles.open : '', className()]
      .filter(Boolean)
      .join(' ')
  );

  const isLoadingState = createMemo(() => isLoading() || isChanging());

  const handleLanguageSelect = async (languageCode: SupportedLocale) => {
    if (languageCode === currentLanguage()) {
      setIsOpen(false);
      return;
    }

    try {
      setIsChanging(true);
      await changeLanguage(languageCode);
      await props.onLanguageChange?.(languageCode);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div class={containerClasses()}>
      <Show when={variant() === 'dropdown'}>
        <div class={styles.dropdown}>
          <button
            type="button"
            class={styles.trigger}
            onClick={() => setIsOpen(v => !v)}
            aria-label={props.ariaLabel || 'Select language'}
            aria-expanded={isOpen()}
            aria-haspopup="listbox"
            disabled={isLoadingState()}
          >
            <span class={styles.languageCode}>{currentLanguage().toUpperCase()}</span>
            <Show when={showNativeName()}>
              <span class={styles.languageName}>{currentLanguageInfo().nativeName}</span>
            </Show>
            <svg class={styles.chevron} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <Show when={isOpen()}>
            <div class={styles.backdrop} onClick={() => setIsOpen(false)} />
            <div class={styles.menu} role="listbox" aria-label="Available languages">
              <div class={styles.menuHeader}>
                <h3 class={styles.menuTitle}>Language</h3>
              </div>
              <div class={styles.menuContent}>
                <For each={SUPPORTED_LANGUAGES}>
                  {language => (
                    <button
                      type="button"
                      class={`${styles.languageOption} ${
                        language.code === currentLanguage() ? styles.active : ''
                      }`}
                      onClick={() => handleLanguageSelect(language.code)}
                      disabled={isLoadingState()}
                      aria-selected={language.code === currentLanguage()}
                      role="option"
                    >
                      <span class={styles.optionCode}>{language.code.toUpperCase()}</span>
                      <span class={styles.optionName}>{language.nativeName}</span>
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </Show>

      <Show when={variant() === 'compact'}>
        <div class={styles.compact}>
          <button
            type="button"
            class={styles.compactTrigger}
            onClick={() => setIsOpen(v => !v)}
            aria-label={props.ariaLabel || `Current language: ${currentLanguageInfo().nativeName}`}
            aria-expanded={isOpen()}
            aria-haspopup="listbox"
            disabled={isLoadingState()}
            title={currentLanguageInfo().nativeName}
          >
            <span class={styles.languageCode}>{currentLanguage().toUpperCase()}</span>
          </button>

          <Show when={isOpen()}>
            <div class={styles.backdrop} onClick={() => setIsOpen(false)} />
            <div class={styles.compactMenu} role="listbox" aria-label="Available languages">
              <For each={SUPPORTED_LANGUAGES}>
                {language => (
                  <button
                    type="button"
                    class={`${styles.compactOption} ${
                      language.code === currentLanguage() ? styles.active : ''
                    }`}
                    onClick={() => handleLanguageSelect(language.code)}
                    disabled={isLoadingState()}
                    aria-selected={language.code === currentLanguage()}
                    role="option"
                    title={language.nativeName}
                  >
                    <span class={styles.optionCode}>{language.code.toUpperCase()}</span>
                    <span class={styles.optionName}>{language.nativeName}</span>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>

      <Show when={isLoadingState()}>
        <div class={styles.loadingOverlay}>
          <div class={styles.loadingSpinner} />
        </div>
      </Show>
    </div>
  );
};
