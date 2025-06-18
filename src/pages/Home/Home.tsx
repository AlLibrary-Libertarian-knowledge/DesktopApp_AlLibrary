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
              <div class={styles['stats-header']}>
                <h2 class={styles['section-title']}>System Overview</h2>
                <div class={styles['stats-metrics']}>
                  <span class={styles['metric-indicator']}>
                    <div class={styles['metric-dot']}></div>
                    Real-time
                  </span>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                  variant="elevated"
                  class={`${styles['stat-card']} ${styles['enhanced']} ${styles['documents']}`}
                >
                  <div class={styles['stat-content']}>
                    <div class={styles['stat-header']}>
                      <div class={styles['stat-icon']}>
                        <BookOpen size={24} />
                      </div>
                      <div class={styles['stat-indicator']}>
                        <div class={styles['pulse-ring']}></div>
                      </div>
                    </div>
                    <div class={styles['stat-info']}>
                      <div class={styles['stat-main']}>
                        <h3 class={styles['stat-number']}>
                          <span class={styles['counter']} data-target="12847">
                            0
                          </span>
                        </h3>
                        <p class={styles['stat-label']}>Documents Shared</p>
                      </div>
                      <div class={`${styles['stat-trend']} ${styles['positive']}`}>
                        <TrendingUp size={14} />
                        <span class={styles['trend-value']}>+127</span>
                        <span class={styles['trend-label']}>today</span>
                      </div>
                    </div>
                  </div>
                  <div class={styles['stat-graph']}>
                    <div class={styles['mini-chart']}>
                      {Array.from({ length: 7 }, (_, i) => (
                        <div
                          class={styles['chart-bar']}
                          style={`height: ${Math.random() * 60 + 20}%`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card
                  variant="elevated"
                  class={`${styles['stat-card']} ${styles['enhanced']} ${styles['peers']}`}
                >
                  <div class={styles['stat-content']}>
                    <div class={styles['stat-header']}>
                      <div class={styles['stat-icon']}>
                        <Users size={24} />
                      </div>
                      <div class={styles['stat-indicator']}>
                        <div class={styles['pulse-ring']}></div>
                      </div>
                    </div>
                    <div class={styles['stat-info']}>
                      <div class={styles['stat-main']}>
                        <h3 class={styles['stat-number']}>
                          <span class={styles['counter']} data-target="89">
                            0
                          </span>
                        </h3>
                        <p class={styles['stat-label']}>Connected Peers</p>
                      </div>
                      <div class={`${styles['stat-trend']} ${styles['positive']}`}>
                        <TrendingUp size={14} />
                        <span class={styles['trend-value']}>+5</span>
                        <span class={styles['trend-label']}>online</span>
                      </div>
                    </div>
                  </div>
                  <div class={styles['stat-graph']}>
                    <div class={styles['peer-visualization']}>
                      {Array.from({ length: 6 }, (_, i) => (
                        <div
                          class={`${styles['peer-node']} ${i < 4 ? styles['active'] : ''}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card
                  variant="elevated"
                  class={`${styles['stat-card']} ${styles['enhanced']} ${styles['institutions']}`}
                >
                  <div class={styles['stat-content']}>
                    <div class={styles['stat-header']}>
                      <div class={styles['stat-icon']}>
                        <University size={24} />
                      </div>
                      <div class={styles['stat-indicator']}>
                        <div class={styles['pulse-ring']}></div>
                      </div>
                    </div>
                    <div class={styles['stat-info']}>
                      <div class={styles['stat-main']}>
                        <h3 class={styles['stat-number']}>
                          <span class={styles['counter']} data-target="156">
                            0
                          </span>
                        </h3>
                        <p class={styles['stat-label']}>Cultural Institutions</p>
                      </div>
                      <div class={`${styles['stat-trend']} ${styles['neutral']}`}>
                        <ArrowRight size={14} />
                        <span class={styles['trend-value']}>stable</span>
                      </div>
                    </div>
                  </div>
                  <div class={styles['stat-graph']}>
                    <div class={styles['institution-map']}>
                      <div class={styles['geo-dots']}>
                        {Array.from({ length: 12 }, (_, i) => (
                          <div
                            class={styles['geo-dot']}
                            style={`top: ${Math.random() * 80}%; left: ${Math.random() * 80}%`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card
                  variant="elevated"
                  class={`${styles['stat-card']} ${styles['enhanced']} ${styles['health']}`}
                >
                  <div class={styles['stat-content']}>
                    <div class={styles['stat-header']}>
                      <div class={styles['stat-icon']}>
                        <Zap size={24} />
                      </div>
                      <div class={styles['stat-indicator']}>
                        <div class={styles['pulse-ring']}></div>
                      </div>
                    </div>
                    <div class={styles['stat-info']}>
                      <div class={styles['stat-main']}>
                        <h3 class={styles['stat-number']}>
                          <span class={styles['counter']} data-target="98">
                            0
                          </span>
                          %
                        </h3>
                        <p class={styles['stat-label']}>Network Health</p>
                      </div>
                      <div class={`${styles['stat-trend']} ${styles['positive']}`}>
                        <TrendingUp size={14} />
                        <span class={styles['trend-value']}>excellent</span>
                      </div>
                    </div>
                  </div>
                  <div class={styles['stat-graph']}>
                    <div class={styles['health-ring']}>
                      <svg width="60" height="60" viewBox="0 0 60 60">
                        <circle
                          cx="30"
                          cy="30"
                          r="25"
                          fill="none"
                          stroke="rgba(148, 163, 184, 0.2)"
                          stroke-width="3"
                        />
                        <circle
                          cx="30"
                          cy="30"
                          r="25"
                          fill="none"
                          stroke="url(#healthGradient)"
                          stroke-width="3"
                          stroke-dasharray={`${2 * Math.PI * 25 * 0.98} ${2 * Math.PI * 25}`}
                          stroke-dashoffset={2 * Math.PI * 25 * 0.25}
                          class={styles['health-arc']}
                        />
                        <defs>
                          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color: #10b981" />
                            <stop offset="100%" style="stop-color: #34d399" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

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
              <Card class={`${styles['network-preview-card']} ${styles['enhanced']}`}>
                <div class={styles['network-overlay']}>
                  <div class={styles['scanning-line']}></div>
                  <div class={styles['network-metrics']}>
                    <div class={styles['metric']}>
                      <span class={styles['metric-label']}>Latency</span>
                      <span class={styles['metric-value']}>45ms</span>
                    </div>
                    <div class={styles['metric']}>
                      <span class={styles['metric-label']}>Throughput</span>
                      <span class={styles['metric-value']}>3.6 MB/s</span>
                    </div>
                  </div>
                </div>
                <NetworkGraph width="100%" height={350} showStats={true} theme="light" />
              </Card>
            </section>

            {/* Enhanced Activity Section */}
            <section class={`${styles['activity-section']} ${styles['enhanced']}`}>
              <div class={styles['section-header']}>
                <h2 class={styles['section-title']}>Live Activity</h2>
                <div class={styles['activity-controls']}>
                  <div class={styles['activity-filters']}>
                    <button class={`${styles['filter-btn']} ${styles['active']}`}>All</button>
                    <button class={styles['filter-btn']}>Downloads</button>
                    <button class={styles['filter-btn']}>Network</button>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card class={`${styles['activity-card']} ${styles['downloads']}`}>
                  <div class={styles['card-header']}>
                    <div class={styles['header-icon']}>
                      <Download size={20} />
                    </div>
                    <div class={styles['header-content']}>
                      <h3 class={styles['card-title']}>Recent Downloads</h3>
                      <p class={styles['card-subtitle']}>Active transfers and completed files</p>
                    </div>
                    <div class={styles['header-metrics']}>
                      <span class={styles['metric-badge']}>3 active</span>
                    </div>
                  </div>

                  <div class={`${styles['activity-list']} ${styles['modern']}`}>
                    <div class={`${styles['activity-item']} ${styles['downloading']}`}>
                      <div class={styles['item-indicator']}>
                        <div class={styles['progress-ring']}>
                          <svg width="40" height="40" viewBox="0 0 40 40">
                            <circle
                              cx="20"
                              cy="20"
                              r="16"
                              fill="none"
                              stroke="rgba(59, 130, 246, 0.2)"
                              stroke-width="2"
                            />
                            <circle
                              cx="20"
                              cy="20"
                              r="16"
                              fill="none"
                              stroke="#3b82f6"
                              stroke-width="2"
                              stroke-dasharray={`${2 * Math.PI * 16 * 0.67} ${2 * Math.PI * 16}`}
                              stroke-dashoffset={2 * Math.PI * 16 * 0.25}
                              class={styles['progress-arc']}
                            />
                          </svg>
                          <Download size={16} class={styles['progress-icon']} />
                        </div>
                      </div>

                      <div class={styles['activity-content']}>
                        <div class={styles['content-header']}>
                          <h4 class={styles['activity-title']}>
                            Traditional Healing Practices.pdf
                          </h4>
                          <div class={styles['file-size']}>2.4 MB</div>
                        </div>
                        <div class={styles['content-meta']}>
                          <span class={styles['progress-text']}>67% complete</span>
                          <span class={styles['speed-text']}>2.1 MB/s</span>
                        </div>
                        <div class={styles['content-progress']}>
                          <div class={styles['progress-bar']}>
                            <div class={styles['progress-fill']} style="width: 67%"></div>
                          </div>
                        </div>
                      </div>

                      <div class={styles['activity-status']}>
                        <span class={`${styles['status-badge']} ${styles['downloading']}`}>
                          <div class={styles['status-pulse']}></div>
                          Downloading
                        </span>
                      </div>
                    </div>

                    <div class={`${styles['activity-item']} ${styles['seeding']}`}>
                      <div class={styles['item-indicator']}>
                        <div class={styles['upload-indicator']}>
                          <Upload size={16} />
                        </div>
                      </div>

                      <div class={styles['activity-content']}>
                        <div class={styles['content-header']}>
                          <h4 class={styles['activity-title']}>Digital Archives Collection</h4>
                          <div class={styles['file-size']}>156 MB</div>
                        </div>
                        <div class={styles['content-meta']}>
                          <span class={styles['seeding-text']}>Seeding to 12 peers</span>
                          <span class={styles['speed-text']}>1.5 MB/s upload</span>
                        </div>
                      </div>

                      <div class={styles['activity-status']}>
                        <span class={`${styles['status-badge']} ${styles['seeding']}`}>
                          <div class={styles['status-pulse']}></div>
                          Seeding
                        </span>
                      </div>
                    </div>

                    <div class={`${styles['activity-item']} ${styles['completed']}`}>
                      <div class={styles['item-indicator']}>
                        <div class={styles['complete-indicator']}>
                          <CheckCircle size={16} />
                        </div>
                      </div>

                      <div class={styles['activity-content']}>
                        <div class={styles['content-header']}>
                          <h4 class={styles['activity-title']}>Andean Music Methods.epub</h4>
                          <div class={styles['file-size']}>8.2 MB</div>
                        </div>
                        <div class={styles['content-meta']}>
                          <span class={styles['complete-text']}>Completed 2 minutes ago</span>
                          <span class={styles['ready-text']}>Ready to share</span>
                        </div>
                      </div>

                      <div class={styles['activity-status']}>
                        <span class={`${styles['status-badge']} ${styles['completed']}`}>
                          <CheckCircle size={12} />
                          Complete
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class={styles['card-footer']}>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('downloads')}>
                      <ArrowRight size={14} class="mr-2" />
                      View Download Manager
                    </Button>
                  </div>
                </Card>

                <Card class={`${styles['activity-card']} ${styles['network']}`}>
                  <div class={styles['card-header']}>
                    <div class={styles['header-icon']}>
                      <Activity size={20} />
                    </div>
                    <div class={styles['header-content']}>
                      <h3 class={styles['card-title']}>Network Activity</h3>
                      <p class={styles['card-subtitle']}>Peer connections and data sharing</p>
                    </div>
                    <div class={styles['header-metrics']}>
                      <span class={styles['metric-badge']}>89 peers</span>
                    </div>
                  </div>

                  <div class={`${styles['activity-list']} ${styles['modern']}`}>
                    <div class={`${styles['activity-item']} ${styles['peer-connected']}`}>
                      <div class={styles['item-indicator']}>
                        <div class={styles['peer-indicator']}>
                          <Globe size={16} />
                          <div class={styles['connection-pulse']}></div>
                        </div>
                      </div>

                      <div class={styles['activity-content']}>
                        <div class={styles['content-header']}>
                          <h4 class={styles['activity-title']}>Pacific Cultural Center</h4>
                          <div class={styles['location-tag']}>Auckland, NZ</div>
                        </div>
                        <div class={styles['content-meta']}>
                          <span class={styles['connection-text']}>Connected 5 minutes ago</span>
                          <span class={styles['latency-text']}>45ms latency</span>
                        </div>
                        <div class={styles['peer-stats']}>
                          <div class={styles['stat-item']}>
                            <span class={styles['stat-label']}>Shared:</span>
                            <span class={styles['stat-value']}>247 docs</span>
                          </div>
                          <div class={styles['stat-item']}>
                            <span class={styles['stat-label']}>Trust:</span>
                            <span class={styles['stat-value']}>98%</span>
                          </div>
                        </div>
                      </div>

                      <div class={styles['activity-status']}>
                        <span class={`${styles['status-badge']} ${styles['connected']}`}>
                          <div class={styles['status-pulse']}></div>
                          Connected
                        </span>
                      </div>
                    </div>

                    <div class={`${styles['activity-item']} ${styles['institution']}`}>
                      <div class={styles['item-indicator']}>
                        <div class={styles['institution-indicator']}>
                          <Building2 size={16} />
                        </div>
                      </div>

                      <div class={styles['activity-content']}>
                        <div class={styles['content-header']}>
                          <h4 class={styles['activity-title']}>Instituto Socioambiental</h4>
                          <div class={styles['location-tag']}>São Paulo, BR</div>
                        </div>
                        <div class={styles['content-meta']}>
                          <span class={styles['sharing-text']}>Shared 15 new documents</span>
                          <span class={styles['time-text']}>12 minutes ago</span>
                        </div>
                        <div class={styles['content-tags']}>
                          <span class={styles['tag']}>Indigenous Rights</span>
                          <span class={styles['tag']}>Amazon</span>
                        </div>
                      </div>

                      <div class={styles['activity-status']}>
                        <span class={`${styles['status-badge']} ${styles['sharing']}`}>
                          <Upload size={12} />
                          Sharing
                        </span>
                      </div>
                    </div>

                    <div class={`${styles['activity-item']} ${styles['discovery']}`}>
                      <div class={styles['item-indicator']}>
                        <div class={styles['discovery-indicator']}>
                          <Search size={16} />
                          <div class={styles['discovery-scan']}></div>
                        </div>
                      </div>

                      <div class={styles['activity-content']}>
                        <div class={styles['content-header']}>
                          <h4 class={styles['activity-title']}>DHT Discovery Scan</h4>
                          <div class={styles['scan-progress']}>Scanning...</div>
                        </div>
                        <div class={styles['content-meta']}>
                          <span class={styles['discovery-text']}>
                            Found 12 new cultural archives
                          </span>
                          <span class={styles['quality-text']}>High relevance match</span>
                        </div>
                        <div class={styles['discovery-results']}>
                          <div class={styles['result-item']}>
                            <span class={styles['result-type']}>Indigenous Languages</span>
                            <span class={styles['result-count']}>4 sources</span>
                          </div>
                          <div class={styles['result-item']}>
                            <span class={styles['result-type']}>Traditional Music</span>
                            <span class={styles['result-count']}>8 sources</span>
                          </div>
                        </div>
                      </div>

                      <div class={styles['activity-status']}>
                        <span class={`${styles['status-badge']} ${styles['discovered']}`}>
                          <Search size={12} />
                          Discovered
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class={styles['card-footer']}>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('network')}>
                      <ArrowRight size={14} class="mr-2" />
                      View Network Status
                    </Button>
                  </div>
                </Card>
              </div>
            </section>

            {/* Enhanced Quick Actions */}
            <section class={`${styles['actions-section']} ${styles['enhanced']}`}>
              <div class={styles['section-header']}>
                <h2 class={styles['section-title']}>Quick Actions</h2>
                <div class={styles['action-metrics']}>
                  <span class={styles['metric-indicator']}>
                    <div class={styles['metric-dot']}></div>
                    Command Center
                  </span>
                </div>
              </div>

              <Card class={`${styles['actions-card']} ${styles['enhanced']}`}>
                <div class={styles['actions-grid']}>
                  <button
                    class={`${styles['action-button']} ${styles['modern']} ${styles['share']}`}
                  >
                    <div class={styles['action-background']}>
                      <div class={styles['action-glow']}></div>
                    </div>
                    <div class={styles['action-content']}>
                      <div class={styles['action-icon']}>
                        <Share size={24} />
                      </div>
                      <div class={styles['action-info']}>
                        <h4 class={styles['action-title']}>Share Document</h4>
                        <p class={styles['action-subtitle']}>Distribute to network</p>
                      </div>
                    </div>
                    <div class={styles['action-indicator']}>
                      <ArrowRight size={16} />
                    </div>
                  </button>

                  <button
                    class={`${styles['action-button']} ${styles['modern']} ${styles['search']}`}
                  >
                    <div class={styles['action-background']}>
                      <div class={styles['action-glow']}></div>
                    </div>
                    <div class={styles['action-content']}>
                      <div class={styles['action-icon']}>
                        <Search size={24} />
                      </div>
                      <div class={styles['action-info']}>
                        <h4 class={styles['action-title']}>Search Network</h4>
                        <p class={styles['action-subtitle']}>Discover content</p>
                      </div>
                    </div>
                    <div class={styles['action-indicator']}>
                      <ArrowRight size={16} />
                    </div>
                  </button>

                  <button
                    class={`${styles['action-button']} ${styles['modern']} ${styles['analytics']}`}
                  >
                    <div class={styles['action-background']}>
                      <div class={styles['action-glow']}></div>
                    </div>
                    <div class={styles['action-content']}>
                      <div class={styles['action-icon']}>
                        <BarChart3 size={24} />
                      </div>
                      <div class={styles['action-info']}>
                        <h4 class={styles['action-title']}>Analytics</h4>
                        <p class={styles['action-subtitle']}>View insights</p>
                      </div>
                    </div>
                    <div class={styles['action-indicator']}>
                      <ArrowRight size={16} />
                    </div>
                  </button>

                  <button
                    class={`${styles['action-button']} ${styles['modern']} ${styles['settings']}`}
                  >
                    <div class={styles['action-background']}>
                      <div class={styles['action-glow']}></div>
                    </div>
                    <div class={styles['action-content']}>
                      <div class={styles['action-icon']}>
                        <Settings size={24} />
                      </div>
                      <div class={styles['action-info']}>
                        <h4 class={styles['action-title']}>Settings</h4>
                        <p class={styles['action-subtitle']}>Configure system</p>
                      </div>
                    </div>
                    <div class={styles['action-indicator']}>
                      <ArrowRight size={16} />
                    </div>
                  </button>
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
