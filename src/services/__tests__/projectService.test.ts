import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from '../projectService';
import type { Project, ProjectConfig, StorageInfo } from '../../types/core';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(() => {
    service = new ProjectService();
    mockInvoke.mockClear();
  });

  describe('Anti-Censorship Project Management', () => {
    it('creates projects without cultural content restrictions', async () => {
      const culturalProject: Partial<Project> = {
        name: 'Indigenous Knowledge Archive',
        description: 'Traditional knowledge preservation project',
        cultural_focus: 'indigenous_heritage',
        sensitive_content: true,
        path: '/path/to/cultural/archive',
      };

      mockInvoke.mockResolvedValue({ id: 1, ...culturalProject });

      const result = await service.createProject(culturalProject);

      expect(result).toBeDefined();
      expect(result.cultural_focus).toBe('indigenous_heritage');
      expect(result.sensitive_content).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('create_project', {
        project: culturalProject,
      });
    });

    it('supports projects with alternative perspectives', async () => {
      const alternativeProject: Partial<Project> = {
        name: 'Alternative History Archive',
        description: 'Challenging mainstream historical narratives',
        alternative_perspectives: true,
        controversial_content: true,
        path: '/path/to/alternative/archive',
      };

      mockInvoke.mockResolvedValue({ id: 1, ...alternativeProject });

      const result = await service.createProject(alternativeProject);

      expect(result.alternative_perspectives).toBe(true);
      expect(result.controversial_content).toBe(true);
    });

    it('enables offline-first project configuration', async () => {
      const offlineProject: Partial<Project> = {
        name: 'Offline Research Project',
        description: 'Project designed for offline/restricted network access',
        offline_mode: true,
        tor_support: true,
        p2p_enabled: true,
        path: '/path/to/offline/project',
      };

      mockInvoke.mockResolvedValue({ id: 1, ...offlineProject });

      const result = await service.createProject(offlineProject);

      expect(result.offline_mode).toBe(true);
      expect(result.tor_support).toBe(true);
      expect(result.p2p_enabled).toBe(true);
    });

    it('preserves community-controlled project settings', async () => {
      const communityProject: Partial<Project> = {
        name: 'Community Knowledge Hub',
        description: 'Community-controlled information sharing',
        community_controlled: true,
        decentralized_governance: true,
        information_sovereignty: true,
        path: '/path/to/community/project',
      };

      mockInvoke.mockResolvedValue({ id: 1, ...communityProject });

      const result = await service.createProject(communityProject);

      expect(result.community_controlled).toBe(true);
      expect(result.decentralized_governance).toBe(true);
      expect(result.information_sovereignty).toBe(true);
    });
  });

  describe('Core Project Management', () => {
    it('creates new projects with proper structure', async () => {
      const newProject: Partial<Project> = {
        name: 'Research Project',
        description: 'Academic research collection',
        path: '/home/user/research',
      };

      const expectedResult = {
        id: 1,
        ...newProject,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockInvoke.mockResolvedValue(expectedResult);

      const result = await service.createProject(newProject);

      expect(result).toEqual(expectedResult);
      expect(mockInvoke).toHaveBeenCalledWith('create_project', {
        project: newProject,
      });
    });

    it('retrieves project by ID', async () => {
      const projectId = 123;
      const expectedProject = {
        id: projectId,
        name: 'Test Project',
        description: 'Test description',
        path: '/test/path',
      };

      mockInvoke.mockResolvedValue(expectedProject);

      const result = await service.getProject(projectId);

      expect(result).toEqual(expectedProject);
      expect(mockInvoke).toHaveBeenCalledWith('get_project', { id: projectId });
    });

    it('updates project configuration', async () => {
      const projectId = 1;
      const updates: Partial<Project> = {
        name: 'Updated Project Name',
        description: 'Updated description',
        path: '/new/path',
      };

      const expectedResult = { id: projectId, ...updates };
      mockInvoke.mockResolvedValue(expectedResult);

      const result = await service.updateProject(projectId, updates);

      expect(result).toEqual(expectedResult);
      expect(mockInvoke).toHaveBeenCalledWith('update_project', {
        id: projectId,
        updates,
      });
    });

    it('deletes projects safely', async () => {
      const projectId = 1;
      mockInvoke.mockResolvedValue(true);

      const result = await service.deleteProject(projectId);

      expect(result).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('delete_project', { id: projectId });
    });

    it('lists all projects', async () => {
      const expectedProjects = [
        { id: 1, name: 'Project 1', path: '/path1' },
        { id: 2, name: 'Project 2', path: '/path2' },
      ];

      mockInvoke.mockResolvedValue(expectedProjects);

      const result = await service.listProjects();

      expect(result).toEqual(expectedProjects);
      expect(mockInvoke).toHaveBeenCalledWith('list_projects');
    });
  });

  describe('Storage and Directory Management', () => {
    it('initializes project directory structure', async () => {
      const projectPath = '/home/user/new-project';

      mockInvoke.mockResolvedValue({
        success: true,
        directories_created: ['books', 'collections', 'metadata', 'exports', 'cache'],
      });

      const result = await service.initializeProjectDirectory(projectPath);

      expect(result.success).toBe(true);
      expect(result.directories_created).toContain('books');
      expect(mockInvoke).toHaveBeenCalledWith('initialize_project_directory', {
        path: projectPath,
      });
    });

    it('retrieves storage information for project', async () => {
      const projectId = 1;
      const expectedStorageInfo: StorageInfo = {
        total_size: 1073741824, // 1GB
        used_size: 536870912, // 512MB
        available_size: 536870912, // 512MB
        file_count: 150,
        directory_count: 8,
      };

      mockInvoke.mockResolvedValue(expectedStorageInfo);

      const result = await service.getProjectStorageInfo(projectId);

      expect(result).toEqual(expectedStorageInfo);
      expect(mockInvoke).toHaveBeenCalledWith('get_project_storage_info', {
        project_id: projectId,
      });
    });

    it('validates project path accessibility', async () => {
      const projectPath = '/home/user/test-project';

      mockInvoke.mockResolvedValue({
        accessible: true,
        writable: true,
        exists: true,
        permissions: 'rwx',
      });

      const result = await service.validateProjectPath(projectPath);

      expect(result.accessible).toBe(true);
      expect(result.writable).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('validate_project_path', {
        path: projectPath,
      });
    });

    it('handles directory migration between projects', async () => {
      const sourceProjectId = 1;
      const targetProjectId = 2;

      mockInvoke.mockResolvedValue({
        success: true,
        files_migrated: 25,
        migration_time: 1500, // ms
      });

      const result = await service.migrateProjectData(sourceProjectId, targetProjectId);

      expect(result.success).toBe(true);
      expect(result.files_migrated).toBe(25);
      expect(mockInvoke).toHaveBeenCalledWith('migrate_project_data', {
        source_project_id: sourceProjectId,
        target_project_id: targetProjectId,
      });
    });
  });

  describe('Project Configuration Management', () => {
    it('sets project configuration', async () => {
      const projectId = 1;
      const config: ProjectConfig = {
        auto_backup: true,
        backup_interval: 3600, // 1 hour
        max_file_size: 104857600, // 100MB
        allowed_formats: ['PDF', 'EPUB', 'TXT'],
        cultural_settings: {
          display_warnings: true,
          provide_context: true,
          restrict_access: false, // Anti-censorship principle
        },
        p2p_settings: {
          enabled: true,
          tor_support: true,
          peer_discovery: true,
        },
      };

      mockInvoke.mockResolvedValue(config);

      const result = await service.setProjectConfig(projectId, config);

      expect(result).toEqual(config);
      expect(result.cultural_settings.restrict_access).toBe(false);
      expect(mockInvoke).toHaveBeenCalledWith('set_project_config', {
        project_id: projectId,
        config,
      });
    });

    it('retrieves project configuration', async () => {
      const projectId = 1;
      const expectedConfig: ProjectConfig = {
        auto_backup: false,
        max_file_size: 52428800, // 50MB
        allowed_formats: ['PDF', 'EPUB'],
        cultural_settings: {
          display_warnings: true,
          provide_context: true,
          restrict_access: false,
        },
      };

      mockInvoke.mockResolvedValue(expectedConfig);

      const result = await service.getProjectConfig(projectId);

      expect(result).toEqual(expectedConfig);
      expect(mockInvoke).toHaveBeenCalledWith('get_project_config', {
        project_id: projectId,
      });
    });
  });

  describe('Performance Requirements', () => {
    it('completes project operations within 2s', async () => {
      const startTime = Date.now();

      mockInvoke.mockImplementation(
        () =>
          new Promise(resolve => setTimeout(() => resolve({ id: 1, name: 'Test Project' }), 500))
      );

      await service.createProject({ name: 'Test', path: '/test' });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });

    it('handles large project lists efficiently', async () => {
      const largeProjectList = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Project ${i}`,
        path: `/project${i}`,
      }));

      mockInvoke.mockResolvedValue(largeProjectList);

      const startTime = Date.now();
      const result = await service.listProjects();
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Error Handling', () => {
    it('handles invalid project paths', async () => {
      const invalidPath = '/invalid/path/that/does/not/exist';

      mockInvoke.mockRejectedValue(new Error('Invalid project path'));

      await expect(service.createProject({ name: 'Test', path: invalidPath })).rejects.toThrow(
        'Invalid project path'
      );
    });

    it('handles permission errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Permission denied'));

      await expect(service.validateProjectPath('/restricted/path')).rejects.toThrow(
        'Permission denied'
      );
    });

    it('handles storage calculation errors', async () => {
      mockInvoke.mockRejectedValue(new Error('Cannot calculate storage'));

      await expect(service.getProjectStorageInfo(1)).rejects.toThrow('Cannot calculate storage');
    });

    it('validates required project fields', async () => {
      const invalidProject = { description: 'Missing name and path' };

      mockInvoke.mockRejectedValue(new Error('Project name is required'));

      await expect(service.createProject(invalidProject)).rejects.toThrow(
        'Project name is required'
      );
    });
  });

  describe('SOLID Architecture Compliance', () => {
    it('maintains single responsibility for project operations', () => {
      expect(service).toHaveProperty('createProject');
      expect(service).toHaveProperty('getProject');
      expect(service).toHaveProperty('updateProject');
      expect(service).toHaveProperty('deleteProject');
      expect(service).toHaveProperty('listProjects');

      // Should not have unrelated responsibilities
      expect(service).not.toHaveProperty('searchBooks');
      expect(service).not.toHaveProperty('uploadFile');
      expect(service).not.toHaveProperty('sendNotification');
    });

    it('provides consistent interface for all operations', () => {
      const service1 = new ProjectService();
      const service2 = new ProjectService();

      expect(typeof service1.createProject).toBe('function');
      expect(typeof service2.createProject).toBe('function');
    });
  });

  describe('Decentralization and P2P Integration', () => {
    it('configures P2P networking for projects', async () => {
      const projectId = 1;
      const p2pConfig = {
        enabled: true,
        peer_discovery: true,
        tor_support: true,
        ipfs_integration: true,
        local_network_sharing: true,
      };

      mockInvoke.mockResolvedValue(p2pConfig);

      const result = await service.configureP2P(projectId, p2pConfig);

      expect(result.enabled).toBe(true);
      expect(result.tor_support).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('configure_project_p2p', {
        project_id: projectId,
        config: p2pConfig,
      });
    });

    it('supports offline project synchronization', async () => {
      const projectId = 1;

      mockInvoke.mockResolvedValue({
        offline_ready: true,
        last_sync: '2024-01-01T00:00:00Z',
        pending_changes: 5,
      });

      const result = await service.prepareOfflineSync(projectId);

      expect(result.offline_ready).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('prepare_offline_sync', {
        project_id: projectId,
      });
    });
  });
});
