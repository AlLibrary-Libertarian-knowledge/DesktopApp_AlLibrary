/**
 * PeerNetworkPage - P2P Network Monitoring & Management
 * Enhanced to match HomePage and DocumentManagement sophisticated patterns
 */

// Declare global timer functions for TypeScript
declare global {
  function setTimeout(callback: () => void, delay: number): number;
}

import { Component, createSignal, For } from 'solid-js';
import {
  Users,
  Globe,
  Shield,
  Activity,
  BarChart3,
  Settings,
  RefreshCw,
  TrendingUp,
  ArrowRight,
  Network,
  Clock,
  AlertTriangle,
  BookOpen,
  Wifi,
} from 'lucide-solid';

// Foundation Components
import { Button } from '../../components/foundation/Button';
import { Card } from '../../components/foundation/Card';
import { Badge } from '../../components/foundation/Badge';

// Styles
import styles from './PeerNetworkPage.module.css';

export const PeerNetworkPage: Component = () => {
  // State Management
  const [activeTab, setActiveTab] = createSignal<'overview' | 'peers' | 'health' | 'analytics'>(
    'overview'
  );
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = createSignal<'all' | 'online' | 'trusted'>('all');
  const [isLoading, setIsLoading] = createSignal(false);

  // Sample data for demonstration
  const networkStats = [
    {
      type: 'peers',
      icon: <Users size={24} />,
      number: '89',
      label: 'Connected Peers',
      trendType: 'positive',
      trendIcon: <TrendingUp size={12} />,
      trendValue: '+5',
      trendLabel: 'online',
    },
    {
      type: 'decentralization',
      icon: <Network size={24} />,
      number: '94%',
      label: 'Decentralization Score',
      trendType: 'positive',
      trendIcon: <TrendingUp size={14} />,
      trendValue: '+2%',
      trendLabel: 'today',
    },
    {
      type: 'resistance',
      icon: <Shield size={24} />,
      number: '98%',
      label: 'Censorship Resistance',
      trendType: 'positive',
      trendIcon: <TrendingUp size={14} />,
      trendValue: 'excellent',
    },
    {
      type: 'cultural',
      icon: <Globe size={24} />,
      number: '156',
      label: 'Cultural Communities',
      trendType: 'neutral',
      trendIcon: <ArrowRight size={14} />,
      trendValue: 'stable',
    },
  ];

  // Sample connected peers data
  const mockConnectedPeers = [
    {
      id: '1',
      nickname: 'Universidad Nacional Autónoma de México',
      status: 'online',
      latency: 45,
      totalDocuments: 1247,
      culturalContributions: 89,
      capabilities: ['cultural-content', 'academic-research'],
    },
    {
      id: '2',
      nickname: 'Cultural Heritage Institute',
      status: 'online',
      latency: 78,
      totalDocuments: 823,
      culturalContributions: 156,
      capabilities: ['traditional-knowledge', 'artifact-digitization'],
    },
    {
      id: '3',
      nickname: 'Anonymous Peer',
      status: 'online',
      latency: 123,
      totalDocuments: 234,
      culturalContributions: 23,
      capabilities: ['general-sharing'],
    },
    {
      id: '4',
      nickname: 'Indigenous Knowledge Collective',
      status: 'online',
      latency: 67,
      totalDocuments: 567,
      culturalContributions: 234,
      capabilities: ['traditional-knowledge', 'cultural-preservation'],
    },
  ];

  // Handlers
  const handleEmergencyProtocols = async () => {
    setIsLoading(true);
    try {
      console.log('Activating emergency protocols...');
      await new Promise(resolve => window.setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Emergency protocols failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshPeers = async () => {
    setIsLoading(true);
    try {
      console.log('Refreshing peers...');
      await new Promise(resolve => window.setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to refresh peers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class={styles['peer-network-page']}>
      {/* Enhanced Page Header */}
      <header class={`${styles['page-header']} ${styles.enhanced}`}>
        <div class={styles['header-content']}>
          <div class={styles['title-section']}>
            <h1 class={styles['page-title']}>Peer Network Monitor</h1>
            <p class={styles['page-subtitle']}>
              Decentralized P2P network monitoring and anti-censorship protocols
            </p>
          </div>
          <div class={styles['network-status-enhanced']}>
            <div class={styles['status-indicator']}>
              <Wifi size={20} />
              <span>Network Online</span>
            </div>
            <div class={styles['peer-count']}>
              <Users size={16} />
              <span>{mockConnectedPeers.length} peers</span>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Navigation Tabs */}
      <div class={styles['dashboard-tabs']}>
        <button
          class={`${styles.tab} ${activeTab() === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          <span>Overview</span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'peers' ? styles.active : ''}`}
          onClick={() => setActiveTab('peers')}
        >
          <Users size={16} />
          <span>Connected Peers</span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'health' ? styles.active : ''}`}
          onClick={() => setActiveTab('health')}
        >
          <Activity size={16} />
          <span>Network Health</span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'analytics' ? styles.active : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <Shield size={16} />
          <span>Anti-Censorship</span>
        </button>
      </div>

      <div class={styles['dashboard-content']}>
        {/* Overview Tab */}
        {activeTab() === 'overview' && (
          <>
            {/* Network Statistics Section */}
            <div class={styles['stats-grid']}>
              <For each={networkStats}>
                {stat => (
                  <Card class={styles['stat-card']}>
                    <div class={styles['stat-header']}>
                      <div class={styles['stat-icon']}>{stat.icon}</div>
                      <div class={styles['stat-trend']}>
                        {stat.trendIcon}
                        <span class={styles[`trend-${stat.trendType}`]}>{stat.trendValue}</span>
                      </div>
                    </div>
                    <div class={styles['stat-content']}>
                      <div class={styles['stat-number']}>{stat.number}</div>
                      <div class={styles['stat-label']}>{stat.label}</div>
                      <div class={styles['stat-sublabel']}>{stat.trendLabel}</div>
                    </div>
                  </Card>
                )}
              </For>
            </div>

            {/* Network Activity Section */}
            <section class={styles['activity-section']}>
              <div class={styles['section-header']}>
                <div class={styles['header-content']}>
                  <h2 class={styles['section-title']}>Live Network Activity</h2>
                  <p class={styles['section-subtitle']}>
                    Real-time peer connections and network discoveries
                  </p>
                </div>
                <div class={styles['header-actions']}>
                  <Button variant="ghost" size="sm" onClick={handleRefreshPeers}>
                    <RefreshCw size={16} />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('peers')}>
                    View All Peers
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>

              <div class={styles['activity-cards']}>
                <Card class={styles['activity-card']}>
                  <div class={styles['activity-header']}>
                    <Users size={20} />
                    <h3>Peer Connections</h3>
                  </div>
                  <div class={styles['activity-content']}>
                    <div class={styles['activity-stat']}>
                      <span class={styles['stat-number']}>89</span>
                      <span class={styles['stat-label']}>Active Peers</span>
                    </div>
                    <div class={styles['activity-trend']}>
                      <TrendingUp size={14} />
                      <span>+5 new connections</span>
                    </div>
                  </div>
                </Card>

                <Card class={styles['activity-card']}>
                  <div class={styles['activity-header']}>
                    <BookOpen size={20} />
                    <h3>Content Sharing</h3>
                  </div>
                  <div class={styles['activity-content']}>
                    <div class={styles['activity-stat']}>
                      <span class={styles['stat-number']}>2.4k</span>
                      <span class={styles['stat-label']}>Documents Shared</span>
                    </div>
                    <div class={styles['activity-trend']}>
                      <TrendingUp size={14} />
                      <span>847 cultural documents</span>
                    </div>
                  </div>
                </Card>

                <Card class={styles['activity-card']}>
                  <div class={styles['activity-header']}>
                    <Globe size={20} />
                    <h3>Network Discovery</h3>
                  </div>
                  <div class={styles['activity-content']}>
                    <div class={styles['activity-stat']}>
                      <span class={styles['stat-number']}>156</span>
                      <span class={styles['stat-label']}>Cultural Communities</span>
                    </div>
                    <div class={styles['activity-trend']}>
                      <ArrowRight size={14} />
                      <span>3 new institutions</span>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {/* Quick Actions */}
            <section class={styles['actions-section']}>
              <h2 class={styles['section-title']}>Network Actions</h2>
              <div class={styles['actions-grid']}>
                <button class={styles['action-button']} onClick={handleRefreshPeers}>
                  <RefreshCw size={20} />
                  <span>Refresh Network</span>
                </button>
                <button class={styles['action-button']} onClick={handleEmergencyProtocols}>
                  <Shield size={20} />
                  <span>Emergency Protocols</span>
                </button>
                <button class={styles['action-button']} onClick={() => setActiveTab('analytics')}>
                  <BarChart3 size={20} />
                  <span>Network Analytics</span>
                </button>
                <button class={styles['action-button']}>
                  <Settings size={20} />
                  <span>Network Settings</span>
                </button>
              </div>
            </section>
          </>
        )}

        {/* Connected Peers Tab */}
        {activeTab() === 'peers' && (
          <section class={styles['peers-section']}>
            <div class={styles['section-header']}>
              <h2>Connected Peers</h2>
              <div class={styles['peer-controls']}>
                <Button variant="ghost" size="sm">
                  <Globe size={14} />
                  Discover Peers
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode() === 'grid' ? 'list' : 'grid')}
                >
                  <Users size={14} />
                  {viewMode() === 'grid' ? 'List View' : 'Grid View'}
                </Button>
                <Button variant="outline" size="sm">
                  <Settings size={14} />
                  Peer Settings
                </Button>
              </div>
            </div>

            <div class={styles['peer-filters']}>
              <Button
                variant={filterStatus() === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All Peers
              </Button>
              <Button
                variant={filterStatus() === 'online' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('online')}
              >
                Online Only
              </Button>
              <Button
                variant={filterStatus() === 'trusted' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('trusted')}
              >
                Trusted Peers
              </Button>
            </div>

            <div class={styles['peers-grid']}>
              <For each={mockConnectedPeers}>
                {peer => (
                  <Card class={styles['peer-card']}>
                    <div class={styles['peer-header']}>
                      <h3 class={styles['peer-name']}>{peer.nickname}</h3>
                      <Badge variant={peer.status === 'online' ? 'success' : 'secondary'}>
                        {peer.status}
                      </Badge>
                    </div>
                    <div class={styles['peer-info']}>
                      <div class={styles['info-item']}>
                        <Clock size={16} />
                        <span>Latency: {peer.latency}ms</span>
                      </div>
                      <div class={styles['info-item']}>
                        <BookOpen size={16} />
                        <span>Documents: {peer.totalDocuments}</span>
                      </div>
                      <div class={styles['info-item']}>
                        <Globe size={16} />
                        <span>Cultural: {peer.culturalContributions}</span>
                      </div>
                    </div>
                    <div class={styles['peer-capabilities']}>
                      <For each={peer.capabilities}>
                        {capability => (
                          <Badge variant="outline" size="sm">
                            {capability}
                          </Badge>
                        )}
                      </For>
                    </div>
                    <div class={styles['peer-actions']}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm">
                        Disconnect
                      </Button>
                    </div>
                  </Card>
                )}
              </For>
            </div>
          </section>
        )}

        {/* Network Health Tab */}
        {activeTab() === 'health' && (
          <section class={styles['health-section']}>
            <div class={styles['section-header']}>
              <h2>Network Health & Monitoring</h2>
              <div class={styles['health-controls']}>
                <Button variant="ghost" size="sm" onClick={handleRefreshPeers}>
                  <RefreshCw size={14} />
                  Refresh Status
                </Button>
                <Button variant="outline" size="sm">
                  <BarChart3 size={14} />
                  Detailed Analytics
                </Button>
              </div>
            </div>

            <div class={styles['health-grid']}>
              <Card class={styles['health-card']}>
                <div class={styles['health-header']}>
                  <Activity size={24} />
                  <h3>Network Health</h3>
                </div>
                <div class={styles['health-content']}>
                  <div class={styles['health-metric']}>
                    <span class={styles['metric-label']}>Overall Health</span>
                    <Badge variant="success">Excellent</Badge>
                  </div>
                  <div class={styles['health-metric']}>
                    <span class={styles['metric-label']}>Average Latency</span>
                    <span class={styles['metric-value']}>67ms</span>
                  </div>
                  <div class={styles['health-metric']}>
                    <span class={styles['metric-label']}>Network Bandwidth</span>
                    <span class={styles['metric-value']}>3.5 MB/s</span>
                  </div>
                </div>
              </Card>

              <Card class={styles['health-card']}>
                <div class={styles['health-header']}>
                  <Shield size={24} />
                  <h3>Security Status</h3>
                </div>
                <div class={styles['health-content']}>
                  <div class={styles['health-metric']}>
                    <span class={styles['metric-label']}>TOR Routing</span>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <div class={styles['health-metric']}>
                    <span class={styles['metric-label']}>Content Redundancy</span>
                    <Badge variant="success">OK</Badge>
                  </div>
                  <div class={styles['health-metric']}>
                    <span class={styles['metric-label']}>Network Resilience</span>
                    <Badge variant="success">Healthy</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Anti-Censorship Tab */}
        {activeTab() === 'analytics' && (
          <section class={styles['emergency-section']}>
            <div class={styles['section-header']}>
              <h2>Anti-Censorship Emergency Protocols</h2>
              <div class={styles['emergency-controls']}>
                <Button variant="ghost" size="sm">
                  <Shield size={14} />
                  Protocol Status
                </Button>
                <Button variant="outline" size="sm">
                  <Settings size={14} />
                  Configure
                </Button>
              </div>
            </div>

            <Card class={styles['emergency-card']}>
              <div class={styles['emergency-content']}>
                <div class={styles['emergency-header']}>
                  <Shield size={32} />
                  <div>
                    <h3>Emergency Anti-Censorship Protocols</h3>
                    <p>
                      Activate emergency protocols to bypass network restrictions and maintain
                      information access during censorship attempts.
                    </p>
                  </div>
                </div>

                <div class={styles['protocol-status']}>
                  <div class={styles['status-item']}>
                    <Badge variant="success">TOR Routing Active</Badge>
                  </div>
                  <div class={styles['status-item']}>
                    <Badge variant="success">Content Redundancy OK</Badge>
                  </div>
                  <div class={styles['status-item']}>
                    <Badge variant="success">Network Resilient</Badge>
                  </div>
                </div>

                <div class={styles['emergency-actions']}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleEmergencyProtocols}
                    disabled={isLoading()}
                  >
                    {isLoading() ? 'Activating...' : 'Activate Emergency Protocols'}
                  </Button>
                  <Button variant="outline" size="lg">
                    <AlertTriangle size={16} />
                    Test Protocols
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
};

export default PeerNetworkPage;
