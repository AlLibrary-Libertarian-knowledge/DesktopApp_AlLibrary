import styles from './DocumentManagementRightColumn.module.css';
import {
  HardDrive,
  FileText,
  BookOpen,
  Clock,
  ChevronRight,
  Upload,
  AlertTriangle,
  CheckCircle,
} from 'lucide-solid';
import { For, Show, createMemo, Component } from 'solid-js';
import type { LucideIcon } from 'lucide-solid';

interface StorageInfo {
  used: number; // in GB
  total: number; // in GB
}

interface Props {
  storage: StorageInfo;
  formats: string[];
  recentUploads: string[];
}

interface StorageStatusInfo {
  type: 'critical' | 'warning' | 'good';
  icon: LucideIcon;
  message: string;
}

const DocumentManagementRightColumn: Component<Props> = ({ storage, formats, recentUploads }) => {
  const percentUsed = Math.min(100, (storage.used / storage.total) * 100);
  const storageStatus = createMemo<StorageStatusInfo>(() => {
    if (percentUsed > 90)
      return { type: 'critical', icon: AlertTriangle, message: 'Critical Storage' };
    if (percentUsed > 70)
      return { type: 'warning', icon: AlertTriangle, message: 'Storage Warning' };
    return { type: 'good', icon: CheckCircle, message: 'Storage Good' };
  });

  const formatGroups = createMemo(() => {
    const groups = formats.reduce(
      (acc, fmt) => {
        const type = fmt.toLowerCase();
        if (type.includes('pdf')) acc.documents++;
        else if (type.includes('epub')) acc.ebooks++;
        else acc.other++;
        return acc;
      },
      { documents: 0, ebooks: 0, other: 0 }
    );
    return groups;
  });

  const StatusIcon = storageStatus().icon;

  return (
    <aside class={styles.rightColumn}>
      <div class={styles.header}>
        <div class={styles.titleWrapper}>
          <h2 class={styles.title}>
            <span class={styles.gradientText}>Document</span>
            <span class={styles.gradientText}>Management</span>
          </h2>
          <div class={styles.badge}>
            <Upload size={14} />
            <span>Ready for Upload</span>
          </div>
        </div>
        <p class={styles.subtitle}>Upload, organize, and manage your cultural heritage documents</p>
      </div>

      <div class={styles.grid}>
        <div class={`${styles.section} ${styles.storageSection}`}>
          <div class={styles.sectionHeader}>
            <div class={styles.sectionTitle}>
              <HardDrive size={18} />
              Storage Overview
            </div>
            <div class={`${styles.storageStatus} ${styles[storageStatus().type]}`}>
              <StatusIcon size={14} />
              <span>{storageStatus().message}</span>
            </div>
          </div>

          <div class={styles.storageContent}>
            <div class={styles.storageVisual}>
              <div
                class={`${styles.storageRing} ${styles[storageStatus().type]}`}
                style={{ '--progress': `${percentUsed}%` }}
              >
                <div class={styles.storageInner}>
                  <div class={styles.storagePercentage}>{Math.round(percentUsed)}%</div>
                  <div class={styles.storageLabel}>Used</div>
                </div>
              </div>
            </div>
            <div class={styles.storageDetails}>
              <div class={styles.storageMetrics}>
                <div class={styles.metric}>
                  <span class={styles.metricLabel}>Used Space</span>
                  <span class={styles.metricValue}>{storage.used.toFixed(2)} GB</span>
                </div>
                <div class={styles.metric}>
                  <span class={styles.metricLabel}>Total Space</span>
                  <span class={styles.metricValue}>{storage.total.toFixed(2)} GB</span>
                </div>
                <div class={styles.metric}>
                  <span class={styles.metricLabel}>Available</span>
                  <span class={styles.metricValue}>
                    {(storage.total - storage.used).toFixed(2)} GB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class={`${styles.section} ${styles.formatsSection}`}>
          <div class={styles.sectionHeader}>
            <div class={styles.sectionTitle}>
              <FileText size={18} />
              Document Formats
            </div>
            <div class={styles.formatCount}>{formats.length} Types</div>
          </div>

          <div class={styles.formatStats}>
            <div class={styles.formatStat}>
              <div class={styles.formatStatValue}>{formatGroups().documents}</div>
              <div class={styles.formatStatLabel}>Documents</div>
            </div>
            <div class={styles.formatStat}>
              <div class={styles.formatStatValue}>{formatGroups().ebooks}</div>
              <div class={styles.formatStatLabel}>E-Books</div>
            </div>
            <div class={styles.formatStat}>
              <div class={styles.formatStatValue}>{formatGroups().other}</div>
              <div class={styles.formatStatLabel}>Other</div>
            </div>
          </div>

          <div class={styles.formatsList}>
            <For each={formats}>
              {fmt => (
                <div class={styles.formatItem}>
                  <div class={styles.formatIcon}>
                    <BookOpen size={16} />
                  </div>
                  <span class={styles.formatName}>{fmt}</span>
                  <ChevronRight size={14} class={styles.formatArrow} />
                </div>
              )}
            </For>
          </div>
        </div>

        <div class={`${styles.section} ${styles.uploadsSection}`}>
          <div class={styles.sectionHeader}>
            <div class={styles.sectionTitle}>
              <Clock size={18} />
              Recent Activity
            </div>
            <Show when={recentUploads.length > 0}>
              <div class={styles.uploadCount}>{recentUploads.length} Files</div>
            </Show>
          </div>

          <div class={styles.uploadsList}>
            <Show
              when={recentUploads.length > 0}
              fallback={
                <div class={styles.empty}>
                  <Upload size={24} />
                  <span>No recent uploads</span>
                  <p>Start uploading your documents</p>
                </div>
              }
            >
              <For each={recentUploads}>
                {(file, index) => (
                  <div class={styles.uploadItem} style={{ 'animation-delay': `${index() * 0.1}s` }}>
                    <div class={styles.uploadIcon}>
                      <FileText size={14} />
                    </div>
                    <div class={styles.uploadInfo}>
                      <span class={styles.fileName}>{file}</span>
                      <span class={styles.uploadTime}>Just now</span>
                    </div>
                    <div class={styles.uploadStatus}>
                      <CheckCircle size={14} />
                    </div>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DocumentManagementRightColumn;
