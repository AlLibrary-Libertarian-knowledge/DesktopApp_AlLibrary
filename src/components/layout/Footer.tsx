import { Component } from 'solid-js';
import './Footer.css';

const Footer: Component = () => {
  return (
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-left">
          <div class="network-info">
            <span class="network-label">P2P Network:</span>
            <span class="peer-count">12 peers connected</span>
            <span class="network-type">Internet + TOR</span>
          </div>

          <div class="sync-info">
            <span class="sync-label">Last sync:</span>
            <span class="sync-time">2 minutes ago</span>
          </div>
        </div>

        <div class="footer-center">
          <div class="cultural-notice">
            <span class="respect-icon">🌿</span>
            <span class="respect-text">Respecting cultural heritage and traditional knowledge</span>
          </div>
        </div>

        <div class="footer-right">
          <div class="version-info">
            <span class="app-version">AlLibrary v0.1.0</span>
            <span class="build-info">Phase 1 Development</span>
          </div>

          <div class="status-indicators">
            <span class="status-item">
              <span class="status-dot security-good" title="Security: Good"></span>
              <span class="status-label">Secure</span>
            </span>

            <span class="status-item">
              <span class="status-dot privacy-protected" title="Privacy: Protected"></span>
              <span class="status-label">Private</span>
            </span>

            <span class="status-item">
              <span class="status-dot cultural-aware" title="Cultural Sensitivity: Active"></span>
              <span class="status-label">Cultural</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
