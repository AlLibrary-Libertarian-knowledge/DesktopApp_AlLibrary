/**
 * ConnectionManager Page - P2P Connection Management
 *
 * Comprehensive page for managing P2P connections, TOR integration,
 * and cultural network participation.
 */

import type { Component } from 'solid-js';
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
        <h1 class={styles.pageTitle}>Configurations</h1>
        <p class={styles.pageDescription}>
          Configure practical runtime limits and peer behavior using realistic mock controls while
          the networking backend is disabled.
        </p>
      </div>

      <div class={styles.managerContainer}>
        <ConnectionManagerComponent />
      </div>
    </div>
  );
};
