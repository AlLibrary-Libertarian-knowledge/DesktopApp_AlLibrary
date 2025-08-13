import { invoke } from '@tauri-apps/api/core';

export interface TorFrontendConfig { bridgeSupport?: boolean; socksAddr?: string }
export interface TorFrontendStatus { bootstrapped: boolean; circuitEstablished: boolean; bridgesEnabled: boolean; socks?: string }

export const torAdapter = {
  start: async (config?: TorFrontendConfig): Promise<TorFrontendStatus> => {
    const status = await invoke<TorFrontendStatus>('init_tor_node', { config: { bridgeSupport: config?.bridgeSupport, socksAddr: config?.socksAddr } });
    await invoke('start_tor');
    return status;
  },
  status: async (): Promise<TorFrontendStatus> => invoke<TorFrontendStatus>('get_tor_status'),
  enableBridges: async (bridges: string[]): Promise<boolean> => invoke<boolean>('enable_tor_bridges', { bridges }),
  useSocks: async (addr: string): Promise<boolean> => invoke<boolean>('use_tor_socks', { addr }),
  createHiddenService: async (localPort: number): Promise<string> => invoke<string>('create_hidden_service', { localPort }),
};


