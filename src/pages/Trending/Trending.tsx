/**
 * Trending Page - Enhanced P2P Network Trending Content Discovery
 *
 * Advanced trending content discovery with real-time analytics,
 * cultural awareness, and comprehensive user experience following
 * Nielsen's 10 usability heuristics.
 */

import { Component, createSignal, createEffect, onMount, onCleanup, For, Show } from 'solid-js';
import { Button } from '@/components/foundation/Button';
import { Input } from '@/components/foundation/Input';
import { Card } from '@/components/foundation/Card';
import {
  TrendingUp,
  Eye,
  Download,
  Heart,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Settings,
  Activity,
  Users,
  Globe,
  Clock,
  BarChart3,
  Layers,
  Star,
  Share,
  BookOpen,
  Award,
  Zap,
  Target,
  Info,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Play,
  Pause,
  RotateCcw,
  MapPin,
  Tag,
} from 'lucide-solid';
import type { Document } from '@/types/Document';
import type { CulturalSensitivityLevel } from '@/types/Cultural';
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
  growthRate: number;
  peakTime: Date;
  networkReach: number;
}

interface TrendingMetrics {
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  activeUsers: number;
  networkHealth: number;
  culturalDiversity: number;
}

/**
 * Enhanced Trending Page Component
 *
 * Provides comprehensive trending content discovery with real-time analytics
 */
