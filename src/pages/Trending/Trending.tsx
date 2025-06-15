import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { Card } from '../../components/foundation/Card';
import { Button } from '../../components/foundation/Button';
import { Input } from '../../components/foundation/Input';
import { TrendingUp, Eye, Download, Heart, Search, Filter, Calendar } from 'lucide-solid';
import type { Document } from '../../types/Document';
import type { CulturalSensitivityLevel } from '../../types/Cultural';
import styles from './Trending.module.css';

interface TrendingDocument {
  document: Document;
  trendingScore: number;
  trendingReason: 'views' | 'downloads' | 'shares' | 'community-interest' | 'cultural-significance';
  stats: {
    views: number;
    downloads: number;
    shares: number;
    favorites: number;
  };
  trendingPeriod: 'hour' | 'day' | 'week' | 'month';
  communityEndorsements: number;
  culturalImportance: 'low' | 'medium' | 'high' | 'critical';
}

const TrendingPage: Component = () => {
  const [trendingDocs, setTrendingDocs] = createSignal<TrendingDocument[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedPeriod, setSelectedPeriod] = createSignal<'hour' | 'day' | 'week' | 'month'>(
    'day'
  );
  const [selectedReason, setSelectedReason] = createSignal<
    'all' | TrendingDocument['trendingReason']
  >('all');
  const [selectedSensitivity, setSelectedSensitivity] = createSignal<
    CulturalSensitivityLevel | 'all'
  >('all');
  const [loading, setLoading] = createSignal(true);

  // Mock data for development
  createEffect(() => {
    setTimeout(() => {
      setTrendingDocs([
        {
          trendingScore: 98,
          trendingReason: 'community-interest',
          trendingPeriod: 'day',
          communityEndorsements: 45,
          culturalImportance: 'high',
          stats: {
            views: 1247,
            downloads: 389,
            shares: 156,
            favorites: 203,
          },
          document: {
            id: 'trend1',
            title: 'Climate Change Adaptation Strategies',
            description: 'Indigenous knowledge for environmental resilience and adaptation',
            format: 'pdf' as any,
            contentType: 'cultural' as any,
            status: 'active' as any,
            filePath: '/documents/climate-adaptation.pdf',
            originalFilename: 'climate-adaptation.pdf',
            fileSize: 4500000,
            fileHash: 'hash1',
            mimeType: 'application/pdf',
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-01-21'),
            createdBy: 'community1',
            version: 1,
            culturalMetadata: {
              sensitivityLevel: 'educational' as CulturalSensitivityLevel,
              culturalOrigin: 'Pacific Island Communities',
            } as any,
            tags: ['climate', 'adaptation', 'indigenous-knowledge'],
            categories: ['Environment'],
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
          trendingScore: 87,
          trendingReason: 'downloads',
          trendingPeriod: 'week',
          communityEndorsements: 23,
          culturalImportance: 'medium',
          stats: {
            views: 892,
            downloads: 567,
            shares: 89,
            favorites: 134,
          },
          document: {
            id: 'trend2',
            title: 'Open Source Quantum Computing',
            description: 'Collaborative research on quantum algorithms and implementations',
            format: 'pdf' as any,
            contentType: 'technical' as any,
            status: 'active' as any,
            filePath: '/documents/quantum-computing.pdf',
            originalFilename: 'quantum-computing.pdf',
            fileSize: 6200000,
            fileHash: 'hash2',
            mimeType: 'application/pdf',
            createdAt: new Date('2024-01-18'),
            updatedAt: new Date('2024-01-19'),
            createdBy: 'researcher1',
            version: 2,
            culturalMetadata: {
              sensitivityLevel: 'public' as CulturalSensitivityLevel,
              culturalOrigin: 'Global Research Community',
            } as any,
            tags: ['quantum', 'computing', 'open-source'],
            categories: ['Technology'],
            language: 'en',
            authors: [],
            accessHistory: [],
            relationships: [],
            securityValidation: {} as any,
            contentVerification: {} as any,
            sourceAttribution: {} as any,
          },
        },
      ]);
      setLoading(false);
    }, 1000);
  });

  const filteredTrendingDocs = () => {
    return trendingDocs().filter(item => {
      const matchesSearch =
        item.document.title.toLowerCase().includes(searchQuery().toLowerCase()) ||
        (item.document.description &&
          item.document.description.toLowerCase().includes(searchQuery().toLowerCase())) ||
        item.document.tags.some(tag => tag.toLowerCase().includes(searchQuery().toLowerCase()));

      const matchesPeriod = item.trendingPeriod === selectedPeriod();
      const matchesReason = selectedReason() === 'all' || item.trendingReason === selectedReason();
      const matchesSensitivity =
        selectedSensitivity() === 'all' ||
        item.document.culturalMetadata.sensitivityLevel === selectedSensitivity();

      return matchesSearch && matchesPeriod && matchesReason && matchesSensitivity;
    });
  };

  const getTrendingIcon = (reason: TrendingDocument['trendingReason']) => {
    switch (reason) {
      case 'views':
        return Eye;
      case 'downloads':
        return Download;
      case 'shares':
        return TrendingUp;
      case 'community-interest':
        return Heart;
      case 'cultural-significance':
        return Heart;
    }
  };

  const getTrendingColor = (reason: TrendingDocument['trendingReason']) => {
    switch (reason) {
      case 'views':
        return '#3498db';
      case 'downloads':
        return '#27ae60';
      case 'shares':
        return '#9b59b6';
      case 'community-interest':
        return '#e74c3c';
      case 'cultural-significance':
        return '#f39c12';
    }
  };

  const getImportanceColor = (importance: TrendingDocument['culturalImportance']) => {
    switch (importance) {
      case 'low':
        return '#95a5a6';
      case 'medium':
        return '#f39c12';
      case 'high':
        return '#e67e22';
      case 'critical':
        return '#e74c3c';
    }
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div class={styles.trendingPage}>
      <div class={styles.header}>
        <div class={styles.titleSection}>
          <h1>
            <TrendingUp class={styles.headerIcon} />
            Trending Now
          </h1>
          <p>Popular and culturally significant documents in the community</p>
        </div>

        <div class={styles.controls}>
          <div class={styles.searchContainer}>
            <Search class={styles.searchIcon} />
            <Input
              type="search"
              placeholder="Search trending documents..."
              value={searchQuery()}
              onInput={e => setSearchQuery(e.target.value)}
              class={styles.searchInput}
            />
          </div>

          <div class={styles.filters}>
            <select
              value={selectedPeriod()}
              onChange={e => setSelectedPeriod(e.target.value as any)}
              class={styles.filterSelect}
            >
              <option value="hour">⏰ Last Hour</option>
              <option value="day">📅 Today</option>
              <option value="week">📆 This Week</option>
              <option value="month">🗓️ This Month</option>
            </select>

            <select
              value={selectedReason()}
              onChange={e => setSelectedReason(e.target.value as any)}
              class={styles.filterSelect}
            >
              <option value="all">All Trending Reasons</option>
              <option value="views">👁️ Most Viewed</option>
              <option value="downloads">⬇️ Most Downloaded</option>
              <option value="shares">🔄 Most Shared</option>
              <option value="community-interest">❤️ Community Interest</option>
              <option value="cultural-significance">🌟 Cultural Significance</option>
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
          </div>
        </div>
      </div>

      <div class={styles.stats}>
        <div class={styles.statCard}>
          <TrendingUp class={styles.statIcon} />
          <div>
            <h3>{filteredTrendingDocs().length}</h3>
            <p>Trending Documents</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Eye class={styles.statIcon} />
          <div>
            <h3>
              {filteredTrendingDocs()
                .reduce((sum, doc) => sum + doc.stats.views, 0)
                .toLocaleString()}
            </h3>
            <p>Total Views</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Download class={styles.statIcon} />
          <div>
            <h3>
              {filteredTrendingDocs()
                .reduce((sum, doc) => sum + doc.stats.downloads, 0)
                .toLocaleString()}
            </h3>
            <p>Total Downloads</p>
          </div>
        </div>
        <div class={styles.statCard}>
          <Heart class={styles.statIcon} />
          <div>
            <h3>
              {filteredTrendingDocs().reduce((sum, doc) => sum + doc.communityEndorsements, 0)}
            </h3>
            <p>Community Endorsements</p>
          </div>
        </div>
      </div>

      <Show
        when={!loading()}
        fallback={
          <div class={styles.loading}>
            <div class={styles.spinner}></div>
            <p>Loading trending documents...</p>
          </div>
        }
      >
        <Show
          when={filteredTrendingDocs().length > 0}
          fallback={
            <div class={styles.emptyState}>
              <TrendingUp class={styles.emptyIcon} />
              <h3>No trending documents found</h3>
              <p>
                {searchQuery() || selectedReason() !== 'all' || selectedSensitivity() !== 'all'
                  ? 'Try adjusting your filters to see more trending content.'
                  : 'Documents will appear here as they gain popularity in the community.'}
              </p>
              <Button variant="primary" onClick={() => (window.location.href = '/documents')}>
                Explore All Documents
              </Button>
            </div>
          }
        >
          <div class={styles.trendingList}>
            <For each={filteredTrendingDocs()}>
              {(trending, index) => {
                const TrendingIcon = getTrendingIcon(trending.trendingReason);
                return (
                  <Card class={styles.trendingCard}>
                    <div class={styles.cardHeader}>
                      <div class={styles.rankingBadge}>#{index() + 1}</div>
                      <div class={styles.trendingInfo}>
                        <TrendingIcon
                          class={styles.trendingIcon}
                          style={{ color: getTrendingColor(trending.trendingReason) }}
                        />
                        <div class={styles.trendingDetails}>
                          <span class={styles.trendingReason}>
                            {trending.trendingReason
                              .replace('-', ' ')
                              .replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span class={styles.trendingScore}>Score: {trending.trendingScore}</span>
                        </div>
                      </div>
                      <div class={styles.badges}>
                        <div
                          class={styles.sensitivityBadge}
                          style={{
                            'background-color': getSensitivityColor(
                              trending.document.culturalMetadata.sensitivityLevel
                            ),
                          }}
                        >
                          {trending.document.culturalMetadata.sensitivityLevel}
                        </div>
                        <div
                          class={styles.importanceBadge}
                          style={{
                            'background-color': getImportanceColor(trending.culturalImportance),
                          }}
                        >
                          {trending.culturalImportance} importance
                        </div>
                      </div>
                    </div>

                    <div class={styles.documentContent}>
                      <h3 class={styles.documentTitle}>{trending.document.title}</h3>
                      <p class={styles.documentDescription}>{trending.document.description}</p>

                      <div class={styles.documentMeta}>
                        <span class={styles.culturalOrigin}>
                          📍 {trending.document.culturalMetadata.culturalOrigin}
                        </span>
                        <span class={styles.fileSize}>
                          📄 {formatFileSize(trending.document.fileSize)}
                        </span>
                        <span class={styles.endorsements}>
                          👥 {trending.communityEndorsements} endorsements
                        </span>
                      </div>

                      <div class={styles.tags}>
                        <For each={trending.document.tags.slice(0, 3)}>
                          {tag => <span class={styles.tag}>#{tag}</span>}
                        </For>
                        {trending.document.tags.length > 3 && (
                          <span class={styles.tagMore}>+{trending.document.tags.length - 3}</span>
                        )}
                      </div>

                      <div class={styles.stats}>
                        <div class={styles.statItem}>
                          <Eye class={styles.statItemIcon} />
                          <span>{trending.stats.views.toLocaleString()} views</span>
                        </div>
                        <div class={styles.statItem}>
                          <Download class={styles.statItemIcon} />
                          <span>{trending.stats.downloads.toLocaleString()} downloads</span>
                        </div>
                        <div class={styles.statItem}>
                          <TrendingUp class={styles.statItemIcon} />
                          <span>{trending.stats.shares} shares</span>
                        </div>
                        <div class={styles.statItem}>
                          <Heart class={styles.statItemIcon} />
                          <span>{trending.stats.favorites} favorites</span>
                        </div>
                      </div>
                    </div>

                    <div class={styles.cardActions}>
                      <Button variant="primary" size="small">
                        View Document
                      </Button>
                      <Button variant="secondary" size="small">
                        Cultural Context
                      </Button>
                      <Button variant="ghost" size="small">
                        Add to Favorites
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

export default TrendingPage;
