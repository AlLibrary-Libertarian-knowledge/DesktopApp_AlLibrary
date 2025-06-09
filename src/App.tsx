import { Component, createSignal, ParentProps } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import './styles/theme.css';
import './App.css';

// Wrapper component that includes MainLayout
const AppWithLayout: Component<ParentProps> = props => {
  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed());
  };

  return (
    <MainLayout sidebarCollapsed={sidebarCollapsed()} onSidebarToggle={handleSidebarToggle}>
      {props.children}
    </MainLayout>
  );
};

const App: Component = () => {
  return (
    <Router root={AppWithLayout}>
      <Route path="/" component={HomePage} />
      <Route
        path="/collections"
        component={() => (
          <div class="page-placeholder">
            <h1>Collections</h1>
            <p>Organize your documents into collections for better management.</p>
          </div>
        )}
      />
      <Route
        path="/favorites"
        component={() => (
          <div class="page-placeholder">
            <h1>Favorites</h1>
            <p>Your starred and bookmarked documents.</p>
          </div>
        )}
      />
      <Route
        path="/recent"
        component={() => (
          <div class="page-placeholder">
            <h1>Recent</h1>
            <p>Recently accessed documents and activities.</p>
          </div>
        )}
      />
      <Route
        path="/search"
        component={() => (
          <div class="page-placeholder">
            <h1>Search Network</h1>
            <p>Search across the decentralized network for documents.</p>
          </div>
        )}
      />
      <Route
        path="/browse"
        component={() => (
          <div class="page-placeholder">
            <h1>Browse Categories</h1>
            <p>Explore documents by categories and topics.</p>
          </div>
        )}
      />
      <Route
        path="/trending"
        component={() => (
          <div class="page-placeholder">
            <h1>Trending</h1>
            <p>Popular documents and topics in the network.</p>
          </div>
        )}
      />
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
        path="/peers"
        component={() => (
          <div class="page-placeholder">
            <h1>Peer Network</h1>
            <p>Connected peers and network topology.</p>
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
  );
};

export default App;
