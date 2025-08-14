import { Component } from 'solid-js';
import StatCard from '@/components/composite/StatCard/StatCard';
import { Users, Activity, Shield, TrendingUp, Gauge, Plug } from 'lucide-solid';

interface StatGridProps {
  peers: number | undefined;
  avgLatencyMs: number | undefined;
  torEstablished: boolean | undefined;
  supportsControl?: boolean;
}

export const StatGrid: Component<StatGridProps> = props => {
  return (
    <div style={{ display: 'grid', 'grid-template-columns': 'repeat(12, minmax(0,1fr))', gap: '14px' }}>
      <div style={{ 'grid-column': 'span 3' }}>
        <StatCard
          type="peers"
          icon={<Users size={18} />}
          number={`${props.peers ?? 0}`}
          label={'Connected Peers'}
          trendType={(props.peers ?? 0) >= 10 ? 'positive' : 'neutral'}
          trendIcon={<TrendingUp size={14} />}
          trendValue={(props.peers ?? 0) > 0 ? '+live' : '0'}
          graphType="peers"
        />
      </div>
      <div style={{ 'grid-column': 'span 3' }}>
        <StatCard
          type="health"
          icon={<Activity size={18} />}
          number={`${props.avgLatencyMs ?? 0}ms`}
          label={'Avg Latency'}
          trendType={(props.avgLatencyMs ?? 999) < 300 ? 'positive' : 'negative'}
          trendIcon={<Gauge size={14} />}
          trendValue={'live'}
          graphType="health"
        />
      </div>
      <div style={{ 'grid-column': 'span 3' }}>
        <StatCard
          type="health"
          icon={<Shield size={18} />}
          number={`${props.torEstablished ? 'High' : 'Low'}`}
          label={'Anonymity Level'}
          trendType={props.torEstablished ? 'positive' : 'negative'}
          trendIcon={<TrendingUp size={14} />}
          trendValue={props.supportsControl ? 'rotatable' : 'external socks'}
          graphType="chart"
        />
      </div>
      <div style={{ 'grid-column': 'span 3' }}>
        <StatCard
          type="documents"
          icon={<Plug size={18} />}
          number={`${props.torEstablished ? 'ON' : 'OFF'}`}
          label={'Tor Routing'}
          trendType={props.torEstablished ? 'positive' : 'negative'}
          trendIcon={<TrendingUp size={14} />}
          trendValue={props.torEstablished ? 'active' : 'inactive'}
          graphType="chart"
        />
      </div>
    </div>
  );
};

export default StatGrid;




