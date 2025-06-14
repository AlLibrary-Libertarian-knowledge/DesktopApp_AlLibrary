import { Component, createSignal, createResource, createMemo, Show, For } from 'solid-js';
import { Button, Card, Modal } from '../../components/foundation';
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
} from 'lucide-solid';
import { validationService } from '../../services';
import type { Document } from '../../types/Document';
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
      {/* Enhanced Page Header */}
      <header class={`${styles['page-header']} ${styles.enhanced}`}>
        <div class={styles['header-content']}>
          <h1 class={styles['page-title']}>Document Management</h1>
          <p class={styles['page-subtitle']}>
            Upload, organize, and manage your cultural heritage documents
          </p>
        </div>

        {/* Document Statistics */}
        <div class={styles['stats-overview']}>
          <div class={styles['stat-item']}>
            <span class={styles['stat-number']}>{stats().totalDocuments}</span>
            <span class={styles['stat-label']}>Documents</span>
          </div>
          <div class={styles['stat-item']}>
            <span class={styles['stat-number']}>{formatFileSize(stats().totalSize)}</span>
            <span class={styles['stat-label']}>Storage Used</span>
          </div>
          <div class={styles['stat-item']}>
            <span class={styles['stat-number']}>{stats().culturalContexts}</span>
            <span class={styles['stat-label']}>Cultural Contexts</span>
          </div>
          <div class={styles['stat-item']}>
            <span class={styles['stat-number']}>{stats().recentUploads}</span>
            <span class={styles['stat-label']}>Recent Uploads</span>
          </div>
        </div>
      </header>

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
            {/* Search and Controls */}
            <div class={styles['library-controls']}>
              <div class={styles['search-section']}>
                <div class={styles['search-input-container']}>
                  <Search size={20} class={styles['search-icon'] || ''} />
                  <input
                    type="text"
                    placeholder="Search documents by title, content, or cultural context..."
                    value={searchQuery()}
                    onInput={e => setSearchQuery(e.currentTarget.value)}
                    class={styles['search-input']}
                  />
                  <Show when={searchQuery()}>
                    <button
                      onClick={() => setSearchQuery('')}
                      class={styles['clear-search']}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  </Show>
                </div>
              </div>

              <div class={styles['view-controls']}>
                <Button
                  variant={viewMode() === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid size={16} />
                </Button>
                <Button
                  variant={viewMode() === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List size={16} />
                </Button>
              </div>
            </div>

            {/* Document Grid/List */}
            <div class={`${styles['documents-container']} ${styles[viewMode()]}`}>
              <Show when={documents.loading}>
                <div class={styles['loading-state']}>
                  <div class={styles['loading-spinner']}></div>
                  <p>Loading documents...</p>
                </div>
              </Show>

              <Show when={!documents.loading && filteredDocuments().length === 0}>
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

              <Show when={!documents.loading && filteredDocuments().length > 0}>
                <div class={styles['documents-grid']}>
                  <For each={filteredDocuments()}>
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
    </div>
  );
};

export default DocumentManagement;
