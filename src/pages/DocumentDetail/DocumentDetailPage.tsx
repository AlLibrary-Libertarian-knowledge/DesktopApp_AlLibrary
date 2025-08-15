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
import { BookOpen, Download, Share2, Bookmark, Eye, MessageCircle, Info, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Search, Globe, Users, Heart } from 'lucide-solid';

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
import { useToast } from '@/hooks/ui/useToast';
import { useTranslation } from '@/i18n';

// Import services
import { documentApi, culturalApi } from '@/services/api';
import { commentService, shareService } from '@/services';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';
// import type { Document } from '@/types/core';

// Import styles
import styles from './DocumentDetailPage.module.css';
import { useP2PTransfers } from '@/hooks/api/useP2PTransfers';

interface DocumentDetailPageProps {}

export const DocumentDetailPage: Component<DocumentDetailPageProps> = () => {
  const { enabled, busy, enable, seedFile, downloadByHash, error, lastOp } = useP2PTransfers();
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
  const [comments, setComments] = createSignal<Awaited<ReturnType<typeof commentService.list>>>([]);
  const [newComment, setNewComment] = createSignal('');
  const [peers, setPeers] = createSignal<any[]>([]);
  const [selectedPeerIds, setSelectedPeerIds] = createSignal<string[]>([]);
  const toast = useToast();
  const { t } = useTranslation();
  const tf = t as unknown as (key: string) => string;

  // Data fetching
  const document = createAsync(async () => {
    if (!params.id) return null;
    try {
      const response = await documentApi.getDocument(params.id);
      if (!response.success || !response.document) return null;
      // Fire-and-forget increment view
      documentApi.incrementViewCount(params.id);
      // Merge stats if available
      try {
        const stats = await documentApi.getDocumentStats(params.id);
        return { ...response.document, ...stats } as any;
      } catch {
        return response.document;
      }
    } catch {
      // ignore
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
    } catch {
      // ignore
      return null;
    }
  });

  // Computed values
  const documentTitle = createMemo(() => document()?.title || 'Loading...');
  const totalPages = createMemo(() => 1); // Default to 1 page for now
  const culturalLevel = createMemo(() => document()?.culturalMetadata?.sensitivityLevel || 0);
  const hasEducationalContent = createMemo(() => {
    const ctx = culturalContext();
    const resources = (ctx as any)?.educationalResources || (ctx as any)?.educationalContent?.learningResources;
    return Array.isArray(resources) && resources.length > 0;
  });

  // Effects
  createEffect(() => {
    const doc = document();
    if (doc) {
      // Load initial comments
      commentService
        .list(doc.id)
        .then(list => setComments(list))
        .catch(() => setComments([]));
    }
  });

  createEffect(() => {
    if (showShareModal()) {
      p2pNetworkService
        .getConnectedPeers()
        .then(list => setPeers(list || []))
        .catch(() => setPeers([]));
    }
  });

  // Reload comments when switching to community tab
  createEffect(() => {
    if (viewMode() === 'community') {
      const doc = document();
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
    const doc = document();
    if (!doc) return;
    const { favoriteService } = await import('@/services');
    const res = await favoriteService.toggleFavorite(doc.id);
    setIsBookmarked(res.isFavorite);
    toast.success(res.isFavorite ? tf('pages.documentDetail.toasts.addedToFavorites') : tf('pages.documentDetail.toasts.removedFromFavorites'));
  };

  const handleShare = async () => {
    const doc = document();
    if (!doc) return;
    // Default to link sharing for now; P2P share can be added with peer selection UI
    const link = await shareService.createShareLink(doc.id);
    if (link?.url) {
      await window.navigator.clipboard.writeText(link.url);
      toast.success(tf('pages.documentDetail.toasts.shareLinkCopied'));
    }
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
    } catch {
      // ignore
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
        <ErrorMessage message="Failed to load document details" description={err.message} onRetry={() => window.location.reload()} />
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
                class={styles.backButton || ''}
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
                onClick={() => { const doc = document(); if (doc) seedFile((doc as any).path || (doc as any).filePath); }}
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
                <Card title="Document Information" class={styles.metadataCard || ''}>
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

                <Card title="Tags" class={styles.tagsCard || ''}>
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
                <CulturalContext contextInfo={culturalContext() as any} showEducationalResources={true} showCommunityInfo={true} />
              </Show>

              <Show when={viewMode() === 'community'}>
                <Card title="Community Activity" class={styles.communityCard || ''}>
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
                        const doc = document();
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
                            <span class={styles.time}>{new Date(c.createdAt).toLocaleString()}</span>
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
                <Show when={document()} fallback={<Loading />}> 
                  {doc => (
                    <DocumentViewer
                      documentType={(doc() as any).fileType?.toLowerCase?.() || 'pdf'}
                      title={(doc() as any).title}
                      currentPage={currentPage()}
                      zoomLevel={zoomLevel()}
                      searchTerm={searchTerm()}
                      onPageChange={setCurrentPage}
                      culturalContext={culturalContext() as any}
                    />
                  )}
                </Show>
              </div>
            </Show>

            {/* Other view modes content */}
            <Show when={viewMode() !== 'reader'}>
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
                        const doc = document();
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
                            <span class={styles.time}>{new Date(c.createdAt).toLocaleString()}</span>
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
                                      comments().map(x => ((x as any).id === (c as any).id ? { ...(x as any), text } : x))
                                    );
                                    toast.success(tf('pages.documentDetail.toasts.commentUpdated'));
                                  } else {
                                    toast.error(tf('pages.documentDetail.toasts.commentUpdateFailed'));
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
                                    setComments(comments().filter(x => (x as any).id !== (c as any).id));
                                    toast.success(tf('pages.documentDetail.toasts.commentDeleted'));
                                  } else {
                                    toast.error(tf('pages.documentDetail.toasts.commentDeleteFailed'));
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
              <CulturalContext contextInfo={context() as any} showEducationalResources={true} showCommunityInfo={true} />
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
              <input type="text" placeholder="Paste hash to download" class={styles.searchInput}
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
            <Button variant="outline" onClick={() => handleShare()} class={styles.shareButton || ''}>
              <Users size={16} />
              Share via P2P Network
            </Button>
            <Button variant="outline" onClick={() => handleShare()} class={styles.shareButton || ''}>
              <Share2 size={16} />
              Copy Share Link
            </Button>
            <Button variant="outline" onClick={() => handleShare()} class={styles.shareButton || ''}>
              <Download size={16} />
              Export with Metadata
            </Button>
            <div class={styles.peerList}>
              <h4>Connected Peers</h4>
              <For each={peers()}>
                {p => (
                  <label class={styles.peerItem}>
                    <input
                      type="checkbox"
                      checked={selectedPeerIds().includes((p as any).id)}
                      onChange={e => {
                        const id = (p as any).id;
                        setSelectedPeerIds(
                          e.currentTarget.checked
                            ? [...selectedPeerIds(), id]
                            : selectedPeerIds().filter(x => x !== id)
                        );
                      }}
                    />
                    <span>{(p as any).name || (p as any).id}</span>
                  </label>
                )}
              </For>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  const doc = document();
                  if (!doc) return;
                  const ok = await shareService.shareViaP2P(doc.id, selectedPeerIds());
                  if (ok) {
                    toast.success(tf('pages.documentDetail.toasts.sharedToPeers'));
                  } else {
                    toast.error(tf('pages.documentDetail.toasts.shareToPeersFailed'));
                  }
                }}
              >
                Share to selected peers
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default DocumentDetailPage;
