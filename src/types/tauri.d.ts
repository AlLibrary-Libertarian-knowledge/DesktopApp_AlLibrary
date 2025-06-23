/**
 * Tauri V2 Type Declarations
 *
 * TypeScript declarations for Tauri V2 APIs and global objects
 */

declare global {
  interface Window {
    __TAURI__?: {
      core?: any;
      event?: any;
      process?: any;
      os?: any;
      app?: any;
      [key: string]: any;
    };
  }
}

// Tauri API types
export interface TauriAPI {
  core: any;
  event: any;
  process: any;
  os: any;
  app: any;
}

export {};
