import { type Component, Show, createSignal } from 'solid-js';
import { BookOpen, Download, ExternalLink, FileText } from 'lucide-solid';
import { Button } from '@/components/foundation/Button';
import { Badge } from '@/components/foundation/Badge';
import { transferFacade } from '@/services/network/transferFacade';
import type { TransferView } from '@/services/network/transferFacade';
import styles from './NetworkFileCard.module.css';

export interface NetworkFileCardProps {
  contentHash: string;
  name: string;
  size?: number;
  link?: string;
  peerCount?: number;
  canDownload?: boolean;
  downloadProgress?: number;
  downloadStatus?: TransferView['status'];
  downloadError?: string;
  onOpen?: () => void;
  onDownload?: () => Promise<void>;
  onDownloadError?: (message: string) => void;
  class?: string;
}

function formatBytes(bytes?: number): string {
  if (bytes == null || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function hashSnippet(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function fileTypeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  return ext || 'file';
}

export const NetworkFileCard: Component<NetworkFileCardProps> = props => {
  const [submitting, setSubmitting] = createSignal(false);
  const [statusMessage, setStatusMessage] = createSignal<string | null>(null);

  const inQueue = () =>
    props.downloadStatus === 'queued' ||
    props.downloadStatus === 'resolving' ||
    props.downloadStatus === 'active';

  const isFailed = () => props.downloadStatus === 'failed';
  const isCompleted = () => props.downloadStatus === 'completed';

  const peersAvailable = () => (props.peerCount ?? 1) > 0;
  const canDownloadNow = () =>
    props.canDownload !== false && peersAvailable() && !inQueue() && !isFailed() && !isCompleted();

  const handleDownload = async () => {
    if (!canDownloadNow() && !submitting()) return;
    setStatusMessage(null);
    setSubmitting(true);
    try {
      if (props.onDownload) {
        await props.onDownload();
        setStatusMessage('Added to downloads');
        return;
      }
      const { id } = await transferFacade.beginDownload(props.contentHash, props.name);
      void transferFacade.runDownload(id);
      setStatusMessage('Added to downloads');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatusMessage(msg);
      props.onDownloadError?.(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const FileIcon = () => {
    const type = fileTypeFromName(props.name);
    if (type === 'epub') return <BookOpen size={20} />;
    return <FileText size={20} />;
  };

  const progressPct = () => {
    const p = props.downloadProgress;
    if (p == null || !inQueue()) return null;
    return Math.round(Math.min(1, Math.max(0, p)) * 100);
  };

  const buttonLabel = () => {
    if (submitting()) return 'Adding…';
    if (isFailed()) return 'Retry';
    if (isCompleted()) return 'Downloaded';
    if (props.downloadStatus === 'queued' || props.downloadStatus === 'resolving')
      return 'In queue';
    if (props.downloadStatus === 'active') {
      const pct = progressPct();
      return pct != null && pct > 0 ? `${pct}%` : 'Downloading…';
    }
    return 'Download';
  };

  return (
    <article class={`${styles.card} ${props.class ?? ''}`} data-testid="network-file-card">
      <div class={styles.header}>
        <div class={styles.fileInfo}>
          <div class={styles.fileIcon}>
            <FileIcon />
          </div>
          <div>
            <h3 class={styles.title}>{props.name}</h3>
            <div class={styles.meta}>
              <span>{formatBytes(props.size)}</span>
              <Badge variant="secondary">{fileTypeFromName(props.name).toUpperCase()}</Badge>
              <Show when={(props.peerCount ?? 0) > 0}>
                <Badge variant="outline">{props.peerCount} peer(s)</Badge>
              </Show>
              <Show when={props.peerCount === 0}>
                <Badge variant="secondary">No peers online</Badge>
              </Show>
            </div>
            <Show when={props.contentHash}>
              <div class={styles.hash} title={props.contentHash}>
                {hashSnippet(props.contentHash)}
              </div>
            </Show>
            <Show when={statusMessage() || props.downloadError}>
              <p class={styles.statusMessage} role="status">
                {statusMessage() || props.downloadError}
              </p>
            </Show>
            <Show when={inQueue() || (props.downloadStatus === 'active' && !isFailed())}>
              <div class={styles.progressWrap}>
                <div class={styles.progressBar}>
                  <div class={styles.progressFill} style={{ width: `${progressPct() ?? 0}%` }} />
                </div>
                <span class={styles.progressLabel}>
                  {props.downloadStatus === 'queued' || props.downloadStatus === 'resolving'
                    ? 'Queued'
                    : `${progressPct() ?? 0}%`}
                </span>
              </div>
            </Show>
          </div>
        </div>
      </div>
      <div class={styles.actions}>
        <Show when={props.onOpen}>
          <Button variant="outline" size="sm" onClick={() => props.onOpen?.()}>
            <ExternalLink size={14} />
            &nbsp;Open
          </Button>
        </Show>
        <Button
          variant="primary"
          size="sm"
          disabled={!canDownloadNow() && !isFailed()}
          loading={submitting()}
          onClick={() => void handleDownload()}
          aria-label={`Download ${props.name}`}
        >
          <Download size={14} />
          &nbsp;{buttonLabel()}
        </Button>
      </div>
    </article>
  );
};
