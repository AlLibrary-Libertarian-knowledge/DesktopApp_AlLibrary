/**
 * Switch Foundation Component
 *
 * An accessible toggle switch component with smooth animations.
 * Follows WCAG 2.1 AA standards with proper ARIA attributes.
 */

import { Component, createUniqueId } from 'solid-js';
import styles from './Switch.module.css';

export interface SwitchProps {
  /** Whether the switch is checked */
  checked?: boolean;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Switch size */
  size?: 'sm' | 'md' | 'lg';
  /** Switch color variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  /** Switch label */
  label?: string;
  /** Switch description */
  description?: string;
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Change event handler */
  onChange?: (checked: boolean) => void;
  /** Focus event handler */
  onFocus?: () => void;
  /** Blur event handler */
  onBlur?: () => void;
}

export const Switch: Component<SwitchProps> = props => {
  const id = createUniqueId();
  const size = () => props.size || 'md';
  const variant = () => props.variant || 'default';

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    props.onChange?.(target.checked);
  };

  const switchClasses = () =>
    [
      styles.switch,
      styles[`switch-${size()}`],
      styles[`switch-${variant()}`],
      props.checked && styles.checked,
      props.disabled && styles.disabled,
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div class={switchClasses()} data-testid={props['data-testid']}>
      <label class={styles.label} for={id}>
        <input
          id={id}
          type="checkbox"
          class={styles.input}
          checked={props.checked}
          disabled={props.disabled}
          onChange={handleChange}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          role="switch"
          aria-checked={props.checked}
          aria-describedby={props.description ? `${id}-description` : undefined}
        />

        <span class={styles.track}>
          <span class={styles.thumb} />
        </span>

        {props.label && <span class={styles.labelText}>{props.label}</span>}
      </label>

      {props.description && (
        <p id={`${id}-description`} class={styles.description}>
          {props.description}
        </p>
      )}
    </div>
  );
};

export default Switch;
