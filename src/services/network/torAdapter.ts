import { invoke } from '@tauri-apps/api/core';

export interface TorFrontendConfig { bridgeSupport?: boolean; socksAddr?: string; bridges?: string[] }
export interface TorFrontendStatus { bootstrapped: boolean; circuitEstablished: boolean; bridgesEnabled: boolean; socks?: string; supportsControl?: boolean }

const mapStatus = (raw: any): TorFrontendStatus => ({
  bootstrapped: !!raw?.bootstrapped,
  circuitEstablished: !!raw?.circuit_established,
  bridgesEnabled: !!raw?.bridges_enabled,
  socks: raw?.socks,
  supportsControl: !!(raw?.supports_control ?? raw?.supportsControl),
});

export const torAdapter = {
  start: async (config?: TorFrontendConfig): Promise<TorFrontendStatus> => {
    const raw = await invoke<any>('init_tor_node', { config: { bridge_support: config?.bridgeSupport, socks_addr: config?.socksAddr, bridges: config?.bridges } });
    await invoke('start_tor');
    return mapStatus(raw);
  },
  status: async (): Promise<TorFrontendStatus> => mapStatus(await invoke<any>('get_tor_status')),
  enableBridges: async (bridges: string[]): Promise<boolean> => invoke<boolean>('enable_tor_bridges', { bridges }),
  useSocks: async (addr: string): Promise<boolean> => invoke<boolean>('use_tor_socks', { addr }),
  createHiddenService: async (localPort: number): Promise<string> => invoke<string>('create_hidden_service', { localPort }),
  rotateCircuit: async (): Promise<boolean> => invoke<boolean>('rotate_tor_circuit'),
  getLogTail: async (lines = 200): Promise<string> => invoke<string>('get_tor_log_tail', { lines }),
};



