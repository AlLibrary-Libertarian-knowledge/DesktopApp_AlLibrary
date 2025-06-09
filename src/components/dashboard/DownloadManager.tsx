import { Component, createSignal, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Button } from '../common';
import './DownloadManager.css';

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
  const [selectedItems, setSelectedItems] = createSignal<string[]>([]);
  const [sortBy, setSortBy] = createSignal<keyof DownloadItem>('addedDate');
  const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('desc');
  const [filter, setFilter] = createSignal<string>('all');
  const [viewMode, setViewMode] = createSignal<'list' | 'compact'>('list');

  // Mock download data
  const [downloads, setDownloads] = createStore<DownloadItem[]>([
    {
      id: '1',
      name: 'Traditional Healing Practices of the Amazon.pdf',
      type: 'PDF',
      size: 15728640, // 15MB
      downloaded: 10485760, // 10MB
      uploadSpeed: 0,
      downloadSpeed: 524288, // 512 KB/s
      peers: 8,
      seeders: 3,
      eta: 10,
      status: 'downloading',
      priority: 'high',
      health: 85,
      ratio: 0,
      culturalContext: 'Amazon Indigenous Knowledge',
      source: 'Instituto Socioambiental',
      addedDate: new Date('2025-01-09T10:30:00'),
    },
    {
      id: '2',
      name: 'Digital Archives Collection.zip',
      type: 'Collection',
      size: 104857600, // 100MB
      downloaded: 104857600,
      uploadSpeed: 1048576, // 1 MB/s
      downloadSpeed: 0,
      peers: 12,
      seeders: 5,
      eta: 0,
      status: 'seeding',
      priority: 'normal',
      health: 100,
      ratio: 2.5,
      source: 'Global Heritage Archive',
      addedDate: new Date('2025-01-08T15:22:00'),
    },
    {
      id: '3',
      name: 'Pacific Islander Navigation Methods.epub',
      type: 'EPUB',
      size: 5242880, // 5MB
      downloaded: 0,
      uploadSpeed: 0,
      downloadSpeed: 0,
      peers: 0,
      seeders: 0,
      eta: 999999,
      status: 'paused',
      priority: 'low',
      health: 0,
      ratio: 0,
      culturalContext: 'Pacific Islander Traditional Knowledge',
      source: 'Polynesian Cultural Center',
      addedDate: new Date('2025-01-07T09:15:00'),
    },
    {
      id: '4',
      name: 'Andean Music Traditions.pdf',
      type: 'PDF',
      size: 25165824, // 24MB
      downloaded: 25165824,
      uploadSpeed: 0,
      downloadSpeed: 0,
      peers: 0,
      seeders: 2,
      eta: 0,
      status: 'completed',
      priority: 'normal',
      health: 100,
      ratio: 1.2,
      culturalContext: 'Andean Cultural Heritage',
      source: 'Museo de Arte Precolombino',
      addedDate: new Date('2025-01-06T14:45:00'),
    },
  ]);

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
    let filtered = [...downloads];

    if (filter() !== 'all') {
      filtered = filtered.filter(item => item.status === filter());
    }

    // Sort
    const sortField = sortBy();
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

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
    const selected = downloads.filter(d => selectedItems().includes(d.id));
    selected.forEach(item => {
      props.onItemAction?.(action, item);

      // Mock state changes
      if (action === 'pause' && item.status === 'downloading') {
        setDownloads(item.id, 'status', 'paused');
      } else if (action === 'resume' && item.status === 'paused') {
        setDownloads(item.id, 'status', 'downloading');
      }
    });
  };

  return (
    <div class="download-manager">
      {/* Toolbar */}
      <div class="download-toolbar">
        <div class="toolbar-group">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction('resume')}
            disabled={selectedItems().length === 0}
          >
            ▶️ Resume
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction('pause')}
            disabled={selectedItems().length === 0}
          >
            ⏸️ Pause
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction('remove')}
            disabled={selectedItems().length === 0}
          >
            🗑️ Remove
          </Button>
        </div>

        <div class="toolbar-group">
          <select class="filter-select" value={filter()} onChange={e => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="downloading">Downloading</option>
            <option value="seeding">Seeding</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="error">Error</option>
          </select>

          <div class="view-toggle">
            <Button
              variant={viewMode() === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              📋
            </Button>
            <Button
              variant={viewMode() === 'compact' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('compact')}
            >
              📑
            </Button>
          </div>
        </div>
      </div>

      {/* Download List */}
      <div class={`download-list ${viewMode()}`}>
        {/* Header */}
        <div class="download-header">
          <div class="header-cell checkbox-cell">
            <input
              type="checkbox"
              checked={selectedItems().length === downloads.length}
              onChange={e => {
                if (e.target.checked) {
                  setSelectedItems(downloads.map(d => d.id));
                } else {
                  setSelectedItems([]);
                }
              }}
            />
          </div>
          <div class="header-cell name-cell" onClick={() => handleSort('name')}>
            Name {sortBy() === 'name' && (sortOrder() === 'asc' ? '↑' : '↓')}
          </div>
          <div class="header-cell size-cell" onClick={() => handleSort('size')}>
            Size {sortBy() === 'size' && (sortOrder() === 'asc' ? '↑' : '↓')}
          </div>
          <div class="header-cell progress-cell">Progress</div>
          <div class="header-cell speed-cell">Speed</div>
          <div class="header-cell peers-cell">Peers</div>
          <div class="header-cell eta-cell">ETA</div>
          <div class="header-cell ratio-cell">Ratio</div>
          <div class="header-cell status-cell" onClick={() => handleSort('status')}>
            Status {sortBy() === 'status' && (sortOrder() === 'asc' ? '↑' : '↓')}
          </div>
        </div>

        {/* Download Items */}
        <div class="download-items">
          <For each={filteredDownloads()}>
            {item => (
              <div
                class={`download-item ${selectedItems().includes(item.id) ? 'selected' : ''} ${item.status}`}
                onClick={e => handleItemSelect(item.id, e.ctrlKey)}
                onDblClick={() => props.onItemSelect?.(item)}
              >
                <div class="item-cell checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedItems().includes(item.id)}
                    onClick={e => e.stopPropagation()}
                    onChange={() => handleItemSelect(item.id)}
                  />
                </div>

                <div class="item-cell name-cell">
                  <div class="item-name">
                    <span class="file-icon">
                      {item.type === 'PDF' ? '📄' : item.type === 'EPUB' ? '📖' : '📦'}
                    </span>
                    <span class="file-name" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <Show when={item.culturalContext}>
                    <div class="cultural-badge">{item.culturalContext}</div>
                  </Show>
                  <div class="item-source">{item.source}</div>
                </div>

                <div class="item-cell size-cell">{formatBytes(item.size)}</div>

                <div class="item-cell progress-cell">
                  <div class="progress-container">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        style={`width: ${getProgress(item)}%; background-color: ${getStatusColor(item.status)}`}
                      />
                    </div>
                    <span class="progress-text">{getProgress(item).toFixed(1)}%</span>
                  </div>
                </div>

                <div class="item-cell speed-cell">
                  <div class="speed-info">
                    <div class="download-speed">↓ {formatSpeed(item.downloadSpeed)}</div>
                    <div class="upload-speed">↑ {formatSpeed(item.uploadSpeed)}</div>
                  </div>
                </div>

                <div class="item-cell peers-cell">
                  <span class="peer-count">{item.peers}</span>
                  <span class="seeder-count">({item.seeders})</span>
                </div>

                <div class="item-cell eta-cell">{formatTime(item.eta)}</div>

                <div class="item-cell ratio-cell">
                  <span
                    class={`ratio ${item.ratio > 1 ? 'good' : item.ratio > 0.5 ? 'fair' : 'poor'}`}
                  >
                    {item.ratio.toFixed(2)}
                  </span>
                </div>

                <div class="item-cell status-cell">
                  <span
                    class={`status-badge ${item.status}`}
                    style={`color: ${getStatusColor(item.status)}`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                  <div class="health-indicator">
                    <div class="health-bar">
                      <div
                        class="health-fill"
                        style={`width: ${item.health}%; background-color: ${item.health > 80 ? 'var(--color-success)' : item.health > 50 ? 'var(--color-warning)' : 'var(--color-danger)'}`}
                      />
                    </div>
                    <span class="health-text">{item.health}%</span>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Status Bar */}
      <div class="download-status-bar">
        <div class="status-group">
          <span>Total: {downloads.length}</span>
          <span>Active: {downloads.filter(d => d.status === 'downloading').length}</span>
          <span>Completed: {downloads.filter(d => d.status === 'completed').length}</span>
        </div>
        <div class="status-group">
          <span>↓ {formatSpeed(downloads.reduce((sum, d) => sum + d.downloadSpeed, 0))}</span>
          <span>↑ {formatSpeed(downloads.reduce((sum, d) => sum + d.uploadSpeed, 0))}</span>
        </div>
      </div>
    </div>
  );
};

export default DownloadManager;
