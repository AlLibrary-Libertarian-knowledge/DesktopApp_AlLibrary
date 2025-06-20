import { Component, JSX, createSignal, Show, createEffect, onCleanup } from 'solid-js';
import { Button, Input, Card, Modal } from '../../foundation';
import {
  X,
  Eye,
  Edit,
  Save,
  Download,
  Share,
  Info,
  AlertCircle,
  FileText,
  Image,
  BookOpen,
  Calendar,
  User,
  Tag,
  Globe,
} from 'lucide-solid';
import styles from './DocumentPreview.module.css';

/**
 * Document Preview Mode Types
 */
export type PreviewMode = 'view' | 'edit' | 'cultural-context';

/**
 * Document Format Types for Preview
 */
export type DocumentFormat = 'pdf' | 'epub' | 'text' | 'markdown' | 'image';

/**
 * Cultural Context Information Interface
 */
export interface CulturalPreviewContext {
  sensitivityLevel: number;
  culturalOrigin: string;
  educationalContext: string;
  informationOnly: true; // MANDATORY: Cultural info is educational only
  educationalPurpose: true;
  traditionalProtocols?: string[];
  communityContext?: string;
  historicalContext?: string;
  alternativePerspectives?: string[];
  sourceVerification?: {
    originalSource: string;
    verificationDate: Date;
    verificationMethod: string;
    authenticityScore: number;
  };
}

/**
 * Document Metadata for Preview
 */
export interface DocumentPreviewMetadata {
  id: string;
  title: string;
  description?: string;
  author?: string;
  publishDate?: Date;
  uploadDate: Date;
  format: DocumentFormat;
  size: number;
  pages?: number;
  language: string;
  tags: string[];
  categories: string[];

  // Source Information (TRANSPARENCY)
  originalSource?: string;
  sourceUrl?: string;
  sourceVerification?: any;

  // Cultural Context (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalContext?: CulturalPreviewContext;

  // Security Status (Technical Only)
  securityValidated: boolean;
  lastScanned?: Date;
  scanResults?: any;
}

/**
 * Document Preview Props Interface
 * Follows SOLID principles with cultural theme support and anti-censorship compliance
 */
export interface DocumentPreviewProps {
  // Core Document Properties
  document: DocumentPreviewMetadata;
  contentUrl?: string;
  isOpen: boolean;

  // Preview Configuration
  defaultMode?: PreviewMode;
  enableEditing?: boolean;
  enableDownload?: boolean;
  enableSharing?: boolean;

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: 'indigenous' | 'traditional' | 'modern' | 'ceremonial' | 'community' | 'default';
  showCulturalContext?: boolean;
  enableCulturalEducation?: boolean; // For educational resources only
  showAlternativePerspectives?: boolean; // Support multiple viewpoints

  // Source Verification (TRANSPARENCY)
  showSourceVerification?: boolean;
  enableProvenanceTracking?: boolean;

  // Event Handlers
  onClose?: () => void;
  onEdit?: (metadata: DocumentPreviewMetadata) => void;
  onSave?: (metadata: DocumentPreviewMetadata) => void;
  onDownload?: (document: DocumentPreviewMetadata) => void;
  onShare?: (document: DocumentPreviewMetadata) => void;
  onCulturalContextRequest?: (document: DocumentPreviewMetadata) => void;

  // Accessibility
  ariaLabel?: string;
  class?: string;
}

/**
 * Document Preview Component
 *
 * Provides document preview with cultural context and metadata editing.
 * Cultural information is provided for educational purposes only - never restricts access.
 * All documents are viewable with appropriate educational context.
 *
 * @example
 * ```tsx
 * <DocumentPreview
 *   document={document}
 *   isOpen={true}
 *   culturalTheme="indigenous"
 *   showCulturalContext={true}
 *   showAlternativePerspectives={true}
 *   onClose={handleClose}
 * />
 * ```
 */
