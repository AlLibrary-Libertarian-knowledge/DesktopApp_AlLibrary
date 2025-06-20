import { Component, JSX, createSignal, Show, For, createMemo } from 'solid-js';
import { Button, Input, Card } from '../../foundation';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  Eye,
  Download,
  Heart,
  Info,
} from 'lucide-solid';
import styles from './LibrarySection.module.css';

/**
 * Document View Types
 */
export type DocumentViewType = 'grid' | 'list';

/**
 * Sort Options
 */
export type SortOption = 'title' | 'date' | 'size' | 'cultural-level' | 'popularity';
export type SortDirection = 'asc' | 'desc';

/**
 * Library Document Interface
 */
export interface LibraryDocument {
  id: string;
  title: string;
  description?: string;
  format: string;
  size: number;
  uploadDate: Date;
  lastAccessed?: Date;
  tags: string[];
  categories: string[];

  // Cultural Context (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalContext?: {
    sensitivityLevel: number;
    culturalOrigin: string;
    educationalContext: string;
    informationOnly: true; // MANDATORY: Cultural info is educational only
    educationalPurpose: true;
    traditionalProtocols?: string[];
    communityContext?: string;
  };

  // Document Status
  isDownloaded: boolean;
  isFavorite: boolean;
  downloadProgress?: number;

  // Security Status (Technical Only)
  securityValidated: boolean;
  lastScanned?: Date;
}

/**
 * Search Filters Interface
 */
export interface LibraryFilters {
  searchQuery: string;
  categories: string[];
  formats: string[];
  culturalLevels: number[]; // For educational filtering only
  dateRange: {
    start?: Date;
    end?: Date;
  };
  sizeRange: {
    min?: number;
    max?: number;
  };
  showFavoritesOnly: boolean;
  showDownloadedOnly: boolean;
}

/**
 * Library Section Props Interface
 * Follows SOLID principles with cultural theme support and anti-censorship compliance
 */
export interface LibrarySectionProps {
  // Document Management
  documents: LibraryDocument[];
  isLoading?: boolean;
  totalCount?: number;

  // Pagination
  currentPage?: number;
  itemsPerPage?: number;

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: 'indigenous' | 'traditional' | 'modern' | 'ceremonial' | 'community' | 'default';
  showCulturalIndicators?: boolean;
  enableCulturalFiltering?: boolean; // For educational organization only

  // View Configuration
  defaultViewType?: DocumentViewType;
  defaultSortOption?: SortOption;
  defaultSortDirection?: SortDirection;

  // Event Handlers
  onDocumentOpen?: (document: LibraryDocument) => void;
  onDocumentDownload?: (document: LibraryDocument) => void;
  onDocumentFavorite?: (document: LibraryDocument) => void;
  onDocumentDelete?: (document: LibraryDocument) => void;
  onDocumentEdit?: (document: LibraryDocument) => void;
  onBulkAction?: (action: string, documents: LibraryDocument[]) => void;
  onFiltersChange?: (filters: LibraryFilters) => void;
  onPageChange?: (page: number) => void;

  // Accessibility
  ariaLabel?: string;
  class?: string;
}

/**
 * Library Section Component
 *
 * Displays document library with search, filtering, and cultural context.
 * Cultural information is provided for educational purposes only - never restricts access.
 * All documents are accessible with appropriate educational context.
 *
 * @example
 * ```tsx
 * <LibrarySection
 *   documents={documents}
 *   culturalTheme="indigenous"
 *   showCulturalIndicators={true}
 *   enableCulturalFiltering={true}
 *   onDocumentOpen={handleDocumentOpen}
 * />
 * ```
 */
