import { Component, createMemo, createSignal, onMount, createEffect } from 'solid-js';
import { HardDrive, FileText, File } from 'lucide-solid';
import { SystemAPI, SystemUtils } from '../../../types/System';
import styles from './DocumentStatus.module.css';

export interface DocumentStatusProps {
  /** Document statistics */
  stats: {
    totalDocuments: number;
    totalSize: number;
    culturalContexts: number;
    recentUploads: number;
  };
  /** Project directory path for disk space calculation */
  projectPath?: string | undefined;
  /** Custom CSS class for styling variations */
  class?: string;
}

/**
 * DocumentStatus - Domain component for displaying document library status
 *
 * Features:
 * - Document statistics overview
 * - Storage visualization with progress bar
 * - Format types display
 * - Library status indicators
 * - Responsive design with mobile adaptations
 * - Cultural context display (educational information only)
 */
export const DocumentStatus: Component<DocumentStatusProps> = props => {
  const [diskSpaceInfo, setDiskSpaceInfo] = createSignal<any>(null);
  const [loading, setLoading] = createSignal(true);

  // Function to load disk space information
  const loadDiskSpaceInfo = async (projectPath: string) => {
    setLoading(true);
    try {
      const info = await SystemAPI.getDiskSpaceInfo(projectPath);
      setDiskSpaceInfo(info);
    } catch (error) {
      console.error('Failed to get disk space info:', error);
      // Fallback: try current directory
      try {
        const fallbackInfo = await SystemAPI.getDiskSpaceInfo('.');
        setDiskSpaceInfo(fallbackInfo);
      } catch (fallbackError) {
        console.error('Fallback disk space check also failed:', fallbackError);
      }
    }
    setLoading(false);
  };

  // Load disk space information when project path becomes available
  createEffect(() => {
    const pathToCheck = props.projectPath;
    if (pathToCheck) {
      loadDiskSpaceInfo(pathToCheck);
    } else {
      setLoading(false);
    }
  });

  const formatFileSize = (bytes: number): string => {
    return SystemUtils.formatBytes(bytes);
  };

  const storagePercentage = createMemo(() => {
    const info = diskSpaceInfo();
    if (info) {
      // Show overall disk usage percentage (how much of the disk is used)
      return Math.min(Math.max(info.disk_usage_percentage, 2), 100); // Minimum 2% for visibility
    }
    // Fallback to old calculation if no disk info available
    const maxStorageGB = 10; // 10GB limit
    const totalSize = props.stats?.totalSize || 0;
    const currentStorageGB = totalSize / (1024 * 1024 * 1024);
    return Math.min(Math.max((currentStorageGB / maxStorageGB) * 100, 2), 100); // Minimum 2% for visibility
  });

  const storageUsageText = createMemo(() => {
    const info = diskSpaceInfo();
    if (info) {
      // Show used space vs total space (overall disk usage)
      return `${formatFileSize(info.used_disk_space_bytes)} / ${formatFileSize(info.total_disk_space_bytes)} used`;
    }
    return `${formatFileSize(props.stats?.totalSize || 0)} / 10GB`;
  });

  return (
    <div class={`${styles['document-status']} ${props.class || ''}`}>
      {/* Document Statistics */}
      <div class={styles['stats-overview']}>
        <div class={styles['stat-item']}>
          <span class={styles['stat-number']}>{props.stats?.totalDocuments || 0}</span>
          <span class={styles['stat-label']}>Documents</span>
        </div>
        <div class={styles['stat-item']}>
          <span class={styles['stat-number']}>{formatFileSize(props.stats?.totalSize || 0)}</span>
          <span class={styles['stat-label']}>Storage Used</span>
        </div>
        <div class={styles['stat-item']}>
          <span class={styles['stat-number']}>{props.stats?.culturalContexts || 0}</span>
          <span class={styles['stat-label']}>Cultural Contexts</span>
        </div>
        <div class={styles['stat-item']}>
          <span class={styles['stat-number']}>{props.stats?.recentUploads || 0}</span>
          <span class={styles['stat-label']}>Recent Uploads</span>
        </div>
      </div>

      {/* Compact Info Grid */}
      <div class={styles['info-grid']}>
        {/* Storage Info */}
        <div class={styles['info-card']}>
          <div class={styles['card-header']}>
            <div class={styles['header-left']}>
              <HardDrive size={14} />
              <span class={styles['card-title']}>Storage</span>
            </div>
            <span class={styles['storage-usage']}>{storageUsageText()}</span>
          </div>
          <div class={styles['progress-bar']}>
            <div class={styles['progress-fill']} style={`width: ${storagePercentage()}%`} />
          </div>
        </div>

        {/* Formats Info */}
        <div class={styles['info-card']}>
          <div class={styles['card-header']}>
            <div class={styles['header-left']}>
              <FileText size={14} />
              <span class={styles['card-title']}>Formats</span>
            </div>
            <span class={styles['format-count-total']}>2 Types</span>
          </div>
          <div class={styles['format-list']}>
            <div class={styles['format-item']}>
              <File size={12} />
              <span class={styles['format-name']}>PDF</span>
              <span class={styles['format-count']}>2</span>
            </div>
            <div class={styles['format-item']}>
              <FileText size={12} />
              <span class={styles['format-name']}>EPUB</span>
              <span class={styles['format-count']}>1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Library Status Indicators */}
      <div class={styles['library-indicators']}>
        <div class={styles['indicator-item']}>
          <div class={`${styles['indicator-dot']} ${styles.scanning}`} />
          <span class={styles['indicator-text']}>Malware Scanning</span>
        </div>
        <div class={styles['indicator-item']}>
          <div class={`${styles['indicator-dot']} ${styles.indexed}`} />
          <span class={styles['indicator-text']}>Search Ready</span>
        </div>
        <div class={styles['indicator-item']}>
          <div class={`${styles['indicator-dot']} ${styles.cultural}`} />
          <span class={styles['indicator-text']}>Cultural Context</span>
        </div>
      </div>
    </div>
  );
};
