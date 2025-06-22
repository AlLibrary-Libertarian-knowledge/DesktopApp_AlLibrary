/**
 * SearchNetworkPage - P2P Network Search Interface
 *
 * Features:
 * - Distributed search across P2P network
 * - Real-time peer discovery and connection status
 * - Cultural context display (information only)
 * - Advanced search filters and sorting
 * - Anonymous search capabilities
 * - Educational cultural resources integration
 * - Anti-censorship compliance
 *
 * @cultural-considerations
 * - Displays cultural sensitivity indicators for information only
 * - Shows educational resources for cultural understanding
 * - Supports traditional knowledge context display
 * - NO ACCESS RESTRICTIONS - information only
 *
 * @accessibility
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - High contrast mode support
 * - Focus management
 *
 * @performance
 * - Streaming search results
 * - Optimized P2P queries
 * - Result caching and deduplication
 */

import { Component, createSignal, createEffect, onMount, onCleanup, Show, For } from 'solid-js';
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
  ChevronDown,
  Eye,
  Download,
  Share2,
  BookOpen,
  Wifi,
  WifiOff,
  Clock,
  MapPin,
  Zap,
} from 'lucide-solid';

// Foundation Components
import { Button } from '../../components/foundation/Button';
import { Card } from '../../components/foundation/Card';
import { Input } from '../../components/foundation/Input';
import { Select } from '../../components/foundation/Select';
import { Badge } from '../../components/foundation/Badge';
import { Loading } from '../../components/foundation/Loading';
import { Progress } from '../../components/foundation/Progress';

// Domain Components
import { DocumentCard } from '../../components/domain/document/DocumentCard';
import { CulturalIndicator } from '../../components/cultural/CulturalIndicator';
import { NetworkStatus } from '../../components/domain/network/NetworkStatus';
import { PeerCard } from '../../components/domain/network/PeerCard';

// Layout Components
import { MainLayout } from '../../components/layout/MainLayout';
import { PageHeader } from '../../components/layout/PageHeader';

// Hooks and Services
import { useNetworkSearch } from '../../hooks/api/useNetworkSearch';
import { usePeerNetwork } from '../../hooks/network/usePeerNetwork';
import { useCulturalContext } from '../../hooks/cultural/useCulturalContext';
import { useLocalStorage } from '../../hooks/data/useLocalStorage';

// Types
import type { Document } from '../../types/Document';
import type { Peer } from '../../types/Network';
import type { SearchQuery, SearchResult } from '../../types/Search';
import type { CulturalContext } from '../../types/Cultural';

// Styles
import styles from './SearchNetworkPage.module.css';

export interface SearchNetworkPageProps {
  /** Initial search query */
  initialQuery?: string;
  /** Initial view mode */
  initialViewMode?: 'grid' | 'list';
  /** Show cultural context by default */
  showCulturalContext?: boolean;
  /** Enable anonymous search */
  anonymousMode?: boolean;
}

