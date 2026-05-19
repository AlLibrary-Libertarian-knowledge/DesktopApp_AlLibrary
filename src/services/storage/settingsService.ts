import { invoke } from '@tauri-apps/api/core';

export interface AppSettings {
  projectFolderPath: string;
  downloadFolderPath: string;
}

const SHARE_KEY = 'alLibrary_projectPath';
const DOWNLOAD_KEY = 'alLibrary_downloadPath';

export const settingsService = {
  async getProjectFolder(): Promise<string | null> {
    const local = globalThis.localStorage?.getItem(SHARE_KEY);
    return local || null;
  },

  async getDownloadFolder(): Promise<string | null> {
    const local = globalThis.localStorage?.getItem(DOWNLOAD_KEY);
    return local || null;
  },

  async setProjectFolder(path: string): Promise<void> {
    globalThis.localStorage?.setItem(SHARE_KEY, path);
    try {
      const downloadPath = await this.getDownloadFolder();
      await invoke('save_app_settings', {
        settings: {
          projectFolderPath: path,
          downloadFolderPath: downloadPath || path,
        },
      });
    } catch {
      /* noop */
    }
    try {
      if (typeof window !== 'undefined') {
        const evt: any = (window as any).CustomEvent
          ? new (window as any).CustomEvent('project-folder-changed', { detail: { path } })
          : { type: 'project-folder-changed' };
        window.dispatchEvent(evt);
      }
    } catch {
      /* noop */
    }
  },

  async setDownloadFolder(path: string): Promise<void> {
    globalThis.localStorage?.setItem(DOWNLOAD_KEY, path);
    try {
      const projectPath = await this.getProjectFolder();
      await invoke('save_app_settings', {
        settings: {
          projectFolderPath: projectPath || path,
          downloadFolderPath: path,
        },
      });
    } catch {
      /* noop */
    }
  },

  async ensureInitialized(): Promise<string | null> {
    return await this.getProjectFolder();
  },
};
