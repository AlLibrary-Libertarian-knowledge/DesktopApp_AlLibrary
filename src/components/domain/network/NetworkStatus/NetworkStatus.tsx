/**
 * NetworkStatus Domain Component
 *
 * Displays P2P network status information including peer connections and bandwidth usage.
 */

import { Component } from 'solid-js';
import { Wifi, WifiOff, Users, Globe } from 'lucide-solid';
import styles from './NetworkStatus.module.css';

export interface NetworkStatusProps {
  isConnected?: boolean;
  peerCount?: number;
  bandwidthUsage?: number;
  class?: string;
}

export const NetworkStatus: Component<NetworkStatusProps> = props => {
  const isConnected = () => props.isConnected ?? true;
  const peerCount = () => props.peerCount ?? 5;
  const bandwidthUsage = () => props.bandwidthUsage ?? 45;

  return (
    <div class={`${styles.networkStatus} ${props.class || ''}`}>
      <div class={styles.statusIcon}>
        {isConnected() ? <Wifi size={20} /> : <WifiOff size={20} />}
      </div>
      <div class={styles.statusInfo}>
        <div class={styles.statusText}>{isConnected() ? 'Connected' : 'Disconnected'}</div>
        <div class={styles.statusDetails}>
          <span>
            <Users size={14} /> {peerCount()} peers
          </span>
          <span>
            <Globe size={14} /> {bandwidthUsage()}% bandwidth
          </span>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus;
