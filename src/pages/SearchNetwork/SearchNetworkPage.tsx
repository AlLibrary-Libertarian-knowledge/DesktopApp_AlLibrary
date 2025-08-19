/**
 * SearchNetworkPage - P2P Network Search Interface
 * Enhanced to match HomePage and DocumentManagement sophisticated patterns
 */

import { Component, createSignal, onMount, Show, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Search, Shield, Filter, Download, BookOpen, ArrowRight, Users } from 'lucide-solid';

// Foundation Components
import { Button } from '../../components/foundation/Button';
import { Input } from '../../components/foundation/Input';
import { TopCard } from '@/components/composite/TopCard';
import StatCard from '@/components/composite/StatCard/StatCard';
import LoadingSpinner from '@/components/foundation/LoadingSpinner/LoadingSpinner';

// Composite Components
// Removed mocked stat/activity components; we will show only real metrics

// Domain Components
import { DocumentCard } from '../../components/domain/document/DocumentCard';
import { NetworkStatus } from '../../components/domain/network/NetworkStatus';

// Hooks and Services
import { useNetworkSearch } from '../../hooks/api/useNetworkSearch';
import { enableTorAndP2P } from '../../services/network/bootstrap';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';
import { useP2PTransfers } from '@/hooks/api/useP2PTransfers';
import { torAdapter } from '../../services/network/torAdapter';
import { useNetworkStore } from '@/stores/network/networkStore';

