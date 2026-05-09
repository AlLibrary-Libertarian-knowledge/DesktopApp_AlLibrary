/**
 * Native file/folder pickers (Tauri `rfd` backend). Prefer these over raw `invoke` names.
 */

import { invoke } from '@tauri-apps/api/core';

export async function pickLibraryFolder(): Promise<string | null> {
  return invoke<string | null>('pick_library_folder');
}

/** Folder picker with optional dialog title (defaults on the Rust side). */
export async function pickFolder(title?: string | null): Promise<string | null> {
  return invoke<string | null>('pick_folder', { title: title ?? null });
}

/** PDF/EPUB import filter — library document flows. */
export async function pickDocumentFiles(): Promise<string[]> {
  return invoke<string[]>('pick_document_files');
}

/** No extension filter — onion share and arbitrary payloads. */
export async function pickAnyFiles(): Promise<string[]> {
  return invoke<string[]>('pick_any_files');
}
