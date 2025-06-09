import { Component, createSignal, onMount } from 'solid-js';
import StatusBar from '../components/dashboard/StatusBar';
import './HomePage.css';

interface Document {
  id: string;
  title: string;
  author: string;
  type: 'PDF' | 'EPUB' | 'TXT' | 'MD';
  size: string;
  lastAccessed: string;
  thumbnail?: string;
  culturalSensitivity: 'public' | 'restricted' | 'sacred';
}

interface Collection {
  id: string;
  name: string;
  documentCount: number;
  type: 'smart' | 'custom';
  icon: string;
}

const HomePage: Component = () => {
  const [recentDocuments, setRecentDocuments] = createSignal<Document[]>([
    {
      id: '1',
      title: 'Indigenous Art History',
      author: 'Dr. Maria Santos',
      type: 'PDF',
      size: '2.3 MB',
      lastAccessed: '2 hours ago',
      culturalSensitivity: 'restricted',
    },
    {
      id: '2',
      title: 'Traditional Medicine Practices',
      author: 'Elder Joseph Crow Feather',
      type: 'EPUB',
      size: '1.8 MB',
      lastAccessed: '3 hours ago',
      culturalSensitivity: 'sacred',
    },
    {
      id: '3',
      title: 'Community Preservation Guide',
      author: 'Cultural Council',
      type: 'PDF',
      size: '4.1 MB',
      lastAccessed: '1 day ago',
      culturalSensitivity: 'public',
    },
  ]);

  const [smartCollections, setSmartCollections] = createSignal<Collection[]>([
    {
      id: '1',
      name: 'Cultural Studies',
      documentCount: 45,
      type: 'smart',
      icon: '🏛️',
    },
    {
      id: '2',
      name: 'Traditional Knowledge',
      documentCount: 28,
      type: 'smart',
      icon: '📜',
    },
    {
      id: '3',
      name: 'Community Resources',
      documentCount: 67,
      type: 'smart',
      icon: '🤝',
    },
    {
      id: '4',
      name: 'Research Papers',
      documentCount: 123,
      type: 'smart',
      icon: '📚',
    },
  ]);

  const [libraryStats, setLibraryStats] = createSignal({
    totalDocuments: 247,
    collections: 12,
    favorites: 89,
    sharedToday: 15,
  });

  onMount(() => {
    console.log('HomePage mounted with enhanced dashboard');
  });

  const getCulturalIcon = (sensitivity: string) => {
    switch (sensitivity) {
      case 'sacred':
        return '🔒';
      case 'restricted':
        return '⚠️';
      case 'public':
        return '🌍';
      default:
        return '📄';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return '📄';
      case 'EPUB':
        return '📚';
      case 'TXT':
        return '📝';
      case 'MD':
        return '📋';
      default:
        return '📄';
    }
  };

  return (
    <div class="home-page">
      {/* Status Bar - Following Screen Design Spec */}
      <StatusBar />

      {/* Quick Search Bar */}
      <div class="quick-search-section">
        <div class="search-container">
          <input
            type="search"
            placeholder="Search your library or discover new content on the network..."
            class="quick-search-input"
          />
          <button class="search-button" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          <button class="advanced-search-button">Advanced</button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div class="dashboard-content">
        {/* Left Panel - Recent & Popular */}
        <div class="dashboard-left">
          <div class="dashboard-card recent-popular">
            <h2 class="card-title">
              <span class="title-icon">📄</span>
              Recent Documents
            </h2>
            <div class="document-list">
              {recentDocuments().map(doc => (
                <div class="document-item" data-sensitivity={doc.culturalSensitivity}>
                  <div class="doc-thumbnail">{getTypeIcon(doc.type)}</div>
                  <div class="doc-info">
                    <div class="doc-header">
                      <span class="doc-title">{doc.title}</span>
                      <span class="cultural-indicator">
                        {getCulturalIcon(doc.culturalSensitivity)}
                      </span>
                    </div>
                    <div class="doc-meta">
                      <span class="doc-author">{doc.author}</span>
                      <span class="doc-details">
                        {doc.type} • {doc.size}
                      </span>
                      <span class="doc-time">{doc.lastAccessed}</span>
                    </div>
                  </div>
                  <div class="doc-actions">
                    <button class="action-btn small" title="Quick preview">
                      👁️
                    </button>
                    <button class="action-btn small" title="Open">
                      📖
                    </button>
                    <button class="action-btn small" title="Share">
                      📤
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div class="dashboard-card smart-collections">
            <h2 class="card-title">
              <span class="title-icon">📂</span>
              Smart Collections
            </h2>
            <div class="collections-grid">
              {smartCollections().map(collection => (
                <div class="collection-item">
                  <div class="collection-icon">{collection.icon}</div>
                  <div class="collection-info">
                    <span class="collection-name">{collection.name}</span>
                    <span class="collection-count">{collection.documentCount} documents</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Status & Actions */}
        <div class="dashboard-right">
          <div class="dashboard-card library-overview">
            <h2 class="card-title">
              <span class="title-icon">📊</span>
              Library Overview
            </h2>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{libraryStats().totalDocuments}</span>
                <span class="stat-label">Total Documents</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{libraryStats().collections}</span>
                <span class="stat-label">Collections</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{libraryStats().favorites}</span>
                <span class="stat-label">Favorites</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{libraryStats().sharedToday}</span>
                <span class="stat-label">Shared Today</span>
              </div>
            </div>
          </div>

          <div class="dashboard-card quick-actions">
            <h2 class="card-title">
              <span class="title-icon">⚡</span>
              Quick Actions
            </h2>
            <div class="action-grid">
              <button class="action-btn primary">
                <span class="btn-icon">📤</span>
                <span class="btn-text">Upload Document</span>
              </button>
              <button class="action-btn secondary">
                <span class="btn-icon">📂</span>
                <span class="btn-text">Create Collection</span>
              </button>
              <button class="action-btn secondary">
                <span class="btn-icon">🌐</span>
                <span class="btn-text">Browse Network</span>
              </button>
              <button class="action-btn secondary">
                <span class="btn-icon">🔍</span>
                <span class="btn-text">Advanced Search</span>
              </button>
            </div>
          </div>

          <div class="dashboard-card cultural-awareness">
            <h2 class="card-title">
              <span class="title-icon">🌿</span>
              Cultural Awareness
            </h2>
            <div class="cultural-content">
              <div class="cultural-message">
                <p>
                  <strong>Respecting Indigenous Knowledge:</strong> Always verify cultural
                  sensitivity before sharing traditional materials. Check with community elders when
                  in doubt.
                </p>
              </div>
              <div class="cultural-actions">
                <button class="cultural-btn">View Guidelines</button>
                <button class="cultural-btn secondary">Report Content</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
