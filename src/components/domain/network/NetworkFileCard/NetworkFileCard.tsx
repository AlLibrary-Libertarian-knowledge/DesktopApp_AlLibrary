import { type Component, Show, createSignal } from 'solid-js';
import { BookOpen, Download, ExternalLink, FileText } from 'lucide-solid';
import { Button } from '@/components/foundation/Button';
import { Badge } from '@/components/foundation/Badge';
import { transferFacade } from '@/services/network/transferFacade';
import styles from './NetworkFileCard.module.css';

export interface NetworkFileCardProps {
  contentHash: string;
  name: string;
  size?: number;
  link?: string;
  peerCount?: number;
  canDownload?: boolean;
  downloadProgress?: number;
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
  const [downloading, setDownloading] = createSignal(false);
  const [statusMessage, setStatusMessage] = createSignal<string | null>(null);

  const peersAvailable = () => (props.peerCount ?? 1) > 0;
  const canDownloadNow = () => props.canDownload !== false && peersAvailable() && !downloading();

  const handleDownload = async () => {
    if (!canDownloadNow() && !downloading()) return;
    setStatusMessage(null);
    setDownloading(true);
    try {
      if (props.onDownload) {
        await props.onDownload();
        setStatusMessage('Download started');
        return;
      }
      await transferFacade.downloadByHashOrLink(props.contentHash, props.name);
      setStatusMessage('Download started');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatusMessage(msg);
      props.onDownloadError?.(msg);
    } finally {
      setDownloading(false);
    }
  };

  const FileIcon = () => {
    const type = fileTypeFromName(props.name);
    if (type === 'epub') return <BookOpen size={20} />;
    return <FileText size={20} />;
  };

  const progressPct = () => {
    const p = props.downloadProgress;
    if (p == null) return null;
    return Math.round(Math.min(1, Math.max(0, p)) * 100);
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
            <Show when={statusMessage()}>
              <p class={styles.statusMessage} role="status">
                {statusMessage()}
              </p>
            </Show>
            <Show when={progressPct() != null}>
              <div class={styles.progressWrap}>
                <div class={styles.progressBar}>
                  <div class={styles.progressFill} style={{ width: `${progressPct()}%` }} />
                </div>
                <span class={styles.progressLabel}>{progressPct()}%</span>
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
          disabled={!canDownloadNow()}
          loading={downloading()}
          onClick={() => void handleDownload()}
          aria-label={`Download ${props.name}`}
        >
          <Download size={14} />
          &nbsp;{downloading() ? 'Starting…' : 'Download'}
        </Button>
      </div>
    </article>
  );
};
