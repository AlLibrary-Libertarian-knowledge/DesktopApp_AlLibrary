/**
 * DocumentUpload Composite Component
 *
 * A comprehensive document upload interface using enhanced foundation components
 * with cultural themes, accessibility, and security validation.
 *
 * ANTI-CENSORSHIP CORE: Cultural information is displayed for educational purposes only,
 * never for access restriction. Multiple perspectives supported equally.
 */

import { Component, createSignal, Show, For } from 'solid-js';
import { Button, Input, Card, Modal } from '../../foundation';
import { Upload, FileText, AlertCircle, CheckCircle, Clock, Shield, Globe } from 'lucide-solid';
import { UploadService } from '../../../services/upload/uploadService';
import { validationService } from '../../../services/validationService';
import type { Document } from '../../../types/Document';
import type {
  UploadSession,
  UploadResult,
  UploadOptions,
} from '../../../services/upload/uploadService';
import styles from './DocumentUpload.module.css';

/**
 * Document Upload Props Interface
 */
export interface DocumentUploadProps {
  // Core Properties
  onUploadComplete?: (documents: Document[]) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  allowedFormats?: string[];

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: 'indigenous' | 'traditional' | 'modern' | 'ceremonial' | 'community' | 'default';
  culturalContext?: string;
  showCulturalIndicator?: boolean;

  // Security Properties
  requiresVerification?: boolean;
  securityLevel?: 'low' | 'medium' | 'high' | 'critical';

  // Accessibility Properties
  ariaLabel?: string;
  ariaDescribedBy?: string;

  // Event Handlers
  onUploadStart?: () => void;
  onUploadProgress?: (session: UploadSession) => void;
  onValidationComplete?: (result: any) => void;
}

/**
 * Document Upload Component
 *
 * Provides a comprehensive upload interface with cultural context preservation,
 * security validation, and accessibility features.
 */
