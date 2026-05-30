import { type Component, createSignal, onMount, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Card } from '../../components/foundation/Card';
import { Button } from '../../components/foundation/Button';
import { Input } from '../../components/foundation/Input';
import { Heart, BookOpen, Filter, Search, Grid, List, FileText } from 'lucide-solid';
import styles from './Favorites.module.css';
import { favoriteService, type FavoriteDocument } from '@/services/favoriteService';
import { documentService } from '@/services/documentService';
import { useTranslation } from '@/i18n/hooks';
import { useToast } from '@/hooks/ui/useToast';

const FavoritesPage: Component = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation('pages');

  const [favorites, setFavorites] = createSignal<FavoriteDocument[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [loading, setLoading] = createSignal(true);
  const [removingId, setRemovingId] = createSignal<string | null>(null);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const items = await favoriteService.loadFavoriteDocuments();
      setFavorites(items);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    void loadFavorites();
  });

  const filteredFavorites = () => {
    const query = searchQuery().trim().toLowerCase();
    if (!query) return favorites();
    return favorites().filter(item => {
      const title = item.resolved?.title?.toLowerCase() ?? '';
      const id = item.id.toLowerCase();
      return title.includes(query) || id.includes(query);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openDocument = (item: FavoriteDocument) => {
    const doc = item.resolved;
    if (!doc) return;
    if (doc.source === 'local') {
      documentService.openInReader(navigate, doc);
      return;
    }
    navigate(`/document/${encodeURIComponent(item.id)}`);
  };

  const viewDetails = (item: FavoriteDocument) => {
    navigate(`/document/${encodeURIComponent(item.id)}`);
  };

  const removeFavorite = async (item: FavoriteDocument) => {
    setRemovingId(item.id);
    try {
      const result = await favoriteService.toggleFavorite(item.id);
      if (result.success && !result.isFavorite) {
        setFavorites(prev => prev.filter(f => f.id !== item.id));
        toast.success(t('favorites.toasts.removed'));
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t('favorites.toasts.removeFailed'));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div class={styles.favoritesPage}>
      <div class={styles.header}>
        <div class={styles.titleSection}>
          <h1>
            <Heart class={styles.headerIcon} />
            {t('favorites.title')}
          </h1>
          <p>{t('favorites.subtitle')}</p>
        </div>

        <div class={styles.controls}>
          <div class={styles.searchContainer}>
            <Search class={styles.searchIcon || ''} />
            <Input
              type="search"
              placeholder={t('favorites.searchPlaceholder')}
              value={searchQuery()}
              onInput={setSearchQuery}
              class={styles.searchInput || ''}
            />
          </div>

          <div class={styles.filters}>
            <div class={styles.viewToggle}>
              <Button
                variant={viewMode() === 'grid' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('grid')}
                class={viewMode() === 'grid' ? styles.activeView || '' : ''}
              >
                <Grid size={16} />
              </Button>
              <Button
                variant={viewMode() === 'list' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('list')}
                class={viewMode() === 'list' ? styles.activeView || '' : ''}
              >
                <List size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div class={styles.stats}>
        <div class={styles.statCard}>
          <Heart class={styles.statIcon} />
          <div>
            <h3>{favorites().length}</h3>
            <p>{t('favorites.statsTotal')}</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Filter class={styles.statIcon} />
          <div>
            <h3>{filteredFavorites().length}</h3>
            <p>{t('favorites.statsFiltered')}</p>
          </div>
        </div>
      </div>

      <Show
        when={!loading()}
        fallback={
          <div class={styles.loading}>
            <div class={styles.spinner} />
            <p>{t('favorites.loading')}</p>
          </div>
        }
      >
        <Show
          when={filteredFavorites().length > 0}
          fallback={
            <div class={styles.emptyState}>
              <Heart class={styles.emptyIcon} />
              <h3>{t('favorites.emptyTitle')}</h3>
              <p>{searchQuery() ? t('favorites.emptyFiltered') : t('favorites.emptyDefault')}</p>
              <Button variant="primary" onClick={() => navigate('/documents')}>
                {t('favorites.exploreDocuments')}
              </Button>
            </div>
          }
        >
          <div class={styles[`favoritesGrid${viewMode() === 'grid' ? 'Grid' : 'List'}`]}>
            <For each={filteredFavorites()}>
              {favorite => (
                <Card class={styles.favoriteCard || ''}>
                  <div class={styles.cardHeader || ''}>
                    <div class={styles.favoriteType || ''}>
                      <Show
                        when={favorite.resolved}
                        fallback={<FileText class={styles.favoriteIcon || ''} />}
                      >
                        <BookOpen class={styles.favoriteIcon || ''} />
                      </Show>
                      <span class={styles.favoriteDate || ''}>
                        {formatDate(favorite.favoriteDate)}
                      </span>
                    </div>
                    <Show when={favorite.resolved}>
                      <div class={styles.sensitivityBadge || ''}>
                        {favorite.resolved!.source === 'local'
                          ? t('favorites.sourceLocal')
                          : t('favorites.sourceNetwork')}
                      </div>
                    </Show>
                  </div>

                  <div class={styles.cardContent || ''}>
                    <Show
                      when={favorite.resolved}
                      fallback={
                        <>
                          <h3 class={styles.documentTitle || ''}>
                            {t('favorites.unavailableTitle')}
                          </h3>
                          <p class={styles.documentDescription || ''}>
                            {t('favorites.unavailableDescription')}
                          </p>
                        </>
                      }
                    >
                      <h3 class={styles.documentTitle || ''}>{favorite.resolved!.title}</h3>
                      <div class={styles.documentMeta}>
                        <span class={styles.fileSize}>
                          {formatFileSize(favorite.resolved!.fileSize)}
                        </span>
                        <span class={styles.fileSize}>
                          {favorite.resolved!.format.toUpperCase()}
                        </span>
                      </div>
                    </Show>
                  </div>

                  <div class={styles.cardActions}>
                    <Show when={favorite.resolved}>
                      <Button variant="primary" size="sm" onClick={() => openDocument(favorite)}>
                        {t('favorites.actions.open')}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => viewDetails(favorite)}>
                        {t('favorites.actions.viewDetails')}
                      </Button>
                    </Show>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={removingId() === favorite.id}
                      onClick={() => void removeFavorite(favorite)}
                    >
                      {t('favorites.actions.remove')}
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

export default FavoritesPage;
