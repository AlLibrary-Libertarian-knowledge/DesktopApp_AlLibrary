import { Component, createSignal, createEffect, Show, For, onMount } from 'solid-js';
import { Button, Input, Card } from '../../components/foundation';
import { NetworkInfo } from '../../components/domain/search';
import {
  Search as SearchIcon,
  Filter,
  X,
  Clock,
  BookOpen,
  FileText,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Info,
  AlertCircle,
} from 'lucide-solid';
import { searchService } from '../../services';
import { useTranslation } from '../../i18n/hooks';
import type {
  SearchQuery,
  SearchResult,
  SearchFilters,
  SearchOptions,
} from '../../services/searchService';
import type { CulturalSensitivityLevel } from '../../types/Cultural';
import styles from './Search.module.css';

/**
 * Search View Mode
 */
export type SearchViewMode = 'grid' | 'list';

/**
 * Search Sort Options
 */
export type SearchSortBy = 'relevance' | 'date' | 'title' | 'cultural_origin';
export type SearchSortOrder = 'asc' | 'desc';

/**
 * Search Page Component
 *
 * Implements comprehensive local search with cultural awareness and anti-censorship compliance.
 * Cultural filtering is informational only - never restricts search results for educational purposes.
 * All content remains searchable with appropriate cultural context provided.
 *
 * @example
 * ```tsx
 * <SearchPage />
 * ```
 */
