import { Component, createSignal, ParentProps, Show, onMount, Suspense } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import { listen } from '@tauri-apps/api/event';
import MainLayout from './components/layout/MainLayout';
import { Loading } from './components/foundation';
import { initializeI18n } from './i18n';
import './styles/theme.css';
import './App.css';

// Import page components
import { Home as HomePage } from './pages/Home';
import { Collections as CollectionsPage } from './pages/Collections';
import { Favorites as FavoritesPage } from './pages/Favorites';
import { Recent as RecentPage } from './pages/Recent';
// SearchPage functionality has been merged into DocumentManagement
import { Browse as BrowsePage } from './pages/Browse';
import { Trending as TrendingPage } from './pages/Trending';
import { Peers as PeersPage } from './pages/Peers';
import { NetworkHealth } from './pages/NetworkHealth';
import { P2PSearch } from './pages/P2PSearch';
import { ConnectionManager } from './pages/ConnectionManager';
import DocumentManagement from './pages/DocumentManagement';

// Cultural Heritage Pages
import { CulturalContexts } from './pages/CulturalContexts';
import { TraditionalKnowledge } from './pages/TraditionalKnowledge';
import { CommunityGuidelines } from './pages/CommunityGuidelines';
import { Preservation } from './pages/Preservation';

interface InitProgress {
  phase: string;
  message: string;
  progress: number;
  icon: string;
}

// Route loading wrapper component following optimization principles
const RouteWrapper: Component<{ children: any }> = props => (
  <Suspense
    fallback={
      <div class="route-loading">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <h3>Loading page...</h3>
          <p>Please wait while we prepare your content</p>
        </div>
      </div>
    }
  >
    {props.children}
  </Suspense>
);

// Wrapper component that includes MainLayout
const AppWithLayout: Component<ParentProps> = props => {
  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <MainLayout sidebarCollapsed={sidebarCollapsed()} onSidebarToggle={handleSidebarToggle}>
      {props.children}
    </MainLayout>
  );
};

const App: Component = () => {
  const [isLoading, setIsLoading] = createSignal(true);
  const [initProgress, setInitProgress] = createSignal<InitProgress | null>(null);

  onMount(async () => {
    let cleanup: (() => void) | null = null;

    try {
      // Initialize i18n system
      await initializeI18n();
      console.log('i18n system initialized successfully');

      // Listen for initialization progress from Tauri
      const unlisten = await listen<InitProgress>('init-progress', event => {
        console.log('Received init progress:', event.payload);
        setInitProgress(event.payload);

        // When initialization is complete, hide loading screen
        if (event.payload.phase === 'complete' || event.payload.progress >= 100) {
          globalThis.setTimeout(() => {
            setIsLoading(false);
          }, 1500); // Small delay to show completion
        }
      });

      cleanup = unlisten;
    } catch (error) {
      console.error('Failed to setup initialization listener:', error);
      // Fallback: hide loading after a timeout if Tauri isn't available
      globalThis.setTimeout(() => {
        setIsLoading(false);
      }, 4000);
    }

    // Return cleanup function
    return () => {
      cleanup?.();
    };
  });

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      <Show when={isLoading()}>
        <Loading onComplete={handleLoadingComplete} tauriProgress={initProgress()} />
      </Show>

      <Show when={!isLoading()}>
        <Router root={AppWithLayout}>
          <Route
            path="/"
            component={() => (
              <RouteWrapper>
                <HomePage />
              </RouteWrapper>
            )}
          />

          <Route
            path="/documents"
            component={() => (
              <RouteWrapper>
                <DocumentManagement />
              </RouteWrapper>
            )}
          />

          <Route
            path="/collections"
            component={() => (
              <RouteWrapper>
                <CollectionsPage />
              </RouteWrapper>
            )}
          />

          <Route
            path="/favorites"
            component={() => (
              <RouteWrapper>
                <FavoritesPage />
              </RouteWrapper>
            )}
          />

          <Route
            path="/recent"
            component={() => (
              <RouteWrapper>
                <RecentPage />
              </RouteWrapper>
            )}
          />

          <Route
            path="/search"
            component={() => (
              <RouteWrapper>
                <DocumentManagement />
              </RouteWrapper>
            )}
          />

          <Route
            path="/search-network"
            component={() => (
              <RouteWrapper>
                <DocumentManagement />
              </RouteWrapper>
            )}
          />

          <Route
            path="/browse"
            component={() => (
              <RouteWrapper>
                <BrowsePage />
              </RouteWrapper>
            )}
          />

          <Route
            path="/trending"
            component={() => (
              <RouteWrapper>
                <TrendingPage />
              </RouteWrapper>
            )}
          />

          <Route
            path="/peers"
            component={() => (
              <RouteWrapper>
                <PeersPage />
              </RouteWrapper>
            )}
          />

          <Route
            path="/network-health"
            component={() => (
              <RouteWrapper>
                <NetworkHealth />
              </RouteWrapper>
            )}
          />

          <Route
            path="/p2p-search"
            component={() => (
              <RouteWrapper>
                <P2PSearch />
              </RouteWrapper>
            )}
          />

          <Route
            path="/connection-manager"
            component={() => (
              <RouteWrapper>
                <ConnectionManager />
              </RouteWrapper>
            )}
          />

          {/* Placeholder routes for remaining pages */}
          <Route
            path="/new-arrivals"
            component={() => (
              <div class="page-placeholder">
                <h1>New Arrivals</h1>
                <p>Recently added documents to the network.</p>
              </div>
            )}
          />

          <Route
            path="/cultural-contexts"
            component={() => (
              <RouteWrapper>
                <CulturalContexts />
              </RouteWrapper>
            )}
          />

          <Route
            path="/traditional-knowledge"
            component={() => (
              <RouteWrapper>
                <TraditionalKnowledge />
              </RouteWrapper>
            )}
          />

          <Route
            path="/community-guidelines"
            component={() => (
              <RouteWrapper>
                <CommunityGuidelines />
              </RouteWrapper>
            )}
          />

          <Route
            path="/preservation"
            component={() => (
              <RouteWrapper>
                <Preservation />
              </RouteWrapper>
            )}
          />

          <Route
            path="/sharing"
            component={() => (
              <div class="page-placeholder">
                <h1>Sharing Status</h1>
                <p>Monitor your sharing activity and contributions.</p>
              </div>
            )}
          />

          <Route
            path="/downloads"
            component={() => (
              <div class="page-placeholder">
                <h1>Downloads</h1>
                <p>Manage your download queue and completed transfers.</p>
              </div>
            )}
          />

          <Route
            path="/sync"
            component={() => (
              <div class="page-placeholder">
                <h1>Synchronization</h1>
                <p>Sync status and network health monitoring.</p>
              </div>
            )}
          />

          <Route
            path="*"
            component={() => (
              <div class="error-page">
                <h1>Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <a href="/">Return to Home</a>
              </div>
            )}
          />
        </Router>
      </Show>
    </>
  );
};

export default App;
