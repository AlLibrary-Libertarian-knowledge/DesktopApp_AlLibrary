import { invoke } from '@tauri-apps/api/core';
import type { AppSettings } from '@/types/Settings';

const SHARE_KEY = 'alLibrary_projectPath';
const DOWNLOAD_KEY = 'alLibrary_downloadPath';

function syncLocalCache(project: string, download: string): void {
  globalThis.localStorage?.setItem(SHARE_KEY, project);
  globalThis.localStorage?.setItem(DOWNLOAD_KEY, download);
}

function dispatchProjectFolderChanged(path: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('project-folder-changed', { detail: { path } }));
}

async function loadRustSettings(): Promise<AppSettings | null> {
  try {
    return await invoke<AppSettings>('load_app_settings');
  } catch {
    return null;
  }
}

async function applyPaths(project: string, download?: string | null): Promise<AppSettings> {
  const settings = await invoke<AppSettings>('apply_project_paths', {
    projectFolderPath: project,
    downloadFolderPath: download ?? null,
  });
  syncLocalCache(settings.project.projectFolderPath, settings.project.downloadFolderPath);
  dispatchProjectFolderChanged(settings.project.projectFolderPath);
  return settings;
}

export const settingsService = {
  async getProjectFolder(): Promise<string | null> {
    const rust = await loadRustSettings();
    if (rust?.project?.projectFolderPath) {
      return rust.project.projectFolderPath;
    }
    return globalThis.localStorage?.getItem(SHARE_KEY) || null;
  },

  async getDownloadFolder(): Promise<string | null> {
    const rust = await loadRustSettings();
    if (rust?.project?.downloadFolderPath) {
      return rust.project.downloadFolderPath;
    }
    return globalThis.localStorage?.getItem(DOWNLOAD_KEY) || null;
  },

  async setProjectFolder(path: string): Promise<void> {
    const existingDownload = await this.getDownloadFolder();
    await applyPaths(path, existingDownload);
  },

  async setDownloadFolder(path: string): Promise<void> {
    const project = await this.getProjectFolder();
    if (!project) {
      throw new Error('Project folder must be set before download folder');
    }
    await applyPaths(project, path);
  },

  async saveProjectSetup(projectPath: string, downloadPath?: string | null): Promise<void> {
    await applyPaths(projectPath, downloadPath ?? null);
  },

  async ensureInitialized(): Promise<string | null> {
    const localProject = globalThis.localStorage?.getItem(SHARE_KEY);
    const localDownload = globalThis.localStorage?.getItem(DOWNLOAD_KEY);
    const firstRunDone = globalThis.localStorage?.getItem('FIRST_RUN_DONE') === '1';
    const rust = await loadRustSettings();
    const rustProject = rust?.project?.projectFolderPath?.trim() || '';

    const shouldMigrate = !!localProject && firstRunDone && localProject !== rustProject;

    if (shouldMigrate) {
      try {
        await applyPaths(localProject, localDownload);
      } catch (e) {
        console.warn('Failed to migrate settings from localStorage to Rust', e);
      }
    }

    return await this.getProjectFolder();
  },
};
