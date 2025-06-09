import { Component, createSignal, onMount } from 'solid-js';
import './StatusBar.css';

interface NetworkStatus {
  connected: boolean;
  peers: number;
  bandwidth: string;
  health: 'good' | 'warning' | 'error';
}

interface DownloadStatus {
  active: number;
  completed: number;
  failed: number;
  totalSize: string;
  downloadSpeed: string;
}

interface StorageStatus {
  used: string;
  available: string;
  percentage: number;
  cacheSize: string;
}

interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  temperature: number;
  uptime: string;
}

const StatusBar: Component = () => {
  const [networkStatus, setNetworkStatus] = createSignal<NetworkStatus>({
    connected: true,
    peers: 12,
    bandwidth: '2.3 MB/s',
    health: 'good',
  });

  const [downloadStatus] = createSignal<DownloadStatus>({
    active: 3,
    completed: 47,
    failed: 2,
    totalSize: '2.4 GB',
    downloadSpeed: '1.2 MB/s',
  });

  const [storageStatus] = createSignal<StorageStatus>({
    used: '847 GB',
    available: '1.2 TB',
    percentage: 67,
    cacheSize: '24 GB',
  });

  const [systemHealth] = createSignal<SystemHealth>({
    cpu: 34,
    memory: 78,
    disk: 67,
    network: 94,
    temperature: 52,
    uptime: '7d 14h 23m',
  });

  onMount(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setNetworkStatus(prev => ({
        ...prev,
        peers: Math.floor(Math.random() * 20) + 5,
        bandwidth: (Math.random() * 5 + 0.5).toFixed(1) + ' MB/s',
      }));
    }, 5000);

    return () => clearInterval(interval);
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'error':
        return '🔴';
      default:
        return '⚫';
    }
  };

  return (
    <div class="status-bar">
      <div class="status-section network-status">
        <div class="status-icon">{getStatusIcon(networkStatus().health)}</div>
        <div class="status-content">
          <div class="status-title">Network</div>
          <div class="status-details">
            <span class="peer-count">{networkStatus().peers} peers</span>
            <span class="bandwidth">{networkStatus().bandwidth}</span>
          </div>
        </div>
      </div>

      <div class="status-section download-status">
        <div class="status-icon">⬇️</div>
        <div class="status-content">
          <div class="status-title">Downloads</div>
          <div class="status-details">
            <span class="active-downloads">{downloadStatus().active} active</span>
            <span class="download-speed">{downloadStatus().downloadSpeed}</span>
          </div>
        </div>
      </div>

      <div class="status-section storage-status">
        <div class="status-icon">💾</div>
        <div class="status-content">
          <div class="status-title">Storage</div>
          <div class="status-details">
            <span class="storage-usage">
              {storageStatus().used} / {storageStatus().available}
            </span>
            <div class="storage-bar">
              <div class="storage-fill" style={`width: ${storageStatus().percentage}%`}></div>
            </div>
          </div>
        </div>
      </div>

      <div class="status-section system-health">
        <div class="status-icon">
          {getStatusIcon(
            systemHealth().network === 100
              ? 'good'
              : systemHealth().network < 100
                ? 'warning'
                : 'error'
          )}
        </div>
        <div class="status-content">
          <div class="status-title">Health</div>
          <div class="status-details">
            <span class="cpu-usage">CPU: {systemHealth().cpu}%</span>
            <span class="memory-usage">RAM: {systemHealth().memory}%</span>
          </div>
        </div>
      </div>

      <div class="status-section cultural-protection">
        <div class="status-icon">🛡️</div>
        <div class="status-content">
          <div class="status-title">Cultural Protection</div>
          <div class="status-details">
            <span class="protection-status">Active</span>
            <span class="sensitivity-check">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
