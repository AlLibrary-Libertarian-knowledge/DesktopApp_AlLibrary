import { createSignal, createEffect } from 'solid-js';

// Declare browser APIs for TypeScript
declare global {
  interface Window {
    localStorage: Storage;
    addEventListener(type: 'storage', listener: (e: StorageEvent) => void): void;
    removeEventListener(type: 'storage', listener: (e: StorageEvent) => void): void;
  }

  interface Storage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  }

  interface StorageEvent extends Event {
    key: string | null;
    newValue: string | null;
    oldValue: string | null;
  }

  const localStorage: Storage;
}

export interface LocalStorageOptions {
  /** Default value if key doesn't exist */
  defaultValue?: any;
  /** Whether to serialize/deserialize as JSON */
  serialize?: boolean;
  /** Whether to sync across tabs */
  syncAcrossTabs?: boolean;
  /** Custom serializer function */
  serializer?: {
    read: (value: string) => any;
    write: (value: any) => string;
  };
  /** Validation function for stored values */
  validator?: (value: any) => boolean;
  /** Whether to include cultural context in storage */
  includeCulturalContext?: boolean;
}

export interface StorageWithCulturalContext<T> {
  value: T;
  culturalContext?: {
    timestamp: number;
    userCulturalPreferences: string[];
    educationalNotesAccessed: string[];
    informationSourcesViewed: string[];
  };
}

export const useLocalStorage = <T = any>(key: string, options: LocalStorageOptions = {}) => {
  const {
    defaultValue,
    serialize = true,
    syncAcrossTabs = false,
    serializer,
    validator,
    includeCulturalContext = false,
  } = options;

  // Default serializer
  const defaultSerializer = {
    read: (value: string) => {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    },
    write: (value: any) => JSON.stringify(value),
  };

  const actualSerializer = serializer || defaultSerializer;

  // Read initial value from localStorage
  const readFromStorage = (): T => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }

      const parsedValue = serialize ? actualSerializer.read(item) : item;

      // Handle cultural context storage format
      if (
        includeCulturalContext &&
        parsedValue &&
        typeof parsedValue === 'object' &&
        'value' in parsedValue
      ) {
        const contextData = parsedValue as StorageWithCulturalContext<T>;
        return contextData.value;
      }

      // Validate if validator is provided
      if (validator && !validator(parsedValue)) {
        console.warn(`Invalid value for key "${key}", using default value`);
        return defaultValue;
      }

      return parsedValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  };

  // Write value to localStorage
  const writeToStorage = (value: T) => {
    try {
      let valueToStore: any = value;

      // Add cultural context if enabled
      if (includeCulturalContext) {
        const contextData: StorageWithCulturalContext<T> = {
          value,
          culturalContext: {
            timestamp: Date.now(),
            userCulturalPreferences: getUserCulturalPreferences(),
            educationalNotesAccessed: getEducationalNotesAccessed(),
            informationSourcesViewed: getInformationSourcesViewed(),
          },
        };
        valueToStore = contextData;
      }

      const serializedValue = serialize ? actualSerializer.write(valueToStore) : valueToStore;
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  };

  // Helper functions for cultural context
  const getUserCulturalPreferences = (): string[] => {
    try {
      const prefs = localStorage.getItem('user-cultural-preferences');
      return prefs ? JSON.parse(prefs) : [];
    } catch {
      return [];
    }
  };

  const getEducationalNotesAccessed = (): string[] => {
    try {
      const notes = localStorage.getItem('educational-notes-accessed');
      return notes ? JSON.parse(notes) : [];
    } catch {
      return [];
    }
  };

  const getInformationSourcesViewed = (): string[] => {
    try {
      const sources = localStorage.getItem('information-sources-viewed');
      return sources ? JSON.parse(sources) : [];
    } catch {
      return [];
    }
  };

  // Create reactive signal
  const [storedValue, setStoredValue] = createSignal<T>(readFromStorage());
  const [error, setError] = createSignal<string | null>(null);

  // Update localStorage when signal changes
  createEffect(() => {
    try {
      writeToStorage(storedValue());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Storage error');
    }
  });

  // Listen for storage changes from other tabs
  createEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = serialize ? actualSerializer.read(e.newValue) : e.newValue;

          // Handle cultural context format
          if (
            includeCulturalContext &&
            newValue &&
            typeof newValue === 'object' &&
            'value' in newValue
          ) {
            const contextData = newValue as StorageWithCulturalContext<T>;
            setStoredValue(() => contextData.value);
          } else {
            setStoredValue(() => newValue);
          }
        } catch (error) {
          console.error(`Error syncing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  });

  // Update value function
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const newValue =
        typeof value === 'function' ? (value as (prev: T) => T)(storedValue()) : value;

      // Validate if validator is provided
      if (validator && !validator(newValue)) {
        throw new Error(`Invalid value for key "${key}"`);
      }

      setStoredValue(() => newValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation error');
      throw err;
    }
  };

  // Remove value from storage
  const removeValue = () => {
    try {
      localStorage.removeItem(key);
      setStoredValue(() => defaultValue);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove error');
      throw err;
    }
  };

  // Get cultural context for current value
  const getCulturalContext = () => {
    if (!includeCulturalContext) return null;

    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;

      const parsedValue = serialize ? actualSerializer.read(item) : item;
      if (parsedValue && typeof parsedValue === 'object' && 'culturalContext' in parsedValue) {
        const contextData = parsedValue as StorageWithCulturalContext<T>;
        return contextData.culturalContext;
      }
    } catch (error) {
      console.error(`Error reading cultural context for key "${key}":`, error);
    }

    return null;
  };

  // Update cultural preferences (information only)
  const updateCulturalPreferences = (preferences: string[]) => {
    try {
      localStorage.setItem('user-cultural-preferences', JSON.stringify(preferences));
      // Re-store current value with updated cultural context
      if (includeCulturalContext) {
        writeToStorage(storedValue());
      }
    } catch (error) {
      console.error('Error updating cultural preferences:', error);
    }
  };

  // Track educational resource access (information only)
  const trackEducationalAccess = (resourceId: string) => {
    try {
      const accessed = getEducationalNotesAccessed();
      if (!accessed.includes(resourceId)) {
        const updated = [...accessed, resourceId];
        localStorage.setItem('educational-notes-accessed', JSON.stringify(updated));

        // Re-store current value with updated cultural context
        if (includeCulturalContext) {
          writeToStorage(storedValue());
        }
      }
    } catch (error) {
      console.error('Error tracking educational access:', error);
    }
  };

  // Track information source viewing (information only)
  const trackSourceViewing = (sourceId: string) => {
    try {
      const viewed = getInformationSourcesViewed();
      if (!viewed.includes(sourceId)) {
        const updated = [...viewed, sourceId];
        localStorage.setItem('information-sources-viewed', JSON.stringify(updated));

        // Re-store current value with updated cultural context
        if (includeCulturalContext) {
          writeToStorage(storedValue());
        }
      }
    } catch (error) {
      console.error('Error tracking source viewing:', error);
    }
  };

  return {
    /** Current stored value */
    value: storedValue,
    /** Set new value */
    setValue,
    /** Remove value from storage */
    removeValue,
    /** Storage error if any */
    error,
    /** Get cultural context for current value */
    getCulturalContext,
    /** Update user cultural preferences (information only) */
    updateCulturalPreferences,
    /** Track educational resource access (information only) */
    trackEducationalAccess,
    /** Track information source viewing (information only) */
    trackSourceViewing,
  };
};
