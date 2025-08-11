/**
 * DocumentDetailPage - Comprehensive document viewing and management interface
 *
 * Features:
 * - PDF/EPUB viewer with full navigation
 * - Cultural context display (information only)
 * - Document metadata management
 * - Community annotations and sharing
 * - Educational resources integration
 * - Anti-censorship compliance
 *
 * @cultural-considerations
 * - Displays cultural sensitivity indicators for information only
 * - Shows educational resources for cultural understanding
 * - Supports traditional knowledge context display
 * - NO ACCESS RESTRICTIONS - information only
 *
 * @accessibility
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - High contrast mode support
 * - Focus management
 *
 * @performance
 * - Lazy loads document content
 * - Memoizes cultural context calculations
 * - Optimized for large documents
 */

import {
  Component,
  createSignal,
  createMemo,
  createEffect,
  Show,
  For,
  ErrorBoundary,
} from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { createAsync } from '@solidjs/router';
import {
  BookOpen,
  Download,
  Share2,
  Bookmark,
  Eye,
  MessageCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Settings,
  Globe,
  Users,
  Award,
  Heart,
  Flag,
} from 'lucide-solid';

// Import components
import { Button } from '@/components/foundation/Button';
import { Card } from '@/components/foundation/Card';
import { Modal } from '@/components/foundation/Modal';
import { Loading } from '@/components/foundation/Loading';
import ErrorMessage from '@/components/foundation/ErrorMessage/ErrorMessage';
import { Badge } from '@/components/foundation/Badge';
import { Tooltip } from '@/components/foundation/Tooltip';
import { CulturalIndicator } from '@/components/cultural/CulturalIndicator';
import { CulturalContext } from '@/components/cultural/CulturalContext';
import { DocumentViewer } from '@/components/composite/DocumentViewer';

// Import services
import { documentApi, culturalApi } from '@/services/api';
import type { Document } from '@/types/core';

// Import styles
import styles from './DocumentDetailPage.module.css';

interface DocumentDetailPageProps {}

