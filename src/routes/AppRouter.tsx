import { Router, Route } from '@solidjs/router';
import { Home } from '../pages/Home';
import { SearchPage } from '../pages/Search';
import { Collections } from '../pages/Collections';
import { Favorites } from '../pages/Favorites';
import { Recent } from '../pages/Recent';
import { Trending } from '../pages/Trending';
import { Browse } from '../pages/Browse';
import { Peers } from '../pages/Peers';
import { NetworkHealth } from '../pages/NetworkHealth';
import { P2PSearch } from '../pages/P2PSearch';
import { ConnectionManager } from '../pages/ConnectionManager';
import { CulturalContexts } from '../pages/CulturalContexts';
import { TraditionalKnowledge } from '../pages/TraditionalKnowledge';
import { CommunityGuidelines } from '../pages/CommunityGuidelines';
import { Preservation } from '../pages/Preservation';

const AppRouter = () => {
  return (
    <Router>
      {/* Library Routes */}
      <Route path="/" component={Home} />
      <Route path="/collections" component={Collections} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/recent" component={Recent} />

      {/* Discovery Routes */}
      <Route path="/search" component={SearchPage} />
      <Route path="/search-network" component={SearchPage} />
      <Route path="/browse" component={Browse} />
      <Route path="/trending" component={Trending} />
      <Route path="/new-arrivals" component={() => <div>New Arrivals Page</div>} />

      {/* Cultural Heritage Routes */}
      <Route path="/cultural-contexts" component={CulturalContexts} />
      <Route path="/traditional-knowledge" component={TraditionalKnowledge} />
      <Route path="/community-guidelines" component={CommunityGuidelines} />
      <Route path="/preservation" component={Preservation} />

      {/* Network Routes */}
      <Route path="/peers" component={Peers} />
      <Route path="/network-health" component={NetworkHealth} />
      <Route path="/p2p-search" component={P2PSearch} />
      <Route path="/connection-manager" component={ConnectionManager} />
      <Route path="/sharing" component={() => <div>Sharing Status Page</div>} />
      <Route path="/downloads" component={() => <div>Downloads Page</div>} />
      <Route path="/sync" component={() => <div>Synchronization Page</div>} />

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
