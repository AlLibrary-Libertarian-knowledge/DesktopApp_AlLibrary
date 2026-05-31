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

// Domain Components
import { NetworkFileCard } from '../../components/domain/network/NetworkFileCard';
import { NetworkStatus } from '../../components/domain/network/NetworkStatus';
import { OnionStatusBar } from '../../components/domain/network/OnionStatusBar';
import { TransferQueuePanel } from '@/components/domain/network/TransferQueuePanel';

// Hooks and Services
import { useNetworkSearch, type NetworkSearchResult } from '../../hooks/api/useNetworkSearch';
import { useNetworkLobby } from '../../hooks/api/useNetworkLobby';
import { enableTorAndP2P } from '../../services/network/bootstrap';
import { useTransferState } from '@/hooks/api/useTransferState';
import { useNetworkStore } from '@/stores/network/networkStore';
import { useNetworkPresenceResource } from '@/hooks/network/useNetworkPresence';
import { useToast } from '@/hooks/ui/useToast';
import { downloadWithToast } from '@/utils/downloadActions';

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
  const transfer = useTransferState();
  const toast = useToast();
  const [hash, setHash] = createSignal('');
  const [downloadError, setDownloadError] = createSignal<string | null>(null);

  // State Management
  const [searchQuery, setSearchQuery] = createSignal(props.initialQuery || '');
  const [activeTab, setActiveTab] = createSignal<'search' | 'results'>('results');
  // const [viewMode, setViewMode] = createSignal<'grid' | 'list'>(props.initialViewMode || 'grid');
  const [showFilters, setShowFilters] = createSignal(false);
  const [anonymousMode, setAnonymousMode] = createSignal(props.anonymousMode || false);
  const [torEstablishing, setTorEstablishing] = createSignal(false);
  const [autoSearchDone, setAutoSearchDone] = createSignal(false);
  const [downloadingAll, setDownloadingAll] = createSignal(false);

  const { presence } = useNetworkPresenceResource();

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
      await enableTorAndP2P();
    } catch {
      /* surfaced via presence hook */
    } finally {
      setTorEstablishing(false);
    }
  };

  onMount(() => {
    const keyHandler = (ev: KeyboardEvent) => {
      const isMac = navigator.platform.includes('Mac');
      if ((isMac ? ev.metaKey : ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        searchInputEl?.focus();
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => {
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

  const canDownload = () =>
    presence().onionActive || (transfer.onionRunning() && Boolean(transfer.onionAddress()));

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

  const handleFileDownload = async (result: NetworkSearchResult) => {
    setDownloadError(null);
    const target = result.swarmLink || result.document.filePath || result.document.id;
    await downloadWithToast(
      result.document.title,
      () => transfer.startDownload(target, result.document.title),
      toast
    );
  };

  const handleDownloadAll = async () => {
    if (!canDownload() || !results()?.length) return;
    setDownloadingAll(true);
    setDownloadError(null);
    try {
      for (const r of results() ?? []) {
        if (r.peerCount <= 0) continue;
        await downloadWithToast(
          r.document.title,
          () =>
            transfer.startDownload(
              r.swarmLink || r.document.filePath || r.document.id,
              r.document.title
            ),
          toast
        );
      }
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
            <OnionStatusBar
              variant="toolbar"
              onStartOnion={onEnableTorClick}
              startingOnion={torEstablishing()}
            />
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
                        disabled={transfer.busy() || !hash().trim() || !canDownload()}
                        onClick={async () => {
                          setDownloadError(null);
                          try {
                            await downloadWithToast(
                              hash().trim(),
                              () => transfer.startDownload(hash().trim(), hash().trim()),
                              toast
                            );
                          } catch (e) {
                            setDownloadError(e instanceof Error ? e.message : String(e));
                          }
                        }}
                      >
                        <Download size={14} class="mr-2" />
                        Download
                      </Button>
                      <Show when={downloadError() || transfer.error()}>
                        <p class={styles['download-error']} role="alert">
                          {downloadError() || transfer.error()}
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
                trendType={presence().onionActive ? 'positive' : 'neutral'}
                trendIcon={<ArrowRight size={12} />}
                trendValue={presence().onionActive ? 'Live' : 'Cached'}
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
                  disabled={
                    !results()?.length || transfer.busy() || downloadingAll() || !canDownload()
                  }
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

            <Show when={transfer.hasActiveDownloads()}>
              <TransferQueuePanel
                variant="compact"
                showOutbound={false}
                class={styles['transfer-queue']}
              />
            </Show>

            <Show when={results() && results()!.length > 0}>
              <div class={styles['results-grid']}>
                <For each={results()}>
                  {result => (
                    <NetworkFileCard
                      contentHash={result.document.id}
                      name={result.document.title}
                      size={result.document.fileSize}
                      link={result.document.filePath || ''}
                      peerCount={result.peerCount}
                      canDownload={canDownload()}
                      downloadProgress={transfer.findActiveProgress(result.document.id)}
                      onOpen={() => handleDocumentOpen(result.document)}
                      onDownload={() => handleFileDownload(result)}
                      onDownloadError={msg => setDownloadError(msg)}
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
