import { Component, createSignal, onMount } from 'solid-js';
import {
  Download,
  HardDrive,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Circle,
  Activity,
  Cpu,
  Globe,
  Zap,
} from 'lucide-solid';
import './StatusBar.css';

interface NetworkStatus {
  connected: boolean;
  peers: number;
  bandwidth: string;
  health: 'good' | 'warning' | 'error';
  latency: number;
  uptime: number;
}

interface DownloadStatus {
  active: number;
  completed: number;
  failed: number;
  totalSize: string;
  downloadSpeed: string;
  uploadSpeed: string;
  queueSize: number;
}

interface StorageStatus {
  used: string;
  available: string;
  total: string;
  percentage: number;
  cacheSize: string;
  ioActivity: 'high' | 'medium' | 'low';
}

interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  temperature: number;
  uptime: string;
  overall: 'excellent' | 'good' | 'fair' | 'poor';
}

interface CulturalProtection {
  status: 'active' | 'inactive' | 'scanning';
  sensitivity: 'verified' | 'checking' | 'unknown';
  threatsBlocked: number;
  lastScan: string;
}

const StatusBar: Component = () => {
  const [networkStatus, setNetworkStatus] = createSignal<NetworkStatus>({
    connected: true,
    peers: 7,
    bandwidth: '2.2 MB/s',
    health: 'good',
    latency: 45,
    uptime: 98.7,
  });

  const [downloadStatus] = createSignal<DownloadStatus>({
    active: 3,
    completed: 47,
    failed: 0,
    totalSize: '2.4 GB',
    downloadSpeed: '1.2 MB/s',
    uploadSpeed: '0.8 MB/s',
    queueSize: 5,
  });

  const [storageStatus] = createSignal<StorageStatus>({
    used: '847 GB',
    available: '11.2 TB',
    total: '12 TB',
    percentage: 7,
    cacheSize: '24 GB',
    ioActivity: 'medium',
  });

  const [systemHealth] = createSignal<SystemHealth>({
    cpu: 34,
    memory: 78,
    disk: 67,
    network: 94,
    temperature: 52,
    uptime: '7d 14h 23m',
    overall: 'good',
  });

  const [culturalProtection] = createSignal<CulturalProtection>({
    status: 'active',
    sensitivity: 'verified',
    threatsBlocked: 0,
    lastScan: '2 min ago',
  });

  onMount(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setNetworkStatus(prev => ({
        ...prev,
        peers: Math.floor(Math.random() * 15) + 5,
        bandwidth: (Math.random() * 3 + 1.5).toFixed(1) + ' MB/s',
        latency: Math.floor(Math.random() * 30) + 20,
      }));
    }, 3000);

    return () => clearInterval(interval);
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'error':
        return XCircle;
      default:
        return Circle;
    }
  };

  const getHealthLevel = (cpu: number, memory: number) => {
    const avgUsage = (cpu + memory) / 2;
    if (avgUsage < 60) return 'excellent';
    if (avgUsage < 80) return 'good';
    if (avgUsage < 90) return 'fair';
    return 'poor';
  };

  const StatusIcon = getStatusIcon(networkStatus().health);
  const currentHealth = getHealthLevel(systemHealth().cpu, systemHealth().memory);

  return (
    <div class="status-bar futuristic">
      <div class="scan-line"></div>

      {/* Network Status Card */}
      <div class="status-section network-status" data-status={networkStatus().health}>
        <div class="status-icon-container">
          <div class="icon-glow network"></div>
          <Globe size={20} class="status-icon-main" />
          <div class="connection-pulse"></div>
        </div>
        <div class="status-content">
          <div class="status-title">
            <span class="title-text">Network</span>
            {/* <div class="status-indicator online"></div> */}
          </div>
          <div class="status-metrics">
            <div class="metric-row primary">
              <span class="metric-value">{networkStatus().peers}</span>
              <span class="metric-unit">peers</span>
            </div>
            <div class="metric-row secondary">
              <span class="metric-value">{networkStatus().bandwidth}</span>
            </div>
          </div>
          <div class="status-footer">
            <span class="footer-stat">{networkStatus().latency}ms</span>
          </div>
        </div>
        <div class="card-border-flow"></div>
      </div>

      {/* Downloads Status Card */}
      <div
        class="status-section download-status"
        data-activity={downloadStatus().active > 0 ? 'active' : 'idle'}
      >
        <div class="status-icon-container">
          <div class="icon-glow download"></div>
          <Download size={20} class="status-icon-main" />
          {downloadStatus().active > 0 && <div class="activity-pulse"></div>}
        </div>
        <div class="status-content">
          <div class="status-title">
            <span class="title-text">Downloads</span>
            {/* <div class="status-indicator active"></div> */}
          </div>
          <div class="status-metrics">
            <div class="metric-row primary">
              <span class="metric-value">{downloadStatus().active}</span>
              <span class="metric-unit">active</span>
            </div>
            <div class="metric-row secondary">
              <span class="metric-value">{downloadStatus().downloadSpeed}</span>
            </div>
          </div>
          <div class="status-footer">
            <span class="footer-stat">Queue: {downloadStatus().queueSize}</span>
          </div>
        </div>
        <div class="card-border-flow"></div>
      </div>

      {/* Storage Status Card */}
      <div
        class="status-section storage-status"
        data-usage={
          storageStatus().percentage > 80
            ? 'high'
            : storageStatus().percentage > 60
              ? 'medium'
              : 'low'
        }
      >
        <div class="status-icon-container">
          <div class="icon-glow storage"></div>
          <HardDrive size={20} class="status-icon-main" />
          <div class="io-indicator" data-activity={storageStatus().ioActivity}></div>
        </div>
        <div class="status-content">
          <div class="status-title">
            <span class="title-text">Storage</span>
            {/* <div class="status-indicator available"></div> */}
          </div>
          <div class="status-metrics">
            <div class="metric-row primary">
              <span class="metric-value storage-used">{storageStatus().used}</span>
              <span class="metric-separator">/</span>
              <span class="metric-total">{storageStatus().total}</span>
            </div>
            <div class="storage-progress">
              <div class="storage-bar">
                <div
                  class="storage-fill"
                  style={`width: ${storageStatus().percentage}%`}
                  data-level={
                    storageStatus().percentage > 80
                      ? 'critical'
                      : storageStatus().percentage > 60
                        ? 'warning'
                        : 'normal'
                  }
                ></div>
              </div>
              <span class="storage-percentage">{storageStatus().percentage}%</span>
            </div>
          </div>
        </div>
        <div class="card-border-flow"></div>
      </div>

      {/* System Health Card */}
      <div class="status-section system-health" data-health={currentHealth}>
        <div class="status-icon-container">
          <div class="icon-glow health"></div>
          <Cpu size={20} class="status-icon-main" />
          <div class="health-pulse" data-level={currentHealth}></div>
        </div>
        <div class="status-content">
          <div class="status-title">
            <span class="title-text">Health</span>
            {/* <div class="status-indicator healthy"></div> */}
          </div>
          <div class="status-metrics">
            <div class="health-stats">
              <div class="health-stat">
                <span class="stat-label">CPU</span>
                <span class="stat-value">{systemHealth().cpu}%</span>
                <div class="stat-bar">
                  <div class="stat-fill cpu" style={`width: ${systemHealth().cpu}%`}></div>
                </div>
              </div>
              <div class="health-stat">
                <span class="stat-label">RAM</span>
                <span class="stat-value">{systemHealth().memory}%</span>
                <div class="stat-bar">
                  <div class="stat-fill memory" style={`width: ${systemHealth().memory}%`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-border-flow"></div>
      </div>

      {/* Cultural Protection Card */}
      <div class="status-section cultural-protection" data-status={culturalProtection().status}>
        <div class="status-icon-container">
          <div class="icon-glow cultural"></div>
          <Shield size={20} class="status-icon-main" />
          <div class="protection-shield"></div>
        </div>
        <div class="status-content">
          <div class="status-title">
            <span class="title-text">Cultural Protection</span>
            {/* <div class="status-indicator protected"></div> */}
          </div>
          <div class="status-metrics">
            <div class="metric-row primary">
              <span class="metric-value cultural-status">{culturalProtection().status}</span>
            </div>
            <div class="metric-row secondary">
              <span class="metric-value cultural-sensitivity">
                {culturalProtection().sensitivity}
              </span>
            </div>
          </div>
          <div class="status-footer">
            <span class="footer-stat">Scan: {culturalProtection().lastScan}</span>
          </div>
        </div>
        <div class="card-border-flow"></div>
      </div>
    </div>
  );
};

export default StatusBar;
