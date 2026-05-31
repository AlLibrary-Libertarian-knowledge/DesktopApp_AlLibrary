import { type Component, Show } from 'solid-js';
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
  const canDownload = () => props.canDownload !== false;

  const handleDownload = async () => {
    if (!canDownload()) return;
    try {
      if (props.onDownload) {
        await props.onDownload();
        return;
      }
      const link = props.link?.trim() || '';
      if (link) {
        await transferFacade.downloadLink(link, props.name);
      } else {
        await transferFacade.downloadByHashOrLink(props.contentHash, props.name);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      props.onDownloadError?.(msg);
    }
  };

  const FileIcon = () => {
    const type = fileTypeFromName(props.name);
    if (type === 'epub') return <BookOpen size={20} />;
    return <FileText size={20} />;
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
            </div>
            <Show when={props.contentHash}>
              <div class={styles.hash} title={props.contentHash}>
                {hashSnippet(props.contentHash)}
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
          disabled={!canDownload()}
          onClick={() => void handleDownload()}
          aria-label={`Download ${props.name}`}
        >
          <Download size={14} />
          &nbsp;Download
        </Button>
      </div>
    </article>
  );
};
