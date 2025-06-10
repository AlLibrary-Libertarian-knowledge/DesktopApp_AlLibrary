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
    try {
      await invoke('refresh_security_info');
    } catch (error) {
      console.error('Failed to refresh security info:', error);
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

  const getConnectionIcon = (connectionType: string) => {
    if (connectionType.includes('VPN') || connectionType.includes('Proxy')) {
      return Shield;
    }
    if (connectionType.includes('Private')) {
      return Zap;
    }
    return Globe;
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
    if (!latency) return { status: 'unknown', color: 'gray' };
    if (latency < 50) return { status: 'excellent', color: 'green' };
    if (latency < 150) return { status: 'good', color: 'blue' };
    if (latency < 300) return { status: 'fair', color: 'yellow' };
    return { status: 'poor', color: 'red' };
  };

  return (
    <div class="security-panel">
      <div class="security-panel-header">
        <div class="header-left">
          <Shield size={24} class="header-icon" />
          <div class="header-text">
            <h3>Network Security Analysis</h3>
            <p>Comprehensive security monitoring for cultural heritage preservation</p>
          </div>
        </div>
        <div class="header-actions">
          <button
            class={`refresh-btn ${isRefreshing() ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing()}
          >
            <RefreshCw size={16} />
            {isRefreshing() ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
        </div>
      </div>

      <Show when={isLoading()}>
        <div class="security-loading">
          <div class="loading-content">
            <div class="loading-spinner-large" />
            <h4>Analyzing Network Security</h4>
            <p>Performing comprehensive security assessment...</p>
          </div>
        </div>
      </Show>

      <Show when={!isLoading() && securityInfo()}>
        <div class="security-content">
          {/* Security Score Overview */}
          <div class="security-overview">
            <div class="score-section">
              <div class={`score-display ${getSecurityColor(securityInfo()!.security_score)}`}>
                <div class="score-circle-large">
                  <span class="score-number-large">{securityInfo()!.security_score}</span>
                  <span class="score-label">Security Score</span>
                </div>
              </div>
              <div class="score-details">
                <h4 class={`security-level ${getSecurityColor(securityInfo()!.security_score)}`}>
                  {getSecurityLevel(securityInfo()!.security_score)} Security
                </h4>
                <p class="score-description">
                  {securityInfo()!.security_score >= 80
                    ? 'Your connection is secure and suitable for cultural heritage work.'
                    : securityInfo()!.security_score >= 60
                      ? 'Minor security concerns detected. Monitor your connection.'
                      : securityInfo()!.security_score >= 40
                        ? 'Moderate security risks. Consider reviewing your setup.'
                        : 'Multiple security issues detected. Please review warnings.'}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div class="quick-stats">
              <div class="stat-item">
                <div class="stat-icon">
                  {(() => {
                    const Icon = getConnectionIcon(securityInfo()!.connection_type);
                    return <Icon size={20} />;
                  })()}
                </div>
                <div class="stat-content">
                  <span class="stat-label">Connection</span>
                  <span class="stat-value">{securityInfo()!.connection_type}</span>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon">
                  <Clock size={20} />
                </div>
                <div class="stat-content">
                  <span class="stat-label">Latency</span>
                  <span
                    class={`stat-value latency-${getLatencyStatus(securityInfo()!.latency_ms).status}`}
                  >
                    {securityInfo()!.latency_ms ? `${securityInfo()!.latency_ms}ms` : 'Unknown'}
                  </span>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon">
                  {securityInfo()!.ssl_available ? <Lock size={20} /> : <Unlock size={20} />}
                </div>
                <div class="stat-content">
                  <span class="stat-label">SSL/TLS</span>
                  <span
                    class={`stat-value ${securityInfo()!.ssl_available ? 'available' : 'unavailable'}`}
                  >
                    {securityInfo()!.ssl_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Information Grid */}
          <div class="info-grid">
            {/* IP Information */}
            <div
              class={`info-card ${expandedCard() === 'ip' ? 'expanded' : ''}`}
              onClick={() => setExpandedCard(expandedCard() === 'ip' ? null : 'ip')}
            >
              <div class="info-header">
                <Globe size={18} />
                <h4>IP Address Information</h4>
                <div class="expand-indicator">{expandedCard() === 'ip' ? '−' : '+'}</div>
              </div>
              <div class="info-content">
                <div class="info-row">
                  <span class="info-label">Public IP:</span>
                  <div class="ip-display">
                    <span class="info-value">
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
                  <span class="info-label">ISP:</span>
                  <span class="info-value">{securityInfo()!.isp || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div
              class={`info-card ${expandedCard() === 'location' ? 'expanded' : ''}`}
              onClick={() => setExpandedCard(expandedCard() === 'location' ? null : 'location')}
            >
              <div class="info-header">
                <MapPin size={18} />
                <h4>Geographic Location</h4>
                <div class="expand-indicator">{expandedCard() === 'location' ? '−' : '+'}</div>
              </div>
              <div class="info-content">
                <div class="info-row">
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

            {/* Security Features */}
            <div
              class={`info-card ${expandedCard() === 'security' ? 'expanded' : ''}`}
              onClick={() => setExpandedCard(expandedCard() === 'security' ? null : 'security')}
            >
              <div class="info-header">
                <Shield size={18} />
                <h4>Security Features</h4>
                <div class="expand-indicator">{expandedCard() === 'security' ? '−' : '+'}</div>
              </div>
              <div class="info-content">
                <div class="feature-row">
                  <span class="feature-label">VPN Detection:</span>
                  <div class="feature-status">
                    {securityInfo()!.is_vpn ? (
                      <>
                        <AlertTriangle size={16} class="status-warning" />
                        <span class="status-text warning">Detected</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} class="status-success" />
                        <span class="status-text success">Not detected</span>
                      </>
                    )}
                  </div>
                </div>
                <div class="feature-row">
                  <span class="feature-label">Proxy Detection:</span>
                  <div class="feature-status">
                    {securityInfo()!.is_proxy ? (
                      <>
                        <AlertTriangle size={16} class="status-warning" />
                        <span class="status-text warning">Detected</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} class="status-success" />
                        <span class="status-text success">Not detected</span>
                      </>
                    )}
                  </div>
                </div>
                <div class="feature-row">
                  <span class="feature-label">Tor Network:</span>
                  <div class="feature-status">
                    {securityInfo()!.is_tor ? (
                      <>
                        <XCircle size={16} class="status-error" />
                        <span class="status-text error">Detected</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} class="status-success" />
                        <span class="status-text success">Not detected</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Network Performance */}
            <div
              class={`info-card ${expandedCard() === 'performance' ? 'expanded' : ''}`}
              onClick={() =>
                setExpandedCard(expandedCard() === 'performance' ? null : 'performance')
              }
            >
              <div class="info-header">
                <Activity size={18} />
                <h4>Network Performance</h4>
                <div class="expand-indicator">{expandedCard() === 'performance' ? '−' : '+'}</div>
              </div>
              <div class="info-content">
                <div class="performance-metric">
                  <span class="metric-label">Connection Quality:</span>
                  <div class="metric-bar">
                    <div
                      class={`metric-fill ${getLatencyStatus(securityInfo()!.latency_ms).status}`}
                      style={`width: ${Math.max(10, 100 - (securityInfo()!.latency_ms || 0) / 5)}%`}
                    />
                  </div>
                  <span class="metric-value">
                    {getLatencyStatus(securityInfo()!.latency_ms).status.toUpperCase()}
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">Response Time:</span>
                  <span
                    class={`info-value latency-${getLatencyStatus(securityInfo()!.latency_ms).status}`}
                  >
                    {securityInfo()!.latency_ms ? `${securityInfo()!.latency_ms}ms` : 'Testing...'}
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">SSL Support:</span>
                  <span
                    class={`info-value ${securityInfo()!.ssl_available ? 'ssl-available' : 'ssl-unavailable'}`}
                  >
                    {securityInfo()!.ssl_available ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings Section */}
          <Show when={securityInfo()!.warnings.length > 0}>
            <div class="warnings-section">
              <div class="warnings-header">
                <AlertTriangle size={20} />
                <h4>Security Warnings</h4>
                <span class="warning-count">{securityInfo()!.warnings.length} issue(s)</span>
              </div>
              <div class="warnings-list">
                <For each={securityInfo()!.warnings}>
                  {warning => (
                    <div class="warning-item">
                      <AlertCircle size={16} />
                      <span>{warning}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Last Updated */}
          <Show when={lastUpdated()}>
            <div class="panel-footer">
              <div class="update-info">
                <Clock size={14} />
                <span>Last updated: {lastUpdated()!.toLocaleString()}</span>
              </div>
              <div class="cultural-notice">
                <Shield size={14} />
                <span>Analysis optimized for cultural heritage preservation networks</span>
              </div>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};

export default SecurityPanel;
