// Utility functions for formatting data in the network graph

// Format time remaining for transfers
export const formatTimeRemaining = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// Format file size from KB to appropriate unit
export const formatFileSize = (sizeInKB: number): string => {
  if (sizeInKB < 1024) {
    return `${sizeInKB} KB`;
  } else if (sizeInKB < 1024 * 1024) {
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  } else {
    return `${(sizeInKB / (1024 * 1024)).toFixed(1)} GB`;
  }
};

// Format bandwidth for display
export const formatBandwidth = (bandwidthKBps: number): string => {
  if (bandwidthKBps < 1024) {
    return `${bandwidthKBps} KB/s`;
  } else {
    return `${(bandwidthKBps / 1024).toFixed(1)} MB/s`;
  }
};

// Format uptime in human readable format
export const formatUptime = (uptimeSeconds: number): string => {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Format latency with appropriate units and color coding
export const formatLatency = (latencyMs: number): { text: string; className: string } => {
  let className = 'latency-good';
  if (latencyMs > 500) className = 'latency-poor';
  else if (latencyMs > 200) className = 'latency-fair';

  return {
    text: `${latencyMs.toFixed(0)}ms`,
    className,
  };
};

// Format reliability percentage with color coding
export const formatReliability = (
  reliabilityPercent: number
): { text: string; className: string } => {
  let className = 'reliability-good';
  if (reliabilityPercent < 50) className = 'reliability-poor';
  else if (reliabilityPercent < 80) className = 'reliability-fair';

  return {
    text: `${reliabilityPercent.toFixed(0)}%`,
    className,
  };
};

// Format node type for display
export const formatNodeType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Format network type with appropriate icon
export const getNetworkTypeIcon = (networkType: string): string => {
  const icons = {
    tor: '🧅',
    internet: '🌐',
    hybrid: '🔄',
  };
  return icons[networkType as keyof typeof icons] || '◦';
};

// Get status color for various states
export const getStatusColor = (status: string): string => {
  const colors = {
    connected: '#10b981',
    connecting: '#f59e0b',
    disconnected: '#6b7280',
    error: '#ef4444',
  };
  return colors[status as keyof typeof colors] || '#6b7280';
};

// Format cultural specializations for display
export const formatSpecializations = (specializations: string[]): string[] => {
  return specializations.map(spec => spec.replace(/_/g, ' '));
};