// Types
import type { Document } from '@/types/core';

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
  const { enabled, busy, enable, downloadByHash } = useP2PTransfers();
  const [hash, setHash] = createSignal('');

  // State Management
  const [searchQuery, setSearchQuery] = createSignal(props.initialQuery || '');
  const [activeTab, setActiveTab] = createSignal<'search' | 'results'>('search');
  // const [viewMode, setViewMode] = createSignal<'grid' | 'list'>(props.initialViewMode || 'grid');
  const [showFilters, setShowFilters] = createSignal(false);
  const [anonymousMode, setAnonymousMode] = createSignal(props.anonymousMode || false);
  const [searchScope, setSearchScope] = createSignal<'all' | 'trusted' | 'nearby'>('all');
  // const [sortBy, setSortBy] = createSignal<'relevance' | 'date' | 'peers'>('relevance');
  const [torReady, setTorReady] = createSignal(false);
  // const [torBootstrapped, setTorBootstrapped] = createSignal(false);
  const [torEstablishing, setTorEstablishing] = createSignal(false);

  // Search filters
  const [fileTypes, setFileTypes] = createSignal<string[]>([]);
  // const [culturalLevels, setCulturalLevels] = createSignal<number[]>([]);

  // Hooks
  const { results, isSearching, search } = useNetworkSearch();
  const net = useNetworkStore();
  let searchInputEl: HTMLInputElement | undefined;
  const onEnableTorClick = async () => {
    try {
      setTorEstablishing(true);
      const result = await enableTorAndP2P();
      setTorReady(result.torConnected && result.p2pStarted);
      if (result.torConnected && result.p2pStarted) {
        // Auto seed existing files and start watching for changes
        void p2pNetworkService.seedLibraryFolder();
        void p2pNetworkService.watchAndSeedLibrary();
      }
    } catch (e) {
      void e;
      setTorReady(false);
    }
    finally {
      setTorEstablishing(false);
    }
  };

  // Periodically poll tor status for header pill and circuit banner
  onMount(() => {
    let timer = 0 as unknown as number; // initialized for cleanup
    const tick = async () => {
      try {
        const status = await torAdapter.status();
        setTorReady(!!status?.circuitEstablished);
      } catch (e) { void e; }
    };
    tick();
    timer = globalThis.setInterval(tick, 4000) as unknown as number;
    const handler = () => { /* event -> refresh */ void tick(); };
    window.addEventListener('tor-status-updated', handler as any);
    // Global shortcut: Ctrl/Cmd+K focuses search
    const keyHandler = (ev: KeyboardEvent) => {
      const isMac = navigator.platform.includes('Mac');
      if ((isMac ? ev.metaKey : ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        searchInputEl?.focus();
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => {
      globalThis.clearInterval(timer);
      window.removeEventListener('tor-status-updated', handler as any);
      window.removeEventListener('keydown', keyHandler);
    };
  });

  // Removed mocked activity/stats

  // Title-only, Tor-gated search interface
  const handleSearch = async () => {
    if (!searchQuery().trim()) return;
    if (!torReady()) return;
    setActiveTab('results');
    try {
      await search({ query: searchQuery().trim() }, { anonymous: anonymousMode() });
      // Smooth-scroll to results
      document.getElementById('resultsTop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      // surface via store
      void e;
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
  };

  const handleDocumentOpen = (document: Document) => {
    navigate(`/document/${document.id}`);
  };

  // Removed unused hasSearched state

  return (
    <div class={styles['search-network-page']}>
      {/* Futuristic header using existing TopCard component */}
      <TopCard
        title="Network Search Hub"
        subtitle="Distributed search across decentralized cultural heritage network"
        rightContent={
          <div class={styles['network-status-enhanced']}>
            <NetworkStatus variant="default" />
            <div class={styles['tor-pill']} data-on={torReady() ? '1' : '0'}>{torReady() ? 'Onion' : 'No Onion'}</div>
        </div>
        }
      />

      {/* Minimal tabs for clarity */}
      <div class={styles['contentTabs']}>
        <div class={styles['tabButtons']}>
          <button class={`${activeTab() === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
            <Search size={16} />&nbsp;Overview
          </button>
          <button class={`${activeTab() === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
            <BookOpen size={16} />&nbsp;Search Results
          </button>
        </div>
      </div>

      <div class={styles['dashboard-content']}>
        {/* Search Interface Tab */}
        {activeTab() === 'search' && (
          <>
            {/* Network Statistics removed (mocked). Live info shown in header. */}

            {/* Enhanced Search Interface */}
            <section class={styles['searchControls']}>
              <div class={styles['searchBar']}>
                <div class={styles['searchOptions']}>
                  <Button variant={torReady() ? 'outline' : 'primary'} size="sm" onClick={onEnableTorClick} disabled={torEstablishing()}>
                    <Shield size={16} class="mr-2" />
                    {torReady() ? 'TOR Enabled' : torEstablishing() ? 'Enabling…' : 'Enable TOR Search'}
                  </Button>
                  <Button variant={enabled() ? 'outline' : 'primary'} size="sm" onClick={enable} disabled={busy()}>
                    {enabled() ? 'Private Networking Enabled' : 'Enable Private Networking'}
                  </Button>
                  <div class={styles['searchOptionsRight']}>
                    <div>
                      <Input type="text" placeholder="Download by hash" value={hash()} onInput={(v) => setHash(v)} />
                      <Button variant="outline" size="sm" disabled={!enabled() || busy() || !hash().trim()} onClick={() => downloadByHash(hash().trim(), (window as any).api?.downloadsDir ?? 'downloads')}>
                        <Download size={14} class="mr-2" />
                        Download
                      </Button>
                    </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters())}>
                    <Filter size={16} class="mr-2" />
                    {showFilters() ? 'Hide Filters' : 'Show Filters'}
                  </Button>
                  </div>
              </div>

                <div class={styles['searchInputContainer']}>
                  <Search size={20} />
                    <Input
                      type="text"
                      placeholder="Search cultural heritage documents across P2P network..."
                      value={searchQuery()}
                    onInput={handleSearchInput}
                    onKeyDown={(e: any) => { if (e.key === 'Enter') handleSearch(); }}
                    ref={(el: HTMLInputElement) => { searchInputEl = el; }}
                    class={styles['searchInput'] as unknown as string}
                  />
                  <div class={styles['searchActions']}>
                      <Button
                        variant="primary"
                        onClick={handleSearch}
                      disabled={!searchQuery().trim() || isSearching() || !torReady()}
                      >
                        {isSearching() ? 'Searching...' : 'Search Network'}
                      </Button>
                    </div>
                  </div>

                {/* Filters with smooth expand */}
                <div class={styles['filtersPanel']} data-open={showFilters() ? '1' : '0'} aria-hidden={!showFilters()} aria-expanded={showFilters()}>
                  <div class={styles['searchOptions']}>
                    <div class={styles['searchOptionsLeft']}>
                      <label>Scope</label>
                      <div>
                        <Button variant={searchScope() === 'all' ? 'primary' : 'outline'} size="sm" onClick={() => setSearchScope('all')}>All Peers</Button>
                        <Button variant={searchScope() === 'trusted' ? 'primary' : 'outline'} size="sm" onClick={() => setSearchScope('trusted')}>Trusted Only</Button>
                        <Button variant={searchScope() === 'nearby' ? 'primary' : 'outline'} size="sm" onClick={() => setSearchScope('nearby')}>Nearby Peers</Button>
                      </div>
                        </div>
                    <div class={styles['searchOptionsRight']}>
                      <label>Types</label>
                      <div>
                        <Button variant={fileTypes().includes('pdf') ? 'primary' : 'outline'} size="sm" onClick={() => { const types = fileTypes(); setFileTypes(types.includes('pdf') ? types.filter(t => t !== 'pdf') : [...types, 'pdf']); }}>PDF</Button>
                        <Button variant={fileTypes().includes('epub') ? 'primary' : 'outline'} size="sm" onClick={() => { const types = fileTypes(); setFileTypes(types.includes('epub') ? types.filter(t => t !== 'epub') : [...types, 'epub']); }}>EPUB</Button>
                        <Button variant={anonymousMode() ? 'primary' : 'outline'} size="sm" onClick={() => setAnonymousMode(!anonymousMode())}><Shield size={16} />&nbsp;Anonymous</Button>
                      </div>
                    </div>
                </div>
                </div>
              </div>
            </section>

            {/* Quick metrics ribbon using StatCard */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <StatCard
                type="peers"
                icon={<Users size={20} />}
                number={`${net.connectedPeers()}`}
                label="Connected Peers"
                trendType="neutral"
                trendIcon={<ArrowRight size={12} />}
                trendValue="live"
                graphType="peers"
              />
              <StatCard
                type="documents"
                icon={<BookOpen size={20} />}
                number={String(results()?.length || 0)}
                label="Results"
                trendType="neutral"
                trendIcon={<ArrowRight size={12} />}
                trendValue="now"
                graphType="chart"
              />
              <StatCard
                type="health"
                icon={<Shield size={20} />}
                number={torReady() ? 'Onion' : 'No Onion'}
                label="Routing"
                trendType={torReady() ? 'positive' : 'neutral'}
                trendIcon={<ArrowRight size={12} />}
                trendValue="status"
                graphType="health"
              />
            </div>

            {/* Removed bulk toolbar for streamlined UI */}

            {/* Network Activity Preview removed until wired with live events */}
          </>
        )}

        {/* Search Results Tab */}
        {activeTab() === 'results' && (
          <section class={styles['results-section']} id="resultsTop" aria-live="polite">
            <div class={styles['section-header']}>
              <h2>Search Results</h2>
              <div class={styles['result-controls']}>
                <Button variant="outline" size="sm">
                  <Download size={14} class="mr-2" />
                  Download All
                </Button>
              </div>
            </div>

            <Show when={isSearching()}>
              <div class={styles['search-progress']}>
                <LoadingSpinner variant="ring" size="md" message={`Searching across ${net.connectedPeers()} connected peers...`} showMessage />
              </div>
              <div class={styles['skeleton-grid']}>
                <For each={[1,2,3,4,5,6]}>{() => <div class={styles['skeleton-card']} />}</For>
              </div>
            </Show>

            <Show when={results() && results()!.length > 0}>
              <div class={styles['results-grid']}>
                <For each={results()}>
                  {(result: any) => (
                    <DocumentCard
                      document={result.document}
                      onOpen={() => handleDocumentOpen(result.document)}
                      showCulturalContext={true}
                      variant="default"
                    />
                  )}
                </For>
              </div>
            </Show>

            <Show when={!isSearching() && results()?.length === 0}>
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

        {/* Network Activity Tab intentionally minimal until live events wiring */}
      </div>
    </div>
  );
};

export default SearchNetworkPage;