export const SearchNetworkPage: Component<SearchNetworkPageProps> = props => {
  const navigate = useNavigate();

  // State Management
  const [searchQuery, setSearchQuery] = createSignal(props.initialQuery || '');
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>(props.initialViewMode || 'grid');
  const [showFilters, setShowFilters] = createSignal(false);
  const [showCulturalInfo, setShowCulturalInfo] = createSignal(props.showCulturalContext || false);
  const [anonymousMode, setAnonymousMode] = createSignal(props.anonymousMode || false);
  const [selectedPeers, setSelectedPeers] = createSignal<string[]>([]);
  const [searchScope, setSearchScope] = createSignal<'all' | 'trusted' | 'nearby'>('all');
  const [sortBy, setSortBy] = createSignal<'relevance' | 'date' | 'peers' | 'cultural-level'>(
    'relevance'
  );
  const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = createSignal<'results' | 'peers' | 'network'>('results');

  // Advanced search filters
  const [fileTypes, setFileTypes] = createSignal<string[]>([]);
  const [culturalLevels, setCulturalLevels] = createSignal<number[]>([]);
  const [dateRange, setDateRange] = createSignal<{ start?: Date; end?: Date }>({});
  const [minFileSize, setMinFileSize] = createSignal<number>(0);
  const [maxFileSize, setMaxFileSize] = createSignal<number>(0);

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

  const {
    connectedPeers,
    networkStatus,
    connectionQuality,
    connectToPeer,
    disconnectFromPeer,
    refreshPeers,
  } = usePeerNetwork();

  const { getCulturalContext, culturalEducationResources } = useCulturalContext();

  const [preferences, setPreferences] = useLocalStorage('searchNetwork-preferences', {
    viewMode: 'grid',
    showCulturalInfo: false,
    anonymousMode: false,
    searchScope: 'all',
  });

  // Search scope options
  const searchScopeOptions = [
    { value: 'all', label: 'All Peers' },
    { value: 'trusted', label: 'Trusted Peers Only' },
    { value: 'nearby', label: 'Nearby Peers' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date', label: 'Date Added' },
    { value: 'peers', label: 'Peer Count' },
    { value: 'cultural-level', label: 'Cultural Context Level' },
  ];

  // File type options
  const fileTypeOptions = [
    { value: 'pdf', label: 'PDF Documents' },
    { value: 'epub', label: 'EPUB Books' },
    { value: 'txt', label: 'Text Files' },
  ];

  // Perform network search
  const handleSearch = async () => {
    if (!searchQuery().trim()) return;

    const query: SearchQuery = {
      text: searchQuery(),
      fileTypes: fileTypes(),
      culturalLevels: culturalLevels(),
      dateRange: dateRange(),
      minFileSize: minFileSize(),
      maxFileSize: maxFileSize(),
      peers: selectedPeers(),
      scope: searchScope(),
      anonymous: anonymousMode(),
      sortBy: sortBy(),
      sortOrder: sortOrder(),
    };

    try {
      await searchNetwork(query);
    } catch (error) {
      console.error('Network search failed:', error);
    }
  };

  // Handle search input
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);

    // Auto-search after 500ms delay
    const timeoutId = setTimeout(() => {
      if (value.trim()) {
        handleSearch();
      }
    }, 500);

    // Cleanup previous timeout
    return () => clearTimeout(timeoutId);
  };

  // Handle document selection
  const handleDocumentOpen = (document: Document) => {
    navigate(`/documents/${document.id}`);
  };

  // Handle quick actions
  const handleQuickView = (document: Document) => {
    // TODO: Implement quick view modal
    console.log('Quick view:', document.title);
  };

  const handleDownload = (document: Document) => {
    // TODO: Implement P2P download functionality
    console.log('Download from network:', document.title);
  };

  const handleShare = (document: Document) => {
    // TODO: Implement P2P sharing functionality
    console.log('Share to network:', document.title);
  };

  // Handle peer selection
  const handlePeerToggle = (peerId: string) => {
    setSelectedPeers(prev =>
      prev.includes(peerId) ? prev.filter(id => id !== peerId) : [...prev, peerId]
    );
  };

  // Handle filter changes
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    setPreferences(prev => ({ ...prev, viewMode: mode }));
  };

  const handleCulturalInfoToggle = () => {
    const newValue = !showCulturalInfo();
    setShowCulturalInfo(newValue);
    setPreferences(prev => ({ ...prev, showCulturalInfo: newValue }));
  };

  const handleAnonymousModeToggle = () => {
    const newValue = !anonymousMode();
    setAnonymousMode(newValue);
    setPreferences(prev => ({ ...prev, anonymousMode: newValue }));
  };

  const handleSearchScopeChange = (scope: 'all' | 'trusted' | 'nearby') => {
    setSearchScope(scope);
    setPreferences(prev => ({ ...prev, searchScope: scope }));
  };

  // Initialize from preferences
  onMount(() => {
    const prefs = preferences();
    setViewMode(prefs.viewMode);
    setShowCulturalInfo(prefs.showCulturalInfo);
    setAnonymousMode(prefs.anonymousMode);
    setSearchScope(prefs.searchScope);

    // Auto-search if initial query provided
    if (props.initialQuery) {
      setTimeout(handleSearch, 100);
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    cancelSearch();
  });

  return (
    <MainLayout>
      <div class={styles.searchNetworkPage}>
        {/* Page Header */}
        <PageHeader
          title="Network Search"
          subtitle="Search documents across the P2P network"
          icon={<Network size={24} />}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Search', href: '/search' },
            { label: 'Network Search', href: '/search/network' },
          ]}
        />

        {/* Search Controls */}
        <div class={styles.searchControls}>
          <div class={styles.searchBar}>
            {/* Main Search Input */}
            <div class={styles.searchInputContainer}>
              <Search size={20} />
              <Input
                value={searchQuery()}
                onChange={handleSearchInput}
                placeholder="Search across the P2P network..."
                size="lg"
                class={styles.searchInput}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <Show when={isSearching()}>
                <Loading size="sm" class={styles.searchLoading} />
              </Show>
            </div>

            {/* Search Actions */}
            <div class={styles.searchActions}>
              <Button
                onClick={handleSearch}
                disabled={!searchQuery().trim() || isSearching()}
                size="lg"
              >
                {isSearching() ? 'Searching...' : 'Search Network'}
              </Button>

              <Show when={isSearching()}>
                <Button variant="outline" onClick={cancelSearch} size="lg">
                  Cancel
                </Button>
              </Show>
            </div>
          </div>

          {/* Search Options */}
          <div class={styles.searchOptions}>
            <div class={styles.searchOptionsLeft}>
              {/* Search Scope */}
              <div class={styles.searchScope}>
                <Globe size={16} />
                <Select
                  value={searchScope()}
                  onChange={handleSearchScopeChange}
                  options={searchScopeOptions}
                  size="sm"
                />
              </div>

              {/* Anonymous Mode Toggle */}
              <Button
                variant={anonymousMode() ? 'primary' : 'outline'}
                size="sm"
                onClick={handleAnonymousModeToggle}
                title="Enable anonymous search"
              >
                <Shield size={16} />
                Anonymous
              </Button>

              {/* Filter Toggle */}
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters())}>
                <Filter size={16} />
                Filters
                <ChevronDown
                  size={16}
                  class={showFilters() ? styles.chevronUp : styles.chevronDown}
                />
              </Button>
            </div>

            <div class={styles.searchOptionsRight}>
              {/* Cultural Info Toggle */}
              <Button
                variant={showCulturalInfo() ? 'primary' : 'outline'}
                size="sm"
                onClick={handleCulturalInfoToggle}
                title="Toggle cultural context display"
              >
                <BookOpen size={16} />
                Cultural Context
              </Button>

              {/* View Mode Toggle */}
              <div class={styles.viewModeToggle}>
                <Button
                  variant={viewMode() === 'grid' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleViewModeChange('grid')}
                  title="Grid view"
                >
                  <Grid size={16} />
                </Button>
                <Button
                  variant={viewMode() === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleViewModeChange('list')}
                  title="List view"
                >
                  <List size={16} />
                </Button>
              </div>

              {/* Sort Controls */}
              <div class={styles.sortControls}>
                <Select value={sortBy()} onChange={setSortBy} options={sortOptions} size="sm" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder() === 'asc' ? 'desc' : 'asc')}
                  title={`Sort ${sortOrder() === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {sortOrder() === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div class={styles.networkStatus}>
          <NetworkStatus
            status={networkStatus()}
            connectedPeers={connectedPeers().length}
            connectionQuality={connectionQuality()}
            anonymousMode={anonymousMode()}
          />
        </div>

        {/* Search Progress */}
        <Show when={isSearching() && searchProgress()}>
          <div class={styles.searchProgress}>
            <Card class={styles.progressCard}>
              <div class={styles.progressContent}>
                <div class={styles.progressHeader}>
                  <span class={styles.progressText}>
                    Searching {searchProgress()?.totalPeers} peers...
                  </span>
                  <span class={styles.progressStats}>
                    {searchProgress()?.completedPeers}/{searchProgress()?.totalPeers}
                  </span>
                </div>
                <Progress
                  value={searchProgress()?.completedPeers}
                  max={searchProgress()?.totalPeers}
                  class={styles.progressBar}
                />
              </div>
            </Card>
          </div>
        </Show>

        {/* Advanced Filters */}
        <Show when={showFilters()}>
          <div class={styles.filtersPanel}>
            <Card class={styles.filtersCard}>
              <div class={styles.filtersContent}>
                {/* File Type Filter */}
                <div class={styles.filterGroup}>
                  <label class={styles.filterLabel}>File Types</label>
                  <div class={styles.fileTypeFilter}>
                    <For each={fileTypeOptions}>
                      {option => (
                        <Button
                          variant={fileTypes().includes(option.value) ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setFileTypes(prev =>
                              prev.includes(option.value)
                                ? prev.filter(type => type !== option.value)
                                : [...prev, option.value]
                            );
                          }}
                        >
                          {option.label}
                        </Button>
                      )}
                    </For>
                  </div>
                </div>

                {/* Cultural Level Filter */}
                <div class={styles.filterGroup}>
                  <label class={styles.filterLabel}>Cultural Context Level</label>
                  <div class={styles.culturalLevelFilter}>
                    <For each={[1, 2, 3, 4, 5]}>
                      {level => (
                        <Button
                          variant={culturalLevels().includes(level) ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setCulturalLevels(prev =>
                              prev.includes(level)
                                ? prev.filter(l => l !== level)
                                : [...prev, level]
                            );
                          }}
                        >
                          Level {level}
                        </Button>
                      )}
                    </For>
                  </div>
                </div>

                {/* Peer Selection */}
                <div class={styles.filterGroup}>
                  <label class={styles.filterLabel}>Search Specific Peers</label>
                  <div class={styles.peerSelection}>
                    <For each={connectedPeers()}>
                      {peer => (
                        <div
                          class={`${styles.peerOption} ${selectedPeers().includes(peer.id) ? styles.selected : ''}`}
                          onClick={() => handlePeerToggle(peer.id)}
                        >
                          <div class={styles.peerInfo}>
                            <span class={styles.peerName}>{peer.name}</span>
                            <span class={styles.peerStats}>{peer.documentCount} docs</span>
                          </div>
                          <div class={styles.peerStatus}>
                            {peer.connected ? (
                              <Wifi size={16} class={styles.connected} />
                            ) : (
                              <WifiOff size={16} class={styles.disconnected} />
                            )}
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Show>

        {/* Cultural Education Resources */}
        <Show when={showCulturalInfo() && culturalEducationResources().length > 0}>
          <div class={styles.culturalResources}>
            <Card class={styles.culturalResourcesCard}>
              <div class={styles.culturalResourcesContent}>
                <h3 class={styles.culturalResourcesTitle}>
                  Cultural Context & Educational Resources
                </h3>
                <p class={styles.culturalResourcesDescription}>
                  Learn about the cultural contexts and traditional knowledge represented in network
                  documents. Information provided for educational purposes only.
                </p>
                <div class={styles.culturalResourcesList}>
                  <For each={culturalEducationResources()}>
                    {resource => (
                      <div class={styles.culturalResource}>
                        <CulturalIndicator
                          level={resource.level}
                          context={resource.context}
                          informationOnly={true}
                        />
                        <span class={styles.resourceTitle}>{resource.title}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Card>
          </div>
        </Show>

        {/* Main Content Tabs */}
        <div class={styles.contentTabs}>
          <div class={styles.tabButtons}>
            <Button
              variant={activeTab() === 'results' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('results')}
            >
              <Search size={16} />
              Results ({searchResults().length})
            </Button>
            <Button
              variant={activeTab() === 'peers' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('peers')}
            >
              <Users size={16} />
              Peers ({connectedPeers().length})
            </Button>
            <Button
              variant={activeTab() === 'network' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('network')}
            >
              <Network size={16} />
              Network Map
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div class={styles.tabContent}>
          {/* Search Results Tab */}
          <Show when={activeTab() === 'results'}>
            <div class={styles.resultsContainer}>
              <Show when={error()}>
                <div class={styles.errorContainer}>
                  <Card class={styles.errorCard}>
                    <div class={styles.errorContent}>
                      <h3>Search Error</h3>
                      <p>{error()}</p>
                      <Button onClick={handleSearch}>Try Again</Button>
                    </div>
                  </Card>
                </div>
              </Show>

              <Show
                when={!isSearching() && !error() && searchResults().length === 0 && searchQuery()}
              >
                <div class={styles.emptyState}>
                  <Card class={styles.emptyStateCard}>
                    <div class={styles.emptyStateContent}>
                      <Search size={48} class={styles.emptyStateIcon} />
                      <h3>No Results Found</h3>
                      <p>No documents found for "{searchQuery()}" across the network.</p>
                      <Button onClick={() => setShowFilters(true)} variant="outline">
                        Adjust Filters
                      </Button>
                    </div>
                  </Card>
                </div>
              </Show>

              <Show when={searchResults().length > 0}>
                <div class={`${styles.resultsGrid} ${styles[viewMode()]}`}>
                  <For each={searchResults()}>
                    {result => (
                      <DocumentCard
                        document={result.document}
                        viewMode={viewMode()}
                        showCulturalContext={showCulturalInfo()}
                        networkResult={true}
                        peerInfo={result.peer}
                        onOpen={() => handleDocumentOpen(result.document)}
                        onQuickView={() => handleQuickView(result.document)}
                        onDownload={() => handleDownload(result.document)}
                        onShare={() => handleShare(result.document)}
                        quickActions={[
                          {
                            icon: <Eye size={16} />,
                            label: 'Quick View',
                            onClick: () => handleQuickView(result.document),
                          },
                          {
                            icon: <Download size={16} />,
                            label: 'Download from Network',
                            onClick: () => handleDownload(result.document),
                          },
                          {
                            icon: <Share2 size={16} />,
                            label: 'Share',
                            onClick: () => handleShare(result.document),
                          },
                        ]}
                      />
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </Show>

          {/* Peers Tab */}
          <Show when={activeTab() === 'peers'}>
            <div class={styles.peersContainer}>
              <div class={styles.peersGrid}>
                <For each={connectedPeers()}>
                  {peer => (
                    <PeerCard
                      peer={peer}
                      showCulturalContext={showCulturalInfo()}
                      onConnect={() => connectToPeer(peer.id)}
                      onDisconnect={() => disconnectFromPeer(peer.id)}
                    />
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Network Map Tab */}
          <Show when={activeTab() === 'network'}>
            <div class={styles.networkMapContainer}>
              <Card class={styles.networkMapCard}>
                <div class={styles.networkMapContent}>
                  <h3>Network Topology</h3>
                  <p>Interactive network map coming soon...</p>
                  {/* TODO: Implement network visualization */}
                </div>
              </Card>
            </div>
          </Show>
        </div>

        {/* Results Summary */}
        <Show when={searchResults().length > 0}>
          <div class={styles.resultsSummary}>
            <p class={styles.resultsText}>
              Found {searchResults().length} documents across {connectedPeers().length} peers
              {anonymousMode() && ' (anonymous mode)'}
            </p>
          </div>
        </Show>
      </div>
    </MainLayout>
  );
};

export default SearchNetworkPage;
