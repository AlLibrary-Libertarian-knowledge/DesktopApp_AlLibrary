import { Component, createMemo, createSignal, onMount, createEffect } from 'solid-js';
import { HardDrive, FileText, File, Shield, Globe, Clock } from 'lucide-solid';
import { Card } from '../../foundation';
import { SystemAPI, SystemUtils } from '../../../types/System';
import { CULTURAL_SENSITIVITY_LEVELS, CULTURAL_LABELS } from '../../../constants/cultural';
import styles from './DocumentStatus.module.css';

/**
 * Document Status Props Interface
 * Enhanced with cultural context and accessibility features
 */
export interface DocumentStatusProps {
  /** Document statistics */
  stats: {
    totalDocuments: number;
    totalSize: number;
    culturalContexts: number;
    recentUploads: number;
    verifiedDocuments?: number;
    pendingVerification?: number;
    culturalSensitivityLevels?: Record<number, number>;
  };
  /** Project directory path for disk space calculation */
  projectPath?: string | undefined;
  /** Custom CSS class for styling variations */
  class?: string;

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: 'indigenous' | 'traditional' | 'modern' | 'ceremonial' | 'community' | 'default';
  showCulturalIndicators?: boolean;
  culturalContext?: string;

  // Accessibility Properties
  ariaLabel?: string;
  ariaDescribedBy?: string;

  // Security Properties
  showSecurityStatus?: boolean;
  securityLevel?: 'low' | 'medium' | 'high' | 'critical';

  // Event Handlers
  onStorageWarning?: (usage: number) => void;
  onCulturalContextClick?: (context: string) => void;
}

/**
 * DocumentStatus - Domain component for displaying document library status
 *
 * Features:
 * - Document statistics overview with cultural context
 * - Storage visualization with progress bar
 * - Format types display with cultural indicators
 * - Library status indicators with security validation
 * - Cultural context display (educational information only)
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Anti-censorship core: Cultural information displayed, never restricted
 */
