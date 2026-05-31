import { type Component, Show, type Accessor } from 'solid-js';
import { Badge } from '@/components/foundation/Badge';
import { Button } from '@/components/foundation/Button';
import {
  onionBadgeLabel,
  useNetworkPresenceResource,
  type NetworkPresence,
} from '@/hooks/network/useNetworkPresence';
import { useNetworkLobby } from '@/hooks/api/useNetworkLobby';
import { useTransferState } from '@/hooks/api/useTransferState';
import styles from './OnionStatusBar.module.css';

export type OnionStatusBarVariant = 'compact' | 'sidebar' | 'toolbar' | 'actions';

export interface OnionStatusBarProps {
  variant: OnionStatusBarVariant;
  showNodeCount?: boolean;
  showOnlineIndicator?: boolean;
  onStartOnion?: () => void | Promise<void>;
  startingOnion?: boolean;
  class?: string;
}

function toolbarLabel(presence: Accessor<NetworkPresence>): string {
  const p = presence();
  if (p.onionActive) return 'Onion';
  if (p.mode === 'bootstrapping') return 'Bootstrapping';
  if (p.online) return 'Cache only';
  return 'Offline';
}

export const OnionStatusBar: Component<OnionStatusBarProps> = props => {
  const { presence } = useNetworkPresenceResource();
  const lobby = useNetworkLobby();
  const transfer = useTransferState();

  const syncStale = () => Boolean(lobby.syncError());

  return (
    <Show
      when={props.variant === 'actions'}
      fallback={
        <Show
          when={props.variant === 'sidebar'}
          fallback={
            <Show
              when={props.variant === 'toolbar'}
              fallback={
                <div class={`${styles.compactRow} ${props.class ?? ''}`}>
                  <Show when={props.showOnlineIndicator}>
                    <span
                      class={`${styles.onlineDot} ${presence().online ? styles.onlineDotOn : styles.onlineDotOff}`}
                      title={presence().online ? 'Online' : 'Offline'}
                    />
                  </Show>
                  <Badge variant={presence().onionActive ? 'success' : 'secondary'}>
                    {onionBadgeLabel(presence())}
                  </Badge>
                </div>
              }
            >
              <div class={`${styles.row} ${props.class ?? ''}`}>
                <div
                  class={styles.pill}
                  data-on={presence().onionActive ? '1' : '0'}
                  title={onionBadgeLabel(presence())}
                >
                  <span
                    class={`${styles.pillDot} ${presence().onionActive ? styles.pillDotOn : styles.pillDotOff}`}
                  />
                  <span>{toolbarLabel(presence)}</span>
                </div>
                <Show when={syncStale()}>
                  <span class={`${styles.pill} ${styles.stale}`} title={lobby.syncError()}>
                    Stale cache
                  </span>
                </Show>
                <Show when={props.startingOnion}>
                  <span class={styles.pill}>Starting…</span>
                </Show>
                <Show when={!presence().onionActive && !props.startingOnion && props.onStartOnion}>
                  <Button variant="outline" size="sm" onClick={() => void props.onStartOnion?.()}>
                    Start onion share
                  </Button>
                </Show>
              </div>
            </Show>
          }
        >
          <div class={`${styles.sidebarStack} ${props.class ?? ''}`}>
            <div
              class={styles.pill}
              data-on={presence().onionActive ? '1' : '0'}
              title={presence().onionActive ? 'Onion routing active' : 'Onion routing inactive'}
            >
              <span
                class={`${styles.pillDot} ${presence().onionActive ? styles.pillDotOn : styles.pillDotOff}`}
              />
              <span>{presence().onionActive ? 'Onion' : 'No Onion'}</span>
            </div>
            <Show when={props.showNodeCount && (lobby.onlineNodes() > 0 || lobby.lastSyncAt())}>
              <div class={styles.pill} title="Nodes connected to the global tracker">
                <span class={`${styles.pillDot} ${styles.pillDotOn}`} />
                <span>
                  {lobby.onlineNodes()} node{lobby.onlineNodes() !== 1 ? 's' : ''} online
                </span>
              </div>
            </Show>
          </div>
        </Show>
      }
    >
      <div class={`${styles.actionsRow} ${props.class ?? ''}`}>
        <div class={styles.actionsInfo}>
          <strong>Onion share:</strong>
          <Badge variant={transfer.onionRunning() ? 'success' : 'secondary'}>
            {transfer.onionRunning() ? (transfer.onionAddress() ?? 'starting…') : 'stopped'}
          </Badge>
        </div>
        <div class={styles.actionsButtons}>
          <Button
            variant="primary"
            size="sm"
            disabled={transfer.busy() || transfer.onionRunning()}
            loading={transfer.busy()}
            onClick={() => void transfer.startOnionShare()}
          >
            Start
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={transfer.busy() || !transfer.onionRunning()}
            onClick={() => void transfer.stopOnionShare()}
          >
            Stop
          </Button>
        </div>
      </div>
    </Show>
  );
};
