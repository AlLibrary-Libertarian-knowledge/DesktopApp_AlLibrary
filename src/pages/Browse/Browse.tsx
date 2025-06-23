/**
 * Enhanced Browse Categories Page - Cyberpunk Emerald Theme
 *
 * Provides comprehensive category browsing with cultural awareness and sophisticated cyberpunk design.
 * ANTI-CENSORSHIP: Cultural information for education only, never restricts access.
 */

import { Component, createSignal, createEffect, For, Show, createMemo } from 'solid-js';
import { Card } from '../../components/foundation/Card';
import { Button } from '../../components/foundation/Button';
import { Input } from '../../components/foundation/Input';
import {
  BookOpen,
  Search,
  Grid,
  List,
  FolderOpen,
  Users,
  Globe,
  Filter,
  Sparkles,
} from 'lucide-solid';
import { CulturalSensitivityLevel } from '../../types/Cultural';
import styles from './BrowsePage.module.css';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  documentCount: number;
  culturalOrigin?: string;
  sensitivityLevel: CulturalSensitivityLevel;
  subcategories: SubCategory[];
  color: string;
  tags?: string[];
  lastUpdated?: Date;
}

interface SubCategory {
  id: string;
  name: string;
  documentCount: number;
}

/**
 * Enhanced Browse Categories Page Component
 * Implements comprehensive category browsing with cultural awareness and cyberpunk emerald theme
 */
