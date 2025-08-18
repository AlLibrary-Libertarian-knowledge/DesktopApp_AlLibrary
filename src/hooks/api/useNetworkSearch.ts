/**
 * useNetworkSearch Hook
 *
 * Provides P2P network search functionality with cultural context awareness.
 * Enables searching across distributed peer network while maintaining privacy and anonymity.
 */

import { createSignal, onCleanup } from 'solid-js';
import { torAdapter } from '@/services/network/torAdapter';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';
import type { Document } from '@/types/core';

export interface NetworkSearchFilters {
  /** Search query string */
  query: string;
  /** Document type filter */
  documentType?: 'pdf' | 'epub' | 'all';
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
  // State management
  const [results, setResults] = createSignal<NetworkSearchResult[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [peersSearched, setPeersSearched] = createSignal(0);
  const [totalPeers, setTotalPeers] = createSignal(0);
  const [searchProgress, setSearchProgress] = createSignal(0);
  const [culturalResources, setCulturalResources] = createSignal<string[]>([]);
  const [currentSearchController, setCurrentSearchController] =
    createSignal<AbortController | null>(null);

  // Real network search: Tor-gated, title-only
  const runNetworkSearch = async (
    filters: NetworkSearchFilters,
    options: NetworkSearchOptions = {},
    signal: AbortSignal
  ): Promise<NetworkSearchResult[]> => {
    const st = await torAdapter.status();
    if (!st?.circuitEstablished) throw new Error('TOR circuit not established');
    // Title-only mode; request service to search titles
    const q = (filters.query || '').trim();
    if (!q) return [];
    // Delegate to service (it should aggregate peers via libp2p/Tor)
    const raw = await p2pNetworkService.searchNetwork(q, { mode: 'title', anonymous: options.anonymous !== false });
    // Adapt to NetworkSearchResult
    const mapped: NetworkSearchResult[] = (raw || []).map((r: any) => ({
      document: {
        id: r.id,
        title: r.title,
        author: r.author || '',
        description: r.description || '',
        filePath: r.filePath || '',
        fileSize: r.fileSize || 0,
        fileType: r.fileType || 'pdf',
        uploadDate: r.uploadDate ? new Date(r.uploadDate) : new Date(),
        tags: r.tags || [],
        culturalSensitivityLevel: r.culturalLevel || 1,
        isLocal: false,
        downloadCount: r.downloadCount || 0,
        rating: r.rating || 0,
        language: r.language || 'en',
        culturalOrigin: r.culturalOrigin || '',
      } as any,
      peerId: r.peerId || '',
      peerLocation: r.peerLocation,
      peerReputation: r.peerReputation || 0,
      culturalContext: options.includeCulturalEducation ? r.culturalContext : undefined,
      relevanceScore: r.relevanceScore || 0,
      estimatedDownloadTime: r.estimatedDownloadTime,
    }));
    return mapped;
  };

  // Perform network search
  const search = async (filters: NetworkSearchFilters, options: NetworkSearchOptions = {}) => {
    try {
      // Cancel any ongoing search
      cancelSearch();

      // Reset state
      setResults([]);
      setError(null);
      setPeersSearched(0);
      setTotalPeers(0);
      setSearchProgress(0);
      setCulturalResources([]);
      setIsSearching(true);

      // Create abort controller for this search
      const controller = new AbortController();
      setCurrentSearchController(controller);

      // Set default options
      const searchOptions: NetworkSearchOptions = {
        maxResults: 50,
        timeout: 30000,
        anonymous: false,
        includeCulturalEducation: true,
        peerStrategy: 'diverse',
        ...options,
      };

      // Perform search with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Search timeout')), searchOptions.timeout);
      });

      // Limit filters to title-only
      const titleOnly: NetworkSearchFilters = { ...filters, query: filters.query } as any;
      const searchPromise = runNetworkSearch(titleOnly, searchOptions, controller.signal);

      const results = await Promise.race([searchPromise, timeoutPromise]);

      // Apply max results limit
      const limitedResults = results.slice(0, searchOptions.maxResults);

      // Sort by relevance score
      limitedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      setResults(limitedResults);
      setSearchProgress(100);
    } catch (err) {
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
      setIsSearching(false);
      setCurrentSearchController(null);
    }
  };

  // Cancel ongoing search
  const cancelSearch = () => {
    const controller = currentSearchController();
    if (controller) {
      controller.abort();
      setCurrentSearchController(null);
    }
    setIsSearching(false);
  };

  // Clear search results
  const clearResults = () => {
    setResults([]);
    setError(null);
    setPeersSearched(0);
    setTotalPeers(0);
    setSearchProgress(0);
    setCulturalResources([]);
  };

  // Download document from peer
  const downloadFromPeer = async (result: NetworkSearchResult) => {
    try {
      // Mock download implementation (would use actual Tauri commands)
      console.log(`Downloading ${result.document.title} from peer ${result.peerId}`);

      // In real implementation, this would:
      // 1. Establish connection with peer
      // 2. Verify document integrity
      // 3. Download with progress tracking
      // 4. Validate cultural context information
      // 5. Add to local library with educational resources

      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log(`Download completed: ${result.document.title}`);
    } catch (err) {
      console.error('Download failed:', err);
      throw err;
    }
  };

  // Cleanup on unmount
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