const DocumentPreview: Component<DocumentPreviewProps> = props => {
  // Component state management
  const [currentMode, setCurrentMode] = createSignal<PreviewMode>(props.defaultMode || 'view');
  const [isLoading, setIsLoading] = createSignal(false);
  const [editedMetadata, setEditedMetadata] = createSignal<DocumentPreviewMetadata>(props.document);
  const [hasUnsavedChanges, setHasUnsavedChanges] = createSignal(false);
  const [showFullCulturalContext, setShowFullCulturalContext] = createSignal(false);

  /**
   * Handle metadata field changes
   */
  const handleFieldChange = (field: keyof DocumentPreviewMetadata, value: any) => {
    setEditedMetadata(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };

  /**
   * Handle tag changes
   */
  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    handleFieldChange('tags', tags);
  };

  /**
   * Save changes
   */
  const handleSave = async () => {
    if (!hasUnsavedChanges()) return;

    setIsLoading(true);
    try {
      await props.onSave?.(editedMetadata());
      setHasUnsavedChanges(false);
      setCurrentMode('view');
    } catch (error) {
      console.error('Failed to save document metadata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    if (hasUnsavedChanges()) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmCancel) return;
    }

    setEditedMetadata(props.document);
    setHasUnsavedChanges(false);
    setCurrentMode('view');
  };

  /**
   * Get cultural sensitivity badge
   */
  const getCulturalBadge = (culturalContext: CulturalPreviewContext | undefined) => {
    if (!culturalContext || !props.showCulturalContext) return null;

    const levelLabels = {
      1: 'General Context',
      2: 'Traditional Knowledge',
      3: 'Sacred Content',
    };

    const level = culturalContext.sensitivityLevel;

    return (
      <span
        class={`${styles.culturalBadge} ${styles[`cultural-level-${level}`]}`}
        title={`Cultural Information: ${culturalContext.educationalContext} (Educational Purpose Only)`}
      >
        🌿 {levelLabels[level as keyof typeof levelLabels] || 'Cultural Context'}
      </span>
    );
  };

  /**
   * Get format icon
   */
  const getFormatIcon = (format: DocumentFormat) => {
    switch (format) {
      case 'pdf':
        return <FileText size={20} />;
      case 'epub':
        return <BookOpen size={20} />;
      case 'image':
        return <Image size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Format date
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Cleanup effect
   */
  createEffect(() => {
    if (!props.isOpen) {
      setCurrentMode(props.defaultMode || 'view');
      setHasUnsavedChanges(false);
      setEditedMetadata(props.document);
    }
  });

  /**
   * Keyboard shortcuts
   */
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!props.isOpen) return;

    if (e.key === 'Escape') {
      if (currentMode() === 'edit' && hasUnsavedChanges()) {
        handleCancelEdit();
      } else {
        props.onClose?.();
      }
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          if (currentMode() === 'edit') {
            handleSave();
          }
          break;
        case 'e':
          e.preventDefault();
          if (props.enableEditing && currentMode() === 'view') {
            setCurrentMode('edit');
          }
          break;
      }
    }
  };

  createEffect(() => {
    if (props.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      onCleanup(() => document.removeEventListener('keydown', handleKeyDown));
    }
  });

  const currentDoc = () => (currentMode() === 'edit' ? editedMetadata() : props.document);

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={() => {
        if (hasUnsavedChanges()) {
          const confirmClose = window.confirm(
            'You have unsaved changes. Are you sure you want to close?'
          );
          if (!confirmClose) return;
        }
        props.onClose?.();
      }}
      size="large"
      class={`${styles.documentPreview} ${props.class || ''}`}
      ariaLabel={props.ariaLabel || `Preview of ${currentDoc().title}`}
    >
      <div class={styles.previewContainer}>
        {/* Header */}
        <div class={styles.previewHeader}>
          <div class={styles.documentInfo}>
            <div class={styles.documentIcon}>{getFormatIcon(currentDoc().format)}</div>
            <div class={styles.documentTitleSection}>
              <Show
                when={currentMode() === 'edit'}
                fallback={
                  <div>
                    <h2 class={styles.documentTitle}>{currentDoc().title}</h2>
                    <div class={styles.documentMeta}>
                      <span>{currentDoc().format.toUpperCase()}</span>
                      <span>{formatFileSize(currentDoc().size)}</span>
                      {currentDoc().pages && <span>{currentDoc().pages} pages</span>}
                    </div>
                  </div>
                }
              >
                <div class={styles.editTitleSection}>
                  <Input
                    value={editedMetadata().title}
                    onChange={value => handleFieldChange('title', value)}
                    placeholder="Document title"
                    class={styles.titleInput}
                    ariaLabel="Document title"
                  />
                  <div class={styles.documentMeta}>
                    <span>{currentDoc().format.toUpperCase()}</span>
                    <span>{formatFileSize(currentDoc().size)}</span>
                    {currentDoc().pages && <span>{currentDoc().pages} pages</span>}
                  </div>
                </div>
              </Show>
            </div>
            {getCulturalBadge(currentDoc().culturalContext)}
          </div>

          <div class={styles.headerActions}>
            {/* Mode Toggle Buttons */}
            <div class={styles.modeToggle}>
              <Button
                variant={currentMode() === 'view' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => {
                  if (hasUnsavedChanges()) {
                    const confirmSwitch = window.confirm(
                      'You have unsaved changes. Switch modes anyway?'
                    );
                    if (!confirmSwitch) return;
                  }
                  setCurrentMode('view');
                }}
                ariaLabel="View mode"
              >
                <Eye size={16} />
                View
              </Button>

              <Show when={props.enableEditing}>
                <Button
                  variant={currentMode() === 'edit' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentMode('edit')}
                  ariaLabel="Edit mode"
                >
                  <Edit size={16} />
                  Edit
                </Button>
              </Show>

              <Show when={props.showCulturalContext}>
                <Button
                  variant={currentMode() === 'cultural-context' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentMode('cultural-context')}
                  ariaLabel="Cultural context mode"
                >
                  <Info size={16} />
                  Context
                </Button>
              </Show>
            </div>

            {/* Action Buttons */}
            <div class={styles.actionButtons}>
              <Show when={currentMode() === 'edit'}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges() || isLoading()}
                  ariaLabel="Save changes"
                >
                  <Save size={16} />
                  Save
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isLoading()}
                  ariaLabel="Cancel editing"
                >
                  Cancel
                </Button>
              </Show>

              <Show when={currentMode() !== 'edit'}>
                <Show when={props.enableDownload}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => props.onDownload?.(currentDoc())}
                    ariaLabel="Download document"
                  >
                    <Download size={16} />
                  </Button>
                </Show>

                <Show when={props.enableSharing}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => props.onShare?.(currentDoc())}
                    ariaLabel="Share document"
                  >
                    <Share size={16} />
                  </Button>
                </Show>
              </Show>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => props.onClose?.()}
                ariaLabel="Close preview"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div class={styles.previewContent}>
          {/* Document View Mode */}
          <Show when={currentMode() === 'view'}>
            <div class={styles.documentViewer}>
              <Show
                when={props.contentUrl}
                fallback={
                  <div class={styles.noPreview}>
                    <FileText size={48} />
                    <h3>Preview not available</h3>
                    <p>Document preview could not be loaded</p>
                  </div>
                }
              >
                <iframe
                  src={props.contentUrl}
                  class={styles.documentFrame}
                  title={`Preview of ${currentDoc().title}`}
                />
              </Show>
            </div>
          </Show>

          {/* Edit Mode */}
          <Show when={currentMode() === 'edit'}>
            <div class={styles.editMode}>
              <div class={styles.editForm}>
                <div class={styles.formSection}>
                  <h3 class={styles.sectionTitle}>Basic Information</h3>

                  <div class={styles.formGroup}>
                    <label class={styles.formLabel}>Description</label>
                    <textarea
                      value={editedMetadata().description || ''}
                      onInput={e => handleFieldChange('description', e.target.value)}
                      placeholder="Document description"
                      class={styles.textareaInput}
                      rows={3}
                    />
                  </div>

                  <div class={styles.formRow}>
                    <div class={styles.formGroup}>
                      <label class={styles.formLabel}>Author</label>
                      <Input
                        value={editedMetadata().author || ''}
                        onChange={value => handleFieldChange('author', value)}
                        placeholder="Author name"
                      />
                    </div>

                    <div class={styles.formGroup}>
                      <label class={styles.formLabel}>Language</label>
                      <Input
                        value={editedMetadata().language}
                        onChange={value => handleFieldChange('language', value)}
                        placeholder="Language"
                      />
                    </div>
                  </div>

                  <div class={styles.formGroup}>
                    <label class={styles.formLabel}>Tags</label>
                    <Input
                      value={editedMetadata().tags.join(', ')}
                      onChange={handleTagsChange}
                      placeholder="Enter tags separated by commas"
                    />
                  </div>
                </div>

                {/* Source Information Section (TRANSPARENCY) */}
                <Show when={props.showSourceVerification}>
                  <div class={styles.formSection}>
                    <h3 class={styles.sectionTitle}>Source Information</h3>

                    <div class={styles.formGroup}>
                      <label class={styles.formLabel}>Original Source</label>
                      <Input
                        value={editedMetadata().originalSource || ''}
                        onChange={value => handleFieldChange('originalSource', value)}
                        placeholder="Original source or repository"
                      />
                    </div>

                    <div class={styles.formGroup}>
                      <label class={styles.formLabel}>Source URL</label>
                      <Input
                        value={editedMetadata().sourceUrl || ''}
                        onChange={value => handleFieldChange('sourceUrl', value)}
                        placeholder="Source URL or reference"
                      />
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          {/* Cultural Context Mode (EDUCATIONAL ONLY) */}
          <Show when={currentMode() === 'cultural-context'}>
            <div class={styles.culturalContextMode}>
              <Show
                when={currentDoc().culturalContext}
                fallback={
                  <div class={styles.noCulturalContext}>
                    <Info size={48} />
                    <h3>No cultural context available</h3>
                    <p>This document does not have cultural context information</p>
                  </div>
                }
              >
                <div class={styles.culturalContent}>
                  <div class={styles.contextHeader}>
                    <h3 class={styles.contextTitle}>Cultural Context</h3>
                    <span class={styles.educationalLabel}>Educational Information Only</span>
                  </div>

                  <Card class={styles.contextSection}>
                    <h4>Cultural Origin & Context</h4>
                    <p>
                      <strong>Origin:</strong> {currentDoc().culturalContext?.culturalOrigin}
                    </p>
                    <p>
                      <strong>Educational Context:</strong>{' '}
                      {currentDoc().culturalContext?.educationalContext}
                    </p>

                    <Show when={currentDoc().culturalContext?.traditionalProtocols?.length}>
                      <div class={styles.protocolsSection}>
                        <h5>Traditional Protocols (Educational)</h5>
                        <ul>
                          <For each={currentDoc().culturalContext?.traditionalProtocols}>
                            {protocol => <li>{protocol}</li>}
                          </For>
                        </ul>
                      </div>
                    </Show>

                    <Show when={currentDoc().culturalContext?.historicalContext}>
                      <div class={styles.historicalSection}>
                        <h5>Historical Context</h5>
                        <p>{currentDoc().culturalContext?.historicalContext}</p>
                      </div>
                    </Show>
                  </Card>

                  {/* Alternative Perspectives (ANTI-CENSORSHIP) */}
                  <Show
                    when={
                      props.showAlternativePerspectives &&
                      currentDoc().culturalContext?.alternativePerspectives?.length
                    }
                  >
                    <Card class={styles.alternativePerspectives}>
                      <h4>Multiple Perspectives</h4>
                      <p class={styles.perspectiveNote}>
                        Different viewpoints and interpretations are presented for educational
                        understanding:
                      </p>
                      <ul>
                        <For each={currentDoc().culturalContext?.alternativePerspectives}>
                          {perspective => <li>{perspective}</li>}
                        </For>
                      </ul>
                    </Card>
                  </Show>

                  {/* Source Verification (TRANSPARENCY) */}
                  <Show when={currentDoc().culturalContext?.sourceVerification}>
                    <Card class={styles.verificationSection}>
                      <h4>Source Verification</h4>
                      <div class={styles.verificationInfo}>
                        <p>
                          <strong>Original Source:</strong>{' '}
                          {currentDoc().culturalContext?.sourceVerification?.originalSource}
                        </p>
                        <p>
                          <strong>Verification Date:</strong>{' '}
                          {formatDate(
                            currentDoc().culturalContext?.sourceVerification?.verificationDate!
                          )}
                        </p>
                        <p>
                          <strong>Method:</strong>{' '}
                          {currentDoc().culturalContext?.sourceVerification?.verificationMethod}
                        </p>
                      </div>
                    </Card>
                  </Show>
                </div>
              </Show>
            </div>
          </Show>
        </div>

        {/* Footer */}
        <div class={styles.previewFooter}>
          <div class={styles.footerInfo}>
            <span class={styles.infoItem}>
              <Calendar size={14} />
              Uploaded: {formatDate(currentDoc().uploadDate)}
            </span>
            <Show when={currentDoc().publishDate}>
              <span class={styles.infoItem}>
                <Calendar size={14} />
                Published: {formatDate(currentDoc().publishDate!)}
              </span>
            </Show>
            <Show when={currentDoc().lastScanned}>
              <span class={styles.infoItem}>
                <AlertCircle size={14} />
                Security Scan: {formatDate(currentDoc().lastScanned!)}
              </span>
            </Show>
          </div>

          {/* Anti-Censorship Notice */}
          <div class={styles.antiCensorshipNotice}>
            <Info size={14} />
            <span>
              Cultural information is provided for educational understanding. All content remains
              accessible with respect for diverse perspectives and community sovereignty.
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentPreview;
