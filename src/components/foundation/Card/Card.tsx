import { Component, ParentProps, JSX, Show, createSignal } from 'solid-js';
import { CULTURAL_SENSITIVITY_LEVELS, CULTURAL_LABELS } from '../../../constants/cultural';
import styles from './Card.module.css';

/**
 * Cultural Theme Types for Card Styling
 * Provides cultural context through visual design without access restriction
 */
export type CulturalTheme =
  | 'indigenous'
  | 'traditional'
  | 'modern'
  | 'ceremonial'
  | 'community'
  | 'default';

/**
 * Card Content Types
 * Defines different content categories for cultural context
 */
export type CardContentType =
  | 'document'
  | 'collection'
  | 'cultural'
  | 'educational'
  | 'community'
  | 'general';

/**
 * Enhanced Card Props Interface
 * Follows SOLID principles with comprehensive accessibility and cultural support
 */
export interface CardProps extends ParentProps {
  // Core Card Properties
  variant?: 'default' | 'outlined' | 'elevated' | 'filled' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  header?: JSX.Element;
  footer?: JSX.Element;
  title?: string;
  subtitle?: string;
  hoverable?: boolean;
  clickable?: boolean;
  loading?: boolean;
  disabled?: boolean;
  class?: string;

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: CulturalTheme;
  culturalSensitivityLevel?: number;
  culturalContext?: string;
  showCulturalIndicator?: boolean;
  contentType?: CardContentType;
  traditionalLayout?: boolean;

  // Accessibility Properties
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
  role?: string;

  // Security Properties
  requiresVerification?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'failed' | 'unverified';
  securityLevel?: 'low' | 'medium' | 'high' | 'critical';

  // Event Handlers
  onClick?: (e: MouseEvent) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;

  // Metadata Properties
  id?: string;
  dataTestId?: string;
}

/**
 * Card Component
 *
 * A comprehensive, accessible card component with cultural theme support
 * and security validation. Cultural information is displayed for educational
 * purposes only - never for access restriction.
 *
 * @example
 * ```tsx
 * <Card
 *   culturalTheme="indigenous"
 *   culturalContext="Traditional knowledge card"
 *   ariaLabel="Traditional knowledge content"
 *   contentType="cultural"
 * >
 *   <p>Traditional knowledge content</p>
 * </Card>
 * ```
 */
