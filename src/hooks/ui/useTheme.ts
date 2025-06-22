import { createSignal, createEffect, onMount } from 'solid-js';

/**
 * Available theme types
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Cultural theme variants
 */
export type CulturalTheme =
  | 'default'
  | 'indigenous'
  | 'traditional'
  | 'ceremonial'
  | 'academic'
  | 'community';

/**
 * Accessibility theme options
 */
export type AccessibilityTheme = 'default' | 'high-contrast' | 'large-text' | 'reduced-motion';

/**
 * Complete theme configuration
 */
export interface ThemeConfig {
  mode: ThemeMode;
  culturalTheme: CulturalTheme;
  accessibilityTheme: AccessibilityTheme;
  customColors?: Record<string, string>;
  fontSize?: 'small' | 'medium' | 'large' | 'xl';
  animations?: boolean;
  highContrast?: boolean;
}

/**
 * Theme preferences stored in local storage
 */
export interface ThemePreferences extends ThemeConfig {
  autoDetectSystemTheme: boolean;
  respectCulturalProtocols: boolean;
  showCulturalEducation: boolean;
}

/**
 * Theme hook return type
 */
export interface UseThemeReturn {
  // Current theme state
  currentTheme: () => ThemeConfig;
  isDark: () => boolean;
  isLight: () => boolean;

  // Theme actions
  setMode: (mode: ThemeMode) => void;
  setCulturalTheme: (theme: CulturalTheme) => void;
  setAccessibilityTheme: (theme: AccessibilityTheme) => void;
  toggleMode: () => void;

  // Preferences
  preferences: () => ThemePreferences;
  updatePreferences: (updates: Partial<ThemePreferences>) => void;
  resetToDefaults: () => void;

  // Cultural theme utilities
  getCulturalThemeInfo: () => CulturalThemeInfo;
  applyCulturalProtocols: () => void;
}

/**
 * Cultural theme information for educational display
 */
export interface CulturalThemeInfo {
  name: string;
  description: string;
  culturalContext: string;
  educationalResources: string[];
  respectfulUsage: string[];
  colorMeaning?: Record<string, string>;
}

/**
 * Default theme configuration
 */
const DEFAULT_THEME: ThemeConfig = {
  mode: 'auto',
  culturalTheme: 'default',
  accessibilityTheme: 'default',
  fontSize: 'medium',
  animations: true,
  highContrast: false,
};

/**
 * Default preferences
 */
const DEFAULT_PREFERENCES: ThemePreferences = {
  ...DEFAULT_THEME,
  autoDetectSystemTheme: true,
  respectCulturalProtocols: true,
  showCulturalEducation: true,
};

/**
 * Cultural theme information for educational purposes
 */
const CULTURAL_THEME_INFO: Record<CulturalTheme, CulturalThemeInfo> = {
  default: {
    name: 'Default Theme',
    description: 'Standard application theme with universal design principles',
    culturalContext: 'Neutral design following accessibility standards',
    educationalResources: ['Universal Design Guidelines', 'Accessibility Best Practices'],
    respectfulUsage: ['Suitable for all users', 'No cultural restrictions'],
  },
  indigenous: {
    name: 'Indigenous Theme',
    description: 'Earth-toned theme inspired by indigenous design principles',
    culturalContext:
      'Colors and patterns reflect connection to nature and traditional knowledge systems',
    educationalResources: [
      'Indigenous Design Principles',
      'Traditional Color Symbolism',
      'Respectful Use of Indigenous Aesthetics',
    ],
    respectfulUsage: [
      'Educational context provided',
      'No sacred symbols used',
      'Community-informed design choices',
    ],
    colorMeaning: {
      earth: 'Connection to land and ancestors',
      sky: 'Spiritual guidance and wisdom',
      water: 'Life source and purification',
      fire: 'Transformation and energy',
    },
  },
  traditional: {
    name: 'Traditional Theme',
    description: 'Classic academic theme with formal typography and layout',
    culturalContext: 'Reflects traditional academic and scholarly environments',
    educationalResources: ['Academic Design History', 'Scholarly Communication Design'],
    respectfulUsage: ['Appropriate for formal contexts', 'Enhances focus on content'],
  },
  ceremonial: {
    name: 'Ceremonial Theme',
    description: 'Respectful theme for ceremonial and sacred content viewing',
    culturalContext: 'Muted colors and minimal distractions for respectful content engagement',
    educationalResources: [
      'Respectful Content Engagement',
      'Cultural Protocol Guidelines',
      'Sacred Content Handling',
    ],
    respectfulUsage: [
      'Use when viewing culturally sensitive content',
      'Minimal visual distractions',
      'Respectful color palette',
    ],
  },
  academic: {
    name: 'Academic Theme',
    description: 'Clean, research-focused theme optimized for study and analysis',
    culturalContext: 'Designed for academic research and scholarly work',
    educationalResources: ['Research Environment Design', 'Academic Productivity Tools'],
    respectfulUsage: ['Optimized for long reading sessions', 'Reduces eye strain'],
  },
  community: {
    name: 'Community Theme',
    description: 'Warm, collaborative theme emphasizing community connections',
    culturalContext: 'Reflects community values and collaborative knowledge sharing',
    educationalResources: ['Community Design Principles', 'Collaborative Interface Design'],
    respectfulUsage: ['Encourages community engagement', 'Supports collaborative work'],
  },
};

