import { type Component, For, Show } from 'solid-js';
import {
  Activity,
  Download,
  Upload,
  Plus,
  Trash2,
  FolderOpen,
  ExternalLink,
  RotateCcw,
} from 'lucide-solid';
import { A } from '@solidjs/router';
import { Card } from '@/components/foundation/Card';
import { Badge } from '@/components/foundation/Badge';
import { Button } from '@/components/foundation/Button';
import { useTransferState } from '@/hooks/api/useTransferState';
import { openFilePath, showFileInFolder } from '@/utils/fileActions';
import type { TransferView } from '@/services/network/transferFacade';
import styles from './TransferQueuePanel.module.css';

export interface TransferQueuePanelProps {
  variant?: 'full' | 'compact' | 'embedded';
  showOutbound?: boolean;
  showDownloads?: boolean;
  showCompleted?: boolean;
  onAddShare?: () => void;
  class?: string;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function linkKindLabel(link?: string): string {
  if (!link) return '—';
  if (link.startsWith('opocswarm://')) return 'Swarm';
  return 'Direct';
}

function statusLabel(row: TransferView): string {
  switch (row.status) {
    case 'queued':
      return 'Queued';
    case 'resolving':
      return 'Connecting…';
    case 'active':
      return 'Downloading';
    case 'failed':
      return 'Failed';
    case 'completed':
      return 'Completed';
    default:
      return row.status;
  }
}

function statusVariant(row: TransferView): 'success' | 'secondary' | 'outline' {
  if (row.status === 'failed') return 'secondary';
  if (row.status === 'queued' || row.status === 'resolving') return 'outline';
  return 'success';
}

export const TransferQueuePanel: Component<TransferQueuePanelProps> = props => {
  const transfer = useTransferState();
  const variant = () => props.variant ?? 'full';
  const showCompleted = () => props.showCompleted ?? variant() === 'full';
  const showDownloads = () => props.showDownloads !== false;
  const showOutbound = () => props.showOutbound === true && variant() === 'full';

  const activeList = () =>
    variant() === 'compact' ? transfer.activeDownloads().slice(0, 5) : transfer.activeDownloads();

  const completedList = () =>
    variant() === 'compact'
      ? transfer.completedDownloads().slice(0, 5)
      : transfer.completedDownloads();

  const handleRetry = (row: TransferView) => {
    const input = row.sourceInput || row.link || row.name;
    void transfer.retryDownload(input, row.name);
  };

  return (
    <section
      class={`${styles.panel} ${styles[variant()]} ${props.class ?? ''}`}
      aria-label="Transfer queue"
    >
      <Show when={variant() !== 'embedded'}>
        <div class={styles.summaryRow}>
          <Show when={showOutbound()}>
            <Card class={styles.summaryCard}>
              <span class={styles.summaryLabel}>Shared</span>
              <strong class={styles.summaryValue}>{transfer.shares().length}</strong>
            </Card>
          </Show>
          <Card class={styles.summaryCard}>
            <span class={styles.summaryLabel}>Active</span>
            <strong class={styles.summaryValue}>{transfer.activeCount()}</strong>
          </Card>
          <Card class={styles.summaryCard}>
            <span class={styles.summaryLabel}>Completed</span>
            <strong class={styles.summaryValue}>{transfer.completedDownloads().length}</strong>
          </Card>
        </div>
      </Show>

      <div class={styles.tablesBlock}>
        <Show when={showOutbound()}>
          <Card class={styles.tableCard}>
            <div class={styles.panelHead}>
              <Upload size={18} aria-hidden />
              <h3 class={styles.panelTitle}>Shared files</h3>
            </div>
            <div class={styles.tableScroll}>
              <table class={styles.table}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Size</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <Show
                    when={transfer.shares().length > 0}
                    fallback={
                      <tr>
                        <td colspan="4" class={styles.emptyCell}>
                          No shared files.
                          <Show when={props.onAddShare}>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => props.onAddShare?.()}
                            >
                              <Plus size={14} /> Add files
                            </Button>
                          </Show>
                        </td>
                      </tr>
                    }
                  >
                    <For each={transfer.shares()}>
                      {row => (
                        <tr>
                          <td>
                            <div class={styles.cellTitle}>{row.name}</div>
                          </td>
                          <td>{formatBytes(row.size)}</td>
                          <td>
                            <Badge variant="success">seeding</Badge>
                          </td>
                          <td>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void transfer.removeShare(row.fileId)}
                            >
                              <Trash2 size={11} /> Remove
                            </Button>
                          </td>
                        </tr>
                      )}
                    </For>
                  </Show>
                </tbody>
              </table>
            </div>
          </Card>
        </Show>

