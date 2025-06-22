/**
 * Page Header Component
 *
 * Reusable page header with title, breadcrumbs, and actions.
 * Provides consistent page structure across the application.
 */

import { Component, JSX, Show, For } from 'solid-js';
import styles from './PageHeader.module.css';

export interface BreadcrumbItem {
  /** Breadcrumb label */
  label: string;
  /** Navigation path */
  path?: string;
  /** Is current page */
  current?: boolean;
}

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Page subtitle */
  subtitle?: string;
  /** Breadcrumb navigation */
  breadcrumbs?: BreadcrumbItem[];
  /** Header actions */
  actions?: JSX.Element;
  /** Show back button */
  showBackButton?: boolean;
  /** Cultural context indicator */
  culturalContext?: {
    level: number;
    description: string;
  };
  /** Header variant */
  variant?: 'default' | 'minimal' | 'hero';
  /** Cultural theme */
  culturalTheme?: 'indigenous' | 'traditional' | 'ceremonial' | 'default';
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Back button click handler */
  onBackClick?: () => void;
  /** Breadcrumb click handler */
  onBreadcrumbClick?: (path: string) => void;
}

export const PageHeader: Component<PageHeaderProps> = props => {
  // Default props
  const showBackButton = () => props.showBackButton ?? false;
  const variant = () => props.variant || 'default';
  const culturalTheme = () => props.culturalTheme || 'default';

  // Handle back button click
  const handleBackClick = () => {
    props.onBackClick?.();
  };

  // Handle breadcrumb click
  const handleBreadcrumbClick = (path: string) => {
    props.onBreadcrumbClick?.(path);
  };

  // Generate CSS classes
  const headerClasses = () =>
    [
      styles.pageHeader,
      styles[`variant-${variant()}`],
      styles[`theme-${culturalTheme()}`],
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div class={headerClasses()} data-testid={props['data-testid']}>
      {/* Breadcrumbs */}
      <Show when={props.breadcrumbs && props.breadcrumbs.length > 0}>
        <nav class={styles.breadcrumbs} aria-label="Breadcrumb navigation">
          <ol class={styles.breadcrumbList}>
            <For each={props.breadcrumbs}>
              {(item, index) => (
                <li class={styles.breadcrumbItem}>
                  <Show
                    when={item.path && !item.current}
                    fallback={
                      <span class={styles.breadcrumbCurrent} aria-current="page">
                        {item.label}
                      </span>
                    }
                  >
                    <button
                      class={styles.breadcrumbLink}
                      onClick={() => handleBreadcrumbClick(item.path!)}
                    >
                      {item.label}
                    </button>
                  </Show>
                  <Show when={index() < props.breadcrumbs!.length - 1}>
                    <span class={styles.breadcrumbSeparator} aria-hidden="true">
                      /
                    </span>
                  </Show>
                </li>
              )}
            </For>
          </ol>
        </nav>
      </Show>

      {/* Header Content */}
      <div class={styles.headerContent}>
        <div class={styles.headerLeft}>
          {/* Back Button */}
          <Show when={showBackButton()}>
            <button class={styles.backButton} onClick={handleBackClick} aria-label="Go back">
              ← Back
            </button>
          </Show>

          {/* Title Section */}
          <div class={styles.titleSection}>
            <h1 class={styles.pageTitle}>{props.title}</h1>
            <Show when={props.subtitle}>
              <p class={styles.pageSubtitle}>{props.subtitle}</p>
            </Show>
          </div>
        </div>

        {/* Cultural Context Indicator */}
        <Show when={props.culturalContext}>
          <div class={styles.culturalIndicator}>
            <div class={styles.culturalIcon}>🌿</div>
            <div class={styles.culturalInfo}>
              <div class={styles.culturalLevel}>Level {props.culturalContext!.level}</div>
              <div class={styles.culturalDescription}>{props.culturalContext!.description}</div>
            </div>
            <div class={styles.informationBadge}>Information Only</div>
          </div>
        </Show>

        {/* Header Actions */}
        <Show when={props.actions}>
          <div class={styles.headerActions}>{props.actions}</div>
        </Show>
      </div>
    </div>
  );
};

export default PageHeader;
