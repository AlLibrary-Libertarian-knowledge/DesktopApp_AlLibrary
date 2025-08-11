import { createSignal, createEffect, onMount } from 'solid-js';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'auto';
export type CulturalTheme =
  | 'default'
  | 'indigenous'
  | 'traditional'
  | 'ceremonial'
  | 'academic'
  | 'community';
export type AccessibilityTheme =
  | 'default'
  | 'high-contrast'
  | 'large-text'
  | 'reduced-motion'
  | 'focus-management';
export type FontSize = 'small' | 'medium' | 'large' | 'xl';

export interface ThemePreferences {
  mode: ThemeMode;
  culturalTheme: CulturalTheme;
  accessibilityTheme: AccessibilityTheme;
  fontSize: FontSize;
  animations: boolean;
  highContrast: boolean;
}

export interface UseThemeReturn {
  // Current theme state
  currentTheme: () => ThemePreferences;

  // Theme actions
  setMode: (mode: ThemeMode) => void;
  setCulturalTheme: (theme: CulturalTheme) => void;
  setAccessibilityTheme: (theme: AccessibilityTheme) => void;
  setFontSize: (size: FontSize) => void;
  setAnimations: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;

  // Utility functions
  isDark: () => boolean;
  isLight: () => boolean;
  isAuto: () => boolean;
  getEffectiveMode: () => 'light' | 'dark';

  // System preferences
  systemPrefersDark: () => boolean;
  systemPrefersReducedMotion: () => boolean;
  systemPrefersHighContrast: () => boolean;
}

// Default theme preferences - DARK MODE AS DEFAULT
const DEFAULT_THEME: ThemePreferences = {
  mode: 'dark', // Changed from 'auto' to 'dark' as default
  culturalTheme: 'default',
  accessibilityTheme: 'default',
  fontSize: 'medium',
  animations: true,
  highContrast: false,
};

// Local storage key
const THEME_STORAGE_KEY = 'allibrary-theme-preferences';

// System preference detection
const getSystemPrefersDark = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getSystemPrefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const getSystemPrefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Load theme preferences from localStorage
const loadThemePreferences = (): ThemePreferences => {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_THEME, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load theme preferences:', error);
  }

  return DEFAULT_THEME;
};

// Save theme preferences to localStorage
const saveThemePreferences = (preferences: ThemePreferences): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save theme preferences:', error);
  }
};

// Apply theme to document
const applyTheme = (preferences: ThemePreferences): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Determine effective mode
  let effectiveMode: 'light' | 'dark';
  if (preferences.mode === 'auto') {
    effectiveMode = getSystemPrefersDark() ? 'dark' : 'light';
  } else {
    effectiveMode = preferences.mode;
  }

  // Remove existing theme classes
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.remove(
    'theme-cultural-default',
    'theme-cultural-indigenous',
    'theme-cultural-traditional',
    'theme-cultural-ceremonial',
    'theme-cultural-academic',
    'theme-cultural-community'
  );
  root.classList.remove(
    'theme-accessibility-default',
    'theme-accessibility-high-contrast',
    'theme-accessibility-large-text',
    'theme-accessibility-reduced-motion',
    'theme-accessibility-focus-management'
  );

  // Apply new theme classes
  root.classList.add(`theme-${effectiveMode}`);
  root.classList.add(`theme-cultural-${preferences.culturalTheme}`);
  root.classList.add(`theme-accessibility-${preferences.accessibilityTheme}`);

  // Apply font size
  root.style.setProperty(
    '--base-font-size',
    {
      small: '14px',
      medium: '16px',
      large: '18px',
      xl: '20px',
    }[preferences.fontSize]
  );

  // Apply animations preference
  if (!preferences.animations) {
    root.style.setProperty('--animation-duration', '0s');
    root.style.setProperty('--transition-duration', '0s');
  } else {
    root.style.removeProperty('--animation-duration');
    root.style.removeProperty('--transition-duration');
  }

  // Apply high contrast
  if (preferences.highContrast) {
    root.classList.add('theme-accessibility-high-contrast');
  }

  // Apply reduced motion if system prefers it
  if (getSystemPrefersReducedMotion()) {
    root.classList.add('theme-accessibility-reduced-motion');
  }

  // Apply focus management for accessibility
  if (preferences.accessibilityTheme === 'focus-management') {
    root.classList.add('theme-accessibility-focus-management');
  }
};

