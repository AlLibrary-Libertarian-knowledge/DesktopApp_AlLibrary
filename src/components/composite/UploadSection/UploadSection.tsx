import { Component, JSX, createSignal, Show, For } from 'solid-js';
import { Button, Input, Card } from '../../foundation';
import { Upload, FileText, AlertCircle, Check, X, Info } from 'lucide-solid';
import { validationService } from '../../../services';
import styles from './UploadSection.module.css';

/**
 * File Upload Status Types
 */
export type UploadStatus = 'idle' | 'uploading' | 'validating' | 'success' | 'error';

/**
 * Upload File Interface
 */
export interface UploadFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  culturalContext?: {
    sensitivityLevel?: number;
    culturalOrigin?: string;
    educationalContext?: string;
    informationOnly: true; // MANDATORY: Cultural info is educational only
  };
}

/**
 * Upload Section Props Interface
 * Follows SOLID principles with cultural theme support and anti-censorship compliance
 */
export interface UploadSectionProps {
  // Core Upload Properties
  maxFileSize?: number; // in bytes
  acceptedFormats?: string[];
  maxFiles?: number;
  isUploading?: boolean;

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: 'indigenous' | 'traditional' | 'modern' | 'ceremonial' | 'community' | 'default';
  showCulturalIndicator?: boolean;
  enableCulturalAnalysis?: boolean; // For educational context only

  // Security Properties (TECHNICAL ONLY - NO CONTENT CENSORSHIP)
  enableSecurityValidation?: boolean;
  enableMalwareScanning?: boolean;

  // Event Handlers
  onFilesSelected?: (files: UploadFile[]) => void;
  onUploadStart?: (files: UploadFile[]) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
  onUploadComplete?: (fileId: string, result: any) => void;
  onUploadError?: (fileId: string, error: string) => void;
  onValidationComplete?: (fileId: string, isValid: boolean, culturalInfo?: any) => void;

  // Accessibility
  ariaLabel?: string;
  class?: string;
}

/**
 * Upload Section Component
 *
 * Handles document upload with security validation and cultural context display.
 * Cultural information is provided for educational purposes only - never restricts access.
 * Security validation only blocks malware and illegal content - never cultural content.
 *
 * @example
 * ```tsx
 * <UploadSection
 *   culturalTheme="indigenous"
 *   enableCulturalAnalysis={true}
 *   enableSecurityValidation={true}
 *   onFilesSelected={handleFilesSelected}
 * />
 * ```
 */
