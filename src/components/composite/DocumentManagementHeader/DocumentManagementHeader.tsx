import { Component, JSX, Show } from 'solid-js';
import { Button } from '../../foundation';
import { TopCard } from '../TopCard';
import { Upload, Settings, HardDrive, Folder, RefreshCw } from 'lucide-solid';
import styles from './DocumentManagementHeader.module.css';

/**
 * Document Management Header Props Interface
 * Follows SOLID principles with cultural theme support
 */
export interface DocumentManagementHeaderProps {
  // Statistics and Information
  totalDocuments: number;
  totalSize: string;
  uploadProgress?: number;
  isUploading?: boolean;

  // Cultural Context Properties (INFORMATION ONLY)
  culturalTheme?: 'indigenous' | 'traditional' | 'modern' | 'ceremonial' | 'community' | 'default';
  showCulturalIndicator?: boolean;

  // Project Management
  projectFolderPath?: string;
  showFolderSetup?: boolean;

  // Event Handlers
  onUploadClick: () => void;
  onSettingsClick: () => void;
  onFolderSetupClick: () => void;
  onRefreshClick: () => void;

  // Accessibility
  ariaLabel?: string;
  class?: string;
}

/**
 * Document Management Header Component
 *
 * Displays project information, upload statistics, and quick actions
 * with cultural theme support and accessibility compliance.
 * Cultural information is displayed for educational purposes only.
 *
 * @example
 * ```tsx
 * <DocumentManagementHeader
 *   totalDocuments={42}
 *   totalSize="156 MB"
 *   culturalTheme="indigenous"
 *   onUploadClick={() => setActiveTab('upload')}
 * />
 * ```
 */
const DocumentManagementHeader: Component<DocumentManagementHeaderProps> = props => {
  /**
   * Generate Cultural Context Display
   */
  const getCulturalDisplay = () => {
    if (!props.culturalTheme || props.culturalTheme === 'default') return null;

    const themeLabels = {
      indigenous: 'Indigenous Knowledge Library',
      traditional: 'Traditional Wisdom Archive',
      modern: 'Contemporary Research Collection',
      ceremonial: 'Sacred Knowledge Repository',
      community: 'Community Knowledge Hub',
    };

    return themeLabels[props.culturalTheme] || 'Document Library';
  };

  /**
   * Generate Header Content
   */
  const getHeaderContent = (): JSX.Element => (
    <div class={styles.headerContent}>
      <div class={styles.titleSection}>
        <h1 class={styles.title}>{getCulturalDisplay() || 'Document Management'}</h1>
        <Show when={props.showCulturalIndicator && props.culturalTheme}>
          <span
            class={styles.culturalIndicator}
            aria-label={`Cultural theme: ${props.culturalTheme}`}
          >
            🌿
          </span>
        </Show>
        <Show when={props.projectFolderPath}>
          <p class={styles.projectPath}>
            <Folder size={16} />
            {props.projectFolderPath}
          </p>
        </Show>
      </div>

      <div class={styles.statsSection}>
        <div class={styles.statItem}>
          <span class={styles.statValue}>{props.totalDocuments}</span>
          <span class={styles.statLabel}>Documents</span>
        </div>
        <div class={styles.statItem}>
          <span class={styles.statValue}>{props.totalSize}</span>
          <span class={styles.statLabel}>Total Size</span>
        </div>
        <Show when={props.isUploading && props.uploadProgress !== undefined}>
          <div class={styles.statItem}>
            <span class={styles.statValue}>{props.uploadProgress}%</span>
            <span class={styles.statLabel}>Uploading</span>
          </div>
        </Show>
      </div>
    </div>
  );

  /**
   * Generate Quick Actions
   */
  const getQuickActions = (): JSX.Element => (
    <div class={styles.actionsSection}>
      <Button
        variant="futuristic"
        color="purple"
        size="md"
        culturalTheme={props.culturalTheme || 'default'}
        ariaLabel="Upload new documents"
        onClick={props.onUploadClick}
        disabled={!!props.isUploading}
      >
        <Upload size={18} />
        Upload
      </Button>

      <Button
        variant="ghost"
        size="md"
        culturalTheme={props.culturalTheme || 'default'}
        ariaLabel="Refresh document library"
        onClick={props.onRefreshClick}
        disabled={!!props.isUploading}
      >
        <RefreshCw size={18} />
      </Button>

      <Button
        variant="ghost"
        size="md"
        culturalTheme={props.culturalTheme || 'default'}
        ariaLabel="Open settings"
        onClick={props.onSettingsClick}
      >
        <Settings size={18} />
      </Button>

      <Show when={props.showFolderSetup}>
        <Button
          variant="secondary"
          size="md"
          culturalTheme={props.culturalTheme || 'default'}
          ariaLabel="Setup project folder"
          onClick={props.onFolderSetupClick}
        >
          <HardDrive size={18} />
          Setup Folder
        </Button>
      </Show>
    </div>
  );

  return (
    <TopCard
      title={getCulturalDisplay() || 'Document Management'}
      subtitle={props.projectFolderPath}
      rightContent={getQuickActions()}
      class={`${styles.documentHeader} ${props.class || ''}`}
      aria-label={props.ariaLabel || 'Document management header'}
    />
  );
};

export default DocumentManagementHeader;