const SearchPage: Component = () => {
  // Initialize i18n translation hook
  const { t } = useTranslation('pages');

  // Search state
  const [searchQuery, setSearchQuery] = createSignal('');
  const [searchResults, setSearchResults] = createSignal<SearchResult[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [hasSearched, setHasSearched] = createSignal(false);
  const [searchSuggestions, setSearchSuggestions] = createSignal<string[]>([]);
  const [showSuggestions, setShowSuggestions] = createSignal(false);
  const [searchHistory, setSearchHistory] = createSignal<string[]>([]);

  // UI state
  const [viewMode, setViewMode] = createSignal<SearchViewMode>('grid');
  const [showFilters, setShowFilters] = createSignal(false);
  const [sortBy, setSortBy] = createSignal<SearchSortBy>('relevance');
  const [sortOrder, setSortOrder] = createSignal<SearchSortOrder>('desc');

  // Filter state (CULTURAL INFORMATION ONLY - NO ACCESS RESTRICTION)
  const [selectedFormats, setSelectedFormats] = createSignal<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = createSignal<string[]>([]);
  const [selectedCulturalOrigins, setSelectedCulturalOrigins] = createSignal<string[]>([]);
  const [selectedSensitivityLevels, setSelectedSensitivityLevels] = createSignal<number[]>([
    1, 2, 3, 4, 5,
  ]); // ALL levels accessible
  const [showEducationalOnly, setShowEducationalOnly] = createSignal(false);
  const [selectedTags, setSelectedTags] = createSignal<string[]>([]);
  const [selectedCategories, setSelectedCategories] = createSignal<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = createSignal(false);

  // Cultural awareness state (EDUCATIONAL DISPLAY ONLY)
  const [showCulturalContext, setShowCulturalContext] = createSignal(true);
  const [enableEducationalInfo, setEnableEducationalInfo] = createSignal(true);

  // Component lifecycle
  onMount(async () => {
    try {
      // Load search history for user convenience
      const history = await searchService.searchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  });

  /**
   * Handle search input changes with suggestions
   */
  const handleSearchInput = async (value: string) => {
    setSearchQuery(value);

    if (value.length > 2) {
      try {
        const suggestions = await searchService.searchSuggestions(value);
        setSearchSuggestions(suggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Failed to get search suggestions:', error);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  /**
   * Execute search with cultural awareness
   * Cultural filtering provides context - does NOT restrict results
   */
  const executeSearch = async (query?: string) => {
    const searchTerm = query || searchQuery();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      // Build search query with cultural awareness (INFORMATIONAL ONLY)
      const searchQuery: SearchQuery = {
        query: searchTerm,
        filters: {
          contentTypes: [],
          formats: selectedFormats(),
          languages: selectedLanguages(),
          culturalOrigins: selectedCulturalOrigins(),
          sensitivityLevels: selectedSensitivityLevels(), // ALL levels included by default
          educationalOnly: showEducationalOnly(),
          tags: selectedTags(),
          categories: selectedCategories(),
          authors: [],
          dateRange: {},
          verifiedOnly: verifiedOnly(),
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeContent: true,
          includeMetadata: true,
          maxResults: 100,
          sortBy: sortBy(),
          sortOrder: sortOrder(),
          respectCulturalBoundaries: false, // NO RESTRICTIONS - educational approach only
          showEducationalContext: enableEducationalInfo(),
          enableCommunityValidation: false, // No validation gates for access
        },
      };

      // Perform search - ALL content accessible with educational context
      const results = await searchService.search(searchQuery);
      setSearchResults(results);
      setHasSearched(true);

      // Update search history for user convenience
      if (results.length > 0) {
        const updatedHistory = [searchTerm, ...searchHistory().filter(h => h !== searchTerm)].slice(
          0,
          10
        );
        setSearchHistory(updatedHistory);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handle search form submission
   */
  const handleSearchSubmit = (e: Event) => {
    e.preventDefault();
    executeSearch();
  };

  /**
   * Clear search and reset state
   */
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setShowSuggestions(false);
  };

  /**
   * Toggle sort order
   */
  const toggleSortOrder = () => {
    setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'));
    if (hasSearched()) {
      executeSearch();
    }
  };

  /**
   * Get cultural sensitivity badge color (INFORMATIONAL ONLY)
   */
  const getSensitivityColor = (level: number) => {
    switch (level) {
      case 1:
        return 'var(--color-success, #10b981)'; // Public
      case 2:
        return 'var(--color-info, #3b82f6)'; // Educational
      case 3:
        return 'var(--color-warning, #f59e0b)'; // Traditional
      case 4:
        return 'var(--color-danger, #ef4444)'; // Guardian
      case 5:
        return 'var(--color-sacred, #8b5cf6)'; // Sacred
      default:
        return 'var(--color-info, #3b82f6)';
    }
  };

  /**
   * Get sensitivity level name (EDUCATIONAL CONTEXT)
   */
  const getSensitivityName = (level: number) => {
    switch (level) {
      case 1:
        return 'Public';
      case 2:
        return 'Educational';
      case 3:
        return 'Traditional';
      case 4:
        return 'Guardian';
      case 5:
        return 'Sacred';
      default:
        return 'Unknown';
    }
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resultCount = () => searchResults().length;
  const searchTerm = () => searchQuery().trim();

  return (
    <div class={styles.searchPage}>
      {/* Search Header */}
      <div class={styles.searchHeader}>
        <div class={styles.titleSection}>
          <h1 class={styles.title}>
            <SearchIcon size={28} />
            Document Search
          </h1>
          <p class={styles.subtitle}>
            Search across all documents with cultural context and educational information
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} class={styles.searchForm}>
          <div class={styles.searchInputContainer}>
            <SearchIcon class={styles.searchIcon} size={20} />
            <Input
              type="search"
              placeholder="Search documents, titles, content, authors..."
              value={searchQuery()}
              onInput={handleSearchInput}
              class={styles.searchInput}
              autoFocus
            />
            <Show when={searchQuery()}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                class={styles.clearButton}
                ariaLabel="Clear search"
              >
                <X size={16} />
              </Button>
            </Show>
          </div>

          {/* Search Suggestions */}
          <Show when={showSuggestions() && searchSuggestions().length > 0}>
            <div class={styles.suggestions}>
              <For each={searchSuggestions()}>
                {suggestion => (
                  <button
                    type="button"
                    class={styles.suggestionItem}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      executeSearch(suggestion);
                    }}
                  >
                    <SearchIcon size={14} />
                    {suggestion}
                  </button>
                )}
              </For>
            </div>
          </Show>

          {/* Search History */}
          <Show when={!showSuggestions() && searchHistory().length > 0 && !searchQuery()}>
            <div class={styles.searchHistory}>
              <div class={styles.historyHeader}>
                <Clock size={16} />
                <span>Recent Searches</span>
              </div>
              <For each={searchHistory().slice(0, 5)}>
                {historyItem => (
                  <button
                    type="button"
                    class={styles.historyItem}
                    onClick={() => {
                      setSearchQuery(historyItem);
                      executeSearch(historyItem);
                    }}
                  >
                    <Clock size={14} />
                    {historyItem}
                  </button>
                )}
              </For>
            </div>
          </Show>
        </form>
      </div>

      {/* Search Controls */}
      <Show when={hasSearched()}>
        <div class={styles.searchControls}>
          <div class={styles.resultsInfo}>
            <span class={styles.resultCount}>
              {resultCount()} result{resultCount() !== 1 ? 's' : ''} for "{searchTerm()}"
            </span>
          </div>

          <div class={styles.controlsRight}>
            {/* Filters Toggle */}
            <Button
              variant={showFilters() ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowFilters(prev => !prev)}
              class={styles.filtersButton}
            >
              <Filter size={16} />
              Filters
            </Button>

            {/* Sort Controls */}
            <div class={styles.sortControls}>
              <select
                value={sortBy()}
                onInput={e => {
                  setSortBy(e.target.value as SearchSortBy);
                  executeSearch();
                }}
                class={styles.sortSelect}
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="cultural_origin">Cultural Origin</option>
              </select>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSortOrder}
                class={styles.sortOrderButton}
                ariaLabel={`Sort ${sortOrder() === 'asc' ? 'ascending' : 'descending'}`}
              >
                {sortOrder() === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div class={styles.viewModeToggle}>
              <Button
                variant={viewMode() === 'grid' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid size={16} />
              </Button>
              <Button
                variant={viewMode() === 'list' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </Button>
            </div>
          </div>
        </div>
      </Show>

      {/* Search Filters (EDUCATIONAL INFORMATION ONLY) */}
      <Show when={showFilters() && hasSearched()}>
        <Card class={styles.filtersPanel}>
          <div class={styles.filtersHeader}>
            <h3>Search Filters</h3>
            <span class={styles.educationalNote}>
              <Info size={14} />
              Filters provide educational context - all content remains accessible
            </span>
          </div>

          <div class={styles.filtersGrid}>
            {/* Cultural Sensitivity Levels (INFORMATIONAL ONLY) */}
            <div class={styles.filterGroup}>
              <label class={styles.filterLabel}>
                Cultural Context Levels (Educational Display)
              </label>
              <div class={styles.sensitivityOptions}>
                <For each={[1, 2, 3, 4, 5]}>
                  {level => (
                    <label class={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedSensitivityLevels().includes(level)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedSensitivityLevels(prev => [...prev, level]);
                          } else {
                            setSelectedSensitivityLevels(prev => prev.filter(l => l !== level));
                          }
                          executeSearch();
                        }}
                      />
                      <span
                        class={styles.sensitivityBadge}
                        style={{ 'background-color': getSensitivityColor(level) }}
                      >
                        {getSensitivityName(level)}
                      </span>
                    </label>
                  )}
                </For>
              </div>
            </div>

            {/* Format Filters */}
            <div class={styles.filterGroup}>
              <label class={styles.filterLabel}>File Formats</label>
              <div class={styles.formatOptions}>
                <For each={['PDF', 'EPUB', 'TXT', 'DOCX', 'MD']}>
                  {format => (
                    <label class={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedFormats().includes(format)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedFormats(prev => [...prev, format]);
                          } else {
                            setSelectedFormats(prev => prev.filter(f => f !== format));
                          }
                          executeSearch();
                        }}
                      />
                      {format}
                    </label>
                  )}
                </For>
              </div>
            </div>

            {/* Educational Context Toggle */}
            <div class={styles.filterGroup}>
              <label class={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={enableEducationalInfo()}
                  onChange={e => {
                    setEnableEducationalInfo(e.target.checked);
                    executeSearch();
                  }}
                />
                Show Educational Context Information
              </label>
            </div>
          </div>
        </Card>
      </Show>

      {/* Network Information */}
      <NetworkInfo />

      {/* Search Results */}
      <div class={styles.searchResults}>
        <Show
          when={hasSearched()}
          fallback={
            <div class={styles.emptyState}>
              <SearchIcon size={64} />
              <h2>Search AlLibrary</h2>
              <p>
                Enter a search term to find documents, books, and educational materials. All content
                is accessible with appropriate cultural context.
              </p>
            </div>
          }
        >
          <Show
            when={isSearching()}
            fallback={
              <Show
                when={resultCount() > 0}
                fallback={
                  <div class={styles.noResults}>
                    <SearchIcon size={48} />
                    <h3>No results found</h3>
                    <p>Try different keywords or adjust your filters</p>
                  </div>
                }
              >
                <div
                  class={`${styles.resultsGrid} ${viewMode() === 'list' ? styles.listView : ''}`}
                >
                  <For each={searchResults()}>
                    {result => (
                      <Card class={styles.resultCard}>
                        <div class={styles.resultHeader}>
                          <div class={styles.resultIcon}>
                            {result.document.format === 'pdf' ? (
                              <FileText size={20} />
                            ) : (
                              <BookOpen size={20} />
                            )}
                          </div>
                          <div class={styles.resultTitle}>
                            <h4>{result.document.title}</h4>
                            <div class={styles.resultMeta}>
                              <span class={styles.resultFormat}>
                                {result.document.format.toUpperCase()}
                              </span>
                              <span class={styles.resultSize}>
                                {formatFileSize(result.document.fileSize)}
                              </span>
                              <span class={styles.relevanceScore}>
                                {Math.round(result.relevanceScore * 100)}% match
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Cultural Context Display (EDUCATIONAL ONLY) */}
                        <Show when={showCulturalContext() && result.document.culturalMetadata}>
                          <div class={styles.culturalContext}>
                            <div class={styles.culturalHeader}>
                              <span
                                class={styles.sensitivityBadge}
                                style={{
                                  'background-color': getSensitivityColor(
                                    result.document.culturalMetadata.sensitivityLevel
                                  ),
                                }}
                              >
                                {getSensitivityName(
                                  result.document.culturalMetadata.sensitivityLevel
                                )}
                              </span>
                              <span class={styles.culturalOrigin}>
                                {result.document.culturalMetadata.culturalOrigin}
                              </span>
                            </div>
                            <Show when={enableEducationalInfo() && result.culturalContext}>
                              <div class={styles.educationalContext}>
                                <Info size={14} />
                                <span>{result.culturalContext?.culturalSignificance}</span>
                              </div>
                            </Show>
                          </div>
                        </Show>

                        {/* Document Description */}
                        <Show when={result.document.description}>
                          <p class={styles.resultDescription}>{result.document.description}</p>
                        </Show>

                        {/* Search Highlights */}
                        <Show when={result.highlights.length > 0}>
                          <div class={styles.highlights}>
                            <For each={result.highlights.slice(0, 3)}>
                              {highlight => (
                                <div class={styles.highlight}>
                                  <strong>{highlight.field}:</strong> ...{highlight.text}...
                                </div>
                              )}
                            </For>
                          </div>
                        </Show>

                        {/* Result Actions */}
                        <div class={styles.resultActions}>
                          <Button size="sm" variant="primary">
                            <BookOpen size={16} />
                            View Document
                          </Button>
                          <Button size="sm" variant="secondary">
                            <Info size={16} />
                            Details
                          </Button>
                        </div>
                      </Card>
                    )}
                  </For>
                </div>
              </Show>
            }
          >
            <div class={styles.searchingState}>
              <div class={styles.spinner}></div>
              <p>Searching documents...</p>
            </div>
          </Show>
        </Show>
      </div>

      {/* Anti-Censorship Notice */}
      <div class={styles.antiCensorshipNotice}>
        <Info size={16} />
        <span>
          All search results are accessible regardless of cultural context. Cultural information is
          provided for educational understanding and respect.
        </span>
      </div>
    </div>
  );
};

export default SearchPage;
