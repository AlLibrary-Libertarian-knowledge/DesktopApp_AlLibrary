# DocumentManagement - Technical Implementation Guide

## 🏗️ Architecture & Components

### Component Hierarchy

```
DocumentManagement
├── DocumentManagementHeader
│   ├── PageTitle
│   ├── UploadStats
│   └── QuickActions
├── DocumentTabs
│   ├── UploadTab
│   └── LibraryTab
├── UploadSection
│   ├── DropZone
│   ├── FileSelector
│   ├── UploadProgress
│   └── ValidationStatus
├── LibrarySection
│   ├── SearchFilters
│   ├── DocumentGrid
│   ├── DocumentList
│   └── Pagination
├── DocumentPreview
│   ├── PreviewModal
│   ├── MetadataEditor
│   └── CulturalContext
└── DocumentManagementFooter
    ├── StorageIndicator
    ├── ValidationStatus
    └── SyncStatus
```

### State Management Architecture

```typescript
// Centralized Store Pattern with SolidJS
interface DocumentManagementStore {
  // Upload state
  uploadQueue: Resource<UploadSession[]>;
  currentUpload: Signal<UploadSession | null>;
  uploadProgress: Signal<number>;

  // Document library state
  documents: Resource<Document[]>;
  filteredDocuments: Resource<Document[]>;
  selectedDocuments: Signal<string[]>;

  // Search and filter state
  searchQuery: Signal<string>;
  activeFilters: Store<DocumentFilters>;
  sortOrder: Signal<SortOrder>;

  // UI state
  activeTab: Signal<'upload' | 'library'>;
  viewMode: Signal<'grid' | 'list'>;
  selectedDocument: Signal<Document | null>;
  showPreview: Signal<boolean>;

  // Validation state
  validationResults: Resource<ValidationResult[]>;
  culturalAnalysis: Resource<CulturalAnalysis[]>;
}

// Store composition for optimal reactivity
const createDocumentManagementStore = () => {
  const [documents] = createResource(fetchDocuments);
  const [uploadQueue] = createResource(fetchUploadQueue);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [activeFilters, setActiveFilters] = createStore<DocumentFilters>({
    fileTypes: [],
    culturalSensitivity: [],
    dateRange: null,
    tags: [],
  });

  return {
    documents,
    uploadQueue,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
  };
};
```

### API Integration Points

```typescript
// Tauri Command Interfaces
declare module '@tauri-apps/api/tauri' {
  interface Commands {
    // Document upload operations
    upload_document(filePath: string, metadata: DocumentMetadata): Promise<UploadResult>;
    get_upload_progress(sessionId: string): Promise<UploadProgress>;
    cancel_upload(sessionId: string): Promise<boolean>;

    // Document management operations
    get_documents(filters: DocumentFilters): Promise<Document[]>;
    get_document_by_id(id: string): Promise<Document>;
    update_document_metadata(id: string, metadata: DocumentMetadata): Promise<boolean>;
    delete_document(id: string): Promise<boolean>;

    // Search operations
    search_documents(query: string, filters: DocumentFilters): Promise<SearchResult[]>;
    get_document_suggestions(query: string): Promise<string[]>;

    // Validation operations
    validate_document(filePath: string): Promise<ValidationResult>;
    get_cultural_analysis(documentId: string): Promise<CulturalAnalysis>;
    get_security_status(documentId: string): Promise<SecurityStatus>;

    // Storage operations
    get_storage_stats(): Promise<StorageStats>;
    cleanup_storage(): Promise<CleanupResult>;
  }
}

// API Service Layer
class DocumentManagementAPI {
  static async uploadDocument(file: File, metadata: DocumentMetadata): Promise<UploadResult> {
    try {
      // Save file to temporary location
      const tempPath = await this.saveTemporaryFile(file);

      // Start upload with validation
      const result = await invoke('upload_document', {
        filePath: tempPath,
        metadata,
      });

      return result;
    } catch (error) {
      console.error('Failed to upload document:', error);
      throw new APIError('Document upload failed', error);
    }
  }

  static async searchDocuments(query: string, filters: DocumentFilters): Promise<SearchResult[]> {
    try {
      return await invoke('search_documents', { query, filters });
    } catch (error) {
      console.error('Failed to search documents:', error);
      return []; // Graceful degradation
    }
  }

  static async validateDocument(filePath: string): Promise<ValidationResult> {
    try {
      return await invoke('validate_document', { filePath });
    } catch (error) {
      console.error('Failed to validate document:', error);
      throw new APIError('Document validation failed', error);
    }
  }
}
```

