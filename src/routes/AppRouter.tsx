import { Router, Route } from '@solidjs/router';
import { Home } from '../pages/Home';
import { Search } from '../pages/Search';
import { Collections } from '../pages/Collections';
import { Favorites } from '../pages/Favorites';
import { Recent } from '../pages/Recent';
import { Trending } from '../pages/Trending';
import { Browse } from '../pages/Browse';
import { Peers } from '../pages/Peers';

const AppRouter = () => {
  return (
    <Router>
      {/* Library Routes */}
      <Route path="/" component={Home} />
      <Route path="/collections" component={Collections} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/recent" component={Recent} />

      {/* Discovery Routes */}
      <Route path="/search" component={Search} />
      <Route path="/browse" component={Browse} />
      <Route path="/trending" component={Trending} />
      <Route path="/new-arrivals" component={() => <div>New Arrivals Page</div>} />

      {/* Cultural Heritage Routes */}
      <Route path="/cultural-contexts" component={() => <div>Cultural Contexts Page</div>} />
      <Route
        path="/traditional-knowledge"
        component={() => <div>Traditional Knowledge Page</div>}
      />
      <Route path="/community-guidelines" component={() => <div>Community Guidelines Page</div>} />
      <Route path="/preservation" component={() => <div>Preservation Page</div>} />

      {/* Network Routes */}
      <Route path="/peers" component={Peers} />
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
