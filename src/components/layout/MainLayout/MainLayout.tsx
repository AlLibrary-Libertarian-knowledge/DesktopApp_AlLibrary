/**
 * Main Layout Component
 *
 * Primary layout wrapper for all application pages.
 * Provides consistent structure with header, sidebar, main content area.
 */

import { Component, JSX, Show } from 'solid-js';
import styles from './MainLayout.module.css';

export interface MainLayoutProps {
  /** Page content */
  children: JSX.Element;
  /** Show sidebar */
  showSidebar?: boolean;
  /** Show header */
  showHeader?: boolean;
  /** Layout variant */
  variant?: 'default' | 'fullscreen' | 'minimal';
  /** Cultural theme */
  culturalTheme?: 'indigenous' | 'traditional' | 'ceremonial' | 'default';
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

export const MainLayout: Component<MainLayoutProps> = props => {
  // Default props
  const showSidebar = () => props.showSidebar ?? true;
  const showHeader = () => props.showHeader ?? true;
  const variant = () => props.variant || 'default';
  const culturalTheme = () => props.culturalTheme || 'default';

  // Generate CSS classes
  const layoutClasses = () =>
    [
      styles.mainLayout,
      styles[`variant-${variant()}`],
      styles[`theme-${culturalTheme()}`],
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div class={layoutClasses()} data-testid={props['data-testid']}>
      {/* Header */}
      <Show when={showHeader()}>
        <header class={styles.header}>
          <div class={styles.headerContent}>
            <div class={styles.headerLeft}>
              <h1 class={styles.appTitle}>AlLibrary</h1>
            </div>
            <div class={styles.headerCenter}>{/* Navigation could go here */}</div>
            <div class={styles.headerRight}>{/* User actions could go here */}</div>
          </div>
        </header>
      </Show>

      <div class={styles.layoutBody}>
        {/* Sidebar */}
        <Show when={showSidebar()}>
          <aside class={styles.sidebar}>
            <nav class={styles.navigation}>
              {/* Navigation menu would go here */}
              <div class={styles.navPlaceholder}>Navigation Menu</div>
            </nav>
          </aside>
        </Show>

        {/* Main Content */}
        <main class={styles.mainContent}>
          <div class={styles.contentWrapper}>{props.children}</div>
        </main>
      </div>

      {/* Footer */}
      <footer class={styles.footer}>
        <div class={styles.footerContent}>
          <div class={styles.footerLeft}>
            <span class={styles.footerText}>AlLibrary - Decentralized Knowledge Sharing</span>
          </div>
          <div class={styles.footerRight}>
            <span class={styles.footerText}>
              Information Freedom • Cultural Respect • Anti-Censorship
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
