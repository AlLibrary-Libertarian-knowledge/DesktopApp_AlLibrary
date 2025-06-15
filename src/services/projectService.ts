import { invoke } from '@tauri-apps/api/core';
import { homeDir } from '@tauri-apps/api/path';
import type {
  ProjectSettings,
  FolderStructure,
  ProjectFolderInfo,
  FolderValidationResult,
  AppSettings,
} from '../types/Settings';

export interface ProjectService {
  // Project folder management
  selectProjectFolder(): Promise<string | null>;
  validateProjectFolder(path: string): Promise<FolderValidationResult>;
  initializeProjectFolder(path: string): Promise<boolean>;
  getProjectInfo(path: string): Promise<ProjectFolderInfo>;

  // Settings management
  loadSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
  resetToDefaults(): Promise<AppSettings>;

  // Folder structure management
  createFolderStructure(basePath: string): Promise<FolderStructure>;
  validateFolderStructure(structure: FolderStructure): Promise<boolean>;
  repairFolderStructure(structure: FolderStructure): Promise<boolean>;
}

class ProjectServiceImpl implements ProjectService {
  private currentSettings: AppSettings | null = null;
  private defaultProjectName = 'AlLibrary';

  async selectProjectFolder(): Promise<string | null> {
    try {
      const selectedPath = await invoke<string | null>('select_project_folder');

      if (selectedPath) {
        // Validate the selected folder
        const validation = await this.validateProjectFolder(selectedPath);

        if (validation.valid) {
          return selectedPath;
        } else {
          console.warn('Selected folder validation failed:', validation.errors);
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to select project folder:', error);
      return null;
    }
  }

  async validateProjectFolder(path: string): Promise<FolderValidationResult> {
    try {
      return await invoke<FolderValidationResult>('validate_project_folder', { path });
    } catch (error) {
      console.error('Failed to validate project folder:', error);
      return {
        valid: false,
        path,
        errors: ['Failed to validate folder'],
        warnings: [],
        suggestions: ['Try selecting a different folder'],
        requiredPermissions: ['read', 'write'],
      };
    }
  }

  async initializeProjectFolder(path: string): Promise<boolean> {
    try {
      // Create the main project folder if it doesn't exist
      const projectPath = `${path}/${this.defaultProjectName}`;

      const initialized = await invoke<boolean>('initialize_project_folder', {
        projectPath,
      });

      if (initialized) {
        // Create the folder structure
        const folderStructure = await this.createFolderStructure(projectPath);

        // Update settings with new project path
        const settings = await this.loadSettings();
        settings.project.projectFolderPath = projectPath;
        settings.folderStructure = folderStructure;

        await this.saveSettings(settings);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to initialize project folder:', error);
      return false;
    }
  }

  async getProjectInfo(path: string): Promise<ProjectFolderInfo> {
    try {
      return await invoke<ProjectFolderInfo>('get_project_info', { path });
    } catch (error) {
      console.error('Failed to get project info:', error);
      return {
        path,
        name: 'Unknown',
        size: 0,
        documentsCount: 0,
        lastModified: new Date(),
        isValid: false,
        hasPermissions: false,
      };
    }
  }

  async loadSettings(): Promise<AppSettings> {
    try {
      if (this.currentSettings) {
        return this.currentSettings;
      }

      const settings = await invoke<AppSettings>('load_app_settings');
      this.currentSettings = settings;
      return settings;
    } catch (error) {
      console.error('Failed to load settings, using defaults:', error);
      return await this.getDefaultSettings();
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await invoke('save_app_settings', { settings });
      this.currentSettings = settings;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  async resetToDefaults(): Promise<AppSettings> {
    const defaultSettings = await this.getDefaultSettings();
    await this.saveSettings(defaultSettings);
    return defaultSettings;
  }

  async createFolderStructure(basePath: string): Promise<FolderStructure> {
    const structure: FolderStructure = {
      documentsFolder: `${basePath}/documents`,
      indexFolder: `${basePath}/search_index`,
      metadataFolder: `${basePath}/metadata`,
      cacheFolder: `${basePath}/cache`,
      backupFolder: `${basePath}/backups`,
      culturalContextsFolder: `${basePath}/cultural_contexts`,
      educationalResourcesFolder: `${basePath}/educational_resources`,
      communityContentFolder: `${basePath}/community_content`,
    };

    try {
      await invoke('create_folder_structure', { structure });
      return structure;
    } catch (error) {
      console.error('Failed to create folder structure:', error);
      throw error;
    }
  }

  async validateFolderStructure(structure: FolderStructure): Promise<boolean> {
    try {
      return await invoke<boolean>('validate_folder_structure', { structure });
    } catch (error) {
      console.error('Failed to validate folder structure:', error);
      return false;
    }
  }

  async repairFolderStructure(structure: FolderStructure): Promise<boolean> {
    try {
      return await invoke<boolean>('repair_folder_structure', { structure });
    } catch (error) {
      console.error('Failed to repair folder structure:', error);
      return false;
    }
  }

  private async getDefaultSettings(): Promise<AppSettings> {
    try {
      const homeDirPath = await homeDir();
      const defaultProjectPath = `${homeDirPath}${this.defaultProjectName}`;

      return {
        project: {
          projectFolderPath: defaultProjectPath,
          defaultProjectName: this.defaultProjectName,
          autoCreateSubfolders: true,
          searchIndexPath: `${defaultProjectPath}/search_index`,
          enableFullTextSearch: true,
          searchResultsLimit: 100,
          searchHistoryLimit: 50,
          enableCulturalFiltering: true,
          defaultCulturalSensitivityLevel: 1,
          showEducationalContext: true,
          indexUpdateInterval: 30,
          searchTimeout: 5000,
          cacheSearchResults: true,
        },
        folderStructure: {
          documentsFolder: `${defaultProjectPath}/documents`,
          indexFolder: `${defaultProjectPath}/search_index`,
          metadataFolder: `${defaultProjectPath}/metadata`,
          cacheFolder: `${defaultProjectPath}/cache`,
          backupFolder: `${defaultProjectPath}/backups`,
          culturalContextsFolder: `${defaultProjectPath}/cultural_contexts`,
          educationalResourcesFolder: `${defaultProjectPath}/educational_resources`,
          communityContentFolder: `${defaultProjectPath}/community_content`,
        },
        search: {
          caseSensitive: false,
          includeMetadata: true,
          includeTags: true,
          includeContent: true,
          respectCulturalBoundaries: true,
          showCulturalEducation: true,
          enableCommunityValidation: true,
          maxSearchResults: 100,
          searchDebounceMs: 300,
          enableSearchSuggestions: true,
        },
        theme: 'auto',
        language: 'en',
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          screenReaderOptimized: false,
        },
        cultural: {
          preferredCulturalContexts: [],
          educationalLevel: 'beginner',
          communityMemberships: [],
        },
      };
    } catch (error) {
      console.error('Failed to get home directory, using fallback:', error);
      const fallbackPath = `/AlLibrary`;

      return {
        project: {
          projectFolderPath: fallbackPath,
          defaultProjectName: this.defaultProjectName,
          autoCreateSubfolders: true,
          searchIndexPath: `${fallbackPath}/search_index`,
          enableFullTextSearch: true,
          searchResultsLimit: 100,
          searchHistoryLimit: 50,
          enableCulturalFiltering: true,
          defaultCulturalSensitivityLevel: 1,
          showEducationalContext: true,
          indexUpdateInterval: 30,
          searchTimeout: 5000,
          cacheSearchResults: true,
        },
        folderStructure: {
          documentsFolder: `${fallbackPath}/documents`,
          indexFolder: `${fallbackPath}/search_index`,
          metadataFolder: `${fallbackPath}/metadata`,
          cacheFolder: `${fallbackPath}/cache`,
          backupFolder: `${fallbackPath}/backups`,
          culturalContextsFolder: `${fallbackPath}/cultural_contexts`,
          educationalResourcesFolder: `${fallbackPath}/educational_resources`,
          communityContentFolder: `${fallbackPath}/community_content`,
        },
        search: {
          caseSensitive: false,
          includeMetadata: true,
          includeTags: true,
          includeContent: true,
          respectCulturalBoundaries: true,
          showCulturalEducation: true,
          enableCommunityValidation: true,
          maxSearchResults: 100,
          searchDebounceMs: 300,
          enableSearchSuggestions: true,
        },
        theme: 'auto',
        language: 'en',
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          screenReaderOptimized: false,
        },
        cultural: {
          preferredCulturalContexts: [],
          educationalLevel: 'beginner',
          communityMemberships: [],
        },
      };
    }
  }
}

// Export singleton instance
export const projectService = new ProjectServiceImpl();