export const DocumentStatus: Component<DocumentStatusProps> = props => {
  const [diskSpaceInfo, setDiskSpaceInfo] = createSignal<any>(null);
  const [loading, setLoading] = createSignal(true);
  const [showCulturalTooltip, setShowCulturalTooltip] = createSignal(false);

  // Function to load disk space information
  const loadDiskSpaceInfo = async (projectPath: string) => {
    setLoading(true);
    try {
      const info = await SystemAPI.getDiskSpaceInfo(projectPath);
      setDiskSpaceInfo(info);

      // Check for storage warnings
      if (info.disk_usage_percentage > 80) {
        props.onStorageWarning?.(info.disk_usage_percentage);
      }
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

  /**
   * Get cultural sensitivity distribution
   */
  const getCulturalSensitivityDistribution = () => {
    const levels = props.stats?.culturalSensitivityLevels || {};
    const total = Object.values(levels).reduce((sum, count) => sum + count, 0);

    return Object.entries(levels).map(([level, count]) => ({
      level: parseInt(level),
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      label: CULTURAL_LABELS[parseInt(level)] || 'Cultural Context',
    }));
  };

  /**
   * Get storage status color
   */
  const getStorageStatusColor = () => {
    const percentage = storagePercentage();
    if (percentage > 90) return 'critical';
    if (percentage > 75) return 'warning';
    return 'normal';
  };

  /**
   * Get verification status
   */
  const getVerificationStatus = () => {
    const verified = props.stats?.verifiedDocuments || 0;
    const pending = props.stats?.pendingVerification || 0;
    const total = props.stats?.totalDocuments || 0;

    if (total === 0) return { status: 'none', percentage: 0 };
    if (pending === 0) return { status: 'complete', percentage: 100 };

    const percentage = (verified / total) * 100;
    if (percentage >= 90) return { status: 'excellent', percentage };
    if (percentage >= 70) return { status: 'good', percentage };
    return { status: 'pending', percentage };
  };

  const culturalDistribution = getCulturalSensitivityDistribution();
  const storageStatus = getStorageStatusColor();
  const verificationStatus = getVerificationStatus();

  return (
    <div
      class={`${styles['document-status']} ${props.class || ''}`}
      aria-label={props.ariaLabel || 'Document library status overview'}
      aria-describedby={props.ariaDescribedBy}
    >
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
        <div
          class={styles['stat-item']}
          onMouseEnter={() => setShowCulturalTooltip(true)}
          onMouseLeave={() => setShowCulturalTooltip(false)}
          role="button"
          tabindex={0}
          aria-label={`${props.stats?.culturalContexts || 0} cultural contexts available`}
        >
          <span class={styles['stat-number']}>{props.stats?.culturalContexts || 0}</span>
          <span class={styles['stat-label']}>
            Cultural Contexts
            <Globe size={12} class={styles['cultural-icon']} />
          </span>
        </div>
        <div class={styles['stat-item']}>
          <span class={styles['stat-number']}>{props.stats?.recentUploads || 0}</span>
          <span class={styles['stat-label']}>Recent Uploads</span>
        </div>
      </div>

      {/* Cultural Context Tooltip */}
      <Show when={showCulturalTooltip() && culturalDistribution.length > 0}>
        <div class={styles['cultural-tooltip']} role="tooltip">
          <h4>Cultural Sensitivity Distribution</h4>
          <div class={styles['cultural-distribution']}>
            <For each={culturalDistribution}>
              {item => (
                <div class={styles['cultural-item']}>
                  <span class={styles['cultural-label']}>{item.label}</span>
                  <span class={styles['cultural-count']}>{item.count}</span>
                  <div class={styles['cultural-bar']}>
                    <div class={styles['cultural-fill']} style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              )}
            </For>
          </div>
          <p class={styles['cultural-note']}>
            Cultural information provided for educational purposes only
          </p>
        </div>
      </Show>

      {/* Compact Info Grid */}
      <div class={styles['info-grid']}>
        {/* Storage Info */}
        <Card
          culturalTheme={props.culturalTheme}
          culturalContext="Storage status information"
          contentType="general"
          class={styles['info-card']}
        >
          <div class={styles['card-header']}>
            <div class={styles['header-left']}>
              <HardDrive size={14} />
              <span class={styles['card-title']}>Storage</span>
            </div>
            <span class={`${styles['storage-usage']} ${styles[`storage-${storageStatus}`]}`}>
              {storageUsageText()}
            </span>
          </div>
          <div class={styles['progress-bar']}>
            <div
              class={`${styles['progress-fill']} ${styles[`progress-${storageStatus}`]}`}
              style={{ width: `${storagePercentage()}%` }}
              role="progressbar"
              aria-valuenow={storagePercentage()}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Storage usage: ${storagePercentage()}%`}
            />
          </div>
        </Card>

        {/* Verification Status */}
        <Show when={props.showSecurityStatus}>
          <Card
            culturalTheme={props.culturalTheme}
            culturalContext="Document verification status"
            contentType="general"
            class={styles['info-card']}
          >
            <div class={styles['card-header']}>
              <div class={styles['header-left']}>
                <Shield size={14} />
                <span class={styles['card-title']}>Verification</span>
              </div>
              <span
                class={`${styles['verification-status']} ${styles[`verification-${verificationStatus.status}`]}`}
              >
                {verificationStatus.percentage.toFixed(0)}%
              </span>
            </div>
            <div class={styles['progress-bar']}>
              <div
                class={`${styles['progress-fill']} ${styles[`verification-${verificationStatus.status}`]}`}
                style={{ width: `${verificationStatus.percentage}%` }}
                role="progressbar"
                aria-valuenow={verificationStatus.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Verification progress: ${verificationStatus.percentage}%`}
              />
            </div>
          </Card>
        </Show>

        {/* Formats Info */}
        <Card
          culturalTheme={props.culturalTheme}
          culturalContext="Document format information"
          contentType="general"
          class={styles['info-card']}
        >
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
        </Card>
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
        <Show when={props.showSecurityStatus}>
          <div class={styles['indicator-item']}>
            <div class={`${styles['indicator-dot']} ${styles.verified}`} />
            <span class={styles['indicator-text']}>Verification Active</span>
          </div>
        </Show>
      </div>

      {/* Cultural Context Note */}
      <Show when={props.culturalContext}>
        <div class={styles['cultural-note']}>
          <Globe size={12} />
          <span>{props.culturalContext}</span>
        </div>
      </Show>
    </div>
  );
};
