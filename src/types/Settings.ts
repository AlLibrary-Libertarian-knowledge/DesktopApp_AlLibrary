// Settings and configuration types for AlLibrary
export interface ProjectSettings {
  // Project folder configuration
  projectFolderPath: string;
  defaultProjectName: string;
  autoCreateSubfolders: boolean;

  // Search configuration
  searchIndexPath: string;
  enableFullTextSearch: boolean;
  searchResultsLimit: number;
  searchHistoryLimit: number;

  // Cultural search settings
  enableCulturalFiltering: boolean;
  defaultCulturalSensitivityLevel: number;
  showEducationalContext: boolean;

  // Performance settings
  indexUpdateInterval: number; // minutes
  searchTimeout: number; // milliseconds
  cacheSearchResults: boolean;
}

export interface FolderStructure {
  // Main project folders
  documentsFolder: string;
  indexFolder: string;
  metadataFolder: string;
  cacheFolder: string;
  backupFolder: string;

  // Cultural organization folders
  culturalContextsFolder: string;
  educationalResourcesFolder: string;
  communityContentFolder: string;
}

export interface SearchSettings {
  // Search behavior
  caseSensitive: boolean;
  includeMetadata: boolean;
  includeTags: boolean;
  includeContent: boolean;

  // Cultural search settings
  respectCulturalBoundaries: boolean;
  showCulturalEducation: boolean;
  enableCommunityValidation: boolean;

  // Performance settings
  maxSearchResults: number;
  searchDebounceMs: number;
  enableSearchSuggestions: boolean;
}

export interface AppSettings {
  // Project configuration
  project: ProjectSettings;
  folderStructure: FolderStructure;
  search: SearchSettings;

  // Application settings
  theme: 'light' | 'dark' | 'auto';
  language: string;
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReaderOptimized: boolean;
  };

  // Cultural settings
  cultural: {
    preferredCulturalContexts: string[];
    educationalLevel: 'beginner' | 'intermediate' | 'advanced';
    communityMemberships: string[];
  };
}

export interface ProjectFolderInfo {
  path: string;
  name: string;
  size: number;
  documentsCount: number;
  lastModified: Date;
  isValid: boolean;
  hasPermissions: boolean;
}

export interface FolderValidationResult {
  valid: boolean;
  path: string;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  requiredPermissions: string[];
}
