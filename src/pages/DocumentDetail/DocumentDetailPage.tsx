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
  type Component,
  createSignal,
  createMemo,
  createEffect,
  Show,
  For,
  ErrorBoundary,
  onMount,
} from 'solid-js';
import { useParams, useNavigate, useSearchParams } from '@solidjs/router';
import { convertFileSrc } from '@tauri-apps/api/core';
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
  Search,
  Globe,
  Users,
  Heart,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-solid';

// Import components
import { Button } from '@/components/foundation/Button';
import { Card } from '@/components/foundation/Card';
import { Modal } from '@/components/foundation/Modal';
import { DocumentViewerLoader } from '@/components/composite/DocumentViewerLoader';
import ErrorMessage from '@/components/foundation/ErrorMessage/ErrorMessage';
import { Badge } from '@/components/foundation/Badge';
import { Tooltip } from '@/components/foundation/Tooltip';
import { CulturalIndicator } from '@/components/cultural/CulturalIndicator';
import { CulturalContext } from '@/components/cultural/CulturalContext';
import { DocumentViewer } from '@/components/composite/DocumentViewer';
import { useToast } from '@/hooks/ui/useToast';
import { useTranslation } from '@/i18n';

// Import services
import { culturalApi } from '@/services/api';
import { commentService, favoriteService, activityService } from '@/services';
import { documentService, type DocumentDetailModel } from '@/services/documentService';
import { transferFacade } from '@/services/network/transferFacade';
import { shareWithToast, copyNetworkLinkWithToast } from '@/utils/documentActions';

// Import styles
import styles from './DocumentDetailPage.module.css';
import { useP2PTransfers } from '@/hooks/api/useP2PTransfers';

type DetailDocument = DocumentDetailModel & {
  fileType?: string;
  author?: string;
  publishedDate?: string;
  tags?: string[];
  viewCount?: number;
  favoriteCount?: number;
  commentCount?: number;
  culturalMetadata?: { sensitivityLevel: number };
  language?: string;
  category?: string;
  culturalOrigin?: string;
  metadata?: { totalPages?: number };
};

function mapToDetailDocument(model: DocumentDetailModel): DetailDocument {
  return {
    ...model,
    fileType: model.format,
    tags: [],
    viewCount: 0,
    favoriteCount: 0,
    commentCount: 0,
    culturalMetadata: { sensitivityLevel: 0 },
  };
}

function detectDocumentType(format: string): 'pdf' | 'epub' | 'text' | 'markdown' {
  const p = format.toLowerCase();
  if (p.endsWith('.pdf') || p === 'pdf') return 'pdf';
  if (p.endsWith('.epub') || p === 'epub') return 'epub';
  if (p.endsWith('.md') || p === 'markdown') return 'markdown';
  if (p.endsWith('.txt') || p === 'text') return 'text';
  return 'pdf';
}

type DocumentDetailPageProps = {};

