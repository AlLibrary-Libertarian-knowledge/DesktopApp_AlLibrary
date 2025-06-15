import { invoke } from '@tauri-apps/api/core';
import type { Document } from '../types/Document';
import type { SearchSettings, AppSettings } from '../types/Settings';
import { projectService } from './projectService';
import { validationService } from './index';

export interface SearchQuery {
  query: string;
  filters: SearchFilters;
  options: SearchOptions;
}

export interface SearchFilters {
  // Content filters
  contentTypes: string[];
  formats: string[];
  languages: string[];

  // Cultural filters
  culturalOrigins: string[];
  sensitivityLevels: number[];
  educationalOnly: boolean;

  // Metadata filters
  tags: string[];
  categories: string[];
  authors: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };

  // Size and quality filters
  minSize?: number;
  maxSize?: number;
  verifiedOnly: boolean;
}

export interface SearchOptions {
  // Search behavior
  caseSensitive: boolean;
  exactMatch: boolean;
  includeContent: boolean;
  includeMetadata: boolean;

  // Results configuration
  maxResults: number;
  sortBy: 'relevance' | 'date' | 'title' | 'cultural_origin';
  sortOrder: 'asc' | 'desc';

  // Cultural options
  respectCulturalBoundaries: boolean;
  showEducationalContext: boolean;
  enableCommunityValidation: boolean;
}

export interface SearchResult {
  document: Document;
  relevanceScore: number;
  matchedFields: string[];
  culturalContext?: {
    accessLevel: 'public' | 'educational' | 'community' | 'restricted';
    educationalResources?: string[];
    culturalSignificance?: string;
  };
  highlights: {
    field: string;
    text: string;
    positions: number[];
  }[];
}

export interface SearchIndex {
  // Index metadata
  indexPath: string;
  lastUpdated: Date;
  documentCount: number;
  totalSize: number;

  // Cultural index information
  culturalContexts: string[];
  sensitivityLevels: number[];

  // Performance metrics
  averageSearchTime: number;
  indexHealth: 'healthy' | 'needs_update' | 'corrupted';
}

export interface ISearchService {
  // Search operations
  search(query: SearchQuery): Promise<SearchResult[]>;
  searchSuggestions(partialQuery: string): Promise<string[]>;
  searchHistory(): Promise<string[]>;
  clearSearchHistory(): Promise<void>;

  // Index management
  buildIndex(): Promise<boolean>;
  updateIndex(): Promise<boolean>;
  getIndexInfo(): Promise<SearchIndex>;
  repairIndex(): Promise<boolean>;

  // Cultural search features
  searchWithCulturalContext(query: string, userId: string): Promise<SearchResult[]>;
  getCulturalEducationalContent(culturalOrigin: string): Promise<Document[]>;
  validateCulturalAccess(document: Document, userId: string): Promise<boolean>;
}

class SearchServiceImpl implements ISearchService {
  private searchSettings: SearchSettings | null = null;
  private indexPath: string | null = null;

