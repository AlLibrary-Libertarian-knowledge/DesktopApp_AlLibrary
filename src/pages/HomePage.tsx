import { Component, createSignal, onMount } from 'solid-js';
import { Button, Card, Input, Modal } from '../components/common';
import Breadcrumb from '../components/common/Breadcrumb';
import NetworkGraph from '../components/network/NetworkGraph';
import DownloadManager from '../components/dashboard/DownloadManager';
import StatusBar from '../components/dashboard/StatusBar';
import './HomePage.css';

const HomePage: Component = () => {
  const [showModal, setShowModal] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<'overview' | 'network' | 'downloads'>('overview');
  const [inputValue, setInputValue] = createSignal('');

  const breadcrumbItems = [{ label: 'Home', href: '/', icon: '🏠' }, { label: 'Dashboard' }];

  const handleModalOpen = () => setShowModal(true);
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

        <div class="network-status-header">
          <div class="status-indicator online">
            <span class="status-dot"></span>
            Network Online
          </div>
          <div class="connection-info">
            <span class="peer-count">89 peers</span>
            <span class="speed-info">↓ 2.4 MB/s ↑ 1.2 MB/s</span>
          </div>
        </div>
      </header>

      {/* Enhanced Navigation Tabs */}
      <div class="dashboard-tabs">
        <button
          class={`tab ${activeTab() === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          class={`tab ${activeTab() === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          🌐 Network
        </button>
        <button
          class={`tab ${activeTab() === 'downloads' ? 'active' : ''}`}
          onClick={() => setActiveTab('downloads')}
        >
          📥 Downloads
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
                <NetworkGraph width={800} height={350} showStats={true} theme="light" />
              </Card>
            </section>

            {/* Enhanced Activity Section */}
            <section class="activity-section enhanced">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Recent Downloads" padding="lg">
                  <div class="activity-list modern">
                    <div class="activity-item">
                      <div class="activity-icon downloading">📥</div>
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
                      <div class="activity-icon seeding">📤</div>
                      <div class="activity-content">
                        <h4 class="activity-title">Digital Archives Collection</h4>
                        <p class="activity-meta">Seeding • 1.5 MB/s upload</p>
                      </div>
                      <div class="activity-status">
                        <span class="status-badge seeding">Seeding</span>
                      </div>
                    </div>
                    <div class="activity-item">
                      <div class="activity-icon completed">✅</div>
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
                      <div class="activity-icon peer">🌐</div>
                      <div class="activity-content">
                        <h4 class="activity-title">Pacific Cultural Center</h4>
                        <p class="activity-meta">Connected • 45ms latency</p>
                      </div>
                      <div class="activity-status">
                        <span class="status-badge connected">Connected</span>
                      </div>
                    </div>
                    <div class="activity-item">
                      <div class="activity-icon institution">🏛️</div>
                      <div class="activity-content">
                        <h4 class="activity-title">Instituto Socioambiental</h4>
                        <p class="activity-meta">New documents shared • Brazil</p>
                      </div>
                      <div class="activity-status">
                        <span class="status-badge sharing">Sharing</span>
                      </div>
                    </div>
                    <div class="activity-item">
                      <div class="activity-icon discovery">🔍</div>
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
                    <span class="action-icon">📤</span>
                    <span class="action-text">Share Document</span>
                  </Button>
                  <Button variant="outline" class="action-button modern">
                    <span class="action-icon">🔍</span>
                    <span class="action-text">Search Network</span>
                  </Button>
                  <Button variant="outline" class="action-button modern">
                    <span class="action-icon">📊</span>
                    <span class="action-text">Analytics</span>
                  </Button>
                  <Button variant="outline" class="action-button modern">
                    <span class="action-icon">⚙️</span>
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
                  🔄 Refresh
                </Button>
                <Button variant="ghost" size="sm">
                  📊 Statistics
                </Button>
                <Button variant="outline" size="sm">
                  ⚙️ Configure
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
          </section>
        )}

        {/* Downloads Tab */}
        {activeTab() === 'downloads' && (
          <section class="downloads-section">
            <div class="section-header">
              <h2>Download Manager</h2>
              <div class="download-controls">
                <Button variant="primary" size="sm">
                  ➕ Add Download
                </Button>
                <Button variant="ghost" size="sm">
                  📋 Queue
                </Button>
                <Button variant="outline" size="sm">
                  ⚙️ Preferences
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

          <div class="mt-6">
            <Input
              label="What cultural knowledge would you like to preserve?"
              placeholder="Traditional recipes, stories, art techniques, historical documents..."
              value={inputValue()}
              onInput={setInputValue}
              hint="Your contributions help preserve cultural heritage for future generations"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
