import { torAdapter } from './torAdapter';
import { p2pNetworkService } from './p2pNetworkService';
import { NodeStatus } from '@/types/Network';

export interface EnableTorResult {
  torConnected: boolean;
  p2pStarted: boolean;
}

export const enableTorAndP2P = async (): Promise<EnableTorResult> => {
  try {
    // Initialize and (idempotently) start TOR using adapter aligned with Tauri commands
    await torAdapter.start({ bridgeSupport: true });

    // Initialize and start P2P with TOR routing
    await p2pNetworkService.initializeNode({ torSupport: true });
    await p2pNetworkService.startNode();
    await p2pNetworkService.enableTorRouting();

    // Wait up to ~30s for Tor circuit and node ONLINE
    const started = await (async () => {
      const timeout = Date.now() + 30000;
      while (Date.now() < timeout) {
        try {
          const ts = await torAdapter.status();
          if (!ts.circuitEstablished) {
            await new Promise(r => setTimeout(r, 500));
            continue;
          }
          const ns = await p2pNetworkService.getNodeStatus();
          if (ns.nodeStatus === NodeStatus.ONLINE) return true;
        } catch {}
        await new Promise(r => setTimeout(r, 500));
      }
      return false;
    })();

    const status = await torAdapter.status();
    return { torConnected: !!status?.circuitEstablished, p2pStarted: started };
  } catch (error) {
    console.error('enableTorAndP2P failed:', error);
    return { torConnected: false, p2pStarted: false };
  }
};


