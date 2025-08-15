/**
 * SearchNetworkPage - P2P Network Search Interface
 * Enhanced to match HomePage and DocumentManagement sophisticated patterns
 */

import { Component, createSignal, createEffect, onMount, Show, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import {
  Search,
  Network,
  Users,
  Globe,
  Shield,
  Filter,
  Grid,
  List,
  Eye,
  Download,
  Share2,
  BookOpen,
  Wifi,
  Clock,
  MapPin,
  Zap,
  TrendingUp,
  ArrowRight,
  Activity,
  BarChart3,
  Settings,
  RefreshCw,
} from 'lucide-solid';

// Foundation Components
import { Button } from '../../components/foundation/Button';
import { Card } from '../../components/foundation/Card';
import { Input } from '../../components/foundation/Input';
import { Badge } from '../../components/foundation/Badge';
import { Loading } from '../../components/foundation/Loading';

// Composite Components
import { StatCard, ActivityListCard } from '../../components/composite';

// Domain Components
import { DocumentCard } from '../../components/domain/document/DocumentCard';
import { CulturalIndicator } from '../../components/cultural/CulturalIndicator';
import { NetworkStatus } from '../../components/domain/network/NetworkStatus';

// Hooks and Services
import { useNetworkSearch } from '../../hooks/api/useNetworkSearch';
import { usePeerNetwork } from '../../hooks/api/usePeerNetwork';
import { enableTorAndP2P } from '../../services/network/bootstrap';
import { useP2PTransfers } from '@/hooks/api/useP2PTransfers';
import { torAdapter } from '../../services/network/torAdapter';

// Types
import type { Document } from '../../types/Document';
import type { SearchQuery, SearchResult } from '../../types/Search';

// Styles
import styles from './SearchNetworkPage.module.css';

export interface SearchNetworkPageProps {
  initialQuery?: string;
  initialViewMode?: 'grid' | 'list';
  showCulturalContext?: boolean;
  anonymousMode?: boolean;
}

export const SearchNetworkPage: Component<SearchNetworkPageProps> = props => {
  const navigate = useNavigate();
  const { enabled, busy, enable, downloadByHash, error, lastOp } = useP2PTransfers();
  const [hash, setHash] = createSignal('');

  // State Management
  const [searchQuery, setSearchQuery] = createSignal(props.initialQuery || '');
  const [activeTab, setActiveTab] = createSignal<'search' | 'results' | 'network'>('search');
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>(props.initialViewMode || 'grid');
  const [showFilters, setShowFilters] = createSignal(false);
  const [anonymousMode, setAnonymousMode] = createSignal(props.anonymousMode || false);
  const [searchScope, setSearchScope] = createSignal<'all' | 'trusted' | 'nearby'>('all');
  const [sortBy, setSortBy] = createSignal<'relevance' | 'date' | 'peers'>('relevance');
  const [torReady, setTorReady] = createSignal(false);
  const [torBootstrapped, setTorBootstrapped] = createSignal(false);
  const [torEstablishing, setTorEstablishing] = createSignal(false);

  // Search filters
  const [fileTypes, setFileTypes] = createSignal<string[]>([]);
  const [culturalLevels, setCulturalLevels] = createSignal<number[]>([]);

  // Hooks
  const {
    searchResults,
    searchProgress,
    isSearching,
    error,
    searchNetwork,
    cancelSearch,
    clearResults,
  } = useNetworkSearch();

  const { peers, networkStats } = usePeerNetwork();
  const onEnableTorClick = async () => {
    try {
      setTorEstablishing(true);
      const result = await enableTorAndP2P();
      setTorReady(result.torConnected && result.p2pStarted);
    } catch (e) {
      console.error('Failed to enable TOR/P2P routing:', e);
      setTorReady(false);
    }
    finally {
      setTorEstablishing(false);
    }
  };

  // Periodically poll tor status for header pill and circuit banner
  onMount(() => {
    let timer: any;
    const tick = async () => {
      try {
        const status = await torAdapter.status();
        setTorBootstrapped(!!status?.bootstrapped);
        setTorReady(!!status?.circuitEstablished);
      } catch {}
    };
    tick();
    timer = globalThis.setInterval(tick, 4000);
    const handler = () => tick();
    window.addEventListener('tor-status-updated', handler as any);
    return () => globalThis.clearInterval(timer);
  });

  // Sample data for demonstration
  const networkActivity = [
    {
      type: 'search-active',
      title: 'Active search across 89 peers',
      status: 'Searching',
      metadata: 'Cultural Heritage Documents',
      resultCount: 247,
    },
    {
      type: 'peer-discovered',
      title: 'New peer discovered',
      status: 'Connected',
      metadata: 'Universidad Nacional Autónoma de México',
      peerCount: 90,
    },
    {
      type: 'content-found',
      title: 'Relevant content discovered',
      status: 'Found',
      metadata: 'Traditional Music Collection',
      resultCount: 12,
    },
  ];

  const searchStats = [
    {
      type: 'peers',
      icon: <Users size={24} />,
      number: '89',
      label: 'Connected Peers',
      trendType: 'positive',
      trendIcon: <TrendingUp size={12} />,
      trendValue: '+5',
      trendLabel: 'online',
      graphType: 'peers',
    },
    {
      type: 'documents',
      icon: <BookOpen size={24} />,
      number: '12,847',
      label: 'Network Documents',
      trendType: 'positive',
      trendIcon: <TrendingUp size={14} />,
      trendValue: '+127',
      trendLabel: 'today',
      graphType: 'chart',
    },
    {
      type: 'institutions',
      icon: <Globe size={24} />,
      number: '156',
      label: 'Cultural Institutions',
      trendType: 'neutral',
      trendIcon: <ArrowRight size={14} />,
      trendValue: 'stable',
      graphType: 'map',
    },
    {
      type: 'quality',
      icon: <Zap size={24} />,
      number: '94%',
      label: 'Search Quality',
      trendType: 'positive',
      trendIcon: <TrendingUp size={14} />,
      trendValue: 'excellent',
      graphType: 'health',
    },
  ];

  // Enhanced search interface
  const handleSearch = async () => {
    if (!searchQuery().trim()) return;
    setActiveTab('results');

    const query: SearchQuery = {
      text: searchQuery(),
      fileTypes: fileTypes(),
      culturalLevels: culturalLevels(),
      scope: searchScope(),
      anonymous: anonymousMode(),
      sortBy: sortBy(),
    };

    try {
      await searchNetwork(query);
    } catch (error) {
      console.error('Network search failed:', error);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
  };

  const handleDocumentOpen = (document: Document) => {
    navigate(`/document/${document.id}`);
  };

  // Add any missing state declarations here
  const [hasSearched, setHasSearched] = createSignal(false);

  return (
    <div class={styles['search-network-page']}>
      {/* Enhanced Page Header */}
      <header class={`${styles['page-header']} ${styles.enhanced}`}>
        <div class={styles['header-content']}>
          <h1 class={styles['page-title']}>Network Search Hub</h1>
          <p class={styles['page-subtitle']}>
            Distributed search across decentralized cultural heritage network
          </p>
          <Show when={torBootstrapped() && !torReady()}>
            <div class={styles['tor-banner']}>
              Building Tor circuit… routing will switch to Onion once ready
            </div>
          </Show>
        </div>

        <div class={styles['network-status-enhanced']}>
            <NetworkStatus variant="default" connectionCount={peers()?.length || 0} showHealth={true} />
            <div class={styles['tor-pill']} data-on={torReady() ? '1' : '0'}>
              {torReady() ? 'Onion' : 'No Onion'}
            </div>
        </div>
      </header>

      {/* Enhanced Navigation Tabs */}
      <div
        class={styles['dashboard-tabs']}
        data-active={activeTab() === 'search' ? '0' : activeTab() === 'results' ? '1' : '2'}
      >
        <button
          class={`${styles.tab} ${activeTab() === 'search' ? styles.active : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <span class={styles['tab-text']}>
            <Search size={16} class="mr-2" />
            Search Interface
          </span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'results' ? styles.active : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <span class={styles['tab-text']}>
            <BookOpen size={16} class="mr-2" />
            Search Results
          </span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'network' ? styles.active : ''}`}
          onClick={() => setActiveTab('network')}
        >
          <span class={styles['tab-text']}>
            <Activity size={16} class="mr-2" />
            Network Activity
          </span>
        </button>
      </div>

      <div class={styles['dashboard-content']}>
        {/* Search Interface Tab */}
        {activeTab() === 'search' && (
          <>
            {/* Network Statistics Section */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <For each={searchStats}>
                {stat => (
                  <StatCard
                    type={stat.type}
                    icon={stat.icon}
                    number={stat.number}
                    label={stat.label}
                    trendType={stat.trendType}
                    trendIcon={stat.trendIcon}
                    trendValue={stat.trendValue}
                    trendLabel={stat.trendLabel}
                    graphType={stat.graphType}
                  />
                )}
              </For>
            </div>

            {/* Enhanced Search Interface */}
            <section class={`${styles['search-section']} ${styles.enhanced}`}>
              <div class={styles['section-header']}>
                <div class={styles['header-content']}>
                  <h2 class={styles['section-title']}>Distributed Search</h2>
                  <p class={styles['section-subtitle']}>
                    Search across connected peers and cultural institutions
                  </p>
                </div>
                <div class={styles['header-actions']}>
                  <Button variant={torReady() ? 'outline' : 'primary'} size="sm" onClick={onEnableTorClick} disabled={torEstablishing()}>
                    <Shield size={16} class="mr-2" />
                    {torReady() ? 'TOR Enabled' : torEstablishing() ? 'Enabling…' : 'Enable TOR Search'}
                  </Button>
                  <Button variant={enabled() ? 'outline' : 'primary'} size="sm" onClick={enable} disabled={busy()}>
                    {enabled() ? 'Private Networking Enabled' : 'Enable Private Networking'}
                  </Button>
                  <div class={styles['hash-download']}>
                    <Input type="text" placeholder="Download by hash" value={hash()} onInput={e => setHash(e.currentTarget.value)} />
                    <Button variant="outline" size="sm" disabled={!enabled() || busy() || !hash().trim()} onClick={() => downloadByHash(hash().trim(), (window as any).api?.downloadsDir ?? 'downloads')}>
                      <Download size={14} class="mr-2" />
                      Download
                    </Button>
                  </div>
                  <Show when={error()}>
                    <div class={styles['error-text']}>{error()}</div>
                  </Show>
                  <Show when={lastOp()}>
                    <div class={styles['muted-text']}>Last operation: {lastOp()}</div>
                  </Show>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters())}>
                    <Filter size={16} class="mr-2" />
                    {showFilters() ? 'Hide Filters' : 'Show Filters'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings size={16} class="mr-2" />
                    Settings
                  </Button>
                </div>
              </div>

              <Card class={styles['search-container']}>
                <div class={styles['search-interface']}>
                  <div class={styles['search-input-wrapper']}>
                    <div class={styles['search-icon-container']}>
                      <Search size={20} class={styles['search-icon']} />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search cultural heritage documents across P2P network..."
                      value={searchQuery()}
                      onInput={e => handleSearchInput(e.currentTarget.value)}
                      class={styles['search-input']}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                    />
                    <div class={styles['search-actions']}>
                      <Button
                        variant="primary"
                        onClick={handleSearch}
                        disabled={!searchQuery().trim() || isSearching()}
                      >
                        {isSearching() ? 'Searching...' : 'Search Network'}
                      </Button>
                    </div>
                  </div>

                  {/* Search Filters */}
                  <Show when={showFilters()}>
                    <div class={styles['search-filters']}>
                      <div class={styles['filter-section']}>
                        <label class={styles['filter-label']}>Search Scope</label>
                        <div class={styles['filter-options']}>
                          <Button
                            variant={searchScope() === 'all' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setSearchScope('all')}
                          >
                            All Peers
                          </Button>
                          <Button
                            variant={searchScope() === 'trusted' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setSearchScope('trusted')}
                          >
                            Trusted Only
                          </Button>
                          <Button
                            variant={searchScope() === 'nearby' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setSearchScope('nearby')}
                          >
                            Nearby Peers
                          </Button>
                        </div>
                      </div>

                      <div class={styles['filter-section']}>
                        <label class={styles['filter-label']}>File Types</label>
                        <div class={styles['filter-options']}>
                          <Button
                            variant={fileTypes().includes('pdf') ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => {
                              const types = fileTypes();
                              if (types.includes('pdf')) {
                                setFileTypes(types.filter(t => t !== 'pdf'));
                              } else {
                                setFileTypes([...types, 'pdf']);
                              }
                            }}
                          >
                            PDF Documents
                          </Button>
                          <Button
                            variant={fileTypes().includes('epub') ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => {
                              const types = fileTypes();
                              if (types.includes('epub')) {
                                setFileTypes(types.filter(t => t !== 'epub'));
                              } else {
                                setFileTypes([...types, 'epub']);
                              }
                            }}
                          >
                            EPUB Books
                          </Button>
                        </div>
                      </div>

                      <div class={styles['filter-section']}>
                        <label class={styles['filter-label']}>Privacy</label>
                        <div class={styles['filter-options']}>
                          <Button
                            variant={anonymousMode() ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setAnonymousMode(!anonymousMode())}
                          >
                            <Shield size={16} class="mr-2" />
                            Anonymous Search
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Show>
                </div>
              </Card>
            </section>

            {/* Network Activity Preview */}
            <section class={`${styles['activity-section']} ${styles.enhanced}`}>
              <div class={styles['section-header']}>
                <div class={styles['header-content']}>
                  <h2 class={styles['section-title']}>Live Network Activity</h2>
                  <p class={styles['section-subtitle']}>
                    Real-time search activity and peer discoveries
                  </p>
                </div>
                <div class={styles['header-actions']}>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('network')}>
                    <ArrowRight size={16} class="ml-2" />
                    View All Activity
                  </Button>
                </div>
              </div>

              <div class={styles['activity-grid']}>
                <ActivityListCard
                  title="Search Activity"
                  subtitle="Active searches and discoveries"
                  icon={<Search size={20} />}
                  items={networkActivity}
                  cardType="network"
                />
              </div>
            </section>
          </>
        )}

        {/* Search Results Tab */}
        {activeTab() === 'results' && (
          <section class={styles['results-section']}>
            <div class={styles['section-header']}>
              <h2>Search Results</h2>
              <div class={styles['result-controls']}>
                <Button variant="ghost" size="sm">
                  <Filter size={14} class="mr-2" />
                  Filter Results
                </Button>
                <Button variant="ghost" size="sm">
                  <Grid size={14} class="mr-2" />
                  Grid View
                </Button>
                <Button variant="outline" size="sm">
                  <Download size={14} class="mr-2" />
                  Download All
                </Button>
              </div>
            </div>

            <Show when={isSearching()}>
              <div class={styles['search-progress']}>
                <Loading />
                <p>Searching across {peers()?.length || 0} connected peers...</p>
              </div>
            </Show>

            <Show when={searchResults() && searchResults()!.length > 0}>
              <div class={styles['results-grid']}>
                <For each={searchResults()}>
                  {result => (
                    <DocumentCard
                      document={result.document}
                      onOpen={() => handleDocumentOpen(result.document)}
                      showCulturalContext={true}
                      variant="network-result"
                    />
                  )}
                </For>
              </div>
            </Show>

            <Show when={!isSearching() && searchResults()?.length === 0}>
              <div class={styles['empty-state']}>
                <Search size={48} />
                <h3>No results found</h3>
                <p>Try adjusting your search terms or expanding your search scope.</p>
                <Button variant="primary" onClick={() => setActiveTab('search')}>
                  <ArrowRight size={16} class="mr-2" />
                  Back to Search
                </Button>
              </div>
            </Show>
          </section>
        )}

        {/* Network Activity Tab */}
        {activeTab() === 'network' && (
          <section class={styles['network-section']}>
            <div class={styles['section-header']}>
              <h2>Network Activity & Analytics</h2>
              <div class={styles['network-controls']}>
                <Button variant="ghost" size="sm">
                  <RefreshCw size={14} class="mr-2" />
                  Refresh
                </Button>
                <Button variant="ghost" size="sm">
                  <BarChart3 size={14} class="mr-2" />
                  Analytics
                </Button>
                <Button variant="outline" size="sm">
                  <Settings size={14} class="mr-2" />
                  Configure
                </Button>
              </div>
            </div>

            <div class={styles['network-analytics']}>
              <ActivityListCard
                title="Network Discoveries"
                subtitle="Recent peer connections and content discoveries"
                icon={<Network size={20} />}
                items={networkActivity}
                cardType="network"
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SearchNetworkPage;
