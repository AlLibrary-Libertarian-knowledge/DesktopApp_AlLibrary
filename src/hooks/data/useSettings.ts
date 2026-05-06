import { createSignal, createEffect } from 'solid-js';

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  culturalPreferences: string[];
  showCulturalContext: boolean;
  enableEducationalResources: boolean;
  culturalDisplayMode: 'full' | 'minimal' | 'hidden';
  enableAnonymousMode: boolean;
  enableTorRouting: boolean;
  shareDocumentsWithPeers: boolean;
  maxPeerConnections: number;
  defaultDocumentView: 'grid' | 'list' | 'detailed';
  autoSaveDocuments: boolean;
  documentCacheSize: number;
  enableDocumentPreview: boolean;
  enableNetworkSearch: boolean;
  searchTimeout: number;
  maxSearchResults: number;
  searchHistoryEnabled: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigationOnly: boolean;
  bandwidthLimit: number;
  enableOfflineMode: boolean;
  syncFrequency: number;
  peerDiscoveryEnabled: boolean;
  debugMode: boolean;
  performanceMonitoring: boolean;
  errorReporting: boolean;
  betaFeatures: boolean;
}

export interface SettingsCategory {
  id: string;
  name: string;
  description: string;
  settings: SettingSectionConfig[];
}

export interface SettingSectionConfig {
  id: string;
  name: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'multiselect' | 'range';
  value: any;
  defaultValue: any;
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  culturalContext?: {
    level: number;
    description: string;
    educationalNote: string;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  language: 'en',
  fontSize: 'medium',
  culturalPreferences: [],
  showCulturalContext: true,
  enableEducationalResources: true,
  culturalDisplayMode: 'full',
  enableAnonymousMode: false,
  enableTorRouting: false,
  shareDocumentsWithPeers: true,
  maxPeerConnections: 50,
  defaultDocumentView: 'grid',
  autoSaveDocuments: true,
  documentCacheSize: 1000,
  enableDocumentPreview: true,
  enableNetworkSearch: true,
  searchTimeout: 30000,
  maxSearchResults: 100,
  searchHistoryEnabled: true,
  highContrastMode: false,
  reducedMotion: false,
  screenReaderOptimized: false,
  keyboardNavigationOnly: false,
  bandwidthLimit: 1000,
  enableOfflineMode: true,
  syncFrequency: 300000,
  peerDiscoveryEnabled: true,
  debugMode: false,
  performanceMonitoring: false,
  errorReporting: true,
  betaFeatures: false,
};

export const useSettings = () => {
  const [settings, setSettings] = createSignal<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = createSignal(false);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await new Promise(resolve => window.setTimeout(resolve, 500));

      const storedSettings = window.localStorage.getItem('app-settings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await new Promise(resolve => window.setTimeout(resolve, 300));

      window.localStorage.setItem('app-settings', JSON.stringify(settings()));

      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const resetToDefaults = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    setHasUnsavedChanges(true);
  };

  const resetCategoryToDefaults = (category: keyof AppSettings) => {
    setSettings(prev => ({ ...prev, [category]: DEFAULT_SETTINGS[category] }));
    setHasUnsavedChanges(true);
  };

  const getSettingsCategories = (): SettingsCategory[] => {
    return [
      {
        id: 'general',
        name: 'General',
        description: 'Basic application preferences',
        settings: [
          {
            id: 'theme',
            name: 'Theme',
            type: 'select',
            value: settings().theme,
            defaultValue: DEFAULT_SETTINGS.theme,
            options: [
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'auto', label: 'Auto (System)' },
            ],
            description: 'Choose your preferred color theme',
          },
        ],
      },
      {
        id: 'cultural',
        name: 'Cultural Information',
        description: 'Cultural context and educational resources (Information Only)',
        settings: [
          {
            id: 'showCulturalContext',
            name: 'Show Cultural Context',
            type: 'boolean',
            value: settings().showCulturalContext,
            defaultValue: DEFAULT_SETTINGS.showCulturalContext,
            description: 'Display cultural information and educational resources',
            culturalContext: {
              level: 1,
              description:
                'This setting controls the display of cultural information for educational purposes only',
              educationalNote:
                'Cultural information is always informational and never restricts access to content',
            },
          },
        ],
      },
    ];
  };

  createEffect(() => {
    let timeoutId: number | undefined;
    if (hasUnsavedChanges()) {
      timeoutId = window.setTimeout(() => {
        saveSettings().catch(console.error);
      }, 1000);
    }
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  });

  createEffect(() => {
    loadSettings();
  });

  return {
    settings,
    isLoading,
    error,
    hasUnsavedChanges,
    loadSettings,
    saveSettings,
    updateSetting,
    updateSettings,
    resetToDefaults,
    resetCategoryToDefaults,
    getSettingsCategories,
  };
};
