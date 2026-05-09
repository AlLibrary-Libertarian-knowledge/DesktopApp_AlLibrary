import { torAdapter } from './torAdapter';
import { p2pNetworkService } from './p2pNetworkService';
import { NodeStatus } from '@/types/Network';

export interface EnableTorResult {
  torConnected: boolean;
  p2pStarted: boolean;
}

export const enableTorAndP2P = async (): Promise<EnableTorResult> => {
  // Network stack intentionally disabled in shell mode.
  void torAdapter;
  void p2pNetworkService;
  void NodeStatus;
  return { torConnected: false, p2pStarted: false };
};
