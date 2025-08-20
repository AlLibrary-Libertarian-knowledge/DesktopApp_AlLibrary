import { Component, createSignal, ParentProps, Show, onMount, Suspense } from 'solid-js';
import { settingsService } from '@/services/storage/settingsService';
import { FirstRunWizard } from '@/components/composite/FirstRunWizard';
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
import P2POverview from './pages/P2POverview';
import DocumentManagement from './pages/DocumentManagement';
import { DocumentDetailPage } from './pages/DocumentDetail';
import { SearchNetworkPage } from './pages/SearchNetwork';
import { DocumentReader } from './pages/DocumentReader';

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
const RouteWrapper: Component<{ children: any }> = props => {
  // Add timeout to prevent infinite loading
  const [showTimeoutMessage, setShowTimeoutMessage] = createSignal(false);
  
  onMount(() => {
    // Show timeout message after 10 seconds
    globalThis.setTimeout(() => {
      setShowTimeoutMessage(true);
    }, 10000);
  });
  
  return (
    <Suspense
      fallback={
        <div class="route-loading">
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <h3>Loading page...</h3>
            <p>Please wait while we prepare your content</p>
            
            {/* Timeout warning */}
            <Show when={showTimeoutMessage()}>
              <div style={{
                color: '#f59e0b',
                'font-size': '14px',
                'margin-top': '10px',
                'text-align': 'center'
              }}>
                ⚠️ Loading is taking longer than expected
              </div>
            </Show>
            
            {/* Component-level debug button */}
            <button 
              onClick={() => {
                console.warn('Component loading bypass triggered');
                // Force the component to render by updating a signal
                // This is a workaround for Suspense getting stuck
                window.location.reload();
              }}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                'border-radius': '4px',
                cursor: 'pointer',
                'font-size': '12px',
                'margin-top': '20px'
              }}
            >
              🚨 Force Load Page (Debug)
            </button>
          </div>
        </div>
      }
    >
      {props.children}
    </Suspense>
   );
};

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

// Stable route component to avoid remounts; no Suspense to prevent fallback flicker
const P2POverviewRoute: Component = () => <P2POverview />;

const App: Component = () => {
  const [isLoading, setIsLoading] = createSignal(true);
  const [initProgress, setInitProgress] = createSignal<InitProgress | null>(null);
  const [needsFirstRun, setNeedsFirstRun] = createSignal(false);

  onMount(async () => {
    let cleanup: (() => void) | null = null;
    let fallbackTimer: number | null = null;

    try {
      // First-run bootstrap: check if library folder is set
      try {
        const path = await settingsService.ensureInitialized();
        const fr = globalThis.localStorage?.getItem('FIRST_RUN_DONE');
        if (!path || !fr) {
          setNeedsFirstRun(true);
        }
      } catch { /* ignore */ }

      // Initialize i18n system
      await initializeI18n();
      /* initialized */

      // Start Tauri initialization process
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('initialize_app');
        
        // Start P2P network after Tauri initialization
        console.log('Starting P2P network initialization...');
        
        // Add timeout to P2P initialization to prevent hanging
        const p2pPromise = invoke('start_libp2p_with_socks', { socksAddr: '127.0.0.1:9050' });
        const timeoutPromise = new Promise((_, reject) => 
          globalThis.setTimeout(() => reject(new Error('P2P initialization timeout')), 10000)
        );
        
        await Promise.race([p2pPromise, timeoutPromise]);
        console.log('P2P network started successfully');
        
        // Bootstrap nodes will be discovered automatically via Kademlia DHT
        // No need to hardcode addresses - the network discovers peers dynamically
        console.log('P2P network ready for automatic peer discovery');
        
        // Force loading completion after P2P is ready
        globalThis.setTimeout(() => {
          console.log('Forcing loading completion after P2P initialization');
          setIsLoading(false);
          
          // Clear the fallback timer since we're completing manually
          if (fallbackTimer) {
            globalThis.clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
          
          // Clean up the event listener
          try { cleanup?.(); } catch { /* ignore */ }
          cleanup = null;
        }, 2000); // Force completion after 2 seconds
        
      } catch (error) {
        console.warn('Failed to start Tauri/P2P initialization:', error);
        // Continue with fallback - don't let P2P issues block the app
      }

      // Listen for initialization progress from Tauri
      const unlisten = await listen<InitProgress>('init-progress', event => {
        setInitProgress(event.payload);
        console.log('Tauri init progress:', event.payload);

        // When initialization is complete, hide loading screen
        if (event.payload.phase === 'complete' || event.payload.progress >= 100) {
          if (fallbackTimer) {
            globalThis.clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
          
          globalThis.setTimeout(() => {
            setIsLoading(false);
            // Stop listening after initialization completes to prevent unnecessary re-renders
            try { cleanup?.(); } catch { /* ignore */ }
            cleanup = null;
          }, 1500); // Small delay to show completion
        }
      });

      cleanup = unlisten;

      // Set fallback timer in case Tauri events don't work
      fallbackTimer = globalThis.setTimeout(() => {
        console.warn('Tauri initialization timeout, using fallback');
        setIsLoading(false);
        cleanup?.();
        cleanup = null;
      }, 5000); // Reduced to 5 seconds for faster recovery

    } catch (error) {
      console.error('App initialization error:', error);
      /* listener setup failed, fallback */
      // Fallback: hide loading after a timeout if Tauri isn't available
      fallbackTimer = globalThis.setTimeout(() => {
        setIsLoading(false);
      }, 4000);
    }

    // Return cleanup function
    return () => {
      cleanup?.();
      if (fallbackTimer) globalThis.clearTimeout(fallbackTimer);
    };
  });

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      <Show when={isLoading()}>
        <Loading onComplete={handleLoadingComplete} tauriProgress={initProgress()} />
        {/* Manual fallback for stuck loading */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          'z-index': 10000,
          background: 'rgba(0,0,0,0.8)',
          padding: '10px',
          'border-radius': '8px',
          border: '1px solid #374151'
        }}>
          <button 
            onClick={() => {
              console.warn('Manual loading completion triggered');
              setIsLoading(false);
            }}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              'border-radius': '4px',
              cursor: 'pointer',
              'font-size': '12px'
            }}
          >
            Skip Loading (Debug)
          </button>
        </div>
      </Show>

      <Show when={!isLoading()}>
        <Show when={needsFirstRun()}>
          <FirstRunWizard onComplete={() => setNeedsFirstRun(false)} />
        </Show>
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
            path="/document/:id"
            component={() => (
              <RouteWrapper>
                <DocumentDetailPage />
              </RouteWrapper>
            )}
          />

          <Route
            path="/reader"
            component={() => (
              <RouteWrapper>
                <DocumentReader />
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
                <SearchNetworkPage />
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

          <Route path="/p2p-overview" component={P2POverviewRoute} />

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
