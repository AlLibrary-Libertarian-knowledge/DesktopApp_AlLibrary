import { Component, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Shield, RefreshCw, AlertTriangle, Globe, Zap } from 'lucide-solid';
import styles from './SecurityBadge.module.css';

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

const SecurityBadge: Component = () => {
  const [securityInfo, setSecurityInfo] = createSignal<SecurityInfo | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [isRefreshing, setIsRefreshing] = createSignal(false);
  const [lastUpdated, setLastUpdated] = createSignal<Date | null>(null);

  let unlisten: (() => void) | null = null;

  onMount(async () => {
    try {
      // Load initial security info
      const security = await invoke<SecurityInfo>('get_security_info');
      setSecurityInfo(security);
      setLastUpdated(new Date());
      setIsLoading(false);

      // Listen for security updates
      unlisten = await listen<SecurityInfo>('security-info-updated', event => {
        setSecurityInfo(event.payload);
        setLastUpdated(new Date());
        setIsRefreshing(false);
      });
    } catch (error) {
      console.error('Failed to load security info:', error);
      setIsLoading(false);
      // Set a fallback state or error indicator if needed
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

  const getConnectionIcon = (connectionType: string) => {
    if (connectionType.includes('VPN') || connectionType.includes('Proxy')) {
      return Shield;
    }
    if (connectionType.includes('Private')) {
      return Zap;
    }
    return Globe;
  };

  return (
    <div class="security-badge">
      <Show when={isLoading()}>
        <div class="security-loading">
          <div class="loading-spinner" />
          <span>Analyzing...</span>
        </div>
      </Show>

      <Show when={!isLoading() && securityInfo()}>
        <div class="security-content">
          {/* Security Score Circle */}
          <div class={`security-score ${getSecurityColor(securityInfo()!.security_score)}`}>
            <div class="score-circle">
              <span class="score-number">{securityInfo()!.security_score}</span>
            </div>
          </div>

          {/* Connection Info */}
          <div class="connection-info">
            <div class="connection-header">
              <div class="connection-icon">
                {(() => {
                  const Icon = getConnectionIcon(securityInfo()!.connection_type);
                  return <Icon size={14} />;
                })()}
              </div>
              <span class="connection-type">{securityInfo()!.connection_type}</span>
            </div>

            <div class="location-info">
              <Show when={securityInfo()!.country}>
                <span class="country">{securityInfo()!.country}</span>
              </Show>
              <Show when={securityInfo()!.latency_ms}>
                <span class="latency">{securityInfo()!.latency_ms}ms</span>
              </Show>
            </div>
          </div>

          {/* Warnings Indicator */}
          <Show when={securityInfo()!.warnings.length > 0}>
            <div class="warnings-indicator" title={securityInfo()!.warnings.join('; ')}>
              <AlertTriangle size={14} />
              <span class="warning-count">{securityInfo()!.warnings.length}</span>
            </div>
          </Show>

          {/* Refresh Button */}
          <button
            class={`refresh-button ${isRefreshing() ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing()}
            title="Refresh security analysis"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Last Updated */}
        <Show when={lastUpdated()}>
          <div class="last-updated">Updated {lastUpdated()!.toLocaleTimeString()}</div>
        </Show>
      </Show>
    </div>
  );
};

export default SecurityBadge;