export const useTheme = (): UseThemeReturn => {
  // Theme state
  const [preferences, setPreferences] = createSignal<ThemePreferences>(loadThemePreferences());

  // System preference signals
  const [systemPrefersDark, setSystemPrefersDark] = createSignal(getSystemPrefersDark());
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = createSignal(
    getSystemPrefersReducedMotion()
  );
  const [systemPrefersHighContrast, setSystemPrefersHighContrast] = createSignal(
    getSystemPrefersHighContrast()
  );

  // Load preferences from localStorage on mount
  onMount(() => {
    const savedPreferences = loadThemePreferences();
    setPreferences(savedPreferences);
    applyTheme(savedPreferences);

    // Set up media query listeners for system preferences
    if (typeof window !== 'undefined') {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

      const handleDarkModeChange = (e: MediaQueryListEvent) => {
        setSystemPrefersDark(e.matches);
        if (preferences().mode === 'auto') {
          applyTheme(preferences());
        }
      };

      const handleReducedMotionChange = (e: MediaQueryListEvent) => {
        setSystemPrefersReducedMotion(e.matches);
        applyTheme(preferences());
      };

      const handleHighContrastChange = (e: MediaQueryListEvent) => {
        setSystemPrefersHighContrast(e.matches);
        applyTheme(preferences());
      };

      darkModeQuery.addEventListener('change', handleDarkModeChange);
      reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
      highContrastQuery.addEventListener('change', handleHighContrastChange);

      // Cleanup listeners
      return () => {
        darkModeQuery.removeEventListener('change', handleDarkModeChange);
        reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
        highContrastQuery.removeEventListener('change', handleHighContrastChange);
      };
    }
  });

  // Apply theme when preferences change
  createEffect(() => {
    const currentPrefs = preferences();
    applyTheme(currentPrefs);
    saveThemePreferences(currentPrefs);
  });

  // Theme actions
  const setMode = (mode: ThemeMode) => {
    setPreferences(prev => ({ ...prev, mode }));
  };

  const setCulturalTheme = (theme: CulturalTheme) => {
    setPreferences(prev => ({ ...prev, culturalTheme: theme }));
  };

  const setAccessibilityTheme = (theme: AccessibilityTheme) => {
    setPreferences(prev => ({ ...prev, accessibilityTheme: theme }));
  };

  const setFontSize = (size: FontSize) => {
    setPreferences(prev => ({ ...prev, fontSize: size }));
  };

  const setAnimations = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, animations: enabled }));
  };

  const setHighContrast = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, highContrast: enabled }));
  };

  // Utility functions
  const isDark = () => {
    const prefs = preferences();
    if (prefs.mode === 'auto') {
      return systemPrefersDark();
    }
    return prefs.mode === 'dark';
  };

  const isLight = () => {
    const prefs = preferences();
    if (prefs.mode === 'auto') {
      return !systemPrefersDark();
    }
    return prefs.mode === 'light';
  };

  const isAuto = () => preferences().mode === 'auto';

  const getEffectiveMode = (): 'light' | 'dark' => {
    const prefs = preferences();
    if (prefs.mode === 'auto') {
      return systemPrefersDark() ? 'dark' : 'light';
    }
    return prefs.mode;
  };

  return {
    // Current theme state
    currentTheme: preferences,

    // Theme actions
    setMode,
    setCulturalTheme,
    setAccessibilityTheme,
    setFontSize,
    setAnimations,
    setHighContrast,

    // Utility functions
    isDark,
    isLight,
    isAuto,
    getEffectiveMode,

    // System preferences
    systemPrefersDark,
    systemPrefersReducedMotion,
    systemPrefersHighContrast,
  };
};
