export interface ContentHash {
  ipfsHash: string;
  gatewayUrl?: string;
  cid?: string;
}

export interface IPFSConfig {
  socksProxy?: string;
  publicGateways?: boolean;
  redundantPinning?: number;
  bridgeSupport?: boolean;
  obfuscation?: boolean;
  [key: string]: unknown;
}

export interface IPFSNode {
  id: string;
  config: {
    enableCulturalFiltering?: boolean;
    enableContentBlocking?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ContentMetadata {
  [key: string]: unknown;
}

export interface PinningStrategy {
  priority?: 'low' | 'normal' | 'high';
  redundancy?: number;
  educationalAccess?: boolean;
  antiCensorship?: boolean;
  culturalPreservation?: boolean;
  [key: string]: unknown;
}

export interface IPFSStats {
  [key: string]: unknown;
}
