/**
 * Enhanced Browse Categories Page
 *
 * Provides comprehensive category browsing with cultural awareness.
 * Implements all business rules from BrowseCategoriesPage specifications.
 * ANTI-CENSORSHIP: Cultural information for education only, never restricts access.
 */

import { Component, createSignal, createEffect, For, Show, ErrorBoundary } from 'solid-js';
import { createAsync } from '@solidjs/router';
import {
  categoryApi,
  culturalApi,
  type Category,
  type CategoryNode,
  CategoryType,
} from '../../services/api';
import { BreadcrumbNavigation } from '../../components/foundation/BreadcrumbNavigation/BreadcrumbNavigation';
import { CategoryCard } from '../../components/composite/CategoryCard/CategoryCard';
import { CategoryHierarchy } from '../../components/composite/CategoryHierarchy/CategoryHierarchy';
import SearchBar from '../../components/foundation/SearchBar/SearchBar';
import FilterPanel from '../../components/composite/FilterPanel/FilterPanel';
import LoadingSpinner from '../../components/foundation/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/foundation/ErrorMessage/ErrorMessage';
import { CulturalContextDisplay } from '../../components/cultural/CulturalContextDisplay/CulturalContextDisplay';
import { TraditionalClassificationView } from '../../components/cultural/TraditionalClassificationView/TraditionalClassificationView';
import styles from './BrowsePage.module.css';

/**
 * Enhanced Browse Categories Page Component
 * Implements comprehensive category browsing with cultural awareness
 */
