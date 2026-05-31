/**
 * SearchNetworkPage - P2P Network Search Interface
 * Enhanced to match HomePage and DocumentManagement sophisticated patterns
 */

import { type Component, createSignal, onMount, Show, For, createEffect } from 'solid-js';
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
import { useNetworkLobby } from '../../hooks/api/useNetworkLobby';
import { enableTorAndP2P } from '../../services/network/bootstrap';
import { useP2PTransfers } from '@/hooks/api/useP2PTransfers';
import { transferFacade } from '@/services/network/transferFacade';
import { networkFacade } from '@/services/network/networkFacade';
import { fetchNetworkPresence } from '@/services/network/onionShareService';
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
  const { busy, downloadByHash, error: transferError } = useP2PTransfers();
  const [hash, setHash] = createSignal('');
  const [downloadError, setDownloadError] = createSignal<string | null>(null);

  // State Management
  const [searchQuery, setSearchQuery] = createSignal(props.initialQuery || '');
  const [activeTab, setActiveTab] = createSignal<'search' | 'results'>('results');
  // const [viewMode, setViewMode] = createSignal<'grid' | 'list'>(props.initialViewMode || 'grid');
  const [showFilters, setShowFilters] = createSignal(false);
  const [anonymousMode, setAnonymousMode] = createSignal(props.anonymousMode || false);
  const [onionRunning, setOnionRunning] = createSignal(false);
  const [onionActive, setOnionActive] = createSignal(false);
  const [syncStale, setSyncStale] = createSignal(false);
  const [torEstablishing, setTorEstablishing] = createSignal(false);
  const [autoSearchDone, setAutoSearchDone] = createSignal(false);
  const [downloadingAll, setDownloadingAll] = createSignal(false);

  // Search filters
  const [fileTypes, setFileTypes] = createSignal<string[]>([]);
  // const [culturalLevels, setCulturalLevels] = createSignal<number[]>([]);

  // Hooks
  const { results, isSearching, search } = useNetworkSearch();
  const lobby = useNetworkLobby();
  const net = useNetworkStore();
  let searchInputEl: HTMLInputElement | undefined;
  const onEnableTorClick = async () => {
    try {
      setTorEstablishing(true);
      const result = await enableTorAndP2P();
      setOnionRunning(result.torConnected && result.p2pStarted);
      setOnionActive(result.torConnected && result.p2pStarted);
    } catch (e) {
      void e;
      setOnionRunning(false);
      setOnionActive(false);
    } finally {
      setTorEstablishing(false);
    }
  };

  const refreshPresence = async () => {
    try {
      const p = await fetchNetworkPresence();
      setOnionRunning(p.online);
      setOnionActive(p.onionActive);
      const diag = await networkFacade.getSyncDiagnostics();
      setSyncStale(diag != null && !diag.ok);
    } catch {
      setOnionRunning(false);
      setOnionActive(false);
    }
  };

  onMount(() => {
    void refreshPresence();
    const timer = globalThis.setInterval(() => void refreshPresence(), 4000) as unknown as number;
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
      window.removeEventListener('keydown', keyHandler);
    };
  });

  createEffect(() => {
    if (!autoSearchDone()) {
      setAutoSearchDone(true);
      void handleSearch();
    }
  });

  createEffect(() => {
    fileTypes();
    if (autoSearchDone()) {
      void handleSearch();
    }
  });

  const formatTotalSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KiB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  };

  const lobbyTotalSize = () => formatTotalSize(lobby.totalBytes());

  const resultsTotalSize = () => {
    const bytes = (results() ?? []).reduce((sum, r) => sum + (r.document.fileSize || 0), 0);
    return formatTotalSize(bytes);
  };

  const canDownload = () => onionRunning() && onionActive();

  const handleSearch = async () => {
    setActiveTab('results');
    try {
      await search(
        {
          query: searchQuery().trim(),
          extensions: fileTypes().length ? fileTypes() : undefined,
        },
        { anonymous: anonymousMode() }
      );
      document.getElementById('resultsTop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      void e;
    }
  };

  const handleDownloadAll = async () => {
    if (!canDownload() || !results()?.length) return;
    setDownloadingAll(true);
    setDownloadError(null);
    try {
      const items = (results() ?? []).map(r => ({
        link: r.document.filePath || '',
        name: r.document.title || r.document.id,
      }));
      await transferFacade.downloadAll(items);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : String(e));
    } finally {
      setDownloadingAll(false);
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
        subtitle="Distributed search across the P2P network"
        rightContent={
          <div class={styles['network-status-enhanced']}>
            <NetworkStatus variant="default" />
            <div class={styles['tor-pill']} data-on={onionActive() ? '1' : '0'}>
              {onionActive() ? 'Onion' : onionRunning() ? 'Bootstrapping' : 'Cache only'}
            </div>
            <Show when={!onionActive() && !torEstablishing()}>
              <Button variant="outline" size="sm" onClick={() => void onEnableTorClick()}>
                Start onion share
              </Button>
            </Show>
            <Show when={torEstablishing()}>
              <span class={styles['tor-pill']}>Starting…</span>
            </Show>
            <Show when={syncStale()}>
              <span class={styles['tor-pill']} title="Lobby sync failed — showing cached results">
                Stale cache
              </span>
            </Show>
          </div>
        }
      />

      {/* Minimal tabs for clarity */}
      <div class={styles['contentTabs']}>
        <div class={styles['tabButtons']}>
          <button
            class={`${activeTab() === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search size={16} />
            &nbsp;Overview
          </button>
          <button
            class={`${activeTab() === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <BookOpen size={16} />
            &nbsp;Search Results
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
                  <div class={styles['searchOptionsRight']}>
                    <div>
                      <Input
                        type="text"
                        placeholder="Download by hash"
                        value={hash()}
                        onInput={v => setHash(v)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy() || !hash().trim()}
                        onClick={async () => {
                          setDownloadError(null);
                          try {
                            await downloadByHash(hash().trim(), '', hash().trim());
                          } catch (e) {
                            setDownloadError(e instanceof Error ? e.message : String(e));
                          }
                        }}
                      >
                        <Download size={14} class="mr-2" />
                        Download
                      </Button>
                      <Show when={downloadError() || transferError()}>
                        <p class={styles['download-error']} role="alert">
                          {downloadError() || transferError()}
                        </p>
                      </Show>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters())}
                    >
                      <Filter size={16} class="mr-2" />
                      {showFilters() ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                  </div>
                </div>

                <div class={styles['searchInputContainer']}>
                  <Search size={20} />
                  <Input
                    type="text"
                    placeholder="Search documents across the P2P network..."
                    value={searchQuery()}
                    onInput={handleSearchInput}
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                    ref={(el: HTMLInputElement) => {
                      searchInputEl = el;
                    }}
                    class={styles['searchInput'] as unknown as string}
                  />
                  <div class={styles['searchActions']}>
                    <Button variant="primary" onClick={handleSearch} disabled={isSearching()}>
                      {isSearching() ? 'Searching...' : 'Search Network'}
                    </Button>
                  </div>
                </div>

                {/* Filters with smooth expand */}
                <div
                  class={styles['filtersPanel']}
                  data-open={showFilters() ? '1' : '0'}
                  aria-hidden={!showFilters()}
                  aria-expanded={showFilters()}
                >
                  <div class={styles['searchOptions']}>
                    <div class={styles['searchOptionsLeft']}>
                      <label>Scope (coming soon)</label>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="Peer trust filtering is not available yet"
                        >
                          All Peers
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="Peer trust filtering is not available yet"
                        >
                          Trusted Only
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="Peer trust filtering is not available yet"
                        >
                          Nearby Peers
                        </Button>
                      </div>
                    </div>
                    <div class={styles['searchOptionsRight']}>
                      <label>Types</label>
                      <div>
                        <Button
                          variant={fileTypes().includes('pdf') ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const types = fileTypes();
                            setFileTypes(
                              types.includes('pdf')
                                ? types.filter(t => t !== 'pdf')
                                : [...types, 'pdf']
                            );
                          }}
                        >
                          PDF
                        </Button>
                        <Button
                          variant={fileTypes().includes('epub') ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const types = fileTypes();
                            setFileTypes(
                              types.includes('epub')
                                ? types.filter(t => t !== 'epub')
                                : [...types, 'epub']
                            );
                          }}
                        >
                          EPUB
                        </Button>
                        <Button
                          variant={anonymousMode() ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setAnonymousMode(!anonymousMode())}
                        >
                          <Shield size={16} />
                          &nbsp;Anonymous
                        </Button>
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
                number={`${lobby.onlineNodes()}`}
                label="Nodes Online"
                trendType="neutral"
                trendIcon={<ArrowRight size={12} />}
                trendValue="live"
                graphType="peers"
              />
              <StatCard
                type="documents"
                icon={<BookOpen size={20} />}
                number={String(lobby.files().length)}
                label="Lobby Files"
                trendType="neutral"
                trendIcon={<ArrowRight size={12} />}
                trendValue="cached"
                graphType="chart"
              />
              <StatCard
                type="health"
                icon={<Shield size={20} />}
                number={lobbyTotalSize()}
                label="Lobby Total Size"
                trendType={onionActive() ? 'positive' : 'neutral'}
                trendIcon={<ArrowRight size={12} />}
                trendValue={onionActive() ? 'Live' : 'Cached'}
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
                <span>
                  {results()?.length ?? 0} files · {resultsTotalSize()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!results()?.length || busy() || downloadingAll() || !canDownload()}
                  onClick={() => void handleDownloadAll()}
                >
                  <Download size={14} class="mr-2" />
                  {downloadingAll() ? 'Queueing…' : 'Download All'}
                </Button>
              </div>
            </div>
            <Show when={!canDownload() && (results()?.length ?? 0) > 0}>
              <p class={styles['download-error']}>
                Start onion share from Sharing &amp; Downloads to download network files.
              </p>
            </Show>

            <Show when={isSearching()}>
              <div class={styles['search-progress']}>
                <LoadingSpinner
                  variant="ring"
                  size="md"
                  message={`Searching across ${net.connectedPeers()} connected peers...`}
                  showMessage
                />
              </div>
              <div class={styles['skeleton-grid']}>
                <For each={[1, 2, 3, 4, 5, 6]}>{() => <div class={styles['skeleton-card']} />}</For>
              </div>
            </Show>

            <Show when={downloadError() && activeTab() === 'results'}>
              <p class={styles['download-error']} role="alert">
                {downloadError()}
              </p>
            </Show>

            <Show when={results() && results()!.length > 0}>
              <div class={styles['results-grid']}>
                <For each={results()}>
                  {(result: any) => (
                    <DocumentCard
                      document={result.document}
                      onOpen={() => handleDocumentOpen(result.document)}
                      onDownload={async doc => {
                        setDownloadError(null);
                        try {
                          const result = results()?.find(r => r.document.id === doc.id);
                          const link = result?.document.filePath || '';
                          if (link) {
                            await transferFacade.downloadLink(link, doc.title);
                          } else {
                            await transferFacade.downloadByHashOrLink(doc.id, doc.title);
                          }
                        } catch (e) {
                          const msg = e instanceof Error ? e.message : String(e);
                          setDownloadError(msg);
                        }
                      }}
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