// Global theme state
const [currentTheme, setCurrentTheme] = createSignal<ThemeConfig>(DEFAULT_THEME);
const [preferences, setPreferences] = createSignal<ThemePreferences>(DEFAULT_PREFERENCES);
const [systemPrefersDark, setSystemPrefersDark] = createSignal(false);

/**
 * Custom hook for theme management with cultural sensitivity
 *
 * Features:
 * - Light/dark mode with system detection
 * - Cultural theme variants with educational context
 * - Accessibility theme options
 * - Local storage persistence
 * - Cultural protocol respect
 *
 * @example
 * ```tsx
 * const theme = useTheme();
 *
 * // Set cultural theme with educational context
 * theme.setCulturalTheme('indigenous');
 * const culturalInfo = theme.getCulturalThemeInfo();
 *
 * // Toggle between light/dark
 * theme.toggleMode();
 * ```
 */
export const useTheme = (): UseThemeReturn => {
  // Load preferences from localStorage on mount
  onMount(() => {
    try {
      const stored = localStorage.getItem('allibrary-theme-preferences');
      if (stored) {
        const parsed = JSON.parse(stored) as ThemePreferences;
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        setCurrentTheme({
          mode: parsed.mode,
          culturalTheme: parsed.culturalTheme,
          accessibilityTheme: parsed.accessibilityTheme,
          fontSize: parsed.fontSize,
          animations: parsed.animations,
          highContrast: parsed.highContrast,
        });
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
    }

    // Set up system theme detection
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mediaQuery.matches);

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  });

  // Apply theme to document when theme changes
  createEffect(() => {
    const theme = currentTheme();
    const prefs = preferences();

    // Determine effective mode
    let effectiveMode = theme.mode;
    if (theme.mode === 'auto') {
      effectiveMode = systemPrefersDark() ? 'dark' : 'light';
    }

    // Apply theme classes to document
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.remove(
      'cultural-default',
      'cultural-indigenous',
      'cultural-traditional',
      'cultural-ceremonial',
      'cultural-academic',
      'cultural-community'
    );
    root.classList.remove(
      'accessibility-default',
      'accessibility-high-contrast',
      'accessibility-large-text',
      'accessibility-reduced-motion'
    );

    // Apply new theme classes
    root.classList.add(`theme-${effectiveMode}`);
    root.classList.add(`cultural-${theme.culturalTheme}`);
    root.classList.add(`accessibility-${theme.accessibilityTheme}`);

    // Apply font size
    root.style.setProperty(
      '--base-font-size',
      {
        small: '14px',
        medium: '16px',
        large: '18px',
        xl: '20px',
      }[theme.fontSize || 'medium']
    );

    // Apply animations preference
    if (!theme.animations) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }

    // Apply high contrast
    if (theme.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Store preferences
    try {
      localStorage.setItem('allibrary-theme-preferences', JSON.stringify(prefs));
    } catch (error) {
      console.warn('Failed to save theme preferences:', error);
    }
  });

  /**
   * Sets the theme mode
   */
  const setMode = (mode: ThemeMode) => {
    setCurrentTheme(prev => ({ ...prev, mode }));
    setPreferences(prev => ({ ...prev, mode }));
  };

  /**
   * Sets the cultural theme with educational context
   */
  const setCulturalTheme = (culturalTheme: CulturalTheme) => {
    setCurrentTheme(prev => ({ ...prev, culturalTheme }));
    setPreferences(prev => ({ ...prev, culturalTheme }));

    // Show educational context if enabled
    if (preferences().showCulturalEducation && culturalTheme !== 'default') {
      const info = CULTURAL_THEME_INFO[culturalTheme];
      console.info(`Cultural Theme Applied: ${info.name}`, {
        description: info.description,
        culturalContext: info.culturalContext,
        educationalResources: info.educationalResources,
      });
    }
  };

  /**
   * Sets the accessibility theme
   */
  const setAccessibilityTheme = (accessibilityTheme: AccessibilityTheme) => {
    setCurrentTheme(prev => ({ ...prev, accessibilityTheme }));
    setPreferences(prev => ({ ...prev, accessibilityTheme }));
  };

  /**
   * Toggles between light and dark mode
   */
  const toggleMode = () => {
    const current = currentTheme().mode;
    if (current === 'auto') {
      setMode(systemPrefersDark() ? 'light' : 'dark');
    } else {
      setMode(current === 'light' ? 'dark' : 'light');
    }
  };

  /**
   * Updates theme preferences
   */
  const updatePreferences = (updates: Partial<ThemePreferences>) => {
    const newPrefs = { ...preferences(), ...updates };
    setPreferences(newPrefs);

    // Update current theme if relevant properties changed
    const themeUpdates: Partial<ThemeConfig> = {};
    if ('mode' in updates) themeUpdates.mode = updates.mode!;
    if ('culturalTheme' in updates) themeUpdates.culturalTheme = updates.culturalTheme!;
    if ('accessibilityTheme' in updates)
      themeUpdates.accessibilityTheme = updates.accessibilityTheme!;
    if ('fontSize' in updates) themeUpdates.fontSize = updates.fontSize!;
    if ('animations' in updates) themeUpdates.animations = updates.animations!;
    if ('highContrast' in updates) themeUpdates.highContrast = updates.highContrast!;

    if (Object.keys(themeUpdates).length > 0) {
      setCurrentTheme(prev => ({ ...prev, ...themeUpdates }));
    }
  };

  /**
   * Resets theme to defaults
   */
  const resetToDefaults = () => {
    setCurrentTheme(DEFAULT_THEME);
    setPreferences(DEFAULT_PREFERENCES);
  };

  /**
   * Gets cultural theme information for educational display
   */
  const getCulturalThemeInfo = (): CulturalThemeInfo => {
    return CULTURAL_THEME_INFO[currentTheme().culturalTheme];
  };

  /**
   * Applies cultural protocols (information display only)
   */
  const applyCulturalProtocols = () => {
    const prefs = preferences();
    if (!prefs.respectCulturalProtocols) return;

    const culturalInfo = getCulturalThemeInfo();

    // Display cultural education information
    if (prefs.showCulturalEducation) {
      console.info('Cultural Protocol Information:', {
        theme: culturalInfo.name,
        context: culturalInfo.culturalContext,
        respectfulUsage: culturalInfo.respectfulUsage,
        educationalResources: culturalInfo.educationalResources,
      });
    }
  };

  return {
    // State
    currentTheme,
    isDark: () => {
      const mode = currentTheme().mode;
      return mode === 'dark' || (mode === 'auto' && systemPrefersDark());
    },
    isLight: () => {
      const mode = currentTheme().mode;
      return mode === 'light' || (mode === 'auto' && !systemPrefersDark());
    },

    // Actions
    setMode,
    setCulturalTheme,
    setAccessibilityTheme,
    toggleMode,

    // Preferences
    preferences,
    updatePreferences,
    resetToDefaults,

    // Cultural utilities
    getCulturalThemeInfo,
    applyCulturalProtocols,
  };
};

export default useTheme;