export const DocumentDetailPage: Component<DocumentDetailPageProps> = () => {
  const { enabled, busy, enable, seedFile, downloadByHash, error, lastOp } = useP2PTransfers();
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const paramValue = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? (value[0] ?? '') : (value ?? '');

  // State management
  const [hudOpen, setHudOpen] = createSignal(false);
  const [viewMode, setViewMode] = createSignal<'reader' | 'metadata' | 'cultural' | 'community'>(
    'reader'
  );
  const [zoomLevel, setZoomLevel] = createSignal(100);
  const [currentPage, setCurrentPage] = createSignal(1);
  const [showCulturalModal, setShowCulturalModal] = createSignal(false);
  const [showShareModal, setShowShareModal] = createSignal(false);
  const [isBookmarked, setIsBookmarked] = createSignal(false);
  const [searchTerm, setSearchTerm] = createSignal('');
  const [comments, setComments] = createSignal<Awaited<ReturnType<typeof commentService.list>>>([]);
  const [newComment, setNewComment] = createSignal('');
  const [detailDocument, setDetailDocument] = createSignal<DetailDocument | null>(null);
  const [detailLoading, setDetailLoading] = createSignal(true);
  const [culturalContext, setCulturalContext] = createSignal<unknown>(null);
  const [documentBytes, setDocumentBytes] = createSignal<Uint8Array | undefined>();
  const [documentUrl, setDocumentUrl] = createSignal<string | undefined>();
  const [contentLoading, setContentLoading] = createSignal(false);
  const toast = useToast();
  const { t } = useTranslation();
  const tf = t as unknown as (key: string) => string;

  onMount(() => {
    if (paramValue(searchParams.hud) === '1') {
      setHudOpen(true);
    }
  });

  const toggleHud = () => {
    const next = !hudOpen();
    setHudOpen(next);
    setSearchParams({ hud: next ? '1' : undefined }, { replace: true });
    if (!next) {
      setViewMode('reader');
    }
  };

  const effectiveViewMode = createMemo(() => (hudOpen() ? viewMode() : 'reader'));

  // Resolve document without router createAsync (avoids route-level Suspense flash)
  createEffect(() => {
    const id = params.id;
    if (!id) {
      setDetailDocument(null);
      setDetailLoading(false);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailDocument(null);
    setCulturalContext(null);

    void (async () => {
      try {
        const resolved = await documentService.resolveDocumentById(id);
        if (cancelled) return;
        const mapped = resolved ? mapToDetailDocument(resolved) : null;
        setDetailDocument(mapped);

        if (mapped) {
          void activityService.logActivity('view', mapped.id, { title: mapped.title });
          void favoriteService.isFavorite(mapped.id).then(setIsBookmarked);
          commentService
            .list(mapped.id)
            .then(list => {
              if (!cancelled) setComments(list);
            })
            .catch(() => {
              if (!cancelled) setComments([]);
            });

          try {
            const response = await culturalApi.getCulturalContext(id);
            if (!cancelled && response.success) {
              setCulturalContext(response.data);
            }
          } catch {
            /* ignore */
          }
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  // Computed values
  const documentTitle = createMemo(() => detailDocument()?.title || 'Loading...');
  const totalPages = createMemo(() => 1); // Default to 1 page for now
  const culturalLevel = createMemo(() => detailDocument()?.culturalMetadata?.sensitivityLevel || 0);
  const hasEducationalContent = createMemo(() => {
    const ctx = culturalContext();
    const resources =
      (ctx as any)?.educationalResources || (ctx as any)?.educationalContent?.learningResources;
    return Array.isArray(resources) && resources.length > 0;
  });

  const documentType = createMemo((): 'pdf' | 'epub' | 'text' | 'markdown' => {
    const doc = detailDocument();
    if (!doc) return 'pdf';
    return detectDocumentType(doc.fileType?.toLowerCase?.() || doc.format || 'pdf');
  });

  const viewerContentReady = createMemo(() => {
    const type = documentType();
    if (type === 'pdf' || type === 'epub') return !!documentBytes();
    return !!documentUrl();
  });

  const showViewerLoader = createMemo(() => {
    if (detailLoading()) return true;
    const doc = detailDocument();
    if (!doc || doc.source !== 'local') return false;
    return contentLoading() || !viewerContentReady();
  });

  const loaderPhase = createMemo((): 'resolve' | 'content' =>
    detailLoading() ? 'resolve' : 'content'
  );

  const loaderMessage = createMemo(() =>
    loaderPhase() === 'resolve'
      ? tf('pages.documentDetail.loading')
      : tf('pages.documentDetail.loadingContent')
  );

  const loaderEyebrow = createMemo(() =>
    loaderPhase() === 'resolve'
      ? tf('pages.documentDetail.loader.eyebrowResolve')
      : tf('pages.documentDetail.loader.eyebrowContent')
  );

  const loaderHint = createMemo(() =>
    loaderPhase() === 'resolve'
      ? tf('pages.documentDetail.loader.hintResolve')
      : tf('pages.documentDetail.loader.hintContent')
  );

  // Load local file bytes for viewer
  createEffect(() => {
    const doc = detailDocument();
    if (!doc || doc.source !== 'local' || !doc.filePath) {
      setDocumentBytes(undefined);
      setDocumentUrl(undefined);
      setContentLoading(false);
      return;
    }

    const type = detectDocumentType(doc.fileType?.toLowerCase?.() || doc.format || 'pdf');
    let cancelled = false;
    setContentLoading(true);

    void (async () => {
      try {
        if (type === 'pdf' || type === 'epub') {
          const content = await documentService.openDocument(doc.filePath);
          if (!cancelled) setDocumentBytes(content);
        } else {
          if (!cancelled) setDocumentUrl(convertFileSrc(doc.filePath));
        }
      } catch (e) {
        console.warn('DocumentDetail: failed to load content', e);
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  // Reload comments when switching to community tab
  createEffect(() => {
    if (viewMode() === 'community') {
      const doc = detailDocument();
      if (doc) {
        commentService
          .list(doc.id)
          .then(list => setComments(list))
          .catch(() => setComments([]));
      }
    }
  });

  // Event handlers
  const handleBookmark = async () => {
    const doc = detailDocument();
    if (!doc) return;
    const res = await favoriteService.toggleFavorite(doc.id);
    setIsBookmarked(res.isFavorite);
    toast.success(
      res.isFavorite
        ? tf('pages.documentDetail.toasts.addedToFavorites')
        : tf('pages.documentDetail.toasts.removedFromFavorites')
    );
  };

  const handleShare = async () => {
    const doc = detailDocument();
    if (!doc) return;
    try {
      if (doc.source === 'network' && doc.networkLink) {
        await copyNetworkLinkWithToast(doc.networkLink, doc.title, toast);
      } else if (doc.filePath && doc.source === 'local') {
        await shareWithToast(doc, toast);
      } else {
        throw new Error('No shareable path for this document.');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDownload = async () => {
    const doc = detailDocument();
    if (!doc) return;

    try {
      if (doc.source === 'local' && doc.filePath) {
        toast.info(tf('pages.documentDetail.toasts.alreadyLocal'));
        return;
      }
      const link = doc.networkLink || doc.filePath;
      if (link) {
        await transferFacade.downloadLink(link, doc.title);
        toast.success('Download started — check Sharing & downloads for progress.');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
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
          description={err.message}
          onRetry={() => window.location.reload()}
        />
      )}
    >
      <div
        class={`document-detail-page ${styles.documentDetailPage} ${!hudOpen() ? styles.focusMode : ''}`}
      >
        {/* Header */}
        <header class={styles.pageHeader}>
          <div class={styles.headerLeft}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              class={styles.backButton || ''}
            >
              <ChevronLeft size={16} />
              Back
            </Button>

            <div class={styles.titleSection}>
              <h1 class={styles.documentTitle}>{documentTitle()}</h1>
              <Show when={hudOpen() && detailDocument()}>
                {doc => (
                  <div class={styles.documentMeta}>
                    <span class={styles.author}>{doc().author}</span>
                    <span class={styles.separator}>•</span>
                    <span class={styles.date}>{doc().publishedDate}</span>
                    <Show when={culturalLevel() > 0}>
                      <span class={styles.separator}>•</span>
                      <CulturalIndicator
                        level={(Math.min(3, Math.max(1, culturalLevel())) || 1) as 1 | 2 | 3}
                        size="sm"
                        informationOnly={true}
                      />
                    </Show>
                  </div>
                )}
              </Show>
            </div>
          </div>

          <div class={styles.headerActions}>
            <Tooltip
              content={
                hudOpen()
                  ? tf('pages.documentDetail.toggleHud.hide')
                  : tf('pages.documentDetail.toggleHud.show')
              }
            >
              <Button
                variant={hudOpen() ? 'primary' : 'outline'}
                size="sm"
                onClick={toggleHud}
                class={styles.actionButton || ''}
                aria-pressed={hudOpen()}
              >
                <Show when={hudOpen()} fallback={<PanelRightOpen size={16} />}>
                  <PanelRightClose size={16} />
                </Show>
                <span class={styles.hudToggleLabel}>
                  {hudOpen()
                    ? tf('pages.documentDetail.toggleHud.hide')
                    : tf('pages.documentDetail.toggleHud.show')}
                </span>
              </Button>
            </Tooltip>

            <Tooltip content={isBookmarked() ? 'Remove Bookmark' : 'Add Bookmark'}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                class={`${styles.actionButton || ''} ${isBookmarked() ? styles.bookmarked : ''}`}
              >
                <Bookmark size={16} />
              </Button>
            </Tooltip>

            <Show when={hudOpen()}>
              <Button
                variant="outline"
                size="sm"
                onClick={enable}
                disabled={busy()}
                class={styles.actionButton || ''}
              >
                {enabled() ? 'Private Networking Enabled' : 'Enable Private Networking'}
              </Button>
              <Tooltip content="Cultural Information">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCulturalModal(true)}
                  class={styles.actionButton || ''}
                  disabled={!hasEducationalContent()}
                >
                  <Globe size={16} />
                </Button>
              </Tooltip>

              <Tooltip content="Share Document">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShareModal(true)}
                  class={styles.actionButton || ''}
                >
                  <Share2 size={16} />
                </Button>
              </Tooltip>

              <Tooltip content="Seed via P2P">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!enabled() || busy()}
                  onClick={() => {
                    const doc = detailDocument();
                    if (doc?.source === 'local' && doc.filePath) {
                      void seedFile(doc.filePath);
                    }
                  }}
                  class={styles.actionButton || ''}
                >
                  <Share2 size={16} />
                </Button>
              </Tooltip>

              <Tooltip content="Download">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  class={styles.actionButton || ''}
                >
                  <Download size={16} />
                </Button>
              </Tooltip>
            </Show>
          </div>
        </header>

        {/* Main Content */}
        <main class={styles.mainContent}>
          <Show when={showViewerLoader()}>
            <div class={styles.loaderScreen}>
              <DocumentViewerLoader
                fullscreen
                phase={loaderPhase()}
                message={loaderMessage()}
                eyebrow={loaderEyebrow()}
                hint={loaderHint()}
              />
            </div>
          </Show>

          {/* Sidebar — visible only in HUD mode */}
          <Show when={hudOpen()}>
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
                  <Card title="Document Information" class={styles.metadataCard || ''}>
                    <Show when={detailDocument()}>
                      {doc => (
                        <div class={styles.metadataList}>
                          <div class={styles.metadataItem}>
                            <span class={styles.label}>File Type:</span>
                            <span class={styles.value}>{doc().fileType?.toUpperCase()}</span>
                          </div>
                          <div class={styles.metadataItem}>
                            <span class={styles.label}>File Size:</span>
                            <span class={styles.value}>
                              {documentService.formatFileSize(doc().fileSize)}
                            </span>
                          </div>
                          <Show when={doc().source === 'network'}>
                            <div class={styles.metadataItem}>
                              <span class={styles.label}>Peers:</span>
                              <span class={styles.value}>{doc().peerCount ?? 0}</span>
                            </div>
                          </Show>
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

                  <Card title="Tags" class={styles.tagsCard || ''}>
                    <Show when={detailDocument()?.tags}>
                      <div class={styles.tagsList}>
                        <For each={detailDocument()!.tags}>
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
                    contextInfo={culturalContext() as any}
                    showEducationalResources={true}
                    showCommunityInfo={true}
                  />
                </Show>

                <Show when={viewMode() === 'community'}>
                  <Card title="Community Activity" class={styles.communityCard || ''}>
                    <div class={styles.communityStats}>
                      <div class={styles.statItem}>
                        <Eye size={16} />
                        <span>{detailDocument()?.viewCount || 0} views</span>
                      </div>
                      <div class={styles.statItem}>
                        <Heart size={16} />
                        <span>{detailDocument()?.favoriteCount || 0} favorites</span>
                      </div>
                      <div class={styles.statItem}>
                        <MessageCircle size={16} />
                        <span>{detailDocument()?.commentCount || 0} comments</span>
                      </div>
                    </div>
                    <div class={styles.commentComposer}>
                      <textarea
                        class={styles.commentInput}
                        placeholder="Add a comment..."
                        value={newComment()}
                        onInput={e => setNewComment(e.currentTarget.value)}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          const doc = detailDocument();
                          if (!doc || !newComment().trim()) return;
                          const created = await commentService.add({
                            documentId: doc.id,
                            text: newComment().trim(),
                          });
                          if (created) {
                            setComments([created, ...comments()]);
                            setNewComment('');
                            toast.success(tf('pages.documentDetail.toasts.commentPosted'));
                          } else {
                            toast.error(tf('pages.documentDetail.toasts.commentPostFailed'));
                          }
                        }}
                      >
                        Post
                      </Button>
                    </div>
                    <div class={styles.commentList}>
                      <For each={comments()}>
                        {c => (
                          <div class={styles.commentItem}>
                            <div class={styles.commentHeader}>
                              <span class={styles.author}>{c.authorName || c.authorId}</span>
                              <span class={styles.time}>
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div class={styles.commentText}>{c.text}</div>
                          </div>
                        )}
                      </For>
                    </div>
                  </Card>
                </Show>
              </div>
            </aside>
          </Show>

          {/* Document Viewer */}
          <section class={styles.viewerSection}>
            <Show when={effectiveViewMode() === 'reader'}>
              {/* Viewer Controls — HUD mode only; focus mode uses DocumentViewer toolbar */}
              <Show when={hudOpen()}>
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
              </Show>

              {/* Document Viewer Component */}
              <div class={styles.viewerContainer}>
                <Show when={!detailLoading() && !detailDocument()}>
                  <ErrorMessage
                    message={tf('pages.documentDetail.notFound')}
                    onRetry={() => navigate('/documents')}
                  />
                </Show>
                <Show when={!detailLoading() && detailDocument()}>
                  <Show
                    when={detailDocument()?.source === 'local'}
                    fallback={
                      <Card title="Network document" padding="lg">
                        <p>
                          This file is on the network. Use Download to fetch it locally, then open
                          it from Sharing & downloads or your download folder.
                        </p>
                        <Button variant="primary" size="sm" onClick={() => void handleDownload()}>
                          Download from network
                        </Button>
                      </Card>
                    }
                  >
                    <Show when={!contentLoading() && viewerContentReady()}>
                      <DocumentViewer
                        documentType={documentType()}
                        documentPath={detailDocument()!.filePath}
                        documentBytes={
                          documentType() === 'pdf' || documentType() === 'epub'
                            ? documentBytes()
                            : undefined
                        }
                        documentUrl={
                          documentType() === 'pdf' || documentType() === 'epub'
                            ? undefined
                            : documentUrl()
                        }
                        title={detailDocument()!.title}
                        currentPage={currentPage()}
                        zoomLevel={zoomLevel()}
                        searchTerm={searchTerm()}
                        onPageChange={setCurrentPage}
                        onZoomChange={setZoomLevel}
                        culturalContext={culturalContext() as any}
                        showHeader={false}
                        showControls={true}
                      />
                    </Show>
                  </Show>
                </Show>
              </div>
            </Show>

            {/* Other view modes content — HUD mode only */}
            <Show when={hudOpen() && effectiveViewMode() !== 'reader'}>
              <Show when={viewMode() === 'community'}>
                <div class={styles.communityView}>
                  <div class={styles.commentComposer}>
                    <textarea
                      class={styles.commentInput}
                      placeholder="Add a comment..."
                      value={newComment()}
                      onInput={e => setNewComment(e.currentTarget.value)}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={async () => {
                        const doc = detailDocument();
                        if (!doc || !newComment().trim()) return;
                        const created = await commentService.add({
                          documentId: doc.id,
                          text: newComment().trim(),
                        });
                        if (created) {
                          setComments([created, ...comments()]);
                          setNewComment('');
                        }
                      }}
                    >
                      Post
                    </Button>
                  </div>
                  <div class={styles.commentList}>
                    <For each={comments()}>
                      {c => (
                        <div class={styles.commentItem}>
                          <div class={styles.commentHeader}>
                            <span class={styles.author}>{c.authorName || c.authorId}</span>
                            <span class={styles.time}>
                              {new Date(c.createdAt).toLocaleString()}
                            </span>
                            <div class={styles.commentActions}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  const text = window.prompt('Edit comment', (c as any).text);
                                  if (text == null) return;
                                  const ok = await commentService.edit((c as any).id, text);
                                  if (ok) {
                                    setComments(
                                      comments().map(x =>
                                        (x as any).id === (c as any).id
                                          ? { ...(x as any), text }
                                          : x
                                      )
                                    );
                                    toast.success(tf('pages.documentDetail.toasts.commentUpdated'));
                                  } else {
                                    toast.error(
                                      tf('pages.documentDetail.toasts.commentUpdateFailed')
                                    );
                                  }
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  const ok = await commentService.remove((c as any).id);
                                  if (ok) {
                                    setComments(
                                      comments().filter(x => (x as any).id !== (c as any).id)
                                    );
                                    toast.success(tf('pages.documentDetail.toasts.commentDeleted'));
                                  } else {
                                    toast.error(
                                      tf('pages.documentDetail.toasts.commentDeleteFailed')
                                    );
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          <div class={styles.commentText}>{(c as any).text}</div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
              <Show when={viewMode() !== 'community'}>
                <div class={styles.alternativeView}>
                  <p>Content for {viewMode()} view will be displayed here.</p>
                </div>
              </Show>
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
                contextInfo={context() as any}
                showEducationalResources={true}
                showCommunityInfo={true}
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
            <div class={styles.row}>
              <input
                type="text"
                placeholder="Paste hash to download"
                class={styles.searchInput}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget as HTMLInputElement;
                    const h = input.value.trim();
                    if (h) downloadByHash(h, (window as any).api?.downloadsDir ?? 'downloads');
                  }
                }}
              />
            </div>
            <Show when={error()}>
              <div class={styles.errorText}>{error()}</div>
            </Show>
            <Show when={lastOp()}>
              <div class={styles.mutedText}>Last operation: {lastOp()}</div>
            </Show>
            <Button
              variant="outline"
              onClick={() => void handleShare()}
              class={styles.shareButton || ''}
            >
              <Share2 size={16} />
              Copy Share Link
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleDownload()}
              class={styles.shareButton || ''}
            >
              <Download size={16} />
              Download
            </Button>
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default DocumentDetailPage;
