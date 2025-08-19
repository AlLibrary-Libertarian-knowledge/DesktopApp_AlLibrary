import { Component, createSignal, For, Show, createMemo } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useTranslation } from '../../../../i18n/hooks';
import {
  Play,
  Pause,
  Trash2,
  List,
  FileText,
  FileText as Document,
  BookOpen,
  Package,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Grid,
  MoreHorizontal,
} from 'lucide-solid';
import { Button } from '../../../foundation';
import styles from './DownloadManager.module.css';
import { useNetworkStore } from '@/stores/network/networkStore';
import { Modal } from '../../../foundation';

interface DownloadItem {
  id: string;
  name: string;
  type: 'PDF' | 'EPUB' | 'Collection';
  size: number;
  downloaded: number;
  uploadSpeed: number;
  downloadSpeed: number;
  peers: number;
  seeders: number;
  eta: number;
  status: 'downloading' | 'seeding' | 'paused' | 'completed' | 'error' | 'queued';
  priority: 'high' | 'normal' | 'low';
  health: number;
  ratio: number;
  culturalContext?: string;
  source: string;
  addedDate: Date;
}

interface DownloadManagerProps {
  onItemSelect?: (item: DownloadItem) => void;
  onItemAction?: (action: string, item: DownloadItem) => void;
}

