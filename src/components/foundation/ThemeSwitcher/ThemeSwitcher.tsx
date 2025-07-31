/**
 * Theme Switcher Component
 *
 * Allows users to switch between cultural and accessibility themes
 * Educational context only - no access restrictions
 * Positioned next to language selector for easy access
 */

import { Component, createSignal, createEffect, createMemo, Show } from 'solid-js';
import { useTranslation } from '@/i18n';
import styles from './ThemeSwitcher.module.css';

export interface ThemeSwitcherProps {
  /** Component variant - dropdown or compact */
  variant?: 'dropdown' | 'compact';
  /** Component size - sm, md, lg */
  size?: 'sm' | 'md' | 'lg';
  /** Initial cultural theme */
  initialCulturalTheme?: 'indigenous' | 'traditional' | 'ceremonial' | 'academic' | 'community';
  /** Initial accessibility theme */
  initialAccessibilityTheme?:
    | 'high-contrast'
    | 'large-text'
    | 'reduced-motion'
    | 'focus-management';
  /** Callback when theme changes */
  onThemeChange?: (culturalTheme: string, accessibilityTheme: string) => void;
  /** Additional CSS classes */
  class?: string;
  /** Aria label for the button */
  ariaLabel?: string;
}

export const ThemeSwitcher: Component<ThemeSwitcherProps> = props => {
  const { t } = useTranslation('components');

  // Destructure props with defaults
  const {
    variant = 'dropdown',
    size = 'md',
    initialCulturalTheme = 'indigenous',
    initialAccessibilityTheme = '',
    onThemeChange,
    class: className = '',
    ariaLabel,
  } = props;

  // Theme state
  const [culturalTheme, setCulturalTheme] = createSignal(initialCulturalTheme);
  const [accessibilityTheme, setAccessibilityTheme] = createSignal(initialAccessibilityTheme);
  const [isOpen, setIsOpen] = createSignal(false);

  // Available themes
  const culturalThemes = [
    { value: 'indigenous', label: t('themeSwitcher.cultural.indigenous'), icon: '🌿' },
    { value: 'traditional', label: t('themeSwitcher.cultural.traditional'), icon: '🏺' },
    { value: 'ceremonial', label: t('themeSwitcher.cultural.ceremonial'), icon: '🕯️' },
    { value: 'academic', label: t('themeSwitcher.cultural.academic'), icon: '📚' },
    { value: 'community', label: t('themeSwitcher.cultural.community'), icon: '🤝' },
  ];

  const accessibilityThemes = [
    { value: 'high-contrast', label: t('themeSwitcher.accessibility.highContrast'), icon: '🔍' },
    { value: 'large-text', label: t('themeSwitcher.accessibility.largeText'), icon: '🔤' },
    { value: 'reduced-motion', label: t('themeSwitcher.accessibility.reducedMotion'), icon: '🚫' },
    {
      value: 'focus-management',
      label: t('themeSwitcher.accessibility.focusManagement'),
      icon: '⌨️',
    },
  ];

  // Apply theme to document
  const applyTheme = (cultural: string, accessibility: string) => {
    const root = document.documentElement;

    // Remove all existing theme attributes
    root.removeAttribute('data-cultural-theme');
    root.removeAttribute('data-accessibility');

    // Apply cultural theme
    if (cultural) {
      root.setAttribute('data-cultural-theme', cultural);
    }

    // Apply accessibility theme
    if (accessibility) {
      root.setAttribute('data-accessibility', accessibility);
    }

    // Store in localStorage
    localStorage.setItem('alLibrary-cultural-theme', cultural);
    localStorage.setItem('alLibrary-accessibility-theme', accessibility);
  };

  // Handle cultural theme change
  const handleCulturalThemeChange = (theme: string) => {
    setCulturalTheme(theme);
    applyTheme(theme, accessibilityTheme());
    props.onThemeChange?.(theme, accessibilityTheme());
  };

  // Handle accessibility theme change
  const handleAccessibilityThemeChange = (theme: string) => {
    const newTheme = accessibilityTheme() === theme ? '' : theme;
    setAccessibilityTheme(newTheme);
    applyTheme(culturalTheme(), newTheme);
    props.onThemeChange?.(culturalTheme(), newTheme);
  };

  // Initialize theme from localStorage
  createEffect(() => {
    const storedCultural =
      localStorage.getItem('alLibrary-cultural-theme') ||
      props.initialCulturalTheme ||
      'indigenous';
    const storedAccessibility =
      localStorage.getItem('alLibrary-accessibility-theme') ||
      props.initialAccessibilityTheme ||
      '';

    setCulturalTheme(storedCultural);
    setAccessibilityTheme(storedAccessibility);
    applyTheme(storedCultural, storedAccessibility);
  });

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen());
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest(`.${styles.themeSwitcher}`)) {
      setIsOpen(false);
    }
  };

  createEffect(() => {
    if (isOpen()) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });

  // CSS classes for styling
  const containerClasses = createMemo(() =>
    [
      styles.themeSwitcher,
      styles[`variant--${variant}`],
      styles[`size--${size}`],
      isOpen() ? styles.open : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')
  );

  // Get current theme info
  const currentCulturalTheme = createMemo(
    () => culturalThemes.find(t => t.value === culturalTheme()) || culturalThemes[0]!
  );

  // Dropdown variant
  const DropdownVariant: Component = () => (
    <div class={styles.dropdown}>
      <button
        class={styles.trigger}
        onClick={toggleDropdown}
        aria-label={ariaLabel || t('themeSwitcher.buttonLabel')}
        aria-expanded={isOpen()}
        aria-haspopup="listbox"
      >
        <span class={styles.themeIcon}>{currentCulturalTheme().icon}</span>
        <span class={styles.themeLabel}>{t('themeSwitcher.buttonText')}</span>
        <span class={`${styles.dropdownIcon} ${isOpen() ? styles.rotated : ''}`}>▼</span>
      </button>

      <Show when={isOpen()}>
        <div class={styles.backdrop} onClick={() => setIsOpen(false)} />
        <div class={styles.menu} role="listbox" aria-label="Available themes">
          <div class={styles.menuHeader}>
            <h3 class={styles.menuTitle}>{t('themeSwitcher.buttonText')}</h3>
          </div>
          <div class={styles.menuContent}>
            {/* Cultural Themes Section */}
            <div class={styles.section}>
              <h4 class={styles.sectionTitle}>{t('themeSwitcher.culturalSection')}</h4>
              <div class={styles.themeGrid}>
                {culturalThemes.map(theme => (
                  <button
                    type="button"
                    class={`${styles.themeOption} ${culturalTheme() === theme.value ? styles.active : ''}`}
                    onClick={() => handleCulturalThemeChange(theme.value)}
                    role="option"
                    aria-label={theme.label}
                  >
                    <span class={styles.themeOptionIcon}>{theme.icon}</span>
                    <span class={styles.themeOptionLabel}>{theme.label}</span>
                    {culturalTheme() === theme.value && <span class={styles.checkmark}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessibility Themes Section */}
            <div class={styles.section}>
              <h4 class={styles.sectionTitle}>{t('themeSwitcher.accessibilitySection')}</h4>
              <div class={styles.themeGrid}>
                {accessibilityThemes.map(theme => (
                  <button
                    type="button"
                    class={`${styles.themeOption} ${accessibilityTheme() === theme.value ? styles.active : ''}`}
                    onClick={() => handleAccessibilityThemeChange(theme.value)}
                    role="option"
                    aria-label={theme.label}
                  >
                    <span class={styles.themeOptionIcon}>{theme.icon}</span>
                    <span class={styles.themeOptionLabel}>{theme.label}</span>
                    {accessibilityTheme() === theme.value && (
                      <span class={styles.checkmark}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <div class={styles.resetSection}>
              <button
                type="button"
                class={styles.resetButton}
                onClick={() => {
                  handleCulturalThemeChange('indigenous');
                  handleAccessibilityThemeChange('');
                  setIsOpen(false);
                }}
                role="option"
              >
                {t('themeSwitcher.resetToDefault')}
              </button>
            </div>
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
        onClick={toggleDropdown}
        aria-label={ariaLabel || `Current theme: ${currentCulturalTheme().label}`}
        aria-expanded={isOpen()}
        title={currentCulturalTheme().label}
      >
        <span class={styles.themeIcon}>{currentCulturalTheme().icon}</span>
        <span class={styles.themeCode}>{culturalTheme().toUpperCase()}</span>
      </button>

      <Show when={isOpen()}>
        <div class={styles.backdrop} onClick={() => setIsOpen(false)} />
        <div class={styles.compactMenu} role="listbox">
          {/* Cultural Themes */}
          {culturalThemes.map(theme => (
            <button
              class={[
                styles.compactOption,
                culturalTheme() === theme.value ? styles.active : '',
              ].join(' ')}
              onClick={() => handleCulturalThemeChange(theme.value)}
              aria-selected={culturalTheme() === theme.value}
              role="option"
              title={theme.label}
            >
              <span class={styles.themeIcon}>{theme.icon}</span>
              <span class={styles.compactCode}>{theme.value.toUpperCase()}</span>
            </button>
          ))}

          {/* Accessibility Themes */}
          {accessibilityThemes.map(theme => (
            <button
              class={[
                styles.compactOption,
                accessibilityTheme() === theme.value ? styles.active : '',
              ].join(' ')}
              onClick={() => handleAccessibilityThemeChange(theme.value)}
              aria-selected={accessibilityTheme() === theme.value}
              role="option"
              title={theme.label}
            >
              <span class={styles.themeIcon}>{theme.icon}</span>
              <span class={styles.compactCode}>{theme.value.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </Show>
    </div>
  );

  return (
    <div class={containerClasses()}>
      <Show when={variant === 'dropdown'} fallback={<CompactVariant />}>
        <DropdownVariant />
      </Show>
    </div>
  );
};
