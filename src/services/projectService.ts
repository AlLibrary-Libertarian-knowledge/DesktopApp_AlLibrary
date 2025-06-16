import { invoke } from '@tauri-apps/api/core';
import { homeDir } from '@tauri-apps/api/path';
import type {
  ProjectSettings,
  FolderStructure,
  ProjectFolderInfo,
  FolderValidationResult,
  AppSettings,
} from '../types/Settings';
import type { Project, ProjectConfig, StorageInfo } from '../types/core';

export interface IProjectService {
  // Project CRUD operations
  createProject(project: Partial<Project>): Promise<Project>;
  getProject(id: number): Promise<Project>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project>;
  deleteProject(id: number): Promise<boolean>;
  listProjects(): Promise<Project[]>;

  // Directory and storage management
  initializeProjectDirectory(
    path: string
  ): Promise<{ success: boolean; directories_created: string[] }>;
  getProjectStorageInfo(projectId: number): Promise<StorageInfo>;
  validateProjectPath(
    path: string
  ): Promise<{ accessible: boolean; writable: boolean; exists: boolean; permissions: string }>;
  migrateProjectData(
    sourceProjectId: number,
    targetProjectId: number
  ): Promise<{ success: boolean; files_migrated: number; migration_time: number }>;

  // Configuration management
  setProjectConfig(projectId: number, config: ProjectConfig): Promise<ProjectConfig>;
  getProjectConfig(projectId: number): Promise<ProjectConfig>;

  // P2P and decentralization methods
  configureP2P(projectId: number, config: any): Promise<any>;
  prepareOfflineSync(projectId: number): Promise<any>;

  // Legacy folder management (for compatibility with existing code)
  selectProjectFolder(): Promise<string | null>;
  validateProjectFolder(path: string): Promise<FolderValidationResult>;
  initializeProjectFolder(path: string): Promise<boolean>;
  getProjectInfo(path: string): Promise<ProjectFolderInfo>;
  loadSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
  resetToDefaults(): Promise<AppSettings>;
  createFolderStructure(basePath: string): Promise<FolderStructure>;
  validateFolderStructure(structure: FolderStructure): Promise<boolean>;
  repairFolderStructure(structure: FolderStructure): Promise<boolean>;
}

class ProjectServiceImpl implements IProjectService {
  private currentSettings: AppSettings | null = null;
  private defaultProjectName = 'AlLibrary';

  // Project CRUD operations
  async createProject(project: Partial<Project>): Promise<Project> {
    try {
      return await invoke<Project>('create_project', { project });
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error; // Re-throw the original error to preserve the error message
    }
  }

  async getProject(id: number): Promise<Project> {
    try {
      return await invoke<Project>('get_project', { id });
    } catch (error) {
      console.error(`Failed to get project ${id}:`, error);
      throw new Error('Unable to load project');
    }
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project> {
    try {
      return await invoke<Project>('update_project', { id, updates });
    } catch (error) {
      console.error(`Failed to update project ${id}:`, error);
      throw new Error('Unable to update project');
    }
  }

  async deleteProject(id: number): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_project', { id });
    } catch (error) {
      console.error(`Failed to delete project ${id}:`, error);
      throw new Error('Unable to delete project');
    }
  }

  async listProjects(): Promise<Project[]> {
    try {
      return await invoke<Project[]>('list_projects');
    } catch (error) {
      console.error('Failed to list projects:', error);
      throw new Error('Unable to load projects');
    }
  }

  // Directory and storage management
  async initializeProjectDirectory(
    path: string
  ): Promise<{ success: boolean; directories_created: string[] }> {
    try {
      return await invoke('initialize_project_directory', { path });
    } catch (error) {
      console.error('Failed to initialize project directory:', error);
      throw new Error('Unable to initialize project directory');
    }
  }

  async getProjectStorageInfo(projectId: number): Promise<StorageInfo> {
    try {
      return await invoke<StorageInfo>('get_project_storage_info', { project_id: projectId });
    } catch (error) {
      console.error(`Failed to get storage info for project ${projectId}:`, error);
      throw error; // Re-throw the original error to preserve the error message
    }
  }

  async validateProjectPath(
    path: string
  ): Promise<{ accessible: boolean; writable: boolean; exists: boolean; permissions: string }> {
    try {
      return await invoke('validate_project_path', { path });
    } catch (error) {
      console.error('Failed to validate project path:', error);
      throw error; // Re-throw the original error to preserve the error message
    }
  }

  async migrateProjectData(
    sourceProjectId: number,
    targetProjectId: number
  ): Promise<{ success: boolean; files_migrated: number; migration_time: number }> {
    try {
      return await invoke('migrate_project_data', {
        source_project_id: sourceProjectId,
        target_project_id: targetProjectId,
      });
    } catch (error) {
      console.error('Failed to migrate project data:', error);
      throw new Error('Unable to migrate project data');
    }
  }

  // Configuration management
  async setProjectConfig(projectId: number, config: ProjectConfig): Promise<ProjectConfig> {
    try {
      return await invoke<ProjectConfig>('set_project_config', { project_id: projectId, config });
    } catch (error) {
      console.error(`Failed to set config for project ${projectId}:`, error);
      throw new Error('Unable to set project configuration');
    }
  }

  async getProjectConfig(projectId: number): Promise<ProjectConfig> {
    try {
      return await invoke<ProjectConfig>('get_project_config', { project_id: projectId });
    } catch (error) {
      console.error(`Failed to get config for project ${projectId}:`, error);
      throw new Error('Unable to load project configuration');
    }
  }

  // Legacy methods for compatibility with existing code
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

  // P2P and decentralization methods
  async configureP2P(projectId: number, config: any): Promise<any> {
    try {
      return await invoke('configure_project_p2p', {
        project_id: projectId,
        config,
      });
    } catch (error) {
      console.error('Failed to configure P2P:', error);
      throw new Error('Unable to configure P2P networking');
    }
  }

  async prepareOfflineSync(projectId: number): Promise<any> {
    try {
      return await invoke('prepare_offline_sync', {
        project_id: projectId,
      });
    } catch (error) {
      console.error('Failed to prepare offline sync:', error);
      throw new Error('Unable to prepare offline synchronization');
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

// Export the class for testing
export { ProjectServiceImpl as ProjectService };
