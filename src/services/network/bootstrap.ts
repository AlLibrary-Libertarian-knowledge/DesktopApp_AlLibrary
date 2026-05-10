import { torAdapter } from './torAdapter';
import { p2pNetworkService } from './p2pNetworkService';
import { NodeStatus } from '@/types/Network';

export interface EnableTorResult {
  torConnected: boolean;
  p2pStarted: boolean;
}

export const enableTorAndP2P = async (): Promise<EnableTorResult> => {
  try {
    await p2pNetworkService.startNode();
    const st = await torAdapter.status();
    return { torConnected: st.circuitEstablished, p2pStarted: true };
  } catch (e) {
    console.error('enableTorAndP2P failed', e);
    return { torConnected: false, p2pStarted: false };
  }
};
