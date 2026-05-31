/**
 * PeerNetworkPage - P2P Network Monitoring & Management
 */

import { type Component, createSignal, For, Show, createMemo } from 'solid-js';
import {
  Users,
  Globe,
  Shield,
  Activity,
  BarChart3,
  Settings,
  RefreshCw,
  ArrowRight,
  Network,
  Clock,
  BookOpen,
  Wifi,
  WifiOff,
  FileText,
} from 'lucide-solid';

import { Button } from '../../components/foundation/Button';
import { Card } from '../../components/foundation/Card';
import { Badge } from '../../components/foundation/Badge';
import { useNetworkLobby } from '../../hooks/api/useNetworkLobby';
import { useNetworkPeers } from '../../hooks/api/useNetworkPeers';
import { useNetworkPresenceResource } from '../../hooks/network/useNetworkPresence';

import styles from './PeerNetworkPage.module.css';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export const PeerNetworkPage: Component = () => {
  const [activeTab, setActiveTab] = createSignal<'overview' | 'peers' | 'health' | 'analytics'>(
    'overview'
  );
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');

  const presence = useNetworkPresenceResource();
  const lobby = useNetworkLobby();
  const networkPeers = useNetworkPeers();

  const isRefreshing = () => lobby.isLoading() || networkPeers.isLoading();

  const networkStats = createMemo(() => [
    {
      type: 'peers',
      icon: <Users size={24} />,
      number: String(lobby.onlineNodes()),
      label: 'Tracker Nodes Online',
      sublabel: 'from last lobby sync',
    },
    {
      type: 'cached-peers',
      icon: <Network size={24} />,
      number: String(networkPeers.peerCount()),
      label: 'Cached Peers',
      sublabel: 'in local SQLite cache',
    },
    {
      type: 'files',
      icon: <FileText size={24} />,
      number: String(lobby.files().length),
      label: 'Network Files',
      sublabel: 'shared on tracker',
    },
    {
      type: 'size',
      icon: <Globe size={24} />,
      number: formatBytes(lobby.totalBytes()),
      label: 'Total Shared Size',
      sublabel: lobby.lastSyncAt()
        ? `synced ${lobby.lastSyncAt()!.toLocaleTimeString()}`
        : 'awaiting sync',
    },
  ]);

  const handleRefreshPeers = async () => {
    await Promise.all([lobby.refresh(true), networkPeers.refresh(true)]);
  };

  const isOnline = () => presence().online;

  return (
    <div class={styles['peer-network-page']}>
      <header class={`${styles['page-header']} ${styles.enhanced}`}>
        <div class={styles['header-content']}>
          <div class={styles['title-section']}>
            <h1 class={styles['page-title']}>Peer Network Monitor</h1>
            <p class={styles['page-subtitle']}>
              Tracker peers and cached network metadata from your node
            </p>
          </div>
          <div class={styles['network-status-enhanced']}>
            <div class={styles['status-indicator']}>
              {isOnline() ? <Wifi size={20} /> : <WifiOff size={20} />}
              <span>{isOnline() ? 'Network Online' : 'Network Offline'}</span>
            </div>
            <div class={styles['peer-count']}>
              <Users size={16} />
              <span>{networkPeers.peerCount()} peers cached</span>
            </div>
          </div>
        </div>
      </header>

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
          <span>Onion Status</span>
        </button>
      </div>

      <div class={styles['dashboard-content']}>
        {activeTab() === 'overview' && (
          <>
            <div class={styles['stats-grid']}>
              <For each={networkStats()}>
                {stat => (
                  <Card class={styles['stat-card']}>
                    <div class={styles['stat-header']}>
                      <div class={styles['stat-icon']}>{stat.icon}</div>
                    </div>
                    <div class={styles['stat-content']}>
                      <div class={styles['stat-number']}>{stat.number}</div>
                      <div class={styles['stat-label']}>{stat.label}</div>
                      <div class={styles['stat-sublabel']}>{stat.sublabel}</div>
                    </div>
                  </Card>
                )}
              </For>
            </div>

            <section class={styles['activity-section']}>
              <div class={styles['section-header']}>
                <div class={styles['header-content']}>
                  <h2 class={styles['section-title']}>Network Activity</h2>
                  <p class={styles['section-subtitle']}>Live counts from tracker lobby cache</p>
                </div>
                <div class={styles['header-actions']}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshPeers}
                    disabled={isRefreshing()}
                  >
                    <RefreshCw size={16} />
                    {isRefreshing() ? 'Refreshing…' : 'Refresh'}
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
                    <h3>Tracker Nodes</h3>
                  </div>
                  <div class={styles['activity-content']}>
                    <div class={styles['activity-stat']}>
                      <span class={styles['stat-number']}>{lobby.onlineNodes()}</span>
                      <span class={styles['stat-label']}>Online on tracker</span>
                    </div>
                  </div>
                </Card>

                <Card class={styles['activity-card']}>
                  <div class={styles['activity-header']}>
                    <BookOpen size={20} />
                    <h3>Shared Files</h3>
                  </div>
                  <div class={styles['activity-content']}>
                    <div class={styles['activity-stat']}>
                      <span class={styles['stat-number']}>{lobby.files().length}</span>
                      <span class={styles['stat-label']}>Files in lobby</span>
                    </div>
                    <div class={styles['activity-trend']}>
                      <span>{formatBytes(lobby.totalBytes())} total</span>
                    </div>
                  </div>
                </Card>

                <Card class={styles['activity-card']}>
                  <div class={styles['activity-header']}>
                    <Globe size={20} />
                    <h3>Cached Peers</h3>
                  </div>
                  <div class={styles['activity-content']}>
                    <div class={styles['activity-stat']}>
                      <span class={styles['stat-number']}>{networkPeers.peerCount()}</span>
                      <span class={styles['stat-label']}>Peers in SQLite</span>
                    </div>
                  </div>
                </Card>
              </div>

              <Show when={lobby.syncError()}>
                <p style={{ color: 'var(--color-warning, #b45309)', 'margin-top': '1rem' }}>
                  Sync warning: {lobby.syncError()}
                </p>
              </Show>
            </section>

            <section class={styles['actions-section']}>
              <h2 class={styles['section-title']}>Network Actions</h2>
              <div class={styles['actions-grid']}>
                <button
                  class={styles['action-button']}
                  onClick={handleRefreshPeers}
                  disabled={isRefreshing()}
                >
                  <RefreshCw size={20} />
                  <span>Refresh Network</span>
                </button>
                <button class={styles['action-button']} onClick={() => setActiveTab('health')}>
                  <Activity size={20} />
                  <span>Network Health</span>
                </button>
                <button class={styles['action-button']} onClick={() => setActiveTab('analytics')}>
                  <Shield size={20} />
                  <span>Onion Status</span>
                </button>
              </div>
            </section>
          </>
        )}

        {activeTab() === 'peers' && (
          <section class={styles['peers-section']}>
            <div class={styles['section-header']}>
              <h2>Cached Peers</h2>
              <div class={styles['peer-controls']}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshPeers}
                  disabled={isRefreshing()}
                >
                  <RefreshCw size={14} />
                  {isRefreshing() ? 'Refreshing…' : 'Refresh'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode() === 'grid' ? 'list' : 'grid')}
                >
                  <Users size={14} />
                  {viewMode() === 'grid' ? 'List View' : 'Grid View'}
                </Button>
              </div>
            </div>

            <Show
              when={networkPeers.peers().length > 0}
              fallback={
                <Card class={styles['peer-card']}>
                  <div style={{ padding: '2rem', 'text-align': 'center' }}>
                    <p>No peers in cache yet.</p>
                    <p style={{ opacity: 0.75, 'margin-top': '0.5rem' }}>
                      Start onion share and sync the tracker from Configurations → Sync now.
                    </p>
                  </div>
                </Card>
              }
            >
              <div
                class={styles['peers-grid']}
                style={viewMode() === 'list' ? { 'grid-template-columns': '1fr' } : undefined}
              >
                <For each={networkPeers.peers()}>
                  {peer => (
                    <Card class={styles['peer-card']}>
                      <div class={styles['peer-header']}>
                        <h3 class={styles['peer-name']} title={peer.nodeId}>
                          {peer.displayName}
                        </h3>
                        <Badge variant="success">online</Badge>
                      </div>
                      <div class={styles['peer-info']}>
                        <div class={styles['info-item']}>
                          <Globe size={16} />
                          <span title={peer.onion}>{peer.onionShort}</span>
                        </div>
                        <div class={styles['info-item']}>
                          <Clock size={16} />
                          <span>Last seen: {peer.lastSeenLabel}</span>
                        </div>
                        <div class={styles['info-item']}>
                          <BookOpen size={16} />
                          <span>Files: {peer.fileCount}</span>
                        </div>
                      </div>
                    </Card>
                  )}
                </For>
              </div>
            </Show>
          </section>
        )}

        {activeTab() === 'health' && (
          <section class={styles['health-section']}>
            <div class={styles['section-header']}>
              <h2>Network Health</h2>
              <div class={styles['health-controls']}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshPeers}
                  disabled={isRefreshing()}
                >
                  <RefreshCw size={14} />
                  Refresh Status
                </Button>
              </div>
            </div>

            <div class={styles['health-grid']}>
              <Card class={styles['health-card']}>
                <div class={styles['health-header']}>
                  <Activity size={24} />
                  <h3>Tracker Connection</h3>
                </div>
                <div class={styles['health-content']}>
                  <div class={styles['health-metric']}>
                    <span class={styles['metric-label']}>Network status</span>
                    <Badge variant={isOnline() ? 'success' : 'secondary'}>
                      {isOnline() ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div class={styles['health-metric']}>
                    <span class={styles['metric-label']}>Nodes online</span>
                    <span class={styles['metric-value']}>{lobby.onlineNodes()}</span>
                  </div>
                  <div class={styles['health-metric']}>
                    <span class={styles['metric-label']}>Cached files</span>
                    <span class={styles['metric-value']}>{lobby.files().length}</span>
                  </div>
                  <div class={styles['health-metric']}>
                    <span class={styles['metric-label']}>Last sync</span>
                    <span class={styles['metric-value']}>
                      {lobby.lastSyncAt()?.toLocaleString() ?? 'Never'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card class={styles['health-card']}>
                <div class={styles['health-header']}>
                  <Shield size={24} />
                  <h3>Onion Share</h3>
                </div>
                <div class={styles['health-content']}>
                  <div class={styles['health-metric']}>
                    <span class={styles['metric-label']}>Onion routing</span>
                    <Badge variant={presence().onionActive ? 'success' : 'secondary'}>
                      {presence().onionActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div class={styles['health-metric']}>
                    <span class={styles['metric-label']}>Throughput</span>
                    <span class={styles['metric-value']}>—</span>
                  </div>
                  <div class={styles['health-metric']}>
                    <span class={styles['metric-label']}>Latency</span>
                    <span class={styles['metric-value']}>—</span>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {activeTab() === 'analytics' && (
          <section class={styles['emergency-section']}>
            <div class={styles['section-header']}>
              <h2>Onion & Tracker Status</h2>
            </div>

            <Card class={styles['emergency-card']}>
              <div class={styles['emergency-content']}>
                <div class={styles['emergency-header']}>
                  <Shield size={32} />
                  <div>
                    <h3>Hidden service & tracker</h3>
                    <p>
                      Onion share must be running to announce files to the tracker. Throughput and
                      latency metrics will appear here when the backend exposes them.
                    </p>
                  </div>
                </div>

                <div class={styles['protocol-status']}>
                  <div class={styles['status-item']}>
                    <Badge variant={presence().onionActive ? 'success' : 'secondary'}>
                      {presence().onionActive ? 'Onion active' : 'No onion address'}
                    </Badge>
                  </div>
                  <div class={styles['status-item']}>
                    <Badge variant={isOnline() ? 'success' : 'secondary'}>
                      {isOnline() ? 'Overlay online' : 'Overlay offline'}
                    </Badge>
                  </div>
                  <div class={styles['status-item']}>
                    <Badge variant="outline">
                      {networkPeers.peerCount()} peer{networkPeers.peerCount() !== 1 ? 's' : ''}{' '}
                      cached
                    </Badge>
                  </div>
                </div>

                <div class={styles['emergency-actions']}>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleRefreshPeers}
                    disabled={isRefreshing()}
                  >
                    <RefreshCw size={16} />
                    {isRefreshing() ? 'Syncing…' : 'Sync tracker now'}
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
