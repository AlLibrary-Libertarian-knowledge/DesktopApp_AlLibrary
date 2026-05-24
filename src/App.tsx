import { type Component, createSignal, type ParentProps, Show, onMount, Suspense } from 'solid-js';
import { settingsService } from '@/services/storage/settingsService';
import { FirstRunWizard } from '@/components/composite/FirstRunWizard';
import { Router, Route } from '@solidjs/router';
import { listen } from '@tauri-apps/api/event';
import MainLayout from './components/layout/MainLayout';
import { Loading } from './components/foundation';
import { initializeI18n } from './i18n';
import { useTranslation } from './i18n/hooks';
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
import { ConnectionManager } from './pages/ConnectionManager';
import DocumentManagement from './pages/DocumentManagement';
import { DocumentDetailPage } from './pages/DocumentDetail';
import { SearchNetworkPage } from './pages/SearchNetwork';
import { DocumentReader } from './pages/DocumentReader';
import PeerTransfers from './pages/PeerTransfers';
import { SettingsPage } from './pages/Settings/SettingsPage';

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
            <div class="loading-spinner" />
            <h3>Loading page...</h3>
            <p>Please wait while we prepare your content</p>

            {/* Timeout warning */}
            <Show when={showTimeoutMessage()}>
              <div
                style={{
                  color: '#f59e0b',
                  'font-size': '14px',
                  'margin-top': '10px',
                  'text-align': 'center',
                }}
              >
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
                'margin-top': '20px',
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

const App: Component = () => {
  const { t } = useTranslation('errors');
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
      } catch {
        /* ignore */
      }

      // Initialize i18n system
      await initializeI18n();
      /* initialized */

      // Register progress listener before invoke so splash receives Tor/onion bootstrap updates
      const unlisten = await listen<InitProgress>('init-progress', event => {
        setInitProgress(event.payload);
        console.log('Tauri init progress:', event.payload);
      });
      cleanup = unlisten;

      fallbackTimer = globalThis.setTimeout(() => {
        console.warn(
          'Tauri initialization timeout (baseline + onion can take ~90s); forcing dismiss'
        );
        setIsLoading(false);
        try {
          cleanup?.();
        } catch {
          /* ignore */
        }
        cleanup = null;
      }, 120000);

      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const onionShare = await import('@/services/network/onionShareService');

        // 1) Fast baseline + close native splash (splash.html).
        await invoke('initialize_app');

        // Bundled / detected Tor exe (Windows Expert Bundle download) before hidden service bootstrap.
        try {
          await invoke('ensure_tor_for_onion_share');
        } catch (torEns: unknown) {
          console.warn('ensure_tor_for_onion_share skipped or failed:', torEns);
        }

        // 2) Heavy Tor / onion bootstrap + tracker announce — Loading overlay stays up.
        try {
          await onionShare.bootstrapOnionOverlay();
          // Restore previously saved shared files automatically
          try {
            const data = globalThis.localStorage?.getItem('allibrary_shared_paths');
            if (data) {
              const paths: string[] = JSON.parse(data);
              for (const path of paths) {
                try {
                  console.log('Restoring shared file on boot:', path);
                  await onionShare.onionShareAddFile(path);
                } catch (shareErr) {
                  console.error('Failed to restore shared file:', path, shareErr);
                }
              }
            }
          } catch (restoreErr) {
            console.error('Failed to restore saved shares:', restoreErr);
          }
        } catch (onionErr) {
          console.warn('Onion overlay bootstrap failed:', onionErr);
        }

        // Legacy shell Tor node (optional; separate from embedded onion-share Tor).
        try {
          await invoke('init_tor_node', { config: { bridge_support: true } });
        } catch (torErr) {
          console.warn(
            'Tor init skipped or failed (onion share uses its own Tor when running):',
            torErr
          );
        }

        if (fallbackTimer) {
          globalThis.clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
        globalThis.setTimeout(() => {
          setIsLoading(false);
          try {
            cleanup?.();
          } catch {
            /* ignore */
          }
          cleanup = null;
        }, 450);
      } catch (error) {
        console.warn('Failed during Tauri initialization:', error);
        if (fallbackTimer) {
          globalThis.clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
        setIsLoading(false);
        try {
          cleanup?.();
        } catch {
          /* ignore */
        }
        cleanup = null;
      }
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
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            'z-index': 10000,
            background: 'rgba(0,0,0,0.8)',
            padding: '10px',
            'border-radius': '8px',
            border: '1px solid #374151',
          }}
        >
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
              'font-size': '12px',
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
            path="/transfers"
            component={() => (
              <RouteWrapper>
                <PeerTransfers />
              </RouteWrapper>
            )}
          />
          <Route
            path="/sharing"
            component={() => (
              <RouteWrapper>
                <PeerTransfers />
              </RouteWrapper>
            )}
          />
          <Route
            path="/downloads"
            component={() => (
              <RouteWrapper>
                <PeerTransfers />
              </RouteWrapper>
            )}
          />

          <Route
            path="/settings"
            component={() => (
              <RouteWrapper>
                <SettingsPage />
              </RouteWrapper>
            )}
          />

          <Route
            path="*"
            component={() => (
              <div class="not-found-wrap">
                <div class="not-found-glow" />
                <div class="not-found-page">
                  <span class="not-found-kicker">404 Error</span>
                  <h1>{t('notFoundTitle' as any)}</h1>
                  <p>{t('notFoundDescription' as any)}</p>
                  <div class="not-found-actions">
                    <a href="/" class="not-found-primary">
                      {t('notFoundReturnHome' as any)}
                    </a>
                    <button
                      type="button"
                      class="not-found-secondary"
                      onClick={() => window.history.back()}
                    >
                      {t('notFoundGoBack' as any)}
                    </button>
                  </div>
                </div>
              </div>
            )}
          />
        </Router>
      </Show>
    </>
  );
};

export default App;
