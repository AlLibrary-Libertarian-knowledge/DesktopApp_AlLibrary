import { Router, Route } from '@solidjs/router';
import { Suspense, lazy } from 'solid-js';
import { useTranslation } from '../i18n/hooks';

const Home = lazy(() => import('../pages/Home'));
const SearchPage = lazy(() => import('../pages/Search'));
const SearchNetworkPage = lazy(() => import('../pages/SearchNetwork'));
const Collections = lazy(() => import('../pages/Collections'));
const Favorites = lazy(() => import('../pages/Favorites'));
const Recent = lazy(() => import('../pages/Recent'));
const Trending = lazy(() => import('../pages/Trending'));
const Browse = lazy(() => import('../pages/Browse'));
const NewArrivalsPage = lazy(() => import('../pages/NewArrivals'));
const Peers = lazy(() => import('../pages/Peers'));
const NetworkHealth = lazy(() => import('../pages/NetworkHealth'));
const ConnectionManager = lazy(() => import('../pages/ConnectionManager'));
const PeerTransfers = lazy(() => import('../pages/PeerTransfers'));
const DocumentReader = lazy(() => import('../pages/DocumentReader'));

const RouteLoading = () => (
  <div class="route-loading">
    <div class="loading-spinner" aria-label="Loading" />
  </div>
);

const AppRouter = () => {
  const { t } = useTranslation('errors');
  return (
    <Router>
      {/* Library Routes */}
      <Route
        path="/"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <Home />
          </Suspense>
        )}
      />
      <Route
        path="/collections"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <Collections />
          </Suspense>
        )}
      />
      <Route
        path="/favorites"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <Favorites />
          </Suspense>
        )}
      />
      <Route
        path="/recent"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <Recent />
          </Suspense>
        )}
      />

      {/* Discovery Routes */}
      <Route
        path="/search"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <SearchPage />
          </Suspense>
        )}
      />
      <Route
        path="/search-network"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <SearchNetworkPage />
          </Suspense>
        )}
      />
      <Route
        path="/browse"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <Browse />
          </Suspense>
        )}
      />
      <Route
        path="/trending"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <Trending />
          </Suspense>
        )}
      />
      <Route
        path="/new-arrivals"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <NewArrivalsPage />
          </Suspense>
        )}
      />

      {/* Network Routes */}
      <Route
        path="/peers"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <Peers />
          </Suspense>
        )}
      />
      <Route
        path="/network-health"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <NetworkHealth />
          </Suspense>
        )}
      />
      <Route
        path="/connection-manager"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <ConnectionManager />
          </Suspense>
        )}
      />
      <Route
        path="/transfers"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <PeerTransfers />
          </Suspense>
        )}
      />
      <Route
        path="/sharing"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <PeerTransfers />
          </Suspense>
        )}
      />
      <Route
        path="/downloads"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <PeerTransfers />
          </Suspense>
        )}
      />

      {/* Document Reader */}
      <Route
        path="/reader"
        component={() => (
          <Suspense fallback={<RouteLoading />}>
            <DocumentReader />
          </Suspense>
        )}
      />

      {/* Fallback Route */}
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
  );
};

export default AppRouter;
