import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { Card } from '../../components/foundation/Card';
import { Button } from '../../components/foundation/Button';
import { Input } from '../../components/foundation/Input';
import {
  Clock,
  Eye,
  Download,
  FileText,
  Search,
  Calendar,
  Filter,
  Upload,
  Share2,
  Heart,
  ShieldCheck,
  Fingerprint,
  History,
} from 'lucide-solid';
import {
  Document,
  DocumentFormat,
  DocumentContentType,
  DocumentStatus,
} from '../../types/Document';
import { CulturalSensitivityLevel } from '../../types/Cultural';
import styles from './Recent.module.css';
import { CustomDropdown, DropdownOption } from './CustomDropdown';

interface RecentActivity {
  id: string;
  type: 'view' | 'download' | 'upload' | 'share' | 'favorite';
  document: Document;
  timestamp: Date;
  duration?: number; // in seconds for view activities
  deviceName?: string;
}

const mockDocuments: Document[] = [
  {
    id: 'doc1',
    title: 'Traditional Weaving Techniques',
    description: 'Ancient textile creation methods from indigenous communities.',
    format: DocumentFormat.PDF,
    contentType: DocumentContentType.TRADITIONAL_KNOWLEDGE,
    status: DocumentStatus.ACTIVE,
    filePath: '/documents/weaving.pdf',
    originalFilename: 'weaving.pdf',
    fileSize: 3200000,
    fileHash: 'hash1',
    mimeType: 'application/pdf',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    createdBy: 'user1',
    version: 1,
    culturalMetadata: {
      sensitivityLevel: CulturalSensitivityLevel.EDUCATIONAL,
      culturalOrigin: 'Andean Communities',
    },
    tags: ['weaving', 'textile', 'traditional-craft'],
    categories: ['Crafts'],
    language: 'en',
    authors: [{ name: 'Community Elders', role: 'Custodian' }],
    accessHistory: [],
    relationships: [],
    securityValidation: {
      validatedAt: new Date(),
      passed: true,
      issues: [],
      malwareScanResult: {
        clean: true,
        threats: [],
        scanEngine: 'Internal',
        scanDate: new Date(),
      },
      integrityCheck: {
        valid: true,
        expectedHash: 'hash1',
        actualHash: 'hash1',
        algorithm: 'SHA-256',
      },
      legalCompliance: {
        compliant: true,
        issues: [],
        jurisdiction: 'Global',
      },
    },
    contentVerification: {
      signature: 'sig1',
      algorithm: 'ECDSA',
      verifiedAt: new Date(),
      chainOfCustody: [],
      authentic: true,
      verificationProvider: 'CommunitySign',
      publicKey: 'key1',
    },
    sourceAttribution: {
      originalSource: 'Andean Community Archive',
      sourceType: 'community',
      credibilityIndicators: ['Community Verified'],
      sourceVerified: true,
      attributionRequirements: ['Credit community'],
    },
  },
  {
    id: 'doc2',
    title: 'Sacred Plant Ceremonies',
    description: 'Spiritual practices and traditional plant use.',
    format: DocumentFormat.PDF,
    contentType: DocumentContentType.CEREMONIAL,
    status: DocumentStatus.ACTIVE,
    filePath: '/documents/plant-ceremonies.pdf',
    originalFilename: 'plant-ceremonies.pdf',
    fileSize: 2100000,
    fileHash: 'hash3',
    mimeType: 'application/pdf',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date(),
    createdBy: 'user3',
    version: 1,
    culturalMetadata: {
      sensitivityLevel: CulturalSensitivityLevel.COMMUNITY,
      culturalOrigin: 'Indigenous Communities',
    },
    tags: ['ceremony', 'plants', 'spiritual'],
    categories: ['Spirituality'],
    language: 'es',
    authors: [{ name: 'Tribal Council', role: 'Guardian' }],
    accessHistory: [],
    relationships: [],
    securityValidation: {
      validatedAt: new Date(),
      passed: true,
      issues: [],
      malwareScanResult: {
        clean: true,
        threats: [],
        scanEngine: 'Internal',
        scanDate: new Date(),
      },
      integrityCheck: {
        valid: true,
        expectedHash: 'hash3',
        actualHash: 'hash3',
        algorithm: 'SHA-256',
      },
      legalCompliance: {
        compliant: true,
        issues: [],
        jurisdiction: 'Global',
      },
    },
    contentVerification: {
      signature: 'sig3',
      algorithm: 'ECDSA',
      verifiedAt: new Date(),
      chainOfCustody: [],
      authentic: true,
      verificationProvider: 'GuardianSign',
      publicKey: 'key3',
    },
    sourceAttribution: {
      originalSource: 'Sacred Knowledge Keepers',
      sourceType: 'traditional',
      credibilityIndicators: ['Guardian Endorsed'],
      sourceVerified: true,
      attributionRequirements: ['Respectful use only'],
    },
  },
];

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

  createEffect(() => {
    setTimeout(() => {
      setActivities([
        {
          id: 'act1',
          type: 'view',
          timestamp: new Date(Date.now() - 2 * 36e5),
          duration: 1200,
          deviceName: 'Desktop',
          document: mockDocuments[0],
        },
        {
          id: 'act3',
          type: 'favorite',
          timestamp: new Date(Date.now() - 24 * 36e5),
          deviceName: 'Desktop',
          document: mockDocuments[1],
        },
      ]);
      setLoading(false);
    }, 1000);
  });

  const filteredActivities = () => {
    return activities().filter(activity => {
      const doc = activity.document;
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery().toLowerCase()) ||
        (doc.description ?? '').toLowerCase().includes(searchQuery().toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery().toLowerCase()));

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
        return Upload;
      case 'share':
        return Share2;
      case 'favorite':
        return Heart;
      default:
        return History;
    }
  };

  const getSensitivityColor = (level: CulturalSensitivityLevel) => {
    switch (level) {
      case CulturalSensitivityLevel.PUBLIC:
        return 'var(--color-success)';
      case CulturalSensitivityLevel.EDUCATIONAL:
        return 'var(--color-info)';
      case CulturalSensitivityLevel.COMMUNITY:
        return 'var(--color-warning)';
      case CulturalSensitivityLevel.GUARDIAN:
        return 'var(--color-danger)';
      case CulturalSensitivityLevel.SACRED:
        return 'var(--color-sacred)';
      default:
        return 'var(--color-info)';
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

  const activityTypeOptions: DropdownOption[] = [
    { value: 'all', label: 'All Activities', icon: <Filter size={18} /> },
    { value: 'view', label: 'Views', icon: <Eye size={18} color="#3498db" /> },
    { value: 'download', label: 'Downloads', icon: <Download size={18} color="#27ae60" /> },
    { value: 'upload', label: 'Uploads', icon: <Upload size={18} color="#f39c12" /> },
    { value: 'share', label: 'Shares', icon: <Share2 size={18} color="#9b59b6" /> },
    { value: 'favorite', label: 'Favorites', icon: <Heart size={18} color="#e74c3c" /> },
  ];

  const timeFrameOptions: DropdownOption[] = [
    { value: 'all', label: 'All Time', icon: <Calendar size={18} /> },
    { value: 'today', label: 'Today', icon: <Calendar size={18} /> },
    { value: 'week', label: 'This Week', icon: <Calendar size={18} /> },
    { value: 'month', label: 'This Month', icon: <Calendar size={18} /> },
  ];

  return (
    <div class={styles.recentPage}>
      <div class={styles.header}>
        <div class={styles.titleSection}>
          <h1>
            <History class={styles.headerIcon || ''} />
            Recent Activity
          </h1>
          <p>Your recent document interactions and activities</p>
        </div>

        <div class={styles.controls}>
          <div class={styles.searchContainer}>
            <Search class={styles.searchIcon || ''} />
            <Input
              type="search"
              placeholder="Search recent activities..."
              value={searchQuery()}
              onInput={setSearchQuery}
              class={styles.searchInput || ''}
            />
          </div>

          <div class={styles.filters}>
            <CustomDropdown
              options={activityTypeOptions}
              value={selectedType()}
              onChange={setSelectedType as (val: string) => void}
              ariaLabel="Filter by activity type"
            />
            <CustomDropdown
              options={timeFrameOptions}
              value={selectedTimeframe()}
              onChange={setSelectedTimeframe as (val: string) => void}
              ariaLabel="Filter by timeframe"
            />
          </div>
        </div>
      </div>

      <div class={styles.stats}>
        <div class={styles.statCard}>
          <Eye class={styles.statIcon || ''} />
          <div>
            <h3>{activities().filter(a => a.type === 'view').length}</h3>
            <p>Documents Viewed</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Download class={styles.statIcon || ''} />
          <div>
            <h3>{activities().filter(a => a.type === 'download').length}</h3>
            <p>Downloads</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Upload class={styles.statIcon || ''} />
          <div>
            <h3>{activities().filter(a => a.type === 'upload').length}</h3>
            <p>Uploads</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Filter class={styles.statIcon || ''} />
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
              <History class={styles.emptyIcon || ''} />
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
                  <Card class={styles.activityCard || ''}>
                    <div class={styles.activityHeader}>
                      <div class={styles.activityType}>
                        <div class={styles.activityIcon}>
                          <IconComponent size={20} />
                        </div>
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
                            activity.document.culturalMetadata.sensitivityLevel
                          ),
                        }}
                      >
                        {
                          CulturalSensitivityLevel[
                            activity.document.culturalMetadata.sensitivityLevel
                          ]
                        }
                      </div>
                    </div>

                    <div class={styles.documentInfo}>
                      <h3 class={styles.documentTitle}>{activity.document.title}</h3>
                      <p class={styles.documentDescription}>
                        {activity.document.description ?? ''}
                      </p>

                      <div class={styles.documentMeta}>
                        <span class={styles.culturalOrigin}>
                          📍 {activity.document.culturalMetadata.culturalOrigin}
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
                        <For each={(activity.document.tags ?? []).slice(0, 3)}>
                          {tag => <span class={styles.tag}>#{tag}</span>}
                        </For>
                        {(activity.document.tags ?? []).length > 3 && (
                          <span class={styles.tagMore}>
                            +{(activity.document.tags ?? []).length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    <div class={styles.activityActions}>
                      <Button variant="primary" size="sm">
                        Open Document
                      </Button>
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm">
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
