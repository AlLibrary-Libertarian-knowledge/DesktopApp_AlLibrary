import { Component, createSignal, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
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

  onMount(async () => {
    await loadNetworkInfo();
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
    setMessage('🔄 Network information refreshed');
    setTimeout(() => setMessage(''), 2000);
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
