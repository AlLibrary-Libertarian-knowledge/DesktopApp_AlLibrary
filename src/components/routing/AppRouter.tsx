import { Router, Route } from '@solidjs/router';
import HomePage from '../../pages/HomePage';

const AppRouter = () => {
  return (
    <Router>
      {/* Library Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/collections" component={() => <div>Collections Page</div>} />
      <Route path="/favorites" component={() => <div>Favorites Page</div>} />
      <Route path="/recent" component={() => <div>Recent Activity Page</div>} />

      {/* Discovery Routes */}
      <Route path="/search" component={() => <div>Search Network Page</div>} />
      <Route path="/browse" component={() => <div>Browse Categories Page</div>} />
      <Route path="/trending" component={() => <div>Trending Content Page</div>} />
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
      <Route path="/peers" component={() => <div>Peer Network Page</div>} />
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
