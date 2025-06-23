import { Component, createSignal, onMount } from 'solid-js';
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

const HomePage: Component = () => {
  // Initialize i18n translation hooks
  const { t } = useTranslation('pages');
  const { t: tc } = useTranslation('components');

  const [showModal, setShowModal] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<'overview' | 'network' | 'downloads'>('overview');

  const handleModalClose = () => setShowModal(false);

  onMount(() => {
    // Show welcome modal on first visit
    const hasVisited = globalThis.localStorage?.getItem('allibrary-visited');
    if (!hasVisited) {
      setShowModal(true);
      globalThis.localStorage?.setItem('allibrary-visited', 'true');
    }
  });

  // Sample data for recent downloads
  const recentDownloads: ActivityItemProps[] = [
    {
      type: 'downloading',
      title: 'Traditional Healing Practices.pdf',
      fileSize: '2.4 MB',
      progress: 67,
      speed: '2.1 MB/s',
      status: tc('activityList.status.downloading'),
      metadata: tc('activityList.metadata.complete', { progress: 67 }),
    },
    {
      type: 'seeding',
      title: 'Digital Archives Collection',
      fileSize: '156 MB',
      speed: '1.5 MB/s upload',
      status: tc('activityList.status.seeding'),
      metadata: tc('activityList.metadata.seedingToPeers', { count: 12 }),
    },
    {
      type: 'completed',
      title: 'Andean Music Methods.epub',
      fileSize: '8.2 MB',
      status: tc('activityList.status.complete'),
      metadata: tc('activityList.metadata.completedAgo', { time: '2 minutes' }),
    },
  ];

  // Sample data for network activity
  const networkActivity: ActivityItemProps[] = [
    {
      type: 'peer-connected',
      title: tc('activityList.types.peerConnected'),
      status: tc('activityList.status.connected'),
      metadata: 'Library.universidadsanmarcos.pe',
      peerCount: 24,
    },
    {
      type: 'institution',
      title: tc('activityList.types.institution'),
      status: tc('activityList.status.sharing'),
      metadata: 'Universidad Nacional Mayor de San Marcos',
      resultCount: 847,
    },
    {
      type: 'discovery',
      title: tc('activityList.types.discovery'),
      status: tc('activityList.status.discovered'),
      metadata: tc('activityList.metadata.foundSources', { count: 3 }),
      resultCount: 3,
    },
  ];

  return (
    <div class={styles['home-page']}>
      {/* Breadcrumb Navigation */}
      {/* <Breadcrumb items={breadcrumbItems} class="page-breadcrumb" /> */}

      {/* Enhanced Page Header */}
      <header class={`${styles['page-header']} ${styles.enhanced}`}>
        <div class={styles['header-content']}>
          <h1 class={styles['page-title']}>{t('home.title')}</h1>
          <p class={styles['page-subtitle']}>{t('home.subtitle')}</p>
        </div>

        <div class={styles['network-status-enhanced']}>
          {/* Network Status Indicator */}
          <div class={styles['network-status-main']}>
            <div class={styles['status-row']}>
              <span class={styles['status-text']}>{t('home.networkStatus.online')}</span>
              <div class={`${styles['status-indicator']} ${styles.online}`}>
                <div class={styles['status-pulse']}></div>
              </div>
            </div>
            <div class={styles['health-row']}>
              <div class={styles['network-health']}>
                <div class={styles['health-bar']}>
                  <div class={styles['health-fill']} style="width: 98%"></div>
                </div>
                <span class={styles['health-text']}>{t('home.networkStatus.health')}</span>
              </div>
            </div>
          </div>

          {/* Live Data Flow Visualization */}
          <div class={styles['data-flow-container']}>
            <div class={styles['flow-section']}>
              <div class={styles['flow-header']}>
                <span class={`${styles['flow-icon']} ${styles.download}`}>⬇</span>
                <span class={styles['flow-label']}>{t('home.dataFlow.download')}</span>
              </div>
              <div class={styles['flow-visual']}>
                <div class={`${styles['flow-stream']} ${styles['download-stream']}`}>
                  <div class={styles['flow-particle']}></div>
                  <div class={styles['flow-particle']}></div>
                  <div class={styles['flow-particle']}></div>
                </div>
                <div class={styles['flow-speed']}>2.4 MB/s</div>
              </div>
            </div>

            <div class={styles['network-center']}>
              <div class={styles['network-node']}>
                <div class={styles['node-core']}></div>
                <div class={styles['node-ring']}></div>
                <div class={styles['node-outer']}></div>
              </div>
              <div class={styles['peer-count']}>
                <span class={styles['peer-number']}>89</span>
                <span class={styles['peer-label']}>{t('home.networkStatus.peers')}</span>
              </div>
            </div>

            <div class={styles['flow-section']}>
              <div class={styles['flow-header']}>
                <span class={`${styles['flow-icon']} ${styles.upload}`}>⬆</span>
                <span class={styles['flow-label']}>{t('home.dataFlow.upload')}</span>
              </div>
              <div class={styles['flow-visual']}>
                <div class={`${styles['flow-stream']} ${styles['upload-stream']}`}>
                  <div class={styles['flow-particle']}></div>
                  <div class={styles['flow-particle']}></div>
                  <div class={styles['flow-particle']}></div>
                </div>
                <div class={styles['flow-speed']}>1.2 MB/s</div>
              </div>
            </div>
          </div>

          {/* Network Activity Indicators */}
          <div class={styles['activity-indicators']}>
            <div class={styles['activity-item']}>
              <div class={`${styles['activity-dot']} ${styles.active}`}></div>
              <span class={styles['activity-text']}>
                3 {t('home.activityIndicators.downloads')}
              </span>
            </div>
            <div class={styles['activity-item']}>
              <div class={`${styles['activity-dot']} ${styles.seeding}`}></div>
              <span class={styles['activity-text']}>7 {t('home.activityIndicators.seeding')}</span>
            </div>
            <div class={styles['activity-item']}>
              <div class={`${styles['activity-dot']} ${styles.discovering}`}></div>
              <span class={styles['activity-text']}>
                2 {t('home.activityIndicators.discovering')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Navigation Tabs */}
      <div
        class={styles['dashboard-tabs']}
        data-active={activeTab() === 'overview' ? '0' : activeTab() === 'network' ? '1' : '2'}
      >
        <button
          class={`${styles.tab} ${activeTab() === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span class={styles['tab-text']}>
            <BarChart3 size={16} class="mr-2" />
            {t('home.tabs.overview')}
          </span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'network' ? styles.active : ''}`}
          onClick={() => setActiveTab('network')}
        >
          <span class={styles['tab-text']}>
            <Activity size={16} class="mr-2" />
            {t('home.tabs.network')}
          </span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'downloads' ? styles.active : ''}`}
          onClick={() => setActiveTab('downloads')}
        >
          <span class={styles['tab-text']}>
            <Download size={16} class="mr-2" />
            {t('home.tabs.downloads')}
          </span>
        </button>
      </div>

      <div class={styles['dashboard-content']}>
        {/* Overview Tab */}
        {activeTab() === 'overview' && (
          <>
            {/* Enhanced Stats Section */}

            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              data-testid="trending-section"
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

            {/* Enhanced Network Preview Section */}
            <section class={styles['network-preview-section']}>
              <div class={styles['section-header']}>
                <div class={styles['header-content']}>
                  <h2 class={styles['section-title']}>{t('home.networkTopology.title')}</h2>
                  <p class={styles['section-subtitle']}>{t('home.networkTopology.subtitle')}</p>
                </div>
                <div class={styles['header-actions']}>
                  <div class={styles['network-stats']}>
                    <span class={styles['stat-item']}>
                      <span class={styles['stat-dot']}></span>
                      89 {t('home.networkStatus.nodes')}
                    </span>
                    <span class={styles['stat-item']}>
                      <span class={styles['stat-dot']}></span>
                      156 {t('home.networkStatus.connections')}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('network')}>
                    <ArrowRight size={16} class="ml-2" />
                    {t('home.networkTopology.expandView')}
                  </Button>
                </div>
              </div>

              <NetworkGraph width="100%" height={350} showStats={true} theme="light" />
            </section>

            {/* Enhanced Activity Section */}
            <section class={`${styles['activity-section']} ${styles['enhanced']}`}>
              <div class={styles['section-header']}>
                <div class={styles['header-content']}>
                  <h2 class={styles['section-title']}>{t('home.networkActivity.title')}</h2>
                  <p class={styles['section-subtitle']}>{t('home.networkActivity.subtitle')}</p>
                </div>
              </div>

              <div class={styles['grid']}>
                <ActivityListCard
                  title={t('home.networkActivity.recentDownloads')}
                  subtitle={t('home.networkActivity.recentDownloadsSubtitle')}
                  icon={<Download size={20} />}
                  items={recentDownloads}
                  cardType="downloads"
                  data-testid="recent-documents"
                />

                <ActivityListCard
                  title={t('home.networkActivity.title')}
                  subtitle={t('home.networkActivity.networkActivitySubtitle')}
                  icon={<Upload size={20} />}
                  items={networkActivity}
                  cardType="network"
                />
              </div>
            </section>

            {/* Quick Actions */}
            <section class={styles['actions-section']}>
              <h2 class={styles['section-title']}>{t('home.quickActions.title')}</h2>

              <div class={styles['actions-grid']}>
                <button class={styles['action-button']} data-testid="upload-button">
                  <Share size={20} />
                  <span>{t('home.quickActions.shareDocument')}</span>
                </button>

                <button class={styles['action-button']}>
                  <Search size={20} />
                  <span>{t('home.quickActions.searchNetwork')}</span>
                </button>

                <button class={styles['action-button']}>
                  <BarChart3 size={20} />
                  <span>{t('home.quickActions.analytics')}</span>
                </button>

                <button class={styles['action-button']}>
                  <Settings size={20} />
                  <span>{t('home.quickActions.settings')}</span>
                </button>
              </div>
            </section>
          </>
        )}

        {/* Network Tab */}
        {activeTab() === 'network' && (
          <section class={styles['network-section']}>
            <div class={styles['section-header']}>
              <h2>{t('home.networkSection.title')}</h2>
              <div class={styles['network-controls']}>
                <Button variant="ghost" size="sm">
                  <RefreshCw size={14} class="mr-2" />
                  {t('home.networkSection.refresh')}
                </Button>
                <Button variant="ghost" size="sm">
                  <BarChart3 size={14} class="mr-2" />
                  {t('home.networkSection.statistics')}
                </Button>
                <Button variant="outline" size="sm">
                  <Settings size={14} class="mr-2" />
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
              />
            </Card>

            {/* Security Analysis Section */}
            <SecurityPanel />
          </section>
        )}

        {/* Downloads Tab */}
        {activeTab() === 'downloads' && (
          <section class={styles['downloads-section']}>
            <div class={styles['section-header']}>
              <h2>{t('home.downloadsSection.title')}</h2>
              <div class={styles['download-controls']}>
                <Button variant="primary" size="sm">
                  <Plus size={14} class="mr-2" />
                  {t('home.downloadsSection.addDownload')}
                </Button>
                <Button variant="ghost" size="sm">
                  <ClipboardList size={14} class="mr-2" />
                  {t('home.downloadsSection.queue')}
                </Button>
                <Button variant="outline" size="sm">
                  <Settings size={14} class="mr-2" />
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
        )}
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Enhanced Welcome Modal */}
      <Modal
        open={showModal()}
        onClose={handleModalClose}
        title={t('home.welcomeModal.title')}
        size="lg"
        footer={
          <div class="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleModalClose}>
              {t('home.welcomeModal.takeTour')}
            </Button>
            <Button variant="primary" onClick={handleModalClose}>
              {t('home.welcomeModal.enterLibrary')}
            </Button>
          </div>
        }
      >
        <div class={`${styles['welcome-modal-content']} ${styles['enhanced']}`}>
          <p class="text-base mb-4">{t('home.welcomeModal.description')}</p>

          <div class={`${styles['feature-list']} ${styles['enhanced']}`}>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']}>🔐</span>
              <span class={styles['feature-text']}>
                {t('home.welcomeModal.features.encryption')}
              </span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']}>🌐</span>
              <span class={styles['feature-text']}>
                {t('home.welcomeModal.features.globalNetwork')}
              </span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']}>⚡</span>
              <span class={styles['feature-text']}>
                {t('home.welcomeModal.features.performance')}
              </span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']}>🏛️</span>
              <span class={styles['feature-text']}>
                {t('home.welcomeModal.features.culturalProtection')}
              </span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']}>🔍</span>
              <span class={styles['feature-text']}>
                {t('home.welcomeModal.features.advancedSearch')}
              </span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']}>📊</span>
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
