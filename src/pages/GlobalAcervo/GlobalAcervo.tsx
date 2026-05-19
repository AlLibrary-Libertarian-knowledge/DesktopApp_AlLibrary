/**
 * GlobalAcervo — Exibe automaticamente todos os documentos disponíveis no acervo global da rede
 * Conecta ao tracker e mostra todos os arquivos compartilhados pelos peers sem necessidade de pesquisa
 */
import { type Component, createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import {
  trackerGetCachedLobby,
  trackerRefreshLobby,
  onionShareFetch,
  onionShareStatus,
  listenOnionShareFetchDone,
  type NetworkLobby,
} from '@/services/network/onionShareService';
import { settingsService } from '@/services/storage/settingsService';
import { downloadManager, type DownloadItem } from '@/services/network/downloadManager';
import styles from './GlobalAcervo.module.css';
import { Download, Globe, RefreshCw, Users, BookOpen, FileText, Wifi, WifiOff } from 'lucide-solid';

interface FileEntry {
  name: string;
  size: number;
  link: string;
  content_hash: string;
  peer_count: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📕';
  if (ext === 'epub') return '📗';
  if (ext === 'txt') return '📄';
  return '📦';
}

export const GlobalAcervo: Component = () => {
  const [lobby, setLobby] = createSignal<NetworkLobby | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [onlineNodes, setOnlineNodes] = createSignal(0);
  const [isOnionActive, setIsOnionActive] = createSignal(false);
  const [activeDls, setActiveDls] = createSignal<DownloadItem[]>([]);
  const [completedDls, setCompletedDls] = createSignal<DownloadItem[]>([]);
  const [lastRefresh, setLastRefresh] = createSignal<Date | null>(null);
  const [downloadError, setDownloadError] = createSignal<string | null>(null);

  const loadLobby = async (force = false) => {
    setError(null);
    try {
      let data: NetworkLobby;
      if (force) {
        data = await trackerRefreshLobby();
      } else {
        data = await trackerGetCachedLobby();
      }
      setLobby(data);
      setOnlineNodes(data.online_nodes || 0);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      // Try cached if refresh fails
      try {
        const cached = await trackerGetCachedLobby();
        setLobby(cached);
        setOnlineNodes(cached.online_nodes || 0);
        setLastRefresh(new Date());
      } catch {
        setError(String(e instanceof Error ? e.message : 'Failed to load network lobby'));
      }
    } finally {
      setLoading(false);
    }
  };

  const checkOnionStatus = async () => {
    try {
      const st = await onionShareStatus();
      setIsOnionActive(st.running && !!st.onion);
    } catch {
      setIsOnionActive(false);
    }
  };

  onMount(async () => {
    await checkOnionStatus();
    await loadLobby(false);

    // Subscribe to downloadManager updates
    const unsubscribeDls = downloadManager.subscribe((active, completed) => {
      setActiveDls(active);
      setCompletedDls(completed);
    });

    // Auto-refresh every 30s
    const timer = setInterval(() => {
      void loadLobby(false);
      void checkOnionStatus();
    }, 30000);

    onCleanup(() => {
      unsubscribeDls();
      clearInterval(timer);
    });
  });

  const handleDownload = async (file: FileEntry) => {
    setDownloadError(null);
    console.log('Download button clicked for:', file.name, 'link:', file.link);
    const link = file.link;
    try {
      const status = await onionShareStatus();
      if (!status.running) {
        throw new Error(
          'Tor onion sharing service is not running. Please start it on the Sharing & Downloads page first.'
        );
      }
      if (status.onion && link && link.includes(status.onion)) {
        throw new Error(
          'Você já está compartilhando este arquivo localmente. A rede Tor não permite fazer o download de si mesmo para evitar loops de circuito.'
        );
      }
      const dlFolder =
        (await settingsService.getDownloadFolder()) ||
        (await settingsService.getProjectFolder()) ||
        '.';
      if (!link) {
        throw new Error('File download link is empty or missing.');
      }
      await downloadManager.startDownload(link, file.name, dlFolder);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setDownloadError(`Failed to start download: ${msg}`);
      console.error('Download initiation failed:', e);
    }
  };

  const getDownload = (link: string): DownloadItem | undefined => {
    const active = activeDls().find(item => item.link === link);
    if (active) return active;
    return completedDls().find(item => item.link === link);
  };

  const files = () => lobby()?.files ?? [];
  const totalFiles = () => files().length;

  return (
    <div class={styles.page}>
      {/* Header */}
      <div class={styles.header}>
        <div class={styles.headerLeft}>
          <Globe size={24} class={styles.headerIcon} />
          <div>
            <h1 class={styles.title}>Global Acervo</h1>
            <p class={styles.subtitle}>All documents available on the network — no search needed</p>
          </div>
        </div>
        <div class={styles.headerRight}>
          <div class={styles.onionPill} data-active={isOnionActive() ? '1' : '0'}>
            {isOnionActive() ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{isOnionActive() ? 'Onion Active' : 'No Onion'}</span>
          </div>
          <button
            class={styles.refreshBtn}
            onClick={() => void loadLobby(true)}
            disabled={loading()}
            title="Refresh from tracker"
          >
            <RefreshCw size={15} class={loading() ? styles.spinning : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div class={styles.statsBar}>
        <div class={styles.stat}>
          <Users size={16} class={styles.statIcon} />
          <span class={styles.statValue}>{onlineNodes()}</span>
          <span class={styles.statLabel}>Nodes Online</span>
        </div>
        <div class={styles.statDivider} />
        <div class={styles.stat}>
          <BookOpen size={16} class={styles.statIcon} />
          <span class={styles.statValue}>{totalFiles()}</span>
          <span class={styles.statLabel}>Documents Available</span>
        </div>
        <div class={styles.statDivider} />
        <div class={styles.stat}>
          <FileText size={16} class={styles.statIcon} />
          <span class={styles.statValue}>
            {formatSize(files().reduce((acc, f) => acc + (f.size || 0), 0))}
          </span>
          <span class={styles.statLabel}>Total Size</span>
        </div>
        <Show when={lastRefresh()}>
          <div class={styles.statDivider} />
          <div class={styles.stat}>
            <span class={styles.statLabel}>
              Last updated: {lastRefresh()?.toLocaleTimeString()}
            </span>
          </div>
        </Show>
      </div>

      {/* Content */}
      <div class={styles.content}>
        <Show when={downloadError()}>
          <div class={styles.downloadErrorBanner}>
            <span class={styles.errorBannerText}>{downloadError()}</span>
            <button class={styles.closeErrorBtn} onClick={() => setDownloadError(null)}>
              ×
            </button>
          </div>
        </Show>

        <Show when={loading()}>
          <div class={styles.loadingState}>
            <div class={styles.loadingOrb} />
            <p>Connecting to network tracker...</p>
          </div>
        </Show>

        <Show when={error() && !loading()}>
          <div class={styles.errorState}>
            <div class={styles.errorIcon}>⚠️</div>
            <h3>Could not reach tracker</h3>
            <p>{error()}</p>
            <p class={styles.errorHint}>
              Make sure your tracker URL is configured in <strong>Configurations</strong> and that
              the Tor network is active.
            </p>
            <button class={styles.retryBtn} onClick={() => void loadLobby(true)}>
              Try Again
            </button>
          </div>
        </Show>

        <Show when={!loading() && !error() && totalFiles() === 0}>
          <div class={styles.emptyState}>
            <div class={styles.emptyIcon}>🌐</div>
            <h3>No documents in the network yet</h3>
            <p>
              Be the first to share! Go to <strong>Sharing &amp; Downloads</strong> and add files to
              your local shares. They will appear here for other peers.
            </p>
            <Show when={!isOnionActive()}>
              <div class={styles.warningBox}>
                ⚠️ Your Tor onion service is not active. Start it from Sharing &amp; Downloads to see
                network documents.
              </div>
            </Show>
          </div>
        </Show>

        <Show when={!loading() && !error() && totalFiles() > 0}>
          <div class={styles.grid}>
            <For each={files()}>
              {(file: FileEntry) => {
                const dl = () => getDownload(file.link);
                return (
                  <div class={styles.card}>
                    <div class={styles.cardIcon}>{fileIcon(file.name)}</div>
                    <div class={styles.cardInfo}>
                      <div class={styles.cardName} title={file.name}>
                        {file.name}
                      </div>
                      <div class={styles.cardMeta}>
                        <span class={styles.cardSize}>{formatSize(file.size)}</span>
                        <span class={styles.cardPeers}>
                          <Users size={11} /> {file.peer_count ?? 1} peer
                          {(file.peer_count ?? 1) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div class={styles.cardHash} title={file.content_hash}>
                        {file.content_hash?.slice(0, 12)}...
                      </div>
                    </div>
                    <div class={styles.cardActions}>
                      <Show when={!dl()}>
                        <button
                          class={styles.downloadBtn}
                          onClick={() => void handleDownload(file)}
                          title="Download via Tor"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </Show>
                      <Show when={dl()?.status === 'active'}>
                        <div class={styles.downloadingBadge}>
                          <div class={styles.dlSpinner} />
                          {Math.round((dl()?.progress || 0) * 100)}%
                        </div>
                      </Show>
                      <Show when={dl()?.status === 'completed'}>
                        <div class={styles.doneBadge}>✅ Saved</div>
                      </Show>
                      <Show when={dl()?.status === 'failed'}>
                        <div class={styles.errorBadge} title={dl()?.error}>
                          ⚠️ Failed
                        </div>
                        <button
                          class={styles.retrySmallBtn}
                          onClick={() => void handleDownload(file)}
                        >
                          Retry
                        </button>
                      </Show>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default GlobalAcervo;
