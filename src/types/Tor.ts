export interface TorConfig {
  bridgeSupport?: boolean;
  obfuscation?: boolean;
  newCircuitPeriod?: number;
  maxCircuitDirtiness?: number;
  [key: string]: unknown;
}

export interface TorNode {
  id: string;
  config: {
    enableCulturalFiltering?: boolean;
    enableContentBlocking?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface HiddenService {
  serviceId: string;
  onionAddress?: string;
  [key: string]: unknown;
}

export interface TorConnection {
  connectionId: string;
  [key: string]: unknown;
}

export interface TorStatus {
  bootstrapped: boolean;
  circuitEstablished: boolean;
  [key: string]: unknown;
}

export interface OnionAddress {
  address: string;
  [key: string]: unknown;
}

export interface TorMetrics {
  [key: string]: unknown;
}

export interface CircuitInfo {
  [key: string]: unknown;
}
