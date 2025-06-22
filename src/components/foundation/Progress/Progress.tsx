/**
 * Progress Foundation Component
 *
 * A reusable progress indicator component with accessibility features.
 * Follows WCAG 2.1 AA standards with proper ARIA attributes and announcements.
 *
 * @example
 * ```tsx
 * <Progress
 *   value={75}
 *   max={100}
 *   size="md"
 *   variant="primary"
 *   showLabel={true}
 * />
 * ```
 *
 * @accessibility
 * - ARIA progressbar role
 * - Screen reader announcements
 * - High contrast support
 * - Reduced motion support
 *
 * @performance
 * - CSS animations for smooth progress
 * - Optimized rendering
 * - Minimal re-renders
 */

import { Component, createMemo, Show } from 'solid-js';
import styles from './Progress.module.css';

export interface ProgressProps {
  /** Current progress value */
  value: number;
  /** Maximum progress value */
  max?: number;
  /** Minimum progress value */
  min?: number;
  /** Progress bar size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Progress bar color variant */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /** Whether to show percentage label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Whether progress is indeterminate */
  indeterminate?: boolean;
  /** Custom CSS class */
  class?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** ID for aria-labelledby */
  ariaLabelledBy?: string;
  /** Additional description for screen readers */
  ariaDescribedBy?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

export const Progress: Component<ProgressProps> = props => {
  // Default props
  const size = () => props.size || 'md';
  const variant = () => props.variant || 'primary';
  const max = () => props.max || 100;
  const min = () => props.min || 0;
  const showLabel = () => props.showLabel !== false;

  // Calculate progress percentage
  const percentage = createMemo(() => {
    if (props.indeterminate) return 0;
    const range = max() - min();
    const normalizedValue = Math.max(min(), Math.min(max(), props.value));
    return ((normalizedValue - min()) / range) * 100;
  });

  // Generate label text
  const labelText = createMemo(() => {
    if (props.label) return props.label;
    if (props.indeterminate) return 'Loading...';
    return `${Math.round(percentage())}%`;
  });

  // Generate CSS classes
  const progressClasses = () =>
    [
      styles.progress,
      styles[`progress-${size()}`],
      styles[`progress-${variant()}`],
      props.indeterminate && styles.indeterminate,
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  // Generate ARIA attributes
  const ariaAttributes = () => ({
    'aria-label': props.ariaLabel,
    'aria-labelledby': props.ariaLabelledBy,
    'aria-describedby': props.ariaDescribedBy,
    'aria-valuenow': props.indeterminate ? undefined : props.value,
    'aria-valuemin': props.indeterminate ? undefined : min(),
    'aria-valuemax': props.indeterminate ? undefined : max(),
    'aria-valuetext': props.indeterminate ? 'Loading' : `${Math.round(percentage())} percent`,
  });

  return (
    <div class={styles.progressContainer}>
      {/* Progress Label */}
      <Show when={showLabel()}>
        <div class={styles.progressLabel}>
          <span class={styles.labelText}>{labelText()}</span>
          <Show when={!props.indeterminate && !props.label}>
            <span class={styles.labelPercentage}>{Math.round(percentage())}%</span>
          </Show>
        </div>
      </Show>

      {/* Progress Bar */}
      <div
        class={progressClasses()}
        role="progressbar"
        data-testid={props['data-testid']}
        {...ariaAttributes()}
      >
        <div
          class={styles.progressFill}
          style={{
            width: props.indeterminate ? '100%' : `${percentage()}%`,
          }}
        />

        {/* Indeterminate Animation */}
        <Show when={props.indeterminate}>
          <div class={styles.progressIndeterminate} />
        </Show>
      </div>
    </div>
  );
};

export default Progress;
