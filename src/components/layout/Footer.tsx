import { type Component, createMemo } from 'solid-js';
import './Footer.css';
import { useNetworkStore } from '@/stores/network/networkStore';
import { useNetworkLobby } from '@/hooks/api/useNetworkLobby';
import { useNetworkPresenceResource } from '@/hooks/network/useNetworkPresence';

const Footer: Component = () => {
  const store = useNetworkStore();
  const lobby = useNetworkLobby();
  const { presence } = useNetworkPresenceResource();

  const connectedPeers = createMemo(() => Math.max(store.connectedPeers(), lobby.onlineNodes()));

  const torLabel = createMemo(() => {
    if (presence().onionActive) return 'Onion Active';
    return store.labelTorMode();
  });
  const lastSyncText = createMemo(() => {
    const ts = store.lastSyncAt();
    if (!ts) return '—';
    const sec = Math.max(1, Math.floor((Date.now() - ts) / 1000));
    const min = Math.floor(sec / 60);
    if (min <= 0) return 'just now';
    if (min === 1) return '1 minute ago';
    return `${min} minutes ago`;
  });

  return (
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-left">
          <div class="network-info">
            <span class="network-label">P2P Network:</span>
            <span class="peer-count">{connectedPeers()} peers connected</span>
            <span class="network-type">{torLabel()}</span>
          </div>

          <div class="sync-info">
            <span class="sync-label">Last sync:</span>
            <span class="sync-time">{lastSyncText()}</span>
          </div>
        </div>

        <div class="footer-right">
          <div class="version-info">
            <span class="app-version">AlLibrary v1.0.11</span>
            <span class="build-info">P2P Onion-Routing Active</span>
          </div>

          <div class="status-indicators">
            <span class="status-item">
              <span class="status-dot security-good" title="Security: Good" />
              <span class="status-label">Secure</span>
            </span>

            <span class="status-item">
              <span class="status-dot privacy-protected" title="Privacy: Protected" />
              <span class="status-label">Private</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
