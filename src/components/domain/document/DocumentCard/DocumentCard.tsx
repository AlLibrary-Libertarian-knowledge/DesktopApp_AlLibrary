import { Component, Show } from 'solid-js';
import {
  FileText,
  BookOpen,
  Download,
  Share2,
  Heart,
  Eye,
  Calendar,
  User,
  Globe,
  Lock,
  Unlock,
  Star,
  MoreHorizontal,
} from 'lucide-solid';
import { Button } from '../../../foundation/Button';
import { Badge } from '../../../foundation/Badge';
import { CulturalIndicator } from '../../../cultural/CulturalIndicator';
import type { Document } from '../../../../types/core';
import styles from './DocumentCard.module.css';

export interface DocumentCardProps {
  document: Document;
  variant?: 'default' | 'compact' | 'detailed' | 'grid';
  showCulturalContext?: boolean;
  showActions?: boolean;
  showMetadata?: boolean;
  onOpen?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onShare?: (document: Document) => void;
  onFavorite?: (document: Document) => void;
  onMore?: (document: Document) => void;
  class?: string;
}

/**
 * DocumentCard Component
 *
 * Displays document information with cultural context and interactive actions.
 * Supports multiple variants for different use cases across the application.
 */
export const DocumentCard: Component<DocumentCardProps> = props => {
  const document = () => props.document;
  const variant = () => props.variant || 'default';

  const getFileIcon = () => {
    switch (document().type?.toLowerCase()) {
      case 'pdf':
        return <FileText size={20} />;
      case 'epub':
        return <BookOpen size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleOpen = (e: Event) => {
    e.stopPropagation();
    props.onOpen?.(document());
  };

  const handleDownload = (e: Event) => {
    e.stopPropagation();
    props.onDownload?.(document());
  };

  const handleShare = (e: Event) => {
    e.stopPropagation();
    props.onShare?.(document());
  };

  const handleFavorite = (e: Event) => {
    e.stopPropagation();
    props.onFavorite?.(document());
  };

  const handleMore = (e: Event) => {
    e.stopPropagation();
    props.onMore?.(document());
  };

  return (
    <div
      class={`${styles.documentCard} ${styles[variant()]} ${props.class || ''}`}
      onClick={handleOpen}
      role="button"
      tabindex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen(e);
        }
      }}
      aria-label={`Document: ${document().title}`}
    >
      {/* Document Header */}
      <div class={styles.header}>
        <div class={styles.fileInfo}>
          <div class={styles.fileIcon}>{getFileIcon()}</div>
          <div class={styles.fileDetails}>
            <h3 class={styles.title} title={document().title}>
              {document().title}
            </h3>
            <Show when={props.showMetadata !== false}>
              <div class={styles.metadata}>
                <span class={styles.fileType}>{document().type?.toUpperCase()}</span>
                <Show when={document().size}>
                  <span class={styles.fileSize}>{formatFileSize(document().size!)}</span>
                </Show>
                <Show when={document().pages}>
                  <span class={styles.pages}>{document().pages} pages</span>
                </Show>
              </div>
            </Show>
          </div>
        </div>

        <Show when={props.showActions !== false}>
          <div class={styles.headerActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              aria-label="Add to favorites"
              class={styles.actionButton}
            >
              <Heart size={16} class={document().isFavorite ? styles.favorited : ''} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMore}
              aria-label="More options"
              class={styles.actionButton}
            >
              <MoreHorizontal size={16} />
            </Button>
          </div>
        </Show>
      </div>

      {/* Document Content */}
      <Show when={variant() === 'detailed' && document().description}>
        <div class={styles.description}>
          <p>{document().description}</p>
        </div>
      </Show>

      {/* Cultural Context */}
      <Show when={props.showCulturalContext !== false && document().culturalMetadata}>
        <div class={styles.culturalContext}>
          <CulturalIndicator
            level={document().culturalMetadata?.sensitivityLevel || 1}
            size="sm"
            informationOnly={true}
            class={styles.culturalIndicator}
          />
          <Show when={document().culturalMetadata?.origin}>
            <Badge variant="outline" size="sm" class={styles.culturalBadge}>
              {document().culturalMetadata?.origin}
            </Badge>
          </Show>
        </div>
      </Show>

      {/* Document Stats */}
      <Show when={variant() !== 'compact'}>
        <div class={styles.stats}>
          <div class={styles.statItem}>
            <Eye size={14} />
            <span>{document().views || 0}</span>
          </div>
          <div class={styles.statItem}>
            <Download size={14} />
            <span>{document().downloads || 0}</span>
          </div>
          <div class={styles.statItem}>
            <Star size={14} />
            <span>{document().rating ? document().rating.toFixed(1) : '0.0'}</span>
          </div>
          <Show when={document().addedDate}>
            <div class={styles.statItem}>
              <Calendar size={14} />
              <span>{formatDate(document().addedDate!)}</span>
            </div>
          </Show>
        </div>
      </Show>

      {/* Document Footer */}
      <Show when={variant() === 'detailed'}>
        <div class={styles.footer}>
          <div class={styles.authorInfo}>
            <Show when={document().author}>
              <div class={styles.author}>
                <User size={14} />
                <span>{document().author}</span>
              </div>
            </Show>
            <Show when={document().source}>
              <div class={styles.source}>
                <Globe size={14} />
                <span>{document().source}</span>
              </div>
            </Show>
          </div>

          <div class={styles.accessInfo}>
            <Show when={document().isPublic !== undefined}>
              <div class={styles.access}>
                {document().isPublic ? <Unlock size={14} /> : <Lock size={14} />}
                <span>{document().isPublic ? 'Public' : 'Private'}</span>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* Action Buttons */}
      <Show when={props.showActions !== false && variant() !== 'compact'}>
        <div class={styles.actions}>
          <Button variant="primary" size="sm" onClick={handleOpen} class={styles.primaryAction}>
            <Eye size={16} />
            Open
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            class={styles.secondaryAction}
          >
            <Download size={16} />
            Download
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare} class={styles.secondaryAction}>
            <Share2 size={16} />
            Share
          </Button>
        </div>
      </Show>

      {/* Loading State Overlay */}
      <Show when={document().isLoading}>
        <div class={styles.loadingOverlay}>
          <div class={styles.loadingSpinner} />
        </div>
      </Show>
    </div>
  );
};

export default DocumentCard;
