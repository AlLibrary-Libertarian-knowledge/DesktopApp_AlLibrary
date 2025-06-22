/**
 * Badge Foundation Component
 *
 * A versatile badge component for displaying status, counts, and labels.
 * Supports multiple variants, sizes, and cultural themes.
 */

import { Component, JSX } from 'solid-js';
import styles from './Badge.module.css';

export interface BadgeProps {
  /** Badge content */
  children: JSX.Element;
  /** Badge variant */
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'outline';
  /** Badge size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether badge should be rounded */
  rounded?: boolean;
  /** Whether badge should be removable */
  removable?: boolean;
  /** Custom CSS class */
  class?: string;
  /** Cultural theme */
  culturalTheme?: 'traditional' | 'indigenous' | 'ceremonial';
  /** Test ID for testing */
  'data-testid'?: string;
  /** Click event handler */
  onClick?: () => void;
  /** Remove event handler */
  onRemove?: () => void;
}

export const Badge: Component<BadgeProps> = props => {
  const variant = () => props.variant || 'default';
  const size = () => props.size || 'md';

  const badgeClasses = () =>
    [
      styles.badge,
      styles[`badge-${variant()}`],
      styles[`badge-${size()}`],
      props.rounded && styles.rounded,
      props.removable && styles.removable,
      props.culturalTheme && styles[`cultural-${props.culturalTheme}`],
      props.onClick && styles.clickable,
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <span
      class={badgeClasses()}
      onClick={props.onClick}
      data-testid={props['data-testid']}
      role={props.onClick ? 'button' : undefined}
      tabIndex={props.onClick ? 0 : undefined}
      onKeyDown={
        props.onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                props.onClick?.();
              }
            }
          : undefined
      }
    >
      <span class={styles.content}>{props.children}</span>

      {props.removable && (
        <button
          type="button"
          class={styles.removeButton}
          onClick={e => {
            e.stopPropagation();
            props.onRemove?.();
          }}
          aria-label="Remove badge"
        >
          ×
        </button>
      )}
    </span>
  );
};

export default Badge;
