/**
 * ConnectionManager Page - P2P Connection Management
 *
 * Comprehensive page for managing P2P connections, TOR integration,
 * and cultural network participation.
 */

import { Component } from 'solid-js';
import { ConnectionManager as ConnectionManagerComponent } from '@/components/domain/network/ConnectionManager';
import styles from './ConnectionManager.module.css';

/**
 * ConnectionManager Page Component
 *
 * Provides comprehensive P2P connection management interface
 */
export const ConnectionManager: Component = () => {
  return (
    <div class={styles.connectionManagerPage}>
      <div class={styles.pageHeader}>
        <h1 class={styles.pageTitle}>Connection Manager</h1>
        <p class={styles.pageDescription}>
          Manage your P2P network connections, TOR integration, and cultural network participation.
          Control your network presence while maintaining anti-censorship capabilities.
        </p>
      </div>

      <div class={styles.managerContainer}>
        <ConnectionManagerComponent />
      </div>

      <div class={styles.connectionInfo}>
        <div class={styles.infoCard}>
          <h3 class={styles.infoTitle}>🔗 Connection Management</h3>
          <ul class={styles.infoList}>
            <li>Direct peer-to-peer connections</li>
            <li>Cultural community network participation</li>
            <li>Automatic peer discovery and connection</li>
            <li>Connection quality monitoring and optimization</li>
            <li>Bandwidth and resource management</li>
          </ul>
        </div>

        <div class={styles.infoCard}>
          <h3 class={styles.infoTitle}>🛡️ Privacy & Security</h3>
          <ul class={styles.infoList}>
            <li>TOR integration for anonymous networking</li>
            <li>Encrypted peer-to-peer communications</li>
            <li>Identity protection and pseudonymous operation</li>
            <li>Anti-censorship connection strategies</li>
            <li>Secure cultural context sharing</li>
          </ul>
        </div>

        <div class={styles.infoCard}>
          <h3 class={styles.infoTitle}>🌍 Cultural Networks</h3>
          <ul class={styles.infoList}>
            <li>Connect to cultural community networks</li>
            <li>Educational context sharing and learning</li>
            <li>Multiple perspective support</li>
            <li>Traditional knowledge network participation</li>
            <li>Community sovereignty through technology</li>
          </ul>
        </div>

        <div class={styles.infoCard}>
          <h3 class={styles.infoTitle}>⚡ Performance</h3>
          <ul class={styles.infoList}>
            <li>Optimized connection routing</li>
            <li>Adaptive bandwidth management</li>
            <li>Low-latency peer discovery</li>
            <li>Efficient resource utilization</li>
            <li>Network resilience and redundancy</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