export const BrowsePage: Component = () => {
  // State management
  const [currentCategoryId, setCurrentCategoryId] = createSignal<string | undefined>();
  const [searchQuery, setSearchQuery] = createSignal('');
  const [viewMode, setViewMode] = createSignal<'grid' | 'list' | 'hierarchy' | 'traditional'>(
    'grid'
  );
  const [selectedFilters, setSelectedFilters] = createSignal({
    types: [] as CategoryType[],
    culturalSensitivity: [] as string[],
    hasContent: false,
    minContentCount: 0,
    culturalOrigins: [] as string[],
  });
  const [showCulturalContext, setShowCulturalContext] = createSignal(false);
  const [showTraditionalClassifications, setShowTraditionalClassifications] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Data loading with createAsync for better performance
  const categoryTree = createAsync(async () => {
    try {
      setError(null);
      const response = await categoryApi.getCategoryTree({
        includeMetadata: true,
        includeCulturalContext: true,
        maxDepth: 6,
      });
      return response.success ? response.data : null;
    } catch (err) {
      setError('Failed to load category tree');
      return null;
    }
  });

  const featuredCategories = createAsync(async () => {
    try {
      const response = await categoryApi.getFeaturedCategories(12);
      return response.success ? response.data : [];
    } catch (err) {
      console.error('Failed to load featured categories:', err);
      return [];
    }
  });

  const traditionalClassifications = createAsync(async () => {
    try {
      const response = await culturalApi.getTraditionalClassifications();
      return response.success ? response.data : [];
    } catch (err) {
      console.error('Failed to load traditional classifications:', err);
      return [];
    }
  });

  // Current category details
  const currentCategory = createAsync(async () => {
    const categoryId = currentCategoryId();
    if (!categoryId) return null;

    try {
      const response = await categoryApi.getCategory(categoryId);
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Failed to load category details:', err);
      return null;
    }
  });

  // Category path for breadcrumbs
  const categoryPath = createAsync(async () => {
    const categoryId = currentCategoryId();
    if (!categoryId) return [];

    try {
      const response = await categoryApi.getCategoryPath(categoryId);
      return response.success ? response.data : [];
    } catch (err) {
      console.error('Failed to load category path:', err);
      return [];
    }
  });

  // Cultural context for current category
  const culturalContext = createAsync(async () => {
    const category = currentCategory();
    if (!category?.culturalContext) return null;

    try {
      const response = await culturalApi.getCulturalContext(category.id);
      return response.success ? response.data : null;
    } catch (err) {
      console.debug('Cultural context not available:', err);
      return null;
    }
  });

  // Search categories
  const searchResults = createAsync(async () => {
    const query = searchQuery();
    const filters = selectedFilters();

    if (!query && Object.values(filters).every(v => !v || (Array.isArray(v) && v.length === 0))) {
      return [];
    }

    try {
      setIsLoading(true);
      const response = await categoryApi.searchCategories(query, filters);
      return response.success ? response.data : [];
    } catch (err) {
      console.error('Category search failed:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  });

  // Event handlers
  const handleCategorySelect = (categoryId: string) => {
    setCurrentCategoryId(categoryId);
    setShowCulturalContext(false); // Reset cultural context display
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentCategoryId(undefined); // Clear current category when searching
  };

  const handleFilterChange = (filters: typeof selectedFilters) => {
    setSelectedFilters(filters);
  };

  const handleViewModeChange = (mode: typeof viewMode) => {
    setViewMode(mode);
  };

  const handleBackToParent = () => {
    const path = categoryPath();
    if (path && path.length > 1) {
      setCurrentCategoryId(path[path.length - 2]?.id);
    } else {
      setCurrentCategoryId(undefined);
    }
  };

  const toggleCulturalContext = () => {
    setShowCulturalContext(!showCulturalContext());
  };

  const toggleTraditionalClassifications = () => {
    setShowTraditionalClassifications(!showTraditionalClassifications());
  };

  // Get categories to display based on current state
  const categoriesToDisplay = () => {
    const query = searchQuery();
    const results = searchResults();
    const current = currentCategory();
    const tree = categoryTree();
    const featured = featuredCategories();

    // If searching, show search results
    if (query || results.length > 0) {
      return results.map(result => result.category);
    }

    // If viewing a specific category, show its subcategories
    if (current) {
      return current.subcategories || [];
    }

    // Otherwise show top-level categories or featured
    if (tree) {
      return Object.values(tree).filter(category => category.level === 0);
    }

    return featured || [];
  };

  return (
    <ErrorBoundary
      fallback={err => (
        <ErrorMessage
          message="Failed to load browse page"
          details={err.message}
          onRetry={() => window.location.reload()}
        />
      )}
    >
      <div class={styles.browsePage}>
        {/* Header Section */}
        <header class={styles.pageHeader}>
          <div class={styles.titleSection}>
            <h1 class={styles.pageTitle}>Browse Categories</h1>
            <p class={styles.pageSubtitle}>
              Explore our comprehensive collection organized by categories, cultures, and
              traditional knowledge systems
            </p>
          </div>

          {/* View Mode Controls */}
          <div class={styles.viewControls}>
            <button
              class={`${styles.viewButton} ${viewMode() === 'grid' ? styles.active : ''}`}
              onClick={() => handleViewModeChange('grid')}
              aria-label="Grid view"
            >
              Grid
            </button>
            <button
              class={`${styles.viewButton} ${viewMode() === 'list' ? styles.active : ''}`}
              onClick={() => handleViewModeChange('list')}
              aria-label="List view"
            >
              List
            </button>
            <button
              class={`${styles.viewButton} ${viewMode() === 'hierarchy' ? styles.active : ''}`}
              onClick={() => handleViewModeChange('hierarchy')}
              aria-label="Hierarchy view"
            >
              Hierarchy
            </button>
            <button
              class={`${styles.viewButton} ${viewMode() === 'traditional' ? styles.active : ''}`}
              onClick={() => handleViewModeChange('traditional')}
              aria-label="Traditional classifications"
            >
              Traditional
            </button>
          </div>

          {/* Cultural Context Toggle */}
          <div class={styles.culturalControls}>
            <button
              class={`${styles.culturalButton} ${showCulturalContext() ? styles.active : ''}`}
              onClick={toggleCulturalContext}
              aria-label="Toggle cultural context"
            >
              Cultural Context
            </button>
            <button
              class={`${styles.culturalButton} ${showTraditionalClassifications() ? styles.active : ''}`}
              onClick={toggleTraditionalClassifications}
              aria-label="Toggle traditional classifications"
            >
              Traditional Classifications
            </button>
          </div>
        </header>

        {/* Breadcrumb Navigation */}
        <Show when={categoryPath()?.length > 0}>
          <BreadcrumbNavigation
            items={
              categoryPath()?.map(category => ({
                label: category.name,
                href: `/browse?category=${category.id}`,
                onClick: () => handleCategorySelect(category.id),
              })) || []
            }
            onNavigate={handleCategorySelect}
            className={styles.breadcrumbNav}
          />
        </Show>

        {/* Search and Filter Section */}
        <div class={styles.searchFilterSection}>
          <div class={styles.searchContainer}>
            <SearchBar
              placeholder="Search categories..."
              value={searchQuery()}
              onSearch={handleSearch}
              onClear={() => setSearchQuery('')}
              className={styles.categorySearch}
            />
          </div>

          <FilterPanel
            filters={selectedFilters()}
            onFiltersChange={handleFilterChange}
            availableFilters={{
              types: Object.values(CategoryType),
              culturalSensitivity: ['low', 'medium', 'high'],
              culturalOrigins: [], // Will be populated from backend
            }}
            className={styles.filterPanel}
          />
        </div>

        {/* Cultural Context Display */}
        <Show when={showCulturalContext() && culturalContext()}>
          <div class={styles.culturalContextSection}>
            <CulturalContextDisplay
              context={culturalContext()!}
              expanded={true}
              showEducationalContent={true}
              onClose={() => setShowCulturalContext(false)}
            />
          </div>
        </Show>

        {/* Traditional Classifications Display */}
        <Show when={showTraditionalClassifications() && traditionalClassifications()}>
          <div class={styles.traditionalSection}>
            <TraditionalClassificationView
              classifications={traditionalClassifications()!}
              onCategorySelect={handleCategorySelect}
              showModernMappings={true}
            />
          </div>
        </Show>

        {/* Loading State */}
        <Show when={isLoading()}>
          <div class={styles.loadingContainer}>
            <LoadingSpinner size="large" message="Loading categories..." />
          </div>
        </Show>

        {/* Error State */}
        <Show when={error()}>
          <ErrorMessage
            message={error()!}
            onRetry={() => {
              setError(null);
              window.location.reload();
            }}
          />
        </Show>

        {/* Main Content Area */}
        <main class={styles.mainContent}>
          {/* Current Category Info */}
          <Show when={currentCategory()}>
            <div class={styles.currentCategoryInfo}>
              <div class={styles.categoryHeader}>
                <h2 class={styles.categoryTitle}>{currentCategory()?.name}</h2>
                <p class={styles.categoryDescription}>{currentCategory()?.description}</p>

                {/* Cultural Information Display (Educational Only) */}
                <Show when={currentCategory()?.culturalContext}>
                  <div class={styles.culturalInfo}>
                    <div class={styles.culturalBadge}>
                      Cultural Origin: {currentCategory()?.culturalContext?.culturalOrigin}
                    </div>
                    <Show when={currentCategory()?.culturalContext?.elderApproved}>
                      <div class={styles.elderApprovalBadge}>Elder Approved ✓</div>
                    </Show>
                  </div>
                </Show>

                <div class={styles.categoryStats}>
                  <span class={styles.statItem}>
                    {currentCategory()?.contentCount || 0} documents
                  </span>
                  <span class={styles.statItem}>
                    {currentCategory()?.subcategoryCount || 0} subcategories
                  </span>
                </div>
              </div>

              <button
                class={styles.backButton}
                onClick={handleBackToParent}
                aria-label="Back to parent category"
              >
                ← Back
              </button>
            </div>
          </Show>

          {/* Categories Display */}
          <Show
            when={!isLoading() && categoriesToDisplay().length > 0}
            fallback={
              <div class={styles.emptyState}>
                <h3>No categories found</h3>
                <p>Try adjusting your search terms or filters</p>
              </div>
            }
          >
            <div class={styles.categoriesContainer}>
              {/* Grid View */}
              <Show when={viewMode() === 'grid'}>
                <div class={styles.categoriesGrid}>
                  <For each={categoriesToDisplay()}>
                    {category => (
                      <CategoryCard
                        category={category}
                        onClick={() => handleCategorySelect(category.id)}
                        showCulturalContext={true}
                        showStats={true}
                        className={styles.categoryCard}
                      />
                    )}
                  </For>
                </div>
              </Show>

              {/* List View */}
              <Show when={viewMode() === 'list'}>
                <div class={styles.categoriesList}>
                  <For each={categoriesToDisplay()}>
                    {category => (
                      <div
                        class={styles.categoryListItem}
                        onClick={() => handleCategorySelect(category.id)}
                      >
                        <div class={styles.categoryInfo}>
                          <h3 class={styles.categoryName}>{category.name}</h3>
                          <p class={styles.categoryDescription}>{category.description}</p>

                          {/* Cultural Context Info */}
                          <Show when={category.culturalContext}>
                            <div class={styles.culturalTags}>
                              <span class={styles.culturalTag}>
                                {category.culturalContext?.culturalOrigin}
                              </span>
                              <Show when={category.culturalContext?.elderApproved}>
                                <span class={styles.approvalTag}>Elder Approved</span>
                              </Show>
                            </div>
                          </Show>
                        </div>

                        <div class={styles.categoryMeta}>
                          <span class={styles.contentCount}>{category.contentCount} documents</span>
                          <span class={styles.subcategoryCount}>
                            {category.subcategoryCount} subcategories
                          </span>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>

              {/* Hierarchy View */}
              <Show when={viewMode() === 'hierarchy' && categoryTree()}>
                <CategoryHierarchy
                  categoryTree={categoryTree()!}
                  onCategorySelect={handleCategorySelect}
                  highlightedCategory={currentCategoryId()}
                  showCulturalContext={true}
                  maxDepth={4}
                />
              </Show>

              {/* Traditional Classifications View */}
              <Show when={viewMode() === 'traditional' && traditionalClassifications()}>
                <div class={styles.traditionalView}>
                  <For each={traditionalClassifications()}>
                    {classification => (
                      <div class={styles.traditionalClassification}>
                        <h3 class={styles.classificationTitle}>
                          {classification.name} ({classification.culturalOrigin})
                        </h3>
                        <p class={styles.classificationDescription}>{classification.description}</p>

                        <div class={styles.traditionalCategories}>
                          <For each={classification.categories}>
                            {category => (
                              <div class={styles.traditionalCategory}>
                                <h4>{category.traditionalName}</h4>
                                <p>{category.description}</p>
                                <span class={styles.modernEquivalent}>
                                  Modern equivalent: {category.modernEquivalent}
                                </span>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </Show>
        </main>

        {/* Cultural Acknowledgments */}
        <footer class={styles.pageFooter}>
          <div class={styles.culturalAcknowledgment}>
            <p>
              We acknowledge and respect the traditional knowledge systems and cultural
              classifications presented here. All cultural information is shared for educational
              purposes with the guidance and approval of cultural guardians and community elders.
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default BrowsePage;
