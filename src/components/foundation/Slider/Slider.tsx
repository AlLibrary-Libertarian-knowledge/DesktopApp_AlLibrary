/**
 * Slider Foundation Component
 *
 * An accessible range slider component with keyboard navigation.
 * Follows WCAG 2.1 AA standards with proper ARIA attributes.
 */

import { Component, createSignal, createEffect, createUniqueId } from 'solid-js';
import styles from './Slider.module.css';

export interface SliderProps {
  /** Current value */
  value?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Slider size */
  size?: 'sm' | 'md' | 'lg';
  /** Slider color variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  /** Slider label */
  label?: string;
  /** Show value indicator */
  showValue?: boolean;
  /** Value formatter function */
  formatValue?: (value: number) => string;
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Change event handler */
  onChange?: (value: number) => void;
  /** Input event handler (fires during drag) */
  onInput?: (value: number) => void;
  /** Focus event handler */
  onFocus?: () => void;
  /** Blur event handler */
  onBlur?: () => void;
}

export const Slider: Component<SliderProps> = props => {
  const id = createUniqueId();
  const [isDragging, setIsDragging] = createSignal(false);

  // Default props
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 100;
  const step = () => props.step ?? 1;
  const value = () => props.value ?? min();
  const size = () => props.size || 'md';
  const variant = () => props.variant || 'default';
  const showValue = () => props.showValue ?? true;

  // Calculate percentage for styling
  const percentage = () => {
    const range = max() - min();
    const adjustedValue = value() - min();
    return range > 0 ? (adjustedValue / range) * 100 : 0;
  };

  // Format value for display
  const formatValue = () => {
    return props.formatValue ? props.formatValue(value()) : value().toString();
  };

  // Handle input change
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    props.onChange?.(newValue);
  };

  // Handle input during drag
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    props.onInput?.(newValue);
  };

  // Handle mouse down
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Setup global mouse up listener
  createEffect(() => {
    if (!isDragging()) return;

    const handleGlobalMouseUp = () => setIsDragging(false);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  });

  const sliderClasses = () =>
    [
      styles.slider,
      styles[`slider-${size()}`],
      styles[`slider-${variant()}`],
      isDragging() && styles.dragging,
      props.disabled && styles.disabled,
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div class={sliderClasses()} data-testid={props['data-testid']}>
      {props.label && (
        <label class={styles.label} for={id}>
          {props.label}
        </label>
      )}

      <div class={styles.sliderContainer}>
        <div class={styles.track}>
          <div class={styles.fill} style={{ width: `${percentage()}%` }} />
          <div class={styles.thumb} style={{ left: `${percentage()}%` }} />
        </div>

        <input
          id={id}
          type="range"
          class={styles.input}
          min={min()}
          max={max()}
          step={step()}
          value={value()}
          disabled={props.disabled}
          onChange={handleChange}
          onInput={handleInput}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          aria-valuemin={min()}
          aria-valuemax={max()}
          aria-valuenow={value()}
          aria-valuetext={formatValue()}
        />
      </div>

      {showValue() && <div class={styles.valueDisplay}>{formatValue()}</div>}
    </div>
  );
};

export default Slider;
