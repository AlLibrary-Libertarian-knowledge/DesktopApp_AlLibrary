import { Component, Show } from 'solid-js';
import { CULTURAL_LABELS } from '../../../constants/cultural';
import styles from './LoadingSpinner.module.css';

/**
 * Cultural Theme Types for LoadingSpinner Styling
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
 * Loading Types for Different Content Categories
 */
export type LoadingType = 'content' | 'search' | 'cultural' | 'network' | 'general';

/**
 * Enhanced LoadingSpinner Props Interface
 * Follows SOLID principles with comprehensive accessibility and cultural support
 */
export interface LoadingSpinnerProps {
  // Core Spinner Properties
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'ring' | 'cultural';
  color?: 'primary' | 'secondary' | 'accent' | 'cultural';
  message?: string;
  showMessage?: boolean;
  inline?: boolean;
  overlay?: boolean;

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: CulturalTheme;
  culturalSensitivityLevel?: number;
  culturalContext?: string;
  showCulturalIndicator?: boolean;
  loadingType?: LoadingType;

  // Accessibility Properties
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;

  // Styling
  class?: string;
  className?: string;
  id?: string;

  // Animation Properties
  speed?: 'slow' | 'normal' | 'fast';
  direction?: 'clockwise' | 'counterclockwise';
}

/**
 * LoadingSpinner Component
 *
 * A comprehensive, accessible loading spinner component with cultural theme support
 * and multiple animation variants. Cultural information is displayed for educational
 * purposes only - never for access restriction.
 *
 * @example
 * ```tsx
 * <LoadingSpinner
 *   size="lg"
 *   variant="cultural"
 *   culturalTheme="indigenous"
 *   message="Loading traditional knowledge..."
 *   culturalContext="Respectful content loading"
 * />
 * ```
 */
const LoadingSpinner: Component<LoadingSpinnerProps> = props => {
  /**
   * Generate Cultural Context Information
   */
  const getCulturalInfo = () => {
    if (!props.culturalContext && !props.culturalSensitivityLevel) return null;

    const sensitivityLabel = props.culturalSensitivityLevel
      ? CULTURAL_LABELS[props.culturalSensitivityLevel] || 'Cultural Context'
      : null;

    return {
      title: props.culturalContext || sensitivityLabel,
      description: 'Cultural context provided for educational purposes only',
      sensitivityLevel: sensitivityLabel,
      loadingType: props.loadingType,
    };
  };

  /**
   * Generate CSS Classes
   */
  const spinnerClasses = () =>
    [
      styles['loading-spinner'],
      styles[`spinner-${props.size || 'md'}`],
      styles[`spinner-${props.variant || 'default'}`],
      styles[`spinner-${props.color || 'primary'}`],
      styles[`spinner-speed-${props.speed || 'normal'}`],
      props.direction === 'counterclockwise' && styles['spinner-reverse'],
      props.culturalTheme && styles[`spinner-cultural-${props.culturalTheme}`],
      props.inline && styles['spinner-inline'],
      props.overlay && styles['spinner-overlay'],
      props.class || props.className,
    ]
      .filter(Boolean)
      .join(' ');

  const containerClasses = () =>
    [
      styles['spinner-container'],
      props.inline && styles['container-inline'],
      props.overlay && styles['container-overlay'],
    ]
      .filter(Boolean)
      .join(' ');

  /**
   * Generate ARIA Attributes
   */
  const ariaAttributes = () => ({
    'aria-label': props.ariaLabel || props.message || 'Loading content',
    'aria-describedby': props.ariaDescribedBy,
    'aria-live': 'polite' as const,
    'aria-busy': 'true' as const,
    role: (props.role || 'status') as 'status',
  });

  /**
   * Render Spinner Based on Variant
   */
  const renderSpinner = () => {
    switch (props.variant) {
      case 'dots':
        return (
          <div class={styles['spinner-dots']}>
            <div class={styles['dot']} />
            <div class={styles['dot']} />
            <div class={styles['dot']} />
          </div>
        );

      case 'pulse':
        return (
          <div class={styles['spinner-pulse']}>
            <div class={styles['pulse-ring']} />
            <div class={styles['pulse-core']} />
          </div>
        );

      case 'ring':
        return (
          <div class={styles['spinner-ring']}>
            <div class={styles['ring-segment']} />
            <div class={styles['ring-segment']} />
            <div class={styles['ring-segment']} />
            <div class={styles['ring-segment']} />
          </div>
        );

      case 'cultural':
        return (
          <div class={styles['spinner-cultural']}>
            <div class={styles['cultural-symbol']}>🌿</div>
            <div class={styles['cultural-ring']} />
          </div>
        );

      default:
        return <div class={styles['spinner-default']} />;
    }
  };

  const culturalInfo = getCulturalInfo();

  return (
    <div class={containerClasses()} id={props.id}>
      {/* Overlay Background */}
      <Show when={props.overlay}>
        <div class={styles['spinner-backdrop']} />
      </Show>

      {/* Spinner Content */}
      <div class={styles['spinner-content']}>
        {/* Cultural Indicator */}
        <Show when={props.showCulturalIndicator && props.culturalTheme}>
          <div
            class={styles['spinner-cultural-indicator']}
            aria-label={`Cultural theme: ${props.culturalTheme}`}
          >
            🌿
          </div>
        </Show>

        {/* Main Spinner */}
        <div class={spinnerClasses()} {...ariaAttributes()}>
          {renderSpinner()}
        </div>

        {/* Loading Message */}
        <Show when={props.showMessage !== false && props.message}>
          <div class={styles['spinner-message']}>{props.message}</div>
        </Show>

        {/* Cultural Context Information */}
        <Show when={culturalInfo}>
          <div class={styles['spinner-cultural-info']}>
            <div class={styles['cultural-badge']}>
              {culturalInfo?.sensitivityLevel || 'Cultural Content'}
            </div>
            <Show when={culturalInfo?.loadingType}>
              <div class={styles['loading-type-badge']}>{culturalInfo?.loadingType}</div>
            </Show>
          </div>
        </Show>
      </div>

      {/* Screen Reader Announcements */}
      <div class={styles['sr-only']}>
        {props.message || 'Loading content, please wait...'}
        <Show when={culturalInfo}>
          <span>Cultural context: {culturalInfo?.description}</span>
        </Show>
      </div>
    </div>
  );
};

export default LoadingSpinner;
