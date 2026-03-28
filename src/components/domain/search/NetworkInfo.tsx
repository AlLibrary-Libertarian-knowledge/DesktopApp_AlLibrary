import { Component, createSignal, onCleanup, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import * as onionShare from '@/services/network/onionShareService';
import styles from './NetworkInfo.module.css';

interface NetworkInfoProps {
  class?: string;
}

export const NetworkInfo: Component<NetworkInfoProps> = (props) => {
  const [myAddress, setMyAddress] = createSignal<string>('');
  const [peerAddress, setPeerAddress] = createSignal<string>('');
  const [isLoading, setIsLoading] = createSignal(false);
  const [message, setMessage] = createSignal<string>('');
  const [connectedPeers, setConnectedPeers] = createSignal<string[]>([]);
  const [isExpanded, setIsExpanded] = createSignal(false);

  const [m5TrackerUrl, setM5TrackerUrl] = createSignal('');
  const [m5SharePublicly, setM5SharePublicly] = createSignal(true);
  const [m5Onion, setM5Onion] = createSignal('');
  const [m5Running, setM5Running] = createSignal(false);
  const [m5LocalShares, setM5LocalShares] = createSignal<onionShare.LocalShareEntry[]>([]);
  const [m5LobbySummary, setM5LobbySummary] = createSignal('');
  const [m5FetchLink, setM5FetchLink] = createSignal('');
  const [m5FetchOutDir, setM5FetchOutDir] = createSignal('');

  onMount(async () => {
    await loadNetworkInfo();
    await loadM5State();
    let unlistenLobby: UnlistenFn | undefined;
    try {
      unlistenLobby = await listen<onionShare.NetworkLobby>('onion-share-lobby', e => {
        const L = e.payload;
        setM5LobbySummary(`${L.online_nodes} online, ${L.files.length} file group(s)`);
      });
    } catch {
      /* non-Tauri / no events */
    }
    onCleanup(() => {
      unlistenLobby?.();
    });
  });

  const loadNetworkInfo = async () => {
    try {
      setIsLoading(true);
      
      // Get my onion address
      const address = await invoke<string>('get_my_onion_address');
      setMyAddress(address);
      
      // Get connected peers
      const peers = await invoke<string[]>('get_network_peers');
      setConnectedPeers(peers);
      
    } catch (error) {
      console.error('Failed to load network info:', error);
      setMessage('Failed to load network information');
    } finally {
      setIsLoading(false);
    }
  };

  const addPeerAddress = async () => {
    if (!peerAddress()) {
      setMessage('Please enter a peer address');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');
      
      const result = await invoke<string>('add_peer_address', { address: peerAddress() });
      setMessage(`✅ ${result}`);
      setPeerAddress('');
      
      // Refresh peer list
      await loadNetworkInfo();
      
    } catch (error) {
      console.error('Failed to add peer address:', error);
      setMessage(`❌ Failed to add peer: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('✅ Address copied to clipboard!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setMessage('❌ Failed to copy address');
    }
  };

  const refreshNetworkInfo = async () => {
    await loadNetworkInfo();
    await loadM5State();
    setMessage('🔄 Network information refreshed');
    setTimeout(() => setMessage(''), 2000);
  };

  const loadM5State = async () => {
    try {
      const cfg = await onionShare.trackerGetConfig();
      setM5TrackerUrl(cfg.trackerUrl ?? '');
      setM5SharePublicly(cfg.sharePublicly !== false);
      const st = await onionShare.onionShareStatus();
      setM5Running(st.running);
      setM5Onion(st.onion ?? '');
      if (st.running) {
        const list = await onionShare.onionShareListLocal();
        setM5LocalShares(list);
      } else {
        setM5LocalShares([]);
      }
      const lobby = await onionShare.trackerGetCachedLobby();
      setM5LobbySummary(`${lobby.online_nodes} online, ${lobby.files.length} file group(s)`);
    } catch (e) {
      console.warn('M5 onion share state:', e);
    }
  };

  const saveTrackerConfig = async () => {
    try {
      setIsLoading(true);
      const cfg = await onionShare.trackerGetConfig();
      await onionShare.trackerSetConfig({
        trackerUrl: m5TrackerUrl(),
        nodeId: cfg.nodeId,
        sharePublicly: m5SharePublicly(),
      });
      setMessage('✅ Tracker settings saved');
      setTimeout(() => setMessage(''), 2500);
    } catch (e) {
      setMessage(`❌ ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class={`${styles.networkInfo} ${props.class || ''}`}>
      <div class={styles.header}>
        <h3>🌐 Network Information</h3>
        <button 
          class={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded())}
        >
          {isExpanded() ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded() && (
        <div class={styles.content}>
          {/* My Onion Address Section */}
          <div class={styles.section}>
            <h4>🔑 My Onion Address</h4>
            <div class={styles.addressContainer}>
              <code class={styles.address}>{myAddress() || 'Loading...'}</code>
              <button 
                class={styles.copyButton}
                onClick={() => copyToClipboard(myAddress())}
                disabled={!myAddress() || isLoading()}
              >
                📋 Copy
              </button>
            </div>
            <p class={styles.helpText}>
              Share this address with your friends to connect directly
            </p>
          </div>

          {/* Add Peer Address Section */}
          <div class={styles.section}>
            <h4>🔗 Add Peer Address</h4>
            <div class={styles.inputContainer}>
              <input
                type="text"
                placeholder="Enter peer address (e.g., /dnsaddr/abc123.onion/tcp/12345/ws/p2p/QmPeerId)"
                value={peerAddress()}
                onInput={(e) => setPeerAddress(e.currentTarget.value)}
                class={styles.addressInput}
                disabled={isLoading()}
              />
              <button 
                class={styles.addButton}
                onClick={addPeerAddress}
                disabled={!peerAddress() || isLoading()}
              >
                {isLoading() ? '⏳' : '➕ Add'}
              </button>
            </div>
            <p class={styles.helpText}>
              Add your friend's onion address for faster initial connection
            </p>
          </div>

          {/* Connected Peers Section */}
          <div class={styles.section}>
            <h4>👥 Connected Peers ({connectedPeers().length})</h4>
            {connectedPeers().length > 0 ? (
              <ul class={styles.peerList}>
                {connectedPeers().map(peer => (
                  <li class={styles.peerItem}>{peer}</li>
                ))}
              </ul>
            ) : (
              <p class={styles.noPeers}>No peers connected yet</p>
            )}
          </div>

          <div class={styles.section}>
            <h4>Onion share (M5 / POC-compatible)</h4>
            <p class={styles.helpText}>
              Local Axum chunk server + tracker lobby. Uses Tor from the app; start host before copying links.
            </p>
            <div class={styles.inputContainer}>
              <input
                type="text"
                placeholder="Tracker URL (http://....onion or http://host:8080)"
                value={m5TrackerUrl()}
                onInput={e => setM5TrackerUrl(e.currentTarget.value)}
                class={styles.addressInput}
              />
              <label class={styles.helpText}>
                <input
                  type="checkbox"
                  checked={m5SharePublicly()}
                  onChange={e => setM5SharePublicly(e.currentTarget.checked)}
                />{' '}
                Share file list to lobby
              </label>
            </div>
            <div class={styles.actions}>
              <button type="button" class={styles.addButton} onClick={saveTrackerConfig} disabled={isLoading()}>
                Save tracker
              </button>
              <button
                type="button"
                class={styles.refreshButton}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    await onionShare.trackerRefreshLobby();
                    await loadM5State();
                    setMessage('✅ Lobby refreshed');
                  } catch (e) {
                    setMessage(`❌ ${e}`);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading()}
              >
                Refresh lobby
              </button>
              <button
                type="button"
                class={styles.addButton}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    await onionShare.trackerStartWsLoop();
                    setMessage('✅ Tracker WS loop started');
                  } catch (e) {
                    setMessage(`❌ ${e}`);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading()}
              >
                Start tracker WS
              </button>
              <button
                type="button"
                class={styles.refreshButton}
                onClick={async () => {
                  try {
                    await onionShare.trackerStopWsLoop();
                    setMessage('Tracker WS stopped');
                  } catch (e) {
                    setMessage(`❌ ${e}`);
                  }
                }}
                disabled={isLoading()}
              >
                Stop tracker WS
              </button>
            </div>
            <p class={styles.helpText}>Lobby: {m5LobbySummary()}</p>
            <p class={styles.helpText}>
              Host: {m5Running() ? `${m5Onion()} (running)` : 'stopped'}
            </p>
            <div class={styles.actions}>
              <button
                type="button"
                class={styles.forceOnionButton}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const r = await onionShare.onionShareStart();
                    setM5Onion(r.onion);
                    setM5Running(true);
                    setMessage('✅ Onion share host started');
                    await loadM5State();
                  } catch (e) {
                    setMessage(`❌ ${e}`);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading()}
              >
                Start share host
              </button>
              <button
                type="button"
                class={styles.refreshButton}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    await onionShare.onionShareStop();
                    setM5Running(false);
                    setM5Onion('');
                    setM5LocalShares([]);
                    setMessage('Share host stopped');
                  } catch (e) {
                    setMessage(`❌ ${e}`);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading()}
              >
                Stop share host
              </button>
              <button
                type="button"
                class={styles.addButton}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const paths = await invoke<string[]>('pick_document_files');
                    const p = paths?.[0];
                    if (!p) {
                      setMessage('No file selected');
                      return;
                    }
                    const r = await onionShare.onionShareAddFile(p);
                    setMessage(`✅ Sharing: ${r.link}`);
                    await loadM5State();
                  } catch (e) {
                    setMessage(`❌ ${e}`);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading() || !m5Running()}
              >
                Add file…
              </button>
            </div>
            <ul class={styles.peerList}>
              {m5LocalShares().map(s => (
                <li class={styles.peerItem}>
                  {s.name} —{' '}
                  <button type="button" class={styles.copyButton} onClick={() => copyToClipboard(s.link)}>
                    copy link
                  </button>
                </li>
              ))}
            </ul>
            <div class={styles.inputContainer}>
              <input
                type="text"
                placeholder="opoc:// or opocswarm:// link"
                value={m5FetchLink()}
                onInput={e => setM5FetchLink(e.currentTarget.value)}
                class={styles.addressInput}
              />
              <input
                type="text"
                placeholder="Output directory"
                value={m5FetchOutDir()}
                onInput={e => setM5FetchOutDir(e.currentTarget.value)}
                class={styles.addressInput}
              />
              <button
                type="button"
                class={styles.addButton}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const out = await onionShare.onionShareFetch(m5FetchLink(), m5FetchOutDir());
                    setMessage(`✅ Saved: ${out}`);
                  } catch (e) {
                    setMessage(`❌ ${e}`);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading() || !m5FetchLink() || !m5FetchOutDir()}
              >
                Download
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div class={styles.actions}>
            <button 
              class={styles.refreshButton}
              onClick={refreshNetworkInfo}
              disabled={isLoading()}
            >
              🔄 Refresh
            </button>
            
            <button 
              class={styles.forceOnionButton}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  setMessage('');
                  
                  const result = await invoke<string>('force_create_onion_service');
                  setMessage(`✅ ${result}`);
                  
                  // Refresh network info to show new onion address
                  await loadNetworkInfo();
                  
                } catch (error) {
                  console.error('Failed to force create onion service:', error);
                  setMessage(`❌ Failed to create onion service: ${error}`);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading()}
            >
              🔧 Force Onion Service
            </button>
          </div>

          {/* Status Messages */}
          {message() && (
            <div class={`${styles.message} ${message().startsWith('✅') ? styles.success : styles.error}`}>
              {message()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
