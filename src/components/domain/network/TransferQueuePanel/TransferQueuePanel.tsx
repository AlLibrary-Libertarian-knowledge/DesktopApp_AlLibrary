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
  Search,
  Inbox,
} from 'lucide-solid';
import { A } from '@solidjs/router';
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
  /** Hide the Active/Completed summary cards (e.g. when embedded next to other stats). */
  hideSummary?: boolean;
  /** Hide the "Search network" link in the empty queue state (e.g. on the search page itself). */
  hideEmptySearchLink?: boolean;
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
      <Show when={variant() !== 'embedded' && !props.hideSummary}>
        <div class={styles.summaryRow}>
          <Show when={showOutbound()}>
            <div class={`${styles.summaryCard} ${styles.summaryShared}`}>
              <span class={styles.summaryLabel}>Shared</span>
              <strong class={styles.summaryValue}>{transfer.shares().length}</strong>
            </div>
          </Show>
          <div class={`${styles.summaryCard} ${styles.summaryActive}`}>
            <span class={styles.summaryLabel}>Active</span>
            <strong class={styles.summaryValue}>{transfer.activeCount()}</strong>
          </div>
          <div class={`${styles.summaryCard} ${styles.summaryCompleted}`}>
            <span class={styles.summaryLabel}>Completed</span>
            <strong class={styles.summaryValue}>{transfer.completedDownloads().length}</strong>
          </div>
        </div>
      </Show>

      <div class={styles.tablesBlock}>
        <Show when={showOutbound()}>
          <article class={styles.tableCard}>
            <div class={styles.panelHead}>
              <Upload size={16} aria-hidden="true" />
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
                          <div class={styles.emptyState}>
                            <div class={styles.emptyIcon} aria-hidden="true">
                              <Inbox size={18} />
                            </div>
                            <p class={styles.emptyTitle}>No shared files</p>
                            <p class={styles.emptyHint}>Add files to seed them on the network.</p>
                            <Show when={props.onAddShare}>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => props.onAddShare?.()}
                              >
                                <Plus size={14} /> Add files
                              </Button>
                            </Show>
                          </div>
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
          </article>
        </Show>

        <Show when={showDownloads()}>
          <article class={styles.tableCard}>
            <div class={styles.panelHead}>
              <Download size={16} aria-hidden="true" />
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
                          <div class={styles.emptyState}>
                            <div class={styles.emptyIcon} aria-hidden="true">
                              <Download size={18} />
                            </div>
                            <p class={styles.emptyTitle}>No downloads in queue</p>
                            <p class={styles.emptyHint}>
                              Find documents on the network and start a transfer.
                            </p>
                            <Show when={!props.hideEmptySearchLink}>
                              <A href="/search-network" class={styles.emptyLink}>
                                <Search size={13} aria-hidden="true" />
                                Search network
                              </A>
                            </Show>
                          </div>
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
          </article>
        </Show>

        <Show when={showCompleted()}>
          <article class={styles.tableCard}>
            <div class={styles.panelHead}>
              <Activity size={16} aria-hidden="true" />
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
                          <div class={styles.emptyState}>
                            <div class={styles.emptyIcon} aria-hidden="true">
                              <Activity size={18} />
                            </div>
                            <p class={styles.emptyTitle}>No completed downloads yet</p>
                            <p class={styles.emptyHint}>Finished transfers will show up here.</p>
                          </div>
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
          </article>
        </Show>
      </div>
    </section>
  );
};

export default TransferQueuePanel;
