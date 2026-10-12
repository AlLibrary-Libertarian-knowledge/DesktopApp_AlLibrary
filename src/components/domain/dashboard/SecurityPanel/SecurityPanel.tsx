import { type Component, createSignal, onMount, onCleanup, Show, For } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useTranslation } from '../../../../i18n/hooks';
import {
  Shield,
  RefreshCw,
  AlertTriangle,
  Globe,
  Zap,
  MapPin,
  Clock,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Wifi,
  Server,
  Router,
  Signal,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-solid';
import styles from './SecurityPanel.module.css';

interface SecurityInfo {
  public_ip?: string;
  local_ip?: string;
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
  is_vpn: boolean;
  is_proxy: boolean;
  is_tor: boolean;
  connection_type: string;
  latency_ms?: number;
  security_score: number;
  warnings: string[];
  ssl_available: boolean;
  timezone?: string;
}

const SecurityPanel: Component = () => {
  const { t } = useTranslation('components');

  const [securityInfo, setSecurityInfo] = createSignal<SecurityInfo | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [isRefreshing, setIsRefreshing] = createSignal(false);
  const [lastUpdated, setLastUpdated] = createSignal<Date | null>(null);
  const [hasError, setHasError] = createSignal(false);
  const [showFullIP, setShowFullIP] = createSignal(false);

  let unlisten: (() => void) | null = null;

  onMount(async () => {
    try {
      const security = await invoke<SecurityInfo>('get_security_info');
      setSecurityInfo(security);
      setLastUpdated(new Date());
      setIsLoading(false);

      unlisten = await listen<SecurityInfo>('security-info-updated', event => {
        setSecurityInfo(event.payload);
        setLastUpdated(new Date());
        setIsRefreshing(false);
      });
    } catch (error) {
      console.error('Failed to load security info:', error);
      setHasError(true);
      setIsLoading(false);
    }
  });

  onCleanup(() => {
    if (unlisten) {
      unlisten();
    }
  });

  const handleRefresh = async () => {
    if (isRefreshing()) return;

    setIsRefreshing(true);
    setHasError(false);
    try {
      const security = await invoke<SecurityInfo>('get_security_info');
      setSecurityInfo(security);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh security info:', error);
      setHasError(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSecurityColor = (score: number) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const getSecurityLevel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getSecurityIcon = (score: number) => {
    if (score >= 80) return ShieldCheck;
    if (score >= 60) return Shield;
    if (score >= 40) return ShieldAlert;
    return AlertTriangle;
  };

  const getConnectionIcon = (connectionType: string) => {
    if (connectionType.includes('VPN') || connectionType.includes('Proxy')) {
      return Shield;
    }
    if (connectionType.includes('WiFi')) {
      return Wifi;
    }
    if (connectionType.includes('Ethernet')) {
      return Router;
    }
    return Signal;
  };

  const maskIP = (ip: string) => {
    if (!ip) return '';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.**`;
    }
    return `${ip.substring(0, 8)}***`;
  };

  const getLatencyStatus = (latency?: number) => {
    if (!latency) return { status: 'unknown', color: 'gray', trend: 'stable' };
    if (latency < 50) return { status: 'excellent', color: 'green', trend: 'up' };
    if (latency < 150) return { status: 'good', color: 'blue', trend: 'up' };
    if (latency < 300) return { status: 'fair', color: 'yellow', trend: 'down' };
    return { status: 'poor', color: 'red', trend: 'down' };
  };

  const getThreatLevel = () => {
    const info = securityInfo();
    if (!info) return 'unknown';

    let threats = 0;
    if (info.is_tor) threats += 3;
    if (info.is_proxy) threats += 2;
    if (info.is_vpn) threats += 1;
    if (info.warnings.length > 0) threats += info.warnings.length;

    if (threats === 0) return 'minimal';
    if (threats <= 2) return 'low';
    if (threats <= 4) return 'moderate';
    return 'high';
  };

  return (
    <div class={styles['security-panel']}>
      <div class={styles['security-panel-header']}>
        <div class={styles['header-left']}>
          <div class={styles['header-icon']} aria-hidden="true">
            <Shield size={18} />
          </div>
          <div class={styles['header-text']}>
            <h3>{t('securityPanel.title')}</h3>
            <p>{t('securityPanel.subtitle')}</p>
          </div>
        </div>
        <div class={styles['header-actions']}>
          <button
            type="button"
            class={`${styles['refresh-btn']} ${isRefreshing() ? styles['refreshing'] : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing()}
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>
              {isRefreshing() ? t('securityPanel.refreshing') : t('securityPanel.refreshAction')}
            </span>
          </button>
        </div>
      </div>

      <Show when={isLoading()}>
        <div class={styles['security-loading']}>
          <div class={styles['loading-content']}>
            <div class={styles['loading-animation']}>
              <div class={styles['loading-spinner-large']} />
              <div class={styles['loading-dots']}>
                <span />
                <span />
                <span />
              </div>
            </div>
            <h4>{t('securityPanel.loadingTitle')}</h4>
            <p>{t('securityPanel.loadingMessage')}</p>
          </div>
        </div>
      </Show>

      <Show when={!isLoading() && hasError()}>
        <div class={styles['security-error']}>
          <div class={styles['error-content']}>
            <div class={styles['error-icon']}>
              <AlertTriangle size={48} />
            </div>
            <h4>{t('securityPanel.errorTitle')}</h4>
            <p>{t('securityPanel.errorMessage')}</p>
            <button class={styles['retry-btn']} onClick={handleRefresh}>
              <RefreshCw size={16} />
              <span>{t('securityPanel.retryAction')}</span>
            </button>
          </div>
        </div>
      </Show>

      <Show when={!isLoading() && !hasError() && securityInfo()}>
        <div class={styles['security-content']}>
          <div class={styles['security-overview']}>
            <div class={styles['score-section']}>
              <div
                class={`${styles['score-display']} ${styles[getSecurityColor(securityInfo()!.security_score)]}`}
                style={{
                  '--score': String(securityInfo()!.security_score),
                }}
              >
                <div class={styles['score-circle']} aria-hidden="true">
                  <div class={styles['score-inner']}>
                    <span class={styles['score-number']}>{securityInfo()!.security_score}</span>
                    <span class={styles['score-label']}>{t('securityPanel.scoreLabel')}</span>
                  </div>
                </div>
              </div>

              <div class={styles['score-details']}>
                <div class={styles['level-row']}>
                  {(() => {
                    const Icon = getSecurityIcon(securityInfo()!.security_score);
                    return (
                      <span
                        class={`${styles['level-icon']} ${styles[getSecurityColor(securityInfo()!.security_score)]}`}
                        aria-hidden="true"
                      >
                        <Icon size={16} />
                      </span>
                    );
                  })()}
                  <h4
                    class={`${styles['security-level']} ${styles[getSecurityColor(securityInfo()!.security_score)]}`}
                  >
                    {t(
                      `securityPanel.levels.${getSecurityLevel(securityInfo()!.security_score).toLowerCase()}`
                    )}{' '}
                    {t('securityPanel.securityLevel')}
                  </h4>
                </div>
                <p class={styles['score-description']}>
                  {securityInfo()!.security_score >= 80
                    ? t('securityPanel.descriptions.excellent')
                    : securityInfo()!.security_score >= 60
                      ? t('securityPanel.descriptions.good')
                      : securityInfo()!.security_score >= 40
                        ? t('securityPanel.descriptions.fair')
                        : t('securityPanel.descriptions.poor')}
                </p>

                <div class={`${styles['threat-indicator']} ${styles[getThreatLevel()]}`}>
                  <span class={styles['threat-icon']} aria-hidden="true">
                    {getThreatLevel() === 'minimal' ? (
                      <CheckCircle size={14} />
                    ) : getThreatLevel() === 'low' ? (
                      <Info size={14} />
                    ) : getThreatLevel() === 'moderate' ? (
                      <AlertTriangle size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}
                  </span>
                  <span class={styles['threat-text']}>
                    {t(`securityPanel.threats.${getThreatLevel()}`)}{' '}
                    {t('securityPanel.threatLevel')}
                  </span>
                </div>
              </div>
            </div>

            <div class={styles['quick-stats']}>
              <div class={styles['stat-item']}>
                <div class={styles['stat-icon-container']}>
                  <div class={styles['stat-icon']} aria-hidden="true">
                    {(() => {
                      const Icon = getConnectionIcon(securityInfo()!.connection_type);
                      return <Icon size={16} />;
                    })()}
                  </div>
                  <div class={`${styles['stat-indicator']} ${styles['active']}`} />
                </div>
                <div class={styles['stat-content']}>
                  <span class={styles['stat-label']}>{t('securityPanel.connectionType')}</span>
                  <span class={styles['stat-value']}>{securityInfo()!.connection_type}</span>
                </div>
              </div>

              <div class={styles['stat-item']}>
                <div class={styles['stat-icon-container']}>
                  <div class={styles['stat-icon']} aria-hidden="true">
                    <Activity size={16} />
                  </div>
                  <div
                    class={`${styles['stat-indicator']} ${styles[getLatencyStatus(securityInfo()!.latency_ms).status]}`}
                  />
                </div>
                <div class={styles['stat-content']}>
                  <span class={styles['stat-label']}>{t('securityPanel.networkLatency')}</span>
                  <div class={styles['stat-value-container']}>
                    <span
                      class={`${styles['stat-value']} ${styles[`latency-${getLatencyStatus(securityInfo()!.latency_ms).status}`]}`}
                    >
                      {securityInfo()!.latency_ms
                        ? `${securityInfo()!.latency_ms}ms`
                        : t('securityPanel.latency.testing')}
                    </span>
                    <span class={styles['stat-trend']} aria-hidden="true">
                      {getLatencyStatus(securityInfo()!.latency_ms).trend === 'up' ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div class={styles['stat-item']}>
                <div class={styles['stat-icon-container']}>
                  <div class={styles['stat-icon']} aria-hidden="true">
                    {securityInfo()!.ssl_available ? <Lock size={16} /> : <Unlock size={16} />}
                  </div>
                  <div
                    class={`${styles['stat-indicator']} ${styles[securityInfo()!.ssl_available ? 'available' : 'unavailable']}`}
                  />
                </div>
                <div class={styles['stat-content']}>
                  <span class={styles['stat-label']}>SSL/TLS</span>
                  <span
                    class={`${styles['stat-value']} ${styles[securityInfo()!.ssl_available ? 'available' : 'unavailable']}`}
                  >
                    {securityInfo()!.ssl_available ? 'Secured' : 'Unsecured'}
                  </span>
                </div>
              </div>

              <div class={styles['stat-item']}>
                <div class={styles['stat-icon-container']}>
                  <div class={styles['stat-icon']} aria-hidden="true">
                    <Server size={16} />
                  </div>
                  <div class={`${styles['stat-indicator']} ${styles['active']}`} />
                </div>
                <div class={styles['stat-content']}>
                  <span class={styles['stat-label']}>Peer Status</span>
                  <span class={styles['stat-value']}>Connected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Identity / location / analysis — equal-rhythm detail cards */}
          <div class={styles['info-grid']}>
            <article class={`${styles['info-card']} ${styles['card-identity']}`}>
              <header class={styles['info-header']}>
                <div class={styles['header-icon-wrapper']} aria-hidden="true">
                  <Globe size={16} />
                </div>
                <div class={styles['header-copy']}>
                  <h4>Network Identity</h4>
                  <p>Endpoint addressing</p>
                </div>
              </header>
              <dl class={styles['info-content']}>
                <div class={`${styles['info-row']} ${styles['primary']}`}>
                  <dt class={styles['info-label']}>Public IP</dt>
                  <dd class={styles['ip-display']}>
                    <span class={`${styles['info-value']} ${styles['mono']}`}>
                      {showFullIP()
                        ? securityInfo()!.public_ip || 'Not detected'
                        : maskIP(securityInfo()!.public_ip || '') || 'Not detected'}
                    </span>
                    <button
                      type="button"
                      class={styles['ip-toggle']}
                      onClick={() => setShowFullIP(!showFullIP())}
                      aria-label={showFullIP() ? 'Hide IP address' : 'Show full IP address'}
                      title={showFullIP() ? 'Hide IP address' : 'Show full IP address'}
                    >
                      {showFullIP() ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </dd>
                </div>
                <div class={styles['info-row']}>
                  <dt class={styles['info-label']}>Local IP</dt>
                  <dd class={`${styles['info-value']} ${styles['mono']}`}>
                    {securityInfo()!.local_ip || 'Not detected'}
                  </dd>
                </div>
                <div class={styles['info-row']}>
                  <dt class={styles['info-label']}>Provider</dt>
                  <dd class={styles['info-value']}>{securityInfo()!.isp || 'Unknown'}</dd>
                </div>
                <div class={styles['card-spacer']} aria-hidden="true" />
              </dl>
            </article>

            <article class={`${styles['info-card']} ${styles['card-location']}`}>
              <header class={styles['info-header']}>
                <div class={styles['header-icon-wrapper']} aria-hidden="true">
                  <MapPin size={16} />
                </div>
                <div class={styles['header-copy']}>
                  <h4>Geographic Location</h4>
                  <p>Resolved from public IP</p>
                </div>
              </header>
              <dl class={styles['info-content']}>
                <div class={`${styles['info-row']} ${styles['primary']}`}>
                  <dt class={styles['info-label']}>Country</dt>
                  <dd class={styles['info-value']}>{securityInfo()!.country || 'Unknown'}</dd>
                </div>
                <div class={styles['info-row']}>
                  <dt class={styles['info-label']}>Region</dt>
                  <dd class={styles['info-value']}>{securityInfo()!.region || 'Unknown'}</dd>
                </div>
                <div class={styles['info-row']}>
                  <dt class={styles['info-label']}>City</dt>
                  <dd class={styles['info-value']}>{securityInfo()!.city || 'Unknown'}</dd>
                </div>
                <div class={styles['info-row']}>
                  <dt class={styles['info-label']}>Timezone</dt>
                  <dd class={`${styles['info-value']} ${styles['truncate']}`}>
                    {securityInfo()!.timezone || 'Unknown'}
                  </dd>
                </div>
              </dl>
            </article>

            <article class={`${styles['info-card']} ${styles['card-security']}`}>
              <header class={styles['info-header']}>
                <div class={styles['header-icon-wrapper']} aria-hidden="true">
                  <Shield size={16} />
                </div>
                <div class={styles['header-copy']}>
                  <h4>Security Analysis</h4>
                  <p>Privacy path signals</p>
                </div>
              </header>
              <div class={styles['info-content']}>
                <ul class={styles['signal-list']}>
                  <li class={styles['signal-row']}>
                    <div class={styles['signal-copy']}>
                      <span class={styles['signal-label']}>VPN</span>
                      <span class={styles['signal-hint']}>Privacy layer</span>
                    </div>
                    <span
                      class={`${styles['status-badge']} ${securityInfo()!.is_vpn ? styles['warning'] : styles['success']}`}
                    >
                      {securityInfo()!.is_vpn ? (
                        <AlertTriangle size={11} />
                      ) : (
                        <CheckCircle size={11} />
                      )}
                      <span>{securityInfo()!.is_vpn ? 'Detected' : 'Clear'}</span>
                    </span>
                  </li>
                  <li class={styles['signal-row']}>
                    <div class={styles['signal-copy']}>
                      <span class={styles['signal-label']}>Proxy</span>
                      <span class={styles['signal-hint']}>Intermediary hop</span>
                    </div>
                    <span
                      class={`${styles['status-badge']} ${securityInfo()!.is_proxy ? styles['warning'] : styles['success']}`}
                    >
                      {securityInfo()!.is_proxy ? (
                        <AlertTriangle size={11} />
                      ) : (
                        <CheckCircle size={11} />
                      )}
                      <span>{securityInfo()!.is_proxy ? 'Detected' : 'Clear'}</span>
                    </span>
                  </li>
                  <li class={styles['signal-row']}>
                    <div class={styles['signal-copy']}>
                      <span class={styles['signal-label']}>TOR</span>
                      <span class={styles['signal-hint']}>Onion routing</span>
                    </div>
                    <span
                      class={`${styles['status-badge']} ${securityInfo()!.is_tor ? styles['info'] : styles['success']}`}
                    >
                      {securityInfo()!.is_tor ? <Info size={11} /> : <CheckCircle size={11} />}
                      <span>{securityInfo()!.is_tor ? 'Active' : 'Inactive'}</span>
                    </span>
                  </li>
                </ul>

                <div class={styles['metrics-strip']}>
                  <div class={styles['metric-cell']}>
                    <span class={styles['metric-label']}>Method</span>
                    <span class={`${styles['metric-value']} ${styles['truncate']}`}>
                      {securityInfo()!.connection_type}
                    </span>
                  </div>
                  <div class={styles['metric-cell']}>
                    <span class={styles['metric-label']}>Latency</span>
                    <span
                      class={`${styles['metric-value']} ${styles['mono']} ${styles[`latency-${getLatencyStatus(securityInfo()!.latency_ms).status}`]}`}
                    >
                      {securityInfo()!.latency_ms ? `${securityInfo()!.latency_ms}ms` : '—'}
                    </span>
                  </div>
                  <div class={styles['metric-cell']}>
                    <span class={styles['metric-label']}>SSL</span>
                    <span
                      class={`${styles['metric-value']} ${styles[securityInfo()!.ssl_available ? 'ssl-available' : 'ssl-unavailable']}`}
                    >
                      {securityInfo()!.ssl_available ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Enhanced Warnings Section */}
          <Show when={securityInfo()!.warnings.length > 0}>
            <div class={`${styles['warnings-section']} ${styles['enhanced']}`}>
              <div class={styles['warnings-header']}>
                <div class={styles['warning-icon-container']}>
                  <AlertTriangle size={20} />
                  <div class={styles['warning-pulse']} />
                </div>
                <div class={styles['warnings-title']}>
                  <h4>Security Alerts</h4>
                  <p>Issues requiring your attention</p>
                </div>
                <div class={styles['warning-count']}>
                  <span class={styles['count-number']}>{securityInfo()!.warnings.length}</span>
                  <span class={styles['count-label']}>
                    alert{securityInfo()!.warnings.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div class={styles['warnings-list']}>
                <For each={securityInfo()!.warnings}>
                  {(warning, index) => (
                    <div class={`${styles['warning-item']} ${styles['enhanced']}`}>
                      <div class={styles['warning-indicator']}>
                        <AlertCircle size={16} />
                        <span class={styles['warning-number']}>{index() + 1}</span>
                      </div>
                      <div class={styles['warning-content']}>
                        <span class={styles['warning-text']}>{warning}</span>
                      </div>
                      <div class={`${styles['warning-severity']} ${styles['high']}`}>High</div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          <div class={styles['security-footer']}>
            <div class={styles['footer-content']}>
              <div class={styles['last-updated']}>
                <Clock size={13} aria-hidden="true" />
                <span>Last updated: {lastUpdated()?.toLocaleTimeString() || 'Never'}</span>
              </div>
              <div class={styles['footer-actions']}>
                <button
                  type="button"
                  class={styles['footer-btn']}
                  onClick={() =>
                    window.open('https://allibrary.org/security', '_blank', 'noopener,noreferrer')
                  }
                >
                  <Info size={13} aria-hidden="true" />
                  <span>Security Guide</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default SecurityPanel;
