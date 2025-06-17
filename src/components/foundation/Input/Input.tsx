import { Component, JSX, createSignal, createEffect, Show } from 'solid-js';
import { validationService } from '../../../services/validationService';
import { CULTURAL_SENSITIVITY_LEVELS, CULTURAL_LABELS } from '../../../constants/cultural';
import styles from './Input.module.css';

/**
 * Cultural Theme Types for Input Styling
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
 * Input Validation Types
 * Ensures technical security without content censorship
 */
export type InputValidationType =
  | 'text'
  | 'email'
  | 'password'
  | 'cultural'
  | 'security'
  | 'custom';

/**
 * Enhanced Input Props Interface
 * Follows SOLID principles with comprehensive accessibility and cultural support
 */
export interface InputProps {
  // Core Input Properties
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url' | 'tel';
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
  error?: string;
  label?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  icon?: JSX.Element;

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: CulturalTheme;
  culturalSensitivityLevel?: number;
  culturalContext?: string;
  showCulturalIndicator?: boolean;
  traditionalInputPattern?: boolean;

  // Validation Properties (TECHNICAL ONLY - NO CONTENT CENSORSHIP)
  validationType?: InputValidationType;
  requiresValidation?: boolean;
  validationPattern?: string;
  validationMessage?: string;
  securityLevel?: 'low' | 'medium' | 'high' | 'critical';

  // Accessibility Properties
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaRequired?: boolean;
  ariaInvalid?: boolean;
  role?: string;

  // Event Handlers
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;

  // Form Properties
  class?: string;
  id?: string;
  name?: string;
  autocomplete?: string;
  maxlength?: number;
  minlength?: number;
  pattern?: string;
  'aria-describedby'?: string;
}

/**
 * Input Component
 *
 * A comprehensive, accessible input component with cultural theme support
 * and security validation. Cultural information is displayed for educational
 * purposes only - never for access restriction.
 *
 * @example
 * ```tsx
 * <Input
 *   type="text"
 *   culturalTheme="indigenous"
 *   culturalContext="Traditional name input"
 *   ariaLabel="Enter traditional name"
 *   validationType="cultural"
 * >
 *   Traditional Name
 * </Input>
 * ```
 */
