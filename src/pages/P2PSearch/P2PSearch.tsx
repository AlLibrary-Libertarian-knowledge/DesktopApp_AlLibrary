/**
 * P2PSearch Page - Distributed P2P Network Search
 *
 * Comprehensive page for searching across the P2P network with cultural awareness
 * and anti-censorship features.
 */

import { Component, createSignal, Show } from 'solid-js';
import { P2PSearchInterface } from '@/components/domain/network/P2PSearchInterface';
import type {
  SearchResult,
  SearchOptions,
} from '@/components/domain/network/P2PSearchInterface/types';
import styles from './P2PSearch.module.css';
import { Button } from '@/components/foundation/Button';
import { Shield } from 'lucide-solid';
import { torAdapter } from '@/services/network/torAdapter';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';

/**
 * P2PSearch Page Component
 *
 * Provides comprehensive distributed search across the P2P network
 */
export const P2PSearch: Component = () => {
  const [lastSearchQuery, setLastSearchQuery] = createSignal<string>('');
  const [searchCount, setSearchCount] = createSignal<number>(0);
  const [torReady, setTorReady] = createSignal<boolean>(false);

  const enableTor = async () => {
    try {
      await torAdapter.start({ bridgeSupport: true });
      await p2pNetworkService.initializeNode({ torSupport: true });
      await p2pNetworkService.startNode();
      await p2pNetworkService.enableTorRouting();
      setTorReady(true);
    } catch (e) {
      console.error('Failed to enable TOR/P2P:', e);
      setTorReady(false);
    }
  };

  const handleSearch = (query: string, options: SearchOptions) => {
    setLastSearchQuery(query);
    setSearchCount(prev => prev + 1);
    console.log('P2P Search executed:', { query, options });
  };

  const handleResultSelect = (result: SearchResult) => {
    console.log('Selected search result:', result);
    // Here you would typically navigate to the selected content
    // or open it in a viewer
  };

  return (
    <div class={styles.p2pSearchPage}>
      <div class={styles.pageHeader}>
        <h1 class={styles.pageTitle}>P2P Network Search</h1>
        <p class={styles.pageDescription}>
          Search across the decentralized P2P network with cultural awareness and anti-censorship
          capabilities. All content is accessible with educational context provided.
        </p>

        <div class={styles.actionRow}>
          <Button variant={torReady() ? 'outline' : 'primary'} size="sm" onClick={enableTor}>
            <Shield size={16} class="mr-2" />
            {torReady() ? 'TOR Enabled' : 'Enable TOR'}
          </Button>
          <Show when={torReady()}>
            <span class={styles.statusChip} aria-live="polite">TOR active (anonymous mode)</span>
          </Show>
        </div>

        <div class={styles.searchStats}>
          <div class={styles.statItem}>
            <span class={styles.statLabel}>Searches Performed:</span>
            <span class={styles.statValue}>{searchCount()}</span>
          </div>
          {lastSearchQuery() && (
            <div class={styles.statItem}>
              <span class={styles.statLabel}>Last Query:</span>
              <span class={styles.statValue}>"{lastSearchQuery()}"</span>
            </div>
          )}
        </div>
      </div>

      <div class={styles.searchContainer}>
        <P2PSearchInterface
          onSearch={handleSearch}
          onResultSelect={handleResultSelect}
          maxResults={50}
          showAntiCensorshipInfo={true}
        />
      </div>

      <div class={styles.searchInfo}>
        <div class={styles.infoCard}>
          <h3 class={styles.infoTitle}>🔍 How P2P Search Works</h3>
          <ul class={styles.infoList}>
            <li>Search across all connected peers in the network</li>
            <li>Cultural context provided for educational purposes</li>
            <li>Anonymous search options through TOR integration</li>
            <li>Multiple perspectives and alternative narratives supported</li>
            <li>No content blocking - information freedom maintained</li>
          </ul>
        </div>

        <div class={styles.infoCard}>
          <h3 class={styles.infoTitle}>🛡️ Anti-Censorship Features</h3>
          <ul class={styles.infoList}>
            <li>Decentralized search - no central control</li>
            <li>TOR integration for anonymous access</li>
            <li>Multiple search strategies for censorship resistance</li>
            <li>Educational context enhances understanding</li>
            <li>Source verification and transparency</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
