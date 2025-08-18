import { invoke } from '@tauri-apps/api/core';

export interface AppSettings {
  projectFolderPath: string;
}

const SETTINGS_KEY = 'alLibrary_projectPath';

export const settingsService = {
  async getProjectFolder(): Promise<string | null> {
    const local = globalThis.localStorage?.getItem(SETTINGS_KEY);
    return local || null;
  },
  async setProjectFolder(path: string): Promise<void> {
    globalThis.localStorage?.setItem(SETTINGS_KEY, path);
    try { await invoke('save_app_settings', { settings: { projectFolderPath: path } }); } catch { /* noop */ }
    try {
      if (typeof window !== 'undefined') {
        const evt: any = (window as any).CustomEvent
          ? new (window as any).CustomEvent('project-folder-changed', { detail: { path } })
          : { type: 'project-folder-changed' };
        window.dispatchEvent(evt);
      }
    } catch { /* noop */ }
  },
  async ensureInitialized(): Promise<string | null> {
    // First-run flow now; no installer-based adoption.
    return await this.getProjectFolder();
  },
};


