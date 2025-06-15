import { Component, createSignal, createResource, createMemo, Show, For } from 'solid-js';
import { Button, Card, Modal } from '../../components/foundation';
import { TopCard } from '../../components/composite';
import { DocumentStatus } from '../../components/domain';
import {
  Upload,
  Download,
  Search,
  Grid,
  List,
  FileText,
  BookOpen,
  Plus,
  Eye,
  Edit,
  Share,
  Trash2,
  AlertCircle,
  Tag,
  Calendar,
  HardDrive,
  Shield,
  Globe,
  Filter,
  Settings,
  History,
  Clock,
  Folder,
  RefreshCw,
} from 'lucide-solid';
import { validationService } from '../../services';
import { searchService } from '../../services/searchService';
import { projectService } from '../../services/projectService';
import type { Document } from '../../types/Document';
import type {
  SearchQuery,
  SearchResult,
  SearchFilters,
  SearchOptions,
} from '../../services/searchService';
import styles from './DocumentManagement.module.css';

const DocumentManagement: Component = () => {
  // State management
  const [activeTab, setActiveTab] = createSignal<'upload' | 'library'>('library');
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedDocument, setSelectedDocument] = createSignal<Document | null>(null);
  const [showPreview, setShowPreview] = createSignal(false);
  const [uploadProgress, setUploadProgress] = createSignal(0);
  const [isUploading, setIsUploading] = createSignal(false);

  // Project folder management
  const [projectFolderPath, setProjectFolderPath] = createSignal<string>('');
  const [showFolderSetup, setShowFolderSetup] = createSignal(false);

  // Advanced search state
  const [searchResults, setSearchResults] = createSignal<SearchResult[]>([]);
  const [isSearching, setIsSearching] = createSignal<boolean>(false);
  const [searchError, setSearchError] = createSignal<string>('');
  const [showAdvancedSearch, setShowAdvancedSearch] = createSignal<boolean>(false);
  const [searchSuggestions, setSearchSuggestions] = createSignal<string[]>([]);
  const [searchMode, setSearchMode] = createSignal<'basic' | 'advanced'>('basic');

  // Advanced search filters
  const [searchFilters, setSearchFilters] = createSignal<SearchFilters>({
    contentTypes: [],
    formats: [],
    languages: [],
    culturalOrigins: [],
    sensitivityLevels: [1, 2, 3], // Default to accessible levels
    educationalOnly: false,
    tags: [],
    categories: [],
    authors: [],
    dateRange: {},
    verifiedOnly: false,
  });

  const [searchOptions, setSearchOptions] = createSignal<SearchOptions>({
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
  });

  // Project initialization and management
  const initializeProject = async () => {
    try {
      // Check if project folder is already set
      const savedPath = localStorage.getItem('alLibrary_projectPath');
      if (savedPath) {
        setProjectFolderPath(savedPath);
        return;
      }

      // Set default path (system root + AlLibrary)
      const defaultPath = `${navigator.platform.includes('Win') ? 'C:\\' : '/'}AlLibrary`;
      setProjectFolderPath(defaultPath);

      // Show setup dialog for first-time users
      setShowFolderSetup(true);
    } catch (error) {
      console.error('Failed to initialize project:', error);
    }
  };

  // Initialize project on component mount
  initializeProject();

  // Project and index information for advanced search
  const [projectInfo] = createResource(async () => {
    try {
      const settings = await projectService.loadSettings();
      return {
        projectPath: projectFolderPath() || settings.project.projectFolderPath,
        indexPath: settings.folderStructure.indexFolder,
      };
    } catch (error) {
      return {
        projectPath: projectFolderPath(),
        indexPath: null,
      };
    }
  });

  const [indexInfo] = createResource(async () => {
    try {
      return await searchService.getIndexInfo();
    } catch (error) {
      return null;
    }
  });

  const [searchHistory] = createResource(async () => {
    try {
      return await searchService.searchHistory();
    } catch (error) {
      return [];
    }
  });

  // Mock data - would come from API in real implementation
  const [documents] = createResource(async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create simplified mock documents that match the Document interface
    const mockDocs = [
      {
        id: '1',
        title: 'Traditional Healing Practices of the Amazon',
        description: 'Comprehensive guide to traditional medicinal practices',
        format: 'pdf' as any,
        contentType: 'traditional_knowledge' as any,
        status: 'active' as any,
        filePath: '/documents/healing-practices.pdf',
        originalFilename: 'healing-practices.pdf',
        fileSize: 2547892,
        fileHash: 'abc123',
        mimeType: 'application/pdf',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        createdBy: 'user123',
        version: 1,
        culturalMetadata: {
          sensitivityLevel: 3,
          culturalOrigin: 'Amazonian Indigenous Communities',
          traditionalProtocols: [],
          educationalResources: [],
          informationOnly: true,
          educationalPurpose: true,
        } as any,
        tags: ['medicine', 'traditional', 'amazon', 'indigenous'],
        categories: ['traditional', 'medicine'],
        language: 'en',
        authors: [],
        accessHistory: [],
        relationships: [],
        securityValidation: {
          validatedAt: new Date(),
          passed: true,
          malwareScanResult: { clean: true, threats: [], scanEngine: 'test', scanDate: new Date() },
          integrityCheck: {
            valid: true,
            expectedHash: 'abc123',
            actualHash: 'abc123',
            algorithm: 'sha256',
          },
          legalCompliance: { compliant: true, issues: [], jurisdiction: 'global' },
          issues: [],
        },
        contentVerification: {
          signature: 'test-signature',
          algorithm: 'sha256',
          verifiedAt: new Date(),
          chainOfCustody: [],
          authentic: true,
          verificationProvider: 'AlLibrary',
        },
        sourceAttribution: {
          originalSource: 'Community Submission',
          sourceType: 'community' as any,
          credibilityIndicators: [],
          sourceVerified: true,
          attributionRequirements: [],
        },
      },
      {
        id: '2',
        title: 'Digital Preservation Methods',
        description: 'Modern techniques for cultural heritage preservation',
        format: 'epub' as any,
        contentType: 'academic' as any,
        status: 'active' as any,
        filePath: '/documents/digital-preservation.epub',
        originalFilename: 'digital-preservation.epub',
        fileSize: 1234567,
        fileHash: 'def456',
        mimeType: 'application/epub+zip',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        createdBy: 'user123',
        version: 1,
        culturalMetadata: {
          sensitivityLevel: 1,
          culturalOrigin: 'Academic',
          traditionalProtocols: [],
          educationalResources: [],
          informationOnly: true,
          educationalPurpose: true,
        } as any,
        tags: ['digital', 'preservation', 'technology'],
        categories: ['digital', 'preservation'],
        language: 'en',
        authors: [],
        accessHistory: [],
        relationships: [],
        securityValidation: {
          validatedAt: new Date(),
          passed: true,
          malwareScanResult: { clean: true, threats: [], scanEngine: 'test', scanDate: new Date() },
          integrityCheck: {
            valid: true,
            expectedHash: 'def456',
            actualHash: 'def456',
            algorithm: 'sha256',
          },
          legalCompliance: { compliant: true, issues: [], jurisdiction: 'global' },
          issues: [],
        },
        contentVerification: {
          signature: 'test-signature',
          algorithm: 'sha256',
          verifiedAt: new Date(),
          chainOfCustody: [],
          authentic: true,
          verificationProvider: 'AlLibrary',
        },
        sourceAttribution: {
          originalSource: 'Academic Publisher',
          sourceType: 'academic' as any,
          credibilityIndicators: [],
          sourceVerified: true,
          attributionRequirements: [],
        },
      },
      {
        id: '3',
        title: 'Andean Music and Cultural Expression',
        description: 'Study of musical traditions in the Andes',
        format: 'pdf' as any,
        contentType: 'cultural' as any,
        status: 'active' as any,
        filePath: '/documents/andean-music.pdf',
        originalFilename: 'andean-music.pdf',
        fileSize: 3456789,
        fileHash: 'ghi789',
        mimeType: 'application/pdf',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
        createdBy: 'user123',
        version: 1,
        culturalMetadata: {
          sensitivityLevel: 2,
          culturalOrigin: 'Andean Communities',
          traditionalProtocols: [],
          educationalResources: [],
          informationOnly: true,
          educationalPurpose: true,
        } as any,
        tags: ['music', 'culture', 'andes', 'tradition'],
        categories: ['music', 'culture'],
        language: 'es',
        authors: [],
        accessHistory: [],
        relationships: [],
        securityValidation: {
          validatedAt: new Date(),
          passed: true,
          malwareScanResult: { clean: true, threats: [], scanEngine: 'test', scanDate: new Date() },
          integrityCheck: {
            valid: true,
            expectedHash: 'ghi789',
            actualHash: 'ghi789',
            algorithm: 'sha256',
          },
          legalCompliance: { compliant: true, issues: [], jurisdiction: 'global' },
          issues: [],
        },
        contentVerification: {
          signature: 'test-signature',
          algorithm: 'sha256',
          verifiedAt: new Date(),
          chainOfCustody: [],
          authentic: true,
          verificationProvider: 'AlLibrary',
        },
        sourceAttribution: {
          originalSource: 'Andean Communities',
          sourceType: 'community' as any,
          credibilityIndicators: [],
          sourceVerified: true,
          attributionRequirements: [],
        },
      },
    ] as Document[];

    return mockDocs;
  });

  // Filtered documents based on search
  const filteredDocuments = createMemo(() => {
    const docs = documents();
    const query = searchQuery().toLowerCase();

    if (!docs || !query) return docs || [];

    return docs.filter(
      doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.tags.some((tag: string) => tag.toLowerCase().includes(query)) ||
        doc.culturalMetadata.culturalOrigin?.toLowerCase().includes(query)
    );
  });

  // Statistics
  const stats = createMemo(() => {
    const docs = documents() || [];
    return {
      totalDocuments: docs.length,
      totalSize: docs.reduce((sum, doc) => sum + doc.fileSize, 0),
      culturalContexts: new Set(docs.map(doc => doc.culturalMetadata.culturalOrigin)).size,
      recentUploads: docs.filter(doc => {
        const daysSinceUpload = (Date.now() - doc.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpload <= 7;
      }).length,
    };
  });

  // Utility functions
  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getCulturalSensitivityLabel = (level: number): string => {
    const labels = ['Public', 'Educational', 'Community', 'Guardian', 'Sacred'];
    return labels[level - 1] || 'Unknown';
  };

  const getCulturalSensitivityColor = (level: number): string => {
    const colors = ['green', 'blue', 'orange', 'purple', 'red'];
    return colors[level - 1] || 'gray';
  };

  // Advanced Search Functions
  let searchTimeout: number;
  const debouncedSearch = (query: string) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (query.trim()) {
        performAdvancedSearch(query);
      } else {
        setSearchResults([]);
        setSearchError('');
      }
    }, 300);
  };

  // Search suggestions
  const getSuggestions = async (query: string) => {
    try {
      if (query.length >= 2) {
        const suggestions = await searchService.searchSuggestions(query);
        setSearchSuggestions(suggestions);
      } else {
        setSearchSuggestions([]);
      }
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      setSearchSuggestions([]);
    }
  };

  // Advanced search function
  const performAdvancedSearch = async (query: string) => {
    try {
      setIsSearching(true);
      setSearchError('');

      const searchQuery: SearchQuery = {
        query,
        filters: searchFilters(),
        options: searchOptions(),
      };

      const results = await searchService.search(searchQuery);
      setSearchResults(results);

      if (results.length === 0) {
        setSearchError('No documents found matching your search criteria.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Cultural search
  const performCulturalSearch = async (query: string) => {
    try {
      setIsSearching(true);
      setSearchError('');

      const results = await searchService.searchWithCulturalContext(query, 'current_user');
      setSearchResults(results);

      if (results.length === 0) {
        setSearchError('No culturally accessible documents found.');
      }
    } catch (error) {
      console.error('Cultural search failed:', error);
      setSearchError('Cultural search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Index management
  const rebuildIndex = async () => {
    try {
      setIsSearching(true);
      const success = await searchService.buildIndex();

      if (success) {
        console.log('Search index rebuilt successfully');
      } else {
        setSearchError('Failed to rebuild search index');
      }
    } catch (error) {
      console.error('Index rebuild failed:', error);
      setSearchError('Index rebuild failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Folder selection functionality
  const handleFolderSelect = async () => {
    try {
      // In a real Tauri app, this would use the dialog API
      // For now, we'll simulate the folder selection
      const folderPath = await new Promise<string>(resolve => {
        // Simulate system dialog
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.onchange = e => {
          const files = (e.target as HTMLInputElement).files;
          if (files && files.length > 0) {
            const path = files[0].webkitRelativePath.split('/')[0];
            resolve(path);
          }
        };
        input.click();
      });

      // Save the selected folder path
      setProjectFolderPath(folderPath);
      localStorage.setItem('alLibrary_projectPath', folderPath);
      setShowFolderSetup(false);

      console.log('Project folder updated:', folderPath);
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  // Use default folder path
  const useDefaultPath = () => {
    const defaultPath = projectFolderPath();
    localStorage.setItem('alLibrary_projectPath', defaultPath);
    setShowFolderSetup(false);
    console.log('Using default project folder:', defaultPath);
  };

  // Handle search input with advanced features
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);

    if (searchMode() === 'advanced') {
      debouncedSearch(value);
      getSuggestions(value);
    }
  };

  // Combined documents (basic filter + advanced search results)
  const displayDocuments = createMemo(() => {
    if (searchMode() === 'advanced' && searchResults().length > 0) {
      return searchResults().map(result => result.document);
    }
    return filteredDocuments() || [];
  });

  // Event handlers
  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (const file of Array.from(files)) {
        // Fix: Convert File to ArrayBuffer for validation
        const arrayBuffer = await file.arrayBuffer();

        // Validate file
        const validation = await validationService.validateDocument(arrayBuffer, {
          expectedType: file.type,
          fileType: file.type,
          source: 'user_upload',
          userId: 'user123',
          communityId: undefined,
        });

        if (!validation.valid) {
          alert(`Validation failed for ${file.name}: ${validation.errors.join(', ')}`);
          continue;
        }

        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Show success
        alert(`${file.name} uploaded successfully!`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    setShowPreview(true);
  };

  const handleDocumentAction = (action: string, document: Document) => {
    switch (action) {
      case 'edit':
        alert(`Edit functionality for "${document.title}" would open here.`);
        break;
      case 'share':
        alert(`Share functionality for "${document.title}" would open here.`);
        break;
      case 'download':
        alert(`Download "${document.title}" would start here.`);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${document.title}"?`)) {
          alert('Document deleted successfully.');
        }
        break;
    }
  };

  return (
    <div class={styles['document-management']}>
      {/* Reusable Top Card Component */}
      <TopCard
        title="Document Management"
        subtitle="Upload, organize, and manage your cultural heritage documents"
        rightContent={
          <DocumentStatus
            stats={stats()}
            {...(projectFolderPath() && { projectPath: projectFolderPath() })}
          />
        }
        aria-label="Document Management Dashboard"
      />

      {/* Navigation Tabs */}
      <div class={styles['document-tabs']}>
        <button
          class={`${styles.tab} ${activeTab() === 'library' ? styles.active : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <span class={styles['tab-text']}>
            <BookOpen size={16} class="mr-2" />
            Document Library
          </span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'upload' ? styles.active : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <span class={styles['tab-text']}>
            <Upload size={16} class="mr-2" />
            Upload Documents
          </span>
        </button>
      </div>

      <div class={styles['document-content']}>
        {/* Library Tab */}
        <Show when={activeTab() === 'library'}>
          <section class={styles['library-section']}>
            {/* Enhanced Search and Controls */}
            <div class={styles['library-controls']}>
              {/* Futuristic Search Interface */}
              <div class={styles['search-interface']}>
                {/* Enhanced Search Container */}
                <div class={styles['search-container']}>
                  <div class={styles['search-input-wrapper']}>
                    <div class={styles['search-icon-container']}>
                      <Search size={20} class={styles['search-icon']} />
                    </div>
                    <input
                      type="text"
                      placeholder="🔍 Discover knowledge across cultures and time..."
                      value={searchQuery()}
                      onInput={e => handleSearchInput(e.currentTarget.value)}
                      class={styles['search-input']}
                    />
                    <div class={styles['search-actions']}>
                      <Show when={isSearching()}>
                        <div class={styles['search-loading']}>
                          <div class={styles['loading-pulse']}></div>
                        </div>
                      </Show>
                      <Show when={searchQuery()}>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSearchResults([]);
                            setSearchError('');
                            setSearchSuggestions([]);
                          }}
                          class={styles['clear-button']}
                          title="Clear search"
                        >
                          <div class={styles['clear-icon']}></div>
                        </button>
                      </Show>
                    </div>
                  </div>

                  {/* Search Enhancement Bar */}
                  <div class={styles['search-enhancement-bar']}>
                    <div class={styles['search-stats']}>
                      <span class={styles['search-stat']}>
                        <Clock size={12} />
                        {searchHistory()?.length || 0} recent
                      </span>
                      <span class={styles['search-stat']}>
                        <Shield size={12} />
                        Verified sources
                      </span>
                      <span class={styles['search-stat']}>
                        <Globe size={12} />
                        Cultural context
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Control Bar - Search Mode + View Mode */}
                  <div class={styles['enhanced-control-bar']}>
                    {/* Search Mode Toggle */}
                    <div class={styles['control-section']}>
                      <div class={styles['mode-toggle']}>
                        <button
                          class={`${styles['mode-button']} ${searchMode() === 'basic' ? styles['active'] : ''}`}
                          onClick={() => setSearchMode('basic')}
                        >
                          <span class={styles['mode-text']}>Basic</span>
                        </button>
                        <button
                          class={`${styles['mode-button']} ${searchMode() === 'advanced' ? styles['active'] : ''}`}
                          onClick={() => setSearchMode('advanced')}
                        >
                          <span class={styles['mode-text']}>Advanced</span>
                        </button>
                        <div
                          class={styles['mode-indicator']}
                          style={{
                            transform:
                              searchMode() === 'advanced' ? 'translateX(100%)' : 'translateX(0%)',
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div class={styles['control-section']}>
                      <div class={styles['view-toggle']}>
                        <button
                          class={`${styles['view-button']} ${viewMode() === 'grid' ? styles['active'] : ''}`}
                          onClick={() => setViewMode('grid')}
                          title="Grid view"
                        >
                          <Grid size={16} />
                          <span class={styles['view-text']}>Grid</span>
                        </button>
                        <button
                          class={`${styles['view-button']} ${viewMode() === 'list' ? styles['active'] : ''}`}
                          onClick={() => setViewMode('list')}
                          title="List view"
                        >
                          <List size={16} />
                          <span class={styles['view-text']}>List</span>
                        </button>
                        <div
                          class={styles['view-indicator']}
                          style={{
                            transform:
                              viewMode() === 'list' ? 'translateX(100%)' : 'translateX(0%)',
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Suggestions */}
                <Show when={searchSuggestions().length > 0}>
                  <div class={styles['suggestions-container']}>
                    <div class={styles['suggestions-list']}>
                      <For each={searchSuggestions()}>
                        {(suggestion, index) => (
                          <button
                            class={styles['suggestion-item']}
                            onClick={() => {
                              setSearchQuery(suggestion);
                              if (searchMode() === 'advanced') {
                                performAdvancedSearch(suggestion);
                              }
                              setSearchSuggestions([]);
                            }}
                            style={{ 'animation-delay': `${index() * 50}ms` }}
                          >
                            <div class={styles['suggestion-icon']}>
                              <Search size={12} />
                            </div>
                            <span class={styles['suggestion-text']}>{suggestion}</span>
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>

                {/* Advanced Search Controls */}
                <Show when={searchMode() === 'advanced'}>
                  <div class={styles['advanced-controls']}>
                    <div class={styles['control-group']}>
                      <button
                        class={`${styles['control-button']} ${styles['cultural-search']}`}
                        onClick={() => performCulturalSearch(searchQuery())}
                        disabled={!searchQuery().trim()}
                      >
                        <Globe size={16} />
                        <span>Cultural Context</span>
                        <div class={styles['button-glow']}></div>
                      </button>

                      <button
                        class={`${styles['control-button']} ${showAdvancedSearch() ? styles['active'] : ''}`}
                        onClick={() => setShowAdvancedSearch(!showAdvancedSearch())}
                      >
                        <Filter size={16} />
                        <span>Filters</span>
                        <div class={styles['button-glow']}></div>
                      </button>

                      <Show when={searchHistory()?.length > 0}>
                        <button
                          class={styles['control-button']}
                          onClick={() => {
                            console.log('Search history:', searchHistory());
                          }}
                        >
                          <History size={16} />
                          <span>History</span>
                          <div class={styles['button-glow']}></div>
                        </button>
                      </Show>
                    </div>
                  </div>
                </Show>

                {/* Enhanced Project Status Bar */}
                <Show when={projectInfo()}>
                  <div class={styles['status-bar']}>
                    <button
                      class={styles['status-item-button']}
                      onClick={handleFolderSelect}
                      title="Click to change project folder"
                    >
                      <div class={styles['status-icon']}>
                        <Folder size={14} />
                      </div>
                      <span class={styles['status-text']}>tales/AlLibrary</span>
                      <div class={styles['folder-change-hint']}>
                        <Settings size={10} />
                      </div>
                    </button>
                    <Show when={indexInfo()}>
                      <div class={styles['status-divider']}></div>
                      <div class={styles['status-item']}>
                        <div class={styles['status-indicator']}>
                          <div
                            class={`${styles['indicator-dot']} ${indexInfo()?.indexHealth === 'healthy' ? styles['healthy'] : styles['warning']}`}
                          ></div>
                        </div>
                        <span class={styles['status-text']}>
                          {indexInfo()?.documentCount || 0} documents indexed
                        </span>
                        {indexInfo()?.indexHealth !== 'healthy' && (
                          <button
                            class={styles['rebuild-button']}
                            onClick={rebuildIndex}
                            title="Rebuild search index"
                          >
                            <RefreshCw size={12} />
                          </button>
                        )}
                      </div>
                    </Show>
                  </div>
                </Show>
              </div>
            </div>

            {/* Advanced Search Filters Panel */}
            <Show when={showAdvancedSearch()}>
              <div class={styles['advanced-filters-panel']}>
                <div class={styles['filters-header']}>
                  <h4>Advanced Search Filters</h4>
                  <Button variant="ghost" size="sm" onClick={() => setShowAdvancedSearch(false)}>
                    ✕
                  </Button>
                </div>
                <div class={styles['filters-content']}>
                  <div class={styles['filter-group']}>
                    <label>Content Types:</label>
                    <div class={styles['filter-options']}>
                      <label>
                        <input
                          type="checkbox"
                          checked={searchFilters().contentTypes.includes('traditional_knowledge')}
                          onChange={e => {
                            const filters = searchFilters();
                            if (e.currentTarget.checked) {
                              setSearchFilters({
                                ...filters,
                                contentTypes: [...filters.contentTypes, 'traditional_knowledge'],
                              });
                            } else {
                              setSearchFilters({
                                ...filters,
                                contentTypes: filters.contentTypes.filter(
                                  t => t !== 'traditional_knowledge'
                                ),
                              });
                            }
                          }}
                        />
                        Traditional Knowledge
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={searchFilters().contentTypes.includes('academic')}
                          onChange={e => {
                            const filters = searchFilters();
                            if (e.currentTarget.checked) {
                              setSearchFilters({
                                ...filters,
                                contentTypes: [...filters.contentTypes, 'academic'],
                              });
                            } else {
                              setSearchFilters({
                                ...filters,
                                contentTypes: filters.contentTypes.filter(t => t !== 'academic'),
                              });
                            }
                          }}
                        />
                        Academic
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={searchFilters().contentTypes.includes('cultural')}
                          onChange={e => {
                            const filters = searchFilters();
                            if (e.currentTarget.checked) {
                              setSearchFilters({
                                ...filters,
                                contentTypes: [...filters.contentTypes, 'cultural'],
                              });
                            } else {
                              setSearchFilters({
                                ...filters,
                                contentTypes: filters.contentTypes.filter(t => t !== 'cultural'),
                              });
                            }
                          }}
                        />
                        Cultural
                      </label>
                    </div>
                  </div>
                  <div class={styles['filter-group']}>
                    <label>Cultural Sensitivity Level:</label>
                    <div class={styles['filter-options']}>
                      <For each={[1, 2, 3, 4, 5]}>
                        {level => (
                          <label>
                            <input
                              type="checkbox"
                              checked={searchFilters().sensitivityLevels.includes(level)}
                              onChange={e => {
                                const filters = searchFilters();
                                if (e.currentTarget.checked) {
                                  setSearchFilters({
                                    ...filters,
                                    sensitivityLevels: [...filters.sensitivityLevels, level],
                                  });
                                } else {
                                  setSearchFilters({
                                    ...filters,
                                    sensitivityLevels: filters.sensitivityLevels.filter(
                                      l => l !== level
                                    ),
                                  });
                                }
                              }}
                            />
                            {getCulturalSensitivityLabel(level)}
                          </label>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </div>
            </Show>

            {/* Search Error Display */}
            <Show when={searchError()}>
              <div class={styles['search-error']}>
                <AlertCircle size={24} />
                <p>{searchError()}</p>
              </div>
            </Show>

            {/* Document Grid/List */}
            <div class={`${styles['documents-container']} ${styles[viewMode()]}`}>
              <Show when={documents.loading}>
                <div class={styles['loading-state']}>
                  <div class={styles['loading-spinner']}></div>
                  <p>Loading documents...</p>
                </div>
              </Show>

              <Show when={!documents.loading && displayDocuments().length === 0}>
                <div class={styles['empty-state']}>
                  <FileText size={48} class={styles['empty-icon'] || ''} />
                  <h3>No documents found</h3>
                  <p>
                    {searchQuery()
                      ? 'Try adjusting your search terms or clear the search to see all documents.'
                      : 'Upload your first document to get started.'}
                  </p>
                  <Button variant="primary" onClick={() => setActiveTab('upload')}>
                    <Upload size={16} class="mr-2" />
                    Upload Document
                  </Button>
                </div>
              </Show>

              <Show when={!documents.loading && displayDocuments().length > 0}>
                <div class={styles['documents-grid']}>
                  <For each={displayDocuments()}>
                    {document => (
                      <Card class={styles['document-card'] || ''} variant="elevated">
                        <div class={styles['document-header']}>
                          <div class={styles['document-icon']}>
                            {document.mimeType === 'application/pdf' ? (
                              <FileText size={24} />
                            ) : (
                              <BookOpen size={24} />
                            )}
                          </div>
                          <div class={styles['document-actions']}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDocumentSelect(document)}
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDocumentAction('edit', document)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDocumentAction('share', document)}
                            >
                              <Share size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDocumentAction('delete', document)}
                              class={styles['delete-button'] || ''}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>

                        <div class={styles['document-content']}>
                          <h3 class={styles['document-title']}>{document.title}</h3>
                          <p class={styles['document-description']}>{document.description}</p>

                          <div class={styles['document-meta']}>
                            <span class={styles['meta-item']}>
                              <HardDrive size={14} />
                              {formatFileSize(document.fileSize)}
                            </span>
                            <span class={styles['meta-item']}>
                              <Calendar size={14} />
                              {document.createdAt.toLocaleDateString()}
                            </span>
                            <span class={styles['meta-item']}>
                              <Shield size={14} />
                              {document.securityValidation.passed ? 'validated' : 'pending'}
                            </span>
                          </div>

                          {/* Cultural Context Display (EDUCATIONAL ONLY) */}
                          <div class={styles['cultural-context']}>
                            <div
                              class={`${styles['sensitivity-badge']} ${styles[getCulturalSensitivityColor(document.culturalMetadata.sensitivityLevel)]}`}
                            >
                              <Globe size={12} />
                              {getCulturalSensitivityLabel(
                                document.culturalMetadata.sensitivityLevel
                              )}
                            </div>
                            <Show when={document.culturalMetadata.culturalOrigin}>
                              <span class={styles['cultural-origin']}>
                                Origin: {document.culturalMetadata.culturalOrigin}
                              </span>
                            </Show>
                          </div>

                          <div class={styles['document-tags']}>
                            <For each={document.tags}>
                              {tag => (
                                <span class={styles['tag']}>
                                  <Tag size={10} />
                                  {tag}
                                </span>
                              )}
                            </For>
                          </div>
                        </div>
                      </Card>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </section>
        </Show>

        {/* Upload Tab */}
        <Show when={activeTab() === 'upload'}>
          <section class={styles['upload-section']}>
            <Card title="Upload Documents" padding="lg" class={styles['upload-card'] || ''}>
              <div class={styles['upload-zone']}>
                <div class={styles['upload-content']}>
                  <Upload size={48} class={styles['upload-icon'] || ''} />
                  <h3>Drop files here or click to browse</h3>
                  <p>Supports PDF and EPUB files up to 100MB each</p>
                  <p class={styles['upload-note']}>
                    All uploads are automatically scanned for security and analyzed for cultural
                    context
                  </p>

                  <input
                    type="file"
                    multiple
                    accept=".pdf,.epub"
                    onChange={e => e.currentTarget.files && handleFileUpload(e.currentTarget.files)}
                    class={styles['file-input']}
                    id="file-upload"
                  />
                  <label for="file-upload" class={styles['upload-button']}>
                    <Button variant="primary" size="lg">
                      <Plus size={20} class="mr-2" />
                      Select Files
                    </Button>
                  </label>
                </div>

                <Show when={isUploading()}>
                  <div class={styles['upload-progress']}>
                    <div class={styles['progress-bar']}>
                      <div
                        class={styles['progress-fill']}
                        style={`width: ${uploadProgress()}%`}
                      ></div>
                    </div>
                    <p>Uploading... {uploadProgress()}%</p>
                  </div>
                </Show>
              </div>

              <div class={styles['upload-info']}>
                <h4>Upload Guidelines</h4>
                <ul>
                  <li>Supported formats: PDF, EPUB</li>
                  <li>Maximum file size: 100MB per file</li>
                  <li>All files are scanned for security threats</li>
                  <li>Cultural context is analyzed for educational purposes</li>
                  <li>Metadata can be edited after upload</li>
                </ul>
              </div>
            </Card>
          </section>
        </Show>
      </div>

      {/* Document Preview Modal */}
      <Show when={showPreview() && selectedDocument()}>
        <Modal
          open={showPreview()}
          onClose={() => setShowPreview(false)}
          title={selectedDocument()?.title || 'Document Preview'}
          size="lg"
        >
          <div class={styles['preview-content']}>
            <div class={styles['preview-header']}>
              <div class={styles['document-info']}>
                <h3>{selectedDocument()?.title}</h3>
                <p>{selectedDocument()?.description}</p>
              </div>
              <div class={styles['document-stats']}>
                <span>Size: {formatFileSize(selectedDocument()?.fileSize || 0)}</span>
                <span>Type: {selectedDocument()?.mimeType}</span>
                <span>Language: {selectedDocument()?.language}</span>
              </div>
            </div>

            {/* Cultural Information Display (EDUCATIONAL ONLY) */}
            <Show when={selectedDocument()?.culturalMetadata.culturalContext}>
              <div class={styles['cultural-information']}>
                <h4>Cultural Context (Educational Information)</h4>
                <div class={styles['cultural-details']}>
                  <p>
                    <strong>Sensitivity Level:</strong>{' '}
                    {getCulturalSensitivityLabel(
                      selectedDocument()?.culturalMetadata.sensitivityLevel || 1
                    )}
                  </p>
                  <p>
                    <strong>Cultural Origin:</strong>{' '}
                    {selectedDocument()?.culturalMetadata.culturalOrigin}
                  </p>
                  <p>
                    <strong>Context:</strong> {selectedDocument()?.culturalMetadata.culturalContext}
                  </p>
                  <div class={styles['educational-note']}>
                    <AlertCircle size={16} />
                    <span>
                      This information is provided for educational purposes to promote cultural
                      understanding and respect.
                    </span>
                  </div>
                </div>
              </div>
            </Show>

            <div class={styles['preview-actions']}>
              <Button
                variant="outline"
                onClick={() => handleDocumentAction('edit', selectedDocument()!)}
              >
                <Edit size={16} class="mr-2" />
                Edit Metadata
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDocumentAction('share', selectedDocument()!)}
              >
                <Share size={16} class="mr-2" />
                Share
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDocumentAction('download', selectedDocument()!)}
              >
                <Download size={16} class="mr-2" />
                Download
              </Button>
            </div>
          </div>
        </Modal>
      </Show>

      {/* Project Folder Setup Modal */}
      <Show when={showFolderSetup()}>
        <Modal
          open={showFolderSetup()}
          onClose={() => setShowFolderSetup(false)}
          title="Welcome to AlLibrary"
          size="md"
        >
          <div class={styles['folder-setup-content']}>
            <div class={styles['setup-header']}>
              <Folder size={48} class={styles['setup-icon']} />
              <h3>Choose Your Library Location</h3>
              <p>
                AlLibrary needs a folder to store your documents and index. You can use the default
                location or choose a custom one.
              </p>
            </div>

            <div class={styles['setup-options']}>
              <div class={styles['default-option']}>
                <h4>Default Location</h4>
                <p class={styles['path-display']}>{projectFolderPath()}</p>
                <Button variant="primary" onClick={useDefaultPath}>
                  <HardDrive size={16} class="mr-2" />
                  Use Default
                </Button>
              </div>

              <div class={styles['custom-option']}>
                <h4>Custom Location</h4>
                <p>Choose a different folder for your library</p>
                <Button variant="outline" onClick={handleFolderSelect}>
                  <Folder size={16} class="mr-2" />
                  Browse Folders
                </Button>
              </div>
            </div>

            <div class={styles['setup-note']}>
              <AlertCircle size={16} />
              <span>You can change this location later in the settings.</span>
            </div>
          </div>
        </Modal>
      </Show>
    </div>
  );
};

export default DocumentManagement;
