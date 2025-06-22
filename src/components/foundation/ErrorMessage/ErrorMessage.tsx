import { Component, createSignal, Show, For } from 'solid-js';
import { CULTURAL_SENSITIVITY_LEVELS, CULTURAL_LABELS } from '../../../constants/cultural';
import styles from './ErrorMessage.module.css';

/**
 * Error Message Types
 */
export type ErrorType = 'network' | 'validation' | 'security' | 'cultural' | 'system' | 'general';

/**
 * Error Severity Levels
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Error Display Variants
 */
export type ErrorVariant = 'default' | 'banner' | 'toast' | 'inline';

/**
 * Cultural Theme Types for Error Styling
 */
export type CulturalTheme =
  | 'indigenous'
  | 'traditional'
  | 'modern'
  | 'ceremonial'
  | 'community'
  | 'default';

/**
 * Error Message Props Interface
 */
export interface ErrorMessageProps {
  // Core Error Properties
  message: string;
  title?: string;
  type?: ErrorType;
  severity?: ErrorSeverity;
  variant?: ErrorVariant;

  // Error Details
  errorCode?: string;
  description?: string;
  timestamp?: Date;
  contactInfo?: string;

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: CulturalTheme;
  culturalSensitivityLevel?: number;
  culturalContext?: string;
  showCulturalIndicator?: boolean;

  // Interaction Properties
  dismissible?: boolean;
  showDetails?: boolean;
  showRetry?: boolean;
  retryLabel?: string;

  // Accessibility Properties
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: 'alert' | 'alertdialog' | 'status';
  ariaLive?: 'off' | 'polite' | 'assertive';

  // Styling Properties
  class?: string;

  // Event Handlers
  onDismiss?: () => void;
  onRetry?: () => void;
  onShowDetails?: () => void;
}

/**
 * Error Message Component
 *
 * A comprehensive error message component with cultural context support
 * and accessibility features. Cultural information is displayed for educational
 * purposes only - never for access restriction.
 *
 * @example
 * ```tsx
 * <ErrorMessage
 *   message="Network connection failed"
 *   severity="error"
 *   type="network"
 *   culturalTheme="indigenous"
 *   culturalContext="Network sharing protocols"
 *   showRetry={true}
 *   onRetry={handleRetry}
 * />
 * ```
 */
const ErrorMessage: Component<ErrorMessageProps> = props => {
  // Component state
  const [isDetailsExpanded, setIsDetailsExpanded] = createSignal(false);
  const [showCulturalTooltip, setShowCulturalTooltip] = createSignal(false);

  /**
   * Get Error Icon based on severity
   */
  const getErrorIcon = () => {
    switch (props.severity) {
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'critical':
        return '🚨';
      default:
        return '⚠️';
    }
  };

  /**
   * Generate Cultural Context Tooltip
   */
  const getCulturalTooltip = () => {
    if (!props.culturalContext && !props.culturalSensitivityLevel) return null;

    const sensitivityLabel = props.culturalSensitivityLevel
      ? CULTURAL_LABELS[props.culturalSensitivityLevel]
      : null;

    return {
      title: props.culturalContext || sensitivityLabel,
      description: 'Cultural context provided for educational purposes only',
      sensitivityLevel: sensitivityLabel,
    };
  };

  /**
   * Generate CSS Classes
   */
  const classes = () =>
    [
      styles['error-message'],
      styles[`error-${props.variant || 'default'}`],
      styles[`error-${props.severity || 'error'}`],
      props.type && styles[`error-type-${props.type}`],
      props.culturalTheme && styles[`error-cultural-${props.culturalTheme}`],
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
    'aria-live': props.ariaLive || 'polite',
    role: props.role || 'alert',
  });

  const culturalTooltip = getCulturalTooltip();

  return (
    <div class={classes()} {...ariaAttributes()}>
      {/* Cultural Indicator */}
      {props.showCulturalIndicator && props.culturalTheme && (
        <div
          class={styles['error-cultural-indicator']}
          aria-label={`Cultural theme: ${props.culturalTheme}`}
          onMouseEnter={() => {
            if (culturalTooltip) setShowCulturalTooltip(true);
          }}
          onMouseLeave={() => {
            setShowCulturalTooltip(false);
          }}
        >
          🌿
        </div>
      )}

      <div class={styles['error-content']}>
        {/* Error Header */}
        <div class={styles['error-header']}>
          <div class={styles['error-icon']}>{getErrorIcon()}</div>
          <div class={styles['error-text']}>
            {props.title && <h3 class={styles['error-title']}>{props.title}</h3>}
            <p class={styles['error-message-text']}>{props.message}</p>
          </div>

          {/* Dismiss Button */}
          {props.dismissible && (
            <button
              class={styles['error-dismiss']}
              onClick={() => props.onDismiss?.()}
              aria-label="Dismiss error message"
            >
              ✕
            </button>
          )}
        </div>

        {/* Error Details */}
        {(props.description || props.errorCode || props.timestamp || props.contactInfo) && (
          <div class={styles['error-details']}>
            <button
              class={styles['error-details-toggle']}
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded())}
              aria-expanded={isDetailsExpanded()}
              aria-controls="error-details-content"
            >
              {isDetailsExpanded() ? 'Hide Details' : 'Show Details'}
            </button>

            <Show when={isDetailsExpanded()}>
              <div id="error-details-content" class={styles['error-details-content']}>
                {props.description && (
                  <div class={styles['error-description']}>
                    <strong>Description:</strong> {props.description}
                  </div>
                )}
                {props.errorCode && (
                  <div class={styles['error-code']}>
                    <strong>Error Code:</strong> {props.errorCode}
                  </div>
                )}
                {props.timestamp && (
                  <div class={styles['error-timestamp']}>
                    <strong>Timestamp:</strong> {props.timestamp.toLocaleString()}
                  </div>
                )}
                {props.contactInfo && (
                  <div class={styles['error-contact']}>
                    <strong>Contact:</strong> {props.contactInfo}
                  </div>
                )}
              </div>
            </Show>
          </div>
        )}

        {/* Error Actions */}
        {props.showRetry && (
          <div class={styles['error-actions']}>
            <button
              class={styles['error-retry']}
              onClick={() => props.onRetry?.()}
              aria-label={props.retryLabel || 'Retry operation'}
            >
              {props.retryLabel || 'Retry'}
            </button>
          </div>
        )}

        {/* Cultural Information */}
        {props.culturalSensitivityLevel && (
          <div class={styles['error-cultural-info']}>
            <span class={styles['cultural-badge']}>
              Cultural Context: {CULTURAL_LABELS[props.culturalSensitivityLevel]}
            </span>
            <div class={styles['error-context']}>
              Cultural information provided for educational purposes only
            </div>
          </div>
        )}
      </div>

      {/* Cultural Context Tooltip */}
      {showCulturalTooltip() && culturalTooltip && (
        <div class={styles['error-cultural-tooltip']} role="tooltip">
          <div class={styles['tooltip-content']}>
            <strong>{culturalTooltip.title}</strong>
            {culturalTooltip.sensitivityLevel && (
              <div class={styles['sensitivity-level']}>{culturalTooltip.sensitivityLevel}</div>
            )}
            <div class={styles['tooltip-description']}>{culturalTooltip.description}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;
