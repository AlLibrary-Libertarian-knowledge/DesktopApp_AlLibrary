import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { Card } from '../../components/foundation/Card';
import { Button } from '../../components/foundation/Button';
import { Input } from '../../components/foundation/Input';
import { Star, Heart, BookOpen, Filter, Search, Grid, List } from 'lucide-solid';
import type { Document } from '../../types/Document';
import { CulturalSensitivityLevel } from '../../types/Cultural';
import styles from './Favorites.module.css';

interface FavoriteItem {
  id: string;
  title: string;
  description?: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  culturalSensitivity: CulturalSensitivityLevel;
  culturalOrigin?: string;
  favoriteDate: Date;
  favoriteType: 'star' | 'bookmark' | 'love';
  collections: string[];
  notes?: string;
}

const FavoritesPage: Component = () => {
  const [favorites, setFavorites] = createSignal<FavoriteItem[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedType, setSelectedType] = createSignal<'all' | 'star' | 'bookmark' | 'love'>('all');
  const [selectedSensitivity, setSelectedSensitivity] = createSignal<
    CulturalSensitivityLevel | 'all'
  >('all');
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [loading, setLoading] = createSignal(true);

  // Mock data for development
  createEffect(() => {
    // Simulate loading favorites
    setTimeout(() => {
      setFavorites([
        {
          id: 'fav1',
          title: 'Indigenous Astronomy Traditions',
          description: 'Traditional astronomical knowledge from Aboriginal Australian communities',
          filePath: '/documents/indigenous-astronomy.pdf',
          fileSize: 2500000,
          mimeType: 'application/pdf',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          tags: ['astronomy', 'indigenous', 'traditional-knowledge'],
          culturalSensitivity: CulturalSensitivityLevel.EDUCATIONAL,
          culturalOrigin: 'Aboriginal Australian',
          favoriteDate: new Date('2024-01-16'),
          favoriteType: 'star',
          collections: ['Scientific Knowledge', 'Cultural Heritage'],
          notes: 'Important for research project',
        },
        {
          id: 'fav2',
          title: 'Medicinal Plants of the Amazon',
          description: 'Traditional healing practices and plant knowledge',
          filePath: '/documents/amazon-medicine.pdf',
          fileSize: 1800000,
          mimeType: 'application/pdf',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-18'),
          tags: ['medicine', 'plants', 'amazon', 'healing'],
          culturalSensitivity: CulturalSensitivityLevel.COMMUNITY,
          culturalOrigin: 'Amazonian Indigenous',
          favoriteDate: new Date('2024-01-12'),
          favoriteType: 'love',
          collections: ['Medicine', 'Botanical Studies'],
          notes: 'Community approved for educational use',
        },
        {
          id: 'fav3',
          title: 'Open Source Software Design Patterns',
          description: 'Modern software architecture and design principles',
          filePath: '/documents/design-patterns.pdf',
          fileSize: 3200000,
          mimeType: 'application/pdf',
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-21'),
          tags: ['software', 'programming', 'design-patterns'],
          culturalSensitivity: CulturalSensitivityLevel.PUBLIC,
          culturalOrigin: 'Global Tech Community',
          favoriteDate: new Date('2024-01-21'),
          favoriteType: 'bookmark',
          collections: ['Programming'],
          notes: 'Reference for current project',
        },
      ]);
      setLoading(false);
    }, 1000);
  });

  const filteredFavorites = () => {
    return favorites().filter(item => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery().toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery().toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery().toLowerCase()));

      const matchesType = selectedType() === 'all' || item.favoriteType === selectedType();
      const matchesSensitivity =
        selectedSensitivity() === 'all' || item.culturalSensitivity === selectedSensitivity();

      return matchesSearch && matchesType && matchesSensitivity;
    });
  };

  const getFavoriteIcon = (type: 'star' | 'bookmark' | 'love') => {
    switch (type) {
      case 'star':
        return Star;
      case 'bookmark':
        return BookOpen;
      case 'love':
        return Heart;
    }
  };

  const getSensitivityColor = (level: CulturalSensitivityLevel) => {
    switch (level) {
      case 'public':
        return 'var(--color-success)';
      case 'educational':
        return 'var(--color-info)';
      case 'community-restricted':
        return 'var(--color-warning)';
      case 'guardian-approval':
        return 'var(--color-danger)';
      case 'sacred-protected':
        return 'var(--color-sacred)';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div class={styles.favoritesPage}>
      <div class={styles.header}>
        <div class={styles.titleSection}>
          <h1>
            <Heart class={styles.headerIcon} />
            My Favorites
          </h1>
          <p>Documents you've starred, bookmarked, and loved</p>
        </div>

        <div class={styles.controls}>
          <div class={styles.searchContainer}>
            <Search class={styles.searchIcon} />
            <Input
              type="search"
              placeholder="Search your favorites..."
              value={searchQuery()}
              onInput={e => setSearchQuery(e.target.value)}
              class={styles.searchInput}
            />
          </div>

          <div class={styles.filters}>
            <select
              value={selectedType()}
              onChange={e => setSelectedType(e.target.value as any)}
              class={styles.filterSelect}
            >
              <option value="all">All Types</option>
              <option value="star">⭐ Starred</option>
              <option value="bookmark">📖 Bookmarked</option>
              <option value="love">❤️ Loved</option>
            </select>

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
          <Star class={styles.statIcon} />
          <div>
            <h3>{favorites().filter(f => f.favoriteType === 'star').length}</h3>
            <p>Starred</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <BookOpen class={styles.statIcon} />
          <div>
            <h3>{favorites().filter(f => f.favoriteType === 'bookmark').length}</h3>
            <p>Bookmarked</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Heart class={styles.statIcon} />
          <div>
            <h3>{favorites().filter(f => f.favoriteType === 'love').length}</h3>
            <p>Loved</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Filter class={styles.statIcon} />
          <div>
            <h3>{filteredFavorites().length}</h3>
            <p>Filtered</p>
          </div>
        </div>
      </div>

      <Show
        when={!loading()}
        fallback={
          <div class={styles.loading}>
            <div class={styles.spinner}></div>
            <p>Loading your favorites...</p>
          </div>
        }
      >
        <Show
          when={filteredFavorites().length > 0}
          fallback={
            <div class={styles.emptyState}>
              <Heart class={styles.emptyIcon} />
              <h3>No favorites found</h3>
              <p>
                {searchQuery() || selectedType() !== 'all' || selectedSensitivity() !== 'all'
                  ? 'Try adjusting your filters to find more favorites.'
                  : 'Start exploring documents and add your first favorites!'}
              </p>
              <Button variant="primary" onClick={() => (window.location.href = '/documents')}>
                Explore Documents
              </Button>
            </div>
          }
        >
          <div class={styles[`favoritesGrid${viewMode() === 'grid' ? 'Grid' : 'List'}`]}>
            <For each={filteredFavorites()}>
              {favorite => {
                const IconComponent = getFavoriteIcon(favorite.favoriteType);
                return (
                  <Card class={styles.favoriteCard}>
                    <div class={styles.cardHeader}>
                      <div class={styles.favoriteType}>
                        <IconComponent
                          class={styles.favoriteIcon}
                          style={{
                            color:
                              favorite.favoriteType === 'love'
                                ? '#e74c3c'
                                : favorite.favoriteType === 'star'
                                  ? '#f39c12'
                                  : '#3498db',
                          }}
                        />
                        <span class={styles.favoriteDate}>{formatDate(favorite.favoriteDate)}</span>
                      </div>
                      <div
                        class={styles.sensitivityBadge}
                        style={{
                          'background-color': getSensitivityColor(favorite.culturalSensitivity),
                        }}
                      >
                        {favorite.culturalSensitivity}
                      </div>
                    </div>

                    <div class={styles.cardContent}>
                      <h3 class={styles.documentTitle}>{favorite.title}</h3>
                      <p class={styles.documentDescription}>{favorite.description}</p>

                      <div class={styles.documentMeta}>
                        <span class={styles.culturalOrigin}>📍 {favorite.culturalOrigin}</span>
                        <span class={styles.fileSize}>{formatFileSize(favorite.fileSize)}</span>
                      </div>

                      <div class={styles.tags}>
                        <For each={favorite.tags.slice(0, 3)}>
                          {tag => <span class={styles.tag}>#{tag}</span>}
                        </For>
                        {favorite.tags.length > 3 && (
                          <span class={styles.tagMore}>+{favorite.tags.length - 3}</span>
                        )}
                      </div>

                      <Show when={favorite.notes}>
                        <div class={styles.notes}>
                          <strong>Notes:</strong> {favorite.notes}
                        </div>
                      </Show>

                      <div class={styles.collections}>
                        <strong>Collections:</strong>
                        <For each={favorite.collections}>
                          {collection => <span class={styles.collection}>{collection}</span>}
                        </For>
                      </div>
                    </div>

                    <div class={styles.cardActions}>
                      <Button variant="primary" size="small">
                        Open Document
                      </Button>
                      <Button variant="secondary" size="small">
                        View Details
                      </Button>
                      <Button variant="ghost" size="small">
                        Remove
                      </Button>
                    </div>
                  </Card>
                );
              }}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default FavoritesPage;