### Performance Considerations

- **Virtual Scrolling**: Use virtual scrolling for large document lists
- **Lazy Loading**: Progressive loading of document thumbnails and metadata
- **Upload Optimization**: Chunked uploads with resume capability
- **Search Debouncing**: Debounced search input to reduce API calls
- **Memory Management**: Cleanup resources and cancel requests on unmount

## ⚡ Code Quality Guidelines

### TypeScript Patterns

```typescript
// Strict type definitions for document management
interface DocumentMetadata {
  readonly title: string;
  readonly description?: string;
  readonly tags: readonly string[];
  readonly culturalContext?: CulturalContext;
  readonly language?: string;
  readonly author?: string;
}

interface UploadSession {
  readonly id: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly progress: number;
  readonly status: UploadStatus;
  readonly validationResults?: ValidationResult;
  readonly error?: string;
}

interface DocumentFilters {
  fileTypes: readonly string[];
  culturalSensitivity: readonly number[];
  dateRange: readonly [Date, Date] | null;
  tags: readonly string[];
  searchQuery: string;
}

// Generic utilities for document operations
type DocumentAction =
  | { type: 'edit'; documentId: string }
  | { type: 'delete'; documentId: string }
  | { type: 'share'; documentId: string }
  | { type: 'download'; documentId: string };

// Custom hooks for document management
const useDocumentUpload = () => {
  const [uploadQueue, setUploadQueue] = createSignal<UploadSession[]>([]);
  const [isUploading, setIsUploading] = createSignal(false);

  const uploadDocument = async (file: File, metadata: DocumentMetadata) => {
    setIsUploading(true);
    try {
      const session = await DocumentManagementAPI.uploadDocument(file, metadata);
      setUploadQueue(prev => [...prev, session]);
      return session;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadQueue,
    isUploading,
    uploadDocument,
  };
};
```

### SolidJS Best Practices

```typescript
// Reactive patterns for document management
const DocumentManagement: Component = () => {
  // Memoize expensive computations
  const filteredDocuments = createMemo(() => {
    const docs = documents();
    const query = searchQuery();
    const filters = activeFilters;

    if (!docs) return [];

    return docs.filter(doc => {
      // Apply search query
      if (query && !doc.title.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }

      // Apply file type filter
      if (filters.fileTypes.length > 0 && !filters.fileTypes.includes(doc.fileType)) {
        return false;
      }

      // Apply cultural sensitivity filter (INFORMATION ONLY)
      if (filters.culturalSensitivity.length > 0 &&
          !filters.culturalSensitivity.includes(doc.culturalSensitivityLevel)) {
        return false;
      }

      return true;
    });
  });

  // Derived signals for UI state
  const hasDocuments = () => documents()?.length > 0;
  const isLoading = () => documents.loading;
  const isEmpty = () => !isLoading() && !hasDocuments();

  // Event handlers with proper typing
  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    setShowPreview(true);
  };

  const handleUploadComplete = (result: UploadResult) => {
    if (result.success) {
      // Refresh document list
      refetchDocuments();
      // Show success notification
      showNotification('Document uploaded successfully', 'success');
    } else {
      showNotification(`Upload failed: ${result.error}`, 'error');
    }
  };

  return (
    <div class="document-management">
      <DocumentManagementHeader />

      <Show when={activeTab() === 'upload'}>
        <UploadSection onUploadComplete={handleUploadComplete} />
      </Show>

      <Show when={activeTab() === 'library'}>
        <LibrarySection
          documents={filteredDocuments()}
          onDocumentSelect={handleDocumentSelect}
          loading={isLoading()}
          empty={isEmpty()}
        />
      </Show>

      <Show when={showPreview()}>
        <DocumentPreview
          document={selectedDocument()}
          onClose={() => setShowPreview(false)}
        />
      </Show>
    </div>
  );
};
```

### Component Implementation Examples

