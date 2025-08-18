import { Component, createResource, Show } from 'solid-js';
import styles from './StorageWidget.module.css';
import { settingsService } from '@/services/storage/settingsService';
import { invoke } from '@tauri-apps/api/core';

interface DiskSpaceInfo {
  project_size_bytes: number;
  total_disk_space_bytes: number;
  available_disk_space_bytes: number;
  used_disk_space_bytes: number;
  project_percentage: number;
  disk_usage_percentage: number;
  project_path: string;
  disk_name: string;
}

export const StorageWidget: Component = () => {
  const [info, { refetch }] = createResource(async (): Promise<DiskSpaceInfo | null> => {
    const base = (await settingsService.ensureInitialized()) || (await settingsService.getProjectFolder()) || '';
    if (!base) return null;
    return await invoke<DiskSpaceInfo>('get_disk_space_info', { projectPath: base });
  });

  const formatGB = (bytes?: number) => {
    if (!bytes) return '0 GB';
    return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
  };

  return (
    <div class={styles.widget}>
      <div class={styles.row}>
        <span>Storage</span>
        <button class={styles.refresh} onClick={() => refetch()}>↻</button>
      </div>
      <Show when={info()} fallback={<div class={styles.skeleton}></div>}>
        <div class={styles.bar}>
          <div class={styles.fill} style={{ width: `${Math.min(100, info()!.disk_usage_percentage).toFixed(1)}%` }}></div>
        </div>
        <div class={styles.meta}>
          <span>{formatGB(info()!.used_disk_space_bytes)} / {formatGB(info()!.total_disk_space_bytes)}</span>
          <span>{info()!.project_path}</span>
        </div>
      </Show>
    </div>
  );
};

export default StorageWidget;


