import { Component, createSignal, onMount, onCleanup, Show, For } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
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
  const [securityInfo, setSecurityInfo] = createSignal<SecurityInfo | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [isRefreshing, setIsRefreshing] = createSignal(false);
  const [lastUpdated, setLastUpdated] = createSignal<Date | null>(null);
  const [hasError, setHasError] = createSignal(false);
  const [showFullIP, setShowFullIP] = createSignal(false);
  const [expandedCard, setExpandedCard] = createSignal<string | null>(null);

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
    return ip.substring(0, 8) + '***';
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
      {/* Enhanced Header */}
      <div class={styles['security-panel-header']}>
        <div class={styles['header-left']}>
          <div class={styles['header-icon-container']}>
            <div class={styles['header-icon']}>
              <Shield size={24} />
            </div>
            <div class={styles['header-pulse']}></div>
          </div>
          <div class={styles['header-text']}>
            <h3>Network Security Analysis</h3>
            <p>Real-time security monitoring for cultural heritage networks</p>
          </div>
        </div>
        <div class={styles['header-actions']}>
          <button
            class={`${styles['refresh-btn']} ${isRefreshing() ? styles['refreshing'] : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing()}
          >
            <RefreshCw size={16} />
            <span>{isRefreshing() ? 'Analyzing...' : 'Refresh Analysis'}</span>
          </button>
        </div>
      </div>

      <Show when={isLoading()}>
        <div class={styles['security-loading']}>
          <div class={styles['loading-content']}>
            <div class={styles['loading-animation']}>
              <div class={styles['loading-spinner-large']} />
              <div class={styles['loading-dots']}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <h4>Analyzing Network Security</h4>
            <p>Performing comprehensive security assessment...</p>
          </div>
        </div>
      </Show>

      <Show when={!isLoading() && hasError()}>
        <div class={styles['security-error']}>
          <div class={styles['error-content']}>
            <div class={styles['error-icon']}>
              <AlertTriangle size={48} />
            </div>
            <h4>Unable to Load Security Information</h4>
            <p>
              Failed to retrieve network security data. Please check your connection and try again.
            </p>
            <button class={styles['retry-btn']} onClick={handleRefresh}>
              <RefreshCw size={16} />
              <span>Retry Analysis</span>
            </button>
          </div>
        </div>
      </Show>

      <Show when={!isLoading() && !hasError() && securityInfo()}>
        <div class={styles['security-content']}>
          {/* Enhanced Security Score Overview */}
          <div class={styles['security-overview']}>
            <div class={styles['score-section']}>
              <div
                class={`${styles['score-display']} ${styles[getSecurityColor(securityInfo()!.security_score)]}`}
                style={{
                  '--score': securityInfo()!.security_score,
                  '--score-color':
                    getSecurityColor(securityInfo()!.security_score) === 'excellent'
                      ? '#22c55e'
                      : getSecurityColor(securityInfo()!.security_score) === 'good'
                        ? '#3b82f6'
                        : getSecurityColor(securityInfo()!.security_score) === 'fair'
                          ? '#f59e0b'
                          : '#ef4444',
                  '--score-color-rgb':
                    getSecurityColor(securityInfo()!.security_score) === 'excellent'
                      ? '34, 197, 94'
                      : getSecurityColor(securityInfo()!.security_score) === 'good'
                        ? '59, 130, 246'
                        : getSecurityColor(securityInfo()!.security_score) === 'fair'
                          ? '245, 158, 11'
                          : '239, 68, 68',
                }}
              >
                <div class={styles['score-circle-large']}>
                  <div class={styles['score-inner']}>
                    <span class={styles['score-number-large']}>
                      {securityInfo()!.security_score}
                    </span>
                    <span class={styles['score-label']}>Security Score</span>
                  </div>
                  <div class={styles['score-ring']}></div>
                  <div class={styles['score-glow']}></div>
                </div>
                <div class={styles['score-icon']}>
                  {(() => {
                    const Icon = getSecurityIcon(securityInfo()!.security_score);
                    return <Icon size={24} />;
                  })()}
                </div>
              </div>

              <div class={styles['score-details']}>
                <h4
                  class={`${styles['security-level']} ${styles[getSecurityColor(securityInfo()!.security_score)]}`}
                >
                  {getSecurityLevel(securityInfo()!.security_score)} Security
                </h4>
                <p class={styles['score-description']}>
                  {securityInfo()!.security_score >= 80
                    ? 'Your connection is secure and optimal for cultural heritage work.'
                    : securityInfo()!.security_score >= 60
                      ? 'Minor security concerns detected. Monitor your connection.'
                      : securityInfo()!.security_score >= 40
                        ? 'Moderate security risks. Consider reviewing your setup.'
                        : 'Multiple security issues detected. Please review warnings immediately.'}
                </p>

                {/* Threat Level Indicator */}
                <div class={`${styles['threat-indicator']} ${styles[getThreatLevel()]}`}>
                  <div class={styles['threat-icon']}>
                    {getThreatLevel() === 'minimal' ? (
                      <CheckCircle size={16} />
                    ) : getThreatLevel() === 'low' ? (
                      <Info size={16} />
                    ) : getThreatLevel() === 'moderate' ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <XCircle size={16} />
                    )}
                  </div>
                  <span class={styles['threat-text']}>
                    {getThreatLevel().charAt(0).toUpperCase() + getThreatLevel().slice(1)} Threat
                    Level
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Quick Stats */}
            <div class={styles['quick-stats']}>
              <div class={`${styles['stat-item']} ${styles['enhanced']}`}>
                <div class={styles['stat-icon-container']}>
                  <div class={styles['stat-icon']}>
                    {(() => {
                      const Icon = getConnectionIcon(securityInfo()!.connection_type);
                      return <Icon size={20} />;
                    })()}
                  </div>
                  <div class={`${styles['stat-indicator']} ${styles['active']}`}></div>
                </div>
                <div class={styles['stat-content']}>
                  <span class={styles['stat-label']}>Connection Type</span>
                  <span class={styles['stat-value']}>{securityInfo()!.connection_type}</span>
                </div>
              </div>

              <div class={`${styles['stat-item']} ${styles['enhanced']}`}>
                <div class={styles['stat-icon-container']}>
                  <div class={styles['stat-icon']}>
                    <Activity size={20} />
                  </div>
                  <div
                    class={`${styles['stat-indicator']} ${styles[getLatencyStatus(securityInfo()!.latency_ms).status]}`}
                  ></div>
                </div>
                <div class={styles['stat-content']}>
                  <span class={styles['stat-label']}>Network Latency</span>
                  <div class={styles['stat-value-container']}>
                    <span
                      class={`${styles['stat-value']} ${styles[`latency-${getLatencyStatus(securityInfo()!.latency_ms).status}`]}`}
                    >
                      {securityInfo()!.latency_ms
                        ? `${securityInfo()!.latency_ms}ms`
                        : 'Testing...'}
                    </span>
                    <div class={styles['stat-trend']}>
                      {getLatencyStatus(securityInfo()!.latency_ms).trend === 'up' ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div class={`${styles['stat-item']} ${styles['enhanced']}`}>
                <div class={styles['stat-icon-container']}>
                  <div class={styles['stat-icon']}>
                    {securityInfo()!.ssl_available ? <Lock size={20} /> : <Unlock size={20} />}
                  </div>
                  <div
                    class={`${styles['stat-indicator']} ${styles[securityInfo()!.ssl_available ? 'available' : 'unavailable']}`}
                  ></div>
                </div>
                <div class={styles['stat-content']}>
                  <span class={styles['stat-label']}>SSL/TLS Security</span>
                  <span
                    class={`${styles['stat-value']} ${styles[securityInfo()!.ssl_available ? 'available' : 'unavailable']}`}
                  >
                    {securityInfo()!.ssl_available ? 'Secured' : 'Unsecured'}
                  </span>
                </div>
              </div>

              <div class={`${styles['stat-item']} ${styles['enhanced']}`}>
                <div class={styles['stat-icon-container']}>
                  <div class={styles['stat-icon']}>
                    <Server size={20} />
                  </div>
                  <div class={`${styles['stat-indicator']} ${styles['active']}`}></div>
                </div>
                <div class={styles['stat-content']}>
                  <span class={styles['stat-label']}>Peer Status</span>
                  <span class={styles['stat-value']}>Connected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Information Grid */}
          <div class={styles['info-grid']}>
            {/* IP Information Card */}
            <div
              class={`${styles['info-card']} ${styles['enhanced']} ${expandedCard() === 'ip' ? styles['expanded'] : ''}`}
              onClick={() => setExpandedCard(expandedCard() === 'ip' ? null : 'ip')}
            >
              <div class={styles['info-header']}>
                <div class={styles['header-icon-wrapper']}>
                  <Globe size={18} />
                </div>
                <h4>Network Identity</h4>
                <div class={styles['expand-indicator']}>{expandedCard() === 'ip' ? '−' : '+'}</div>
              </div>
              <div class={styles['info-content']}>
                <div class={`${styles['info-row']} ${styles['highlighted']}`}>
                  <span class={styles['info-label']}>Public IP:</span>
                  <div class={styles['ip-display']}>
                    <span class={`${styles['info-value']} ${styles['ip-value']}`}>
                      {showFullIP()
                        ? securityInfo()!.public_ip || 'Not detected'
                        : maskIP(securityInfo()!.public_ip || '')}
                    </span>
                    <button
                      class={styles['ip-toggle']}
                      onClick={e => {
                        e.stopPropagation();
                        setShowFullIP(!showFullIP());
                      }}
                      title={showFullIP() ? 'Hide IP address' : 'Show full IP address'}
                    >
                      {showFullIP() ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div class={styles['info-row']}>
                  <span class={styles['info-label']}>Local IP:</span>
                  <span class={styles['info-value']}>
                    {securityInfo()!.local_ip || 'Not detected'}
                  </span>
                </div>
                <div class={styles['info-row']}>
                  <span class={styles['info-label']}>Internet Provider:</span>
                  <span class={styles['info-value']}>{securityInfo()!.isp || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Location Information Card */}
            <div
              class={`${styles['info-card']} ${styles['enhanced']} ${expandedCard() === 'location' ? styles['expanded'] : ''}`}
              onClick={() => setExpandedCard(expandedCard() === 'location' ? null : 'location')}
            >
              <div class={styles['info-header']}>
                <div class={styles['header-icon-wrapper']}>
                  <MapPin size={18} />
                </div>
                <h4>Geographic Location</h4>
                <div class={styles['expand-indicator']}>
                  {expandedCard() === 'location' ? '−' : '+'}
                </div>
              </div>
              <div class={styles['info-content']}>
                <div class={`${styles['info-row']} ${styles['highlighted']}`}>
                  <span class={styles['info-label']}>Country:</span>
                  <span class={styles['info-value']}>{securityInfo()!.country || 'Unknown'}</span>
                </div>
                <div class={styles['info-row']}>
                  <span class={styles['info-label']}>Region:</span>
                  <span class={styles['info-value']}>{securityInfo()!.region || 'Unknown'}</span>
                </div>
                <div class={styles['info-row']}>
                  <span class={styles['info-label']}>City:</span>
                  <span class={styles['info-value']}>{securityInfo()!.city || 'Unknown'}</span>
                </div>
                <div class={styles['info-row']}>
                  <span class={styles['info-label']}>Timezone:</span>
                  <span class={styles['info-value']}>{securityInfo()!.timezone || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Security Details Card */}
            <div
              class={`${styles['info-card']} ${styles['enhanced']} ${expandedCard() === 'security' ? styles['expanded'] : ''}`}
              onClick={() => setExpandedCard(expandedCard() === 'security' ? null : 'security')}
            >
              <div class={styles['info-header']}>
                <div class={styles['header-icon-wrapper']}>
                  <Shield size={18} />
                </div>
                <h4>Security Analysis</h4>
                <div class={styles['expand-indicator']}>
                  {expandedCard() === 'security' ? '−' : '+'}
                </div>
              </div>
              <div class={styles['info-content']}>
                <div class={`${styles['feature-row']} ${styles['enhanced']}`}>
                  <div class={styles['feature-info']}>
                    <span class={styles['feature-label']}>VPN Detection:</span>
                    <span class={styles['feature-description']}>Privacy layer analysis</span>
                  </div>
                  <div class={styles['feature-status']}>
                    {securityInfo()!.is_vpn ? (
                      <div class={`${styles['status-badge']} ${styles['warning']}`}>
                        <AlertTriangle size={14} />
                        <span>Detected</span>
                      </div>
                    ) : (
                      <div class={`${styles['status-badge']} ${styles['success']}`}>
                        <CheckCircle size={14} />
                        <span>Clear</span>
                      </div>
                    )}
                  </div>
                </div>

                <div class={`${styles['feature-row']} ${styles['enhanced']}`}>
                  <div class={styles['feature-info']}>
                    <span class={styles['feature-label']}>Proxy Detection:</span>
                    <span class={styles['feature-description']}>Intermediary server analysis</span>
                  </div>
                  <div class={styles['feature-status']}>
                    {securityInfo()!.is_proxy ? (
                      <div class={`${styles['status-badge']} ${styles['warning']}`}>
                        <AlertTriangle size={14} />
                        <span>Detected</span>
                      </div>
                    ) : (
                      <div class={`${styles['status-badge']} ${styles['success']}`}>
                        <CheckCircle size={14} />
                        <span>Clear</span>
                      </div>
                    )}
                  </div>
                </div>

                <div class={`${styles['feature-row']} ${styles['enhanced']}`}>
                  <div class={styles['feature-info']}>
                    <span class={styles['feature-label']}>TOR Network:</span>
                    <span class={styles['feature-description']}>Anonymous routing detection</span>
                  </div>
                  <div class={styles['feature-status']}>
                    {securityInfo()!.is_tor ? (
                      <div class={`${styles['status-badge']} ${styles['info']}`}>
                        <Info size={14} />
                        <span>Active</span>
                      </div>
                    ) : (
                      <div class={`${styles['status-badge']} ${styles['success']}`}>
                        <CheckCircle size={14} />
                        <span>Inactive</span>
                      </div>
                    )}
                  </div>
                </div>

                <div class={styles['info-row']}>
                  <span class={styles['info-label']}>Connection Method:</span>
                  <span class={styles['info-value']}>{securityInfo()!.connection_type}</span>
                </div>

                <div class={styles['info-row']}>
                  <span class={styles['info-label']}>Network Latency:</span>
                  <span
                    class={`${styles['info-value']} ${styles[`latency-${getLatencyStatus(securityInfo()!.latency_ms).status}`]}`}
                  >
                    {securityInfo()!.latency_ms ? `${securityInfo()!.latency_ms}ms` : 'Testing...'}
                  </span>
                </div>

                <div class={styles['info-row']}>
                  <span class={styles['info-label']}>SSL Security:</span>
                  <span
                    class={`${styles['info-value']} ${styles[securityInfo()!.ssl_available ? 'ssl-available' : 'ssl-unavailable']}`}
                  >
                    {securityInfo()!.ssl_available ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Warnings Section */}
          <Show when={securityInfo()!.warnings.length > 0}>
            <div class={`${styles['warnings-section']} ${styles['enhanced']}`}>
              <div class={styles['warnings-header']}>
                <div class={styles['warning-icon-container']}>
                  <AlertTriangle size={20} />
                  <div class={styles['warning-pulse']}></div>
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

          {/* Enhanced Footer */}
          <div class={styles['security-footer']}>
            <div class={styles['footer-content']}>
              <div class={styles['last-updated']}>
                <Clock size={14} />
                <span>Last updated: {lastUpdated()?.toLocaleTimeString() || 'Never'}</span>
              </div>
              <div class={styles['footer-actions']}>
                <button
                  class={styles['footer-btn']}
                  onClick={() => window.open('https://allibrary.org/security', '_blank')}
                >
                  <Info size={14} />
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
