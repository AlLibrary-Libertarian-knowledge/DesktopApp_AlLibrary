import { Component, ParentProps, createSignal, createEffect } from 'solid-js';
import { CULTURAL_SENSITIVITY_LEVELS, CULTURAL_LABELS } from '../../../constants/cultural';
import styles from './Button.module.css';

/**
 * Cultural Theme Types for Button Styling
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
 * Security Validation Types
 * Ensures technical security without content censorship
 */
export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Enhanced Button Props Interface
 * Follows SOLID principles with comprehensive accessibility and cultural support
 */
export interface ButtonProps extends ParentProps {
  // Core Button Properties
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'futuristic';
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'blue' | 'green' | 'red' | 'orange' | 'default';

  // State Properties
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';

  // Styling Properties
  class?: string;
  title?: string;

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: CulturalTheme;
  culturalSensitivityLevel?: number;
  culturalContext?: string;
  showCulturalIndicator?: boolean;

  // Accessibility Properties
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
  ariaControls?: string;
  role?: string;

  // Security Properties (TECHNICAL ONLY - NO CONTENT CENSORSHIP)
  securityLevel?: SecurityLevel;
  requiresValidation?: boolean;
  validationMessage?: string;

  // Event Handlers
  onClick?: (e: MouseEvent) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;

  // Form Properties
  name?: string;
  value?: string;
  form?: string;
}

/**
 * Button Component
 *
 * A comprehensive, accessible button component with cultural theme support
 * and security validation. Cultural information is displayed for educational
 * purposes only - never for access restriction.
 *
 * @example
 * ```tsx
 * <Button
 *   variant="primary"
 *   culturalTheme="indigenous"
 *   culturalContext="Traditional knowledge sharing"
 *   ariaLabel="Share traditional knowledge"
 * >
 *   Share Knowledge
 * </Button>
 * ```
 */
const Button: Component<ButtonProps> = props => {
  // Internal state for validation and accessibility
  const [isValidated, setIsValidated] = createSignal(false);
  const [validationError, setValidationError] = createSignal<string | null>(null);
  const [isFocused, setIsFocused] = createSignal(false);

  // Cultural context display state
  const [showCulturalTooltip, setShowCulturalTooltip] = createSignal(false);

  // Security validation effect
  createEffect(() => {
    if (props.requiresValidation && props.securityLevel) {
      // Perform technical security validation (malware, legal compliance)
      // NO CONTENT CENSORSHIP - only technical security
      validateSecurity();
    }
  });

  /**
   * Technical Security Validation
   * Validates for malware, legal compliance, and system security
   * NO CONTENT CENSORSHIP - cultural, political, or ideological content is never filtered
   */
  const validateSecurity = async () => {
    try {
      // Simulate security validation (replace with actual validation service)
      const isValid = await performSecurityCheck();
      setIsValidated(isValid);

      if (!isValid) {
        setValidationError('Security validation failed - please check your input');
      }
    } catch (error) {
      console.error('Security validation error:', error);
      setValidationError('Security validation error occurred');
    }
  };

  /**
   * Perform Security Check
   * Placeholder for actual security validation service
   */
  const performSecurityCheck = async (): Promise<boolean> => {
    // TODO: Integrate with actual security validation service
    // This should check for:
    // - Malware patterns
    // - Legal compliance (pornography, copyright violations)
    // - System exploitation attempts
    // NEVER for cultural, political, or ideological content
    return true;
  };

  /**
   * Handle Click with Security Validation
   */
  const handleClick = (e: MouseEvent) => {
    if (props.disabled || props.loading) return;

    // Perform security validation if required
    if (props.requiresValidation && !isValidated()) {
      setValidationError('Please complete security validation');
      return;
    }

    // Call original onClick handler
    props.onClick?.(e);
  };

  /**
   * Handle Keyboard Navigation
   */
  const handleKeyDown = (e: KeyboardEvent) => {
    // Support keyboard navigation
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }

    props.onKeyDown?.(e);
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
      styles.btn,
      styles[`btn-${props.variant || 'primary'}`],
      styles[`btn-${props.size || 'md'}`],
      props.color && styles[`btn-color-${props.color}`],
      props.culturalTheme && styles[`btn-cultural-${props.culturalTheme}`],
      props.loading && styles['btn-loading'],
      props.disabled && styles['btn-disabled'],
      !isValidated() && props.requiresValidation && styles['btn-unvalidated'],
      validationError() && styles['btn-error'],
      isFocused() && styles['btn-focused'],
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
    'aria-controls': props.ariaControls,
    'aria-invalid': validationError() ? true : undefined,
    'aria-busy': props.loading ? true : undefined,
    role: (props.role || 'button') as 'button',
  });

  const culturalTooltip = getCulturalTooltip();

  return (
    <div class={styles['btn-wrapper']}>
      <button
        type={props.type || 'button'}
        class={classes()}
        disabled={props.disabled || props.loading}
        title={props.title}
        name={props.name}
        value={props.value}
        form={props.form}
        {...ariaAttributes()}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={e => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={e => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        onMouseEnter={() => {
          if (culturalTooltip) setShowCulturalTooltip(true);
        }}
        onMouseLeave={() => {
          setShowCulturalTooltip(false);
        }}
      >
        {/* Cultural Indicator */}
        {props.showCulturalIndicator && props.culturalTheme && (
          <span
            class={styles['btn-cultural-indicator']}
            aria-label={`Cultural theme: ${props.culturalTheme}`}
          >
            🌿
          </span>
        )}

        {/* Security Validation Indicator */}
        {props.requiresValidation && (
          <span
            class={styles['btn-security-indicator']}
            aria-label={isValidated() ? 'Security validated' : 'Security validation required'}
          >
            {isValidated() ? '✅' : '⚠️'}
          </span>
        )}

        {/* Loading Spinner */}
        {props.loading && <span class={styles['btn-spinner']} />}

        {/* Button Content */}
        <span class={styles['btn-content']}>{props.children}</span>
      </button>

      {/* Cultural Context Tooltip */}
      {showCulturalTooltip() && culturalTooltip && (
        <div class={styles['btn-cultural-tooltip']} role="tooltip">
          <div class={styles['tooltip-content']}>
            <strong>{culturalTooltip.title}</strong>
            {culturalTooltip.sensitivityLevel && (
              <div class={styles['sensitivity-level']}>{culturalTooltip.sensitivityLevel}</div>
            )}
            <div class={styles['tooltip-description']}>{culturalTooltip.description}</div>
          </div>
        </div>
      )}

      {/* Validation Error Message */}
      {validationError() && (
        <div class={styles['btn-error-message']} role="alert">
          {validationError()}
        </div>
      )}
    </div>
  );
};

export default Button;
