import { Component, createSignal, onMount } from 'solid-js';
import { Button, Card, Modal } from '../../components/foundation';
import { NetworkGraph } from '../../components/composite';
import { DownloadManager, StatusBar, SecurityPanel } from '../../components/domain/dashboard';
import {
  Download,
  Upload,
  CheckCircle,
  Globe,
  Building2,
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
  TrendingDown,
  ArrowRight,
} from 'lucide-solid';
import styles from './Home.module.css';

const HomePage: Component = () => {
  const [showModal, setShowModal] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<'overview' | 'network' | 'downloads'>('overview');

  const handleModalClose = () => setShowModal(false);

  onMount(() => {
    // Show welcome modal on first visit
    const hasVisited = localStorage.getItem('allibrary-visited');
    if (!hasVisited) {
      setShowModal(true);
      localStorage.setItem('allibrary-visited', 'true');
    }
  });

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
            <section class={`${styles['stats-section']} ${styles['enhanced']}`}>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card variant="elevated" class={`${styles['stat-card']} ${styles['enhanced']}`}>
                  <div class={styles['stat-content']}>
                    <div class={styles['stat-icon']}>
                      <BookOpen size={32} />
                    </div>
                    <div class={styles['stat-info']}>
                      <div class={styles['stat-main']}>
                        <h3 class={styles['stat-number']}>12,847</h3>
                        <p class={styles['stat-label']}>Documents Shared</p>
                      </div>
                      <div class={`${styles['stat-trend']} ${styles['positive']}`}>
                        <TrendingUp size={12} />
                        +127 today
                      </div>
                    </div>
                  </div>
                </Card>

                <Card variant="elevated" class={`${styles['stat-card']} ${styles['enhanced']}`}>
                  <div class={styles['stat-content']}>
                    <div class={styles['stat-icon']}>
                      <Users size={32} />
                    </div>
                    <div class={styles['stat-info']}>
                      <div class={styles['stat-main']}>
                        <h3 class={styles['stat-number']}>89</h3>
                        <p class={styles['stat-label']}>Connected Peers</p>
                      </div>
                      <div class={`${styles['stat-trend']} ${styles['positive']}`}>
                        <TrendingUp size={12} />
                        +5 online
                      </div>
                    </div>
                  </div>
                </Card>

                <Card variant="elevated" class={`${styles['stat-card']} ${styles['enhanced']}`}>
                  <div class={styles['stat-content']}>
                    <div class={styles['stat-icon']}>
                      <University size={32} />
                    </div>
                    <div class={styles['stat-info']}>
                      <div class={styles['stat-main']}>
                        <h3 class={styles['stat-number']}>156</h3>
                        <p class={styles['stat-label']}>Cultural Institutions</p>
                      </div>
                      <div class={`${styles['stat-trend']} ${styles['neutral']}`}>
                        <ArrowRight size={12} />
                        stable
                      </div>
                    </div>
                  </div>
                </Card>

                <Card variant="elevated" class={`${styles['stat-card']} ${styles['enhanced']}`}>
                  <div class={styles['stat-content']}>
                    <div class={styles['stat-icon']}>
                      <Zap size={32} />
                    </div>
                    <div class={styles['stat-info']}>
                      <div class={styles['stat-main']}>
                        <h3 class={styles['stat-number']}>98%</h3>
                        <p class={styles['stat-label']}>Network Health</p>
                      </div>
                      <div class={`${styles['stat-trend']} ${styles['positive']}`}>
                        <TrendingUp size={12} />
                        excellent
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {/* Mini Network Graph Preview */}
            <section class={styles['network-preview-section']}>
              <div class={styles['section-header']}>
                <h2>Network Overview</h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('network')}>
                  View Full Network →
                </Button>
              </div>
              <Card class={styles['network-preview-card']!}>
                <NetworkGraph width="100%" height={350} showStats={true} theme="light" />
              </Card>
            </section>

            {/* Enhanced Activity Section */}
            <section class={`${styles['activity-section']} ${styles['enhanced']}`}>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Recent Downloads" padding="lg">
                  <div class={`${styles['activity-list']} ${styles['modern']}`}>
                    <div class={styles['activity-item']}>
                      <div class={`${styles['activity-icon']} ${styles['downloading']}`}>
                        <Download size={16} />
                      </div>
                      <div class={styles['activity-content']}>
                        <h4 class={styles['activity-title']}>Traditional Healing Practices.pdf</h4>
                        <p class={styles['activity-meta']}>67% complete • 2.1 MB/s</p>
                        <div class={styles['activity-progress']}>
                          <div class={styles['progress-bar']}>
                            <div class={styles['progress-fill']} style="width: 67%"></div>
                          </div>
                        </div>
                      </div>
                      <div class={styles['activity-status']}>
                        <span class={`${styles['status-badge']} ${styles['downloading']}`}>
                          Downloading
                        </span>
                      </div>
                    </div>
                    <div class={styles['activity-item']}>
                      <div class={`${styles['activity-icon']} ${styles['seeding']}`}>
                        <Upload size={16} />
                      </div>
                      <div class={styles['activity-content']}>
                        <h4 class={styles['activity-title']}>Digital Archives Collection</h4>
                        <p class={styles['activity-meta']}>Seeding • 1.5 MB/s upload</p>
                      </div>
                      <div class={styles['activity-status']}>
                        <span class={`${styles['status-badge']} ${styles['seeding']}`}>
                          Seeding
                        </span>
                      </div>
                    </div>
                    <div class={styles['activity-item']}>
                      <div class={`${styles['activity-icon']} ${styles['completed']}`}>
                        <CheckCircle size={16} />
                      </div>
                      <div class={styles['activity-content']}>
                        <h4 class={styles['activity-title']}>Andean Music Methods.epub</h4>
                        <p class={styles['activity-meta']}>Completed • Ready to share</p>
                      </div>
                      <div class={styles['activity-status']}>
                        <span class={`${styles['status-badge']} ${styles['completed']}`}>
                          Complete
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class={styles['activity-footer']}>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('downloads')}>
                      View Download Manager
                    </Button>
                  </div>
                </Card>

                <Card title="Network Activity" padding="lg">
                  <div class={`${styles['activity-list']} ${styles['modern']}`}>
                    <div class={styles['activity-item']}>
                      <div class={`${styles['activity-icon']} ${styles['peer']}`}>
                        <Globe size={16} />
                      </div>
                      <div class={styles['activity-content']}>
                        <h4 class={styles['activity-title']}>Pacific Cultural Center</h4>
                        <p class={styles['activity-meta']}>Connected • 45ms latency</p>
                      </div>
                      <div class={styles['activity-status']}>
                        <span class={`${styles['status-badge']} ${styles['connected']}`}>
                          Connected
                        </span>
                      </div>
                    </div>
                    <div class={styles['activity-item']}>
                      <div class={`${styles['activity-icon']} ${styles['institution']}`}>
                        <Building2 size={16} />
                      </div>
                      <div class={styles['activity-content']}>
                        <h4 class={styles['activity-title']}>Instituto Socioambiental</h4>
                        <p class={styles['activity-meta']}>New documents shared • Brazil</p>
                      </div>
                      <div class={styles['activity-status']}>
                        <span class={`${styles['status-badge']} ${styles['sharing']}`}>
                          Sharing
                        </span>
                      </div>
                    </div>
                    <div class={styles['activity-item']}>
                      <div class={`${styles['activity-icon']} ${styles['discovery']}`}>
                        <Search size={16} />
                      </div>
                      <div class={styles['activity-content']}>
                        <h4 class={styles['activity-title']}>DHT Discovery</h4>
                        <p class={styles['activity-meta']}>Found 12 new cultural archives</p>
                      </div>
                      <div class={styles['activity-status']}>
                        <span class={`${styles['status-badge']} ${styles['discovered']}`}>
                          Discovered
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class={styles['activity-footer']}>
                    <Button variant="ghost" size="sm">
                      View Network Status
                    </Button>
                  </div>
                </Card>
              </div>
            </section>

            {/* Enhanced Quick Actions */}
            <section class={`${styles['actions-section']} ${styles['enhanced']}`}>
              <Card title="Quick Actions" padding="lg">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    class={`${styles['action-button']} ${styles['modern']}`}
                  >
                    <span class={styles['action-icon']}>
                      <Share size={20} />
                    </span>
                    <span class={styles['action-text']}>Share Document</span>
                  </Button>
                  <Button
                    variant="outline"
                    class={`${styles['action-button']} ${styles['modern']}`}
                  >
                    <span class={styles['action-icon']}>
                      <Search size={20} />
                    </span>
                    <span class={styles['action-text']}>Search Network</span>
                  </Button>
                  <Button
                    variant="outline"
                    class={`${styles['action-button']} ${styles['modern']}`}
                  >
                    <span class={styles['action-icon']}>
                      <BarChart3 size={20} />
                    </span>
                    <span class={styles['action-text']}>Analytics</span>
                  </Button>
                  <Button
                    variant="outline"
                    class={`${styles['action-button']} ${styles['modern']}`}
                  >
                    <span class={styles['action-icon']}>
                      <Settings size={20} />
                    </span>
                    <span class={styles['action-text']}>Settings</span>
                  </Button>
                </div>
              </Card>
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
