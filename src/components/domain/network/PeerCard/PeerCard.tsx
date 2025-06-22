/**
 * PeerCard Domain Component
 *
 * Displays detailed information about a P2P network peer including connection status,
 * cultural affinity, and interaction options.
 */

import { Component } from 'solid-js';
import { User, Globe, Wifi } from 'lucide-solid';
import styles from './PeerCard.module.css';

export interface PeerCardProps {
  peer: {
    id: string;
    name?: string;
    location?: string;
    status: 'connected' | 'connecting' | 'disconnected';
    latency?: number;
  };
  class?: string;
}

export const PeerCard: Component<PeerCardProps> = props => {
  const getStatusColor = () => {
    switch (props.peer.status) {
      case 'connected':
        return '#22c55e';
      case 'connecting':
        return '#f59e0b';
      case 'disconnected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div class={`${styles.peerCard} ${props.class || ''}`}>
      <div class={styles.peerHeader}>
        <div class={styles.peerIcon}>
          <User size={16} />
        </div>
        <div class={styles.peerInfo}>
          <div class={styles.peerId}>{props.peer.id.slice(0, 8)}...</div>
          <div class={styles.peerName}>{props.peer.name || 'Anonymous'}</div>
        </div>
        <div class={styles.statusDot} style={{ 'background-color': getStatusColor() }} />
      </div>
      <div class={styles.peerDetails}>
        <div class={styles.peerLocation}>
          <Globe size={14} />
          <span>{props.peer.location || 'Unknown'}</span>
        </div>
        <div class={styles.peerLatency}>
          <Wifi size={14} />
          <span>{props.peer.latency || 0}ms</span>
        </div>
      </div>
    </div>
  );
};

export default PeerCard;
