import { type Component, For, Show } from 'solid-js';
import { Activity, Download, Upload, Plus, Trash2 } from 'lucide-solid';
import { Card } from '@/components/foundation/Card';
import { Badge } from '@/components/foundation/Badge';
import { Button } from '@/components/foundation/Button';
import { useTransferState } from '@/hooks/api/useTransferState';
import styles from './TransferQueuePanel.module.css';

export interface TransferQueuePanelProps {
  variant?: 'full' | 'compact' | 'embedded';
  showOutbound?: boolean;
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

export const TransferQueuePanel: Component<TransferQueuePanelProps> = props => {
  const transfer = useTransferState();
  const variant = () => props.variant ?? 'full';
  const showCompleted = () => variant() === 'full';
  const showOutbound = () => props.showOutbound !== false && variant() === 'full';

  const activeList = () =>
    variant() === 'compact' ? transfer.activeDownloads().slice(0, 5) : transfer.activeDownloads();

  const completedList = () =>
    variant() === 'compact'
      ? transfer.completedDownloads().slice(0, 3)
      : transfer.completedDownloads();

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
              <h3 class={styles.panelTitle}>Outbound</h3>
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
                          <td>
                            <Badge variant="outline">{linkKindLabel(row.link)}</Badge>
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

        <Card class={styles.tableCard}>
          <div class={styles.panelHead}>
            <Download size={18} aria-hidden />
            <h3 class={styles.panelTitle}>Inbound downloads</h3>
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
                        No active downloads. Start one from Search Network or paste a link on
                        Sharing &amp; downloads.
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
                          <div class={styles.barCell}>
                            <div
                              class={styles.barFill}
                              style={{ width: `${Math.round(row.progress * 100)}%` }}
                            />
                          </div>
                          <span class={styles.barLabel}>{Math.round(row.progress * 100)}%</span>
                        </td>
                        <td>
                          <Badge variant="success">{row.status}</Badge>
                        </td>
                      </tr>
                    )}
                  </For>
                </Show>
              </tbody>
            </table>
          </div>
        </Card>

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
                  </tr>
                </thead>
                <tbody>
                  <Show
                    when={completedList().length > 0}
                    fallback={
                      <tr>
                        <td colspan="2" class={styles.emptyCell}>
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
                              fallback={`Failed (${row.error || 'unknown'})`}
                            >
                              Completed
                              <Show when={row.localPath}>
                                <span class={styles.localPath} title={row.localPath}>
                                  {' '}
                                  · {row.localPath}
                                </span>
                              </Show>
                            </Show>
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
