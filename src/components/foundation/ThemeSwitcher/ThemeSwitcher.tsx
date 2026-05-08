/**
 * Theme Switcher Component
 *
 * Allows users to switch between light/dark mode, cultural and accessibility themes
 * Educational context only - no access restrictions
 * Positioned next to language selector for easy access
 */

import {
  Accessibility,
  ALargeSmall,
  Ban,
  Check,
  ChevronDown,
  Contrast,
  Focus,
  Moon,
  RefreshCw,
  Sun,
} from 'lucide-solid';
import { type Component, createSignal, createEffect, createMemo, Show, For } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { useTheme } from '@/hooks/ui/useTheme';
import styles from './ThemeSwitcher.module.css';

/** Lucide SVG icon size tuned for triggers and menu rows (px). */
const ICON_TRIGGER = 18;
const ICON_OPTION = 17;
const ICON_MENU_CHEVRON = 15;
const ICON_CHECK = 15;

export interface ThemeSwitcherProps {
  /** Component variant - dropdown or compact */
  variant?: 'dropdown' | 'compact';
  /** Component size - sm, md, lg */
  size?: 'sm' | 'md' | 'lg';
  /** Show light/dark mode toggle */
  showModeToggle?: boolean;
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
    showAccessibilityThemes = true,
    onThemeChange,
    class: className = '',
    ariaLabel,
  } = props;

  // Local state
  const [isOpen, setIsOpen] = createSignal(false);

  // Available themes
  const modeThemes = [
    { value: 'light', label: 'Light Mode', Icon: Sun },
    { value: 'dark', label: 'Dark Mode', Icon: Moon },
    { value: 'auto', label: 'Auto', Icon: RefreshCw },
  ];

  const accessibilityThemes = [
    { value: 'default', label: 'Default', Icon: Accessibility },
    { value: 'high-contrast', label: 'High Contrast', Icon: Contrast },
    { value: 'large-text', label: 'Large Text', Icon: ALargeSmall },
    { value: 'reduced-motion', label: 'Reduced Motion', Icon: Ban },
    { value: 'focus-management', label: 'Focus Management', Icon: Focus },
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
    let cleanup: (() => void) | undefined;
    if (isOpen()) {
      document.addEventListener('click', handleClickOutside);
      cleanup = () => document.removeEventListener('click', handleClickOutside);
    }
    return () => cleanup?.();
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
        <span class={styles.themeIcon} aria-hidden>
          <Dynamic component={currentMode().Icon} size={ICON_TRIGGER} />
        </span>
        <span class={styles.themeLabel}>Theme</span>
        <span class={`${styles.dropdownIcon} ${isOpen() ? styles.rotated : ''}`} aria-hidden>
          <ChevronDown size={ICON_MENU_CHEVRON} />
        </span>
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
                  <For each={modeThemes}>
                    {themeOption => {
                      const ModeIcon = themeOption.Icon;
                      return (
                        <button
                          type="button"
                          class={`${styles.themeOption} ${theme.currentTheme().mode === themeOption.value ? styles.active : ''}`}
                          onClick={() => handleModeChange(themeOption.value)}
                          role="option"
                          aria-label={themeOption.label}
                        >
                          <span class={styles.themeOptionIcon} aria-hidden>
                            <ModeIcon size={ICON_OPTION} />
                          </span>
                          <span class={styles.themeOptionLabel}>{themeOption.label}</span>
                          {theme.currentTheme().mode === themeOption.value && (
                            <span class={styles.checkmark} aria-hidden>
                              <Check size={ICON_CHECK} stroke-width={2.5} />
                            </span>
                          )}
                        </button>
                      );
                    }}
                  </For>
                </div>
              </div>
            </Show>

            {/* Accessibility Themes Section */}
            <Show when={showAccessibilityThemes}>
              <div class={styles.section}>
                <h4 class={styles.sectionTitle}>Accessibility</h4>
                <div class={styles.themeGrid}>
                  <For each={accessibilityThemes}>
                    {themeOption => {
                      const A11yIcon = themeOption.Icon;
                      return (
                        <button
                          type="button"
                          class={`${styles.themeOption} ${theme.currentTheme().accessibilityTheme === themeOption.value ? styles.active : ''}`}
                          onClick={() => handleAccessibilityThemeChange(themeOption.value)}
                          role="option"
                          aria-label={themeOption.label}
                        >
                          <span class={styles.themeOptionIcon} aria-hidden>
                            <A11yIcon size={ICON_OPTION} />
                          </span>
                          <span class={styles.themeOptionLabel}>{themeOption.label}</span>
                          {theme.currentTheme().accessibilityTheme === themeOption.value && (
                            <span class={styles.checkmark} aria-hidden>
                              <Check size={ICON_CHECK} stroke-width={2.5} />
                            </span>
                          )}
                        </button>
                      );
                    }}
                  </For>
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
        <span class={styles.themeIcon} aria-hidden>
          <Dynamic component={currentMode().Icon} size={ICON_TRIGGER} />
        </span>
        <span class={styles.themeCode}>{theme.currentTheme().mode.toUpperCase()}</span>
      </button>

      <Show when={isOpen()}>
        <div class={styles.backdrop} onClick={() => setIsOpen(false)} />
        <div class={styles.compactMenu} role="listbox">
          {/* Mode Themes */}
          <For each={modeThemes}>
            {themeOption => {
              const ModeIcon = themeOption.Icon;
              return (
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
                  <span class={styles.themeIcon} aria-hidden>
                    <ModeIcon size={ICON_TRIGGER} />
                  </span>
                  <span class={styles.compactCode}>{themeOption.value.toUpperCase()}</span>
                </button>
              );
            }}
          </For>

          {/* Accessibility Themes */}
          <For each={accessibilityThemes}>
            {themeOption => {
              const A11yIcon = themeOption.Icon;
              return (
                <button
                  class={[
                    styles.compactOption,
                    theme.currentTheme().accessibilityTheme === themeOption.value
                      ? styles.active
                      : '',
                  ].join(' ')}
                  onClick={() => handleAccessibilityThemeChange(themeOption.value)}
                  aria-selected={theme.currentTheme().accessibilityTheme === themeOption.value}
                  role="option"
                  title={themeOption.label}
                >
                  <span class={styles.themeIcon} aria-hidden>
                    <A11yIcon size={ICON_TRIGGER} />
                  </span>
                  <span class={styles.compactCode}>{themeOption.value.toUpperCase()}</span>
                </button>
              );
            }}
          </For>
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
