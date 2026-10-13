/**
 * SearchNetworkPage - P2P Network Search Interface
 */

import { type Component, createSignal, onMount, Show, For } from 'solid-js';
import { useNavigate, useSearchParams } from '@solidjs/router';
import { Search, Shield, Filter, Download, BookOpen, Users, HardDrive } from 'lucide-solid';

import { Button } from '../../components/foundation/Button';
import { TopCard } from '@/components/composite/TopCard';
import LoadingSpinner from '@/components/foundation/LoadingSpinner/LoadingSpinner';

import { NetworkFileCard } from '../../components/domain/network/NetworkFileCard';
import { OnionStatusBar } from '../../components/domain/network/OnionStatusBar';
import { TransferQueuePanel } from '@/components/domain/network/TransferQueuePanel';

import { useNetworkSearch, type NetworkSearchResult } from '../../hooks/api/useNetworkSearch';
import { useNetworkLobby } from '../../hooks/api/useNetworkLobby';
import { enableTorAndP2P } from '../../services/network/bootstrap';
import { useTransferState } from '@/hooks/api/useTransferState';
import { useNetworkStore } from '@/stores/network/networkStore';
import { useNetworkPresenceResource } from '@/hooks/network/useNetworkPresence';
import { useToast } from '@/hooks/ui/useToast';
import { downloadWithToast } from '@/utils/downloadActions';
import { documentService } from '@/services/documentService';

import styles from './SearchNetworkPage.module.css';

export interface SearchNetworkPageProps {
  initialQuery?: string;
  initialViewMode?: 'grid' | 'list';
  showCulturalContext?: boolean;
  anonymousMode?: boolean;
}

