import { type Component, createSignal, type ParentProps, Show, onMount, Suspense } from 'solid-js';
import { settingsService } from '@/services/storage/settingsService';
import { FirstRunWizard } from '@/components/composite/FirstRunWizard';
import { TrackerConnectModal } from '@/components/domain/network/TrackerConnectModal';
import { isTorSettled, useNetworkPresenceResource } from '@/hooks/network/useNetworkPresence';
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
  localOnly?: boolean;
  bootstrapPercent?: number;
}

// Route loading wrapper — production-ready Suspense fallback
const RouteWrapper: Component<{ children: any }> = props => {
  const { t } = useTranslation('common');
  const [showTimeoutMessage, setShowTimeoutMessage] = createSignal(false);

  onMount(() => {
    const timer = globalThis.setTimeout(() => setShowTimeoutMessage(true), 12000);
    return () => globalThis.clearTimeout(timer);
  });

  return (
    <Suspense
      fallback={
        <div class="route-loading" role="status" aria-live="polite" aria-busy="true">
          <div class="route-loading-glow" aria-hidden="true" />
          <div class="route-loading-panel">
            <div class="route-loading-spinner" aria-hidden="true">
              <span class="route-loading-spinner-ring" />
              <span class="route-loading-spinner-core" />
            </div>
            <h3 class="route-loading-title">{t('status.loadingPage' as any)}</h3>
            <p class="route-loading-subtitle">{t('status.preparingContent' as any)}</p>
            <div class="route-loading-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <Show when={showTimeoutMessage()}>
              <div class="route-loading-slow">
                <p>{t('status.loadingSlow' as any)}</p>
                <button
                  type="button"
                  class="route-loading-retry"
                  onClick={() => window.location.reload()}
                >
                  {t('actions.refresh' as any)}
                </button>
              </div>
            </Show>
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
  /** Shown every cold start until the user connects or skips (session only). */
  const [needsTrackerConnect, setNeedsTrackerConnect] = createSignal(true);
  const { presence } = useNetworkPresenceResource();
  /**
   * Only open the tracker modal once (a) the Tor overlay settled — `ready` (SOCKS + onion up, so
   * the .onion probe can actually run) or a terminal failure (`degraded`/`failed`, where the user
   * still needs to pick hub LAN / lab local) — and (b) the backend's own post-bootstrap tracker
   * sync is not mid-flight, otherwise "Conectar" would hit the sync gate and report "busy".
   */
  const canShowTrackerModal = () => {
    const p = presence();
    return isTorSettled(p) && p.trackerPhase !== 'syncing';
  };

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
          'Tauri initialization timeout; opening app (Tor may still connect in background)'
        );
        setIsLoading(false);
        try {
          cleanup?.();
        } catch {
          /* ignore */
        }
        cleanup = null;
      }, 45000);

      const dismissLoadingSoon = () => {
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
        }, 400);
      };

      const runPostBootstrapTasks = async () => {
        const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
        const onionShare = await import('@/services/network/onionShareService');
        try {
          const raw = globalThis.localStorage?.getItem('allibrary_shared_paths');
          if (raw) {
            const existing = await onionShare.onionShareListLocal();
            const restoredPaths = new Set(
              existing.map(s => s.diskPath).filter((p): p is string => Boolean(p))
            );
            const paths: string[] = JSON.parse(raw);
            for (const path of paths) {
              if (restoredPaths.has(path)) continue;
              try {
                console.log('Migrating legacy shared path to SQLite:', path);
                await onionShare.onionShareAddFile(path);
              } catch (shareErr) {
                console.warn('Failed to migrate legacy shared path:', path, shareErr);
              }
            }
            globalThis.localStorage?.removeItem('allibrary_shared_paths');
          }
        } catch (migrateErr) {
          console.warn('Legacy share path migration failed:', migrateErr);
        }

        try {
          await tauriInvoke('init_tor_node', { config: { bridge_support: true } });
        } catch (torErr) {
          console.warn(
            'Tor init skipped or failed (onion share uses its own Tor when running):',
            torErr
          );
        }
      };

      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const onionShare = await import('@/services/network/onionShareService');

        // 1) Fast baseline + close native splash (splash.html).
        await invoke('initialize_app');

        // Bundled / detected Tor exe before hidden service bootstrap.
        try {
          await invoke('ensure_tor_for_onion_share');
        } catch (torEns: unknown) {
          console.warn('ensure_tor_for_onion_share skipped or failed:', torEns);
        }

        // 2) Tor / onion bootstrap in background — do not block the UI.
        try {
          await onionShare.bootstrapOnionOverlayBackground();
        } catch (onionErr) {
          console.warn('Onion overlay background bootstrap failed:', onionErr);
        }

        // Open app quickly; Tor continues via tor-bootstrap-progress + recovery watchdog.
        dismissLoadingSoon();
        void runPostBootstrapTasks();
      } catch (error) {
        console.warn('Failed during Tauri initialization:', error);
        dismissLoadingSoon();
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
      </Show>

      <Show when={!isLoading()}>
        <Show when={needsFirstRun()}>
          <FirstRunWizard onComplete={() => setNeedsFirstRun(false)} />
        </Show>
        <Show when={!needsFirstRun() && needsTrackerConnect() && canShowTrackerModal()}>
          <TrackerConnectModal
            isOpen
            onConnected={() => setNeedsTrackerConnect(false)}
            onSkip={() => setNeedsTrackerConnect(false)}
          />
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