const BrowsePage: Component = () => {
  const [categories, setCategories] = createSignal<Category[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedSensitivity, setSelectedSensitivity] = createSignal<
    CulturalSensitivityLevel | 'all'
  >('all');
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [loading, setLoading] = createSignal(true);
  const [sortBy, setSortBy] = createSignal<'name' | 'documents' | 'updated'>('name');
  const [showFilters, setShowFilters] = createSignal(false);

  // Mock data for development with enhanced details
  createEffect(() => {
    setTimeout(() => {
      setCategories([
        {
          id: 'traditional-knowledge',
          name: 'Traditional Knowledge',
          description:
            'Indigenous wisdom, practices, and cultural heritage preserved through generations',
          icon: '🌿',
          documentCount: 234,
          culturalOrigin: 'Global Indigenous Communities',
          sensitivityLevel: CulturalSensitivityLevel.COMMUNITY,
          color: '#00ff88',
          tags: ['indigenous', 'traditional', 'wisdom', 'heritage'],
          lastUpdated: new Date('2024-01-15'),
          subcategories: [
            { id: 'medicine', name: 'Traditional Medicine', documentCount: 67 },
            { id: 'astronomy', name: 'Indigenous Astronomy', documentCount: 23 },
            { id: 'agriculture', name: 'Traditional Agriculture', documentCount: 89 },
            { id: 'crafts', name: 'Traditional Crafts', documentCount: 55 },
          ],
        },
        {
          id: 'science-technology',
          name: 'Science & Technology',
          description:
            'Scientific papers, technical documentation, and cutting-edge research findings',
          icon: '🔬',
          documentCount: 1847,
          culturalOrigin: 'Global Scientific Community',
          sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
          color: '#00cc66',
          tags: ['science', 'technology', 'research', 'innovation'],
          lastUpdated: new Date('2024-01-20'),
          subcategories: [
            { id: 'physics', name: 'Physics', documentCount: 423 },
            { id: 'biology', name: 'Biology', documentCount: 567 },
            { id: 'computer-science', name: 'Computer Science', documentCount: 789 },
            { id: 'engineering', name: 'Engineering', documentCount: 68 },
          ],
        },
        {
          id: 'literature-arts',
          name: 'Literature & Arts',
          description:
            'Literary works, poetry, and artistic expressions from diverse cultures worldwide',
          icon: '📚',
          documentCount: 892,
          culturalOrigin: 'Global Cultural Communities',
          sensitivityLevel: CulturalSensitivityLevel.EDUCATIONAL,
          color: '#44ff99',
          tags: ['literature', 'arts', 'poetry', 'culture'],
          lastUpdated: new Date('2024-01-18'),
          subcategories: [
            { id: 'poetry', name: 'Poetry', documentCount: 234 },
            { id: 'novels', name: 'Novels & Stories', documentCount: 345 },
            { id: 'theater', name: 'Theater & Performance', documentCount: 123 },
            { id: 'visual-arts', name: 'Visual Arts', documentCount: 190 },
          ],
        },
        {
          id: 'history-culture',
          name: 'History & Culture',
          description:
            'Historical documents, cultural studies, and heritage preservation materials',
          icon: '🏛️',
          documentCount: 1203,
          culturalOrigin: 'Various Cultural Communities',
          sensitivityLevel: CulturalSensitivityLevel.EDUCATIONAL,
          color: '#aa44ff',
          tags: ['history', 'culture', 'heritage', 'archaeology'],
          lastUpdated: new Date('2024-01-17'),
          subcategories: [
            { id: 'ancient-history', name: 'Ancient History', documentCount: 312 },
            { id: 'cultural-studies', name: 'Cultural Studies', documentCount: 445 },
            { id: 'archaeology', name: 'Archaeology', documentCount: 267 },
            { id: 'anthropology', name: 'Anthropology', documentCount: 179 },
          ],
        },
        {
          id: 'education-learning',
          name: 'Education & Learning',
          description: 'Educational materials, tutorials, and comprehensive learning resources',
          icon: '🎓',
          documentCount: 756,
          culturalOrigin: 'Educational Communities',
          sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
          color: '#ffaa00',
          tags: ['education', 'learning', 'tutorials', 'teaching'],
          lastUpdated: new Date('2024-01-19'),
          subcategories: [
            { id: 'textbooks', name: 'Textbooks', documentCount: 234 },
            { id: 'tutorials', name: 'Tutorials & Guides', documentCount: 267 },
            { id: 'research-methods', name: 'Research Methods', documentCount: 123 },
            { id: 'language-learning', name: 'Language Learning', documentCount: 132 },
          ],
        },
        {
          id: 'community-resources',
          name: 'Community Resources',
          description: 'Local community documents, guidelines, and collaborative resources',
          icon: '🏘️',
          documentCount: 445,
          culturalOrigin: 'Local Communities',
          sensitivityLevel: CulturalSensitivityLevel.COMMUNITY,
          color: '#ff4466',
          tags: ['community', 'local', 'guidelines', 'collaboration'],
          lastUpdated: new Date('2024-01-16'),
          subcategories: [
            { id: 'governance', name: 'Community Governance', documentCount: 89 },
            { id: 'guidelines', name: 'Guidelines & Protocols', documentCount: 156 },
            { id: 'events', name: 'Community Events', documentCount: 123 },
            { id: 'projects', name: 'Community Projects', documentCount: 77 },
          ],
        },
      ]);
      setLoading(false);
    }, 1000);
  });

  // Enhanced filtering with search highlighting
  const filteredCategories = createMemo(() => {
    let filtered = categories().filter(category => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchQuery().toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery().toLowerCase()) ||
        category.tags?.some(tag => tag.toLowerCase().includes(searchQuery().toLowerCase())) ||
        category.subcategories.some(sub =>
          sub.name.toLowerCase().includes(searchQuery().toLowerCase())
        );

      const matchesSensitivity =
        selectedSensitivity() === 'all' || category.sensitivityLevel === selectedSensitivity();

      return matchesSearch && matchesSensitivity;
    });

    // Enhanced sorting
    filtered.sort((a, b) => {
      switch (sortBy()) {
        case 'documents':
          return b.documentCount - a.documentCount;
        case 'updated':
          return (b.lastUpdated?.getTime() || 0) - (a.lastUpdated?.getTime() || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  });

  const getSensitivityColor = (level: CulturalSensitivityLevel) => {
    switch (level) {
      case CulturalSensitivityLevel.PUBLIC:
        return '#00ff88';
      case CulturalSensitivityLevel.EDUCATIONAL:
        return '#00cc66';
      case CulturalSensitivityLevel.COMMUNITY:
        return '#ffaa00';
      case CulturalSensitivityLevel.GUARDIAN:
        return '#aa44ff';
      case CulturalSensitivityLevel.SACRED:
        return '#ff4466';
      default:
        return '#00ff88';
    }
  };

  const getSensitivityLabel = (level: CulturalSensitivityLevel) => {
    switch (level) {
      case CulturalSensitivityLevel.PUBLIC:
        return 'Public';
      case CulturalSensitivityLevel.EDUCATIONAL:
        return 'Educational';
      case CulturalSensitivityLevel.COMMUNITY:
        return 'Community';
      case CulturalSensitivityLevel.GUARDIAN:
        return 'Guardian';
      case CulturalSensitivityLevel.SACRED:
        return 'Sacred';
      default:
        return 'Unknown';
    }
  };

  const getTotalDocuments = () => {
    return filteredCategories().reduce((total, category) => total + category.documentCount, 0);
  };

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <div class={styles.browsePage}>
      {/* Enhanced Header Section */}
      <header class={styles.pageHeader}>
        <div class={styles.titleSection}>
          <h1 class={styles.pageTitle}>
            <Sparkles size={48} style={{ display: 'inline-block', 'margin-right': '1rem' }} />
            Browse Categories
          </h1>
          <p class={styles.pageSubtitle}>
            Explore our comprehensive collection organized by categories, cultures, and traditional
            knowledge systems. Discover {categories().length} categories with{' '}
            {getTotalDocuments().toLocaleString()} documents.
          </p>
        </div>

        {/* Enhanced View Controls */}
        <div class={styles.viewControls}>
          <button
            class={`${styles.viewButton} ${viewMode() === 'grid' ? styles.active : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            title="Grid View"
          >
            <Grid size={16} />
            Grid
          </button>
          <button
            class={`${styles.viewButton} ${viewMode() === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
            title="List View"
          >
            <List size={16} />
            List
          </button>
          <button
            class={`${styles.viewButton} ${showFilters() ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters())}
            aria-label="Toggle filters"
            title="Advanced Filters"
          >
            <Filter size={16} />
            Filters
          </button>
        </div>
      </header>

      {/* Enhanced Search and Filter Section */}
      <div class={styles.searchFilterSection}>
        <div class={styles.searchContainer}>
          <div class={styles.categorySearch}>
            <Search class={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search categories, topics, and cultural content..."
              value={searchQuery()}
              onInput={e => setSearchQuery((e.target as HTMLInputElement).value)}
              class={styles.searchInput}
            />
          </div>
        </div>

        <div class={styles.filterPanel}>
          <select
            value={selectedSensitivity()}
            onChange={e =>
              setSelectedSensitivity(
                e.target.value === 'all'
                  ? 'all'
                  : (parseInt(e.target.value) as CulturalSensitivityLevel)
              )
            }
            class={styles.filterSelect}
            title="Filter by cultural sensitivity level"
          >
            <option value="all">All Sensitivity Levels</option>
            <option value={CulturalSensitivityLevel.PUBLIC}>🌍 Public</option>
            <option value={CulturalSensitivityLevel.EDUCATIONAL}>📚 Educational</option>
            <option value={CulturalSensitivityLevel.COMMUNITY}>🏘️ Community</option>
            <option value={CulturalSensitivityLevel.GUARDIAN}>👥 Guardian</option>
            <option value={CulturalSensitivityLevel.SACRED}>🔒 Sacred</option>
          </select>

          <Show when={showFilters()}>
            <select
              value={sortBy()}
              onChange={e => setSortBy(e.target.value as any)}
              class={styles.filterSelect}
              title="Sort categories by"
            >
              <option value="name">Sort by Name</option>
              <option value="documents">Sort by Document Count</option>
              <option value="updated">Sort by Last Updated</option>
            </select>
          </Show>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div class={styles.stats}>
        <div class={styles.statCard} title="Total categories available">
          <FolderOpen class={styles.statIcon} />
          <div>
            <h3>{filteredCategories().length}</h3>
            <p>Categories</p>
          </div>
        </div>
        <div class={styles.statCard} title="Total documents across all categories">
          <BookOpen class={styles.statIcon} />
          <div>
            <h3>{getTotalDocuments().toLocaleString()}</h3>
            <p>Total Documents</p>
          </div>
        </div>
        <div class={styles.statCard} title="Community-managed categories">
          <Users class={styles.statIcon} />
          <div>
            <h3>
              {
                categories().filter(c => c.sensitivityLevel === CulturalSensitivityLevel.COMMUNITY)
                  .length
              }
            </h3>
            <p>Community Categories</p>
          </div>
        </div>
        <div class={styles.statCard} title="Publicly accessible categories">
          <Globe class={styles.statIcon} />
          <div>
            <h3>
              {
                categories().filter(c => c.sensitivityLevel === CulturalSensitivityLevel.PUBLIC)
                  .length
              }
            </h3>
            <p>Public Categories</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main class={styles.mainContent}>
        <Show
          when={!loading()}
          fallback={
            <div class={styles.loadingContainer}>
              <div class={styles.spinner}></div>
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
                  {searchQuery() || selectedSensitivity() !== 'all'
                    ? 'Try adjusting your filters to find more categories.'
                    : 'Categories are being organized by the community.'}
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
                        <div class={styles.categoryIcon} style={{ color: category.color }}>
                          {category.icon}
                        </div>
                        <div
                          class={styles.sensitivityBadge}
                          style={{
                            'background-color': getSensitivityColor(category.sensitivityLevel),
                          }}
                          title={`Cultural sensitivity level: ${getSensitivityLabel(category.sensitivityLevel)}`}
                        >
                          {getSensitivityLabel(category.sensitivityLevel)}
                        </div>
                      </div>

                      <div class={styles.cardContent}>
                        <h3
                          class={styles.categoryTitle}
                          innerHTML={highlightText(category.name, searchQuery())}
                        ></h3>
                        <p
                          class={styles.categoryDescription}
                          innerHTML={highlightText(category.description, searchQuery())}
                        ></p>

                        <div class={styles.categoryMeta}>
                          <span
                            class={styles.documentCount}
                            title={`${category.documentCount} documents in this category`}
                          >
                            📄 {category.documentCount.toLocaleString()} documents
                          </span>
                          {category.culturalOrigin && (
                            <span
                              class={styles.culturalOrigin}
                              title={`Cultural origin: ${category.culturalOrigin}`}
                            >
                              📍 {category.culturalOrigin}
                            </span>
                          )}
                          {category.lastUpdated && (
                            <span
                              class={styles.lastUpdated}
                              title={`Last updated: ${category.lastUpdated.toLocaleDateString()}`}
                            >
                              🕒 Updated {category.lastUpdated.toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div class={styles.subcategories}>
                          <h4>Popular Topics:</h4>
                          <div class={styles.subcategoryList}>
                            <For each={category.subcategories.slice(0, 3)}>
                              {sub => (
                                <span
                                  class={styles.subcategory}
                                  title={`${sub.documentCount} documents`}
                                >
                                  {sub.name} ({sub.documentCount})
                                </span>
                              )}
                            </For>
                            {category.subcategories.length > 3 && (
                              <span
                                class={styles.subcategoryMore}
                                title={`${category.subcategories.length - 3} more subcategories`}
                              >
                                +{category.subcategories.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {category.tags && category.tags.length > 0 && (
                          <div class={styles.tags}>
                            <For each={category.tags.slice(0, 4)}>
                              {tag => (
                                <span class={styles.tag} onClick={() => setSearchQuery(tag)}>
                                  #{tag}
                                </span>
                              )}
                            </For>
                          </div>
                        )}
                      </div>

                      <div class={styles.cardActions}>
                        <Button
                          variant="primary"
                          size="sm"
                          title={`Explore ${category.name} category`}
                        >
                          Explore Category
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          title={`View all subcategories in ${category.name}`}
                        >
                          View Subcategories
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

      {/* Enhanced Cultural Acknowledgments */}
      <footer class={styles.pageFooter}>
        <div class={styles.culturalAcknowledgment}>
          <p>
            We acknowledge and respect the traditional knowledge systems and cultural
            classifications presented here. All cultural information is shared for educational
            purposes to promote understanding and appreciation of diverse knowledge traditions.
            Cultural content is provided as information only, supporting the principle that
            knowledge should be freely accessible while respecting its origins.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BrowsePage;