export const DocumentDetailPage: Component<DocumentDetailPageProps> = () => {
  const params = useParams();
  const navigate = useNavigate();

  // State management
  const [viewMode, setViewMode] = createSignal<'reader' | 'metadata' | 'cultural' | 'community'>(
    'reader'
  );
  const [zoomLevel, setZoomLevel] = createSignal(100);
  const [currentPage, setCurrentPage] = createSignal(1);
  const [showCulturalModal, setShowCulturalModal] = createSignal(false);
  const [showShareModal, setShowShareModal] = createSignal(false);
  const [isBookmarked, setIsBookmarked] = createSignal(false);
  const [searchTerm, setSearchTerm] = createSignal('');

  // Data fetching
  const document = createAsync(async () => {
    if (!params.id) return null;
    try {
      const response = await documentApi.getDocument(params.id);
      return response.success ? response.document : null;
    } catch (error) {
      console.error('Failed to load document:', error);
      return null;
    }
  });

  const culturalContext = createAsync(async () => {
    const doc = document();
    if (!doc) return null;

    try {
      // Use the document ID as the context ID for now
      const response = await culturalApi.getCulturalContext(params.id!);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Failed to load cultural context:', error);
      return null;
    }
  });

  // Computed values
  const documentTitle = createMemo(() => document()?.title || 'Loading...');
  const totalPages = createMemo(() => 1); // Default to 1 page for now
  const culturalLevel = createMemo(() => document()?.culturalMetadata?.sensitivityLevel || 0);
  const hasEducationalContent = createMemo(
    () => culturalContext()?.educationalContent?.learningResources?.length > 0
  );

  // Effects
  createEffect(() => {
    const doc = document();
    if (doc) {
      // Document loaded successfully
      console.log('Document loaded:', doc.title);
    }
  });

  // Event handlers
  const handleBookmark = async () => {
    // TODO: Implement bookmark functionality when service is available
    console.log('Bookmark functionality not yet implemented');
  };

  const handleShare = async () => {
    // TODO: Implement share functionality when service is available
    console.log('Share functionality not yet implemented');
  };

  const handleDownload = async () => {
    const doc = document();
    if (!doc) return;

    try {
      const downloadUrl = await documentApi.getDownloadUrl(doc.id);
      if (downloadUrl) {
        // Create a temporary link and trigger download
        const link = window.document.createElement('a');
        link.href = downloadUrl;
        link.download = doc.title || 'document';
        link.click();
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const current = zoomLevel();
    const newZoom = direction === 'in' ? Math.min(current + 25, 500) : Math.max(current - 25, 25);
    setZoomLevel(newZoom);
  };

  const handlePageNavigation = (direction: 'prev' | 'next') => {
    const current = currentPage();
    const total = totalPages();
    const newPage = direction === 'prev' ? Math.max(1, current - 1) : Math.min(total, current + 1);
    setCurrentPage(newPage);
  };

  return (
    <ErrorBoundary
      fallback={err => (
        <ErrorMessage
          message="Failed to load document details"
          details={err.message}
          onRetry={() => window.location.reload()}
        />
      )}
    >
      <div class={styles.documentDetailPage}>
        {/* Header */}
        <header class={styles.pageHeader}>
          <div class={styles.headerLeft}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              class={styles.backButton}
            >
              <ChevronLeft size={16} />
              Back
            </Button>

            <div class={styles.titleSection}>
              <h1 class={styles.documentTitle}>{documentTitle()}</h1>
              <Show when={document()}>
                {doc => (
                  <div class={styles.documentMeta}>
                    <span class={styles.author}>{doc().author}</span>
                    <span class={styles.separator}>•</span>
                    <span class={styles.date}>{doc().publishedDate}</span>
                    <Show when={culturalLevel() > 0}>
                      <span class={styles.separator}>•</span>
                      <CulturalIndicator level={culturalLevel()} size="sm" informationOnly={true} />
                    </Show>
                  </div>
                )}
              </Show>
            </div>
          </div>

          <div class={styles.headerActions}>
            <Tooltip content="Cultural Information">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCulturalModal(true)}
                class={styles.actionButton}
                disabled={!hasEducationalContent()}
              >
                <Globe size={16} />
              </Button>
            </Tooltip>

            <Tooltip content={isBookmarked() ? 'Remove Bookmark' : 'Add Bookmark'}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                class={`${styles.actionButton} ${isBookmarked() ? styles.bookmarked : ''}`}
              >
                <Bookmark size={16} />
              </Button>
            </Tooltip>

            <Tooltip content="Share Document">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareModal(true)}
                class={styles.actionButton}
              >
                <Share2 size={16} />
              </Button>
            </Tooltip>

            <Tooltip content="Download">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                class={styles.actionButton}
              >
                <Download size={16} />
              </Button>
            </Tooltip>
          </div>
        </header>

        {/* Main Content */}
        <main class={styles.mainContent}>
          {/* Sidebar */}
          <aside class={styles.sidebar}>
            <nav class={styles.viewTabs}>
              <button
                class={`${styles.tab} ${viewMode() === 'reader' ? styles.active : ''}`}
                onClick={() => setViewMode('reader')}
              >
                <BookOpen size={16} />
                Reader
              </button>
              <button
                class={`${styles.tab} ${viewMode() === 'metadata' ? styles.active : ''}`}
                onClick={() => setViewMode('metadata')}
              >
                <Info size={16} />
                Details
              </button>
              <button
                class={`${styles.tab} ${viewMode() === 'cultural' ? styles.active : ''}`}
                onClick={() => setViewMode('cultural')}
                disabled={!hasEducationalContent()}
              >
                <Globe size={16} />
                Cultural
              </button>
              <button
                class={`${styles.tab} ${viewMode() === 'community' ? styles.active : ''}`}
                onClick={() => setViewMode('community')}
              >
                <Users size={16} />
                Community
              </button>
            </nav>

            {/* Sidebar Content */}
            <div class={styles.sidebarContent}>
              <Show when={viewMode() === 'metadata'}>
                <Card title="Document Information" class={styles.metadataCard}>
                  <Show when={document()}>
                    {doc => (
                      <div class={styles.metadataList}>
                        <div class={styles.metadataItem}>
                          <span class={styles.label}>File Type:</span>
                          <span class={styles.value}>{doc().fileType?.toUpperCase()}</span>
                        </div>
                        <div class={styles.metadataItem}>
                          <span class={styles.label}>File Size:</span>
                          <span class={styles.value}>{doc().fileSize}</span>
                        </div>
                        <div class={styles.metadataItem}>
                          <span class={styles.label}>Pages:</span>
                          <span class={styles.value}>{doc().metadata?.totalPages}</span>
                        </div>
                        <div class={styles.metadataItem}>
                          <span class={styles.label}>Language:</span>
                          <span class={styles.value}>{doc().language}</span>
                        </div>
                        <div class={styles.metadataItem}>
                          <span class={styles.label}>Category:</span>
                          <span class={styles.value}>{doc().category}</span>
                        </div>
                        <Show when={doc().culturalOrigin}>
                          <div class={styles.metadataItem}>
                            <span class={styles.label}>Cultural Origin:</span>
                            <span class={styles.value}>{doc().culturalOrigin}</span>
                          </div>
                        </Show>
                      </div>
                    )}
                  </Show>
                </Card>

                <Card title="Tags" class={styles.tagsCard}>
                  <Show when={document()?.tags}>
                    <div class={styles.tagsList}>
                      <For each={document()!.tags}>
                        {tag => (
                          <Badge variant="secondary" size="sm">
                            {tag}
                          </Badge>
                        )}
                      </For>
                    </div>
                  </Show>
                </Card>
              </Show>

              <Show when={viewMode() === 'cultural' && culturalContext()}>
                <CulturalContext
                  context={culturalContext()!}
                  documentId={params.id!}
                  informationOnly={true}
                  showEducationalContent={true}
                />
              </Show>

              <Show when={viewMode() === 'community'}>
                <Card title="Community Activity" class={styles.communityCard}>
                  <div class={styles.communityStats}>
                    <div class={styles.statItem}>
                      <Eye size={16} />
                      <span>{document()?.viewCount || 0} views</span>
                    </div>
                    <div class={styles.statItem}>
                      <Heart size={16} />
                      <span>{document()?.favoriteCount || 0} favorites</span>
                    </div>
                    <div class={styles.statItem}>
                      <MessageCircle size={16} />
                      <span>{document()?.commentCount || 0} comments</span>
                    </div>
                  </div>
                </Card>
              </Show>
            </div>
          </aside>

          {/* Document Viewer */}
          <section class={styles.viewerSection}>
            <Show when={viewMode() === 'reader'}>
              {/* Viewer Controls */}
              <div class={styles.viewerControls}>
                <div class={styles.navigationControls}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageNavigation('prev')}
                    disabled={currentPage() <= 1}
                  >
                    <ChevronLeft size={16} />
                  </Button>

                  <span class={styles.pageInfo}>
                    {currentPage()} of {totalPages()}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageNavigation('next')}
                    disabled={currentPage() >= totalPages()}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>

                <div class={styles.zoomControls}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleZoom('out')}
                    disabled={zoomLevel() <= 50}
                  >
                    <ZoomOut size={16} />
                  </Button>

                  <span class={styles.zoomLevel}>{zoomLevel()}%</span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleZoom('in')}
                    disabled={zoomLevel() >= 300}
                  >
                    <ZoomIn size={16} />
                  </Button>
                </div>

                <div class={styles.searchControls}>
                  <input
                    type="text"
                    placeholder="Search in document..."
                    value={searchTerm()}
                    onInput={e => setSearchTerm(e.currentTarget.value)}
                    class={styles.searchInput}
                  />
                  <Button variant="ghost" size="sm">
                    <Search size={16} />
                  </Button>
                </div>
              </div>

              {/* Document Viewer Component */}
              <div class={styles.viewerContainer}>
                <Show when={document()} fallback={<Loading message="Loading document..." />}>
                  {doc => (
                    <DocumentViewer
                      document={doc()}
                      currentPage={currentPage()}
                      zoomLevel={zoomLevel()}
                      searchTerm={searchTerm()}
                      onPageChange={setCurrentPage}
                      culturalContext={culturalContext()}
                    />
                  )}
                </Show>
              </div>
            </Show>

            {/* Other view modes content */}
            <Show when={viewMode() !== 'reader'}>
              <div class={styles.alternativeView}>
                <p>Content for {viewMode()} view will be displayed here.</p>
              </div>
            </Show>
          </section>
        </main>

        {/* Cultural Information Modal */}
        <Modal
          isOpen={showCulturalModal()}
          onClose={() => setShowCulturalModal(false)}
          title="Cultural Context & Educational Resources"
          size="lg"
        >
          <Show when={culturalContext()}>
            {context => (
              <CulturalContext
                context={context()}
                documentId={params.id!}
                informationOnly={true}
                showEducationalContent={true}
                expanded={true}
              />
            )}
          </Show>
        </Modal>

        {/* Share Modal */}
        <Modal
          isOpen={showShareModal()}
          onClose={() => setShowShareModal(false)}
          title="Share Document"
          size="md"
        >
          <div class={styles.shareOptions}>
            <Button variant="outline" onClick={() => handleShare()} class={styles.shareButton}>
              <Users size={16} />
              Share via P2P Network
            </Button>
            <Button variant="outline" onClick={() => handleShare()} class={styles.shareButton}>
              <Share2 size={16} />
              Copy Share Link
            </Button>
            <Button variant="outline" onClick={() => handleShare()} class={styles.shareButton}>
              <Download size={16} />
              Export with Metadata
            </Button>
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default DocumentDetailPage;
