/**
 * DocumentLibrary Composite Component
 *
 * A comprehensive document library interface using enhanced foundation components
 * with cultural context preservation, security validation, and accessibility.
 *
 * ANTI-CENSORSHIP CORE: Cultural information is displayed for educational purposes only,
 * never for access restriction. Multiple perspectives supported equally.
 */

import { Component, createSignal, createMemo, Show, For } from 'solid-js';
import { Button, Card, Input, Modal } from '../../foundation';
import {
  Search,
  Grid,
  List,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
  Share,
  Trash2,
  Tag,
  Calendar,
  FileText,
  Globe,
  Shield,
  Clock,
  Settings,
  RefreshCw,
  Download,
  BookOpen,
} from 'lucide-solid';
import { DocumentStatus } from '../../domain';
import type { Document } from '../../../types/Document';
import type { SearchFilters, SearchOptions } from '../../../services/searchService';
import styles from './DocumentLibrary.module.css';

/**
 * Document Library Props Interface
 */
export interface DocumentLibraryProps {
  // Core Properties
  documents: Document[];
  onDocumentSelect?: (document: Document) => void;
  onDocumentAction?: (action: string, document: Document) => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: SearchFilters) => void;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: 'indigenous' | 'traditional' | 'modern' | 'ceremonial' | 'community' | 'default';
  showCulturalIndicators?: boolean;
  culturalContext?: string;

  // Security Properties
  showSecurityStatus?: boolean;
  securityLevel?: 'low' | 'medium' | 'high' | 'critical';

  // Accessibility Properties
  ariaLabel?: string;
  ariaDescribedBy?: string;

  // Event Handlers
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onBatchAction?: (action: string, documentIds: string[]) => void;
  onRefresh?: () => void;
}

/**
 * Document Library Component
 *
 * Provides a comprehensive document library interface with cultural context preservation,
 * security validation, and accessibility features.
 */