const DownloadManager: Component<DownloadManagerProps> = props => {
  const { t } = useTranslation('components');

  const [selectedItems, setSelectedItems] = createSignal<string[]>([]);
  const [sortBy, setSortBy] = createSignal<keyof DownloadItem>('addedDate');
  const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('desc');
  const [filter, setFilter] = createSignal<string>('all');
  const [viewMode, setViewMode] = createSignal<'list' | 'grid' | 'compact'>('list');
  const [showAddModal, setShowAddModal] = createSignal<boolean>(false);
  const [newDownloadUrl, setNewDownloadUrl] = createSignal<string>('');
  const [downloadPath, setDownloadPath] = createSignal<string>('');

  const net = useNetworkStore();
  const liveDownloads = createMemo<DownloadItem[]>(() => {
    const items = (net.transfers() as any[]) || [];
    return items.map((t: any) => ({
      id: String(t.id ?? t.hash ?? t.name),
      name: String(t.name || 'Unknown'),
      type: (String(t.name || '').toLowerCase().endsWith('.epub') ? 'EPUB' : String(t.name || '').toLowerCase().endsWith('.pdf') ? 'PDF' : 'Collection') as any,
      size: Number(t.size ?? 0),
      downloaded: Number(t.downloaded ?? 0),
      uploadSpeed: Number(t.upload_speed ?? 0),
      downloadSpeed: Number(t.download_speed ?? 0),
      peers: Number(t.peers ?? 0),
      seeders: Number(t.seeders ?? 0),
      eta: Number(t.eta_secs ?? 0),
      status: String(t.status ?? 'seeding') as any,
      priority: 'normal',
      health: Number(t.health ?? 100),
      ratio: Number(t.ratio ?? 1),
      source: 'P2P Network',
      addedDate: new Date(),
    }));
  });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatSpeed = (speed: number): string => {
    return formatBytes(speed) + '/s';
  };

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return '∞';
    if (seconds > 999999) return '∞';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const getProgress = (item: DownloadItem): number => {
    return (item.downloaded / item.size) * 100;
  };

  const getStatusColor = (status: DownloadItem['status']): string => {
    const colors = {
      downloading: 'var(--color-primary)',
      seeding: 'var(--color-success)',
      paused: 'var(--color-warning)',
      completed: 'var(--color-success)',
      error: 'var(--color-danger)',
      queued: 'var(--text-color-muted)',
    };
    return colors[status];
  };

  const filteredDownloads = () => {
    const list = liveDownloads();
    let filtered = list.filter(item => {
      if (filter() === 'all') return true;
      return item.status === filter();
    });

    // Sort
    const sortField = sortBy();
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle undefined values for proper comparison
      if (aVal === undefined || aVal === null) aVal = 0;
      if (bVal === undefined || bVal === null) bVal = 0;

      if (aVal < bVal) return sortOrder() === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder() === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const handleSort = (field: keyof DownloadItem) => {
    if (sortBy() === field) {
      setSortOrder(sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleItemSelect = (id: string, ctrlKey: boolean = false) => {
    if (ctrlKey) {
      const current = selectedItems();
      if (current.includes(id)) {
        setSelectedItems(current.filter(i => i !== id));
      } else {
        setSelectedItems([...current, id]);
      }
    } else {
      setSelectedItems([id]);
    }
  };

  const handleAction = (action: string) => {
    const selected = liveDownloads().filter(d => selectedItems().includes(d.id));
    selected.forEach(item => {
      props.onItemAction?.(action, item);

      // Mock state changes - find the item index and update
      const itemIndex = downloads.findIndex(d => d.id === item.id);
      if (itemIndex !== -1) {
        if (action === 'pause' && item.status === 'downloading') {
          setDownloads(itemIndex, 'status', 'paused');
        } else if (action === 'resume' && item.status === 'paused') {
          setDownloads(itemIndex, 'status', 'downloading');
        }
      }
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <Document size={16} />;
      case 'EPUB':
        return <BookOpen size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const handleSelectAll = () => {
    if (selectedItems().length === liveDownloads().length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(liveDownloads().map(d => d.id));
    }
  };

  const handleBulkAction = (action: string) => {
    const selected = downloads.filter(d => selectedItems().includes(d.id));
    selected.forEach(item => {
      handleAction(action);
    });
  };

  const handleAddDownload = () => {
    // Implementation of adding a new download
    console.log('Adding new download');
    setShowAddModal(false);
  };

  return (
    <div class={styles['download-manager']}>
      {/* Toolbar */}
      <div class={styles['download-toolbar']}>
        <div class={styles['toolbar-group']}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            class={styles['add-button'] || ''}
          >
            <Plus size={16} class="mr-2" />
            {t('downloadManager.actions.addDownload')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            class={styles['select-all-button'] || ''}
          >
            {selectedItems().length === downloads.length && downloads.length > 0
              ? t('downloadManager.actions.deselectAll')
              : t('downloadManager.actions.selectAll')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('pause')}
            disabled={selectedItems().length === 0}
            class={styles['bulk-action-button'] || ''}
          >
            <Pause size={16} class="mr-2" />
            {t('downloadManager.batchActions.pauseSelected')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('resume')}
            disabled={selectedItems().length === 0}
            class={styles['bulk-action-button'] || ''}
          >
            <Play size={16} class="mr-2" />
            {t('downloadManager.batchActions.resumeSelected')}
          </Button>
        </div>
        <div class={styles['toolbar-group']}>
          <select
            class={styles['filter-select']}
            value={filter()}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">{t('downloadManager.filters.all')}</option>
            <option value="downloading">{t('downloadManager.filters.downloading')}</option>
            <option value="completed">{t('downloadManager.filters.completed')}</option>
            <option value="paused">{t('downloadManager.filters.paused')}</option>
            <option value="error">{t('downloadManager.filters.error')}</option>
          </select>
          <div class={styles['view-toggle']}>
            <Button
              variant={viewMode() === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              class={styles['view-button'] || ''}
            >
              <List size={16} />
            </Button>
            <Button
              variant={viewMode() === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              class={styles['view-button'] || ''}
            >
              <Grid size={16} />
            </Button>
            <Button
              variant={viewMode() === 'compact' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('compact')}
              class={styles['view-button'] || ''}
            >
              <MoreHorizontal size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Download List Container */}
      <div class={styles['download-list']}>
        {/* Header Row */}
        {viewMode() === 'list' && (
          <div class={styles['download-header']}>
            <div class={`${styles['header-cell']} ${styles['checkbox-cell']}`}>
              <input
                type="checkbox"
                checked={downloads.length > 0 && selectedItems().length === downloads.length}
                onChange={handleSelectAll}
              />
            </div>
            <div
              class={`${styles['header-cell']} ${styles['name-cell']}`}
              onClick={() => handleSort('name')}
            >
              {t('downloadManager.table.headers.name')}
              {sortBy() === 'name' &&
                (sortOrder() === 'asc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
            </div>
            <div
              class={`${styles['header-cell']} ${styles['size-cell']}`}
              onClick={() => handleSort('size')}
            >
              {t('downloadManager.table.headers.size')}
              {sortBy() === 'size' &&
                (sortOrder() === 'asc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
            </div>
            <div class={`${styles['header-cell']} ${styles['progress-cell']}`}>
              {t('downloadManager.table.headers.progress')}
            </div>
            <div class={`${styles['header-cell']} ${styles['speed-cell']}`}>
              {t('downloadManager.table.headers.speed')}
            </div>
            <div class={`${styles['header-cell']} ${styles['peers-cell']}`}>
              {t('downloadManager.table.headers.peers')}
            </div>
            <div class={`${styles['header-cell']} ${styles['eta-cell']}`}>
              {t('downloadManager.table.headers.eta')}
            </div>
            <div class={`${styles['header-cell']} ${styles['ratio-cell']}`}>
              {t('downloadManager.table.headers.ratio')}
            </div>
            <div
              class={`${styles['header-cell']} ${styles['status-cell']}`}
              onClick={() => handleSort('status')}
            >
              {t('downloadManager.table.headers.status')}
              {sortBy() === 'status' &&
                (sortOrder() === 'asc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
            </div>
          </div>
        )}

        {/* Download Items */}
        <div class={styles['download-items']}>
          <For each={filteredDownloads()}>
            {(item, index) => (
              <div
                class={`${styles['download-item']} ${styles[`view-${viewMode()}`]} ${selectedItems().includes(item.id) ? styles['selected'] : ''}`}
                onClick={() => handleItemSelect(item.id)}
              >
                {viewMode() === 'list' && (
                  <>
                    <div class={`${styles['item-cell']} ${styles['checkbox-cell']}`}>
                      <input
                        type="checkbox"
                        checked={selectedItems().includes(item.id)}
                        onChange={() => handleItemSelect(item.id)}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <div class={`${styles['item-cell']} ${styles['name-cell']}`}>
                      <div class={styles['item-name']}>
                        <span class={styles['file-icon']}>{getFileIcon(item.type)}</span>
                        <span class={styles['file-name']} title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <Show when={item.culturalContext}>
                        <div class={styles['cultural-badge']}>{item.culturalContext}</div>
                      </Show>
                      <div class={styles['item-source']}>{item.source}</div>
                    </div>

                    <div class={`${styles['item-cell']} ${styles['size-cell']}`}>
                      {formatBytes(item.size)}
                    </div>

                    <div class={`${styles['item-cell']} ${styles['progress-cell']}`}>
                      <div class={styles['progress-container']}>
                        <div class={styles['progress-bar']}>
                          <div
                            class={styles['progress-fill']}
                            style={`width: ${getProgress(item)}%; background-color: ${getStatusColor(item.status)}`}
                          />
                        </div>
                        <span class={styles['progress-text']}>{getProgress(item).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div class={`${styles['item-cell']} ${styles['speed-cell']}`}>
                      <div class={styles['speed-info']}>
                        <div class={styles['download-speed']}>
                          <ArrowDown size={12} /> {formatSpeed(item.downloadSpeed)}
                        </div>
                        <div class={styles['upload-speed']}>
                          <ArrowUp size={12} /> {formatSpeed(item.uploadSpeed)}
                        </div>
                      </div>
                    </div>

                    <div class={`${styles['item-cell']} ${styles['peers-cell']}`}>
                      <span class={styles['peer-count']}>{item.peers}</span>
                      <span class={styles['seeder-count']}>({item.seeders})</span>
                    </div>

                    <div class={`${styles['item-cell']} ${styles['eta-cell']}`}>
                      {formatTime(item.eta)}
                    </div>

                    <div class={`${styles['item-cell']} ${styles['ratio-cell']}`}>
                      <span
                        class={`${styles['ratio']} ${item.ratio > 1 ? styles['good'] : item.ratio > 0.5 ? styles['fair'] : styles['poor']}`}
                      >
                        {item.ratio.toFixed(2)}
                      </span>
                    </div>

                    <div class={`${styles['item-cell']} ${styles['status-cell']}`}>
                      <span
                        class={`${styles['status-badge']} ${styles[item.status]}`}
                        style={`color: ${getStatusColor(item.status)}`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                      <div class={styles['health-indicator']}>
                        <div class={styles['health-bar']}>
                          <div
                            class={styles['health-fill']}
                            style={`width: ${item.health}%; background-color: ${item.health > 80 ? 'var(--color-success)' : item.health > 50 ? 'var(--color-warning)' : 'var(--color-danger)'}`}
                          />
                        </div>
                        <span class={styles['health-text']}>{item.health}%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Status Bar */}
      <div class={styles['download-status-bar']}>
        <div class={styles['status-group']}>
          <span>Total: {liveDownloads().length}</span>
          <span>Active: {liveDownloads().filter(d => d.status === 'downloading').length}</span>
          <span>Completed: {liveDownloads().filter(d => d.status === 'completed').length}</span>
        </div>
        <div class={styles['status-group']}>
          <span>
            <ArrowDown size={12} />{' '}
            {formatSpeed(liveDownloads().reduce((sum, d) => sum + d.downloadSpeed, 0))}
          </span>
          <span>
            <ArrowUp size={12} />{' '}
            {formatSpeed(liveDownloads().reduce((sum, d) => sum + d.uploadSpeed, 0))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DownloadManager;