        <Show when={showDownloads()}>
          <Card class={styles.tableCard}>
            <div class={styles.panelHead}>
              <Download size={18} aria-hidden />
              <h3 class={styles.panelTitle}>Downloads</h3>
            </div>
            <div class={styles.tableScroll}>
              <table class={styles.table}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Kind</th>
                    <th>Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <Show
                    when={activeList().length > 0}
                    fallback={
                      <tr>
                        <td colspan="4" class={styles.emptyCell}>
                          No downloads in queue.
                          <A href="/search-network" class={styles.emptyLink}>
                            Search network
                          </A>
                        </td>
                      </tr>
                    }
                  >
                    <For each={activeList()}>
                      {row => (
                        <tr>
                          <td>
                            <div class={styles.cellTitle}>{row.name}</div>
                          </td>
                          <td>
                            <Badge variant="outline">{linkKindLabel(row.link)}</Badge>
                          </td>
                          <td>
                            <div class={styles.barCell}>
                              <div
                                class={styles.barFill}
                                style={{ width: `${Math.round(row.progress * 100)}%` }}
                              />
                            </div>
                            <span class={styles.barLabel}>{Math.round(row.progress * 100)}%</span>
                          </td>
                          <td>
                            <Badge variant={statusVariant(row)}>{statusLabel(row)}</Badge>
                          </td>
                        </tr>
                      )}
                    </For>
                  </Show>
                </tbody>
              </table>
            </div>
          </Card>
        </Show>

        <Show when={showCompleted()}>
          <Card class={styles.tableCard}>
            <div class={styles.panelHead}>
              <Activity size={18} aria-hidden />
              <h3 class={styles.panelTitle}>Recently completed</h3>
            </div>
            <div class={styles.tableScroll}>
              <table class={styles.table}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Result</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <Show
                    when={completedList().length > 0}
                    fallback={
                      <tr>
                        <td colspan="3" class={styles.emptyCell}>
                          No completed downloads yet.
                        </td>
                      </tr>
                    }
                  >
                    <For each={completedList()}>
                      {row => (
                        <tr>
                          <td>
                            <div class={styles.cellTitle}>{row.name}</div>
                          </td>
                          <td class={styles.mutedTd}>
                            <Show
                              when={row.status === 'completed'}
                              fallback={
                                <span title={row.error || undefined}>
                                  Failed{row.error ? `: ${row.error}` : ''}
                                </span>
                              }
                            >
                              Completed
                            </Show>
                          </td>
                          <td>
                            <div class={styles.rowActions}>
                              <Show when={row.status === 'completed' && row.localPath}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void openFilePath(row.localPath!)}
                                >
                                  <ExternalLink size={11} /> Open
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void showFileInFolder(row.localPath!)}
                                >
                                  <FolderOpen size={11} /> Folder
                                </Button>
                              </Show>
                              <Show when={row.status === 'failed'}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRetry(row)}
                                >
                                  <RotateCcw size={11} /> Retry
                                </Button>
                              </Show>
                            </div>
                          </td>
                        </tr>
                      )}
                    </For>
                  </Show>
                </tbody>
              </table>
            </div>
          </Card>
        </Show>
      </div>
    </section>
  );
};

export default TransferQueuePanel;