const LibrarySection: Component<LibrarySectionProps> = props => {
  // View state management
  const [viewType, setViewType] = createSignal<DocumentViewType>(props.defaultViewType || 'grid');
  const [sortOption, setSortOption] = createSignal<SortOption>(props.defaultSortOption || 'date');
  const [sortDirection, setSortDirection] = createSignal<SortDirection>(
    props.defaultSortDirection || 'desc'
  );
  const [selectedDocuments, setSelectedDocuments] = createSignal<Set<string>>(new Set());

  // Filter state management
  const [filters, setFilters] = createSignal<LibraryFilters>({
    searchQuery: '',
    categories: [],
    formats: [],
    culturalLevels: [], // Educational organization only
    dateRange: {},
    sizeRange: {},
    showFavoritesOnly: false,
    showDownloadedOnly: false,
  });

  // Show/hide filter panel
  const [showFilters, setShowFilters] = createSignal(false);

  /**
   * Filter and Sort Documents (NO CULTURAL ACCESS RESTRICTIONS)
   * Cultural filtering is for educational organization only
   */
  const filteredAndSortedDocuments = createMemo(() => {
    let filtered = props.documents || [];
    const currentFilters = filters();

    // Text search (searches all fields, including cultural context)
    if (currentFilters.searchQuery) {
      const query = currentFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        doc =>
          doc.title.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.tags.some(tag => tag.toLowerCase().includes(query)) ||
          doc.categories.some(cat => cat.toLowerCase().includes(query)) ||
          doc.culturalContext?.culturalOrigin?.toLowerCase().includes(query) ||
          doc.culturalContext?.educationalContext?.toLowerCase().includes(query)
      );
    }

    // Category filtering
    if (currentFilters.categories.length > 0) {
      filtered = filtered.filter(doc =>
        doc.categories.some(cat => currentFilters.categories.includes(cat))
      );
    }

    // Format filtering
    if (currentFilters.formats.length > 0) {
      filtered = filtered.filter(doc => currentFilters.formats.includes(doc.format));
    }

    // Cultural level filtering (EDUCATIONAL ORGANIZATION ONLY - NOT ACCESS CONTROL)
    if (currentFilters.culturalLevels.length > 0) {
      filtered = filtered.filter(
        doc =>
          doc.culturalContext &&
          currentFilters.culturalLevels.includes(doc.culturalContext.sensitivityLevel)
      );
    }

    // Date range filtering
    if (currentFilters.dateRange.start || currentFilters.dateRange.end) {
      filtered = filtered.filter(doc => {
        const docDate = doc.uploadDate;
        const start = currentFilters.dateRange.start;
        const end = currentFilters.dateRange.end;

        if (start && docDate < start) return false;
        if (end && docDate > end) return false;
        return true;
      });
    }

    // Favorites filtering
    if (currentFilters.showFavoritesOnly) {
      filtered = filtered.filter(doc => doc.isFavorite);
    }

    // Downloaded filtering
    if (currentFilters.showDownloadedOnly) {
      filtered = filtered.filter(doc => doc.isDownloaded);
    }

    // Sorting
    const sortKey = sortOption();
    const direction = sortDirection();

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortKey) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'date':
          aValue = a.uploadDate.getTime();
          bValue = b.uploadDate.getTime();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'cultural-level':
          aValue = a.culturalContext?.sensitivityLevel || 0;
          bValue = b.culturalContext?.sensitivityLevel || 0;
          break;
        case 'popularity':
          aValue = a.lastAccessed?.getTime() || 0;
          bValue = b.lastAccessed?.getTime() || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  });

  /**
   * Handle Search Input Change
   */
  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
    props.onFiltersChange?.(filters());
  };

  /**
   * Handle Sort Change
   */
  const handleSortChange = (option: SortOption) => {
    if (option === sortOption()) {
      // Toggle direction if same option
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortOption(option);
      setSortDirection('desc');
    }
  };

  /**
   * Handle Document Selection
   */
  const handleDocumentSelect = (documentId: string, selected: boolean) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(documentId);
      } else {
        newSet.delete(documentId);
      }
      return newSet;
    });
  };

  /**
   * Handle Select All
   */
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = filteredAndSortedDocuments().map(doc => doc.id);
      setSelectedDocuments(new Set(allIds));
    } else {
      setSelectedDocuments(new Set());
    }
  };

  /**
   * Get Cultural Badge
   */
  const getCulturalBadge = (culturalContext: any) => {
    if (!culturalContext || !props.showCulturalIndicators) return null;

    const levelLabels = {
      1: 'General',
      2: 'Traditional',
      3: 'Sacred',
    };

    const level = culturalContext.sensitivityLevel;

    return (
      <span
        class={`${styles.culturalBadge} ${styles[`cultural-level-${level}`]}`}
        title={`Cultural Context: ${culturalContext.educationalContext} (Educational Information Only)`}
      >
        🌿 {levelLabels[level as keyof typeof levelLabels] || 'Cultural'}
      </span>
    );
  };

  /**
   * Format File Size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Format Date
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const selectedCount = () => selectedDocuments().size;
  const totalDocuments = () => filteredAndSortedDocuments().length;

  return (
    <div
      class={`${styles.librarySection} ${props.class || ''}`}
      aria-label={props.ariaLabel || 'Document library'}
    >
      {/* Header with Search and Controls */}
      <div class={styles.libraryHeader}>
        <div class={styles.searchSection}>
          <Input
            type="search"
            placeholder="Search documents, cultural context, tags..."
            value={filters().searchQuery}
            onChange={handleSearchChange}
            leftIcon={<Search size={18} />}
            class={styles.searchInput}
            ariaLabel="Search documents and cultural content"
          />

          <Button
            variant="ghost"
            size="md"
            onClick={() => setShowFilters(prev => !prev)}
            ariaLabel="Toggle filters"
            class={styles.filterToggle}
          >
            <Filter size={18} />
            Filters
          </Button>
        </div>

        <div class={styles.viewControls}>
          <div class={styles.sortControls}>
            <select
              value={sortOption()}
              onChange={e => handleSortChange(e.target.value as SortOption)}
              class={styles.sortSelect}
              aria-label="Sort documents by"
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="size">Size</option>
              <option value="cultural-level">Cultural Level</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>

          <div class={styles.viewTypeControls}>
            <Button
              variant={viewType() === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewType('grid')}
              ariaLabel="Grid view"
            >
              <Grid3X3 size={16} />
            </Button>
            <Button
              variant={viewType() === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewType('list')}
              ariaLabel="List view"
            >
              <List size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <Show when={showFilters()}>
        <Card class={styles.filtersPanel} variant="outlined">
          <div class={styles.filtersContent}>
            <h4 class={styles.filtersTitle}>Filters</h4>

            {/* Cultural Level Filter (EDUCATIONAL ORGANIZATION ONLY) */}
            <Show when={props.enableCulturalFiltering}>
              <div class={styles.filterGroup}>
                <label class={styles.filterLabel}>Cultural Context (Educational)</label>
                <div class={styles.checkboxGroup}>
                  <label class={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={filters().culturalLevels.includes(1)}
                      onChange={e => {
                        const checked = e.target.checked;
                        setFilters(prev => ({
                          ...prev,
                          culturalLevels: checked
                            ? [...prev.culturalLevels, 1]
                            : prev.culturalLevels.filter(l => l !== 1),
                        }));
                      }}
                    />
                    General Context
                  </label>
                  <label class={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={filters().culturalLevels.includes(2)}
                      onChange={e => {
                        const checked = e.target.checked;
                        setFilters(prev => ({
                          ...prev,
                          culturalLevels: checked
                            ? [...prev.culturalLevels, 2]
                            : prev.culturalLevels.filter(l => l !== 2),
                        }));
                      }}
                    />
                    Traditional Knowledge
                  </label>
                  <label class={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={filters().culturalLevels.includes(3)}
                      onChange={e => {
                        const checked = e.target.checked;
                        setFilters(prev => ({
                          ...prev,
                          culturalLevels: checked
                            ? [...prev.culturalLevels, 3]
                            : prev.culturalLevels.filter(l => l !== 3),
                        }));
                      }}
                    />
                    Sacred Content
                  </label>
                </div>
              </div>
            </Show>

            {/* Other Filters */}
            <div class={styles.filterGroup}>
              <label class={styles.filterLabel}>Quick Filters</label>
              <div class={styles.checkboxGroup}>
                <label class={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={filters().showFavoritesOnly}
                    onChange={e =>
                      setFilters(prev => ({ ...prev, showFavoritesOnly: e.target.checked }))
                    }
                  />
                  Favorites Only
                </label>
                <label class={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={filters().showDownloadedOnly}
                    onChange={e =>
                      setFilters(prev => ({ ...prev, showDownloadedOnly: e.target.checked }))
                    }
                  />
                  Downloaded Only
                </label>
              </div>
            </div>
          </div>
        </Card>
      </Show>

      {/* Bulk Actions Bar */}
      <Show when={selectedCount() > 0}>
        <div class={styles.bulkActionsBar}>
          <span class={styles.selectedCount}>
            {selectedCount()} of {totalDocuments()} selected
          </span>
          <div class={styles.bulkActions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                props.onBulkAction?.(
                  'download',
                  Array.from(selectedDocuments()).map(
                    id => filteredAndSortedDocuments().find(doc => doc.id === id)!
                  )
                )
              }
            >
              <Download size={16} />
              Download Selected
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                props.onBulkAction?.(
                  'favorite',
                  Array.from(selectedDocuments()).map(
                    id => filteredAndSortedDocuments().find(doc => doc.id === id)!
                  )
                )
              }
            >
              <Heart size={16} />
              Add to Favorites
            </Button>
          </div>
        </div>
      </Show>

      {/* Document Grid/List */}
      <div class={`${styles.documentsContainer} ${styles[`view-${viewType()}`]}`}>
        <Show
          when={!props.isLoading && filteredAndSortedDocuments().length > 0}
          fallback={
            <div class={styles.emptyState}>
              <Show when={props.isLoading}>
                <div class={styles.loadingState}>
                  <div class={styles.spinner} />
                  <p>Loading documents...</p>
                </div>
              </Show>
              <Show when={!props.isLoading && filteredAndSortedDocuments().length === 0}>
                <div class={styles.noDocuments}>
                  <Info size={48} />
                  <h3>No documents found</h3>
                  <p>Try adjusting your search terms or filters</p>
                </div>
              </Show>
            </div>
          }
        >
          <For each={filteredAndSortedDocuments()}>
            {document => (
              <Card
                class={`${styles.documentCard} ${selectedDocuments().has(document.id) ? styles.selected : ''}`}
                onClick={() => props.onDocumentOpen?.(document)}
                culturalTheme={props.culturalTheme}
              >
                <div class={styles.documentContent}>
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedDocuments().has(document.id)}
                    onChange={e => {
                      e.stopPropagation();
                      handleDocumentSelect(document.id, e.target.checked);
                    }}
                    class={styles.documentCheckbox}
                    aria-label={`Select ${document.title}`}
                  />

                  {/* Document Info */}
                  <div class={styles.documentInfo}>
                    <div class={styles.documentHeader}>
                      <h4 class={styles.documentTitle}>{document.title}</h4>
                      {getCulturalBadge(document.culturalContext)}
                    </div>

                    <Show when={document.description}>
                      <p class={styles.documentDescription}>{document.description}</p>
                    </Show>

                    <div class={styles.documentMeta}>
                      <span class={styles.metaItem}>{document.format.toUpperCase()}</span>
                      <span class={styles.metaItem}>{formatFileSize(document.size)}</span>
                      <span class={styles.metaItem}>{formatDate(document.uploadDate)}</span>
                    </div>

                    {/* Cultural Information Display (EDUCATIONAL ONLY) */}
                    <Show when={document.culturalContext && props.showCulturalIndicators}>
                      <div class={styles.culturalInfo}>
                        <Info size={14} />
                        <span class={styles.culturalContext}>
                          {document.culturalContext.educationalContext}
                        </span>
                        <span class={styles.infoNote}>(Educational context)</span>
                      </div>
                    </Show>

                    <div class={styles.documentTags}>
                      <For each={document.tags.slice(0, 3)}>
                        {tag => <span class={styles.tag}>{tag}</span>}
                      </For>
                    </div>
                  </div>

                  {/* Document Actions */}
                  <div class={styles.documentActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        props.onDocumentDownload?.(document);
                      }}
                      ariaLabel={`Download ${document.title}`}
                      disabled={!document.isDownloaded}
                    >
                      <Download size={16} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        props.onDocumentFavorite?.(document);
                      }}
                      ariaLabel={`${document.isFavorite ? 'Remove from' : 'Add to'} favorites`}
                      class={document.isFavorite ? styles.favorited : ''}
                    >
                      <Heart size={16} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        // Show context menu or actions
                      }}
                      ariaLabel={`More actions for ${document.title}`}
                    >
                      <MoreVertical size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </For>
        </Show>
      </div>

      {/* Cultural Information Notice (ANTI-CENSORSHIP) */}
      <div class={styles.culturalNotice}>
        <Info size={16} />
        <span>
          Cultural context is provided for educational purposes only. All documents remain
          accessible with appropriate cultural understanding and respect for multiple perspectives.
        </span>
      </div>
    </div>
  );
};

export default LibrarySection;
