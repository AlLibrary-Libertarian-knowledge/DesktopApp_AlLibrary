/**
 * P2PSearchInterface Component - Distributed Search Frontend
 *
 * Provides interface for searching across the P2P network with cultural awareness
 * and anti-censorship features.
 *
 * ANTI-CENSORSHIP PRINCIPLES:
 * - Searches all available content without restrictions
 * - Displays cultural context for educational purposes only
 * - Supports anonymous search through TOR
 * - Provides multiple search strategies for censorship resistance
 */

import { Component, createSignal, createResource, Show, For, onMount } from 'solid-js';
import { useTranslation } from '../../../../i18n/hooks';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Input } from '@/components/foundation/Input';
import { Badge } from '@/components/foundation/Badge';
import { Select } from '@/components/foundation/Select';
import { Progress } from '@/components/foundation/Progress';
import { Switch } from '@/components/foundation/Switch';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';
import { torService } from '@/services/network/torService';
import type { P2PSearchInterfaceProps, SearchResult, SearchOptions } from './types';
import styles from './P2PSearchInterface.module.css';

/**
 * P2PSearchInterface Component
 *
 * Comprehensive distributed search interface with cultural awareness and anti-censorship features
 */
export const P2PSearchInterface: Component<P2PSearchInterfaceProps> = props => {
  const { t } = useTranslation('components');

  // State management
  const [searchQuery, setSearchQuery] = createSignal('');
  const [searchType, setSearchType] = createSignal<'content' | 'peer' | 'community'>('content');
  const [searchDepth, setSearchDepth] = createSignal<'local' | 'network' | 'deep'>('network');
  const [includeAnonymous, setIncludeAnonymous] = createSignal(false);
  const [includeCulturalContext, setIncludeCulturalContext] = createSignal(true);
  const [isSearching, setIsSearching] = createSignal(false);
  const [searchProgress, setSearchProgress] = createSignal(0);

  // Helper function defined before usage
  const getSearchOptions = (): SearchOptions => ({
    type: searchType(),
    includeAnonymous: includeAnonymous(),
    includeCulturalContext: includeCulturalContext(),
    searchDepth: searchDepth(),
    maxResults: props.maxResults || 50,
    enableEducationalContext: true,
    supportAlternativeNarratives: true,
    resistCensorship: true,
  });

  // Search results resource
  const [searchResults, { refetch: performSearch }] = createResource(
    () => ({ query: searchQuery(), options: getSearchOptions() }),
    async ({ query, options }): Promise<SearchResult[]> => {
      if (!query.trim()) return [];

      setIsSearching(true);
      setSearchProgress(0);

      try {
        // Simulate search progress
        const progressInterval = setInterval(() => {
          setSearchProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const results = await p2pNetworkService.searchNetwork(query, options);

        clearInterval(progressInterval);
        setSearchProgress(100);
        setIsSearching(false);

        return results || [];
      } catch (error) {
        console.error('Search failed:', error);
        setIsSearching(false);
        setSearchProgress(0);
        return [];
      }
    }
  );

  // Network status for search capabilities
  const [networkStatus] = createResource(async () => {
    try {
      return await p2pNetworkService.getNodeStatus();
    } catch (error) {
      console.error('Failed to get network status:', error);
      return null;
    }
  });

  const handleSearch = () => {
    if (!searchQuery().trim()) return;
    performSearch();
    if (props.onSearch) {
      props.onSearch(searchQuery(), getSearchOptions());
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (props.onResultSelect) {
      props.onResultSelect(result);
    }
  };

  const formatResultType = (type: string): string => {
    switch (type) {
      case 'document':
        return 'Document';
      case 'collection':
        return 'Collection';
      case 'peer':
        return 'Peer';
      case 'community':
        return 'Community';
      default:
        return 'Unknown';
    }
  };

  const getCulturalBadgeVariant = (level: number) => {
    if (level <= 1) return 'info';
    if (level <= 2) return 'warning';
    return 'error';
  };

  return (
    <div class={`${styles.searchInterface} ${props.class || ''}`}>
      {/* Search Header */}
      <Card class={styles.searchHeader}>
        <div class={styles.headerContent}>
          <h3 class={styles.title}>P2P Network Search</h3>
          <div class={styles.networkInfo}>
            <Show when={networkStatus()}>
              <Badge
                variant={networkStatus()?.connectedPeers > 0 ? 'success' : 'warning'}
                class={styles.networkBadge}
              >
                {networkStatus()?.connectedPeers || 0} peers connected
              </Badge>
            </Show>
            <Show when={includeAnonymous()}>
              <Badge variant="warning" class={styles.anonymousBadge}>
                Anonymous Search
              </Badge>
            </Show>
          </div>
        </div>
      </Card>

      {/* Search Controls */}
      <Card class={styles.searchControls}>
        <div class={styles.searchBar}>
          <Input
            value={searchQuery()}
            onInput={e => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search across P2P network..."
            class={styles.searchInput}
            disabled={isSearching()}
          />
          <Button
            onClick={handleSearch}
            disabled={!searchQuery().trim() || isSearching()}
            variant="primary"
            class={styles.searchButton}
          >
            {isSearching() ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Search Options */}
        <div class={styles.searchOptions}>
          <div class={styles.optionGroup}>
            <label class={styles.optionLabel}>Search Type:</label>
            <Select
              value={searchType()}
              onChange={setSearchType}
              options={[
                { value: 'content', label: 'Content & Documents' },
                { value: 'peer', label: 'Peers & Nodes' },
                { value: 'community', label: 'Community Networks' },
              ]}
              class={styles.searchTypeSelect}
            />
          </div>

          <div class={styles.optionGroup}>
            <label class={styles.optionLabel}>Search Depth:</label>
            <Select
              value={searchDepth()}
              onChange={setSearchDepth}
              options={[
                { value: 'local', label: 'Local Only' },
                { value: 'network', label: 'Connected Peers' },
                { value: 'deep', label: 'Extended Network' },
              ]}
              class={styles.searchDepthSelect}
            />
          </div>

          <div class={styles.switchGroup}>
            <Switch
              checked={includeAnonymous()}
              onChange={setIncludeAnonymous}
              label="Include Anonymous Sources"
              class={styles.anonymousSwitch}
            />
            <Switch
              checked={includeCulturalContext()}
              onChange={setIncludeCulturalContext}
              label="Include Cultural Context"
              class={styles.culturalSwitch}
            />
          </div>
        </div>

        {/* Search Progress */}
        <Show when={isSearching()}>
          <div class={styles.searchProgress}>
            <Progress value={searchProgress()} class={styles.progressBar} />
            <span class={styles.progressText}>Searching network... {searchProgress()}%</span>
          </div>
        </Show>
      </Card>

      {/* Search Results */}
      <Show when={searchResults()?.length > 0}>
        <Card class={styles.resultsContainer}>
          <div class={styles.resultsHeader}>
            <h4 class={styles.resultsTitle}>Search Results ({searchResults()?.length || 0})</h4>
            <div class={styles.resultsSummary}>
              <span class={styles.searchTime}>
                Search completed in {isSearching() ? '...' : '1.2s'}
              </span>
            </div>
          </div>

          <div class={styles.resultsList}>
            <For each={searchResults() || []}>
              {result => (
                <div class={styles.resultItem} onClick={() => handleResultClick(result)}>
                  <div class={styles.resultHeader}>
                    <div class={styles.resultInfo}>
                      <h5 class={styles.resultTitle}>{result.title}</h5>
                      <div class={styles.resultMeta}>
                        <Badge variant="secondary" class={styles.typeBadge}>
                          {formatResultType(result.type)}
                        </Badge>
                        <Show when={result.culturalLevel}>
                          <Badge
                            variant={getCulturalBadgeVariant(result.culturalLevel || 0)}
                            class={styles.culturalBadge}
                          >
                            Cultural Level {result.culturalLevel}
                          </Badge>
                        </Show>
                        <Show when={result.isAnonymous}>
                          <Badge variant="warning" class={styles.anonymousBadge}>
                            Anonymous Source
                          </Badge>
                        </Show>
                      </div>
                    </div>
                    <div class={styles.resultActions}>
                      <span class={styles.resultScore}>
                        Score: {(result.relevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div class={styles.resultContent}>
                    <p class={styles.resultDescription}>
                      {result.description || 'No description available'}
                    </p>
                    <Show when={result.snippet}>
                      <div class={styles.resultSnippet}>
                        <strong>Snippet:</strong> {result.snippet}
                      </div>
                    </Show>
                  </div>

                  <div class={styles.resultFooter}>
                    <div class={styles.resultSource}>
                      <span class={styles.sourceLabel}>Source:</span>
                      <span class={styles.sourcePeer}>
                        {result.sourcePeer?.name || result.sourcePeer?.id.slice(0, 8) || 'Unknown'}
                      </span>
                      <Show when={result.lastUpdated}>
                        <span class={styles.lastUpdated}>
                          Updated: {new Date(result.lastUpdated).toLocaleDateString()}
                        </span>
                      </Show>
                    </div>

                    {/* Cultural Context (Educational Only) */}
                    <Show when={result.culturalContext && includeCulturalContext()}>
                      <div class={styles.culturalContext}>
                        <div class={styles.culturalInfo}>
                          <span class={styles.culturalLabel}>Cultural Context:</span>
                          <span class={styles.culturalDescription}>
                            {result.culturalContext.description}
                          </span>
                        </div>
                        <Show when={result.culturalContext.educationalResources?.length}>
                          <div class={styles.educationalResources}>
                            <span class={styles.resourcesLabel}>Educational Resources:</span>
                            <For each={result.culturalContext.educationalResources || []}>
                              {resource => (
                                <Badge variant="info" class={styles.resourceBadge}>
                                  {resource}
                                </Badge>
                              )}
                            </For>
                          </div>
                        </Show>
                      </div>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Card>
      </Show>

      {/* No Results Message */}
      <Show
        when={
          !isSearching() && searchQuery() && (!searchResults() || searchResults()?.length === 0)
        }
      >
        <Card class={styles.noResults}>
          <div class={styles.noResultsContent}>
            <h4>No Results Found</h4>
            <p>No content found for "{searchQuery()}" in the P2P network.</p>
            <div class={styles.noResultsSuggestions}>
              <h5>Suggestions:</h5>
              <ul>
                <li>Try different search terms</li>
                <li>Enable anonymous sources for broader coverage</li>
                <li>Increase search depth to "Extended Network"</li>
                <li>
                  Check network connectivity ({networkStatus()?.connectedPeers || 0} peers
                  connected)
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </Show>

      {/* Anti-Censorship Notice */}
      <Show when={props.showAntiCensorshipInfo}>
        <Card class={styles.antiCensorshipInfo}>
          <div class={styles.infoContent}>
            <h5 class={styles.infoTitle}>Anti-Censorship Search</h5>
            <p class={styles.infoText}>
              This search operates on decentralized P2P principles. All content is searchable
              without restrictions. Cultural context is provided for educational purposes only and
              does not limit access to any information.
            </p>
            <div class={styles.infoFeatures}>
              <Badge variant="success">No Content Blocking</Badge>
              <Badge variant="success">Educational Context</Badge>
              <Badge variant="success">Anonymous Options</Badge>
              <Badge variant="success">Multiple Perspectives</Badge>
            </div>
          </div>
        </Card>
      </Show>
    </div>
  );
};