const Input: Component<InputProps> = props => {
  // Internal state for validation and accessibility
  const [isFocused, setIsFocused] = createSignal(false);
  const [internalValue, setInternalValue] = createSignal(props.value || '');
  const [isValidated, setIsValidated] = createSignal(false);
  const [validationError, setValidationError] = createSignal<string | null>(null);
  const [isValidating, setIsValidating] = createSignal(false);

  // Cultural context display state
  const [showCulturalTooltip, setShowCulturalTooltip] = createSignal(false);

  // Security validation effect
  createEffect(() => {
    if (props.requiresValidation && internalValue() && props.validationType) {
      validateInput();
    }
  });

  /**
   * Technical Input Validation
   * Validates for security threats, format compliance, and technical issues
   * NO CONTENT CENSORSHIP - cultural, political, or ideological content is never filtered
   */
  const validateInput = async () => {
    try {
      setIsValidating(true);

      // Perform technical validation based on type
      let isValid = true;
      const errors: string[] = [];

      switch (props.validationType) {
        case 'email':
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(internalValue());
          if (!isValid) errors.push('Please enter a valid email address');
          break;

        case 'password':
          if (props.minlength && internalValue().length < props.minlength) {
            isValid = false;
            errors.push(`Password must be at least ${props.minlength} characters`);
          }
          break;

        case 'security':
          // Perform security validation (malware, injection attempts)
          const securityResult = await validationService.validateUserInput(internalValue(), {
            userId: 'current-user',
            sessionId: 'current-session',
            inputType: 'text',
            source: 'user_input',
          });

          if (!securityResult.valid) {
            isValid = false;
            errors.push('Input contains potentially harmful content');
          }
          break;

        case 'cultural':
          // Cultural validation provides information only, never blocks
          // This is for educational context, not access control
          break;

        case 'custom':
          if (props.validationPattern) {
            const regex = new RegExp(props.validationPattern);
            if (!regex.test(internalValue())) {
              isValid = false;
              errors.push(props.validationMessage || 'Input does not match required pattern');
            }
          }
          break;
      }

      setIsValidated(true);
      setValidationError(errors.length > 0 && errors[0] ? errors[0] : null);
      props.onValidationChange?.(isValid, errors);
    } catch (error) {
      console.error('Input validation error:', error);
      setValidationError('Validation failed');
      props.onValidationChange?.(false, ['Validation failed']);
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle Input with Validation
   */
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    setInternalValue(value);
    props.onInput?.(value);
  };

  /**
   * Handle Change with Validation
   */
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    props.onChange?.(value);
  };

  /**
   * Handle Focus with Cultural Context
   */
  const handleFocus = () => {
    setIsFocused(true);
    props.onFocus?.();
  };

  /**
   * Handle Blur with Validation
   */
  const handleBlur = () => {
    setIsFocused(false);
    props.onBlur?.();

    // Validate on blur if required
    if (props.requiresValidation && internalValue()) {
      validateInput();
    }
  };

  /**
   * Handle Keyboard Navigation
   */
  const handleKeyDown = (e: KeyboardEvent) => {
    // Support cultural input patterns
    if (props.traditionalInputPattern) {
      // Allow traditional characters and symbols
      // This is for cultural expression, not restriction
    }

    props.onKeyDown?.(e);
  };

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
    };
  };

  /**
   * Generate CSS Classes
   */
  const inputClasses = () =>
    [
      styles['input'],
      styles[`input-${props.size || 'md'}`],
      styles[`input-${props.variant || 'default'}`],
      props.culturalTheme && styles[`input-cultural-${props.culturalTheme}`],
      props.error && styles['input-error'],
      validationError() && styles['input-validation-error'],
      props.disabled && styles['input-disabled'],
      isFocused() && styles['input-focused'],
      isValidating() && styles['input-validating'],
      props.icon && styles['input-with-icon'],
      props.traditionalInputPattern && styles['input-traditional'],
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
    'aria-required': props.ariaRequired || props.required,
    'aria-invalid': props.ariaInvalid || !!props.error || !!validationError(),
    'aria-busy': isValidating(),
    role: props.role as any,
  });

  const inputId = () => props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const culturalTooltip = getCulturalTooltip();

  return (
    <div class={styles['input-wrapper']}>
      <Show when={props.label}>
        <label class={styles['input-label']} for={inputId()}>
          {props.label}
          {props.required && <span class={styles['input-required']}>*</span>}

          {/* Cultural Indicator */}
          {props.showCulturalIndicator && props.culturalTheme && (
            <span
              class={styles['input-cultural-indicator']}
              aria-label={`Cultural theme: ${props.culturalTheme}`}
            >
              🌿
            </span>
          )}
        </label>
      </Show>

      <div class={styles['input-container']}>
        <Show when={props.icon}>
          <div class={styles['input-icon']}>{props.icon}</div>
        </Show>

        <input
          id={inputId()}
          type={props.type || 'text'}
          class={inputClasses()}
          placeholder={props.placeholder}
          value={internalValue()}
          disabled={props.disabled}
          readonly={props.readonly}
          required={props.required}
          name={props.name}
          autocomplete={props.autocomplete}
          maxlength={props.maxlength}
          minlength={props.minlength}
          pattern={props.validationPattern || props.pattern}
          {...ariaAttributes()}
          onInput={handleInput}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => {
            if (culturalTooltip) setShowCulturalTooltip(true);
          }}
          onMouseLeave={() => {
            setShowCulturalTooltip(false);
          }}
        />

        {/* Validation Indicator */}
        {props.requiresValidation && (
          <span
            class={styles['input-validation-indicator']}
            aria-label={isValidated() ? 'Input validated' : 'Input validation required'}
          >
            {isValidating() ? '⏳' : isValidated() ? '✅' : '⚠️'}
          </span>
        )}
      </div>

      {/* Error Messages */}
      <Show when={props.error || validationError()}>
        <div class={styles['input-error-message']} role="alert">
          {props.error || validationError()}
        </div>
      </Show>

      {/* Hint Message */}
      <Show when={props.hint && !props.error && !validationError()}>
        <div class={styles['input-hint']}>{props.hint}</div>
      </Show>

      {/* Cultural Context Tooltip */}
      <Show when={showCulturalTooltip() && culturalTooltip}>
        <div class={styles['input-cultural-tooltip']} role="tooltip">
          <div class={styles['tooltip-content']}>
            <strong>{culturalTooltip?.title}</strong>
            {culturalTooltip?.sensitivityLevel && (
              <div class={styles['sensitivity-level']}>{culturalTooltip.sensitivityLevel}</div>
            )}
            <div class={styles['tooltip-description']}>{culturalTooltip?.description}</div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Input;
