import { Component, createResource, createSignal, onMount } from 'solid-js';
import { Download, HardDrive, Shield, Globe, Cpu } from 'lucide-solid';
import { useTranslation } from '../../../../i18n/hooks';
import styles from './StatusBar.module.css';
import { useNetworkStore } from '@/stores/network/networkStore';
import { settingsService } from '@/services/storage/settingsService';
import { invoke } from '@tauri-apps/api/core';

interface DiskSpaceInfo {
  project_size_bytes: number;
  total_disk_space_bytes: number;
  available_disk_space_bytes: number;
  used_disk_space_bytes: number;
  project_percentage: number;
  disk_usage_percentage: number;
  project_path: string;
  disk_name: string;
}

const StatusBar: Component = () => {
  // i18n (cast to any to allow component-scoped keys)
  const { t: tAny } = useTranslation('components') as any;
  const t = tAny as (k: string, p?: any) => string;

  // Live network data
  const net = useNetworkStore();

  // Live storage data
  const [diskInfo] = createResource(async (): Promise<DiskSpaceInfo | null> => {
    const base = (await settingsService.ensureInitialized()) || (await settingsService.getProjectFolder()) || '';
    if (!base) return null;
    return await invoke<DiskSpaceInfo>('get_disk_space_info', { projectPath: base });
  });

  const storageUsed = () => {
    const bytes = diskInfo()?.used_disk_space_bytes || 0;
    return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
    };
  const storageTotal = () => {
    const bytes = diskInfo()?.total_disk_space_bytes || 0;
    return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
  };
  const storagePct = () => Math.min(100, Math.round(diskInfo()?.disk_usage_percentage || 0));
  const ioActivity = () => (storagePct() > 80 ? 'high' : storagePct() > 60 ? 'medium' : 'low');

  // Live system health (CPU/RAM)
  const [cpuPct, setCpuPct] = createSignal(0);
  const [memPct, setMemPct] = createSignal(0);
  onMount(() => {
    const tick = async () => {
      try {
        const v = await invoke<{ cpu_percent: number; memory_percent: number }>('get_resource_usage');
        setCpuPct(Math.round(v.cpu_percent));
        setMemPct(Math.round(v.memory_percent));
      } catch {
        setCpuPct(0); setMemPct(0);
      }
    };
    void tick();
    const id = globalThis.setInterval(tick, 3000);
    return () => { try { globalThis.clearInterval(id as unknown as number); } catch { /* noop */ } };
  });

  const getHealthLevel = (cpu: number, memory: number) => {
    const avgUsage = (cpu + memory) / 2;
    if (avgUsage < 60) return 'excellent';
    if (avgUsage < 80) return 'good';
    if (avgUsage < 90) return 'fair';
    return 'poor';
  };

  // System health not yet wired to real CPU/MEM metrics; derive a basic network-based health
  const currentHealth = getHealthLevel(cpuPct(), memPct());

  return (
    <div class={`${styles['status-bar']} ${styles.futuristic}`}>
      <div class={styles['scan-line']}></div>

      {/* Network Status Card */}
      <div
        class={`${styles['status-section']} ${styles['network-status']}`}
        data-status={'good'}
      >
        <div class={styles['status-icon-container']}>
          <div class={`${styles['icon-glow']} ${styles.network}`}></div>
          <Globe size={20} class={styles['status-icon-main'] as string} />
          <div class={styles['connection-pulse']}></div>
        </div>
        <div class={styles['status-content']}>
          <div class={styles['status-title']}>
            <span class={styles['title-text']}>{t('statusBar.network.title')}</span>
          </div>
          <div class={styles['status-metrics']}>
            <div class={`${styles['metric-row']} ${styles.primary}`}>
              <span class={styles['metric-value']}>{net.connectedPeers()}</span>
              <span class={styles['metric-unit']}>{t('statusBar.network.peers')}</span>
            </div>
            <div class={`${styles['metric-row']} ${styles.secondary}`}>
              <span class={styles['metric-value']}>{net.downloadMbps()} MB/s</span>
            </div>
          </div>
          <div class={styles['status-footer']}>
            <span class={styles['footer-stat']}>
              {t('statusBar.network.latency', { latency: net.metrics()?.performance?.averageLatency || 0 })}
            </span>
          </div>
        </div>
        <div class={styles['card-border-flow']}></div>
      </div>

      {/* Downloads Status Card */}
      <div
        class={`${styles['status-section']} ${styles['download-status']}`}
        data-activity={(Number(net.downloadMbps()) > 0 || Number(net.uploadMbps()) > 0) ? 'active' : 'idle'}
      >
        <div class={styles['status-icon-container']}>
          <div class={`${styles['icon-glow']} ${styles.download}`}></div>
          <Download size={20} class={styles['status-icon-main'] as string} />
          {(Number(net.downloadMbps()) > 0 || Number(net.uploadMbps()) > 0) && (
            <div class={styles['activity-pulse']}></div>
          )}
        </div>
        <div class={styles['status-content']}>
          <div class={styles['status-title']}>
            <span class={styles['title-text']}>{t('statusBar.downloads.title')}</span>
          </div>
          <div class={styles['status-metrics']}>
            <div class={`${styles['metric-row']} ${styles.primary}`}>
              <span class={styles['metric-value']}>{net.downloadMbps()} MB/s</span>
              <span class={styles['metric-unit']}>{t('statusBar.downloads.downSpeed')}</span>
            </div>
            <div class={`${styles['metric-row']} ${styles.secondary}`}>
              <span class={styles['metric-value']}>{net.uploadMbps()} MB/s</span>
              <span class={styles['metric-unit']}>{t('statusBar.downloads.upSpeed')}</span>
            </div>
          </div>
          <div class={styles['status-footer']}></div>
        </div>
        <div class={styles['card-border-flow']}></div>
      </div>

      {/* Storage Status Card */}
      <div
        class={`${styles['status-section']} ${styles['storage-status']}`}
        data-usage={ioActivity()}
      >
        <div class={styles['status-icon-container']}>
          <div class={`${styles['icon-glow']} ${styles.storage}`}></div>
          <HardDrive size={20} class={styles['status-icon-main'] as string} />
          <div class={styles['io-indicator']} data-activity={ioActivity()}></div>
        </div>
        <div class={styles['status-content']}>
          <div class={styles['status-title']}>
            <span class={styles['title-text']}>{t('statusBar.storage.title')}</span>
          </div>
          <div class={styles['status-metrics']}>
            <div class={`${styles['metric-row']} ${styles.primary}`}>
              <span class={`${styles['metric-value']} ${styles['storage-used']}`}>{storageUsed()}</span>
              <span class={styles['metric-separator']}>/</span>
              <span class={styles['metric-total']}>{storageTotal()}</span>
            </div>
            <div class={styles['storage-progress']}>
              <div class={styles['storage-bar']}>
                <div
                  class={styles['storage-fill']}
                  style={`width: ${storagePct()}%`}
                  data-level={storagePct() > 80 ? 'critical' : storagePct() > 60 ? 'warning' : 'normal'}
                ></div>
              </div>
              <span class={styles['storage-percentage']}>{storagePct()}%</span>
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
            <span class={styles['title-text']}>{t('statusBar.system.title')}</span>
          </div>
          <div class={styles['status-metrics']}>
            <div class={styles['health-stats']}>
              <div class={styles['health-stat']}>
                <span class={styles['stat-label']}>{t('statusBar.system.cpu')}</span>
                <span class={styles['stat-value']}>{cpuPct()}%</span>
                <div class={styles['stat-bar']}>
                  <div class={`${styles['stat-fill']} ${styles.cpu}`} style={`width: ${cpuPct()}%`}></div>
                </div>
              </div>
              <div class={styles['health-stat']}>
                <span class={styles['stat-label']}>{t('statusBar.system.memory')}</span>
                <span class={styles['stat-value']}>{memPct()}%</span>
                <div class={styles['stat-bar']}>
                  <div class={`${styles['stat-fill']} ${styles.memory}`} style={`width: ${memPct()}%`}></div>
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
        data-status={net.tor()?.circuitEstablished ? 'active' : 'inactive'}
      >
        <div class={styles['status-icon-container']}>
          <div class={`${styles['icon-glow']} ${styles.cultural}`}></div>
          <Shield size={20} class={styles['status-icon-main'] as string} />
          <div class={styles['protection-shield']}></div>
        </div>
        <div class={styles['status-content']}>
          <div class={styles['status-title']}>
            <span class={styles['title-text']}>{t('statusBar.cultural.title')}</span>
          </div>
          <div class={styles['status-metrics']}>
            <div class={`${styles['metric-row']} ${styles.primary}`}>
              <span class={`${styles['metric-value']} ${styles['cultural-status']}`}>
                {net.tor()?.circuitEstablished ? 'active' : 'inactive'}
              </span>
              <span class={styles['metric-unit']}>{t('statusBar.cultural.statusLabel')}</span>
            </div>
            <div class={`${styles['metric-row']} ${styles.secondary}`}>
              <span class={`${styles['metric-value']} ${styles['cultural-sensitivity']}`}>
                {net.tor()?.circuitEstablished ? 'verified' : 'unknown'}
              </span>
            </div>
          </div>
          <div class={styles['status-footer']}>
            <span class={styles['footer-stat']}>
              {t('statusBar.cultural.lastScan', { time: net.lastSyncAt() ? 'agora' : '—' })}
            </span>
          </div>
        </div>
        <div class={styles['card-border-flow']}></div>
      </div>
    </div>
  );
};

export default StatusBar;