export const SearchNetworkPage: Component<SearchNetworkPageProps> = props => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const transfer = useTransferState();
  const toast = useToast();
  const [hash, setHash] = createSignal('');
  const [downloadError, setDownloadError] = createSignal<string | null>(null);

  const queryFromUrl = () => {
    const q = searchParams.q;
    return (Array.isArray(q) ? q[0] : q)?.trim() || '';
  };

  const [searchQuery, setSearchQuery] = createSignal(props.initialQuery || queryFromUrl());
  const [hasSearched, setHasSearched] = createSignal(false);
  const [showFilters, setShowFilters] = createSignal(false);
  const [anonymousMode, setAnonymousMode] = createSignal(props.anonymousMode || false);
  const [torEstablishing, setTorEstablishing] = createSignal(false);
  const [downloadingAll, setDownloadingAll] = createSignal(false);

  const { presence } = useNetworkPresenceResource();
  const [fileTypes, setFileTypes] = createSignal<string[]>([]);

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
    setHasSearched(true);
    setDownloadError(null);
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

  onMount(() => {
    const keyHandler = (ev: KeyboardEvent) => {
      const isMac = navigator.platform.includes('Mac');
      if ((isMac ? ev.metaKey : ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        searchInputEl?.focus();
      }
    };
    window.addEventListener('keydown', keyHandler);

    const initial = (props.initialQuery || queryFromUrl()).trim();
    if (initial) {
      setSearchQuery(initial);
      void handleSearch();
    }

    return () => {
      window.removeEventListener('keydown', keyHandler);
    };
  });

  // Swarm-first so multi-seeder parallel fetch is used whenever possible.
  const downloadTargetFor = (result: NetworkSearchResult) =>
    result.swarmLink || result.document.id || result.directLink || result.document.filePath;

  const handleFileDownload = async (result: NetworkSearchResult) => {
    setDownloadError(null);
    const target = downloadTargetFor(result);
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
          () => transfer.startDownload(downloadTargetFor(r), r.document.title),
          toast
        );
      }
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : String(e));
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleDocumentOpen = async (result: NetworkSearchResult) => {
    const resolved = await documentService.resolveDocumentById(result.document.id);
    if (resolved?.source === 'local' && resolved.filePath) {
      navigate(documentService.buildDocumentUrl(resolved.id));
      return;
    }
    toast.info('Download this file first — it will open in the reader once saved to your library.');
  };

  const toggleFileType = (type: string) => {
    const types = fileTypes();
    setFileTypes(types.includes(type) ? types.filter(t => t !== type) : [...types, type]);
  };

  return (
    <div class={styles['search-network-page']}>
      <TopCard
        title="Network Search Hub"
        subtitle="Distributed search across the P2P network"
        rightContent={
          <div class={styles['network-status-enhanced']}>
            <OnionStatusBar
              variant="toolbar"
              onStartOnion={onEnableTorClick}
              startingOnion={torEstablishing()}
            />
          </div>
        }
      />

      <div class={styles['dashboard-content']}>
        <section class={styles.searchControls} aria-label="Network search">
          <div class={styles.searchBar}>
            <div class={styles.searchInputContainer}>
              <Search size={20} aria-hidden="true" />
              <input
                type="search"
                class={styles.searchInput}
                placeholder="Search documents across the P2P network..."
                value={searchQuery()}
                onInput={e => setSearchQuery(e.currentTarget.value)}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter') void handleSearch();
                }}
                ref={el => {
                  searchInputEl = el;
                }}
                aria-label="Search the P2P network"
              />
              <div class={styles.searchActions}>
                <Button
                  variant="primary"
                  class={styles.purplePrimary}
                  onClick={() => void handleSearch()}
                  disabled={isSearching()}
                >
                  {isSearching() ? 'Searching…' : 'Search Network'}
                </Button>
              </div>
            </div>

            <div class={styles.searchToolbar}>
              <div class={styles.hashDownload}>
                <input
                  type="text"
                  class={styles.hashInput}
                  placeholder="Download by hash"
                  value={hash()}
                  onInput={e => setHash(e.currentTarget.value)}
                  aria-label="Download by content hash"
                />
                <Button
                  variant="outline"
                  size="sm"
                  class={styles.purpleOutline}
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
                  <Download size={14} />
                  Download
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                class={styles.purpleGhost}
                onClick={() => setShowFilters(!showFilters())}
              >
                <Filter size={16} />
                {showFilters() ? 'Hide Filters' : 'Filters'}
              </Button>
            </div>

            <Show when={downloadError()}>
              <p class={styles['download-error']} role="alert">
                {downloadError()}
              </p>
            </Show>

            <div
              class={styles.filtersPanel}
              data-open={showFilters() ? '1' : '0'}
              aria-hidden={!showFilters()}
              aria-expanded={showFilters()}
            >
              <div class={styles.filterGroups}>
                <div class={styles.filterGroup}>
                  <span class={styles.filterLabel}>Scope</span>
                  <div class={styles.filterChips}>
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
                <div class={styles.filterGroup}>
                  <span class={styles.filterLabel}>Types</span>
                  <div class={styles.filterChips}>
                    <Button
                      variant={fileTypes().includes('pdf') ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        toggleFileType('pdf');
                        if (hasSearched()) void handleSearch();
                      }}
                    >
                      PDF
                    </Button>
                    <Button
                      variant={fileTypes().includes('epub') ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        toggleFileType('epub');
                        if (hasSearched()) void handleSearch();
                      }}
                    >
                      EPUB
                    </Button>
                    <Button
                      variant={anonymousMode() ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setAnonymousMode(!anonymousMode())}
                    >
                      <Shield size={14} />
                      Anonymous
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div class={styles.metricsRibbon} aria-label="Network metrics">
          <div class={styles.metricChip}>
            <Users size={15} aria-hidden="true" />
            <div>
              <strong>{lobby.onlineNodes()}</strong>
              <span>Nodes online</span>
            </div>
          </div>
          <div class={styles.metricChip}>
            <BookOpen size={15} aria-hidden="true" />
            <div>
              <strong>{lobby.files().length}</strong>
              <span>Lobby files</span>
            </div>
          </div>
          <div class={styles.metricChip}>
            <HardDrive size={15} aria-hidden="true" />
            <div>
              <strong>{lobbyTotalSize()}</strong>
              <span>Lobby size</span>
            </div>
          </div>
        </div>

        <section class={styles['results-section']} id="resultsTop" aria-live="polite">
          <div class={styles['section-header']}>
            <h2>Search Results</h2>
            <div class={styles['result-controls']}>
              <span class={styles.resultMeta}>
                {hasSearched()
                  ? `${results()?.length ?? 0} files · ${resultsTotalSize()}`
                  : 'Ready to search'}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!results()?.length || downloadingAll() || !canDownload()}
                onClick={() => void handleDownloadAll()}
              >
                <Download size={14} />
                {downloadingAll() ? 'Queueing…' : 'Download All'}
              </Button>
            </div>
          </div>

          <Show when={!canDownload() && (results()?.length ?? 0) > 0}>
            <div class={styles.downloadNotice}>
              <p>
                Downloads need Tor onion sharing to be ready. Browse results now; queue downloads
                once Onion status shows ready.
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/transfers')}>
                Open Sharing &amp; downloads
              </Button>
            </div>
          </Show>

          <Show when={isSearching()}>
            <div class={styles['search-progress']}>
              <LoadingSpinner
                variant="ring"
                size="md"
                message={`Searching across ${net.connectedPeers()} connected peers…`}
                showMessage
              />
            </div>
            <div class={styles['skeleton-grid']}>
              <For each={[1, 2, 3, 4, 5, 6]}>{() => <div class={styles['skeleton-card']} />}</For>
            </div>
          </Show>

          <Show when={!isSearching() && (results()?.length ?? 0) > 0}>
            <div class={styles['results-grid']}>
              <For each={results()}>
                {(result: NetworkSearchResult) => {
                  const target = downloadTargetFor(result);
                  const row = () => transfer.findDownloadForTarget(target);
                  return (
                    <NetworkFileCard
                      contentHash={result.document.id}
                      name={result.document.title}
                      size={result.document.fileSize}
                      link={result.document.filePath || ''}
                      peerCount={result.peerCount}
                      canDownload={canDownload()}
                      downloadProgress={row()?.progress}
                      downloadStatus={row()?.status}
                      downloadError={row()?.error}
                      onOpen={() => void handleDocumentOpen(result)}
                      onDownload={() => handleFileDownload(result)}
                      onDownloadError={msg => setDownloadError(msg)}
                    />
                  );
                }}
              </For>
            </div>
          </Show>

          <Show when={!isSearching() && !hasSearched()}>
            <div class={styles['empty-state']}>
              <div class={styles.emptyIcon} aria-hidden="true">
                <Search size={22} />
              </div>
              <h3>Search the P2P network</h3>
              <p>Enter a query above to find documents shared by peers.</p>
            </div>
          </Show>

          <Show when={!isSearching() && hasSearched() && (results()?.length ?? 0) === 0}>
            <div class={styles['empty-state']}>
              <div class={styles.emptyIcon} aria-hidden="true">
                <Search size={22} />
              </div>
              <h3>No results found</h3>
              <p>Try adjusting your search terms or expanding your search scope.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  searchInputEl?.focus();
                  searchInputEl?.select();
                }}
              >
                Refine search
              </Button>
            </div>
          </Show>
        </section>

        <section class={styles.downloadsSection} aria-label="Downloads from search">
          <TransferQueuePanel
            variant="compact"
            showOutbound={false}
            showCompleted={false}
            hideSummary
            hideEmptySearchLink
            class={styles['transfer-queue']}
          />
        </section>
      </div>
    </div>
  );
};

export default SearchNetworkPage;
