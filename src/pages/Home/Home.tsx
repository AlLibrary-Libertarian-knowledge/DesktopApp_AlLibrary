import { type Component, createSignal, onMount, onCleanup } from 'solid-js';
import { Button, Card, Modal } from '../../components/foundation';
import {
  NetworkGraph,
  ActivityListCard,
  StatCard,
  type ActivityItemProps,
} from '../../components/composite';
import { DownloadManager, StatusBar, SecurityPanel } from '../../components/domain/dashboard';
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
  University,
  Zap,
  TrendingUp,
  ArrowRight,
} from 'lucide-solid';
import styles from './Home.module.css';
import { useNavigate } from '@solidjs/router';
import { settingsService } from '@/services/storage/settingsService';
import { invoke } from '@tauri-apps/api/core';
import { useNetworkStore } from '@/stores/network/networkStore';
import { downloadManager } from '@/services/network/downloadManager';
import { activityService } from '@/services/activityService';

const formatDownloadBytes = (bytes?: number): string => {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

const HomePage: Component = () => {
  // Initialize i18n translation hooks
  const { t } = useTranslation('pages');
  const { t: tc } = useTranslation('components');

  const [showModal, setShowModal] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<'overview' | 'network' | 'downloads'>('overview');

  const handleModalClose = () => setShowModal(false);

  const net = useNetworkStore();
  const navigate = useNavigate();

  const [recentDownloads, setRecentDownloads] = createSignal<ActivityItemProps[]>([]);
  const [networkActivity, setNetworkActivity] = createSignal<ActivityItemProps[]>([]);

  const mapDownloadItems = (
    active: ReturnType<typeof downloadManager.getActive>,
    completed: ReturnType<typeof downloadManager.getCompleted>
  ): ActivityItemProps[] => {
    const items: ActivityItemProps[] = active.map(item => ({
      type: 'downloading' as const,
      title: item.name,
      fileSize: formatDownloadBytes(item.sizeBytes),
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
        fileSize: formatDownloadBytes(item.sizeBytes),
        status: tc('activityList.status.complete'),
      });
    }
    return items;
  };

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

    setRecentDownloads(
      mapDownloadItems(downloadManager.getActive(), downloadManager.getCompleted())
    );
    const unsubscribe = downloadManager.subscribe((active, completed) => {
      setRecentDownloads(mapDownloadItems(active, completed));
    });
    onCleanup(() => unsubscribe());

    void loadNetworkActivity();
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
            status: t('home.networkStatus.online'),
            peers: String(net.connectedPeers()),
            health: `${net.networkHealthPct()}%`,
          })}
        >
          {/* Network Status Indicator */}
          <div class={styles['network-status-main']}>
            <div class={styles['status-row']}>
              <span class={styles['status-text']}>{t('home.networkStatus.online')}</span>
              <div class={`${styles['status-indicator']} ${styles.online}`}>
                <div class={styles['status-pulse']} />
              </div>
            </div>
            <div class={styles['health-row']}>
              <div class={styles['network-health']}>
                <div class={styles['health-bar']}>
                  <div
                    class={styles['health-fill']}
                    style={`width: ${net.networkHealthPct()}%`}
                    aria-label={t('home.networkStatus.health')}
                  />
                </div>
                <span class={styles['health-text']}>{t('home.networkStatus.health')}</span>
              </div>
            </div>
          </div>

          {/* Live Data Flow Visualization */}
          <div class={styles['data-flow-container']}>
            <div class={styles['flow-section']}>
              <div class={styles['flow-header']}>
                <span class={`${styles['flow-icon']} ${styles.download}`} aria-hidden="true">
                  ⬇
                </span>
                <span class={styles['flow-label']}>{t('home.dataFlow.download')}</span>
              </div>
              <div class={styles['flow-visual']}>
                <div class={`${styles['flow-stream']} ${styles['download-stream']}`}>
                  <div class={styles['flow-particle']} />
                  <div class={styles['flow-particle']} />
                  <div class={styles['flow-particle']} />
                </div>
                <div class={styles['flow-speed']}>{net.downloadMbps()} MB/s</div>
              </div>
            </div>

            <div class={styles['network-center']}>
              <div class={styles['network-node']}>
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
                  ⬆
                </span>
                <span class={styles['flow-label']}>{t('home.dataFlow.upload')}</span>
              </div>
              <div class={styles['flow-visual']}>
                <div class={`${styles['flow-stream']} ${styles['upload-stream']}`}>
                  <div class={styles['flow-particle']} />
                  <div class={styles['flow-particle']} />
                  <div class={styles['flow-particle']} />
                </div>
                <div class={styles['flow-speed']}>{net.uploadMbps()} MB/s</div>
              </div>
            </div>
          </div>

          {/* Network Activity Indicators - live counts */}
          <div class={styles['activity-indicators']}>
            <div class={styles['activity-item']}>
              <div class={`${styles['activity-dot']} ${styles.active}`} />
              <span class={styles['activity-text']}>
                {net.activeDownloads()} {t('home.activityIndicators.downloads')}
              </span>
            </div>
            <div class={styles['activity-item']}>
              <div class={`${styles['activity-dot']} ${styles.seeding}`} />
              <span class={styles['activity-text']}>
                {net.activeSeeding()} {t('home.activityIndicators.seeding')}
              </span>
            </div>
            <div class={styles['activity-item']}>
              <div class={`${styles['activity-dot']} ${styles.discovering}`} />
              <span class={styles['activity-text']}>
                {net.activeDiscovery()} {t('home.activityIndicators.discovering')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Navigation Tabs */}
      <div
        class={styles['dashboard-tabs']}
        role="tablist"
        aria-label={t('home.tabs.overview')}
        data-active={activeTab() === 'overview' ? '0' : activeTab() === 'network' ? '1' : '2'}
      >
        <button
          class={`${styles.tab} ${activeTab() === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
          role="tab"
          aria-selected={activeTab() === 'overview'}
          aria-controls="overview-panel"
          id="overview-tab"
        >
          <span class={styles['tab-text']}>
            <BarChart3 size={16} aria-hidden="true" />
            {t('home.tabs.overview')}
          </span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'network' ? styles.active : ''}`}
          onClick={() => setActiveTab('network')}
          role="tab"
          aria-selected={activeTab() === 'network'}
          aria-controls="network-panel"
          id="network-tab"
        >
          <span class={styles['tab-text']}>
            <Activity size={16} aria-hidden="true" />
            {t('home.tabs.network')}
          </span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'downloads' ? styles.active : ''}`}
          onClick={() => setActiveTab('downloads')}
          role="tab"
          aria-selected={activeTab() === 'downloads'}
          aria-controls="downloads-panel"
          id="downloads-tab"
        >
          <span class={styles['tab-text']}>
            <Download size={16} aria-hidden="true" />
            {t('home.tabs.downloads')}
          </span>
        </button>
      </div>

      <div class={styles['dashboard-content']} id="main-content">
        {/* Overview Tab */}
        {activeTab() === 'overview' && (
          <div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
            {/* Enhanced Stats Section */}
            <section aria-labelledby="stats-title">
              <h2 id="stats-title" class="sr-only">
                {t('home.stats.documentsShared')}
              </h2>
              <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                data-testid="stats-section"
              >
                <StatCard
                  type="documents"
                  icon={<BookOpen size={24} />}
                  number="12,847"
                  label={t('home.stats.documentsShared')}
                  trendType="positive"
                  trendIcon={<TrendingUp size={12} />}
                  trendValue="+127"
                  trendLabel={t('home.stats.today')}
                  graphType="chart"
                />
                <StatCard
                  type="peers"
                  icon={<Users size={24} />}
                  number="89"
                  label={t('home.stats.connectedPeers')}
                  trendType="positive"
                  trendIcon={<TrendingUp size={14} />}
                  trendValue="+5"
                  trendLabel={t('home.stats.online')}
                  graphType="peers"
                />
                <StatCard
                  type="institutions"
                  icon={<University size={24} />}
                  number="156"
                  label={t('home.stats.culturalInstitutions')}
                  trendType="neutral"
                  trendIcon={<ArrowRight size={14} />}
                  trendValue={t('home.stats.stable')}
                  graphType="map"
                />
                <StatCard
                  type="health"
                  icon={<Zap size={24} />}
                  number="98%"
                  label={t('home.stats.networkHealth')}
                  trendType="positive"
                  trendIcon={<TrendingUp size={14} />}
                  trendValue={t('home.stats.excellent')}
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
                  <div class={styles['network-stats']}>
                    <span class={styles['stat-item']}>
                      <span class={styles['stat-dot']} aria-hidden="true" />
                      89 {t('home.networkStatus.nodes')}
                    </span>
                    <span class={styles['stat-item']}>
                      <span class={styles['stat-dot']} aria-hidden="true" />
                      156 {t('home.networkStatus.connections')}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('network')}
                    aria-label={t('home.networkTopology.expandView')}
                  >
                    <ArrowRight size={16} aria-hidden="true" />
                    {t('home.networkTopology.expandView')}
                  </Button>
                </div>
              </div>

              <NetworkGraph
                width="100%"
                height={350}
                showStats={true}
                theme="light"
                aria-label={t('home.accessibility.networkGraphAria', {
                  nodes: 89,
                  connections: 156,
                })}
              />
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

            {/* Quick Actions */}
            <section class={styles['actions-section']} aria-labelledby="quick-actions-title">
              <h2 id="quick-actions-title" class={styles['section-title']}>
                {t('home.quickActions.title')}
              </h2>

              <div
                class={styles['actions-grid']}
                role="group"
                aria-labelledby="quick-actions-title"
              >
                <button
                  class={styles['action-button']}
                  data-testid="upload-button"
                  aria-label={t('home.quickActions.shareDocument')}
                  onClick={async () => {
                    // Open file picker via backend and stage into Document Management
                    const projectPath = await settingsService.getProjectFolder();
                    if (!projectPath) {
                      navigate('/documents');
                      return;
                    }
                    try {
                      const files = await invoke<string[] | null>('pick_document_files');
                      if (files && files.length) {
                        navigate('/documents');
                      } else {
                        navigate('/documents');
                      }
                    } catch {
                      navigate('/documents');
                    }
                  }}
                >
                  <Share size={20} aria-hidden="true" />
                  <span>{t('home.quickActions.shareDocument')}</span>
                </button>

                <button
                  class={styles['action-button']}
                  aria-label={t('home.quickActions.searchNetwork')}
                  onClick={() => navigate('/search-network')}
                >
                  <Search size={20} aria-hidden="true" />
                  <span>{t('home.quickActions.searchNetwork')}</span>
                </button>

                <button
                  class={styles['action-button']}
                  aria-label={t('home.quickActions.analytics')}
                  onClick={() => navigate('/network-health')}
                >
                  <BarChart3 size={20} aria-hidden="true" />
                  <span>{t('home.quickActions.analytics')}</span>
                </button>

                <button
                  class={styles['action-button']}
                  aria-label={t('home.quickActions.settings')}
                  onClick={() => navigate('/settings')}
                >
                  <Settings size={20} aria-hidden="true" />
                  <span>{t('home.quickActions.settings')}</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Network Tab */}
        {activeTab() === 'network' && (
          <div role="tabpanel" id="network-panel" aria-labelledby="network-tab">
            <section class={styles['network-section']} aria-labelledby="network-section-title">
              <div class={styles['section-header']}>
                <h2 id="network-section-title">{t('home.networkSection.title')}</h2>
                <div class={styles['network-controls']}>
                  <Button variant="ghost" size="sm" aria-label={t('home.networkSection.refresh')}>
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

              <Card class={styles['network-container']!}>
                <NetworkGraph
                  width={1200}
                  height={500}
                  showStats={true}
                  interactive={true}
                  theme="light"
                  aria-label={t('home.accessibility.networkGraphAria', {
                    nodes: 89,
                    connections: 156,
                  })}
                />
              </Card>

              {/* Security Analysis Section */}
              <SecurityPanel />
            </section>
          </div>
        )}

        {/* Downloads Tab */}
        {activeTab() === 'downloads' && (
          <div role="tabpanel" id="downloads-panel" aria-labelledby="downloads-tab">
            <section class={styles['downloads-section']} aria-labelledby="downloads-section-title">
              <div class={styles['section-header']}>
                <h2 id="downloads-section-title">{t('home.downloadsSection.title')}</h2>
                <div class={styles['download-controls']}>
                  <Button
                    variant="primary"
                    size="sm"
                    aria-label={t('home.downloadsSection.addDownload')}
                  >
                    <Plus size={14} aria-hidden="true" />
                    {t('home.downloadsSection.addDownload')}
                  </Button>
                  <Button variant="ghost" size="sm" aria-label={t('home.downloadsSection.queue')}>
                    <ClipboardList size={14} aria-hidden="true" />
                    {t('home.downloadsSection.queue')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={t('home.downloadsSection.preferences')}
                  >
                    <Settings size={14} aria-hidden="true" />
                    {t('home.downloadsSection.preferences')}
                  </Button>
                </div>
              </div>
              <Card class={styles['download-container']!}>
                <DownloadManager
                  onItemSelect={item => console.log('Selected:', item)}
                  onItemAction={(action, item) => console.log('Action:', action, item)}
                />
              </Card>
            </section>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar />

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
