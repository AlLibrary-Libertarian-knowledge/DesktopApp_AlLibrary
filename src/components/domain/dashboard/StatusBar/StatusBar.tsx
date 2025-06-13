import { Component, createSignal, onMount, onCleanup } from 'solid-js';
import {
  Wifi,
  Download,
  Upload,
  HardDrive,
  Users,
  Activity,
  Shield,
  Globe,
  Database,
  Layers,
  BarChart3,
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Circle,
  Cpu,
} from 'lucide-solid';
import styles from './StatusBar.module.css';

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
    peers: 6,
    bandwidth: '2.6 MB/s',
    health: 'good',
    latency: 29,
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
    <div class={`${styles['status-bar']} ${styles.futuristic}`}>
      <div class={styles['scan-line']}></div>

      {/* Network Status Card */}
      <div
        class={`${styles['status-section']} ${styles['network-status']}`}
        data-status={networkStatus().health}
      >
        <div class={styles['status-icon-container']}>
          <div class={`${styles['icon-glow']} ${styles.network}`}></div>
          <Globe size={20} class={styles['status-icon-main'] as string} />
          <div class={styles['connection-pulse']}></div>
        </div>
        <div class={styles['status-content']}>
          <div class={styles['status-title']}>
            <span class={styles['title-text']}>Network</span>
          </div>
          <div class={styles['status-metrics']}>
            <div class={`${styles['metric-row']} ${styles.primary}`}>
              <span class={styles['metric-value']}>{networkStatus().peers}</span>
              <span class={styles['metric-unit']}>peers</span>
            </div>
            <div class={`${styles['metric-row']} ${styles.secondary}`}>
              <span class={styles['metric-value']}>{networkStatus().bandwidth}</span>
            </div>
          </div>
          <div class={styles['status-footer']}>
            <span class={styles['footer-stat']}>{networkStatus().latency}ms</span>
          </div>
        </div>
        <div class={styles['card-border-flow']}></div>
      </div>

      {/* Downloads Status Card */}
      <div
        class={`${styles['status-section']} ${styles['download-status']}`}
        data-activity={downloadStatus().active > 0 ? 'active' : 'idle'}
      >
        <div class={styles['status-icon-container']}>
          <div class={`${styles['icon-glow']} ${styles.download}`}></div>
          <Download size={20} class={styles['status-icon-main'] as string} />
          {downloadStatus().active > 0 && <div class={styles['activity-pulse']}></div>}
        </div>
        <div class={styles['status-content']}>
          <div class={styles['status-title']}>
            <span class={styles['title-text']}>Downloads</span>
          </div>
          <div class={styles['status-metrics']}>
            <div class={`${styles['metric-row']} ${styles.primary}`}>
              <span class={styles['metric-value']}>{downloadStatus().active}</span>
              <span class={styles['metric-unit']}>active</span>
            </div>
            <div class={`${styles['metric-row']} ${styles.secondary}`}>
              <span class={styles['metric-value']}>{downloadStatus().downloadSpeed}</span>
            </div>
          </div>
          <div class={styles['status-footer']}>
            <span class={styles['footer-stat']}>Queue: {downloadStatus().queueSize}</span>
          </div>
        </div>
        <div class={styles['card-border-flow']}></div>
      </div>

      {/* Storage Status Card */}
      <div
        class={`${styles['status-section']} ${styles['storage-status']}`}
        data-usage={
          storageStatus().percentage > 80
            ? 'high'
            : storageStatus().percentage > 60
              ? 'medium'
              : 'low'
        }
      >
        <div class={styles['status-icon-container']}>
          <div class={`${styles['icon-glow']} ${styles.storage}`}></div>
          <HardDrive size={20} class={styles['status-icon-main'] as string} />
          <div class={styles['io-indicator']} data-activity={storageStatus().ioActivity}></div>
        </div>
        <div class={styles['status-content']}>
          <div class={styles['status-title']}>
            <span class={styles['title-text']}>Storage</span>
          </div>
          <div class={styles['status-metrics']}>
            <div class={`${styles['metric-row']} ${styles.primary}`}>
              <span class={`${styles['metric-value']} ${styles['storage-used']}`}>
                {storageStatus().used}
              </span>
              <span class={styles['metric-separator']}>/</span>
              <span class={styles['metric-total']}>{storageStatus().total}</span>
            </div>
            <div class={styles['storage-progress']}>
              <div class={styles['storage-bar']}>
                <div
                  class={styles['storage-fill']}
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
              <span class={styles['storage-percentage']}>{storageStatus().percentage}%</span>
            </div>
          </div>
        </div>
        <div class={styles['card-border-flow']}></div>
      </div>

      {/* System Health Card */}
      <div
        class={`${styles['status-section']} ${styles['system-health']}`}
        data-health={currentHealth}
      >
        <div class={styles['status-icon-container']}>
          <div class={`${styles['icon-glow']} ${styles.health}`}></div>
          <Cpu size={20} class={styles['status-icon-main'] as string} />
          <div class={styles['health-pulse']} data-level={currentHealth}></div>
        </div>
        <div class={styles['status-content']}>
          <div class={styles['status-title']}>
            <span class={styles['title-text']}>Health</span>
          </div>
          <div class={styles['status-metrics']}>
            <div class={styles['health-stats']}>
              <div class={styles['health-stat']}>
                <span class={styles['stat-label']}>CPU</span>
                <span class={styles['stat-value']}>{systemHealth().cpu}%</span>
                <div class={styles['stat-bar']}>
                  <div
                    class={`${styles['stat-fill']} ${styles.cpu}`}
                    style={`width: ${systemHealth().cpu}%`}
                  ></div>
                </div>
              </div>
              <div class={styles['health-stat']}>
                <span class={styles['stat-label']}>RAM</span>
                <span class={styles['stat-value']}>{systemHealth().memory}%</span>
                <div class={styles['stat-bar']}>
                  <div
                    class={`${styles['stat-fill']} ${styles.memory}`}
                    style={`width: ${systemHealth().memory}%`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class={styles['card-border-flow']}></div>
      </div>

      {/* Cultural Protection Card */}
      <div
        class={`${styles['status-section']} ${styles['cultural-protection']}`}
        data-status={culturalProtection().status}
      >
        <div class={styles['status-icon-container']}>
          <div class={`${styles['icon-glow']} ${styles.cultural}`}></div>
          <Shield size={20} class={styles['status-icon-main'] as string} />
          <div class={styles['protection-shield']}></div>
        </div>
        <div class={styles['status-content']}>
          <div class={styles['status-title']}>
            <span class={styles['title-text']}>Protection</span>
          </div>
          <div class={styles['status-metrics']}>
            <div class={`${styles['metric-row']} ${styles.primary}`}>
              <span class={`${styles['metric-value']} ${styles['cultural-status']}`}>
                {culturalProtection().status}
              </span>
              <span class={styles['metric-unit']}>status</span>
            </div>
            <div class={`${styles['metric-row']} ${styles.secondary}`}>
              <span class={`${styles['metric-value']} ${styles['cultural-sensitivity']}`}>
                {culturalProtection().sensitivity}
              </span>
            </div>
          </div>
          <div class={styles['status-footer']}>
            <span class={styles['footer-stat']}>Last scan: {culturalProtection().lastScan}</span>
          </div>
        </div>
        <div class={styles['card-border-flow']}></div>
      </div>
    </div>
  );
};

export default StatusBar;
