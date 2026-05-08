import type { Component } from 'solid-js';
import styles from './NetworkInfo.module.css';

interface NetworkInfoProps {
  class?: string;
}

export const NetworkInfo: Component<NetworkInfoProps> = props => {
  return (
    <div class={`${styles.networkInfo} ${props.class || ''}`}>
      <div class={styles.header}>
        <h3>🌐 Network Information</h3>
      </div>
      <div class={styles.content}>
        <div class={styles.section}>
          <h4>Coming soon</h4>
          <p class={styles.helpText}>
            Legacy network controls (including M5/Onion Share) were removed. A new networking
            implementation will be added later.
          </p>
        </div>
      </div>
    </div>
  );
};
