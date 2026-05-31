import { type Component, createSignal, createEffect, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Card } from '../../components/foundation/Card';
import { Button } from '../../components/foundation/Button';
import { Input } from '../../components/foundation/Input';
import {
  Eye,
  Download,
  Search,
  Calendar,
  Filter,
  Upload,
  Share2,
  Heart,
  History,
} from 'lucide-solid';
import styles from './Recent.module.css';
import { CustomDropdown, type DropdownOption } from './CustomDropdown';
import {
  activityService,
  type ActivityDocument,
  type ActivityKind,
  type ActivityTimeframe,
} from '@/services/activityService';
import { documentService } from '@/services/documentService';
import { useTranslation } from '@/i18n/hooks';
import { useToast } from '@/hooks/ui/useToast';

const RecentPage: Component = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation('pages');

  const [activities, setActivities] = createSignal<ActivityDocument[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedType, setSelectedType] = createSignal<ActivityKind | 'all'>('all');
  const [selectedTimeframe, setSelectedTimeframe] = createSignal<ActivityTimeframe>('all');
  const [loading, setLoading] = createSignal(true);
  const [removingId, setRemovingId] = createSignal<number | null>(null);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const since = activityService.sinceFromTimeframe(selectedTimeframe());
      const kind = selectedType() === 'all' ? undefined : selectedType();
      const items = await activityService.loadActivityDocuments({
        kind,
        since,
        limit: 500,
      });
      setActivities(items);
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    selectedType();
    selectedTimeframe();
    void loadActivities();
  });

  const filteredActivities = () => {
    const query = searchQuery().trim().toLowerCase();
    if (!query) return activities();
    return activities().filter(item => item.title.toLowerCase().includes(query));
  };

  const getActivityIcon = (type: ActivityKind) => {
    switch (type) {
      case 'view':
        return Eye;
      case 'download':
        return Download;
      case 'upload':
        return Upload;
      case 'share':
        return Share2;
      case 'favorite':
        return Heart;
      default:
        return History;
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const activityTypeOptions: DropdownOption[] = [
    { value: 'all', label: t('recent.filters.allTypes'), icon: <Filter size={18} /> },
    { value: 'view', label: t('recent.filters.views'), icon: <Eye size={18} color="#3498db" /> },
    {
      value: 'download',
      label: t('recent.filters.downloads'),
      icon: <Download size={18} color="#27ae60" />,
    },
    {
      value: 'upload',
      label: t('recent.filters.uploads'),
      icon: <Upload size={18} color="#f39c12" />,
    },
    {
      value: 'share',
      label: t('recent.filters.shares'),
      icon: <Share2 size={18} color="#9b59b6" />,
    },
    {
      value: 'favorite',
      label: t('recent.filters.favorites'),
      icon: <Heart size={18} color="#e74c3c" />,
    },
  ];

  const timeFrameOptions: DropdownOption[] = [
    { value: 'all', label: t('recent.timeframes.all'), icon: <Calendar size={18} /> },
    { value: 'today', label: t('recent.timeframes.today'), icon: <Calendar size={18} /> },
    { value: 'week', label: t('recent.timeframes.week'), icon: <Calendar size={18} /> },
    { value: 'month', label: t('recent.timeframes.month'), icon: <Calendar size={18} /> },
  ];

  const openDocument = (item: ActivityDocument) => {
    const doc = item.resolved;
    const id = item.entry.documentId;
    if (!id || !doc) return;
    documentService.openInReader(navigate, {
      id,
      filePath: doc.filePath,
      format: doc.format,
      title: doc.title,
    });
  };

  const removeFromHistory = async (item: ActivityDocument) => {
    setRemovingId(item.entry.id);
    try {
      await activityService.deleteActivity(item.entry.id);
      setActivities(prev => prev.filter(a => a.entry.id !== item.entry.id));
      toast.success(t('recent.toasts.removed'));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t('recent.toasts.removeFailed'));
    } finally {
      setRemovingId(null);
    }
  };

  const kindLabel = (kind: ActivityKind) => t(`recent.kinds.${kind}`);

  return (
    <div class={styles.recentPage}>
      <div class={styles.header}>
        <div class={styles.titleSection}>
          <h1>
            <History class={styles.headerIcon || ''} />
            {t('recent.title')}
          </h1>
          <p>{t('recent.subtitle')}</p>
        </div>

        <div class={styles.controls}>
          <div class={styles.searchContainer}>
            <Search class={styles.searchIcon || ''} />
            <Input
              type="search"
              placeholder={t('recent.searchPlaceholder')}
              value={searchQuery()}
              onInput={setSearchQuery}
              class={styles.searchInput || ''}
            />
          </div>

          <div class={styles.filters}>
            <CustomDropdown
              options={activityTypeOptions}
              value={selectedType()}
              onChange={v => setSelectedType(v as ActivityKind | 'all')}
              ariaLabel={t('recent.filters.typeAria')}
            />
            <CustomDropdown
              options={timeFrameOptions}
              value={selectedTimeframe()}
              onChange={v => setSelectedTimeframe(v as ActivityTimeframe)}
              ariaLabel={t('recent.filters.timeAria')}
            />
          </div>
        </div>
      </div>

      <div class={styles.stats}>
        <div class={styles.statCard}>
          <Eye class={styles.statIcon || ''} />
          <div>
            <h3>{activities().filter(a => a.entry.kind === 'view').length}</h3>
            <p>{t('recent.stats.views')}</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Download class={styles.statIcon || ''} />
          <div>
            <h3>{activities().filter(a => a.entry.kind === 'download').length}</h3>
            <p>{t('recent.stats.downloads')}</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Upload class={styles.statIcon || ''} />
          <div>
            <h3>{activities().filter(a => a.entry.kind === 'upload').length}</h3>
            <p>{t('recent.stats.uploads')}</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Filter class={styles.statIcon || ''} />
          <div>
            <h3>{filteredActivities().length}</h3>
            <p>{t('recent.stats.filtered')}</p>
          </div>
        </div>
      </div>

      <Show
        when={!loading()}
        fallback={
          <div class={styles.loading}>
            <div class={styles.spinner} />
            <p>{t('recent.loading')}</p>
          </div>
        }
      >
        <Show
          when={filteredActivities().length > 0}
          fallback={
            <div class={styles.emptyState}>
              <History class={styles.emptyIcon || ''} />
              <h3>{t('recent.emptyTitle')}</h3>
              <p>
                {searchQuery() || selectedType() !== 'all' || selectedTimeframe() !== 'all'
                  ? t('recent.emptyFiltered')
                  : t('recent.emptyDefault')}
              </p>
              <Button variant="primary" onClick={() => navigate('/documents')}>
                {t('recent.exploreDocuments')}
              </Button>
            </div>
          }
        >
          <div class={styles.activitiesList}>
            <For each={filteredActivities()}>
              {activity => {
                const IconComponent = getActivityIcon(activity.entry.kind);
                const timestamp = new Date(activity.entry.createdAt);
                return (
                  <Card class={styles.activityCard || ''}>
                    <div class={styles.activityHeader}>
                      <div class={styles.activityType}>
                        <div class={styles.activityIcon}>
                          <IconComponent size={20} />
                        </div>
                        <div class={styles.activityInfo}>
                          <span class={styles.activityTitle}>{kindLabel(activity.entry.kind)}</span>
                          <span class={styles.activityTime}>{formatTimeAgo(timestamp)}</span>
                        </div>
                      </div>
                      <Show when={activity.resolved}>
                        <div class={styles.sensitivityBadge}>
                          {activity.resolved!.source === 'local'
                            ? t('recent.sourceLocal')
                            : t('recent.sourceNetwork')}
                        </div>
                      </Show>
                    </div>

                    <div class={styles.documentInfo}>
                      <h3 class={styles.documentTitle}>{activity.title}</h3>
                      <Show when={activity.resolved}>
                        <div class={styles.documentMeta}>
                          <span class={styles.fileSize}>
                            {formatFileSize(activity.resolved!.fileSize)}
                          </span>
                          <span class={styles.fileSize}>
                            {activity.resolved!.format.toUpperCase()}
                          </span>
                        </div>
                      </Show>
                    </div>

                    <div class={styles.activityActions}>
                      <Show when={activity.resolved && activity.entry.documentId}>
                        <Button variant="primary" size="sm" onClick={() => openDocument(activity)}>
                          {t('recent.actions.open')}
                        </Button>
                      </Show>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removingId() === activity.entry.id}
                        onClick={() => void removeFromHistory(activity)}
                      >
                        {t('recent.actions.remove')}
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

export default RecentPage;
