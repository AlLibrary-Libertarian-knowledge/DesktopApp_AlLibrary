/**
 * Document Viewer Composite Component
 *
 * Advanced document viewer supporting PDF, EPUB, and text formats.
 * Includes cultural context display and accessibility features.
 */

import { Component, createSignal, Show, onMount, onCleanup } from 'solid-js';
import { ChevronLeft, ChevronRight, X } from 'lucide-solid';
import { Button } from '../../foundation/Button';
import styles from './DocumentViewer.module.css';

export interface DocumentViewerProps {
  /** Document URL or content */
  documentUrl?: string;
  /** Document content (for text documents) */
  documentContent?: string;
  /** Document type */
  documentType: 'pdf' | 'epub' | 'text' | 'markdown';
  /** Document title */
  title?: string;
  /** Current page number */
  currentPage?: number;
  /** Total pages */
  totalPages?: number;
  /** Zoom level */
  zoomLevel?: number;
  /** Show controls */
  showControls?: boolean;
  /** Show cultural context */
  showCulturalContext?: boolean;
  /** Cultural context information */
  culturalContext?: any;
  /** Reading mode */
  readingMode?: 'normal' | 'fullscreen' | 'focus';
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Zoom change handler */
  onZoomChange?: (zoom: number) => void;
  /** Mode change handler */
  onModeChange?: (mode: string) => void;
}