const Card: Component<CardProps> = props => {
  // Internal state for accessibility and cultural context
  const [isFocused, setIsFocused] = createSignal(false);
  const [isHovered, setIsHovered] = createSignal(false);
  const [showCulturalTooltip, setShowCulturalTooltip] = createSignal(false);

  /**
   * Generate Cultural Context Tooltip
   */
  const getCulturalTooltip = () => {
    if (!props.culturalContext && !props.culturalSensitivityLevel) return null;

    const sensitivityLabel = props.culturalSensitivityLevel
      ? CULTURAL_LABELS[props.culturalSensitivityLevel] || 'Cultural Context'
      : null;

    return {
      title: props.culturalContext || sensitivityLabel,
      description: 'Cultural context provided for educational purposes only',
      sensitivityLevel: sensitivityLabel,
      contentType: props.contentType,
    };
  };

  /**
   * Generate CSS Classes
   */
  const classes = () =>
    [
      styles.card,
      styles[`card-${props.variant || 'default'}`],
      styles[`card-padding-${props.padding || 'md'}`],
      props.culturalTheme && styles[`card-cultural-${props.culturalTheme}`],
      props.contentType && styles[`card-content-${props.contentType}`],
      props.hoverable && styles['card-hoverable'],
      props.clickable && styles['card-clickable'],
      props.loading && styles['card-loading'],
      props.disabled && styles['card-disabled'],
      isFocused() && styles['card-focused'],
      isHovered() && styles['card-hovered'],
      props.traditionalLayout && styles['card-traditional'],
      props.requiresVerification && styles['card-verification-required'],
      props.verificationStatus && styles[`card-verification-${props.verificationStatus}`],
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  /**
   * Generate ARIA Attributes
   */
  const ariaAttributes = () => ({
    'aria-label': props.ariaLabel,
    'aria-describedby': props.ariaDescribedBy,
    'aria-expanded': props.ariaExpanded,
    'aria-pressed': props.ariaPressed,
    'aria-busy': props.loading,
    'aria-disabled': props.disabled,
    role: props.role || (props.clickable ? 'button' : undefined),
    tabindex: props.clickable && !props.disabled ? 0 : undefined,
  });

  /**
   * Handle Click Events
   */
  const handleClick = (e: MouseEvent) => {
    if (props.clickable && !props.disabled && props.onClick) {
      props.onClick(e);
    }
  };

  /**
   * Handle Keyboard Events
   */
  const handleKeyDown = (e: KeyboardEvent) => {
    if (props.clickable && !props.disabled) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        props.onClick?.(e as any);
      }
    }
    props.onKeyDown?.(e);
  };

  /**
   * Handle Focus Events
   */
  const handleFocus = () => {
    setIsFocused(true);
    props.onFocus?.();
  };

  /**
   * Handle Blur Events
   */
  const handleBlur = () => {
    setIsFocused(false);
    props.onBlur?.();
  };

  /**
   * Handle Mouse Events
   */
  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowCulturalTooltip(true);
    props.onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowCulturalTooltip(false);
    props.onMouseLeave?.();
  };

  /**
   * Get Verification Status Icon
   */
  const getVerificationIcon = () => {
    switch (props.verificationStatus) {
      case 'verified':
        return '✅';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏳';
      case 'unverified':
        return '⚠️';
      default:
        return null;
    }
  };

  const culturalTooltip = getCulturalTooltip();

  return (
    <div
      id={props.id}
      data-testid={props.dataTestId}
      class={classes()}
      {...ariaAttributes()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading Overlay */}
      <Show when={props.loading}>
        <div class={styles['card-loading-overlay']}>
          <div class={styles['card-spinner']} />
        </div>
      </Show>

      {/* Cultural Indicator */}
      <Show when={props.showCulturalIndicator && props.culturalTheme}>
        <div
          class={styles['card-cultural-indicator']}
          aria-label={`Cultural theme: ${props.culturalTheme}`}
        >
          🌿
        </div>
      </Show>

      {/* Verification Status */}
      <Show when={props.requiresVerification}>
        <div
          class={styles['card-verification-status']}
          aria-label={`Verification status: ${props.verificationStatus || 'unverified'}`}
        >
          {getVerificationIcon()}
        </div>
      </Show>

      {/* Header */}
      <Show when={props.header}>
        <div class={styles['card-header']}>{props.header}</div>
      </Show>

      {/* Title Section */}
      <Show when={props.title || props.subtitle}>
        <div class={styles['card-title-section']}>
          <Show when={props.title}>
            <h3 class={styles['card-title']}>{props.title}</h3>
          </Show>
          <Show when={props.subtitle}>
            <p class={styles['card-subtitle']}>{props.subtitle}</p>
          </Show>
        </div>
      </Show>

      {/* Content */}
      <Show when={props.children}>
        <div class={styles['card-content']}>{props.children}</div>
      </Show>

      {/* Footer */}
      <Show when={props.footer}>
        <div class={styles['card-footer']}>{props.footer}</div>
      </Show>

      {/* Cultural Context Tooltip */}
      <Show when={showCulturalTooltip() && culturalTooltip}>
        <div class={styles['card-cultural-tooltip']} role="tooltip">
          <div class={styles['tooltip-content']}>
            <strong>{culturalTooltip?.title}</strong>
            {culturalTooltip?.sensitivityLevel && (
              <div class={styles['sensitivity-level']}>{culturalTooltip.sensitivityLevel}</div>
            )}
            {culturalTooltip?.contentType && (
              <div class={styles['content-type']}>Content Type: {culturalTooltip.contentType}</div>
            )}
            <div class={styles['tooltip-description']}>{culturalTooltip?.description}</div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Card;
