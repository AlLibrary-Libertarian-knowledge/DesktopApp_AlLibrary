/**
 * Tooltip Foundation Component
 *
 * An accessible tooltip component with keyboard navigation and cultural theme support.
 * Follows WCAG 2.1 AA standards with proper ARIA attributes.
 */

import { Component, createSignal, createEffect, createUniqueId, JSX } from 'solid-js';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** Tooltip content */
  content: string | JSX.Element;
  /** Tooltip placement */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Tooltip trigger */
  trigger?: 'hover' | 'click' | 'focus';
  /** Tooltip size */
  size?: 'sm' | 'md' | 'lg';
  /** Tooltip variant */
  variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
  /** Cultural theme */
  culturalTheme?: 'default' | 'indigenous' | 'traditional' | 'ceremonial';
  /** Delay before showing (ms) */
  showDelay?: number;
  /** Delay before hiding (ms) */
  hideDelay?: number;
  /** Whether tooltip is disabled */
  disabled?: boolean;
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Children to wrap */
  children: JSX.Element;
}

export const Tooltip: Component<TooltipProps> = props => {
  const id = createUniqueId();
  const [isVisible, setIsVisible] = createSignal(false);
  const [showTimeout, setShowTimeout] = createSignal<number | null>(null);
  const [hideTimeout, setHideTimeout] = createSignal<number | null>(null);

  // Default props
  const placement = () => props.placement || 'top';
  const trigger = () => props.trigger || 'hover';
  const size = () => props.size || 'md';
  const variant = () => props.variant || 'default';
  const culturalTheme = () => props.culturalTheme || 'default';
  const showDelay = () => props.showDelay ?? 200;
  const hideDelay = () => props.hideDelay ?? 100;

  // Clear timeouts on cleanup
  createEffect(() => {
    return () => {
      const show = showTimeout();
      const hide = hideTimeout();
      if (show) clearTimeout(show);
      if (hide) clearTimeout(hide);
    };
  });

  // Show tooltip
  const showTooltip = () => {
    if (props.disabled) return;

    const hide = hideTimeout();
    if (hide) {
      clearTimeout(hide);
      setHideTimeout(null);
    }

    const timeout = setTimeout(() => {
      setIsVisible(true);
      setShowTimeout(null);
    }, showDelay());

    setShowTimeout(timeout);
  };

  // Hide tooltip
  const hideTooltip = () => {
    const show = showTimeout();
    if (show) {
      clearTimeout(show);
      setShowTimeout(null);
    }

    const timeout = setTimeout(() => {
      setIsVisible(false);
      setHideTimeout(null);
    }, hideDelay());

    setHideTimeout(timeout);
  };

  // Toggle tooltip (for click trigger)
  const toggleTooltip = () => {
    if (isVisible()) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isVisible()) {
      hideTooltip();
    }
  };

  // Event handlers based on trigger
  const getEventHandlers = () => {
    const triggerType = trigger();

    if (triggerType === 'hover') {
      return {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
      };
    }

    if (triggerType === 'click') {
      return {
        onClick: toggleTooltip,
      };
    }

    if (triggerType === 'focus') {
      return {
        onFocus: showTooltip,
        onBlur: hideTooltip,
      };
    }

    return {};
  };

  // Generate CSS classes
  const tooltipClasses = () =>
    [
      styles.tooltip,
      styles[`tooltip-${placement()}`],
      styles[`tooltip-${size()}`],
      styles[`tooltip-${variant()}`],
      styles[`tooltip-cultural-${culturalTheme()}`],
      isVisible() && styles.visible,
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  const wrapperClasses = () =>
    [styles.tooltipWrapper, styles[`wrapper-${placement()}`]].filter(Boolean).join(' ');

  return (
    <div class={wrapperClasses()} data-testid={props['data-testid']}>
      <div
        {...getEventHandlers()}
        onKeyDown={handleKeyDown}
        aria-describedby={isVisible() ? id : undefined}
        tabIndex={trigger() === 'focus' ? 0 : undefined}
      >
        {props.children}
      </div>

      {isVisible() && (
        <div id={id} class={tooltipClasses()} role="tooltip" aria-hidden={!isVisible()}>
          <div class={styles.tooltipContent}>{props.content}</div>
          <div class={styles.tooltipArrow} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
