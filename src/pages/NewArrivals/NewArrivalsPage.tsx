/**
 * NewArrivalsPage - Time-based content discovery interface
 *
 * Features:
 * - Chronological document display with time filtering
 * - Cultural context display (information only)
 * - Time-based categorization and filtering
 * - Document preview and quick actions
 * - Educational cultural resources integration
 * - Anti-censorship compliance
 *
 * @cultural-considerations
 * - Displays cultural sensitivity indicators for information only
 * - Shows educational resources for cultural understanding
 * - Supports traditional knowledge context display
 * - NO ACCESS RESTRICTIONS - information only
 *
 * @accessibility
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - High contrast mode support
 * - Focus management
 *
 * @performance
 * - Lazy loading for large document lists
 * - Virtualized scrolling for performance
 * - Optimized filtering and sorting
 */

import { type Component, createSignal, createEffect, onMount, Show, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import {
  Calendar,
  Clock,
  Filter,
  Grid,
  List,
  Search,
  ChevronDown,
  Eye,
  Download,
  Share2,
  BookOpen,
} from 'lucide-solid';

// Foundation Components
import { Button } from '../../components/foundation/Button';
import { Card } from '../../components/foundation/Card';
import { Input } from '../../components/foundation/Input';
import { Select } from '../../components/foundation/Select';
import { Badge } from '../../components/foundation/Badge';
import { Loading } from '../../components/foundation/Loading';

// Domain Components
import { DocumentCard } from '../../components/domain/document/DocumentCard';
import { CulturalIndicator } from '../../components/cultural/CulturalIndicator';
import { TimeFilter } from '../../components/domain/time/TimeFilter';

// Layout Components
import MainLayout from '../../components/layout/MainLayout';
import { PageHeader } from '../../components/layout/PageHeader/PageHeader';

// Hooks and Services
import { useDocuments } from '../../hooks/api/useDocuments';
import { useCulturalContext } from '../../hooks/cultural/useCulturalContext';
import { useLocalStorage } from '../../hooks/data/useLocalStorage';

// Types
import type { DocumentCardDocument as Document } from '../../components/domain/document/DocumentCard/DocumentCard';

type TimeFilterType =
  | 'today'
  | 'yesterday'
  | 'last-week'
  | 'last-month'
  | 'last-3-months'
  | 'last-6-months'
  | 'last-year'
  | 'custom';

interface NewArrivalsPreferences {
  viewMode: 'grid' | 'list';
  timeFilter: TimeFilterType;
  showCulturalInfo: boolean;
}

// Styles
import styles from './NewArrivalsPage.module.css';

export interface NewArrivalsPageProps {
  /** Initial time filter */
  initialTimeFilter?: TimeFilterType;
  /** Initial view mode */
  initialViewMode?: 'grid' | 'list';
  /** Show cultural context by default */
  showCulturalContext?: boolean;
}

export const NewArrivalsPage: Component<NewArrivalsPageProps> = props => {
  const navigate = useNavigate();

  // State Management
  const [timeFilter, setTimeFilter] = createSignal<TimeFilterType>(
    props.initialTimeFilter || 'last-week'
  );
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>(props.initialViewMode || 'grid');
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedCategories, setSelectedCategories] = createSignal<string[]>([]);
  const [sortBy, setSortBy] = createSignal<'date' | 'title' | 'size' | 'cultural-level'>('date');
  const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = createSignal(false);
  const [showCulturalInfo, setShowCulturalInfo] = createSignal(props.showCulturalContext || false);

  // Hooks
  const { documents, isLoading, error, loadDocuments } = useDocuments();

  const { context, loadCulturalContext } = useCulturalContext();

  const preferences = useLocalStorage<NewArrivalsPreferences>('newArrivals-preferences', {
    defaultValue: {
      viewMode: 'grid',
      timeFilter: 'last-week',
      showCulturalInfo: false,
    },
  });

  // Time filter options
  const timeFilterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last-week', label: 'Last Week' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-3-months', label: 'Last 3 Months' },
    { value: 'last-6-months', label: 'Last 6 Months' },
    { value: 'last-year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'date', label: 'Date Added' },
    { value: 'title', label: 'Title' },
    { value: 'size', label: 'File Size' },
    { value: 'cultural-level', label: 'Cultural Context Level' },
  ];

  // Filtered and sorted documents
  const filteredDocuments = () => {
    let filtered: Document[] = (documents() as Document[]) || [];

    // Apply search filter
    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      filtered = filtered.filter(
        doc =>
          doc.title.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategories().length > 0) {
      filtered = filtered.filter(() => false);
    }

    // Apply time filter
    filtered = applyTimeFilter(filtered, timeFilter());

    // Apply sorting
    filtered = applySorting(filtered, sortBy(), sortOrder());

    return filtered;
  };

  // Apply time filter
  const applyTimeFilter = (docs: Document[], filter: TimeFilterType): Document[] => {
    const now = new Date();
    const filterDate = getFilterDate(filter, now);

    return docs.filter(doc => {
      const docDate = new Date(doc.createdAt ?? 0);
      return docDate >= filterDate;
    });
  };

  // Get filter date based on time filter
  const getFilterDate = (filter: TimeFilterType, now: Date): Date => {
    const date = new Date(now);

    switch (filter) {
      case 'today':
        date.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        date.setDate(date.getDate() - 1);
        date.setHours(0, 0, 0, 0);
        break;
      case 'last-week':
        date.setDate(date.getDate() - 7);
        break;
      case 'last-month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'last-3-months':
        date.setMonth(date.getMonth() - 3);
        break;
      case 'last-6-months':
        date.setMonth(date.getMonth() - 6);
        break;
      case 'last-year':
        date.setFullYear(date.getFullYear() - 1);
        break;
      default:
        date.setDate(date.getDate() - 7); // Default to last week
    }

    return date;
  };

  // Apply sorting
  const applySorting = (docs: Document[], sortBy: string, order: 'asc' | 'desc'): Document[] => {
    const sorted = [...docs].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'size':
          comparison = (a.fileSize || 0) - (b.fileSize || 0);
          break;
        case 'cultural-level':
          comparison =
            (a.culturalMetadata?.sensitivityLevel || 0) -
            (b.culturalMetadata?.sensitivityLevel || 0);
          break;
      }

      return order === 'desc' ? -comparison : comparison;
    });

    return sorted;
  };

  // Handle document selection
  const handleDocumentOpen = (document: Document) => {
    navigate(`/document/${document.id}`);
  };

  // Handle quick actions
  const handleQuickView = (document: Document) => {
    // TODO: Implement quick view modal
    console.log('Quick view:', document.title);
  };

  const handleDownload = (document: Document) => {
    // TODO: Implement download functionality
    console.log('Download:', document.title);
  };

  const handleShare = (document: Document) => {
    // TODO: Implement sharing functionality
    console.log('Share:', document.title);
  };

  // Handle filter changes
  const handleTimeFilterChange = (filter: TimeFilterType) => {
    setTimeFilter(filter);
    preferences.setValue(prev => ({ ...prev, timeFilter: filter }));
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    preferences.setValue(prev => ({ ...prev, viewMode: mode }));
  };

  const handleCulturalInfoToggle = () => {
    const newValue = !showCulturalInfo();
    setShowCulturalInfo(newValue);
    preferences.setValue(prev => ({ ...prev, showCulturalInfo: newValue }));
  };

  // Load documents on mount and filter changes
  createEffect(() => {
    loadDocuments();
  });

  // Initialize from preferences
  onMount(() => {
    const prefs = preferences.value();
    setViewMode(prefs.viewMode);
    setTimeFilter(prefs.timeFilter);
    setShowCulturalInfo(prefs.showCulturalInfo);
  });

  return (
    <MainLayout>
      <div class={styles.newArrivalsPage}>
        {/* Page Header */}
        <PageHeader
          title="New Arrivals"
          subtitle="Discover recently added documents and resources"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'New Arrivals', path: '/new-arrivals', current: true },
          ]}
          onBreadcrumbClick={path => navigate(path)}
        />

        {/* Controls Bar */}
        <div class={styles.controlsBar}>
          <div class={styles.controlsLeft}>
            {/* Time Filter */}
            <div class={styles.timeFilter}>
              <Clock size={16} />
              <Select
                value={timeFilter()}
                onChange={value => handleTimeFilterChange(value as TimeFilterType)}
                options={timeFilterOptions}
                placeholder="Select time range"
                size="sm"
              />
            </div>

            {/* Search */}
            <div class={styles.searchContainer}>
              <Search size={16} />
              <Input
                value={searchQuery()}
                onChange={setSearchQuery}
                placeholder="Search new arrivals..."
                size="sm"
                class={styles.searchInput}
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters())}
              class={styles.filterToggle}
            >
              <Filter size={16} />
              Filters
              <ChevronDown
                size={16}
                class={showFilters() ? styles.chevronUp : styles.chevronDown}
              />
            </Button>
          </div>

          <div class={styles.controlsRight}>
            {/* Cultural Info Toggle */}
            <Button
              variant={showCulturalInfo() ? 'primary' : 'outline'}
              size="sm"
              onClick={handleCulturalInfoToggle}
              title="Toggle cultural context display"
            >
              <BookOpen size={16} />
              Cultural Context
            </Button>

            {/* View Mode Toggle */}
            <div class={styles.viewModeToggle}>
              <Button
                variant={viewMode() === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('grid')}
                title="Grid view"
              >
                <Grid size={16} />
              </Button>
              <Button
                variant={viewMode() === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('list')}
                title="List view"
              >
                <List size={16} />
              </Button>
            </div>

            {/* Sort Controls */}
            <div class={styles.sortControls}>
              <Select value={sortBy()} onChange={setSortBy} options={sortOptions} size="sm" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder() === 'asc' ? 'desc' : 'asc')}
                title={`Sort ${sortOrder() === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder() === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <Show when={showFilters()}>
          <div class={styles.filtersPanel}>
            <Card class={styles.filtersCard}>
              <div class={styles.filtersContent}>
                {/* Category Filter */}
                <div class={styles.filterGroup}>
                  <label class={styles.filterLabel}>Categories</label>
                  {/* TODO: Implement category multi-select */}
                  <div class={styles.categoryTags}>
                    <Badge variant="outline">Academic</Badge>
                    <Badge variant="outline">Cultural</Badge>
                    <Badge variant="outline">Traditional</Badge>
                    <Badge variant="outline">Educational</Badge>
                  </div>
                </div>

                {/* Cultural Sensitivity Filter */}
                <div class={styles.filterGroup}>
                  <label class={styles.filterLabel}>Cultural Context Level</label>
                  <div class={styles.culturalLevelFilter}>
                    <For each={[1, 2, 3, 4, 5]}>
                      {level => (
                        <Badge variant="outline" class={styles.culturalLevelBadge}>
                          Level {level}
                        </Badge>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Show>

        {/* Cultural Education Resources */}
        <Show when={showCulturalInfo() && context()}>
          <div class={styles.culturalResources}>
            <Card class={styles.culturalResourcesCard}>
              <div class={styles.culturalResourcesContent}>
                <h3 class={styles.culturalResourcesTitle}>
                  Cultural Context & Educational Resources
                </h3>
                <p class={styles.culturalResourcesDescription}>
                  Learn about the cultural contexts and traditional knowledge represented in these
                  documents. Information provided for educational purposes only.
                </p>
                <div class={styles.culturalResourcesList}>
                  <div class={styles.culturalResource}>
                    <CulturalIndicator
                      level={context()?.sensitivityLevel || 1}
                      informationOnly={true}
                      culturalOrigin={context()?.origin}
                      traditionalKnowledge={context()?.traditionalKnowledge}
                    />
                    <span class={styles.resourceTitle}>
                      {context()?.description || 'General cultural context available'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Show>

        {/* Documents Grid/List */}
        <div class={styles.documentsContainer}>
          <Show when={isLoading()}>
            <div class={styles.loadingContainer}>
              <Loading />
              <p class={styles.loadingText}>Loading new arrivals...</p>
            </div>
          </Show>

          <Show when={error()}>
            <div class={styles.errorContainer}>
              <Card class={styles.errorCard}>
                <div class={styles.errorContent}>
                  <h3>Error Loading Documents</h3>
                  <p>{error()}</p>
                  <Button onClick={loadDocuments}>Try Again</Button>
                </div>
              </Card>
            </div>
          </Show>

          <Show when={!isLoading() && !error() && filteredDocuments().length === 0}>
            <div class={styles.emptyState}>
              <Card class={styles.emptyStateCard}>
                <div class={styles.emptyStateContent}>
                  <Calendar size={48} class={styles.emptyStateIcon} />
                  <h3>No New Arrivals</h3>
                  <p>No documents found for the selected time period.</p>
                  <Button onClick={() => handleTimeFilterChange('last-month')} variant="outline">
                    Expand Time Range
                  </Button>
                </div>
              </Card>
            </div>
          </Show>

          <Show when={!isLoading() && !error() && filteredDocuments().length > 0}>
            <div class={`${styles.documentsGrid} ${styles[viewMode()]}`}>
              <For each={filteredDocuments()}>
                {document => (
                  <DocumentCard
                    document={document}
                    variant={viewMode() === 'grid' ? 'grid' : 'default'}
                    showCulturalContext={showCulturalInfo()}
                    onOpen={() => handleDocumentOpen(document)}
                    onDownload={() => handleDownload(document)}
                    onShare={() => handleShare(document)}
                  />
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Results Summary */}
        <Show when={!isLoading() && filteredDocuments().length > 0}>
          <div class={styles.resultsSummary}>
            <p class={styles.resultsText}>
              Showing {filteredDocuments().length} documents
              {timeFilter() !== 'custom' &&
                ` from ${timeFilterOptions.find(opt => opt.value === timeFilter())?.label.toLowerCase()}`}
            </p>
          </div>
        </Show>
      </div>
    </MainLayout>
  );
};

export default NewArrivalsPage;
