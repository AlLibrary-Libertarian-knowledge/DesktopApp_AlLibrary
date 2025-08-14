import { Component } from 'solid-js';
import { Button } from '@/components/foundation/Button';
import { Badge } from '@/components/foundation/Badge';
import { Shield, RefreshCw, FileText, Network, Globe } from 'lucide-solid';

interface HeaderActionsProps {
  onEnable: () => void;
  onRotate: () => void;
  onShowLog: () => void;
  onRefresh: () => void;
  supportsControl?: boolean;
  autoEnabled: boolean;
  onToggleAuto: () => void;
}

export const HeaderActions: Component<HeaderActionsProps> = props => {
  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '10px', 'align-items': 'flex-end' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button variant="primary" onClick={props.onEnable}>
          <Shield size={16} /> Enable Private Networking
        </Button>
        <Button variant="outline" onClick={props.onRotate} disabled={!props.supportsControl} title={props.supportsControl ? 'Request a new Tor circuit' : 'Unavailable with external Tor SOCKS'}>
          <RefreshCw size={16} /> Rotate Circuit
        </Button>
        <Button variant="ghost" onClick={props.onShowLog}>
          <FileText size={16} /> Tor Log
        </Button>
        <Button variant="ghost" onClick={props.onRefresh}>Refresh</Button>
        <Button variant={props.autoEnabled ? 'secondary' : 'ghost'} onClick={props.onToggleAuto}>
          Auto: {props.autoEnabled ? 'ON' : 'OFF'}
        </Button>
      </div>
      <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap', 'justify-content': 'flex-end' }}>
        <Badge variant="secondary"><Network size={12} /> Internet + TOR</Badge>
        <Badge variant="secondary"><Globe size={12} /> No public IP exposure</Badge>
      </div>
    </div>
  );
};

export default HeaderActions;




