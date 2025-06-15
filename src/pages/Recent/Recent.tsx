import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { Card } from '../../components/foundation/Card';
import { Button } from '../../components/foundation/Button';
import { Input } from '../../components/foundation/Input';
import { Clock, Eye, Download, FileText, Search, Calendar, Filter } from 'lucide-solid';
import type { Document } from '../../types/Document';
import type { CulturalSensitivityLevel } from '../../types/Cultural';
import styles from './Recent.module.css';

interface RecentActivity {
  id: string;
  type: 'view' | 'download' | 'upload' | 'share' | 'favorite';
  document: Document;
  timestamp: Date;
  duration?: number; // in seconds for view activities
  deviceName?: string;
}

const RecentPage: Component = () => {
  const [activities, setActivities] = createSignal<RecentActivity[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedType, setSelectedType] = createSignal<
    'all' | 'view' | 'download' | 'upload' | 'share' | 'favorite'
  >('all');
  const [selectedTimeframe, setSelectedTimeframe] = createSignal<
    'today' | 'week' | 'month' | 'all'
  >('all');
  const [loading, setLoading] = createSignal(true);

  // Mock data for development
  createEffect(() => {
    setTimeout(() => {
      setActivities([
        {
          id: 'act1',
          type: 'view',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          duration: 1200, // 20 minutes
          deviceName: 'Desktop',
          document: {
            id: 'doc1',
            title: 'Traditional Weaving Techniques',
            description: 'Ancient textile creation methods from indigenous communities',
            format: 'pdf' as any,
            contentType: 'cultural' as any,
            status: 'active' as any,
            filePath: '/documents/weaving.pdf',
            originalFilename: 'weaving.pdf',
            fileSize: 3200000,
            fileHash: 'hash1',
            mimeType: 'application/pdf',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            createdBy: 'user1',
            version: 1,
            culturalMetadata: {
              sensitivityLevel: 'educational' as CulturalSensitivityLevel,
              culturalOrigin: 'Andean Communities',
            } as any,
            tags: ['weaving', 'textile', 'traditional-craft'],
            categories: ['Crafts'],
            language: 'en',
            authors: [],
            accessHistory: [],
            relationships: [],
            securityValidation: {} as any,
            contentVerification: {} as any,
            sourceAttribution: {} as any,
          },
        },
        {
          id: 'act2',
          type: 'download',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          deviceName: 'Mobile',
          document: {
            id: 'doc2',
            title: 'Solar Panel Installation Guide',
            description: 'Comprehensive guide for renewable energy systems',
            filePath: '/documents/solar-guide.pdf',
            fileSize: 4500000,
            mimeType: 'application/pdf',
            uploadDate: new Date('2024-01-20'),
            lastAccessed: new Date(Date.now() - 5 * 60 * 60 * 1000),
            tags: ['solar', 'renewable-energy', 'technical'],
            culturalSensitivity: 'public' as CulturalSensitivityLevel,
            culturalOrigin: 'Global Community',
          },
        },
        {
          id: 'act3',
          type: 'favorite',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          deviceName: 'Desktop',
          document: {
            id: 'doc3',
            title: 'Sacred Plant Ceremonies',
            description: 'Spiritual practices and traditional plant use',
            filePath: '/documents/plant-ceremonies.pdf',
            fileSize: 2100000,
            mimeType: 'application/pdf',
            uploadDate: new Date('2024-01-18'),
            lastAccessed: new Date(Date.now() - 24 * 60 * 60 * 1000),
            tags: ['ceremony', 'plants', 'spiritual'],
            culturalSensitivity: 'community-restricted' as CulturalSensitivityLevel,
            culturalOrigin: 'Indigenous Communities',
          },
        },
        {
          id: 'act4',
          type: 'upload',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          deviceName: 'Desktop',
          document: {
            id: 'doc4',
            title: 'Community Garden Planning',
            description: 'Urban agriculture and food sovereignty practices',
            filePath: '/documents/garden-planning.pdf',
            fileSize: 1800000,
            mimeType: 'application/pdf',
            uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            lastAccessed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            tags: ['gardening', 'community', 'food-sovereignty'],
            culturalSensitivity: 'public' as CulturalSensitivityLevel,
            culturalOrigin: 'Community Initiative',
          },
        },
      ]);
      setLoading(false);
    }, 1000);
  });

  const filteredActivities = () => {
    return activities().filter(activity => {
      const matchesSearch =
        activity.document.title.toLowerCase().includes(searchQuery().toLowerCase()) ||
        activity.document.description.toLowerCase().includes(searchQuery().toLowerCase()) ||
        activity.document.tags.some(tag => tag.toLowerCase().includes(searchQuery().toLowerCase()));

      const matchesType = selectedType() === 'all' || activity.type === selectedType();

      const now = new Date();
      const activityDate = activity.timestamp;
      let matchesTimeframe = true;

      if (selectedTimeframe() === 'today') {
        matchesTimeframe = activityDate.toDateString() === now.toDateString();
      } else if (selectedTimeframe() === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesTimeframe = activityDate >= weekAgo;
      } else if (selectedTimeframe() === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesTimeframe = activityDate >= monthAgo;
      }

      return matchesSearch && matchesType && matchesTimeframe;
    });
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'view':
        return Eye;
      case 'download':
        return Download;
      case 'upload':
        return FileText;
      case 'share':
        return Download; // Reusing download icon for now
      case 'favorite':
        return Clock;
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'view':
        return '#3498db';
      case 'download':
        return '#27ae60';
      case 'upload':
        return '#e67e22';
      case 'share':
        return '#9b59b6';
      case 'favorite':
        return '#e74c3c';
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

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      return `${days} days ago`;
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div class={styles.recentPage}>
      <div class={styles.header}>
        <div class={styles.titleSection}>
          <h1>
            <Clock class={styles.headerIcon} />
            Recent Activity
          </h1>
          <p>Your recent document interactions and activities</p>
        </div>

        <div class={styles.controls}>
          <div class={styles.searchContainer}>
            <Search class={styles.searchIcon} />
            <Input
              type="search"
              placeholder="Search recent activities..."
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
              <option value="all">All Activities</option>
              <option value="view">👁️ Views</option>
              <option value="download">⬇️ Downloads</option>
              <option value="upload">⬆️ Uploads</option>
              <option value="share">🔄 Shares</option>
              <option value="favorite">❤️ Favorites</option>
            </select>

            <select
              value={selectedTimeframe()}
              onChange={e => setSelectedTimeframe(e.target.value as any)}
              class={styles.filterSelect}
            >
              <option value="all">All Time</option>
              <option value="today">📅 Today</option>
              <option value="week">📆 This Week</option>
              <option value="month">🗓️ This Month</option>
            </select>
          </div>
        </div>
      </div>

      <div class={styles.stats}>
        <div class={styles.statCard}>
          <Eye class={styles.statIcon} />
          <div>
            <h3>{activities().filter(a => a.type === 'view').length}</h3>
            <p>Documents Viewed</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Download class={styles.statIcon} />
          <div>
            <h3>{activities().filter(a => a.type === 'download').length}</h3>
            <p>Downloads</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <FileText class={styles.statIcon} />
          <div>
            <h3>{activities().filter(a => a.type === 'upload').length}</h3>
            <p>Uploads</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Filter class={styles.statIcon} />
          <div>
            <h3>{filteredActivities().length}</h3>
            <p>Filtered Results</p>
          </div>
        </div>
      </div>

      <Show
        when={!loading()}
        fallback={
          <div class={styles.loading}>
            <div class={styles.spinner}></div>
            <p>Loading recent activities...</p>
          </div>
        }
      >
        <Show
          when={filteredActivities().length > 0}
          fallback={
            <div class={styles.emptyState}>
              <Clock class={styles.emptyIcon} />
              <h3>No recent activities found</h3>
              <p>
                {searchQuery() || selectedType() !== 'all' || selectedTimeframe() !== 'all'
                  ? 'Try adjusting your filters to see more activities.'
                  : 'Start exploring documents to see your activity history here!'}
              </p>
              <Button variant="primary" onClick={() => (window.location.href = '/documents')}>
                Explore Documents
              </Button>
            </div>
          }
        >
          <div class={styles.activitiesList}>
            <For each={filteredActivities()}>
              {activity => {
                const IconComponent = getActivityIcon(activity.type);
                return (
                  <Card class={styles.activityCard}>
                    <div class={styles.activityHeader}>
                      <div class={styles.activityType}>
                        <IconComponent
                          class={styles.activityIcon}
                          style={{ color: getActivityColor(activity.type) }}
                        />
                        <div class={styles.activityInfo}>
                          <span class={styles.activityTitle}>
                            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                          </span>
                          <span class={styles.activityTime}>
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div
                        class={styles.sensitivityBadge}
                        style={{
                          'background-color': getSensitivityColor(
                            activity.document.culturalSensitivity
                          ),
                        }}
                      >
                        {activity.document.culturalSensitivity}
                      </div>
                    </div>

                    <div class={styles.documentInfo}>
                      <h3 class={styles.documentTitle}>{activity.document.title}</h3>
                      <p class={styles.documentDescription}>{activity.document.description}</p>

                      <div class={styles.documentMeta}>
                        <span class={styles.culturalOrigin}>
                          📍 {activity.document.culturalOrigin}
                        </span>
                        <span class={styles.fileSize}>
                          {formatFileSize(activity.document.fileSize)}
                        </span>
                        {activity.duration && (
                          <span class={styles.duration}>
                            ⏱️ {formatDuration(activity.duration)}
                          </span>
                        )}
                        {activity.deviceName && (
                          <span class={styles.device}>💻 {activity.deviceName}</span>
                        )}
                      </div>

                      <div class={styles.tags}>
                        <For each={activity.document.tags.slice(0, 3)}>
                          {tag => <span class={styles.tag}>#{tag}</span>}
                        </For>
                        {activity.document.tags.length > 3 && (
                          <span class={styles.tagMore}>+{activity.document.tags.length - 3}</span>
                        )}
                      </div>
                    </div>

                    <div class={styles.activityActions}>
                      <Button variant="primary" size="small">
                        Open Document
                      </Button>
                      <Button variant="secondary" size="small">
                        View Details
                      </Button>
                      <Button variant="ghost" size="small">
                        Remove from History
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
