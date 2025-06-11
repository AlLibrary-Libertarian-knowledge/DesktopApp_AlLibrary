import { Component, createSignal, ParentProps, Show, onMount, lazy, Suspense } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import MainLayout from './components/layout/MainLayout';
import LoadingScreen from './components/common/LoadingScreen';
import './styles/theme.css';
import './App.css';

// Lazy load page components following CORE_OPTIMIZATION_PHILOSOPHY
const HomePage = lazy(() => import('./pages/HomePage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const RecentPage = lazy(() => import('./pages/RecentPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const TrendingPage = lazy(() => import('./pages/TrendingPage'));
const PeersPage = lazy(() => import('./pages/PeersPage'));

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
    try {
      // Listen for initialization progress from Tauri
      const unlisten = await listen<InitProgress>('init-progress', event => {
        console.log('Received init progress:', event.payload);
        setInitProgress(event.payload);

        // When initialization is complete, hide loading screen
        if (event.payload.phase === 'complete' || event.payload.progress >= 100) {
          setTimeout(() => {
            setIsLoading(false);
          }, 1500); // Small delay to show completion
        }
      });

      // Cleanup listener when component unmounts
      return () => {
        unlisten();
      };
    } catch (error) {
      console.error('Failed to setup initialization listener:', error);
      // Fallback: hide loading after a timeout if Tauri isn't available
      setTimeout(() => {
        setIsLoading(false);
      }, 4000);
    }
  });

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      <Show when={isLoading()}>
        <LoadingScreen onComplete={handleLoadingComplete} tauriProgress={initProgress()} />
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
                <SearchPage />
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
              <div class="page-placeholder">
                <h1>Cultural Contexts</h1>
                <p>Understanding cultural background of shared knowledge.</p>
              </div>
            )}
          />

          <Route
            path="/traditional-knowledge"
            component={() => (
              <div class="page-placeholder">
                <h1>Traditional Knowledge</h1>
                <p>Respectful sharing of indigenous and traditional wisdom.</p>
              </div>
            )}
          />

          <Route
            path="/community-guidelines"
            component={() => (
              <div class="page-placeholder">
                <h1>Community Guidelines</h1>
                <p>Rules and best practices for respectful knowledge sharing.</p>
              </div>
            )}
          />

          <Route
            path="/preservation"
            component={() => (
              <div class="page-placeholder">
                <h1>Preservation</h1>
                <p>Tools and methods for preserving cultural heritage.</p>
              </div>
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
