import { fetchNetworkPresence, onionShareStatus } from './onionShareService';

export interface TorFrontendConfig {
  bridgeSupport?: boolean;
  socksAddr?: string;
  bridges?: string[];
}
export interface TorFrontendStatus {
  bootstrapped: boolean;
  circuitEstablished: boolean;
  bridgesEnabled: boolean;
  socks?: string;
  supportsControl?: boolean;
}

const DISABLED_STATUS: TorFrontendStatus = {
  bootstrapped: false,
  circuitEstablished: false,
  bridgesEnabled: false,
  supportsControl: false,
};

export const torAdapter = {
  start: async (_config?: TorFrontendConfig): Promise<TorFrontendStatus> => {
    const p = await fetchNetworkPresence();
    return {
      bootstrapped: true,
      circuitEstablished: p.online,
      bridgesEnabled: false,
      supportsControl: true,
    };
  },
  status: async (): Promise<TorFrontendStatus> => {
    const p = await fetchNetworkPresence();
    return {
      bootstrapped: true,
      circuitEstablished: p.online,
      bridgesEnabled: false,
      supportsControl: true,
    };
  },
  enableBridges: async (_bridges: string[]): Promise<boolean> => false,
  useSocks: async (_addr: string): Promise<boolean> => false,
  createHiddenService: async (_localPort: number): Promise<string> => {
    const s = await onionShareStatus();
    return s.onion || '';
  },
  rotateCircuit: async (): Promise<boolean> => false,
  getLogTail: async (_lines = 200): Promise<string> =>
    'Onion mesh integrated. Check background service for logs.',
};
