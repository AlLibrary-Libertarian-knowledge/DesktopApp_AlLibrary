import { Component } from 'solid-js';
import './Header.css';
import logoSvg from '/src/assets/logo.svg';

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (() => void) | undefined;
}

const Header: Component<HeaderProps> = props => {
  return (
    <header class="app-header">
      <div class="header-left">
        <button class="sidebar-toggle" onClick={props.onSidebarToggle} aria-label="Toggle sidebar">
          <span class="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <div class="header-brand">
          <div class="brand-content">
            <img src={logoSvg} alt="AlLibrary Logo" class="app-logo" />
            <div class="brand-text">
              <h1 class="app-title">AlLibrary</h1>
              <span class="app-subtitle">Decentralized Knowledge Sharing</span>
            </div>
          </div>
        </div>
      </div>

      <div class="header-center">
        <div class="search-container">
          <input
            type="search"
            placeholder="Search documents..."
            class="global-search"
            data-testid="search-input"
          />
          <button class="search-button" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>
      </div>

      <div class="header-right">
        <button class="header-action" aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        <button class="header-action" aria-label="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6" />
            <path d="m21 12-6-6-6 6-6-6" />
          </svg>
        </button>

        <div class="network-status">
          <span class="status-indicator online" title="Connected to P2P Network"></span>
          <span class="network-text">Online</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
