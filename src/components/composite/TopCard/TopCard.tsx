import { Component, JSX, children } from 'solid-js';
import styles from './TopCard.module.css';

export interface TopCardProps {
  /** Left column content */
  title: string;
  subtitle?: string;
  /** Right column content - can be any JSX content */
  rightContent: JSX.Element;
  /** Custom CSS class for styling variations */
  class?: string;
  /** Background gradient colors for customization */
  gradientColors?: {
    primary: string;
    secondary: string;
  };
  /** Optional click handler for the entire card */
  onClick?: () => void;
  /** Accessibility label */
  'aria-label'?: string;
}

/**
 * TopCard - Reusable header card component
 *
 * Features:
 * - Fixed maximum height (40% of screen height)
 * - Left column: Title and subtitle
 * - Right column: Customizable content
 * - Responsive design with proper mobile adaptations
 * - Follows SOLID principles with single responsibility
 * - Anti-censorship compliant - no content filtering
 * - Customizable colors and content
 */
export const TopCard: Component<TopCardProps> = props => {
  const rightContentChild = children(() => props.rightContent);

  const cardStyle = () => {
    if (props.gradientColors) {
      return {
        background: `linear-gradient(135deg, ${props.gradientColors.primary} 0%, ${props.gradientColors.secondary} 100%)`,
      };
    }
    return {};
  };

  return (
    <header
      class={`${styles['top-card']} ${props.class || ''}`}
      style={cardStyle()}
      onClick={props.onClick}
      aria-label={props['aria-label'] || `${props.title} header card`}
      role={props.onClick ? 'button' : 'banner'}
      tabindex={props.onClick ? 0 : undefined}
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
      {/* Decorative background elements */}
      <div class={styles['background-overlay']} />
      <div class={styles['shimmer-effect']} />

      {/* Left Column - Title and Subtitle */}
      <div class={styles['left-column']}>
        <div class={styles['title-section']}>
          <h1 class={styles['card-title']}>{props.title}</h1>
          {props.subtitle && <p class={styles['card-subtitle']}>{props.subtitle}</p>}
        </div>
      </div>

      {/* Right Column - Custom Content */}
      <div class={styles['right-column']}>
        <div class={styles['content-container']}>{rightContentChild()}</div>
      </div>
    </header>
  );
};
