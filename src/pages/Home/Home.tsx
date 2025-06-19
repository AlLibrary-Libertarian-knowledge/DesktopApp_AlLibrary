import { Component, createSignal, onMount } from 'solid-js';
import { Button, Card, Modal } from '../../components/foundation';
import {
  NetworkGraph,
  ActivityListCard,
  StatCard,
  type ActivityItemProps,
} from '../../components/composite';
import { DownloadManager, StatusBar, SecurityPanel } from '../../components/domain/dashboard';
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
      status: 'Downloading',
      metadata: '67% complete',
    },
    {
      type: 'seeding',
      title: 'Digital Archives Collection',
      fileSize: '156 MB',
      speed: '1.5 MB/s upload',
      status: 'Seeding',
      metadata: 'Seeding to 12 peers',
    },
    {
      type: 'completed',
      title: 'Andean Music Methods.epub',
      fileSize: '8.2 MB',
      status: 'Complete',
      metadata: 'Completed 2 minutes ago',
    },
  ];

  // Sample data for network activity
  const networkActivity: ActivityItemProps[] = [
    {
      type: 'peer-connected',
      title: 'Connected to peer node',
      status: 'Connected',
      metadata: 'Library.universidadsanmarcos.pe',
      peerCount: 24,
    },
    {
      type: 'institution',
      title: 'Institution sharing',
      status: 'Sharing',
      metadata: 'Universidad Nacional Mayor de San Marcos',
      resultCount: 847,
    },
    {
      type: 'discovery',
      title: 'Network discovery',
      status: 'Discovered',
      metadata: 'Found 3 new document sources',
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
          <h1 class={styles['page-title']}>AlLibrary Network Dashboard</h1>
          <p class={styles['page-subtitle']}>
            Decentralized Cultural Heritage Preservation Network
          </p>
        </div>

        <div class={styles['network-status-enhanced']}>
          {/* Network Status Indicator */}
          <div class={styles['network-status-main']}>
            <div class={styles['status-row']}>
              <span class={styles['status-text']}>Network Online</span>
              <div class={`${styles['status-indicator']} ${styles.online}`}>
                <div class={styles['status-pulse']}></div>
              </div>
            </div>
            <div class={styles['health-row']}>
              <div class={styles['network-health']}>
                <div class={styles['health-bar']}>
                  <div class={styles['health-fill']} style="width: 98%"></div>
                </div>
                <span class={styles['health-text']}>98% Health</span>
              </div>
            </div>
          </div>

          {/* Live Data Flow Visualization */}
          <div class={styles['data-flow-container']}>
            <div class={styles['flow-section']}>
              <div class={styles['flow-header']}>
                <span class={`${styles['flow-icon']} ${styles.download}`}>⬇</span>
                <span class={styles['flow-label']}>Download</span>
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
                <span class={styles['peer-label']}>peers</span>
              </div>
            </div>

            <div class={styles['flow-section']}>
              <div class={styles['flow-header']}>
                <span class={`${styles['flow-icon']} ${styles.upload}`}>⬆</span>
                <span class={styles['flow-label']}>Upload</span>
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
              <span class={styles['activity-text']}>3 Downloads</span>
            </div>
            <div class={styles['activity-item']}>
              <div class={`${styles['activity-dot']} ${styles.seeding}`}></div>
              <span class={styles['activity-text']}>7 Seeding</span>
            </div>
            <div class={styles['activity-item']}>
              <div class={`${styles['activity-dot']} ${styles.discovering}`}></div>
              <span class={styles['activity-text']}>2 Discovering</span>
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
            Overview
          </span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'network' ? styles.active : ''}`}
          onClick={() => setActiveTab('network')}
        >
          <span class={styles['tab-text']}>
            <Activity size={16} class="mr-2" />
            Network
          </span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'downloads' ? styles.active : ''}`}
          onClick={() => setActiveTab('downloads')}
        >
          <span class={styles['tab-text']}>
            <Download size={16} class="mr-2" />
            Downloads
          </span>
        </button>
      </div>

      <div class={styles['dashboard-content']}>
        {/* Overview Tab */}
        {activeTab() === 'overview' && (
          <>
            {/* Enhanced Stats Section */}

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                type="documents"
                icon={<BookOpen size={24} />}
                number="12,847"
                label="Documents Shared"
                trendType="positive"
                trendIcon={<TrendingUp size={12} />}
                trendValue="+127"
                trendLabel="today"
                graphType="chart"
              />
              <StatCard
                type="peers"
                icon={<Users size={24} />}
                number="89"
                label="Connected Peers"
                trendType="positive"
                trendIcon={<TrendingUp size={14} />}
                trendValue="+5"
                trendLabel="online"
                graphType="peers"
              />
              <StatCard
                type="institutions"
                icon={<University size={24} />}
                number="156"
                label="Cultural Institutions"
                trendType="neutral"
                trendIcon={<ArrowRight size={14} />}
                trendValue="stable"
                graphType="map"
              />
              <StatCard
                type="health"
                icon={<Zap size={24} />}
                number="98%"
                label="Network Health"
                trendType="positive"
                trendIcon={<TrendingUp size={14} />}
                trendValue="excellent"
                graphType="health"
              />
              -
            </div>

            {/* Enhanced Network Preview Section */}
            <section class={styles['network-preview-section']}>
              <div class={styles['section-header']}>
                <div class={styles['header-content']}>
                  <h2 class={styles['section-title']}>Network Topology</h2>
                  <p class={styles['section-subtitle']}>Live peer connection visualization</p>
                </div>
                <div class={styles['header-actions']}>
                  <div class={styles['network-stats']}>
                    <span class={styles['stat-item']}>
                      <span class={styles['stat-dot']}></span>
                      89 nodes
                    </span>
                    <span class={styles['stat-item']}>
                      <span class={styles['stat-dot']}></span>
                      156 connections
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('network')}>
                    <ArrowRight size={16} class="ml-2" />
                    Expand View
                  </Button>
                </div>
              </div>

              <NetworkGraph width="100%" height={350} showStats={true} theme="light" />
            </section>

            {/* Enhanced Activity Section */}
            <section class={`${styles['activity-section']} ${styles['enhanced']}`}>
              <div class={styles['section-header']}>
                <div class={styles['header-content']}>
                  <h2 class={styles['section-title']}>Network Activity</h2>
                  <p class={styles['section-subtitle']}>
                    Real-time downloads and network connections
                  </p>
                </div>
              </div>

              <div class={styles['grid']}>
                <ActivityListCard
                  title="Recent Downloads"
                  subtitle="Active downloads and uploads"
                  icon={<Download size={20} />}
                  items={recentDownloads}
                  cardType="downloads"
                />

                <ActivityListCard
                  title="Network Activity"
                  subtitle="Peer connections and discoveries"
                  icon={<Upload size={20} />}
                  items={networkActivity}
                  cardType="network"
                />
              </div>
            </section>

            {/* Quick Actions */}
            <section class={styles['actions-section']}>
              <h2 class={styles['section-title']}>Quick Actions</h2>

              <div class={styles['actions-grid']}>
                <button class={styles['action-button']}>
                  <Share size={20} />
                  <span>Share Document</span>
                </button>

                <button class={styles['action-button']}>
                  <Search size={20} />
                  <span>Search Network</span>
                </button>

                <button class={styles['action-button']}>
                  <BarChart3 size={20} />
                  <span>Analytics</span>
                </button>

                <button class={styles['action-button']}>
                  <Settings size={20} />
                  <span>Settings</span>
                </button>
              </div>
            </section>
          </>
        )}

        {/* Network Tab */}
        {activeTab() === 'network' && (
          <section class={styles['network-section']}>
            <div class={styles['section-header']}>
              <h2>Network Topology & Analysis</h2>
              <div class={styles['network-controls']}>
                <Button variant="ghost" size="sm">
                  <RefreshCw size={14} class="mr-2" />
                  Refresh
                </Button>
                <Button variant="ghost" size="sm">
                  <BarChart3 size={14} class="mr-2" />
                  Statistics
                </Button>
                <Button variant="outline" size="sm">
                  <Settings size={14} class="mr-2" />
                  Configure
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
              <h2>Download Manager</h2>
              <div class={styles['download-controls']}>
                <Button variant="primary" size="sm">
                  <Plus size={14} class="mr-2" />
                  Add Download
                </Button>
                <Button variant="ghost" size="sm">
                  <ClipboardList size={14} class="mr-2" />
                  Queue
                </Button>
                <Button variant="outline" size="sm">
                  <Settings size={14} class="mr-2" />
                  Preferences
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
        title="Welcome to AlLibrary"
        size="lg"
        footer={
          <div class="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleModalClose}>
              Take Tour
            </Button>
            <Button variant="primary" onClick={handleModalClose}>
              Enter AlLibrary
            </Button>
          </div>
        }
      >
        <div class={`${styles['welcome-modal-content']} ${styles['enhanced']}`}>
          <p class="text-base mb-4">
            AlLibrary is a sophisticated decentralized platform for preserving and sharing cultural
            heritage documents. Built on advanced P2P technology with TOR integration, we ensure
            traditional knowledge is preserved securely.
          </p>

          <div class={`${styles['feature-list']} ${styles['enhanced']}`}>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']}>🔐</span>
              <span class={styles['feature-text']}>
                Military-grade encryption with TOR anonymity
              </span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']}>🌐</span>
              <span class={styles['feature-text']}>Global P2P network with 156+ institutions</span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']}>⚡</span>
              <span class={styles['feature-text']}>High-performance libp2p with DHT routing</span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']}>🏛️</span>
              <span class={styles['feature-text']}>
                Cultural protection protocols & permissions
              </span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']}>🔍</span>
              <span class={styles['feature-text']}>
                Advanced search with cultural context filtering
              </span>
            </div>
            <div class={styles['feature-item']}>
              <span class={styles['feature-icon']}>📊</span>
              <span class={styles['feature-text']}>Real-time network analytics & monitoring</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