```typescript
// Upload Zone Component
const UploadZone: Component<UploadZoneProps> = (props) => {
  const [isDragOver, setIsDragOver] = createSignal(false);
  const [uploadProgress, setUploadProgress] = createSignal(0);

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = Array.from(event.dataTransfer?.files || []);
    const validFiles = files.filter(file =>
      ['application/pdf', 'application/epub+zip'].includes(file.type)
    );

    if (validFiles.length === 0) {
      props.onError?.('Please select PDF or EPUB files only');
      return;
    }

    for (const file of validFiles) {
      try {
        await props.onUpload?.(file);
      } catch (error) {
        props.onError?.(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
  };

  const handleFileSelect = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    for (const file of files) {
      try {
        await props.onUpload?.(file);
      } catch (error) {
        props.onError?.(`Failed to upload ${file.name}: ${error.message}`);
      }
    }

    // Reset input
    input.value = '';
  };

  return (
    <div
      class={`upload-zone ${isDragOver() ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div class="upload-content">
        <div class="upload-icon">📁</div>
        <h3>Drop files here or click to browse</h3>
        <p>Supports PDF and EPUB files up to 100MB</p>
        <input
          type="file"
          multiple
          accept=".pdf,.epub"
          onChange={handleFileSelect}
          class="file-input"
        />
      </div>
    </div>
  );
};

