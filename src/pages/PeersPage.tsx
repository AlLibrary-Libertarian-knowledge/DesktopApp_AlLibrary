import { Component, lazy, Suspense } from 'solid-js';

// Lazy load the heavy NetworkGraph component
const NetworkGraph = lazy(() => import('../components/network/NetworkGraph'));

const PeersPage: Component = () => {
  return (
    <div class="page-placeholder peers-page">
      <h1>Peer Network</h1>
      <p>Connected peers and network topology.</p>

      <Suspense
        fallback={
          <div class="network-loading">
            <div class="loading-spinner"></div>
            <p>Loading network visualization...</p>
          </div>
        }
      >
        <NetworkGraph width={800} height={600} interactive={true} showStats={true} />
      </Suspense>
    </div>
  );
};

export default PeersPage;
