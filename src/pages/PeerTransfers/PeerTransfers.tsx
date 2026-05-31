/**
 * PeerTransfers — production sharing & downloads hub.
 */

import type { Component } from 'solid-js';
import { Show, createSignal } from 'solid-js';
import Button from '@/components/foundation/Button/Button';
import { pickAnyFiles } from '@/services/system/fileDialogs';
import { Card } from '@/components/foundation/Card';
import { Badge } from '@/components/foundation/Badge';
import { OnionStatusBar } from '@/components/domain/network/OnionStatusBar';
import { TransferQueuePanel } from '@/components/domain/network/TransferQueuePanel';
import { Input } from '@/components/foundation/Input';
import { Plus, Link2 } from 'lucide-solid';
import { useTransferState } from '@/hooks/api/useTransferState';
import { useToast } from '@/hooks/ui/useToast';
import { downloadWithToast } from '@/utils/downloadActions';
import { transferFacade } from '@/services/network/transferFacade';
import styles from './PeerTransfers.module.css';

const PeerTransfers: Component = () => {
  const transfer = useTransferState();
  const toast = useToast();
  const [hubTab, setHubTab] = createSignal<'downloads' | 'sharing'>('downloads');
  const [showDownloadModal, setShowDownloadModal] = createSignal(false);
  const [fetchLink, setFetchLink] = createSignal('');
  const [fetchName, setFetchName] = createSignal('');
  const [resolveHint, setResolveHint] = createSignal('');

  const persistAndAddShares = async (paths: string[]) => {
    for (const file of paths) {
      try {
        await transfer.addShare(file);
        toast.show({
          type: 'success',
          title: 'File shared',
          message: `${file.split(/[\\/]/).pop() || file} is now seeding on the network.`,
          duration: 5000,
        });
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    }
  };

  const handleAddFiles = async () => {
    try {
      const picked = await pickAnyFiles();
      if (picked?.length) await persistAndAddShares(picked);
    } catch {
      /* picker cancelled */
    }
  };

  const previewResolve = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setResolveHint('');
      return;
    }
    try {
      const resolved = await transferFacade.resolveDownloadLinkFull(trimmed, true);
      setResolveHint(
        resolved.available
          ? `${resolved.linkKind} link · ${resolved.peerCount} peer(s) available`
          : 'No online peers found for this file'
      );
    } catch {
      setResolveHint('');
    }
  };

  const handleDownloadFromLink = async () => {
    const link = fetchLink().trim();
    if (!link) return;
    const name = fetchName().trim() || link.split('/').pop() || 'download';
    await downloadWithToast(name, () => transfer.startDownload(link, name), toast);
    setFetchLink('');
    setFetchName('');
    setResolveHint('');
    setShowDownloadModal(false);
  };

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
          Manage files you share on the Tor network and track inbound downloads. Active:{' '}
          {transfer.activeCount()} · Completed: {transfer.completedDownloads().length}
        </p>
      </header>

      <div class={styles.hubTabs}>
        <button
          type="button"
          class={hubTab() === 'downloads' ? styles.hubTabActive : styles.hubTab}
          onClick={() => setHubTab('downloads')}
        >
          Downloads
        </button>
        <button
          type="button"
          class={hubTab() === 'sharing' ? styles.hubTabActive : styles.hubTab}
          onClick={() => setHubTab('sharing')}
        >
          Sharing
        </button>
      </div>

      <Show when={hubTab() === 'downloads'}>
        <Card class={styles.statusBar}>
          <div class={styles.statusActionsExtra}>
            <Button
              variant="outline"
              size="sm"
              disabled={!transfer.canDownload()}
              onClick={() => {
                setResolveHint('');
                setShowDownloadModal(true);
              }}
            >
              <Link2 size={14} /> Add download
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void transfer.refreshAll()}>
              Refresh
            </Button>
          </div>
          <Show when={transfer.error()}>
            <p class={styles.onionError} role="alert">
              {transfer.error()}
            </p>
          </Show>
        </Card>

        <TransferQueuePanel variant="full" showOutbound={false} showDownloads showCompleted />
      </Show>

      <Show when={hubTab() === 'sharing'}>
        <Card class={styles.statusBar}>
          <OnionStatusBar variant="actions" />
          <div class={styles.statusActionsExtra}>
            <Button
              variant="outline"
              size="sm"
              disabled={!transfer.canDownload()}
              onClick={() => void handleAddFiles()}
            >
              <Plus size={14} /> Add files
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void transfer.refreshAll()}>
              Refresh
            </Button>
          </div>
          <Show when={transfer.error()}>
            <p class={styles.onionError} role="alert">
              {transfer.error()}
            </p>
          </Show>
        </Card>

        <TransferQueuePanel
          variant="full"
          showOutbound
          showDownloads={false}
          showCompleted={false}
          onAddShare={() => void handleAddFiles()}
        />
      </Show>

      <Show when={showDownloadModal()}>
        <div
          class={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Download from network link"
          onClick={() => setShowDownloadModal(false)}
        >
          <div class={styles.modalCard} onClick={(e: MouseEvent) => e.stopPropagation()}>
            <h2 class={styles.modalTitle}>Add download</h2>
            <p class={styles.modalHint}>
              Paste a content hash, opoc link, or opocswarm link. Swarm downloads try all online
              peers automatically.
            </p>
            <div class={styles.modalFields}>
              <label>
                Link or content hash
                <Input
                  value={fetchLink()}
                  onInput={v => {
                    setFetchLink(v);
                    void previewResolve(v);
                  }}
                  placeholder="opocswarm://… or content hash"
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
              <Show when={resolveHint()}>
                <p class={styles.resolveHint}>{resolveHint()}</p>
              </Show>
            </div>
            <div class={styles.modalActions}>
              <Button variant="ghost" size="sm" onClick={() => setShowDownloadModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!fetchLink().trim() || !transfer.canDownload()}
                onClick={() => void handleDownloadFromLink()}
              >
                Add to queue
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export { PeerTransfers };
export default PeerTransfers;