  async search(query: SearchQuery): Promise<SearchResult[]> {
    try {
      // Ensure we have the current project folder
      const settings = await projectService.loadSettings();
      this.indexPath = settings.folderStructure.indexFolder;
      this.searchSettings = settings.search;

      // Validate cultural access for the search
      const culturallyFilteredQuery = await this.applyCulturalFilters(query);

      // Perform the search
      const results = await invoke<SearchResult[]>('search_documents', {
        query: culturallyFilteredQuery,
        indexPath: this.indexPath,
      });

      // Post-process results for cultural context
      return await this.enrichResultsWithCulturalContext(results);
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  async searchSuggestions(partialQuery: string): Promise<string[]> {
    try {
      const settings = await projectService.loadSettings();

      return await invoke<string[]>('get_search_suggestions', {
        partialQuery,
        indexPath: settings.folderStructure.indexFolder,
        maxSuggestions: 10,
      });
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  async searchHistory(): Promise<string[]> {
    try {
      const settings = await projectService.loadSettings();

      return await invoke<string[]>('get_search_history', {
        projectPath: settings.project.projectFolderPath,
        limit: settings.project.searchHistoryLimit,
      });
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  async clearSearchHistory(): Promise<void> {
    try {
      const settings = await projectService.loadSettings();

      await invoke('clear_search_history', {
        projectPath: settings.project.projectFolderPath,
      });
    } catch (error) {
      console.error('Failed to clear search history:', error);
      throw error;
    }
  }

  async buildIndex(): Promise<boolean> {
    try {
      const settings = await projectService.loadSettings();

      const success = await invoke<boolean>('build_search_index', {
        documentsPath: settings.folderStructure.documentsFolder,
        indexPath: settings.folderStructure.indexFolder,
        culturalContextsPath: settings.folderStructure.culturalContextsFolder,
      });

      if (success) {
        console.log('Search index built successfully');
      }

      return success;
    } catch (error) {
      console.error('Failed to build search index:', error);
      return false;
    }
  }

  async updateIndex(): Promise<boolean> {
    try {
      const settings = await projectService.loadSettings();

      return await invoke<boolean>('update_search_index', {
        documentsPath: settings.folderStructure.documentsFolder,
        indexPath: settings.folderStructure.indexFolder,
      });
    } catch (error) {
      console.error('Failed to update search index:', error);
      return false;
    }
  }

  async getIndexInfo(): Promise<SearchIndex> {
    try {
      const settings = await projectService.loadSettings();

      return await invoke<SearchIndex>('get_search_index_info', {
        indexPath: settings.folderStructure.indexFolder,
      });
    } catch (error) {
      console.error('Failed to get index info:', error);
      return {
        indexPath: '',
        lastUpdated: new Date(),
        documentCount: 0,
        totalSize: 0,
        culturalContexts: [],
        sensitivityLevels: [],
        averageSearchTime: 0,
        indexHealth: 'corrupted',
      };
    }
  }

  async repairIndex(): Promise<boolean> {
    try {
      const settings = await projectService.loadSettings();

      return await invoke<boolean>('repair_search_index', {
        indexPath: settings.folderStructure.indexFolder,
        documentsPath: settings.folderStructure.documentsFolder,
      });
    } catch (error) {
      console.error('Failed to repair search index:', error);
      return false;
    }
  }

  async searchWithCulturalContext(query: string, userId: string): Promise<SearchResult[]> {
    try {
      // Create a culturally-aware search query
      const culturalQuery: SearchQuery = {
        query,
        filters: {
          contentTypes: [],
          formats: [],
          languages: [],
          culturalOrigins: [],
          sensitivityLevels: [1, 2, 3], // Default to public, educational, traditional
          educationalOnly: false,
          tags: [],
          categories: [],
          authors: [],
          dateRange: {},
          verifiedOnly: false,
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeContent: true,
          includeMetadata: true,
          maxResults: 50,
          sortBy: 'relevance',
          sortOrder: 'desc',
          respectCulturalBoundaries: true,
          showEducationalContext: true,
          enableCommunityValidation: true,
        },
      };

      // Get user's cultural access level
      const userCulturalLevel = await this.getUserCulturalAccessLevel(userId);

      // Adjust sensitivity levels based on user access
      culturalQuery.filters.sensitivityLevels =
        this.getAccessibleSensitivityLevels(userCulturalLevel);

      return await this.search(culturalQuery);
    } catch (error) {
      console.error('Cultural search failed:', error);
      return [];
    }
  }

  async getCulturalEducationalContent(culturalOrigin: string): Promise<Document[]> {
    try {
      const settings = await projectService.loadSettings();

      return await invoke<Document[]>('get_cultural_educational_content', {
        culturalOrigin,
        educationalResourcesPath: settings.folderStructure.educationalResourcesFolder,
      });
    } catch (error) {
      console.error('Failed to get cultural educational content:', error);
      return [];
    }
  }

  async validateCulturalAccess(document: Document, userId: string): Promise<boolean> {
    try {
      // Cultural validation always returns true for access (information only)
      // Get cultural information for educational purposes
      await validationService.getCulturalInformation(document.id, userId);

      // Always allow access - cultural information is educational only
      return true;
    } catch (error) {
      console.error('Cultural information retrieval failed:', error);
      // Always allow access even if cultural info fails
      return true;
    }
  }

  private async applyCulturalFilters(query: SearchQuery): Promise<SearchQuery> {
    // Apply cultural filtering based on user permissions and settings
    const settings = await projectService.loadSettings();

    if (settings.search.respectCulturalBoundaries) {
      // Filter out content that requires higher cultural access
      query.filters.sensitivityLevels = query.filters.sensitivityLevels.filter(
        level => level <= settings.project.defaultCulturalSensitivityLevel
      );
    }

    return query;
  }

  private async enrichResultsWithCulturalContext(results: SearchResult[]): Promise<SearchResult[]> {
    const enrichedResults: SearchResult[] = [];

    for (const result of results) {
      const culturalContext = await this.getCulturalContextForDocument(result.document);

      enrichedResults.push({
        ...result,
        culturalContext,
      });
    }

    return enrichedResults;
  }

  private async getCulturalContextForDocument(document: Document) {
    const sensitivityLevel = document.culturalMetadata.sensitivityLevel;

    let accessLevel: 'public' | 'educational' | 'community' | 'restricted';

    if (sensitivityLevel <= 1) {
      accessLevel = 'public';
    } else if (sensitivityLevel <= 2) {
      accessLevel = 'educational';
    } else if (sensitivityLevel <= 3) {
      accessLevel = 'community';
    } else {
      accessLevel = 'restricted';
    }

    return {
      accessLevel,
      educationalResources: [], // Educational resources would be fetched separately
      culturalSignificance: `Level ${sensitivityLevel} cultural content from ${document.culturalMetadata.culturalOrigin}`,
    };
  }

  private async getUserCulturalAccessLevel(userId: string): Promise<number> {
    // This would typically check user permissions, community memberships, etc.
    // For now, return a default level
    return 2; // Educational level access
  }

  private getAccessibleSensitivityLevels(userLevel: number): number[] {
    // Return sensitivity levels the user can access
    const levels: number[] = [];
    for (let i = 1; i <= userLevel; i++) {
      levels.push(i);
    }
    return levels;
  }
}

// Export singleton instance
export const searchService = new SearchServiceImpl();

// Export the class for testing
export { SearchServiceImpl as SearchService };