export const DocumentViewer: Component<DocumentViewerProps> = props => {
  const [currentPage, setCurrentPage] = createSignal(props.currentPage || 1);
  const [zoomLevel, setZoomLevel] = createSignal(props.zoomLevel || 100);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  // Default props
  const showControls = () => props.showControls ?? true;
  const showCulturalContext = () => props.showCulturalContext ?? true;
  const readingMode = () => props.readingMode || 'normal';
  const totalPages = () => props.totalPages || 1;

  // Handle page navigation
  const handlePageChange = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages()));
    setCurrentPage(newPage);
    props.onPageChange?.(newPage);
  };

  // Handle zoom change
  const handleZoomChange = (zoom: number) => {
    const newZoom = Math.max(25, Math.min(zoom, 500));
    setZoomLevel(newZoom);
    props.onZoomChange?.(newZoom);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        handlePageChange(currentPage() - 1);
        break;
      case 'ArrowRight':
      case 'PageDown':
        e.preventDefault();
        handlePageChange(currentPage() + 1);
        break;
      case 'Home':
        e.preventDefault();
        handlePageChange(1);
        break;
      case 'End':
        e.preventDefault();
        handlePageChange(totalPages());
        break;
      case '+':
      case '=':
        if (e.ctrlKey) {
          e.preventDefault();
          handleZoomChange(zoomLevel() + 25);
        }
        break;
      case '-':
        if (e.ctrlKey) {
          e.preventDefault();
          handleZoomChange(zoomLevel() - 25);
        }
        break;
      case '0':
        if (e.ctrlKey) {
          e.preventDefault();
          handleZoomChange(100);
        }
        break;
    }
  };

  // Setup keyboard listeners
  onMount(() => {
    document.addEventListener('keydown', handleKeyDown);
    setIsLoading(false);
  });

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  // Generate CSS classes
  const viewerClasses = () =>
    [
      styles.documentViewer,
      styles[`mode-${readingMode()}`],
      styles[`type-${props.documentType}`],
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  // Render document content based on type
  const renderDocumentContent = () => {
    if (isLoading()) {
      return (
        <div class={styles.loadingState}>
          <div class={styles.loadingSpinner}></div>
          <div class={styles.loadingText}>Loading document...</div>
        </div>
      );
    }

    if (error()) {
      return (
        <div class={styles.errorState}>
          <div class={styles.errorIcon}>⚠️</div>
          <div class={styles.errorText}>{error()}</div>
          <button class={styles.retryButton} onClick={() => setError(null)}>
            Retry
          </button>
        </div>
      );
    }

    switch (props.documentType) {
      case 'pdf':
        return (
          <div class={styles.pdfViewer}>
            <iframe
              src={props.documentUrl}
              class={styles.pdfFrame}
              title={props.title || 'PDF Document'}
              style={`transform: scale(${zoomLevel() / 100})`}
            />
          </div>
        );

      case 'epub':
        return (
          <div class={styles.epubViewer}>
            <div class={styles.epubContent}>
              {/* EPUB content would be rendered here */}
              <div class={styles.placeholderContent}>EPUB viewer implementation needed</div>
            </div>
          </div>
        );

      case 'text':
      case 'markdown':
        return (
          <div class={styles.textViewer}>
            <div class={styles.textContent} style={`font-size: ${zoomLevel()}%`}>
              <pre class={styles.textPre}>{props.documentContent}</pre>
            </div>
          </div>
        );

      default:
        return (
          <div class={styles.unsupportedType}>
            <div class={styles.unsupportedIcon}>📄</div>
            <div class={styles.unsupportedText}>
              Unsupported document type: {props.documentType}
            </div>
          </div>
        );
    }
  };

  return (
    <div class={viewerClasses()} data-testid={props['data-testid']}>
      {/* Document Header */}
      <Show when={props.title}>
        <div class={styles.documentHeader}>
          <h2 class={styles.documentTitle}>{props.title}</h2>

          {/* Cultural Context Indicator */}
          <Show when={showCulturalContext() && props.culturalContext}>
            <div class={styles.culturalIndicator}>
              <span class={styles.culturalIcon}>🌿</span>
              <span class={styles.culturalText}>Cultural context available</span>
            </div>
          </Show>
        </div>
      </Show>

      {/* Document Controls */}
      <Show when={showControls()}>
        <div class={styles.documentControls}>
          {/* Navigation Controls */}
          <div class={styles.navigationControls}>
            <button
              class={styles.controlButton}
              onClick={() => handlePageChange(1)}
              disabled={currentPage() === 1}
              aria-label="First page"
            >
              ⏮️
            </button>

            <button
              class={styles.controlButton}
              onClick={() => handlePageChange(currentPage() - 1)}
              disabled={currentPage() === 1}
              aria-label="Previous page"
            >
              ◀️
            </button>

            <div class={styles.pageInfo}>
              <input
                type="number"
                class={styles.pageInput}
                value={currentPage()}
                min={1}
                max={totalPages()}
                onChange={e => handlePageChange(parseInt(e.target.value) || 1)}
                aria-label="Current page"
              />
              <span class={styles.pageTotal}>of {totalPages()}</span>
            </div>

            <button
              class={styles.controlButton}
              onClick={() => handlePageChange(currentPage() + 1)}
              disabled={currentPage() === totalPages()}
              aria-label="Next page"
            >
              ▶️
            </button>

            <button
              class={styles.controlButton}
              onClick={() => handlePageChange(totalPages())}
              disabled={currentPage() === totalPages()}
              aria-label="Last page"
            >
              ⏭️
            </button>
          </div>

          {/* Zoom Controls */}
          <div class={styles.zoomControls}>
            <button
              class={styles.controlButton}
              onClick={() => handleZoomChange(zoomLevel() - 25)}
              aria-label="Zoom out"
            >
              🔍➖
            </button>

            <div class={styles.zoomInfo}>
              <input
                type="number"
                class={styles.zoomInput}
                value={zoomLevel()}
                min={25}
                max={500}
                step={25}
                onChange={e => handleZoomChange(parseInt(e.target.value) || 100)}
                aria-label="Zoom level"
              />
              <span class={styles.zoomUnit}>%</span>
            </div>

            <button
              class={styles.controlButton}
              onClick={() => handleZoomChange(zoomLevel() + 25)}
              aria-label="Zoom in"
            >
              🔍➕
            </button>

            <button
              class={styles.controlButton}
              onClick={() => handleZoomChange(100)}
              aria-label="Reset zoom"
            >
              🔍🔄
            </button>
          </div>

          {/* Reading Mode Controls */}
          <div class={styles.modeControls}>
            <button
              class={`${styles.controlButton} ${readingMode() === 'fullscreen' ? styles.active : ''}`}
              onClick={() => props.onModeChange?.('fullscreen')}
              aria-label="Fullscreen mode"
            >
              ⛶
            </button>

            <button
              class={`${styles.controlButton} ${readingMode() === 'focus' ? styles.active : ''}`}
              onClick={() => props.onModeChange?.('focus')}
              aria-label="Focus mode"
            >
              🎯
            </button>
          </div>
        </div>
      </Show>

      {/* Document Content */}
      <div class={styles.documentContent}>{renderDocumentContent()}</div>

      {/* Cultural Context Panel */}
      <Show when={showCulturalContext() && props.culturalContext}>
        <div class={styles.culturalContextPanel}>
          <div class={styles.contextHeader}>
            <h3 class={styles.contextTitle}>Cultural Context</h3>
            <span class={styles.informationBadge}>Information Only</span>
          </div>
          <div class={styles.contextContent}>
            <p class={styles.contextDescription}>
              Cultural context information is provided for educational purposes to enhance
              understanding and appreciation of cultural heritage.
            </p>
          </div>
        </div>
      </Show>

      {/* Keyboard Shortcuts Help */}
      <div class={styles.keyboardHelp}>
        <details class={styles.helpDetails}>
          <summary class={styles.helpSummary}>Keyboard Shortcuts</summary>
          <div class={styles.helpContent}>
            <div class={styles.shortcutGroup}>
              <strong>Navigation:</strong>
              <div>← → PageUp PageDown: Navigate pages</div>
              <div>Home End: First/Last page</div>
            </div>
            <div class={styles.shortcutGroup}>
              <strong>Zoom:</strong>
              <div>Ctrl + +/-: Zoom in/out</div>
              <div>Ctrl + 0: Reset zoom</div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default DocumentViewer;
