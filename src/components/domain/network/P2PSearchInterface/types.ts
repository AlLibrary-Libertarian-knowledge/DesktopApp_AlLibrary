/**
 * P2PSearchInterface Component Types
 *
 * TypeScript interfaces for distributed search functionality.
 */

export interface P2PSearchInterfaceProps {
  // Display options
  class?: string;
  maxResults?: number;

  // Feature toggles
  showAntiCensorshipInfo?: boolean;
  enableAnonymousSearch?: boolean;

  // Event handlers
  onSearch?: (query: string, options: SearchOptions) => void;
  onResultSelect?: (result: SearchResult) => void;
}

export interface SearchOptions {
  type: 'content' | 'peer' | 'community';
  includeAnonymous: boolean;
  includeCulturalContext: boolean;
  searchDepth: 'local' | 'network' | 'deep';
  maxResults: number;
  enableEducationalContext: boolean;
  supportAlternativeNarratives: boolean;
  resistCensorship: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  snippet?: string;
  type: 'document' | 'collection' | 'peer' | 'community';
  relevanceScore: number;
  culturalLevel?: number;
  isAnonymous?: boolean;
  lastUpdated?: string;
  sourcePeer?: {
    id: string;
    name?: string;
  };
  culturalContext?: {
    description: string;
    educationalResources?: string[];
  };
}