const UploadSection: Component<UploadSectionProps> = props => {
  // Upload state management
  const [uploadFiles, setUploadFiles] = createSignal<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = createSignal(false);
  const [totalProgress, setTotalProgress] = createSignal(0);

  /**
   * Default Configuration (Following Anti-Censorship Principles)
   */
  const config = {
    maxFileSize: props.maxFileSize || 100 * 1024 * 1024, // 100MB
    acceptedFormats: props.acceptedFormats || ['.pdf', '.epub', '.txt', '.doc', '.docx'],
    maxFiles: props.maxFiles || 10,
    enableSecurityValidation: props.enableSecurityValidation ?? true,
    enableMalwareScanning: props.enableMalwareScanning ?? true,
    enableCulturalAnalysis: props.enableCulturalAnalysis ?? true, // Educational only
  };

  /**
   * Handle File Selection
   * NO CULTURAL RESTRICTIONS - Only technical validation
   */
  const handleFileSelection = async (files: FileList) => {
    const newFiles: UploadFile[] = [];

    for (let i = 0; i < files.length && i < config.maxFiles; i++) {
      const file = files[i];

      // Technical validation only (size, format) - NO CULTURAL RESTRICTIONS
      if (file.size > config.maxFileSize) {
        continue; // Skip oversized files
      }

      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!config.acceptedFormats.includes(fileExtension)) {
        continue; // Skip unsupported formats
      }

      const uploadFile: UploadFile = {
        id: `upload-${Date.now()}-${i}`,
        file,
        status: 'idle',
        progress: 0,
      };

      newFiles.push(uploadFile);
    }

    setUploadFiles(prev => [...prev, ...newFiles]);
    props.onFilesSelected?.(newFiles);

    // Start validation process for each file
    for (const uploadFile of newFiles) {
      await validateFile(uploadFile.id);
    }
  };

  /**
   * Validate File (Technical Security + Cultural Information Display)
   * ANTI-CENSORSHIP: Cultural analysis provides information only, never blocks
   */
  const validateFile = async (fileId: string) => {
    const file = uploadFiles().find(f => f.id === fileId);
    if (!file) return;

    // Update status to validating
    updateFileStatus(fileId, 'validating');

    try {
      // 1. Technical Security Validation (malware, legal compliance)
      if (config.enableSecurityValidation) {
        const securityResult = await validationService.validateUserInput(file.file, {
          userId: 'current-user',
          sessionId: 'current-session',
          inputType: 'file',
          source: 'user_upload',
        });

        if (!securityResult.valid) {
          updateFileError(
            fileId,
            'Security validation failed: File may contain malware or illegal content'
          );
          return;
        }
      }

      // 2. Cultural Analysis (INFORMATION ONLY - NO ACCESS CONTROL)
      let culturalInfo = null;
      if (config.enableCulturalAnalysis) {
        culturalInfo = await analyzeCulturalContext(file.file);

        // Update file with cultural information (educational only)
        setUploadFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? {
                  ...f,
                  culturalContext: {
                    ...culturalInfo,
                    informationOnly: true, // MANDATORY: Always informational
                  },
                }
              : f
          )
        );
      }

      // File is valid - update status
      updateFileStatus(fileId, 'success');
      props.onValidationComplete?.(fileId, true, culturalInfo);
    } catch (error) {
      console.error('File validation error:', error);
      updateFileError(fileId, 'Validation failed');
    }
  };

  /**
   * Analyze Cultural Context (EDUCATIONAL PURPOSE ONLY)
   * This provides information for learning - NEVER restricts access
   */
  const analyzeCulturalContext = async (file: File) => {
    try {
      // Analyze file content for cultural context (educational)
      // This is for providing educational information only
      const culturalAnalysis = {
        sensitivityLevel: 1, // Default low sensitivity
        culturalOrigin: 'Unknown',
        educationalContext: 'No specific cultural context detected',
        informationOnly: true,
        educationalPurpose: true,
      };

      // TODO: Integrate with actual cultural analysis service
      // NOTE: This analysis is for education only - never for access control

      return culturalAnalysis;
    } catch (error) {
      console.error('Cultural analysis error:', error);
      return {
        sensitivityLevel: 1,
        culturalOrigin: 'Analysis failed',
        educationalContext: 'Cultural analysis could not be completed',
        informationOnly: true,
        educationalPurpose: true,
      };
    }
  };

  /**
   * Update File Status
   */
  const updateFileStatus = (fileId: string, status: UploadStatus) => {
    setUploadFiles(prev => prev.map(f => (f.id === fileId ? { ...f, status } : f)));
  };

  /**
   * Update File Error
   */
  const updateFileError = (fileId: string, error: string) => {
    setUploadFiles(prev => prev.map(f => (f.id === fileId ? { ...f, status: 'error', error } : f)));
  };

  /**
   * Remove File
   */
  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  /**
   * Handle Drag and Drop
   */
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer?.files;
    if (files) {
      handleFileSelection(files);
    }
  };

  /**
   * Handle File Input Change
   */
  const handleFileInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      handleFileSelection(files);
    }
  };

  /**
   * Start Upload Process
   */
  const startUpload = () => {
    const validFiles = uploadFiles().filter(f => f.status === 'success');
    if (validFiles.length === 0) return;

    props.onUploadStart?.(validFiles);

    // Update all valid files to uploading status
    validFiles.forEach(file => {
      updateFileStatus(file.id, 'uploading');
    });
  };

  /**
   * Get Status Icon
   */
  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case 'success':
        return <Check size={16} style={{ color: 'var(--success-primary)' }} />;
      case 'error':
        return <X size={16} style={{ color: 'var(--error-primary)' }} />;
      case 'validating':
      case 'uploading':
        return <div class={styles.spinner} />;
      default:
        return <FileText size={16} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  /**
   * Get Cultural Sensitivity Badge
   */
  const getCulturalBadge = (culturalContext: any) => {
    if (!culturalContext) return null;

    const levelLabels = {
      1: 'General Context',
      2: 'Traditional Knowledge',
      3: 'Sacred Content',
    };

    return (
      <span
        class={`${styles.culturalBadge} ${styles[`cultural-level-${culturalContext.sensitivityLevel}`]}`}
        title={`Cultural Information: ${culturalContext.educationalContext} (Educational Purpose Only)`}
      >
        🌿{' '}
        {levelLabels[culturalContext.sensitivityLevel as keyof typeof levelLabels] ||
          'Cultural Context'}
      </span>
    );
  };

  const validFilesCount = () => uploadFiles().filter(f => f.status === 'success').length;

  return (
    <Card
      class={`${styles.uploadSection} ${props.class || ''}`}
      variant="outlined"
      culturalTheme={props.culturalTheme}
    >
      {/* Upload Header */}
      <div class={styles.uploadHeader}>
        <div class={styles.titleSection}>
          <h3 class={styles.title}>Upload Documents</h3>
          <Show when={props.showCulturalIndicator && props.culturalTheme}>
            <span class={styles.culturalIndicator} title="Cultural context analysis enabled">
              🌿
            </span>
          </Show>
        </div>
        <div class={styles.infoSection}>
          <span class={styles.formatInfo}>
            Supports: {config.acceptedFormats.join(', ')} • Max:{' '}
            {Math.round(config.maxFileSize / 1024 / 1024)}MB
          </span>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        class={`${styles.dropZone} ${isDragOver() ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabindex={0}
        aria-label="Drop files here or click to select files"
      >
        <Upload size={48} class={styles.uploadIcon} />
        <h4 class={styles.dropTitle}>Drop files here or click to browse</h4>
        <p class={styles.dropDescription}>
          Educational documents will be analyzed for cultural context (information only)
        </p>

        <Input
          type="file"
          multiple
          accept={config.acceptedFormats.join(',')}
          onChange={handleFileInputChange}
          class={styles.fileInput}
          aria-label="Select files to upload"
        />

        <Button
          variant="primary"
          size="lg"
          culturalTheme={props.culturalTheme || 'default'}
          ariaLabel="Browse for files"
          onClick={() => {
            const input = document.querySelector(`.${styles.fileInput}`) as HTMLInputElement;
            input?.click();
          }}
        >
          <Upload size={18} />
          Browse Files
        </Button>
      </div>

      {/* File List */}
      <Show when={uploadFiles().length > 0}>
        <div class={styles.fileList}>
          <div class={styles.listHeader}>
            <h4 class={styles.listTitle}>Selected Files ({uploadFiles().length})</h4>
            <Show when={validFilesCount() > 0}>
              <Button
                variant="primary"
                size="sm"
                culturalTheme={props.culturalTheme || 'default'}
                onClick={startUpload}
                disabled={props.isUploading}
                ariaLabel={`Upload ${validFilesCount()} valid files`}
              >
                Upload {validFilesCount()} Files
              </Button>
            </Show>
          </div>

          <div class={styles.files}>
            <For each={uploadFiles()}>
              {file => (
                <div class={`${styles.fileItem} ${styles[`status-${file.status}`]}`}>
                  <div class={styles.fileInfo}>
                    <div class={styles.fileIcon}>{getStatusIcon(file.status)}</div>
                    <div class={styles.fileDetails}>
                      <span class={styles.fileName}>{file.file.name}</span>
                      <span class={styles.fileSize}>
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>

                  <div class={styles.fileStatus}>
                    {/* Cultural Information Badge (EDUCATIONAL ONLY) */}
                    <Show when={file.culturalContext}>
                      {getCulturalBadge(file.culturalContext)}
                    </Show>

                    {/* Status Text */}
                    <span class={styles.statusText}>
                      {file.status === 'validating' && 'Validating...'}
                      {file.status === 'uploading' && `Uploading ${file.progress}%`}
                      {file.status === 'success' && 'Ready to upload'}
                      {file.status === 'error' && 'Error'}
                      {file.status === 'idle' && 'Waiting...'}
                    </span>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      ariaLabel={`Remove ${file.file.name}`}
                    >
                      <X size={16} />
                    </Button>
                  </div>

                  {/* Error Message */}
                  <Show when={file.error}>
                    <div class={styles.errorMessage}>
                      <AlertCircle size={16} />
                      {file.error}
                    </div>
                  </Show>

                  {/* Cultural Information Display (EDUCATIONAL ONLY) */}
                  <Show when={file.culturalContext && file.culturalContext.educationalContext}>
                    <div class={styles.culturalInfo}>
                      <Info size={16} />
                      <span>Cultural Context: {file.culturalContext.educationalContext}</span>
                      <span class={styles.infoNote}>(Educational information only)</span>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Cultural Information Notice (ANTI-CENSORSHIP) */}
      <div class={styles.culturalNotice}>
        <Info size={16} />
        <span>
          Cultural analysis provides educational context only and never restricts access to
          information. All cultural content is preserved with respect for multiple perspectives and
          community sovereignty.
        </span>
      </div>
    </Card>
  );
};

export default UploadSection;
