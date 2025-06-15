import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { Card } from '../../components/foundation/Card';
import { Button } from '../../components/foundation/Button';
import { Input } from '../../components/foundation/Input';
import { BookOpen, Search, Grid, List, FolderOpen, Users, Globe } from 'lucide-solid';
import type { CulturalSensitivityLevel } from '../../types/Cultural';
import styles from './Browse.module.css';

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
}

interface SubCategory {
  id: string;
  name: string;
  documentCount: number;
}

const BrowsePage: Component = () => {
  const [categories, setCategories] = createSignal<Category[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedSensitivity, setSelectedSensitivity] = createSignal<
    CulturalSensitivityLevel | 'all'
  >('all');
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [loading, setLoading] = createSignal(true);

  // Mock data for development
  createEffect(() => {
    setTimeout(() => {
      setCategories([
        {
          id: 'traditional-knowledge',
          name: 'Traditional Knowledge',
          description: 'Indigenous wisdom, practices, and cultural heritage',
          icon: '🌿',
          documentCount: 234,
          culturalOrigin: 'Global Indigenous Communities',
          sensitivityLevel: 'community-restricted',
          color: '#27ae60',
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
          description: 'Scientific papers, technical documentation, and research',
          icon: '🔬',
          documentCount: 1847,
          culturalOrigin: 'Global Scientific Community',
          sensitivityLevel: 'public',
          color: '#3498db',
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
          description: 'Literary works, poetry, and artistic expressions',
          icon: '📚',
          documentCount: 892,
          culturalOrigin: 'Global Cultural Communities',
          sensitivityLevel: 'educational',
          color: '#9b59b6',
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
          description: 'Historical documents, cultural studies, and heritage',
          icon: '🏛️',
          documentCount: 1203,
          culturalOrigin: 'Various Cultural Communities',
          sensitivityLevel: 'educational',
          color: '#e67e22',
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
          description: 'Educational materials, tutorials, and learning resources',
          icon: '🎓',
          documentCount: 756,
          culturalOrigin: 'Educational Communities',
          sensitivityLevel: 'public',
          color: '#f39c12',
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
          description: 'Local community documents, guidelines, and resources',
          icon: '🏘️',
          documentCount: 445,
          culturalOrigin: 'Local Communities',
          sensitivityLevel: 'community-restricted',
          color: '#e74c3c',
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

  const filteredCategories = () => {
    return categories().filter(category => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchQuery().toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery().toLowerCase()) ||
        category.subcategories.some(sub =>
          sub.name.toLowerCase().includes(searchQuery().toLowerCase())
        );

      const matchesSensitivity =
        selectedSensitivity() === 'all' || category.sensitivityLevel === selectedSensitivity();

      return matchesSearch && matchesSensitivity;
    });
  };

  const getSensitivityColor = (level: CulturalSensitivityLevel) => {
    switch (level) {
      case 'public':
        return '#27ae60';
      case 'educational':
        return '#3498db';
      case 'community-restricted':
        return '#f39c12';
      case 'guardian-approval':
        return '#e67e22';
      case 'sacred-protected':
        return '#e74c3c';
    }
  };

  const getTotalDocuments = () => {
    return filteredCategories().reduce((total, category) => total + category.documentCount, 0);
  };

  return (
    <div class={styles.browsePage}>
      <div class={styles.header}>
        <div class={styles.titleSection}>
          <h1>
            <BookOpen class={styles.headerIcon} />
            Browse Categories
          </h1>
          <p>Explore documents organized by topics and cultural contexts</p>
        </div>

        <div class={styles.controls}>
          <div class={styles.searchContainer}>
            <Search class={styles.searchIcon} />
            <Input
              type="search"
              placeholder="Search categories and topics..."
              value={searchQuery()}
              onInput={e => setSearchQuery(e.target.value)}
              class={styles.searchInput}
            />
          </div>

          <div class={styles.filters}>
            <select
              value={selectedSensitivity()}
              onChange={e => setSelectedSensitivity(e.target.value as any)}
              class={styles.filterSelect}
            >
              <option value="all">All Sensitivity Levels</option>
              <option value="public">🌍 Public</option>
              <option value="educational">📚 Educational</option>
              <option value="community-restricted">🏘️ Community</option>
              <option value="guardian-approval">👥 Guardian</option>
              <option value="sacred-protected">🔒 Sacred</option>
            </select>

            <div class={styles.viewToggle}>
              <Button
                variant={viewMode() === 'grid' ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setViewMode('grid')}
              >
                <Grid size={16} />
              </Button>
              <Button
                variant={viewMode() === 'list' ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

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
          <Users class={styles.statIcon} />
          <div>
            <h3>
              {categories().filter(c => c.sensitivityLevel === 'community-restricted').length}
            </h3>
            <p>Community Categories</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Globe class={styles.statIcon} />
          <div>
            <h3>{categories().filter(c => c.sensitivityLevel === 'public').length}</h3>
            <p>Public Categories</p>
          </div>
        </div>
      </div>

      <Show
        when={!loading()}
        fallback={
          <div class={styles.loading}>
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
                      style={{ 'background-color': getSensitivityColor(category.sensitivityLevel) }}
                    >
                      {category.sensitivityLevel}
                    </div>
                  </div>

                  <div class={styles.cardContent}>
                    <h3 class={styles.categoryTitle}>{category.name}</h3>
                    <p class={styles.categoryDescription}>{category.description}</p>

                    <div class={styles.categoryMeta}>
                      <span class={styles.documentCount}>
                        📄 {category.documentCount.toLocaleString()} documents
                      </span>
                      {category.culturalOrigin && (
                        <span class={styles.culturalOrigin}>📍 {category.culturalOrigin}</span>
                      )}
                    </div>

                    <div class={styles.subcategories}>
                      <h4>Popular Topics:</h4>
                      <div class={styles.subcategoryList}>
                        <For each={category.subcategories.slice(0, 3)}>
                          {sub => (
                            <span class={styles.subcategory}>
                              {sub.name} ({sub.documentCount})
                            </span>
                          )}
                        </For>
                        {category.subcategories.length > 3 && (
                          <span class={styles.subcategoryMore}>
                            +{category.subcategories.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div class={styles.cardActions}>
                    <Button variant="primary" size="small">
                      Explore Category
                    </Button>
                    <Button variant="secondary" size="small">
                      View Subcategories
                    </Button>
                  </div>
                </Card>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default BrowsePage;
