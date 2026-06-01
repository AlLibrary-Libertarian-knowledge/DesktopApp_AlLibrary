/**
 * useNetworkSearch Hook
 *
 * Provides P2P network search functionality with cultural context awareness.
 * Enables searching across distributed peer network while maintaining privacy and anonymity.
 */

import { createSignal, onCleanup } from 'solid-js';
import { transferFacade } from '@/services/network/transferFacade';
import { networkFacade } from '@/services/network/networkFacade';
import type { Document } from '@/types/core';

export interface NetworkSearchFilters {
  /** Search query string */
  query: string;
  /** Document type filter */
  documentType?: 'pdf' | 'epub' | 'all';
  /** File extension filter (e.g. pdf, epub) */
  extensions?: string[];
  /** File size range */
  sizeRange?: {
    min: number;
    max: number;
  };
  /** Date range filter */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Cultural sensitivity level filter */
  culturalLevel?: number[];
  /** Language filter */
  languages?: string[];
  /** Peer reputation filter */
  minReputation?: number;
  /** Include anonymous peers */
  includeAnonymous?: boolean;
}

export interface NetworkSearchResult {
  /** Found document */
  document: Document;
  /** Peer providing the document */
  peerId: string;
  /** Number of peers seeding this file */
  peerCount: number;
  /** Swarm link when available */
  swarmLink?: string;
  /** Direct peer opoc:// or .onion link (preferred for fetch) */
  directLink?: string;
  /** Peer location */
  peerLocation?: string;
  /** Peer reputation score */
  peerReputation: number;
  /** Cultural context information */
  culturalContext?: {
    level: number;
    description: string;
    educationalResources: string[];
  };
  /** Search relevance score */
  relevanceScore: number;
  /** Estimated download time */
  estimatedDownloadTime?: number;
}

export interface NetworkSearchOptions {
  /** Maximum number of results */
  maxResults?: number;
  /** Search timeout in milliseconds */
  timeout?: number;
  /** Whether to search anonymously */
  anonymous?: boolean;
  /** Whether to include cultural education resources */
  includeCulturalEducation?: boolean;
  /** Peer selection strategy */
  peerStrategy?: 'fastest' | 'most-trusted' | 'diverse' | 'anonymous';
}

export interface UseNetworkSearchReturn {
  /** Current search results */
  results: () => NetworkSearchResult[];
  /** Whether search is in progress */
  isSearching: () => boolean;
  /** Search error if any */
  error: () => string | null;
  /** Number of peers searched */
  peersSearched: () => number;
  /** Total number of available peers */
  totalPeers: () => number;
  /** Search progress percentage */
  searchProgress: () => number;
  /** Cultural education resources found */
  culturalResources: () => string[];
  /** Perform network search */
  search: (filters: NetworkSearchFilters, options?: NetworkSearchOptions) => Promise<void>;
  /** Cancel ongoing search */
  cancelSearch: () => void;
  /** Clear search results */
  clearResults: () => void;
  /** Download document from peer */
  downloadFromPeer: (result: NetworkSearchResult) => Promise<void>;
}

export const useNetworkSearch = (): UseNetworkSearchReturn => {
  const [results, setResults] = createSignal<NetworkSearchResult[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [peersSearched, setPeersSearched] = createSignal(0);
  const [totalPeers, setTotalPeers] = createSignal(0);
  const [searchProgress, setSearchProgress] = createSignal(0);
  const [culturalResources, setCulturalResources] = createSignal<string[]>([]);
  const [currentSearchController, setCurrentSearchController] =
    createSignal<AbortController | null>(null);
  let searchGeneration = 0;

  const runNetworkSearch = async (
    filters: NetworkSearchFilters,
    options: NetworkSearchOptions = {},
    _signal: AbortSignal
  ): Promise<NetworkSearchResult[]> => {
    const q = (filters.query || '').trim();
    const matches = await networkFacade.searchFiles(q, {
      extensions: filters.extensions,
      limit: options.maxResults ?? 50,
    });
    const mapped: NetworkSearchResult[] = matches.map(f => ({
      document: {
        id: f.contentHash,
        title: f.name,
        author: 'P2P Network',
        description: `Available via ${f.peerCount} peer(s)`,
        filePath: f.link,
        fileSize: f.size,
        fileType: (f.name.split('.').pop() as string) || 'pdf',
        uploadDate: new Date(),
        tags: ['p2p', 'decentralized'],
        culturalSensitivityLevel: 1,
        isLocal: false,
        downloadCount: 0,
        rating: 0,
        language: 'en',
        culturalOrigin: '',
      } as unknown as Document,
      peerId: f.peers[0]?.nodeId || '',
      peerCount: f.peerCount,
      swarmLink: f.swarmLink,
      directLink: f.link,
      peerReputation: 5,
      relevanceScore: 100,
    }));
    return mapped;
  };

  const search = async (filters: NetworkSearchFilters, options: NetworkSearchOptions = {}) => {
    const generation = ++searchGeneration;
    try {
      cancelSearch();

      setError(null);
      setPeersSearched(0);
      setTotalPeers(0);
      setSearchProgress(0);
      setCulturalResources([]);
      setIsSearching(true);

      const controller = new AbortController();
      setCurrentSearchController(controller);

      const searchOptions: NetworkSearchOptions = {
        maxResults: 50,
        timeout: 30000,
        anonymous: false,
        includeCulturalEducation: true,
        peerStrategy: 'diverse',
        ...options,
      };

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Search timeout')), searchOptions.timeout);
      });

      const searchPromise = runNetworkSearch(filters, searchOptions, controller.signal);

      const searchResults = await Promise.race([searchPromise, timeoutPromise]);

      if (generation !== searchGeneration) {
        return;
      }

      const limitedResults = searchResults.slice(0, searchOptions.maxResults);

      limitedResults.sort(
        (a, b) =>
          a.document.id.localeCompare(b.document.id) ||
          a.document.title.localeCompare(b.document.title)
      );

      setResults(limitedResults);
      setSearchProgress(100);
    } catch (err) {
      if (generation !== searchGeneration) {
        return;
      }
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Search cancelled');
        } else {
          setError(err.message);
        }
      } else {
        setError('Unknown search error');
      }
    } finally {
      if (generation === searchGeneration) {
        setIsSearching(false);
        setCurrentSearchController(null);
      }
    }
  };

  const cancelSearch = () => {
    const controller = currentSearchController();
    if (controller) {
      controller.abort();
      setCurrentSearchController(null);
    }
    setIsSearching(false);
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
    setPeersSearched(0);
    setTotalPeers(0);
    setSearchProgress(0);
    setCulturalResources([]);
  };

  const downloadFromPeer = async (result: NetworkSearchResult) => {
    await transferFacade.downloadByHashOrLink(result.document.id, result.document.title);
  };

  onCleanup(() => {
    cancelSearch();
  });

  return {
    results,
    isSearching,
    error,
    peersSearched,
    totalPeers,
    searchProgress,
    culturalResources,
    search,
    cancelSearch,
    clearResults,
    downloadFromPeer,
  };
};
