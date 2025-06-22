/**
 * Breadcrumb Navigation Foundation Component
 *
 * An accessible breadcrumb navigation component with cultural context support.
 * Follows WCAG 2.1 AA standards with proper ARIA attributes.
 */

import { Component, For, JSX } from 'solid-js';
import styles from './BreadcrumbNavigation.module.css';

export interface BreadcrumbItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Navigation path or URL */
  path?: string;
  /** Whether this item is clickable */
  clickable?: boolean;
  /** Cultural context indicator */
  culturalContext?: string;
  /** Icon component */
  icon?: JSX.Element;
}

export interface BreadcrumbNavigationProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Separator between items */
  separator?: string | JSX.Element;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'default' | 'muted' | 'primary';
  /** Cultural theme */
  culturalTheme?: 'default' | 'indigenous' | 'traditional' | 'ceremonial';
  /** Show home icon */
  showHomeIcon?: boolean;
  /** Maximum items to show before collapsing */
  maxItems?: number;
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Click handler for breadcrumb items */
  onItemClick?: (item: BreadcrumbItem) => void;
}

export const BreadcrumbNavigation: Component<BreadcrumbNavigationProps> = props => {
  // Default props
  const separator = () => props.separator || '/';
  const size = () => props.size || 'md';
  const variant = () => props.variant || 'default';
  const culturalTheme = () => props.culturalTheme || 'default';
  const maxItems = () => props.maxItems || 5;

  // Handle item click
  const handleItemClick = (item: BreadcrumbItem, event: MouseEvent) => {
    if (!item.clickable) {
      event.preventDefault();
      return;
    }
    props.onItemClick?.(item);
  };

  // Get items to display (with collapsing logic)
  const getDisplayItems = () => {
    const items = props.items;
    const max = maxItems();

    if (items.length <= max) {
      return items;
    }

    // Always show first and last items, collapse middle
    const first = items[0];
    const last = items[items.length - 1];
    const beforeLast = items.slice(-2, -1);

    return [first, { id: 'ellipsis', label: '...', clickable: false }, ...beforeLast, last];
  };

  // Generate CSS classes
  const breadcrumbClasses = () =>
    [
      styles.breadcrumb,
      styles[`breadcrumb-${size()}`],
      styles[`breadcrumb-${variant()}`],
      styles[`breadcrumb-cultural-${culturalTheme()}`],
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  const itemClasses = (item: BreadcrumbItem, isLast: boolean) =>
    [
      styles.breadcrumbItem,
      item.clickable && styles.clickable,
      isLast && styles.current,
      item.culturalContext && styles.hasCulturalContext,
    ]
      .filter(Boolean)
      .join(' ');

  const displayItems = getDisplayItems();

  return (
    <nav
      class={breadcrumbClasses()}
      aria-label="Breadcrumb navigation"
      data-testid={props['data-testid']}
    >
      <ol class={styles.breadcrumbList}>
        {props.showHomeIcon && (
          <li class={styles.breadcrumbItem}>
            <a
              href="/"
              class={styles.breadcrumbLink}
              aria-label="Home"
              onClick={e => {
                e.preventDefault();
                props.onItemClick?.({ id: 'home', label: 'Home', path: '/', clickable: true });
              }}
            >
              <svg
                class={styles.homeIcon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
            </a>
            <span class={styles.separator} aria-hidden="true">
              {separator()}
            </span>
          </li>
        )}

        <For each={displayItems}>
          {(item, index) => {
            const isLast = index() === displayItems.length - 1;
            const isEllipsis = item.id === 'ellipsis';

            return (
              <li class={itemClasses(item, isLast)}>
                {isEllipsis ? (
                  <span class={styles.ellipsis} aria-label="More items">
                    {item.label}
                  </span>
                ) : item.clickable && !isLast ? (
                  <a
                    class={styles.breadcrumbLink}
                    href={item.path || '#'}
                    onClick={e => handleItemClick(item, e)}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.icon && <span class={styles.itemIcon}>{item.icon}</span>}
                    <span class={styles.itemLabel}>{item.label}</span>
                    {item.culturalContext && (
                      <span
                        class={styles.culturalIndicator}
                        aria-label={`Cultural context: ${item.culturalContext}`}
                        title={item.culturalContext}
                      >
                        🌿
                      </span>
                    )}
                  </a>
                ) : (
                  <span class={styles.breadcrumbCurrent} aria-current={isLast ? 'page' : undefined}>
                    {item.icon && <span class={styles.itemIcon}>{item.icon}</span>}
                    <span class={styles.itemLabel}>{item.label}</span>
                    {item.culturalContext && (
                      <span
                        class={styles.culturalIndicator}
                        aria-label={`Cultural context: ${item.culturalContext}`}
                        title={item.culturalContext}
                      >
                        🌿
                      </span>
                    )}
                  </span>
                )}

                {!isLast && (
                  <span class={styles.separator} aria-hidden="true">
                    {separator()}
                  </span>
                )}
              </li>
            );
          }}
        </For>
      </ol>
    </nav>
  );
};

export default BreadcrumbNavigation;