const DocumentLibrary: Component<DocumentLibraryProps> = props => {
  // Library state
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedDocuments, setSelectedDocuments] = createSignal<Set<string>>(new Set());
  const [showFilters, setShowFilters] = createSignal(false);
  const [showSortOptions, setShowSortOptions] = createSignal(false);
  const [sortBy, setSortBy] = createSignal<'title' | 'date' | 'size' | 'cultural'>('date');
  const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('desc');
  const [showDocumentPreview, setShowDocumentPreview] = createSignal(false);
  const [previewDocument, setPreviewDocument] = createSignal<Document | null>(null);

  // Cultural context state
  const [culturalFilters, setCulturalFilters] = createSignal<Set<number>>(new Set([1, 2, 3, 4, 5]));

  /**
   * Handle search input
   */
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    props.onSearch?.(value);
  };

  /**
   * Handle view mode change
   */
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    props.onViewModeChange?.(mode);
  };

  /**
   * Handle document selection
   */
  const handleDocumentSelect = (document: Document) => {
    props.onDocumentSelect?.(document);
  };

  /**
   * Handle document action
   */
  const handleDocumentAction = (action: string, document: Document) => {
    props.onDocumentAction?.(action, document);
  };

  /**
   * Toggle document selection
   */
  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  /**
   * Select all documents
   */
  const selectAllDocuments = () => {
    setSelectedDocuments(new Set(props.documents.map(doc => doc.id)));
  };

  /**
   * Clear selection
   */
  const clearSelection = () => {
    setSelectedDocuments(new Set());
  };

  /**
   * Handle batch action
   */
  const handleBatchAction = (action: string) => {
    const selectedIds = Array.from(selectedDocuments());
    props.onBatchAction?.(action, selectedIds);
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

  /**
   * Get cultural sensitivity color
   */
  const getCulturalSensitivityColor = (level: number): string => {
    const colors = {
      1: 'var(--cultural-level-1)',
      2: 'var(--cultural-level-2)',
      3: 'var(--cultural-level-3)',
      4: 'var(--cultural-level-4)',
      5: 'var(--cultural-level-5)',
    };
    return colors[level as keyof typeof colors] || 'var(--cultural-level-1)';
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  /**
   * Format date
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Filtered and sorted documents
   */
  const filteredDocuments = createMemo(() => {
    let docs = props.documents;

    // Apply cultural filters
    docs = docs.filter(doc => {
      const level = doc.culturalMetadata?.sensitivityLevel || 1;
      return culturalFilters().has(level);
    });

    // Apply sorting
    docs = [...docs].sort((a, b) => {
      let comparison = 0;

      switch (sortBy()) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'cultural':
          const aLevel = a.culturalMetadata?.sensitivityLevel || 1;
          const bLevel = b.culturalMetadata?.sensitivityLevel || 1;
          comparison = aLevel - bLevel;
          break;
        default:
          comparison = 0;
      }

      return sortOrder() === 'desc' ? -comparison : comparison;
    });

    return docs;
  });

  /**
   * Library statistics
   */
  const libraryStats = createMemo(() => {
    const docs = props.documents;
    const totalSize = docs.reduce((sum, doc) => sum + doc.fileSize, 0);
    const culturalContexts = docs.filter(
      doc => doc.culturalMetadata?.sensitivityLevel && doc.culturalMetadata.sensitivityLevel > 1
    ).length;
    const recentUploads = docs.filter(doc => {
      const daysSinceCreated = (Date.now() - doc.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated <= 7;
    }).length;

    return {
      totalDocuments: docs.length,
      totalSize,
      culturalContexts,
      recentUploads,
      verifiedDocuments: docs.filter(doc => doc.culturalMetadata?.verificationStatus === 'verified')
        .length,
      pendingVerification: docs.filter(
        doc => doc.culturalMetadata?.verificationStatus === 'pending'
      ).length,
    };
  });

  return (
    <div
      class={styles['document-library']}
      aria-label={props.ariaLabel || 'Document library'}
      aria-describedby={props.ariaDescribedBy}
    >
      {/* Library Header */}
      <div class={styles['library-header']}>
        <div class={styles['header-left']}>
          <h2 class={styles['library-title']}>
            <BookOpen size={24} />
            Document Library
          </h2>
          <p class={styles['library-subtitle']}>{filteredDocuments().length} documents available</p>
        </div>

        <div class={styles['header-right']}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => props.onRefresh?.()}
            ariaLabel="Refresh library"
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Document Status */}
      <DocumentStatus
        stats={libraryStats()}
        culturalTheme={props.culturalTheme}
        showCulturalIndicators={props.showCulturalIndicators}
        culturalContext={props.culturalContext}
        showSecurityStatus={props.showSecurityStatus}
        securityLevel={props.securityLevel}
        ariaLabel="Document library statistics"
      />

      {/* Library Controls */}
      <div class={styles['library-controls']}>
        {/* Search */}
        <div class={styles['search-section']}>
          <Input
            placeholder="Search documents..."
            value={searchQuery()}
            onInput={handleSearchInput}
            culturalTheme={props.culturalTheme}
            validationType="search"
            ariaLabel="Search documents"
            icon={<Search size={16} />}
          />
        </div>

        {/* Controls */}
        <div class={styles['controls-section']}>
          {/* View Mode Toggle */}
          <div class={styles['view-toggle']}>
            <Button
              variant={viewMode() === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              ariaLabel="Grid view"
            >
              <Grid size={16} />
            </Button>
            <Button
              variant={viewMode() === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              ariaLabel="List view"
            >
              <List size={16} />
            </Button>
          </div>

          {/* Filter Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters())}
            ariaLabel="Show filters"
          >
            <Filter size={16} />
            Filters
          </Button>

          {/* Sort Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSortOptions(!showSortOptions())}
            ariaLabel="Sort options"
          >
            {sortOrder() === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            Sort
          </Button>
        </div>
      </div>

      {/* Batch Actions */}
      <Show when={selectedDocuments().size > 0}>
        <div class={styles['batch-actions']}>
          <span class={styles['selection-count']}>{selectedDocuments().size} selected</span>
          <div class={styles['batch-buttons']}>
            <Button variant="secondary" size="sm" onClick={() => handleBatchAction('tag')}>
              <Tag size={14} />
              Tag
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleBatchAction('export')}>
              <Download size={14} />
              Export
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleBatchAction('delete')}>
              <Trash2 size={14} />
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      </Show>

      {/* Document Grid/List */}
      <div class={`${styles['document-container']} ${styles[`view-${viewMode()}`]}`}>
        <Show when={filteredDocuments().length === 0}>
          <div class={styles['empty-state']}>
            <FileText size={48} />
            <h3>No documents found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        </Show>

        <For each={filteredDocuments()}>
          {document => (
            <Card
              culturalTheme={props.culturalTheme}
              culturalContext={document.culturalMetadata?.culturalOrigin}
              showCulturalIndicator={props.showCulturalIndicators}
              contentType="document"
              class={styles['document-card']}
              onClick={() => handleDocumentSelect(document)}
            >
              {/* Document Header */}
              <div class={styles['document-header']}>
                <div class={styles['document-icon']}>
                  <FileText size={20} />
                </div>
                <div class={styles['document-info']}>
                  <h4 class={styles['document-title']}>{document.title}</h4>
                  <p class={styles['document-description']}>
                    {document.description || 'No description available'}
                  </p>
                </div>

                {/* Cultural Indicator */}
                <Show
                  when={props.showCulturalIndicators && document.culturalMetadata?.sensitivityLevel}
                >
                  <div
                    class={styles['cultural-indicator']}
                    style={{
                      backgroundColor: getCulturalSensitivityColor(
                        document.culturalMetadata!.sensitivityLevel!
                      ),
                    }}
                    title={getCulturalSensitivityLabel(
                      document.culturalMetadata!.sensitivityLevel!
                    )}
                  >
                    <Globe size={12} />
                  </div>
                </Show>

                {/* Security Status */}
                <Show when={props.showSecurityStatus}>
                  <div class={styles['security-status']}>
                    <Shield size={12} />
                  </div>
                </Show>
              </div>

              {/* Document Metadata */}
              <div class={styles['document-metadata']}>
                <div class={styles['metadata-item']}>
                  <Calendar size={12} />
                  <span>{formatDate(document.createdAt)}</span>
                </div>
                <div class={styles['metadata-item']}>
                  <FileText size={12} />
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>
                <Show when={document.tags && document.tags.length > 0}>
                  <div class={styles['metadata-item']}>
                    <Tag size={12} />
                    <span>{document.tags.length} tags</span>
                  </div>
                </Show>
              </div>

              {/* Document Actions */}
              <div class={styles['document-actions']}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    setPreviewDocument(document);
                    setShowDocumentPreview(true);
                  }}
                  ariaLabel={`Preview ${document.title}`}
                >
                  <Eye size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleDocumentAction('edit', document);
                  }}
                  ariaLabel={`Edit ${document.title}`}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleDocumentAction('share', document);
                  }}
                  ariaLabel={`Share ${document.title}`}
                >
                  <Share size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleDocumentAction('delete', document);
                  }}
                  ariaLabel={`Delete ${document.title}`}
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              {/* Selection Checkbox */}
              <input
                type="checkbox"
                checked={selectedDocuments().has(document.id)}
                onChange={() => toggleDocumentSelection(document.id)}
                onClick={e => e.stopPropagation()}
                class={styles['selection-checkbox']}
                aria-label={`Select ${document.title}`}
              />
            </Card>
          )}
        </For>
      </div>

      {/* Filters Modal */}
      <Modal
        open={showFilters()}
        onClose={() => setShowFilters(false)}
        title="Document Filters"
        subtitle="Filter documents by cultural context and other criteria"
        size="md"
        culturalTheme={props.culturalTheme}
        culturalContext="Document filtering options"
        contentType="general"
        ariaLabel="Document filters modal"
      >
        <div class={styles['filters-content']}>
          <h4>Cultural Sensitivity Levels</h4>
          <div class={styles['cultural-filters']}>
            {[1, 2, 3, 4, 5].map(level => (
              <label class={styles['filter-option']}>
                <input
                  type="checkbox"
                  checked={culturalFilters().has(level)}
                  onChange={() => {
                    setCulturalFilters(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(level)) {
                        newSet.delete(level);
                      } else {
                        newSet.add(level);
                      }
                      return newSet;
                    });
                  }}
                />
                <span>{getCulturalSensitivityLabel(level)}</span>
              </label>
            ))}
          </div>
        </div>

        <div slot="footer" class={styles['modal-footer']}>
          <Button variant="ghost" onClick={() => setShowFilters(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setShowFilters(false)}>
            Apply Filters
          </Button>
        </div>
      </Modal>

      {/* Sort Options Modal */}
      <Modal
        open={showSortOptions()}
        onClose={() => setShowSortOptions(false)}
        title="Sort Options"
        subtitle="Choose how to sort your documents"
        size="sm"
        culturalTheme={props.culturalTheme}
        culturalContext="Document sorting options"
        contentType="general"
        ariaLabel="Sort options modal"
      >
        <div class={styles['sort-content']}>
          <h4>Sort By</h4>
          <div class={styles['sort-options']}>
            {[
              { value: 'title', label: 'Title' },
              { value: 'date', label: 'Date Created' },
              { value: 'size', label: 'File Size' },
              { value: 'cultural', label: 'Cultural Sensitivity' },
            ].map(option => (
              <label class={styles['sort-option']}>
                <input
                  type="radio"
                  name="sortBy"
                  value={option.value}
                  checked={sortBy() === option.value}
                  onChange={() => setSortBy(option.value as any)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <h4>Sort Order</h4>
          <div class={styles['sort-order']}>
            <label class={styles['sort-option']}>
              <input
                type="radio"
                name="sortOrder"
                value="asc"
                checked={sortOrder() === 'asc'}
                onChange={() => setSortOrder('asc')}
              />
              <span>Ascending</span>
            </label>
            <label class={styles['sort-option']}>
              <input
                type="radio"
                name="sortOrder"
                value="desc"
                checked={sortOrder() === 'desc'}
                onChange={() => setSortOrder('desc')}
              />
              <span>Descending</span>
            </label>
          </div>
        </div>

        <div slot="footer" class={styles['modal-footer']}>
          <Button variant="ghost" onClick={() => setShowSortOptions(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setShowSortOptions(false)}>
            Apply Sort
          </Button>
        </div>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        open={showDocumentPreview()}
        onClose={() => setShowDocumentPreview(false)}
        title={previewDocument()?.title || 'Document Preview'}
        subtitle={previewDocument()?.description || 'Document details'}
        size="lg"
        culturalTheme={props.culturalTheme}
        culturalContext={previewDocument()?.culturalMetadata?.culturalOrigin}
        contentType="document"
        ariaLabel="Document preview modal"
      >
        <Show when={previewDocument()}>
          <div class={styles['preview-content']}>
            <div class={styles['preview-metadata']}>
              <div class={styles['metadata-row']}>
                <strong>Created:</strong>
                <span>{formatDate(previewDocument()!.createdAt)}</span>
              </div>
              <div class={styles['metadata-row']}>
                <strong>Size:</strong>
                <span>{formatFileSize(previewDocument()!.fileSize)}</span>
              </div>
              <div class={styles['metadata-row']}>
                <strong>Format:</strong>
                <span>{previewDocument()!.format}</span>
              </div>
              <Show when={previewDocument()!.culturalMetadata?.sensitivityLevel}>
                <div class={styles['metadata-row']}>
                  <strong>Cultural Context:</strong>
                  <span>
                    {getCulturalSensitivityLabel(
                      previewDocument()!.culturalMetadata!.sensitivityLevel!
                    )}
                  </span>
                </div>
              </Show>
              <Show when={previewDocument()!.tags && previewDocument()!.tags.length > 0}>
                <div class={styles['metadata-row']}>
                  <strong>Tags:</strong>
                  <div class={styles['tags-list']}>
                    <For each={previewDocument()!.tags}>
                      {tag => <span class={styles['tag']}>{tag}</span>}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </Show>

        <div slot="footer" class={styles['modal-footer']}>
          <Button variant="ghost" onClick={() => setShowDocumentPreview(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (previewDocument()) {
                handleDocumentSelect(previewDocument()!);
                setShowDocumentPreview(false);
              }
            }}
          >
            Open Document
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentLibrary;
