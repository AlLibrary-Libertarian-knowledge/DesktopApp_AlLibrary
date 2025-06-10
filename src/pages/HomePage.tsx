import { Component, createSignal, onMount } from 'solid-js';
import { Button, Card, Modal } from '../components/common';
import NetworkGraph from '../components/network/NetworkGraph';
import DownloadManager from '../components/dashboard/DownloadManager';
import StatusBar from '../components/dashboard/StatusBar';
import SecurityPanel from '../components/dashboard/SecurityPanel';
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
} from 'lucide-solid';
import './HomePage.css';

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
    <div class="home-page">
      {/* Breadcrumb Navigation */}
      {/* <Breadcrumb items={breadcrumbItems} class="page-breadcrumb" /> */}

      {/* Enhanced Page Header */}
      <header class="page-header enhanced">
        <div class="header-content">
          <h1 class="page-title">AlLibrary Network Dashboard</h1>
          <p class="page-subtitle">Decentralized Cultural Heritage Preservation Network</p>
        </div>

        <div class="network-status-enhanced">
          {/* Network Status Indicator */}
          <div class="network-status-main">
            <div class="status-row">
              <span class="status-text">Network Online</span>
              <div class="status-indicator online">
                <div class="status-pulse"></div>
              </div>
            </div>
            <div class="health-row">
              <div class="network-health">
                <div class="health-bar">
                  <div class="health-fill" style="width: 98%"></div>
                </div>
                <span class="health-text">98% Health</span>
              </div>
            </div>
          </div>

          {/* Live Data Flow Visualization */}
          <div class="data-flow-container">
            <div class="flow-section">
              <div class="flow-header">
                <span class="flow-icon download">⬇</span>
                <span class="flow-label">Download</span>
              </div>
              <div class="flow-visual">
                <div class="flow-stream download-stream">
                  <div class="flow-particle"></div>
                  <div class="flow-particle"></div>
                  <div class="flow-particle"></div>
                </div>
                <div class="flow-speed">2.4 MB/s</div>
              </div>
            </div>

            <div class="network-center">
              <div class="network-node">
                <div class="node-core"></div>
                <div class="node-ring"></div>
                <div class="node-outer"></div>
              </div>
              <div class="peer-count">
                <span class="peer-number">89</span>
                <span class="peer-label">peers</span>
              </div>
            </div>

            <div class="flow-section">
              <div class="flow-header">
                <span class="flow-icon upload">⬆</span>
                <span class="flow-label">Upload</span>
              </div>
              <div class="flow-visual">
                <div class="flow-stream upload-stream">
                  <div class="flow-particle"></div>
                  <div class="flow-particle"></div>
                  <div class="flow-particle"></div>
                </div>
                <div class="flow-speed">1.2 MB/s</div>
              </div>
            </div>
          </div>

          {/* Network Activity Indicators */}
          <div class="activity-indicators">
            <div class="activity-item">
              <div class="activity-dot active"></div>
              <span class="activity-text">3 Downloads</span>
            </div>
            <div class="activity-item">
              <div class="activity-dot seeding"></div>
              <span class="activity-text">7 Seeding</span>
            </div>
            <div class="activity-item">
              <div class="activity-dot discovering"></div>
              <span class="activity-text">2 Discovering</span>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Navigation Tabs */}
      <div
        class="dashboard-tabs"
        data-active={activeTab() === 'overview' ? '0' : activeTab() === 'network' ? '1' : '2'}
      >
        <button
          class={`tab ${activeTab() === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span class="tab-text">
            <BarChart3 size={16} class="mr-2" />
            Overview
          </span>
        </button>
        <button
          class={`tab ${activeTab() === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          <span class="tab-text">
            <Activity size={16} class="mr-2" />
            Network
          </span>
        </button>
        <button
          class={`tab ${activeTab() === 'downloads' ? 'active' : ''}`}
          onClick={() => setActiveTab('downloads')}
        >
          <span class="tab-text">
            <Download size={16} class="mr-2" />
            Downloads
          </span>
        </button>
      </div>

      <div class="dashboard-content">
        {/* Overview Tab */}
        {activeTab() === 'overview' && (
          <>
            {/* Enhanced Stats Section */}
            <section class="stats-section enhanced">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card variant="elevated" class="stat-card enhanced">
                  <div class="stat-content">
                    <div class="stat-icon">📚</div>
                    <div class="stat-info">
                      <h3 class="stat-number">12,847</h3>
                      <p class="stat-label">Documents Shared</p>
                      <div class="stat-trend positive">↗ +127 today</div>
                    </div>
                  </div>
                </Card>

                <Card variant="elevated" class="stat-card enhanced">
                  <div class="stat-content">
                    <div class="stat-icon">🌍</div>
                    <div class="stat-info">
                      <h3 class="stat-number">89</h3>
                      <p class="stat-label">Connected Peers</p>
                      <div class="stat-trend positive">↗ +5 online</div>
                    </div>
                  </div>
                </Card>

                <Card variant="elevated" class="stat-card enhanced">
                  <div class="stat-content">
                    <div class="stat-icon">🏛️</div>
                    <div class="stat-info">
                      <h3 class="stat-number">156</h3>
                      <p class="stat-label">Cultural Institutions</p>
                      <div class="stat-trend neutral">→ stable</div>
                    </div>
                  </div>
                </Card>

                <Card variant="elevated" class="stat-card enhanced">
                  <div class="stat-content">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-info">
                      <h3 class="stat-number">98%</h3>
                      <p class="stat-label">Network Health</p>
                      <div class="stat-trend positive">↗ excellent</div>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {/* Mini Network Graph Preview */}
            <section class="network-preview-section">
              <div class="section-header">
                <h2>Network Overview</h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('network')}>
                  View Full Network →
                </Button>
              </div>
              <Card class="network-preview-card">
                <NetworkGraph width="100%" height={350} showStats={true} theme="light" />
              </Card>
            </section>

            {/* Enhanced Activity Section */}
            <section class="activity-section enhanced">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Recent Downloads" padding="lg">
                  <div class="activity-list modern">
                    <div class="activity-item">
                      <div class="activity-icon downloading">
                        <Download size={16} />
                      </div>
                      <div class="activity-content">
                        <h4 class="activity-title">Traditional Healing Practices.pdf</h4>
                        <p class="activity-meta">67% complete • 2.1 MB/s</p>
                        <div class="activity-progress">
                          <div class="progress-bar">
                            <div class="progress-fill" style="width: 67%"></div>
                          </div>
                        </div>
                      </div>
                      <div class="activity-status">
                        <span class="status-badge downloading">Downloading</span>
                      </div>
                    </div>
                    <div class="activity-item">
                      <div class="activity-icon seeding">
                        <Upload size={16} />
                      </div>
                      <div class="activity-content">
                        <h4 class="activity-title">Digital Archives Collection</h4>
                        <p class="activity-meta">Seeding • 1.5 MB/s upload</p>
                      </div>
                      <div class="activity-status">
                        <span class="status-badge seeding">Seeding</span>
                      </div>
                    </div>
                    <div class="activity-item">
                      <div class="activity-icon completed">
                        <CheckCircle size={16} />
                      </div>
                      <div class="activity-content">
                        <h4 class="activity-title">Andean Music Methods.epub</h4>
                        <p class="activity-meta">Completed • Ready to share</p>
                      </div>
                      <div class="activity-status">
                        <span class="status-badge completed">Complete</span>
                      </div>
                    </div>
                  </div>
                  <div class="activity-footer">
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('downloads')}>
                      View Download Manager
                    </Button>
                  </div>
                </Card>

                <Card title="Network Activity" padding="lg">
                  <div class="activity-list modern">
                    <div class="activity-item">
                      <div class="activity-icon peer">
                        <Globe size={16} />
                      </div>
                      <div class="activity-content">
                        <h4 class="activity-title">Pacific Cultural Center</h4>
                        <p class="activity-meta">Connected • 45ms latency</p>
                      </div>
                      <div class="activity-status">
                        <span class="status-badge connected">Connected</span>
                      </div>
                    </div>
                    <div class="activity-item">
                      <div class="activity-icon institution">
                        <Building2 size={16} />
                      </div>
                      <div class="activity-content">
                        <h4 class="activity-title">Instituto Socioambiental</h4>
                        <p class="activity-meta">New documents shared • Brazil</p>
                      </div>
                      <div class="activity-status">
                        <span class="status-badge sharing">Sharing</span>
                      </div>
                    </div>
                    <div class="activity-item">
                      <div class="activity-icon discovery">
                        <Search size={16} />
                      </div>
                      <div class="activity-content">
                        <h4 class="activity-title">DHT Discovery</h4>
                        <p class="activity-meta">Found 12 new cultural archives</p>
                      </div>
                      <div class="activity-status">
                        <span class="status-badge discovered">Discovered</span>
                      </div>
                    </div>
                  </div>
                  <div class="activity-footer">
                    <Button variant="ghost" size="sm">
                      View Network Status
                    </Button>
                  </div>
                </Card>
              </div>
            </section>

            {/* Enhanced Quick Actions */}
            <section class="actions-section enhanced">
              <Card title="Quick Actions" padding="lg">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" class="action-button modern">
                    <span class="action-icon">
                      <Share size={20} />
                    </span>
                    <span class="action-text">Share Document</span>
                  </Button>
                  <Button variant="outline" class="action-button modern">
                    <span class="action-icon">
                      <Search size={20} />
                    </span>
                    <span class="action-text">Search Network</span>
                  </Button>
                  <Button variant="outline" class="action-button modern">
                    <span class="action-icon">
                      <BarChart3 size={20} />
                    </span>
                    <span class="action-text">Analytics</span>
                  </Button>
                  <Button variant="outline" class="action-button modern">
                    <span class="action-icon">
                      <Settings size={20} />
                    </span>
                    <span class="action-text">Settings</span>
                  </Button>
                </div>
              </Card>
            </section>
          </>
        )}

        {/* Network Tab */}
        {activeTab() === 'network' && (
          <section class="network-section">
            <div class="section-header">
              <h2>Network Topology & Analysis</h2>
              <div class="network-controls">
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

            <Card class="network-container">
              <NetworkGraph
                width={1200}
                height={700}
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
          <section class="downloads-section">
            <div class="section-header">
              <h2>Download Manager</h2>
              <div class="download-controls">
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
            <Card class="download-container">
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
        <div class="welcome-modal-content enhanced">
          <p class="text-base mb-4">
            AlLibrary is a sophisticated decentralized platform for preserving and sharing cultural
            heritage documents. Built on advanced P2P technology with TOR integration, we ensure
            traditional knowledge is preserved securely.
          </p>

          <div class="feature-list enhanced">
            <div class="feature-item">
              <span class="feature-icon">🔐</span>
              <span class="feature-text">Military-grade encryption with TOR anonymity</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🌐</span>
              <span class="feature-text">Global P2P network with 156+ institutions</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">⚡</span>
              <span class="feature-text">High-performance libp2p with DHT routing</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🏛️</span>
              <span class="feature-text">Cultural protection protocols & permissions</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔍</span>
              <span class="feature-text">Advanced search with cultural context filtering</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📊</span>
              <span class="feature-text">Real-time network analytics & monitoring</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