// Document Card Component
const DocumentCard: Component<DocumentCardProps> = (props) => {
  const [showActions, setShowActions] = createSignal(false);

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getCulturalSensitivityLabel = (level: number) => {
    const labels = ['Public', 'Educational', 'Community', 'Guardian', 'Sacred'];
    return labels[level - 1] || 'Unknown';
  };

  return (
    <div
      class="document-card"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => props.onSelect?.(props.document)}
    >
      <div class="document-thumbnail">
        <Show when={props.document.thumbnailUrl} fallback={
          <div class="thumbnail-placeholder">
            {props.document.fileType === 'application/pdf' ? '📄' : '📖'}
          </div>
        }>
          <img src={props.document.thumbnailUrl} alt={props.document.title} />
        </Show>
      </div>

      <div class="document-info">
        <h4 class="document-title">{props.document.title}</h4>
        <p class="document-meta">
          {formatFileSize(props.document.fileSize)} •
          {new Date(props.document.createdAt).toLocaleDateString()}
        </p>

        {/* Cultural Context Display (EDUCATIONAL ONLY) */}
        <Show when={props.document.culturalContext}>
          <div class="cultural-context">
            <span class="cultural-label">
              Cultural Context: {getCulturalSensitivityLabel(props.document.culturalSensitivityLevel)}
            </span>
            <div class="cultural-info">
              {props.document.culturalContext}
            </div>
          </div>
        </Show>

        <div class="document-tags">
          <For each={props.document.tags}>
            {(tag) => <span class="tag">{tag}</span>}
          </For>
        </div>
      </div>

      <Show when={showActions()}>
        <div class="document-actions">
          <button
            class="action-button"
            onClick={(e) => { e.stopPropagation(); props.onEdit?.(props.document); }}
            title="Edit metadata"
          >
            ✏️
          </button>
          <button
            class="action-button"
            onClick={(e) => { e.stopPropagation(); props.onShare?.(props.document); }}
            title="Share document"
          >
            🔗
          </button>
          <button
            class="action-button"
            onClick={(e) => { e.stopPropagation(); props.onDownload?.(props.document); }}
            title="Download"
          >
            ⬇️
          </button>
          <button
            class="action-button danger"
            onClick={(e) => { e.stopPropagation(); props.onDelete?.(props.document); }}
            title="Delete document"
          >
            🗑️
          </button>
        </div>
      </Show>
    </div>
  );
};
```

## 🔧 Integration Points

### Validation Service Integration

```typescript
// Integration with validation services
const useDocumentValidation = () => {
  const validateDocument = async (file: File): Promise<ValidationResult> => {
    try {
      // Create temporary file path
      const tempPath = await createTempFile(file);

      // Run comprehensive validation
      const result = await DocumentManagementAPI.validateDocument(tempPath);

      // Clean up temporary file
      await cleanupTempFile(tempPath);

      return result;
    } catch (error) {
      console.error('Validation failed:', error);
      throw error;
    }
  };

  const getCulturalAnalysis = async (documentId: string): Promise<CulturalAnalysis> => {
    try {
      return await DocumentManagementAPI.getCulturalAnalysis(documentId);
    } catch (error) {
      console.error('Cultural analysis failed:', error);
      // Return empty analysis for graceful degradation
      return {
        sensitivityLevel: 1,
        culturalContext: '',
        educationalResources: [],
        communityGuidelines: '',
      };
    }
  };

  return {
    validateDocument,
    getCulturalAnalysis,
  };
};
```

### Storage Service Integration

```typescript
// Integration with storage services
const useDocumentStorage = () => {
  const saveDocument = async (file: File, metadata: DocumentMetadata): Promise<Document> => {
    try {
      // Generate unique document ID
      const documentId = generateDocumentId();

      // Save file to storage
      const filePath = await saveDocumentFile(file, documentId);

      // Create document record
      const document: Document = {
        id: documentId,
        title: metadata.title,
        description: metadata.description,
        filePath,
        fileType: file.type,
        fileSize: file.size,
        contentHash: await calculateFileHash(file),
        tags: metadata.tags,
        culturalContext: metadata.culturalContext,
        culturalSensitivityLevel: metadata.culturalContext?.sensitivityLevel || 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
      };

      // Save to database
      await saveDocumentRecord(document);

      return document;
    } catch (error) {
      console.error('Failed to save document:', error);
      throw error;
    }
  };

  return {
    saveDocument,
  };
};
```

## 📊 Performance Optimization

### Upload Performance

```typescript
// Chunked upload implementation
const useChunkedUpload = () => {
  const uploadFile = async (file: File, onProgress?: (progress: number) => void) => {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedChunks = 0;

    const sessionId = generateSessionId();

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        await uploadChunk(sessionId, i, chunk);
        uploadedChunks++;

        const progress = (uploadedChunks / totalChunks) * 100;
        onProgress?.(progress);
      }

      // Finalize upload
      return await finalizeUpload(sessionId);
    } catch (error) {
      // Cleanup failed upload
      await cleanupUpload(sessionId);
      throw error;
    }
  };

  return { uploadFile };
};
```

### Search Performance

```typescript
// Optimized search implementation
const useDocumentSearch = () => {
  const [searchCache] = createSignal(new Map<string, SearchResult[]>());

  const searchDocuments = useMemo(
    debounce(async (query: string, filters: DocumentFilters): Promise<SearchResult[]> => {
      const cacheKey = `${query}-${JSON.stringify(filters)}`;

      // Check cache first
      const cached = searchCache().get(cacheKey);
      if (cached) {
        return cached;
      }

      try {
        const results = await DocumentManagementAPI.searchDocuments(query, filters);

        // Cache results
        searchCache().set(cacheKey, results);

        return results;
      } catch (error) {
        console.error('Search failed:', error);
        return [];
      }
    }, 300)
  );

  return { searchDocuments };
};
```

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Document upload tests
describe('DocumentUpload', () => {
  test('should validate file format', async () => {
    const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });

    expect(await validateFileFormat(validFile)).toBe(true);
    expect(await validateFileFormat(invalidFile)).toBe(false);
  });

  test('should handle upload progress', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const progressCallback = vi.fn();

    await uploadDocument(file, {}, progressCallback);

    expect(progressCallback).toHaveBeenCalledWith(expect.any(Number));
  });
});

// Cultural analysis tests
describe('CulturalAnalysis', () => {
  test('should display cultural information without restricting access', async () => {
    const document = createMockDocument({ culturalSensitivityLevel: 4 });

    const analysis = await getCulturalAnalysis(document.id);

    expect(analysis.educationalResources).toBeDefined();
    expect(analysis.communityGuidelines).toBeDefined();
    // Verify no access restrictions
    expect(analysis.accessRestricted).toBe(false);
  });
});
```

### Integration Tests

```typescript
// End-to-end upload workflow tests
describe('Document Upload Workflow', () => {
  test('should complete full upload and validation process', async () => {
    const file = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' });
    const metadata = { title: 'Test Document', tags: ['test'] };

    // Start upload
    const uploadResult = await uploadDocument(file, metadata);
    expect(uploadResult.success).toBe(true);

    // Verify document appears in library
    const documents = await getDocuments();
    expect(documents).toContainEqual(expect.objectContaining({ title: 'Test Document' }));

    // Verify cultural analysis is available
    const analysis = await getCulturalAnalysis(uploadResult.document.id);
    expect(analysis).toBeDefined();
  });
});
```
