import { openPath, revealItemInDir } from '@tauri-apps/plugin-opener';

function isTauri(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);
}

export async function openFilePath(path: string): Promise<void> {
  if (!path?.trim()) return;
  if (!isTauri()) {
    throw new Error('Open file is only available in the desktop app.');
  }
  await openPath(path);
}

export async function showFileInFolder(path: string): Promise<void> {
  if (!path?.trim()) return;
  if (!isTauri()) {
    throw new Error('Show in folder is only available in the desktop app.');
  }
  await revealItemInDir(path);
}
