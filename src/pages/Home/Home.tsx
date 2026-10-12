import { type Component, createSignal, onMount, createEffect, createMemo, Show } from 'solid-js';
import { Button, Modal } from '../../components/foundation';
import {
  NetworkGraph,
  ActivityListCard,
  StatCard,
  type ActivityItemProps,
} from '../../components/composite';
import { StatusBar, SecurityPanel } from '../../components/domain/dashboard';
import { TransferQueuePanel } from '@/components/domain/network/TransferQueuePanel';
import { useTranslation } from '../../i18n/hooks';
import {
  Download,
  Upload,
  Search,
  BarChart3,
  Settings,
  RefreshCw,
  Plus,
  ClipboardList,
  Share,
  Activity,
  BookOpen,
  Users,
  HardDrive,
  Zap,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
} from 'lucide-solid';
import styles from './Home.module.css';
import { useNavigate } from '@solidjs/router';
import { settingsService } from '@/services/storage/settingsService';
import { useNetworkStore } from '@/stores/network/networkStore';
import { useNetworkLobby } from '@/hooks/api/useNetworkLobby';
import { activityService } from '@/services/activityService';
import { useTransferState } from '@/hooks/api/useTransferState';
import type { TransferView } from '@/services/network/transferFacade';
import { pickAnyFiles } from '@/services/system/fileDialogs';
import { shareWithToast } from '@/utils/documentActions';
import { useToast } from '@/hooks/ui/useToast';
import { useTheme } from '@/hooks/ui/useTheme';

function formatLobbyBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function lobbyHealthPercent(
  onlineNodes: number,
  fileCount: number,
  syncError: string | undefined,
  lastSyncAt: Date | null
): number {
  if (syncError) return 28;
  if (!lastSyncAt) return 45;
  if (onlineNodes === 0 && fileCount === 0) return 72;
  if (onlineNodes === 0) return 78;
  if (onlineNodes < 5) return 88;
  return 96;
}

