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
  start: async (_config?: TorFrontendConfig): Promise<TorFrontendStatus> => ({
    ...DISABLED_STATUS,
  }),
  status: async (): Promise<TorFrontendStatus> => ({ ...DISABLED_STATUS }),
  enableBridges: async (_bridges: string[]): Promise<boolean> => false,
  useSocks: async (_addr: string): Promise<boolean> => false,
  createHiddenService: async (_localPort: number): Promise<string> => '',
  rotateCircuit: async (): Promise<boolean> => false,
  getLogTail: async (_lines = 200): Promise<string> => 'Coming soon: networking backend disabled.',
};
