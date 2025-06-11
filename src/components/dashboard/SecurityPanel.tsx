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
import './SecurityPanel.css';

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
    <div class="security-panel">
      {/* Enhanced Header */}
      <div class="security-panel-header">
        <div class="header-left">
          <div class="header-icon-container">
            <div class="header-icon">
              <Shield size={24} />
            </div>
            <div class="header-pulse"></div>
          </div>
          <div class="header-text">
            <h3>Network Security Analysis</h3>
            <p>Real-time security monitoring for cultural heritage networks</p>
          </div>
        </div>
        <div class="header-actions">
          <button
            class={`refresh-btn ${isRefreshing() ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing()}
          >
            <RefreshCw size={16} />
            <span>{isRefreshing() ? 'Analyzing...' : 'Refresh Analysis'}</span>
          </button>
        </div>
      </div>

      <Show when={isLoading()}>
        <div class="security-loading">
          <div class="loading-content">
            <div class="loading-animation">
              <div class="loading-spinner-large" />
              <div class="loading-dots">
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
        <div class="security-error">
          <div class="error-content">
            <div class="error-icon">
              <AlertTriangle size={48} />
            </div>
            <h4>Unable to Load Security Information</h4>
            <p>
              Failed to retrieve network security data. Please check your connection and try again.
            </p>
            <button class="retry-btn" onClick={handleRefresh}>
              <RefreshCw size={16} />
              <span>Retry Analysis</span>
            </button>
          </div>
        </div>
      </Show>

      <Show when={!isLoading() && !hasError() && securityInfo()}>
        <div class="security-content">
          {/* Enhanced Security Score Overview */}
          <div class="security-overview">
            <div class="score-section">
              <div
                class={`score-display ${getSecurityColor(securityInfo()!.security_score)}`}
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
                <div class="score-circle-large">
                  <div class="score-inner">
                    <span class="score-number-large">{securityInfo()!.security_score}</span>
                    <span class="score-label">Security Score</span>
                  </div>
                  <div class="score-ring"></div>
                  <div class="score-glow"></div>
                </div>
                <div class="score-icon">
                  {(() => {
                    const Icon = getSecurityIcon(securityInfo()!.security_score);
                    return <Icon size={24} />;
                  })()}
                </div>
              </div>

              <div class="score-details">
                <h4 class={`security-level ${getSecurityColor(securityInfo()!.security_score)}`}>
                  {getSecurityLevel(securityInfo()!.security_score)} Security
                </h4>
                <p class="score-description">
                  {securityInfo()!.security_score >= 80
                    ? 'Your connection is secure and optimal for cultural heritage work.'
                    : securityInfo()!.security_score >= 60
                      ? 'Minor security concerns detected. Monitor your connection.'
                      : securityInfo()!.security_score >= 40
                        ? 'Moderate security risks. Consider reviewing your setup.'
                        : 'Multiple security issues detected. Please review warnings immediately.'}
                </p>

                {/* Threat Level Indicator */}
                <div class={`threat-indicator ${getThreatLevel()}`}>
                  <div class="threat-icon">
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
                  <span class="threat-text">
                    {getThreatLevel().charAt(0).toUpperCase() + getThreatLevel().slice(1)} Threat
                    Level
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Quick Stats */}
            <div class="quick-stats">
              <div class="stat-item enhanced">
                <div class="stat-icon-container">
                  <div class="stat-icon">
                    {(() => {
                      const Icon = getConnectionIcon(securityInfo()!.connection_type);
                      return <Icon size={20} />;
                    })()}
                  </div>
                  <div class="stat-indicator active"></div>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Connection Type</span>
                  <span class="stat-value">{securityInfo()!.connection_type}</span>
                </div>
              </div>

              <div class="stat-item enhanced">
                <div class="stat-icon-container">
                  <div class="stat-icon">
                    <Activity size={20} />
                  </div>
                  <div
                    class={`stat-indicator ${getLatencyStatus(securityInfo()!.latency_ms).status}`}
                  ></div>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Network Latency</span>
                  <div class="stat-value-container">
                    <span
                      class={`stat-value latency-${getLatencyStatus(securityInfo()!.latency_ms).status}`}
                    >
                      {securityInfo()!.latency_ms
                        ? `${securityInfo()!.latency_ms}ms`
                        : 'Testing...'}
                    </span>
                    <div class="stat-trend">
                      {getLatencyStatus(securityInfo()!.latency_ms).trend === 'up' ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div class="stat-item enhanced">
                <div class="stat-icon-container">
                  <div class="stat-icon">
                    {securityInfo()!.ssl_available ? <Lock size={20} /> : <Unlock size={20} />}
                  </div>
                  <div
                    class={`stat-indicator ${securityInfo()!.ssl_available ? 'available' : 'unavailable'}`}
                  ></div>
                </div>
                <div class="stat-content">
                  <span class="stat-label">SSL/TLS Security</span>
                  <span
                    class={`stat-value ${securityInfo()!.ssl_available ? 'available' : 'unavailable'}`}
                  >
                    {securityInfo()!.ssl_available ? 'Secured' : 'Unsecured'}
                  </span>
                </div>
              </div>

              <div class="stat-item enhanced">
                <div class="stat-icon-container">
                  <div class="stat-icon">
                    <Server size={20} />
                  </div>
                  <div class="stat-indicator active"></div>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Peer Status</span>
                  <span class="stat-value">Connected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Information Grid */}
          <div class="info-grid">
            {/* IP Information Card */}
            <div
              class={`info-card enhanced ${expandedCard() === 'ip' ? 'expanded' : ''}`}
              onClick={() => setExpandedCard(expandedCard() === 'ip' ? null : 'ip')}
            >
              <div class="info-header">
                <div class="header-icon-wrapper">
                  <Globe size={18} />
                </div>
                <h4>Network Identity</h4>
                <div class="expand-indicator">{expandedCard() === 'ip' ? '−' : '+'}</div>
              </div>
              <div class="info-content">
                <div class="info-row highlighted">
                  <span class="info-label">Public IP:</span>
                  <div class="ip-display">
                    <span class="info-value ip-value">
                      {showFullIP()
                        ? securityInfo()!.public_ip || 'Not detected'
                        : maskIP(securityInfo()!.public_ip || '')}
                    </span>
                    <button
                      class="ip-toggle"
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
                <div class="info-row">
                  <span class="info-label">Local IP:</span>
                  <span class="info-value">{securityInfo()!.local_ip || 'Not detected'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Internet Provider:</span>
                  <span class="info-value">{securityInfo()!.isp || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Location Information Card */}
            <div
              class={`info-card enhanced ${expandedCard() === 'location' ? 'expanded' : ''}`}
              onClick={() => setExpandedCard(expandedCard() === 'location' ? null : 'location')}
            >
              <div class="info-header">
                <div class="header-icon-wrapper">
                  <MapPin size={18} />
                </div>
                <h4>Geographic Location</h4>
                <div class="expand-indicator">{expandedCard() === 'location' ? '−' : '+'}</div>
              </div>
              <div class="info-content">
                <div class="info-row highlighted">
                  <span class="info-label">Country:</span>
                  <span class="info-value">{securityInfo()!.country || 'Unknown'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Region:</span>
                  <span class="info-value">{securityInfo()!.region || 'Unknown'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">City:</span>
                  <span class="info-value">{securityInfo()!.city || 'Unknown'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Timezone:</span>
                  <span class="info-value">{securityInfo()!.timezone || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Security Features Card */}
            <div
              class={`info-card enhanced ${expandedCard() === 'security' ? 'expanded' : ''}`}
              onClick={() => setExpandedCard(expandedCard() === 'security' ? null : 'security')}
            >
              <div class="info-header">
                <div class="header-icon-wrapper">
                  <Shield size={18} />
                </div>
                <h4>Security Analysis</h4>
                <div class="expand-indicator">{expandedCard() === 'security' ? '−' : '+'}</div>
              </div>
              <div class="info-content">
                <div class="feature-row enhanced">
                  <div class="feature-info">
                    <span class="feature-label">VPN Detection:</span>
                    <span class="feature-description">Privacy layer analysis</span>
                  </div>
                  <div class="feature-status">
                    {securityInfo()!.is_vpn ? (
                      <div class="status-badge warning">
                        <AlertTriangle size={14} />
                        <span>Detected</span>
                      </div>
                    ) : (
                      <div class="status-badge success">
                        <CheckCircle size={14} />
                        <span>Clear</span>
                      </div>
                    )}
                  </div>
                </div>

                <div class="feature-row enhanced">
                  <div class="feature-info">
                    <span class="feature-label">Proxy Detection:</span>
                    <span class="feature-description">Intermediary server check</span>
                  </div>
                  <div class="feature-status">
                    {securityInfo()!.is_proxy ? (
                      <div class="status-badge warning">
                        <AlertTriangle size={14} />
                        <span>Detected</span>
                      </div>
                    ) : (
                      <div class="status-badge success">
                        <CheckCircle size={14} />
                        <span>Clear</span>
                      </div>
                    )}
                  </div>
                </div>

                <div class="feature-row enhanced">
                  <div class="feature-info">
                    <span class="feature-label">Tor Network:</span>
                    <span class="feature-description">Anonymity network scan</span>
                  </div>
                  <div class="feature-status">
                    {securityInfo()!.is_tor ? (
                      <div class="status-badge danger">
                        <XCircle size={14} />
                        <span>Detected</span>
                      </div>
                    ) : (
                      <div class="status-badge success">
                        <CheckCircle size={14} />
                        <span>Clear</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Network Performance Card */}
            <div
              class={`info-card enhanced ${expandedCard() === 'performance' ? 'expanded' : ''}`}
              onClick={() =>
                setExpandedCard(expandedCard() === 'performance' ? null : 'performance')
              }
            >
              <div class="info-header">
                <div class="header-icon-wrapper">
                  <Activity size={18} />
                </div>
                <h4>Performance Metrics</h4>
                <div class="expand-indicator">{expandedCard() === 'performance' ? '−' : '+'}</div>
              </div>
              <div class="info-content">
                <div class="performance-metric enhanced">
                  <div class="metric-header">
                    <span class="metric-label">Connection Quality:</span>
                    <span class="metric-score">
                      {getLatencyStatus(securityInfo()!.latency_ms).status.toUpperCase()}
                    </span>
                  </div>
                  <div class="metric-bar-container">
                    <div class="metric-bar">
                      <div
                        class={`metric-fill ${getLatencyStatus(securityInfo()!.latency_ms).status}`}
                        style={`width: ${Math.max(10, 100 - (securityInfo()!.latency_ms || 0) / 5)}%`}
                      />
                    </div>
                    <div class="metric-percentage">
                      {Math.max(10, 100 - (securityInfo()!.latency_ms || 0) / 5).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div class="info-row highlighted">
                  <span class="info-label">Response Time:</span>
                  <span
                    class={`info-value latency-${getLatencyStatus(securityInfo()!.latency_ms).status}`}
                  >
                    {securityInfo()!.latency_ms ? `${securityInfo()!.latency_ms}ms` : 'Testing...'}
                  </span>
                </div>

                <div class="info-row">
                  <span class="info-label">SSL Security:</span>
                  <span
                    class={`info-value ${securityInfo()!.ssl_available ? 'ssl-available' : 'ssl-unavailable'}`}
                  >
                    {securityInfo()!.ssl_available ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Warnings Section */}
          <Show when={securityInfo()!.warnings.length > 0}>
            <div class="warnings-section enhanced">
              <div class="warnings-header">
                <div class="warning-icon-container">
                  <AlertTriangle size={20} />
                  <div class="warning-pulse"></div>
                </div>
                <div class="warnings-title">
                  <h4>Security Alerts</h4>
                  <p>Issues requiring your attention</p>
                </div>
                <div class="warning-count">
                  <span class="count-number">{securityInfo()!.warnings.length}</span>
                  <span class="count-label">
                    alert{securityInfo()!.warnings.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div class="warnings-list">
                <For each={securityInfo()!.warnings}>
                  {(warning, index) => (
                    <div class="warning-item enhanced">
                      <div class="warning-indicator">
                        <AlertCircle size={16} />
                        <span class="warning-number">{index() + 1}</span>
                      </div>
                      <div class="warning-content">
                        <span class="warning-text">{warning}</span>
                      </div>
                      <div class="warning-severity high">High</div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Enhanced Footer */}
          <Show when={lastUpdated()}>
            <div class="panel-footer enhanced">
              <div class="update-info">
                <div class="update-icon">
                  <Clock size={14} />
                </div>
                <div class="update-details">
                  <span class="update-label">Last Analysis:</span>
                  <span class="update-time">{lastUpdated()!.toLocaleString()}</span>
                </div>
              </div>
              <div class="cultural-notice">
                <div class="notice-icon">
                  <Shield size={14} />
                </div>
                <span class="notice-text">Optimized for cultural heritage networks</span>
              </div>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};

export default SecurityPanel;
