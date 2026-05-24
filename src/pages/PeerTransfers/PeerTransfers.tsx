/**
 * PeerTransfers — production sharing & downloads (no POC debug panel).
 */

import type { Component } from 'solid-js';
import { For, Show, createSignal } from 'solid-js';
import Button from '@/components/foundation/Button/Button';
import { pickAnyFiles } from '@/services/system/fileDialogs';
import { Card } from '@/components/foundation/Card';
import { Badge } from '@/components/foundation/Badge';
import { Input } from '@/components/foundation/Input';
import { Upload, Download, Activity, Plus, Trash2, Link2 } from 'lucide-solid';
import { useTransferState } from '@/hooks/api/useTransferState';
import styles from './PeerTransfers.module.css';

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

const PeerTransfers: Component = () => {
  const transfer = useTransferState();
  const [showDownloadModal, setShowDownloadModal] = createSignal(false);
  const [fetchLink, setFetchLink] = createSignal('');
  const [fetchName, setFetchName] = createSignal('');
  const [fetchSuccess, setFetchSuccess] = createSignal('');

  const persistAndAddShares = async (paths: string[]) => {
    for (const file of paths) {
      try {
        await transfer.addShare(file);
      } catch (e: unknown) {
        console.error('Failed to share file:', file, e);
      }
    }
  };

  const handleAddFiles = async () => {
    setFetchSuccess('');
    try {
      const picked = await pickAnyFiles();
      if (picked?.length) await persistAndAddShares(picked);
    } catch {
      /* picker cancelled */
    }
  };

  const handleDownloadFromLink = async () => {
    setFetchSuccess('');
    const link = fetchLink().trim();
    if (!link) return;
    const name = fetchName().trim() || link.split('/').pop() || 'download';
    try {
      await transfer.downloadLink(link, name);
      setFetchSuccess('Download started — see Inbound table for progress.');
      setFetchLink('');
      setFetchName('');
      setShowDownloadModal(false);
    } catch {
      /* error surfaced via transfer.error */
    }
  };

  const activeOut = () => transfer.shares().length;
  const activeIn = () => transfer.activeDownloads().length;

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <div class={styles.headerRow}>
          <h1 class={styles.title}>Sharing & downloads</h1>
          <Badge variant="secondary" class={styles.kickerBadge}>
            Transfers
          </Badge>
        </div>
        <p class={styles.description}>
          Manage files you share on the Tor network and track inbound downloads. Onion sharing
          starts automatically after app bootstrap; use Start / Stop here only if you need to
          restart the service.
        </p>
      </header>

      <Card class={styles.statusBar}>
        <div class={styles.statusRow}>
          <div class={styles.statusInfo}>
            <strong>Onion share:</strong>{' '}
            <Badge variant={transfer.onionRunning() ? 'success' : 'secondary'}>
              {transfer.onionRunning() ? (transfer.onionAddress() ?? 'starting…') : 'stopped'}
            </Badge>
          </div>
          <div class={styles.statusActions}>
            <Button
              variant="primary"
              size="sm"
              disabled={transfer.busy() || transfer.onionRunning()}
              loading={transfer.busy()}
              onClick={() => void transfer.startOnionShare()}
            >
              Start
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={transfer.busy() || !transfer.onionRunning()}
              onClick={() => void transfer.stopOnionShare()}
            >
              Stop
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!transfer.onionRunning()}
              onClick={handleAddFiles}
            >
              <Plus size={14} /> Add files
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!transfer.onionRunning()}
              onClick={() => {
                setFetchSuccess('');
                setShowDownloadModal(true);
              }}
            >
              <Link2 size={14} /> Download from link
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void transfer.refreshAll()}>
              Refresh
            </Button>
          </div>
        </div>
        <Show when={transfer.error()}>
          <p class={styles.onionError} role="alert">
            {transfer.error()}
          </p>
        </Show>
        <Show when={fetchSuccess()}>
          <p class={styles.fetchSuccess}>{fetchSuccess()}</p>
        </Show>
      </Card>

      <Show when={showDownloadModal()}>
        <div
          class={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Download from network link"
          onClick={() => setShowDownloadModal(false)}
        >
          <div class={styles.modalCard} onClick={(e: MouseEvent) => e.stopPropagation()}>
            <h2 class={styles.modalTitle}>Download from network link</h2>
            <p class={styles.modalHint}>
              Paste an onion or opoc link. The file saves to your configured download folder.
            </p>
            <div class={styles.modalFields}>
              <label>
                Link
                <Input
                  value={fetchLink()}
                  onInput={v => setFetchLink(v)}
                  placeholder="http://….onion/… or opoc://…"
                />
              </label>
              <label>
                File name (optional)
                <Input
                  value={fetchName()}
                  onInput={v => setFetchName(v)}
                  placeholder="document.pdf"
                />
              </label>
            </div>
            <div class={styles.modalActions}>
              <Button variant="ghost" size="sm" onClick={() => setShowDownloadModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!fetchLink().trim() || !transfer.onionRunning()}
                onClick={() => void handleDownloadFromLink()}
              >
                Start download
              </Button>
            </div>
          </div>
        </div>
      </Show>

      <div class={styles.summaryRow}>
        <Card class={styles.summaryCard}>
          <span class={styles.summaryLabel}>Shared files</span>
          <strong class={styles.summaryValue}>{activeOut()}</strong>
        </Card>
        <Card class={styles.summaryCard}>
          <span class={styles.summaryLabel}>Active downloads</span>
          <strong class={styles.summaryValue}>{activeIn()}</strong>
        </Card>
        <Card class={styles.summaryCard}>
          <span class={styles.summaryLabel}>Completed</span>
          <strong class={styles.summaryValue}>{transfer.completedDownloads().length}</strong>
        </Card>
      </div>

      <Card class={styles.metricsPlaceholder}>
        <Activity size={18} aria-hidden />
        <p>Network throughput metrics will appear here when the backend exposes transfer stats.</p>
      </Card>

      <section class={styles.tablesBlock} aria-label="Transfer queues">
        <Card class={styles.tableCard}>
          <div class={styles.panelHead}>
            <Upload size={20} class={styles.panelIcon} aria-hidden />
            <h2 class={styles.panelTitle}>Outbound — sharing & seeding</h2>
          </div>
          <div class={styles.tableScroll}>
            <table class={styles.table}>
              <caption class={styles.srOnly}>Outbound shares</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Size</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                <Show
                  when={transfer.shares().length > 0}
                  fallback={
                    <tr>
                      <td colspan="4" class={styles.emptyCell}>
                        <p>No files shared yet.</p>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!transfer.onionRunning()}
                          onClick={handleAddFiles}
                        >
                          <Plus size={14} /> Add files to share
                        </Button>
                      </td>
                    </tr>
                  }
                >
                  <For each={transfer.shares()}>
                    {row => (
                      <tr>
                        <td>
                          <div class={styles.mono}>{row.fileId.slice(0, 8)}</div>
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
                            class={styles.stopBtn}
                            onClick={() => void transfer.removeShare(row.fileId, row.name)}
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

        <Card class={styles.tableCard}>
          <div class={styles.panelHead}>
            <Download size={20} class={styles.panelIcon} aria-hidden />
            <h2 class={styles.panelTitle}>Inbound — downloads</h2>
          </div>
          <div class={styles.tableScroll}>
            <table class={styles.table}>
              <caption class={styles.srOnly}>Downloads in progress</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <Show
                  when={transfer.activeDownloads().length > 0}
                  fallback={
                    <tr>
                      <td colspan="3" class={styles.emptyCell}>
                        No active downloads. Use &quot;Download from link&quot; or Search Network.
                      </td>
                    </tr>
                  }
                >
                  <For each={transfer.activeDownloads()}>
                    {row => (
                      <tr>
                        <td>
                          <div class={styles.mono}>{row.id}</div>
                          <div class={styles.cellTitle}>{row.name}</div>
                        </td>
                        <td>
                          <div class={styles.barCell}>
                            <div
                              class={styles.barFillAlt}
                              style={{ width: `${row.progress * 100}%` }}
                            />
                          </div>
                          <span
                            class={styles.barLabel}
                          >{`${Math.round(row.progress * 100)}%`}</span>
                        </td>
                        <td>
                          <Badge variant={row.status === 'active' ? 'success' : 'warning'}>
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    )}
                  </For>
                </Show>
              </tbody>
            </table>
          </div>
        </Card>

        <Card class={styles.tableCard}>
          <div class={styles.panelHead}>
            <Activity size={20} class={styles.panelIcon} aria-hidden />
            <h2 class={styles.panelTitle}>Recently completed</h2>
          </div>
          <div class={styles.tableScroll}>
            <table class={styles.table}>
              <caption class={styles.srOnly}>Recently finished downloads</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Direction</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                <Show
                  when={transfer.completedDownloads().length > 0}
                  fallback={
                    <tr>
                      <td colspan="3" class={styles.emptyCell}>
                        No downloads completed recently.
                      </td>
                    </tr>
                  }
                >
                  <For each={transfer.completedDownloads()}>
                    {row => (
                      <tr>
                        <td>
                          <div class={styles.mono}>{row.id}</div>
                          <div class={styles.cellTitle}>{row.name}</div>
                        </td>
                        <td>
                          <Badge variant="success">INBOUND</Badge>
                        </td>
                        <td class={styles.mutedTd}>
                          {row.status === 'completed'
                            ? 'Completed'
                            : `Failed (${row.error || 'unknown error'})`}
                        </td>
                      </tr>
                    )}
                  </For>
                </Show>
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
};

export { PeerTransfers };
export default PeerTransfers;