export const Trending: Component = () => {
  // Core state management
  const [trendingDocs, setTrendingDocs] = createSignal<TrendingDocument[]>([]);
  const [metrics, setMetrics] = createSignal<TrendingMetrics>({
    totalViews: 0,
    totalDownloads: 0,
    totalShares: 0,
    activeUsers: 0,
    networkHealth: 0,
    culturalDiversity: 0,
  });

  // UI state
  const [loading, setLoading] = createSignal(true);
  const [refreshing, setRefreshing] = createSignal(false);
  const [realTimeUpdates, setRealTimeUpdates] = createSignal(true);
  const [lastUpdated, setLastUpdated] = createSignal<Date>(new Date());

  // Search and filtering
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
  const [sortBy, setSortBy] = createSignal<'score' | 'views' | 'downloads' | 'recent'>('score');
  const [viewMode, setViewMode] = createSignal<'grid' | 'list' | 'analytics'>('grid');

  // Advanced features
  const [showFilters, setShowFilters] = createSignal(false);
  const [showAnalytics, setShowAnalytics] = createSignal(false);
  const [selectedDocument, setSelectedDocument] = createSignal<string | null>(null);

  // Auto-refresh functionality
  let refreshTimer: number;

  createEffect(() => {
    if (realTimeUpdates()) {
      refreshTimer = setInterval(() => {
        simulateRealTimeUpdate();
      }, 30000); // Update every 30 seconds
    }

    onCleanup(() => {
      if (refreshTimer) clearInterval(refreshTimer);
    });
  });

  onMount(() => {
    loadTrendingData();
  });

  // Mock data generation with more realistic content
  const generateMockData = (): TrendingDocument[] => [
    {
      trendingScore: 98,
      trendingReason: 'community-interest',
      trendingPeriod: 'day',
      communityEndorsements: 156,
      culturalImportance: 'high',
      growthRate: 45.2,
      peakTime: new Date(Date.now() - 1000 * 60 * 30),
      networkReach: 89,
      stats: {
        views: 2847,
        downloads: 756,
        shares: 234,
        favorites: 445,
      },
      document: {
        id: 'trend1',
        title: 'Indigenous Climate Adaptation Strategies',
        description:
          'Traditional ecological knowledge for climate resilience, featuring time-tested strategies from Pacific Island communities for environmental adaptation and sustainable resource management.',
        format: 'pdf' as any,
        contentType: 'cultural' as any,
        status: 'active' as any,
        filePath: '/documents/climate-adaptation.pdf',
        originalFilename: 'climate-adaptation.pdf',
        fileSize: 5600000,
        fileHash: 'hash1',
        mimeType: 'application/pdf',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-25'),
        createdBy: 'pacific-council',
        version: 2,
        culturalMetadata: {
          sensitivityLevel: 'educational' as CulturalSensitivityLevel,
          culturalOrigin: 'Pacific Island Communities',
        } as any,
        tags: ['climate', 'adaptation', 'indigenous-knowledge', 'sustainability', 'environment'],
        categories: ['Environment', 'Traditional Knowledge'],
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
      communityEndorsements: 89,
      culturalImportance: 'medium',
      growthRate: 23.8,
      peakTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
      networkReach: 67,
      stats: {
        views: 1892,
        downloads: 1234,
        shares: 156,
        favorites: 289,
      },
      document: {
        id: 'trend2',
        title: 'Open Source Quantum Computing Fundamentals',
        description:
          'Collaborative research on quantum algorithms and implementations, making quantum computing accessible to global research communities through open-source development.',
        format: 'pdf' as any,
        contentType: 'technical' as any,
        status: 'active' as any,
        filePath: '/documents/quantum-computing.pdf',
        originalFilename: 'quantum-computing.pdf',
        fileSize: 12400000,
        fileHash: 'hash2',
        mimeType: 'application/pdf',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-24'),
        createdBy: 'quantum-collective',
        version: 1,
        culturalMetadata: {
          sensitivityLevel: 'public' as CulturalSensitivityLevel,
          culturalOrigin: 'Global Research Community',
        } as any,
        tags: ['quantum', 'computing', 'open-source', 'research', 'algorithms'],
        categories: ['Technology', 'Research'],
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
      trendingScore: 76,
      trendingReason: 'cultural-significance',
      trendingPeriod: 'month',
      communityEndorsements: 234,
      culturalImportance: 'critical',
      growthRate: 67.4,
      peakTime: new Date(Date.now() - 1000 * 60 * 45),
      networkReach: 92,
      stats: {
        views: 3456,
        downloads: 445,
        shares: 567,
        favorites: 789,
      },
      document: {
        id: 'trend3',
        title: 'Traditional Healing Practices Documentation',
        description:
          'Comprehensive documentation of traditional healing methods from various indigenous communities, preserving ancient knowledge for future generations with proper cultural attribution.',
        format: 'pdf' as any,
        contentType: 'cultural' as any,
        status: 'active' as any,
        filePath: '/documents/traditional-healing.pdf',
        originalFilename: 'traditional-healing.pdf',
        fileSize: 8900000,
        fileHash: 'hash3',
        mimeType: 'application/pdf',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-22'),
        createdBy: 'cultural-council',
        version: 3,
        culturalMetadata: {
          sensitivityLevel: 'community-restricted' as CulturalSensitivityLevel,
          culturalOrigin: 'Global Indigenous Communities',
        } as any,
        tags: ['healing', 'traditional', 'medicine', 'cultural-heritage', 'documentation'],
        categories: ['Health', 'Traditional Knowledge', 'Cultural Heritage'],
        language: 'en',
        authors: [],
        accessHistory: [],
        relationships: [],
        securityValidation: {} as any,
        contentVerification: {} as any,
        sourceAttribution: {} as any,
      },
    },
  ];

  const loadTrendingData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockData = generateMockData();
      setTrendingDocs(mockData);

      // Calculate metrics
      const totalViews = mockData.reduce((sum, doc) => sum + doc.stats.views, 0);
      const totalDownloads = mockData.reduce((sum, doc) => sum + doc.stats.downloads, 0);
      const totalShares = mockData.reduce((sum, doc) => sum + doc.stats.shares, 0);

      setMetrics({
        totalViews,
        totalDownloads,
        totalShares,
        activeUsers: 1247,
        networkHealth: 94,
        culturalDiversity: 87,
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load trending data:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulateRealTimeUpdate = () => {
    setTrendingDocs(prev =>
      prev.map(doc => ({
        ...doc,
        stats: {
          ...doc.stats,
          views: doc.stats.views + Math.floor(Math.random() * 10),
          downloads: doc.stats.downloads + Math.floor(Math.random() * 3),
          shares: doc.stats.shares + Math.floor(Math.random() * 2),
        },
        trendingScore: Math.min(100, doc.trendingScore + (Math.random() - 0.5) * 2),
      }))
    );
    setLastUpdated(new Date());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrendingData();
    setRefreshing(false);
  };

  // Enhanced filtering logic
  const filteredTrendingDocs = () => {
    let filtered = trendingDocs().filter(item => {
      const matchesSearch =
        searchQuery() === '' ||
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

    // Apply sorting
    switch (sortBy()) {
      case 'score':
        filtered.sort((a, b) => b.trendingScore - a.trendingScore);
        break;
      case 'views':
        filtered.sort((a, b) => b.stats.views - a.stats.views);
        break;
      case 'downloads':
        filtered.sort((a, b) => b.stats.downloads - a.stats.downloads);
        break;
      case 'recent':
        filtered.sort((a, b) => b.peakTime.getTime() - a.peakTime.getTime());
        break;
    }

    return filtered;
  };

  // Utility functions
  const getTrendingIcon = (reason: TrendingDocument['trendingReason']) => {
    switch (reason) {
      case 'views':
        return Eye;
      case 'downloads':
        return Download;
      case 'shares':
        return Share;
      case 'community-interest':
        return Heart;
      case 'cultural-significance':
        return Award;
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

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getTrendIcon = (growthRate: number) => {
    if (growthRate > 20) return ArrowUp;
    if (growthRate < -20) return ArrowDown;
    return Minus;
  };

  const getTrendColor = (growthRate: number) => {
    if (growthRate > 20) return '#27ae60';
    if (growthRate < -20) return '#e74c3c';
    return '#95a5a6';
  };

  return (
    <div class={styles['trending-page']}>
      {/* Enhanced Header with Real-time Status */}
      <header class={styles['page-header']}>
        <div class={styles['header-content']}>
          <div class={styles['title-section']}>
            <h1 class={styles['page-title']}>
              <TrendingUp size={32} class={styles['title-icon']} />
              Trending Content Discovery
            </h1>
            <p class={styles['page-subtitle']}>
              Real-time trending analysis across the decentralized cultural heritage network
            </p>
          </div>

          <div class={styles['status-section']}>
            <div class={styles['real-time-status']}>
              <div
                class={`${styles['status-indicator']} ${realTimeUpdates() ? styles.active : styles.inactive}`}
              >
                <div class={styles['status-pulse']}></div>
              </div>
              <span class={styles['status-text']}>
                {realTimeUpdates() ? 'Live Updates' : 'Updates Paused'}
              </span>
            </div>

            <div class={styles['last-updated']}>
              <Clock size={14} />
              <span>Updated {formatTimeAgo(lastUpdated())}</span>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div class={styles['control-panel']}>
          <div class={styles['primary-controls']}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRealTimeUpdates(!realTimeUpdates())}
              class={styles['control-button']}
              aria-label={
                realTimeUpdates() ? 'Pause real-time updates' : 'Resume real-time updates'
              }
            >
              {realTimeUpdates() ? <Pause size={16} /> : <Play size={16} />}
              {realTimeUpdates() ? 'Pause' : 'Resume'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing()}
              class={styles['control-button']}
              aria-label="Refresh trending data"
            >
              <RefreshCw size={16} class={refreshing() ? styles.spinning : ''} />
              Refresh
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics())}
              class={`${styles['control-button']} ${showAnalytics() ? styles.active : ''}`}
              aria-label="Toggle analytics view"
            >
              <BarChart3 size={16} />
              Analytics
            </Button>
          </div>

          <div class={styles['view-controls']}>
            <div class={styles['view-selector']}>
              <button
                class={`${styles['view-option']} ${viewMode() === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <Layers size={16} />
                Grid
              </button>
              <button
                class={`${styles['view-option']} ${viewMode() === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <BarChart3 size={16} />
                List
              </button>
              <button
                class={`${styles['view-option']} ${viewMode() === 'analytics' ? styles.active : ''}`}
                onClick={() => setViewMode('analytics')}
                aria-label="Analytics view"
              >
                <Activity size={16} />
                Analytics
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Search and Filters */}
      <div class={styles['search-section']}>
        <div class={styles['search-container']}>
          <Search class={styles['search-icon']} />
          <Input
            type="search"
            placeholder="Search trending content, topics, or cultural themes..."
            value={searchQuery()}
            onInput={e => setSearchQuery(e.currentTarget.value)}
            class={styles['search-input']}
            aria-label="Search trending documents"
          />
        </div>

        <div class={styles['filter-controls']}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters())}
            class={`${styles['filter-toggle']} ${showFilters() ? styles.active : ''}`}
            aria-label="Toggle filters"
          >
            <Filter size={16} />
            Filters
            {(selectedReason() !== 'all' || selectedSensitivity() !== 'all') && (
              <span class={styles['filter-indicator']}>•</span>
            )}
          </Button>

          <select
            value={selectedPeriod()}
            onChange={e => setSelectedPeriod(e.currentTarget.value as any)}
            class={styles['period-selector']}
            aria-label="Select time period"
          >
            <option value="hour">⏰ Last Hour</option>
            <option value="day">📅 Today</option>
            <option value="week">📆 This Week</option>
            <option value="month">🗓️ This Month</option>
          </select>

          <select
            value={sortBy()}
            onChange={e => setSortBy(e.currentTarget.value as any)}
            class={styles['sort-selector']}
            aria-label="Sort documents by"
          >
            <option value="score">🏆 Trending Score</option>
            <option value="views">👁️ Most Viewed</option>
            <option value="downloads">⬇️ Most Downloaded</option>
            <option value="recent">🕒 Most Recent</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <Show when={showFilters()}>
        <div class={styles['advanced-filters']}>
          <div class={styles['filter-group']}>
            <label class={styles['filter-label']}>Trending Reason:</label>
            <select
              value={selectedReason()}
              onChange={e => setSelectedReason(e.currentTarget.value as any)}
              class={styles['filter-select']}
            >
              <option value="all">All Reasons</option>
              <option value="views">👁️ Most Viewed</option>
              <option value="downloads">⬇️ Most Downloaded</option>
              <option value="shares">🔄 Most Shared</option>
              <option value="community-interest">❤️ Community Interest</option>
              <option value="cultural-significance">🌟 Cultural Significance</option>
            </select>
          </div>

          <div class={styles['filter-group']}>
            <label class={styles['filter-label']}>Cultural Sensitivity:</label>
            <select
              value={selectedSensitivity()}
              onChange={e => setSelectedSensitivity(e.currentTarget.value as any)}
              class={styles['filter-select']}
            >
              <option value="all">All Levels</option>
              <option value="public">🌍 Public</option>
              <option value="educational">📚 Educational</option>
              <option value="community-restricted">🏘️ Community</option>
              <option value="guardian-approval">👥 Guardian</option>
              <option value="sacred-protected">🔒 Sacred</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedReason('all');
              setSelectedSensitivity('all');
              setSearchQuery('');
            }}
            class={styles['clear-filters']}
          >
            <RotateCcw size={14} />
            Clear Filters
          </Button>
        </div>
      </Show>

      {/* Network Metrics Dashboard */}
      <div class={styles['metrics-dashboard']}>
        <div class={styles['metric-card']}>
          <div class={styles['metric-icon']}>
            <Eye size={24} />
          </div>
          <div class={styles['metric-content']}>
            <div class={styles['metric-value']}>{metrics().totalViews.toLocaleString()}</div>
            <div class={styles['metric-label']}>Total Views</div>
          </div>
          <div class={styles['metric-trend']}>
            <ArrowUp size={16} style={{ color: '#27ae60' }} />
            <span>+12%</span>
          </div>
        </div>

        <div class={styles['metric-card']}>
          <div class={styles['metric-icon']}>
            <Download size={24} />
          </div>
          <div class={styles['metric-content']}>
            <div class={styles['metric-value']}>{metrics().totalDownloads.toLocaleString()}</div>
            <div class={styles['metric-label']}>Downloads</div>
          </div>
          <div class={styles['metric-trend']}>
            <ArrowUp size={16} style={{ color: '#27ae60' }} />
            <span>+8%</span>
          </div>
        </div>

        <div class={styles['metric-card']}>
          <div class={styles['metric-icon']}>
            <Users size={24} />
          </div>
          <div class={styles['metric-content']}>
            <div class={styles['metric-value']}>{metrics().activeUsers.toLocaleString()}</div>
            <div class={styles['metric-label']}>Active Users</div>
          </div>
          <div class={styles['metric-trend']}>
            <ArrowUp size={16} style={{ color: '#27ae60' }} />
            <span>+15%</span>
          </div>
        </div>

        <div class={styles['metric-card']}>
          <div class={styles['metric-icon']}>
            <Activity size={24} />
          </div>
          <div class={styles['metric-content']}>
            <div class={styles['metric-value']}>{metrics().networkHealth}%</div>
            <div class={styles['metric-label']}>Network Health</div>
          </div>
          <div class={styles['metric-trend']}>
            <CheckCircle size={16} style={{ color: '#27ae60' }} />
            <span>Excellent</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div class={styles['main-content']}>
        <Show
          when={!loading()}
          fallback={
            <div class={styles['loading-state']}>
              <div class={styles['loading-spinner']}>
                <div class={styles['spinner-ring']}></div>
                <div class={styles['spinner-ring']}></div>
                <div class={styles['spinner-ring']}></div>
              </div>
              <h3>Analyzing Trending Content</h3>
              <p>Discovering popular content across the P2P network...</p>
            </div>
          }
        >
          <Show
            when={filteredTrendingDocs().length > 0}
            fallback={
              <div class={styles['empty-state']}>
                <div class={styles['empty-icon']}>
                  <TrendingUp size={64} />
                </div>
                <h3>No trending content found</h3>
                <p>
                  {searchQuery() || selectedReason() !== 'all' || selectedSensitivity() !== 'all'
                    ? 'Try adjusting your search terms or filters to discover more content.'
                    : 'Content will appear here as it gains popularity in the network.'}
                </p>
                <div class={styles['empty-actions']}>
                  <Button variant="primary" onClick={() => (window.location.href = '/documents')}>
                    <BookOpen size={16} />
                    Explore All Documents
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedReason('all');
                      setSelectedSensitivity('all');
                    }}
                  >
                    <RotateCcw size={16} />
                    Clear Filters
                  </Button>
                </div>
              </div>
            }
          >
            <div class={`${styles['trending-grid']} ${styles[`view-${viewMode()}`]}`}>
              <For each={filteredTrendingDocs()}>
                {(trending, index) => {
                  const TrendingIcon = getTrendingIcon(trending.trendingReason);
                  const TrendIcon = getTrendIcon(trending.growthRate);

                  return (
                    <Card
                      class={`${styles['trending-card']} ${selectedDocument() === trending.document.id ? styles.selected : ''}`}
                      onClick={() =>
                        setSelectedDocument(
                          selectedDocument() === trending.document.id ? null : trending.document.id
                        )
                      }
                    >
                      {/* Card Header with Ranking and Trend */}
                      <div class={styles['card-header']}>
                        <div class={styles['ranking-section']}>
                          <div class={styles['ranking-badge']}>#{index() + 1}</div>
                          <div class={styles['trend-indicator']}>
                            <TrendIcon
                              size={16}
                              style={{ color: getTrendColor(trending.growthRate) }}
                            />
                            <span class={styles['growth-rate']}>
                              {trending.growthRate > 0 ? '+' : ''}
                              {trending.growthRate.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div class={styles['trending-info']}>
                          <TrendingIcon
                            size={20}
                            style={{ color: getTrendingColor(trending.trendingReason) }}
                          />
                          <div class={styles['trending-details']}>
                            <span class={styles['trending-reason']}>
                              {trending.trendingReason
                                .replace('-', ' ')
                                .replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span class={styles['trending-score']}>
                              Score: {trending.trendingScore.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div class={styles['badges']}>
                          <div
                            class={styles['sensitivity-badge']}
                            style={{
                              'background-color': getSensitivityColor(
                                trending.document.culturalMetadata.sensitivityLevel
                              ),
                            }}
                            title={`Cultural sensitivity level: ${trending.document.culturalMetadata.sensitivityLevel}`}
                          >
                            {trending.document.culturalMetadata.sensitivityLevel}
                          </div>
                          <div
                            class={styles['importance-badge']}
                            style={{
                              'background-color': getImportanceColor(trending.culturalImportance),
                            }}
                            title={`Cultural importance: ${trending.culturalImportance}`}
                          >
                            {trending.culturalImportance}
                          </div>
                        </div>
                      </div>

                      {/* Document Content */}
                      <div class={styles['document-content']}>
                        <h3 class={styles['document-title']}>{trending.document.title}</h3>
                        <p class={styles['document-description']}>
                          {trending.document.description}
                        </p>

                        <div class={styles['document-meta']}>
                          <div class={styles['meta-item']}>
                            <MapPin size={14} />
                            <span>{trending.document.culturalMetadata.culturalOrigin}</span>
                          </div>
                          <div class={styles['meta-item']}>
                            <Target size={14} />
                            <span>{formatFileSize(trending.document.fileSize)}</span>
                          </div>
                          <div class={styles['meta-item']}>
                            <Clock size={14} />
                            <span>Peak: {formatTimeAgo(trending.peakTime)}</span>
                          </div>
                          <div class={styles['meta-item']}>
                            <Globe size={14} />
                            <span>{trending.networkReach}% reach</span>
                          </div>
                        </div>

                        <div class={styles['tags-section']}>
                          <For each={trending.document.tags.slice(0, 4)}>
                            {tag => (
                              <span class={styles['tag']}>
                                <Tag size={12} />
                                {tag}
                              </span>
                            )}
                          </For>
                          {trending.document.tags.length > 4 && (
                            <span class={styles['tag-more']}>
                              +{trending.document.tags.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Statistics Section */}
                      <div class={styles['stats-section']}>
                        <div class={styles['stat-item']}>
                          <Eye size={16} />
                          <span class={styles['stat-value']}>
                            {trending.stats.views.toLocaleString()}
                          </span>
                          <span class={styles['stat-label']}>views</span>
                        </div>
                        <div class={styles['stat-item']}>
                          <Download size={16} />
                          <span class={styles['stat-value']}>
                            {trending.stats.downloads.toLocaleString()}
                          </span>
                          <span class={styles['stat-label']}>downloads</span>
                        </div>
                        <div class={styles['stat-item']}>
                          <Share size={16} />
                          <span class={styles['stat-value']}>{trending.stats.shares}</span>
                          <span class={styles['stat-label']}>shares</span>
                        </div>
                        <div class={styles['stat-item']}>
                          <Heart size={16} />
                          <span class={styles['stat-value']}>{trending.communityEndorsements}</span>
                          <span class={styles['stat-label']}>endorsements</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div class={styles['card-actions']}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            console.log('View document:', trending.document.id);
                          }}
                        >
                          <BookOpen size={14} />
                          View Document
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            console.log('Cultural context:', trending.document.id);
                          }}
                        >
                          <Info size={14} />
                          Cultural Context
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            console.log('Add to favorites:', trending.document.id);
                          }}
                        >
                          <Star size={14} />
                          Favorite
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

      {/* Status Bar */}
      <div class={styles['status-bar']}>
        <div class={styles['status-info']}>
          <span class={styles['status-item']}>
            <Activity size={14} />
            Network: {metrics().networkHealth}% healthy
          </span>
          <span class={styles['status-item']}>
            <Users size={14} />
            {metrics().activeUsers.toLocaleString()} active users
          </span>
          <span class={styles['status-item']}>
            <Globe size={14} />
            Cultural diversity: {metrics().culturalDiversity}%
          </span>
        </div>

        <div class={styles['status-actions']}>
          <span class={styles['results-count']}>
            Showing {filteredTrendingDocs().length} of {trendingDocs().length} trending documents
          </span>
        </div>
      </div>
    </div>
  );
};

export default Trending;
