/**
 * Theme Switcher Component
 *
 * Allows users to switch between light/dark mode, cultural and accessibility themes
 * Educational context only - no access restrictions
 * Positioned next to language selector for easy access
 */

import { Component, createSignal, createEffect, createMemo, Show } from 'solid-js';
import { useTheme } from '@/hooks/ui/useTheme';
import styles from './ThemeSwitcher.module.css';

export interface ThemeSwitcherProps {
  /** Component variant - dropdown or compact */
  variant?: 'dropdown' | 'compact';
  /** Component size - sm, md, lg */
  size?: 'sm' | 'md' | 'lg';
  /** Show light/dark mode toggle */
  showModeToggle?: boolean;
  /** Show cultural themes */
  showCulturalThemes?: boolean;
  /** Show accessibility themes */
  showAccessibilityThemes?: boolean;
  /** Callback when theme changes */
  onThemeChange?: (mode: string, culturalTheme: string, accessibilityTheme: string) => void;
  /** Additional CSS classes */
  class?: string;
  /** Aria label for the button */
  ariaLabel?: string;
}

export const ThemeSwitcher: Component<ThemeSwitcherProps> = props => {
  const theme = useTheme();

  // Destructure props with defaults
  const {
    variant = 'dropdown',
    size = 'md',
    showModeToggle = true,
    showCulturalThemes = true,
    showAccessibilityThemes = true,
    onThemeChange,
    class: className = '',
    ariaLabel,
  } = props;

  // Local state
  const [isOpen, setIsOpen] = createSignal(false);

  // Available themes
  const modeThemes = [
    { value: 'light', label: 'Light Mode', icon: '☀️' },
    { value: 'dark', label: 'Dark Mode', icon: '🌙' },
    { value: 'auto', label: 'Auto', icon: '🔄' },
  ];

  const culturalThemes = [
    { value: 'default', label: 'Default', icon: '🎨' },
    { value: 'indigenous', label: 'Indigenous', icon: '🌿' },
    { value: 'traditional', label: 'Traditional', icon: '🏺' },
    { value: 'ceremonial', label: 'Ceremonial', icon: '🕯️' },
    { value: 'academic', label: 'Academic', icon: '📚' },
    { value: 'community', label: 'Community', icon: '🤝' },
  ];

  const accessibilityThemes = [
    { value: 'default', label: 'Default', icon: '♿' },
    { value: 'high-contrast', label: 'High Contrast', icon: '🔍' },
    { value: 'large-text', label: 'Large Text', icon: '🔤' },
    { value: 'reduced-motion', label: 'Reduced Motion', icon: '🚫' },
    {
      value: 'focus-management',
      label: 'Focus Management',
      icon: '⌨️',
    },
  ];

  // Handle mode change
  const handleModeChange = (mode: string) => {
    theme.setMode(mode as 'light' | 'dark' | 'auto');
    props.onThemeChange?.(
      mode,
      theme.currentTheme().culturalTheme,
      theme.currentTheme().accessibilityTheme
    );
  };

  // Handle cultural theme change
  const handleCulturalThemeChange = (culturalTheme: string) => {
    theme.setCulturalTheme(
      culturalTheme as
        | 'default'
        | 'indigenous'
        | 'traditional'
        | 'ceremonial'
        | 'academic'
        | 'community'
    );
    props.onThemeChange?.(
      theme.currentTheme().mode,
      culturalTheme,
      theme.currentTheme().accessibilityTheme
    );
  };

  // Handle accessibility theme change
  const handleAccessibilityThemeChange = (accessibilityTheme: string) => {
    theme.setAccessibilityTheme(
      accessibilityTheme as
        | 'default'
        | 'high-contrast'
        | 'large-text'
        | 'reduced-motion'
        | 'focus-management'
    );
    props.onThemeChange?.(
      theme.currentTheme().mode,
      theme.currentTheme().culturalTheme,
      accessibilityTheme
    );
  };

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
  const currentMode = createMemo(() => {
    const mode = theme.currentTheme().mode;
    return modeThemes.find(t => t.value === mode) || modeThemes[2]!; // Default to auto
  });

  const currentCulturalTheme = createMemo(() => {
    const cultural = theme.currentTheme().culturalTheme;
    return culturalThemes.find(t => t.value === cultural) || culturalThemes[0]!;
  });

  const currentAccessibilityTheme = createMemo(() => {
    const accessibility = theme.currentTheme().accessibilityTheme;
    return accessibilityThemes.find(t => t.value === accessibility) || accessibilityThemes[0]!;
  });

  // Dropdown variant
  const DropdownVariant: Component = () => (
    <div class={styles.dropdown}>
      <button
        class={styles.trigger}
        onClick={toggleDropdown}
        aria-label={ariaLabel || 'Open theme selection menu'}
        aria-expanded={isOpen()}
        aria-haspopup="listbox"
      >
        <span class={styles.themeIcon}>{currentMode().icon}</span>
        <span class={styles.themeLabel}>Theme</span>
        <span class={`${styles.dropdownIcon} ${isOpen() ? styles.rotated : ''}`}>▼</span>
      </button>

      <Show when={isOpen()}>
        <div class={styles.backdrop} onClick={() => setIsOpen(false)} />
        <div class={styles.menu} role="listbox" aria-label="Available themes">
          <div class={styles.menuHeader}>
            <h3 class={styles.menuTitle}>Theme Settings</h3>
          </div>
          <div class={styles.menuContent}>
            {/* Mode Themes Section */}
            <Show when={showModeToggle}>
              <div class={styles.section}>
                <h4 class={styles.sectionTitle}>Display Mode</h4>
                <div class={styles.themeGrid}>
                  {modeThemes.map(themeOption => (
                    <button
                      type="button"
                      class={`${styles.themeOption} ${theme.currentTheme().mode === themeOption.value ? styles.active : ''}`}
                      onClick={() => handleModeChange(themeOption.value)}
                      role="option"
                      aria-label={themeOption.label}
                    >
                      <span class={styles.themeOptionIcon}>{themeOption.icon}</span>
                      <span class={styles.themeOptionLabel}>{themeOption.label}</span>
                      {theme.currentTheme().mode === themeOption.value && (
                        <span class={styles.checkmark}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Show>

            {/* Cultural Themes Section */}
            <Show when={showCulturalThemes}>
              <div class={styles.section}>
                <h4 class={styles.sectionTitle}>Cultural Themes</h4>
                <div class={styles.themeGrid}>
                  {culturalThemes.map(themeOption => (
                    <button
                      type="button"
                      class={`${styles.themeOption} ${theme.currentTheme().culturalTheme === themeOption.value ? styles.active : ''}`}
                      onClick={() => handleCulturalThemeChange(themeOption.value)}
                      role="option"
                      aria-label={themeOption.label}
                    >
                      <span class={styles.themeOptionIcon}>{themeOption.icon}</span>
                      <span class={styles.themeOptionLabel}>{themeOption.label}</span>
                      {theme.currentTheme().culturalTheme === themeOption.value && (
                        <span class={styles.checkmark}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Show>

            {/* Accessibility Themes Section */}
            <Show when={showAccessibilityThemes}>
              <div class={styles.section}>
                <h4 class={styles.sectionTitle}>Accessibility</h4>
                <div class={styles.themeGrid}>
                  {accessibilityThemes.map(themeOption => (
                    <button
                      type="button"
                      class={`${styles.themeOption} ${theme.currentTheme().accessibilityTheme === themeOption.value ? styles.active : ''}`}
                      onClick={() => handleAccessibilityThemeChange(themeOption.value)}
                      role="option"
                      aria-label={themeOption.label}
                    >
                      <span class={styles.themeOptionIcon}>{themeOption.icon}</span>
                      <span class={styles.themeOptionLabel}>{themeOption.label}</span>
                      {theme.currentTheme().accessibilityTheme === themeOption.value && (
                        <span class={styles.checkmark}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Show>

            {/* Reset Button */}
            <div class={styles.resetSection}>
              <button
                type="button"
                class={styles.resetButton}
                onClick={() => {
                  theme.setMode('dark');
                  theme.setCulturalTheme('default');
                  theme.setAccessibilityTheme('default');
                  setIsOpen(false);
                }}
                role="option"
              >
                Reset to Default
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
        aria-label={ariaLabel || `Current theme: ${currentMode().label}`}
        aria-expanded={isOpen()}
        title={currentMode().label}
      >
        <span class={styles.themeIcon}>{currentMode().icon}</span>
        <span class={styles.themeCode}>{theme.currentTheme().mode.toUpperCase()}</span>
      </button>

      <Show when={isOpen()}>
        <div class={styles.backdrop} onClick={() => setIsOpen(false)} />
        <div class={styles.compactMenu} role="listbox">
          {/* Mode Themes */}
          {modeThemes.map(themeOption => (
            <button
              class={[
                styles.compactOption,
                theme.currentTheme().mode === themeOption.value ? styles.active : '',
              ].join(' ')}
              onClick={() => handleModeChange(themeOption.value)}
              aria-selected={theme.currentTheme().mode === themeOption.value}
              role="option"
              title={themeOption.label}
            >
              <span class={styles.themeIcon}>{themeOption.icon}</span>
              <span class={styles.compactCode}>{themeOption.value.toUpperCase()}</span>
            </button>
          ))}

          {/* Cultural Themes */}
          {culturalThemes.map(themeOption => (
            <button
              class={[
                styles.compactOption,
                theme.currentTheme().culturalTheme === themeOption.value ? styles.active : '',
              ].join(' ')}
              onClick={() => handleCulturalThemeChange(themeOption.value)}
              aria-selected={theme.currentTheme().culturalTheme === themeOption.value}
              role="option"
              title={themeOption.label}
            >
              <span class={styles.themeIcon}>{themeOption.icon}</span>
              <span class={styles.compactCode}>{themeOption.value.toUpperCase()}</span>
            </button>
          ))}

          {/* Accessibility Themes */}
          {accessibilityThemes.map(themeOption => (
            <button
              class={[
                styles.compactOption,
                theme.currentTheme().accessibilityTheme === themeOption.value ? styles.active : '',
              ].join(' ')}
              onClick={() => handleAccessibilityThemeChange(themeOption.value)}
              aria-selected={theme.currentTheme().accessibilityTheme === themeOption.value}
              role="option"
              title={themeOption.label}
            >
              <span class={styles.themeIcon}>{themeOption.icon}</span>
              <span class={styles.compactCode}>{themeOption.value.toUpperCase()}</span>
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
