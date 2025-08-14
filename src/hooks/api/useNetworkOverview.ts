import { createResource } from 'solid-js';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';
import { torAdapter } from '@/services/network/torAdapter';

export const useNetworkOverview = () => {
  const [nodeStatus] = createResource(async () => {
    try {
      return await p2pNetworkService.getNodeStatus();
    } catch (e) {
      console.error('Node status error', e);
      return undefined as any;
    }
  });

  const [metrics] = createResource(async () => {
    try {
      return await p2pNetworkService.getNetworkMetrics();
    } catch (e) {
      console.error('Network metrics error', e);
      return undefined as any;
    }
  });

  const [torStatus] = createResource(async () => {
    try {
      return await torAdapter.status();
    } catch (e) {
      console.error('Tor status error', e);
      return undefined as any;
    }
  });

  return { nodeStatus, metrics, torStatus };
};