const DocumentUpload: Component<DocumentUploadProps> = props => {
  // Upload service instance
  const uploadService = new UploadService();

  // Upload state
  const [isUploading, setIsUploading] = createSignal(false);
  const [uploadSessions, setUploadSessions] = createSignal<UploadSession[]>([]);
  const [uploadedFiles, setUploadedFiles] = createSignal<File[]>([]);
  const [validationResults, setValidationResults] = createSignal<any[]>([]);
  const [showUploadModal, setShowUploadModal] = createSignal(false);
  const [showValidationModal, setShowValidationModal] = createSignal(false);
  const [dragActive, setDragActive] = createSignal(false);
  const [uploadError, setUploadError] = createSignal<string>('');

  // Cultural context state
  const [culturalContext, setCulturalContext] = createSignal(props.culturalContext || '');
  const [sensitivityLevel, setSensitivityLevel] = createSignal<number>(1);

  /**
   * Handle file selection
   */
  const handleFileSelect = (files: FileList) => {
    const fileArray = Array.from(files);
    setUploadedFiles(fileArray);
    setShowUploadModal(true);
  };

  /**
   * Handle drag and drop
   */
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  /**
   * Validate files before upload
   */
  const validateFiles = async (files: File[]): Promise<boolean> => {
    try {
      const results = await Promise.all(
        files.map(async file => {
          // Convert File to ArrayBuffer for validation
          const arrayBuffer = await file.arrayBuffer();
          const result = await validationService.validateDocument(arrayBuffer, {
            userId: 'current-user',
            sessionId: 'current-session',
            inputType: 'file_upload',
            source: 'user_input',
            fileName: file.name,
            fileSize: file.size,
          });
          return { file, result };
        })
      );

      setValidationResults(results.map(r => r.result));

      // Check if any files failed validation
      const hasErrors = results.some(r => !r.result.valid);
      if (hasErrors) {
        setShowValidationModal(true);
        return false;
      }

      return true;
    } catch (error) {
      console.error('File validation error:', error);
      setUploadError('File validation failed');
      return false;
    }
  };

  /**
   * Upload files with cultural context preservation
   */
  const uploadFiles = async () => {
    if (uploadedFiles().length === 0) return;

    try {
      setIsUploading(true);
      setUploadError('');

      // Validate files first
      const isValid = await validateFiles(uploadedFiles());
      if (!isValid) {
        setIsUploading(false);
        return;
      }

      props.onUploadStart?.();

      // Upload each file with progress tracking
      const uploadPromises = uploadedFiles().map(async (file, index) => {
        const metadata = {
          title: file.name,
          description: culturalContext(),
          culturalMetadata: {
            sensitivityLevel: sensitivityLevel(),
            culturalOrigin: culturalContext(),
            traditionalProtocols: [],
            educationalResources: [],
            informationOnly: true,
            educationalPurpose: true,
          },
        };

        const options: UploadOptions = {
          userId: 'current-user',
          autoTagging: true,
          culturalAnalysis: true,
          securityValidation: true,
          generateThumbnail: true,
          onProgress: (session: UploadSession) => {
            setUploadSessions(prev => {
              const newSessions = [...prev];
              newSessions[index] = session;
              return newSessions;
            });
            props.onUploadProgress?.(session);
          },
        };

        return await uploadService.uploadDocument(file, metadata, options);
      });

      const results = await Promise.all(uploadPromises);

      // Filter successful uploads
      const successfulUploads = results.filter(r => r.success);
      const failedUploads = results.filter(r => !r.success);

      if (failedUploads.length > 0) {
        setUploadError(`${failedUploads.length} files failed to upload`);
      }

      if (successfulUploads.length > 0) {
        const documents = successfulUploads
          .map(r => r.document)
          .filter((doc): doc is Document => doc !== undefined);

        props.onUploadComplete?.(documents);

        // Reset state
        setUploadedFiles([]);
        setUploadSessions([]);
        setValidationResults([]);
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Upload failed');
      props.onUploadError?.('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Get cultural sensitivity label
   */
  const getCulturalSensitivityLabel = (level: number): string => {
    const labels = {
      1: 'General Cultural Context',
      2: 'Community Knowledge',
      3: 'Traditional Knowledge',
      4: 'Sacred Content',
      5: 'Ceremonial Content',
    };
    return labels[level as keyof typeof labels] || 'Cultural Context';
  };

  return (
    <div class={styles['document-upload']}>
      {/* Upload Area */}
      <Card
        culturalTheme={props.culturalTheme || 'default'}
        culturalContext={props.culturalContext || ''}
        showCulturalIndicator={props.showCulturalIndicator || false}
        contentType="general"
        ariaLabel={props.ariaLabel || 'Document upload area'}
        class={styles['upload-card'] || ''}
      >
        <div class={styles['upload-header']}>
          <h3 class={styles['upload-title']}>
            <Upload size={20} />
            Upload Documents
          </h3>
          <p class={styles['upload-subtitle']}>
            Share cultural heritage with respect and preservation
          </p>
        </div>

        {/* Drag and Drop Area */}
        <div
          class={`${styles['upload-area']} ${dragActive() ? styles['drag-active'] : ''}`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          role="button"
          tabindex={0}
          aria-label="Drag and drop files here or click to select"
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              document.getElementById('file-input')?.click();
            }
          }}
        >
          <div class={styles['upload-content']}>
            <Upload size={48} class={styles['upload-icon'] || ''} />
            <h4 class={styles['upload-text']}>Drag & drop files here or click to browse</h4>
            <p class={styles['upload-hint']}>Supports PDF, EPUB, and other document formats</p>

            {/* Cultural Context Indicator */}
            <Show when={props.showCulturalIndicator && props.culturalTheme}>
              <div class={styles['cultural-indicator']}>
                <Globe size={16} />
                <span>Cultural Context Preserved</span>
              </div>
            </Show>

            {/* Security Indicator */}
            <div class={styles['security-indicator']}>
              <Shield size={16} />
              <span>Security Validated</span>
            </div>
          </div>

          <input
            id="file-input"
            type="file"
            multiple
            accept=".pdf,.epub,.doc,.docx,.txt"
            onChange={e => {
              if (e.currentTarget.files) {
                handleFileSelect(e.currentTarget.files);
              }
            }}
            class={styles['file-input']}
            aria-label="Select files to upload"
          />
        </div>

        {/* Upload Progress */}
        <Show when={uploadSessions().length > 0}>
          <div class={styles['upload-progress']}>
            <For each={uploadSessions()}>
              {(session, index) => (
                <div class={styles['progress-item']}>
                  <div class={styles['progress-info']}>
                    <span class={styles['filename']}>{session.fileName}</span>
                    <span class={styles['progress-text']}>{session.progress}%</span>
                  </div>
                  <div class={styles['progress-bar']}>
                    <div
                      class={styles['progress-fill']}
                      style={{ width: `${session.progress}%` }}
                    />
                  </div>
                  <Show when={session.status === 'validating'}>
                    <Clock size={16} class={styles['status-icon'] || ''} />
                  </Show>
                  <Show when={session.status === 'uploading'}>
                    <div class={styles['spinner']} />
                  </Show>
                  <Show when={session.status === 'completed'}>
                    <CheckCircle size={16} class={styles['status-icon'] || ''} />
                  </Show>
                  <Show when={session.status === 'error'}>
                    <AlertCircle size={16} class={styles['status-icon'] || ''} />
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Error Display */}
        <Show when={uploadError()}>
          <div class={styles['upload-error']} role="alert">
            <AlertCircle size={16} />
            <span>{uploadError()}</span>
          </div>
        </Show>
      </Card>

      {/* Upload Modal */}
      <Modal
        open={showUploadModal()}
        onClose={() => setShowUploadModal(false)}
        title="Upload Documents"
        subtitle="Configure cultural context and upload settings"
        size="lg"
        culturalTheme={props.culturalTheme || 'default'}
        culturalContext="Document upload configuration"
        contentType="general"
        ariaLabel="Upload configuration modal"
      >
        <div class={styles['upload-modal-content']}>
          {/* Cultural Context Configuration */}
          <div class={styles['cultural-config']}>
            <h4>Cultural Context</h4>
            <p>Provide cultural context for educational purposes (optional)</p>

            <Input
              label="Cultural Context"
              placeholder="Describe the cultural significance of these documents..."
              value={culturalContext()}
              onInput={value => setCulturalContext(value)}
              culturalTheme={props.culturalTheme || 'default'}
              validationType="cultural"
              ariaLabel="Cultural context description"
            />

            <div class={styles['sensitivity-selector']}>
              <label>Sensitivity Level</label>
              <select
                value={sensitivityLevel()}
                onChange={e => setSensitivityLevel(Number(e.currentTarget.value))}
                class={styles['sensitivity-select']}
              >
                <option value={1}>General Cultural Context</option>
                <option value={2}>Community Knowledge</option>
                <option value={3}>Traditional Knowledge</option>
                <option value={4}>Sacred Content</option>
                <option value={5}>Ceremonial Content</option>
              </select>
              <p class={styles['sensitivity-hint']}>
                {getCulturalSensitivityLabel(sensitivityLevel())}
              </p>
            </div>
          </div>

          {/* File List */}
          <div class={styles['file-list']}>
            <h4>Selected Files ({uploadedFiles().length})</h4>
            <For each={uploadedFiles()}>
              {file => (
                <div class={styles['file-item']}>
                  <FileText size={16} />
                  <span class={styles['file-name']}>{file.name}</span>
                  <span class={styles['file-size']}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}
            </For>
          </div>
        </div>

        <div slot="footer" class={styles['modal-footer']}>
          <Button
            variant="ghost"
            onClick={() => setShowUploadModal(false)}
            disabled={isUploading()}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={uploadFiles}
            disabled={isUploading() || uploadedFiles().length === 0}
            loading={isUploading()}
          >
            <Show when={!isUploading()}>
              <Upload size={16} />
              Upload Documents
            </Show>
            <Show when={isUploading()}>Uploading...</Show>
          </Button>
        </div>
      </Modal>

      {/* Validation Modal */}
      <Modal
        open={showValidationModal()}
        onClose={() => setShowValidationModal(false)}
        title="Validation Results"
        subtitle="Review validation results for uploaded files"
        size="md"
        culturalTheme={props.culturalTheme || 'default'}
        contentType="general"
        ariaLabel="Validation results modal"
      >
        <div class={styles['validation-content']}>
          <For each={validationResults()}>
            {(result, index) => (
              <div class={styles['validation-item']}>
                <div class={styles['validation-header']}>
                  <span class={styles['filename']}>{uploadedFiles()[index()]?.name}</span>
                  <Show when={result.valid}>
                    <CheckCircle size={16} class={styles['valid-icon'] || ''} />
                  </Show>
                  <Show when={!result.valid}>
                    <AlertCircle size={16} class={styles['invalid-icon'] || ''} />
                  </Show>
                </div>

                <Show when={!result.valid && result.errors}>
                  <div class={styles['validation-errors']}>
                    <For each={result.errors}>
                      {error => <div class={styles['error-item']}>{error.message}</div>}
                    </For>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>

        <div slot="footer" class={styles['modal-footer']}>
          <Button variant="ghost" onClick={() => setShowValidationModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowValidationModal(false);
              uploadFiles();
            }}
          >
            Continue Upload
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentUpload;