const HomePage: Component = () => {
  // Initialize i18n translation hooks
  const { t } = useTranslation('pages');
  const { t: tc } = useTranslation('components');

  const [showModal, setShowModal] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<'overview' | 'network' | 'downloads'>('overview');
  /** Keep heavy panels mounted after first visit so tab switches stay instant. */
  const [visitedTabs, setVisitedTabs] = createSignal<Set<'overview' | 'network' | 'downloads'>>(
    new Set(['overview'])
  );

  const theme = useTheme();
  /** Only unmount tab panels in reduced-motion mode (less GPU/animation work). */
  const unmountInactiveTabs = createMemo(
    () => theme.currentTheme().accessibilityTheme === 'reduced-motion'
  );

  const shouldMountTab = (tab: 'overview' | 'network' | 'downloads') =>
    unmountInactiveTabs() ? activeTab() === tab : visitedTabs().has(tab);

  const selectTab = (tab: 'overview' | 'network' | 'downloads') => {
    setActiveTab(tab);
    if (unmountInactiveTabs()) return;
    // Keep-alive: mount once, then only toggle visibility.
    setVisitedTabs(prev => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  };

  const handleModalClose = () => setShowModal(false);

  const net = useNetworkStore();
  const lobby = useNetworkLobby();
  const navigate = useNavigate();
  const toast = useToast();
  const transfer = useTransferState();

  const [recentDownloads, setRecentDownloads] = createSignal<ActivityItemProps[]>([]);
  const [networkActivity, setNetworkActivity] = createSignal<ActivityItemProps[]>([]);

  const fileCount = createMemo(() => lobby.files().length);
  const peerCount = createMemo(() => lobby.onlineNodes());
  const connectionEdges = createMemo(() =>
    lobby.files().reduce((sum, f) => sum + (f.peerCount || 0), 0)
  );
  const healthPct = createMemo(() =>
    lobbyHealthPercent(peerCount(), fileCount(), lobby.syncError(), lobby.lastSyncAt())
  );
  const healthTrend = createMemo(() => {
    const pct = healthPct();
    if (lobby.syncError()) {
      return {
        type: 'negative' as const,
        value: t('home.stats.syncError'),
        label: t('home.stats.poor'),
      };
    }
    if (pct >= 90) {
      return {
        type: 'positive' as const,
        value: t('home.stats.excellent'),
        label: undefined,
      };
    }
    if (pct >= 70) {
      return {
        type: 'positive' as const,
        value: t('home.stats.good'),
        label: undefined,
      };
    }
    if (pct >= 50) {
      return {
        type: 'neutral' as const,
        value: t('home.stats.fair'),
        label: undefined,
      };
    }
    return {
      type: 'negative' as const,
      value: t('home.stats.poor'),
      label: undefined,
    };
  });

  const mapTransferViews = (
    active: TransferView[],
    completed: TransferView[]
  ): ActivityItemProps[] => {
    const items: ActivityItemProps[] = active.map(item => ({
      type: 'downloading' as const,
      title: item.name,
      progress: Math.round(item.progress * 100),
      status: tc('activityList.status.downloading'),
      metadata: tc('activityList.metadata.complete', {
        progress: Math.round(item.progress * 100),
      }),
    }));
    for (const item of completed.slice(0, 5)) {
      items.push({
        type: 'completed',
        title: item.name,
        status: tc('activityList.status.complete'),
      });
    }
    return items;
  };

  createEffect(() => {
    setRecentDownloads(mapTransferViews(transfer.activeDownloads(), transfer.completedDownloads()));
  });

  const loadNetworkActivity = async () => {
    const entries = await activityService.loadActivityDocuments({ limit: 20 });
    const filtered = entries.filter(entry =>
      ['share', 'upload', 'favorite'].includes(entry.entry.kind)
    );
    setNetworkActivity(
      filtered.slice(0, 5).map(entry => ({
        type: entry.entry.kind === 'share' ? ('seeding' as const) : ('completed' as const),
        title: entry.title,
        status:
          entry.entry.kind === 'share'
            ? tc('activityList.status.seeding')
            : tc('activityList.status.complete'),
        metadata: new Date(entry.entry.createdAt).toLocaleString(),
      }))
    );
  };

  onMount(() => {
    // Show welcome modal on first visit
    const hasVisited = globalThis.localStorage?.getItem('allibrary-visited');
    if (!hasVisited) {
      setShowModal(true);
      globalThis.localStorage?.setItem('allibrary-visited', 'true');
    }

    void loadNetworkActivity();
    void lobby.refresh(true);
  });

  return (
    <div class={styles['home-page']}>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded"
      >
        {t('home.accessibility.skipToContent')}
      </a>

      {/* Enhanced Page Header */}
      <header
        class={`${styles['page-header']} ${styles.enhanced}`}
        role="banner"
        aria-label={t('home.title')}
      >
        <div class={styles['header-content']}>
          <h1 class={styles['page-title']}>{t('home.title')}</h1>
          <p class={styles['page-subtitle']}>{t('home.subtitle')}</p>
        </div>

        <div
          class={styles['network-status-enhanced']}
          role="status"
          aria-live="polite"
          aria-label={t('home.accessibility.networkStatusAria', {
            status:
              net.connectedPeers() > 0
                ? t('home.networkStatus.online')
                : t('home.networkStatus.offline'),
            peers: String(net.connectedPeers()),
            health: `${net.networkHealthPct()}%`,
          })}
        >
          <div class={styles['network-status-main']}>
            <div class={styles['status-row']}>
              <span class={styles['status-text']}>
                {net.connectedPeers() > 0
                  ? t('home.networkStatus.online')
                  : t('home.networkStatus.offline')}
              </span>
              <div
                class={`${styles['status-indicator']} ${
                  net.connectedPeers() > 0 ? styles.online : styles.offline
                }`}
                aria-hidden="true"
              >
                <div class={styles['status-pulse']} />
              </div>
            </div>
            <div class={styles['health-row']}>
              <div class={styles['network-health']}>
                <span class={styles['health-text']}>{t('home.networkStatus.health')}</span>
                <div
                  class={styles['health-bar']}
                  role="progressbar"
                  aria-valuenow={net.networkHealthPct()}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('home.networkStatus.health')}
                >
                  <div
                    class={styles['health-fill']}
                    style={{ width: `${net.networkHealthPct()}%` }}
                  />
                </div>
                <span class={styles['health-pct']}>{net.networkHealthPct()}%</span>
              </div>
            </div>
          </div>

          <div class={styles['data-flow-container']}>
            <div class={styles['flow-section']}>
              <div class={styles['flow-header']}>
                <span class={`${styles['flow-icon']} ${styles.download}`} aria-hidden="true">
                  <Download size={14} />
                </span>
                <span class={styles['flow-label']}>{t('home.dataFlow.download')}</span>
              </div>
              <div class={styles['flow-visual']}>
                <div class={`${styles['flow-stream']} ${styles['download-stream']}`} />
                <div class={styles['flow-speed']}>{net.downloadMbps()} MB/s</div>
              </div>
            </div>

            <div class={styles['network-center']}>
              <div class={styles['network-node']} aria-hidden="true">
                <div class={styles['node-core']} />
                <div class={styles['node-ring']} />
                <div class={styles['node-outer']} />
              </div>
              <div class={styles['peer-count']}>
                <span class={styles['peer-number']}>{net.connectedPeers()}</span>
                <span class={styles['peer-label']}>{t('home.networkStatus.peers')}</span>
              </div>
            </div>

            <div class={styles['flow-section']}>
              <div class={styles['flow-header']}>
                <span class={`${styles['flow-icon']} ${styles.upload}`} aria-hidden="true">
                  <Upload size={14} />
                </span>
                <span class={styles['flow-label']}>{t('home.dataFlow.upload')}</span>
              </div>
              <div class={styles['flow-visual']}>
                <div class={`${styles['flow-stream']} ${styles['upload-stream']}`} />
                <div class={styles['flow-speed']}>{net.uploadMbps()} MB/s</div>
              </div>
            </div>
          </div>

          <div class={styles['activity-indicators']}>
            <div class={styles['activity-item']}>
              <div class={`${styles['activity-dot']} ${styles.active}`} aria-hidden="true" />
              <span class={styles['activity-text']}>
                {net.activeDownloads()} {t('home.activityIndicators.downloads')}
              </span>
            </div>
            <div class={styles['activity-item']}>
              <div class={`${styles['activity-dot']} ${styles.seeding}`} aria-hidden="true" />
              <span class={styles['activity-text']}>
                {net.activeSeeding()} {t('home.activityIndicators.seeding')}
              </span>
            </div>
            <div class={styles['activity-item']}>
              <div class={`${styles['activity-dot']} ${styles.discovering}`} aria-hidden="true" />
              <span class={styles['activity-text']}>
                {net.activeDiscovery()} {t('home.activityIndicators.discovering')}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div class={styles['dashboard-tabs']} role="tablist" aria-label={t('home.tabs.label' as any)}>
        <button
          type="button"
          class={`${styles.tab} ${activeTab() === 'overview' ? styles.active : ''}`}
          onClick={() => selectTab('overview')}
          role="tab"
          aria-selected={activeTab() === 'overview'}
          aria-controls="overview-panel"
          id="overview-tab"
          tabindex={activeTab() === 'overview' ? 0 : -1}
        >
          <span class={styles['tab-text']}>
            <BarChart3 size={15} aria-hidden="true" />
            {t('home.tabs.overview')}
          </span>
        </button>
        <button
          type="button"
          class={`${styles.tab} ${activeTab() === 'network' ? styles.active : ''}`}
          onClick={() => selectTab('network')}
          role="tab"
          aria-selected={activeTab() === 'network'}
          aria-controls="network-panel"
          id="network-tab"
          tabindex={activeTab() === 'network' ? 0 : -1}
        >
          <span class={styles['tab-text']}>
            <Activity size={15} aria-hidden="true" />
            {t('home.tabs.network')}
          </span>
        </button>
        <button
          type="button"
          class={`${styles.tab} ${activeTab() === 'downloads' ? styles.active : ''}`}
          onClick={() => selectTab('downloads')}
          role="tab"
          aria-selected={activeTab() === 'downloads'}
          aria-controls="downloads-panel"
          id="downloads-tab"
          tabindex={activeTab() === 'downloads' ? 0 : -1}
        >
          <span class={styles['tab-text']}>
            <Download size={15} aria-hidden="true" />
            {t('home.tabs.downloads')}
          </span>
        </button>
      </div>
      <div class={styles['dashboard-content']} id="main-content">
        {/* Overview — keep-alive unless reduced-motion (then unmount) */}
        <Show when={shouldMountTab('overview')}>
          <div
            role="tabpanel"
            id="overview-panel"
            aria-labelledby="overview-tab"
            class={`${styles['tab-panel']} ${activeTab() === 'overview' ? styles['tab-panel-active'] : ''}`}
            hidden={!unmountInactiveTabs() && activeTab() !== 'overview'}
            aria-hidden={activeTab() !== 'overview'}
          >
            <section
              class={`${styles['stats-section']} ${styles.enhanced}`}
              aria-labelledby="stats-title"
            >
              <h2 id="stats-title" class="sr-only">
                {t('home.stats.networkHealth')}
              </h2>
              <div class={styles.grid} data-testid="stats-section">
                <StatCard
                  type="documents"
                  icon={<BookOpen size={24} />}
                  number={fileCount().toLocaleString()}
                  label={t('home.stats.documentsShared')}
                  trendType={fileCount() > 0 ? 'positive' : 'neutral'}
                  trendIcon={<TrendingUp size={12} />}
                  trendValue={String(fileCount())}
                  trendLabel={t('home.stats.inLobby')}
                  graphType="chart"
                />
                <StatCard
                  type="peers"
                  icon={<Users size={24} />}
                  number={peerCount().toLocaleString()}
                  label={t('home.stats.connectedPeers')}
                  trendType={peerCount() > 0 ? 'positive' : 'neutral'}
                  trendIcon={<TrendingUp size={14} />}
                  trendValue={String(peerCount())}
                  trendLabel={lobby.syncError() ? t('home.stats.offline') : t('home.stats.online')}
                  graphType="peers"
                />
                <StatCard
                  type="institutions"
                  icon={<HardDrive size={24} />}
                  number={formatLobbyBytes(lobby.totalBytes())}
                  label={t('home.stats.lobbyStorage')}
                  trendType="neutral"
                  trendIcon={<ArrowRight size={14} />}
                  trendValue={
                    lobby.lastSyncAt()
                      ? lobby.lastSyncAt()!.toLocaleTimeString()
                      : t('home.stats.awaitingSync')
                  }
                  graphType="map"
                />
                <StatCard
                  type="health"
                  icon={lobby.syncError() ? <AlertTriangle size={24} /> : <Zap size={24} />}
                  number={`${healthPct()}%`}
                  label={t('home.stats.networkHealth')}
                  trendType={healthTrend().type}
                  trendIcon={<TrendingUp size={14} />}
                  trendValue={healthTrend().value}
                  trendLabel={healthTrend().label}
                  graphType="health"
                />
              </div>
            </section>

            {/* Enhanced Network Preview Section */}
            <section
              class={styles['network-preview-section']}
              aria-labelledby="network-topology-title"
            >
              <div class={styles['section-header']}>
                <div class={styles['header-content']}>
                  <h2 id="network-topology-title" class={styles['section-title']}>
                    {t('home.networkTopology.title')}
                  </h2>
                  <p class={styles['section-subtitle']}>{t('home.networkTopology.subtitle')}</p>
                </div>
                <div class={styles['header-actions']}>
                  <div class={styles['network-stats']} aria-label={t('home.networkTopology.title')}>
                    <span class={styles['stat-item']}>
                      <span class={styles['stat-dot']} aria-hidden="true" />
                      {peerCount()} {t('home.networkStatus.nodes')}
                    </span>
                    <span class={styles['stat-item']}>
                      <span
                        class={`${styles['stat-dot']} ${styles['stat-dot-connections']}`}
                        aria-hidden="true"
                      />
                      {connectionEdges()} {t('home.networkStatus.connections')}
                    </span>
                  </div>
                  <button
                    type="button"
                    class={styles['expand-view-btn']}
                    onClick={() => selectTab('network')}
                    aria-label={t('home.networkTopology.expandView')}
                  >
                    {t('home.networkTopology.expandView')}
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div class={styles['network-graph-shell']}>
                <NetworkGraph
                  width="100%"
                  height={350}
                  showStats={true}
                  theme="light"
                  aria-label={t('home.accessibility.networkGraphAria', {
                    nodes: peerCount(),
                    connections: connectionEdges(),
                  })}
                />
              </div>
            </section>

            {/* Enhanced Activity Section */}
            <section
              class={`${styles['activity-section']} ${styles['enhanced']}`}
              aria-labelledby="activity-title"
            >
              <div class={styles['section-header']}>
                <div class={styles['header-content']}>
                  <h2 id="activity-title" class={styles['section-title']}>
                    {t('home.networkActivity.title')}
                  </h2>
                  <p class={styles['section-subtitle']}>{t('home.networkActivity.subtitle')}</p>
                </div>
              </div>

              <div class={styles['grid']}>
                <ActivityListCard
                  title={t('home.networkActivity.recentDownloads')}
                  subtitle={t('home.networkActivity.recentDownloadsSubtitle')}
                  icon={<Download size={20} />}
                  items={recentDownloads()}
                  cardType="downloads"
                  data-testid="recent-documents"
                />

                <ActivityListCard
                  title={t('home.networkActivity.title')}
                  subtitle={t('home.networkActivity.networkActivitySubtitle')}
                  icon={<Upload size={20} />}
                  items={networkActivity()}
                  cardType="network"
                />
              </div>
            </section>

            <section class={styles['actions-section']} aria-labelledby="quick-actions-title">
              <div class={styles['section-header']}>
                <div class={styles['header-content']}>
                  <h2 id="quick-actions-title" class={styles['section-title']}>
                    {t('home.quickActions.title')}
                  </h2>
                </div>
              </div>

              <div
                class={styles['actions-grid']}
                role="group"
                aria-labelledby="quick-actions-title"
              >
                <button
                  type="button"
                  class={styles['action-button']}
                  data-testid="upload-button"
                  aria-label={t('home.quickActions.shareDocument')}
                  onClick={async () => {
                    try {
                      const paths = await pickAnyFiles();
                      if (!paths.length) return;

                      for (const filePath of paths) {
                        const base = filePath.split(/[\\/]/).pop() ?? 'document';
                        const title = base.replace(/\.[^.]+$/, '') || base;
                        await shareWithToast({ title, filePath }, toast);
                      }
                      await loadNetworkActivity();
                    } catch (e: unknown) {
                      toast.show({
                        type: 'error',
                        title: 'Share failed',
                        message: e instanceof Error ? e.message : String(e),
                      });
                    }
                  }}
                >
                  <span class={styles['action-icon']} aria-hidden="true">
                    <Share size={20} />
                  </span>
                  <span class={styles['action-text']}>{t('home.quickActions.shareDocument')}</span>
                </button>

                <button
                  type="button"
                  class={styles['action-button']}
                  aria-label={t('home.quickActions.searchNetwork')}
                  onClick={() => navigate('/search-network')}
                >
                  <span class={styles['action-icon']} aria-hidden="true">
                    <Search size={20} />
                  </span>
                  <span class={styles['action-text']}>{t('home.quickActions.searchNetwork')}</span>
                </button>

                <button
                  type="button"
                  class={styles['action-button']}
                  aria-label={t('home.quickActions.analytics')}
                  onClick={() => navigate('/network-health')}
                >
                  <span class={styles['action-icon']} aria-hidden="true">
                    <BarChart3 size={20} />
                  </span>
                  <span class={styles['action-text']}>{t('home.quickActions.analytics')}</span>
                </button>

                <button
                  type="button"
                  class={styles['action-button']}
                  aria-label={t('home.quickActions.settings')}
                  onClick={() => navigate('/settings')}
                >
                  <span class={styles['action-icon']} aria-hidden="true">
                    <Settings size={20} />
                  </span>
                  <span class={styles['action-text']}>{t('home.quickActions.settings')}</span>
                </button>
              </div>
            </section>
          </div>
        </Show>

        {/* Network — keep-alive unless reduced-motion (then unmount) */}
        <Show when={shouldMountTab('network')}>
          <div
            role="tabpanel"
            id="network-panel"
            aria-labelledby="network-tab"
            class={`${styles['tab-panel']} ${activeTab() === 'network' ? styles['tab-panel-active'] : ''}`}
            hidden={!unmountInactiveTabs() && activeTab() !== 'network'}
            aria-hidden={activeTab() !== 'network'}
          >
            <section class={styles['network-section']} aria-labelledby="network-section-title">
              <div class={styles['section-header']}>
                <h2 id="network-section-title">{t('home.networkSection.title')}</h2>
                <div class={styles['network-controls']}>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t('home.networkSection.refresh')}
                    onClick={() => void lobby.refresh(true)}
                  >
                    <RefreshCw size={14} aria-hidden="true" />
                    {t('home.networkSection.refresh')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t('home.networkSection.statistics')}
                  >
                    <BarChart3 size={14} aria-hidden="true" />
                    {t('home.networkSection.statistics')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={t('home.networkSection.configure')}
                  >
                    <Settings size={14} aria-hidden="true" />
                    {t('home.networkSection.configure')}
                  </Button>
                </div>
              </div>

              <div class={styles['network-container']}>
                <NetworkGraph
                  width="100%"
                  height={500}
                  showStats={true}
                  interactive={true}
                  theme="light"
                  aria-label={t('home.accessibility.networkGraphAria', {
                    nodes: peerCount(),
                    connections: connectionEdges(),
                  })}
                />
              </div>

              <SecurityPanel />
            </section>
          </div>
        </Show>

        {/* Downloads — keep-alive unless reduced-motion (then unmount) */}
        <Show when={shouldMountTab('downloads')}>
          <div
            role="tabpanel"
            id="downloads-panel"
            aria-labelledby="downloads-tab"
            class={`${styles['tab-panel']} ${activeTab() === 'downloads' ? styles['tab-panel-active'] : ''}`}
            hidden={!unmountInactiveTabs() && activeTab() !== 'downloads'}
            aria-hidden={activeTab() !== 'downloads'}
          >
            <section class={styles['downloads-section']} aria-labelledby="downloads-section-title">
              <div class={`${styles['section-header']} ${styles['downloads-header']}`}>
                <h2 id="downloads-section-title">{t('home.downloadsSection.title')}</h2>
                <div
                  class={styles['download-controls']}
                  role="group"
                  aria-label={t('home.downloadsSection.title')}
                >
                  <Button
                    variant="primary"
                    size="sm"
                    class={styles['download-btn-primary']}
                    aria-label={t('home.downloadsSection.addDownload')}
                    onClick={() => navigate('/search-network')}
                  >
                    <Plus size={14} aria-hidden="true" />
                    {t('home.downloadsSection.addDownload')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    class={styles['download-btn-secondary']}
                    aria-label={t('home.downloadsSection.openFullQueue')}
                    onClick={() => navigate('/transfers')}
                  >
                    <ClipboardList size={14} aria-hidden="true" />
                    {t('home.downloadsSection.openFullQueue')}
                    <Show when={transfer.activeCount() > 0}>
                      <span class={styles['queue-count']}>{transfer.activeCount()}</span>
                    </Show>
                  </Button>
                </div>
              </div>
              <TransferQueuePanel variant="compact" showOutbound={false} />
            </section>
          </div>
        </Show>
      </div>

      {/* Status Bar — page-level metrics above app footer */}
      <section class={styles['home-status-bar']}>
        <StatusBar />
      </section>

      {/* Enhanced Welcome Modal */}
      <Modal
        isOpen={showModal()}
        onClose={handleModalClose}
        title={t('home.welcomeModal.title')}
        size="lg"
        footer={
          <div class="flex gap-3 justify-between w-full">
            <div>
              <Button
                variant="outline"
                onClick={handleModalClose}
                aria-label={t('home.welcomeModal.takeTour')}
              >
                {t('home.welcomeModal.takeTour')}
              </Button>
            </div>
            <div class="flex gap-3">
              <Button
                variant="secondary"
                onClick={async () => {
                  // Pick library folder on first run
                  const input = document.createElement('input');
                  input.type = 'file';
                  (input as any).webkitdirectory = true;
                  input.onchange = async e => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files.length > 0) {
                      const path =
                        (files[0] as any).webkitRelativePath?.split('/')?.[0] || 'AlLibrary';
                      await (
                        await import('@/services/storage/settingsService')
                      ).settingsService.setProjectFolder(path);
                    }
                  };
                  input.click();
                }}
              >
                Choose Library Folder
              </Button>
              <Button
                variant="primary"
                onClick={handleModalClose}
                aria-label={t('home.welcomeModal.enterLibrary')}
              >
                {t('home.welcomeModal.enterLibrary')}
              </Button>
            </div>
          </div>
        }
      >
        <div class={`${styles['welcome-modal-content']} ${styles['enhanced']}`}>
          <p class="text-base mb-4">{t('home.welcomeModal.description')}</p>

          <div class={`${styles['feature-list']} ${styles['enhanced']}`}>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']} aria-hidden="true">
                🔐
              </span>
              <span class={styles['feature-text']}>
                {t('home.welcomeModal.features.encryption')}
              </span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']} aria-hidden="true">
                🌐
              </span>
              <span class={styles['feature-text']}>
                {t('home.welcomeModal.features.globalNetwork')}
              </span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']} aria-hidden="true">
                ⚡
              </span>
              <span class={styles['feature-text']}>
                {t('home.welcomeModal.features.performance')}
              </span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']} aria-hidden="true">
                🏛️
              </span>
              <span class={styles['feature-text']}>
                {t('home.welcomeModal.features.culturalProtection')}
              </span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']} aria-hidden="true">
                🔍
              </span>
              <span class={styles['feature-text']}>
                {t('home.welcomeModal.features.advancedSearch')}
              </span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']} aria-hidden="true">
                📊
              </span>
              <span class={styles['feature-text']}>
                {t('home.welcomeModal.features.realTimeAnalytics')}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
