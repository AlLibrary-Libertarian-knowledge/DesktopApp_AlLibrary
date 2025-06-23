/**
 * ConnectionManager Component - P2P Network Connection Management
 *
 * Provides controls for managing P2P network connections, including peer discovery,
 * connection settings, and network configuration with cultural awareness.
 *
 * ANTI-CENSORSHIP PRINCIPLES:
 * - Enables decentralized connections without central authority
 * - Supports anonymous TOR connections for privacy
 * - Allows cultural network participation without restrictions
 * - Provides educational context for cultural protocols
 */

import { Component, createSignal, createResource, onMount, Show, For } from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Badge } from '@/components/foundation/Badge';
import { Switch } from '@/components/foundation/Switch';
import { Modal } from '@/components/foundation/Modal';
import { Input } from '@/components/foundation/Input';
import { Select } from '@/components/foundation/Select';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';
import { torService } from '@/services/network/torService';
import { PeerCard } from '../PeerCard';
import type { Peer, NetworkConfig } from '@/types/Network';
import type { ConnectionManagerProps } from './types';
import styles from './ConnectionManager.module.css';

/**
 * ConnectionManager Component
 *
 * Comprehensive P2P network connection management with cultural awareness
 */
export const ConnectionManager: Component<ConnectionManagerProps> = props => {
  const [isConfigModalOpen, setIsConfigModalOpen] = createSignal(false);
  const [isAddPeerModalOpen, setIsAddPeerModalOpen] = createSignal(false);
  const [newPeerAddress, setNewPeerAddress] = createSignal('');
  const [selectedProtocol, setSelectedProtocol] = createSignal('tcp');

  // Network configuration resource
  const [networkConfig, { refetch: refetchConfig }] = createResource(
    async (): Promise<NetworkConfig> => {
      try {
        return await p2pNetworkService.getNetworkConfig();
      } catch (error) {
        console.error('Failed to fetch network config:', error);
        throw error;
      }
    }
  );

  // Available peers resource
  const [availablePeers, { refetch: refetchPeers }] = createResource(async (): Promise<Peer[]> => {
    try {
      return await p2pNetworkService.getAvailablePeers();
    } catch (error) {
      console.error('Failed to fetch available peers:', error);
      return [];
    }
  });

  // Connected peers resource
  const [connectedPeers, { refetch: refetchConnected }] = createResource(
    async (): Promise<Peer[]> => {
      try {
        return await p2pNetworkService.getConnectedPeers();
      } catch (error) {
        console.error('Failed to fetch connected peers:', error);
        return [];
      }
    }
  );

  // TOR status
  const [torEnabled, setTorEnabled] = createSignal(false);

  onMount(async () => {
    try {
      const torStatus = await torService.getStatus();
      setTorEnabled(torStatus.enabled);
    } catch (error) {
      console.error('Failed to get TOR status:', error);
    }
  });

  // Connection management functions
  const handleStartNetwork = async () => {
    try {
      await p2pNetworkService.startNode();
      refetchConfig();
      refetchPeers();
      refetchConnected();
      if (props.onStatusChange) {
        props.onStatusChange('started');
      }
    } catch (error) {
      console.error('Failed to start network:', error);
    }
  };

  const handleStopNetwork = async () => {
    try {
      await p2pNetworkService.stopNode();
      refetchConfig();
      refetchPeers();
      refetchConnected();
      if (props.onStatusChange) {
        props.onStatusChange('stopped');
      }
    } catch (error) {
      console.error('Failed to stop network:', error);
    }
  };

  const handleConnectToPeer = async (peerId: string) => {
    try {
      await p2pNetworkService.connectToPeer(peerId);
      refetchConnected();
      refetchPeers();
      if (props.onPeerConnect) {
        props.onPeerConnect(peerId);
      }
    } catch (error) {
      console.error('Failed to connect to peer:', error);
    }
  };

  const handleDisconnectFromPeer = async (peerId: string) => {
    try {
      await p2pNetworkService.disconnectFromPeer(peerId);
      refetchConnected();
      refetchPeers();
      if (props.onPeerDisconnect) {
        props.onPeerDisconnect(peerId);
      }
    } catch (error) {
      console.error('Failed to disconnect from peer:', error);
    }
  };

  const handleDiscoverPeers = async () => {
    try {
      await p2pNetworkService.discoverPeers({
        includeTorPeers: torEnabled(),
        includeHiddenServices: torEnabled(),
        enableEducationalSharing: true,
        supportAlternativeNarratives: true,
      });
      refetchPeers();
    } catch (error) {
      console.error('Failed to discover peers:', error);
    }
  };

  const handleToggleTor = async (enabled: boolean) => {
    try {
      if (enabled) {
        await torService.start();
      } else {
        await torService.stop();
      }
      setTorEnabled(enabled);
      refetchConfig();
    } catch (error) {
      console.error('Failed to toggle TOR:', error);
    }
  };

  const handleAddPeer = async () => {
    const address = newPeerAddress().trim();
    if (!address) return;

    try {
      await p2pNetworkService.addPeer(address, selectedProtocol());
      setNewPeerAddress('');
      setIsAddPeerModalOpen(false);
      refetchPeers();
    } catch (error) {
      console.error('Failed to add peer:', error);
    }
  };

  const isNetworkActive = () => {
    return networkConfig()?.ports?.p2p && (connectedPeers()?.length || 0) > 0;
  };

  return (
    <div class={`${styles.connectionManager} ${props.class || ''}`}>
      {/* Network Control Header */}
      <Card class={styles.controlHeader}>
        <div class={styles.headerContent}>
          <div class={styles.networkStatus}>
            <h3 class={styles.title}>P2P Network Control</h3>
            <Badge variant={isNetworkActive() ? 'success' : 'error'} class={styles.statusBadge}>
              {isNetworkActive() ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div class={styles.controls}>
            <Show when={!isNetworkActive()}>
              <Button onClick={handleStartNetwork} variant="primary">
                Start Network
              </Button>
            </Show>
            <Show when={isNetworkActive()}>
              <Button onClick={handleStopNetwork} variant="secondary">
                Stop Network
              </Button>
            </Show>
            <Button onClick={handleDiscoverPeers} variant="outline">
              Discover Peers
            </Button>
            <Button onClick={() => setIsConfigModalOpen(true)} variant="outline">
              Settings
            </Button>
          </div>
        </div>
      </Card>

      {/* Network Configuration */}
      <Show when={networkConfig()}>
        <Card class={styles.configSection}>
          <h4 class={styles.sectionTitle}>Network Configuration</h4>
          <div class={styles.configGrid}>
            <div class={styles.configItem}>
              <span class={styles.label}>P2P Port:</span>
              <span class={styles.value}>{networkConfig()?.ports?.p2p || 'Not configured'}</span>
            </div>
            <div class={styles.configItem}>
              <span class={styles.label}>Max Connections:</span>
              <span class={styles.value}>{networkConfig()?.maxConnections || 'Unlimited'}</span>
            </div>
            <div class={styles.configItem}>
              <span class={styles.label}>IPFS Enabled:</span>
              <Badge variant={networkConfig()?.ipfsEnabled ? 'success' : 'error'}>
                {networkConfig()?.ipfsEnabled ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div class={styles.configItem}>
              <span class={styles.label}>TOR Support:</span>
              <Switch checked={torEnabled()} onChange={handleToggleTor} label="Anonymous routing" />
            </div>
          </div>

          {/* Anti-Censorship Features */}
          <div class={styles.censorshipFeatures}>
            <h5 class={styles.featureTitle}>Anti-Censorship Features</h5>
            <div class={styles.features}>
              <Badge variant="success">Educational Mode</Badge>
              <Badge variant="success">Community Information</Badge>
              <Badge variant="success">Resist Censorship</Badge>
              <Badge variant="success">Preserve Alternatives</Badge>
              <Badge variant="error">No Cultural Filtering</Badge>
              <Badge variant="error">No Content Blocking</Badge>
            </div>
          </div>

          {/* Cultural Networks */}
          <Show when={networkConfig()?.communityNetworks?.length}>
            <div class={styles.culturalNetworks}>
              <h5 class={styles.featureTitle}>Cultural Networks</h5>
              <div class={styles.networks}>
                <For each={networkConfig()?.communityNetworks || []}>
                  {network => <Badge variant="info">{network}</Badge>}
                </For>
              </div>
              <p class={styles.networkDescription}>
                Connected to {networkConfig()?.communityNetworks?.length || 0} cultural networks
                providing educational context and community-specific resources.
              </p>
            </div>
          </Show>
        </Card>
      </Show>

      {/* Connected Peers */}
      <Show when={(connectedPeers()?.length || 0) > 0}>
        <Card class={styles.peersSection}>
          <div class={styles.sectionHeader}>
            <h4 class={styles.sectionTitle}>Connected Peers ({connectedPeers()?.length || 0})</h4>
            <Button onClick={() => setIsAddPeerModalOpen(true)} variant="outline" size="sm">
              Add Peer
            </Button>
          </div>
          <div class={styles.peersList}>
            <For each={connectedPeers()?.slice(0, 5) || []}>
              {peer => (
                <PeerCard
                  peer={peer}
                  variant="compact"
                  showCulturalContext={props.showCulturalContext}
                  onDisconnect={handleDisconnectFromPeer}
                  class={styles.peerCard}
                />
              )}
            </For>
            <Show when={(connectedPeers()?.length || 0) > 5}>
              <div class={styles.moreInfo}>
                ...and {(connectedPeers()?.length || 0) - 5} more peers
              </div>
            </Show>
          </div>
        </Card>
      </Show>

      {/* Available Peers */}
      <Show when={(availablePeers()?.length || 0) > 0}>
        <Card class={styles.discoverySection}>
          <h4 class={styles.sectionTitle}>Available Peers ({availablePeers()?.length || 0})</h4>
          <div class={styles.peersList}>
            <For each={availablePeers()?.slice(0, 3) || []}>
              {peer => (
                <PeerCard
                  peer={peer}
                  variant="compact"
                  showCulturalContext={props.showCulturalContext}
                  onConnect={handleConnectToPeer}
                  class={styles.peerCard}
                />
              )}
            </For>
          </div>
        </Card>
      </Show>

      {/* Configuration Modal */}
      <Modal
        isOpen={isConfigModalOpen()}
        onClose={() => setIsConfigModalOpen(false)}
        title="Network Configuration"
      >
        <div class={styles.configModal}>
          <div class={styles.configForm}>
            <div class={styles.formGroup}>
              <label>Maximum Connections</label>
              <Input
                type="number"
                value={networkConfig()?.maxConnections?.toString() || '50'}
                placeholder="50"
              />
            </div>
            <div class={styles.formGroup}>
              <label>P2P Port</label>
              <Input
                type="number"
                value={networkConfig()?.ports?.p2p?.toString() || '4001'}
                placeholder="4001"
              />
            </div>
            <div class={styles.formGroup}>
              <label>IPFS Content Addressing</label>
              <Switch
                checked={networkConfig()?.ipfsEnabled || false}
                label="Enable IPFS for distributed content"
              />
            </div>
            <div class={styles.formGroup}>
              <label>TOR Anonymous Routing</label>
              <Switch
                checked={torEnabled()}
                onChange={handleToggleTor}
                label="Enable anonymous connections"
              />
            </div>
          </div>
          <div class={styles.modalActions}>
            <Button variant="secondary" onClick={() => setIsConfigModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">Save Configuration</Button>
          </div>
        </div>
      </Modal>

      {/* Add Peer Modal */}
      <Modal
        isOpen={isAddPeerModalOpen()}
        onClose={() => setIsAddPeerModalOpen(false)}
        title="Add Peer"
      >
        <div class={styles.addPeerModal}>
          <div class={styles.addPeerForm}>
            <div class={styles.formGroup}>
              <label>Peer Address</label>
              <Input
                value={newPeerAddress()}
                onInput={e => setNewPeerAddress(e.target.value)}
                placeholder="/ip4/192.168.1.100/tcp/4001/p2p/..."
              />
            </div>
            <div class={styles.formGroup}>
              <label>Connection Protocol</label>
              <Select
                value={selectedProtocol()}
                onChange={setSelectedProtocol}
                options={[
                  { value: 'tcp', label: 'TCP' },
                  { value: 'tor', label: 'TOR (Anonymous)' },
                  { value: 'webrtc', label: 'WebRTC' },
                ]}
              />
            </div>
          </div>
          <div class={styles.modalActions}>
            <Button variant="secondary" onClick={() => setIsAddPeerModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddPeer}>
              Add Peer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
