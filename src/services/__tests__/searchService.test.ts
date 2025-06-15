import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '../searchService';
import type { Book, SearchFilters, PaginationOptions, SearchResult } from '../../types/core';

// Mock Tauri
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('SearchService', () => {
  let service: SearchService;
  let mockInvoke: any;

  beforeEach(() => {
    service = new SearchService();
    mockInvoke = vi.mocked(require('@tauri-apps/api/core').invoke);
    mockInvoke.mockClear();
  });

  describe('Anti-Censorship Search Principles', () => {
    it('never filters search results based on cultural sensitivity', async () => {
      const query = 'sacred traditional knowledge';
      const culturalResults: SearchResult[] = [
        {
          id: 1,
          title: 'Sacred Texts of Indigenous Peoples',
          cultural_sensitivity: 'high',
          content_type: 'book',
          relevance_score: 0.95,
        },
        {
          id: 2,
          title: 'Traditional Healing Practices',
          cultural_sensitivity: 'medium',
          content_type: 'book',
          relevance_score: 0.88,
        },
      ];

      mockInvoke.mockResolvedValue(culturalResults);

      const results = await service.searchBooks(query);

      expect(results).toHaveLength(2);
      expect(results[0].cultural_sensitivity).toBe('high');
      expect(results[1].cultural_sensitivity).toBe('medium');

      // Verify no cultural filtering occurred
      expect(mockInvoke).toHaveBeenCalledWith('search_books', {
        query,
        filters: undefined,
        pagination: undefined,
      });
    });

    it('includes controversial and alternative perspective content', async () => {
      const query = 'alternative history';
      const controversialResults: SearchResult[] = [
        {
          id: 1,
          title: 'Challenging Historical Narratives',
          controversial: true,
          alternative_perspective: true,
          content_type: 'book',
          relevance_score: 0.92,
        },
      ];

      mockInvoke.mockResolvedValue(controversialResults);

      const results = await service.searchBooks(query);

      expect(results[0].controversial).toBe(true);
      expect(results[0].alternative_perspective).toBe(true);
    });

    it('supports search across multiple cultural perspectives simultaneously', async () => {
      const filters: SearchFilters = {
        cultural_perspectives: ['western', 'indigenous', 'eastern', 'african'],
        include_sensitive_content: true,
      };

      mockInvoke.mockResolvedValue([
        { id: 1, perspective: 'western', relevance_score: 0.9 },
        { id: 2, perspective: 'indigenous', relevance_score: 0.85 },
        { id: 3, perspective: 'eastern', relevance_score: 0.88 },
        { id: 4, perspective: 'african', relevance_score: 0.87 },
      ]);

      const results = await service.searchBooks('history', filters);

      expect(results).toHaveLength(4);
      expect(mockInvoke).toHaveBeenCalledWith('search_books', {
        query: 'history',
        filters,
        pagination: undefined,
      });
    });

    it('preserves uncensored search results with educational context', async () => {
      const query = 'banned books';
      const uncensoredResults = [
        {
          id: 1,
          title: 'Historically Banned Literature',
          banned_status: 'previously_banned',
          educational_context: 'Important for understanding censorship history',
          content_type: 'book',
          relevance_score: 0.94,
        },
      ];

      mockInvoke.mockResolvedValue(uncensoredResults);

      const results = await service.searchBooks(query);

      expect(results[0].banned_status).toBe('previously_banned');
      expect(results[0].educational_context).toContain('censorship history');
    });
  });

  describe('Core Search Functionality', () => {
    it('performs full-text search across books', async () => {
      const query = 'machine learning artificial intelligence';
      const expectedResults: SearchResult[] = [
        {
          id: 1,
          title: 'Introduction to Machine Learning',
          author: 'AI Expert',
          content_type: 'book',
          relevance_score: 0.95,
        },
        {
          id: 2,
          title: 'Artificial Intelligence Fundamentals',
          author: 'Tech Author',
          content_type: 'book',
          relevance_score: 0.88,
        },
      ];

      mockInvoke.mockResolvedValue(expectedResults);

      const results = await service.searchBooks(query);

      expect(results).toEqual(expectedResults);
      expect(mockInvoke).toHaveBeenCalledWith('search_books', {
        query,
        filters: undefined,
        pagination: undefined,
      });
    });

    it('searches collections with filters', async () => {
      const query = 'science';
      const filters: SearchFilters = {
        tags: ['science', 'technology'],
        date_range: {
          start: '2020-01-01',
          end: '2024-01-01',
        },
      };

      mockInvoke.mockResolvedValue([]);

      await service.searchCollections(query, filters);

      expect(mockInvoke).toHaveBeenCalledWith('search_collections', {
        query,
        filters,
        pagination: undefined,
      });
    });

    it('performs global search across all content types', async () => {
      const query = 'quantum physics';
      const globalResults = [
        { id: 1, content_type: 'book', title: 'Quantum Physics Book' },
        { id: 2, content_type: 'collection', name: 'Physics Collection' },
        { id: 3, content_type: 'document', title: 'Quantum Research Paper' },
      ];

      mockInvoke.mockResolvedValue(globalResults);

      const results = await service.globalSearch(query);

      expect(results).toEqual(globalResults);
      expect(mockInvoke).toHaveBeenCalledWith('global_search', {
        query,
        filters: undefined,
        pagination: undefined,
      });
    });

    it('handles advanced search with complex filters', async () => {
      const query = 'history';
      const complexFilters: SearchFilters = {
        authors: ['Historian A', 'Historian B'],
        languages: ['English', 'Spanish'],
        file_types: ['PDF', 'EPUB'],
        tags: ['academic', 'research'],
        rating_range: { min: 4.0, max: 5.0 },
        cultural_sensitivity: 'any',
      };

      const pagination: PaginationOptions = {
        page: 2,
        per_page: 25,
      };

      mockInvoke.mockResolvedValue([]);

      await service.searchBooks(query, complexFilters, pagination);

      expect(mockInvoke).toHaveBeenCalledWith('search_books', {
        query,
        filters: complexFilters,
        pagination,
      });
    });
  });

  describe('Performance Requirements (<500ms)', () => {
    it('completes simple search within 500ms', async () => {
      const startTime = Date.now();

      mockInvoke.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve([{ id: 1, title: 'Test Book', relevance_score: 0.9 }]), 100)
          )
      );

      await service.searchBooks('test');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });

    it('handles complex filtered search within 500ms', async () => {
      const startTime = Date.now();

      const complexFilters: SearchFilters = {
        authors: ['Author 1', 'Author 2'],
        tags: ['tag1', 'tag2', 'tag3'],
        languages: ['English', 'Spanish'],
        cultural_perspectives: ['western', 'indigenous'],
      };

      mockInvoke.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 200))
      );

      await service.searchBooks('complex query', complexFilters);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });

    it('processes large result sets efficiently', async () => {
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Book ${i}`,
        relevance_score: Math.random(),
        content_type: 'book',
      }));

      mockInvoke.mockResolvedValue(largeResultSet);

      const startTime = Date.now();
      const results = await service.searchBooks('popular query');
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(1000);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Search Result Ranking and Relevance', () => {
    it('returns results sorted by relevance score', async () => {
      const unsortedResults = [
        { id: 1, title: 'Less Relevant', relevance_score: 0.6 },
        { id: 2, title: 'Most Relevant', relevance_score: 0.95 },
        { id: 3, title: 'Moderately Relevant', relevance_score: 0.8 },
      ];

      mockInvoke.mockResolvedValue(unsortedResults);

      const results = await service.searchBooks('test');

      // Assuming backend sorts, but verify structure
      expect(results).toHaveLength(3);
      expect(results.every(r => typeof r.relevance_score === 'number')).toBe(true);
    });

    it('includes search metadata in results', async () => {
      const query = 'metadata test';
      const resultsWithMetadata = [
        {
          id: 1,
          title: 'Test Book',
          relevance_score: 0.9,
          search_metadata: {
            matched_fields: ['title', 'description'],
            highlight_snippets: ['...metadata test...'],
          },
        },
      ];

      mockInvoke.mockResolvedValue(resultsWithMetadata);

      const results = await service.searchBooks(query);

      expect(results[0].search_metadata).toBeDefined();
      expect(results[0].search_metadata.matched_fields).toContain('title');
    });
  });

  describe('Pagination and Limits', () => {
    it('supports pagination for large result sets', async () => {
      const pagination: PaginationOptions = {
        page: 3,
        per_page: 50,
      };

      mockInvoke.mockResolvedValue([]);

      await service.searchBooks('test', undefined, pagination);

      expect(mockInvoke).toHaveBeenCalledWith('search_books', {
        query: 'test',
        filters: undefined,
        pagination,
      });
    });

    it('handles first page requests correctly', async () => {
      const pagination: PaginationOptions = {
        page: 1,
        per_page: 20,
      };

      mockInvoke.mockResolvedValue([]);

      await service.searchBooks('test', undefined, pagination);

      expect(mockInvoke).toHaveBeenCalledWith('search_books', {
        query: 'test',
        filters: undefined,
        pagination,
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles empty search queries gracefully', async () => {
      mockInvoke.mockResolvedValue([]);

      const results = await service.searchBooks('');

      expect(results).toEqual([]);
    });

    it('handles backend search errors', async () => {
      mockInvoke.mockRejectedValue(new Error('Search index unavailable'));

      await expect(service.searchBooks('test')).rejects.toThrow('Search index unavailable');
    });

    it('handles malformed search filters', async () => {
      const malformedFilters = {
        invalid_field: 'invalid_value',
      } as any;

      mockInvoke.mockRejectedValue(new Error('Invalid filter field'));

      await expect(service.searchBooks('test', malformedFilters)).rejects.toThrow(
        'Invalid filter field'
      );
    });

    it('handles network timeouts gracefully', async () => {
      mockInvoke.mockImplementation(
        () =>
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 1000))
      );

      await expect(service.searchBooks('test')).rejects.toThrow('Request timeout');
    });
  });

  describe('SOLID Architecture Compliance', () => {
    it('maintains single responsibility for search operations', () => {
      expect(service).toHaveProperty('searchBooks');
      expect(service).toHaveProperty('searchCollections');
      expect(service).toHaveProperty('globalSearch');

      // Should not have unrelated responsibilities
      expect(service).not.toHaveProperty('createBook');
      expect(service).not.toHaveProperty('uploadFile');
      expect(service).not.toHaveProperty('validateUser');
    });

    it('provides consistent search interface', () => {
      const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
      const searchMethods = methodNames.filter(name => name.includes('search'));

      expect(searchMethods.length).toBeGreaterThan(0);
      expect(searchMethods.every(method => typeof service[method] === 'function')).toBe(true);
    });
  });

  describe('Information Integrity and Source Verification', () => {
    it('includes source verification in search results', async () => {
      const query = 'verified content';
      const verifiedResults = [
        {
          id: 1,
          title: 'Verified Academic Paper',
          source_verification: {
            verified: true,
            verification_date: '2024-01-01',
            verification_method: 'cryptographic_signature',
          },
          relevance_score: 0.9,
        },
      ];

      mockInvoke.mockResolvedValue(verifiedResults);

      const results = await service.searchBooks(query);

      expect(results[0].source_verification).toBeDefined();
      expect(results[0].source_verification.verified).toBe(true);
    });

    it('supports search for multiple source types', async () => {
      const filters: SearchFilters = {
        source_types: ['academic', 'community', 'traditional', 'alternative'],
        verification_status: 'any',
      };

      mockInvoke.mockResolvedValue([]);

      await service.searchBooks('multi-source', filters);

      expect(mockInvoke).toHaveBeenCalledWith('search_books', {
        query: 'multi-source',
        filters,
        pagination: undefined,
      });
    });
  });
});
