/**
 * Enhanced Browse Categories Page - Cyberpunk Emerald Theme
 *
 * Provides comprehensive category browsing with cultural awareness and sophisticated cyberpunk design.
 * ANTI-CENSORSHIP: Cultural information for education only, never restricts access.
 */

import { type Component, createSignal, onMount, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Card } from '../../components/foundation/Card';
import { Button } from '../../components/foundation/Button';
import { Input } from '../../components/foundation/Input';
import { BookOpen, Search, Grid, List, FolderOpen, Globe } from 'lucide-solid';
import { listBrowseCategories, type BrowseCategory } from '@/services/network/discoveryService';
import styles from './BrowsePage.module.css';

export const BrowsePage: Component = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = createSignal<BrowseCategory[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listBrowseCategories();
      setCategories(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  });

  const filteredCategories = () => {
    const q = searchQuery().toLowerCase();
    return categories().filter(
      category =>
        !q || category.name.toLowerCase().includes(q) || category.source.toLowerCase().includes(q)
    );
  };

  const getTotalDocuments = () =>
    filteredCategories().reduce((total, category) => total + category.documentCount, 0);

  const openCategory = (category: BrowseCategory) => {
    navigate(`/search-network?q=${encodeURIComponent(category.name)}`);
  };

  return (
    <div class={styles.browsePage}>
      {/* Enhanced Header Section */}
      <header class={styles.pageHeader}>
        <div class={styles.titleSection}>
          <h1 class={styles.pageTitle}>Browse Categories</h1>
          <p class={styles.pageSubtitle}>
            Explore our comprehensive collection organized by categories, cultures, and traditional
            knowledge systems
          </p>
        </div>

        {/* View Mode Controls */}
        <div class={styles.viewControls}>
          <button
            class={`${styles.viewButton} ${viewMode() === 'grid' ? styles.active : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <Grid size={16} />
            Grid
          </button>
          <button
            class={`${styles.viewButton} ${viewMode() === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List size={16} />
            List
          </button>
        </div>
      </header>

      {/* Search and Filter Section */}
      <div class={styles.searchFilterSection}>
        <div class={styles.searchContainer}>
          <div class={styles.categorySearch}>
            <Search class={styles.searchIcon} />
            <Input
              type="search"
              placeholder="Search categories and topics..."
              value={searchQuery()}
              onInput={setSearchQuery}
              class={styles.searchInput}
            />
          </div>
        </div>

        <div class={styles.filterPanel}>
          <select
            value="all"
            disabled
            class={styles.filterSelect}
            title="Categories from local library and network cache"
          >
            <option value="all">All sources</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div class={styles.stats}>
        <div class={styles.statCard}>
          <FolderOpen class={styles.statIcon} />
          <div>
            <h3>{filteredCategories().length}</h3>
            <p>Categories</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <BookOpen class={styles.statIcon} />
          <div>
            <h3>{getTotalDocuments().toLocaleString()}</h3>
            <p>Total Documents</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Globe class={styles.statIcon} />
          <div>
            <h3>{categories().filter(c => c.source === 'network').length}</h3>
            <p>Network Categories</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main class={styles.mainContent}>
        <Show when={error()}>
          <div class={styles.emptyState}>
            <p>{error()}</p>
          </div>
        </Show>
        <Show
          when={!loading()}
          fallback={
            <div class={styles.loadingContainer}>
              <div class={styles.spinner} />
              <p>Loading categories...</p>
            </div>
          }
        >
          <Show
            when={filteredCategories().length > 0}
            fallback={
              <div class={styles.emptyState}>
                <BookOpen class={styles.emptyIcon} />
                <h3>No categories found</h3>
                <p>
                  {searchQuery()
                    ? 'Try adjusting your search to find more categories.'
                    : 'Categories appear after library scan or tracker lobby sync.'}
                </p>
                <Button variant="primary" onClick={() => (window.location.href = '/documents')}>
                  Explore All Documents
                </Button>
              </div>
            }
          >
            <div class={styles.categoriesContainer}>
              <div class={styles[`categoriesGrid${viewMode() === 'grid' ? 'Grid' : 'List'}`]}>
                <For each={filteredCategories()}>
                  {category => (
                    <Card class={styles.categoryCard}>
                      <div class={styles.cardHeader}>
                        <div class={styles.categoryIcon} style={{ color: '#00ff88' }}>
                          {category.source === 'network' ? '🌐' : '📁'}
                        </div>
                        <div
                          class={styles.sensitivityBadge}
                          style={{ 'background-color': '#00cc66' }}
                        >
                          {category.source}
                        </div>
                      </div>

                      <div class={styles.cardContent}>
                        <h3 class={styles.categoryTitle}>{category.name}</h3>
                        <p class={styles.categoryDescription}>
                          {category.source === 'network'
                            ? 'Files seen on the tracker lobby cache'
                            : 'Documents in your local library'}
                        </p>

                        <div class={styles.categoryMeta}>
                          <span class={styles.documentCount}>
                            📄 {category.documentCount.toLocaleString()} documents
                          </span>
                        </div>
                      </div>

                      <div class={styles.cardActions}>
                        <Button variant="primary" size="sm" onClick={() => openCategory(category)}>
                          Explore Category
                        </Button>
                      </div>
                    </Card>
                  )}
                </For>
              </div>
            </div>
          </Show>
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
  );
};

export default BrowsePage;
