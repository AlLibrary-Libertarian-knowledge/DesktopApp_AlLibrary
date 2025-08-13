import { Router, Route } from '@solidjs/router';
import { Suspense, lazy } from 'solid-js';

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
const P2PSearch = lazy(() => import('../pages/P2PSearch'));
const ConnectionManager = lazy(() => import('../pages/ConnectionManager'));
const CulturalContexts = lazy(() => import('../pages/CulturalContexts'));
const TraditionalKnowledge = lazy(() => import('../pages/TraditionalKnowledge'));
const CommunityGuidelines = lazy(() => import('../pages/CommunityGuidelines'));
const Preservation = lazy(() => import('../pages/Preservation'));
const DocumentReader = lazy(() => import('../pages/DocumentReader'));

const RouteLoading = () => (
  <div class="route-loading">
    <div class="loading-spinner" aria-label="Loading" />
  </div>
);

const AppRouter = () => {
  return (
    <Router>
      {/* Library Routes */}
      <Route path="/" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <Home />
        </Suspense>
      )} />
      <Route path="/collections" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <Collections />
        </Suspense>
      )} />
      <Route path="/favorites" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <Favorites />
        </Suspense>
      )} />
      <Route path="/recent" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <Recent />
        </Suspense>
      )} />

      {/* Discovery Routes */}
      <Route path="/search" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <SearchPage />
        </Suspense>
      )} />
      <Route path="/search-network" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <SearchNetworkPage />
        </Suspense>
      )} />
      <Route path="/browse" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <Browse />
        </Suspense>
      )} />
      <Route path="/trending" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <Trending />
        </Suspense>
      )} />
      <Route path="/new-arrivals" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <NewArrivalsPage />
        </Suspense>
      )} />

      {/* Cultural Heritage Routes */}
      <Route path="/cultural-contexts" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <CulturalContexts />
        </Suspense>
      )} />
      <Route path="/traditional-knowledge" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <TraditionalKnowledge />
        </Suspense>
      )} />
      <Route path="/community-guidelines" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <CommunityGuidelines />
        </Suspense>
      )} />
      <Route path="/preservation" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <Preservation />
        </Suspense>
      )} />

      {/* Network Routes */}
      <Route path="/peers" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <Peers />
        </Suspense>
      )} />
      <Route path="/network-health" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <NetworkHealth />
        </Suspense>
      )} />
      <Route path="/p2p-search" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <P2PSearch />
        </Suspense>
      )} />
      <Route path="/connection-manager" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <ConnectionManager />
        </Suspense>
      )} />
      <Route path="/sharing" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <div>Sharing Status Page</div>
        </Suspense>
      )} />
      <Route path="/downloads" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <div>Downloads Page</div>
        </Suspense>
      )} />
      <Route path="/sync" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <div>Synchronization Page</div>
        </Suspense>
      )} />

      {/* Document Reader */}
      <Route path="/reader" component={() => (
        <Suspense fallback={<RouteLoading />}>
          <DocumentReader />
        </Suspense>
      )} />

      {/* Fallback Route */}
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
  );
};

export default AppRouter;
