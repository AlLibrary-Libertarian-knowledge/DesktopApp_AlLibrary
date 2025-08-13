import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock tauri invoke used by searchService
vi.mock('@tauri-apps/api/core', () => {
  return {
    invoke: vi.fn(async (_cmd: string, _args?: any) => {
      // Simulate search computation
      await new Promise(res => setTimeout(res, 50));
      return [];
    }),
  };
});

// Mock project settings BEFORE importing SearchService
vi.mock('../projectService', () => ({
  projectService: {
    loadSettings: vi.fn().mockResolvedValue({
      folderStructure: {
        indexFolder: '/tmp/index',
        documentsFolder: '/tmp/docs',
        culturalContextsFolder: '/tmp/cult',
      },
      project: { projectFolderPath: '/tmp/project', searchHistoryLimit: 50, defaultCulturalSensitivityLevel: 3 },
      search: { respectCulturalBoundaries: false },
    }),
  },
}));

import { SearchService } from '../searchService';

describe('searchService performance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('local search median under 500ms', async () => {
    const svc = new SearchService();
    const timings: number[] = [];

    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await svc.search({
        query: 'test',
        filters: {
          contentTypes: [], formats: [], languages: [], culturalOrigins: [], sensitivityLevels: [1,2,3], educationalOnly: false,
          tags: [], categories: [], authors: [], dateRange: {}, verifiedOnly: false,
        },
        options: {
          caseSensitive: false, exactMatch: false, includeContent: true, includeMetadata: true,
          maxResults: 50, sortBy: 'relevance', sortOrder: 'desc', respectCulturalBoundaries: false,
          showEducationalContext: true, enableCommunityValidation: false,
        },
      });
      const end = performance.now();
      timings.push(end - start);
    }

    const sorted = timings.slice().sort((a,b) => a-b);
    const median = sorted[Math.floor(sorted.length/2)];
    expect(median).toBeLessThan(500);
  });
});
