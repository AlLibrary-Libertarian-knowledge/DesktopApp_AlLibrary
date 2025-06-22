import { Component, Show } from 'solid-js';
import { Info, BookOpen, Users, Shield, Heart, Eye, CheckCircle, HelpCircle } from 'lucide-solid';
import styles from './CulturalIndicator.module.css';

export interface CulturalIndicatorProps {
  level: 1 | 2 | 3;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed' | 'badge';
  informationOnly?: boolean;
  showEducationalTip?: boolean;
  showLevel?: boolean;
  culturalOrigin?: string;
  traditionalKnowledge?: boolean;
  communitySource?: boolean;
  onClick?: () => void;
  class?: string;
  'aria-label'?: string;
}

/**
 * CulturalIndicator Component
 *
 * Displays cultural sensitivity information for educational purposes only.
 * Never restricts access - provides context and learning opportunities.
 *
 * Levels:
 * - Level 1: General cultural context available
 * - Level 2: Traditional knowledge context available
 * - Level 3: Sacred content - educational context provided
 */
export const CulturalIndicator: Component<CulturalIndicatorProps> = props => {
  const level = () => props.level;
  const size = () => props.size || 'md';
  const variant = () => props.variant || 'default';

  const getLevelInfo = () => {
    switch (level()) {
      case 1:
        return {
          icon: <Info size={16} />,
          label: 'Cultural Context',
          description: 'General cultural context available',
          color: 'blue',
          bgColor: 'var(--color-blue-50)',
          borderColor: 'var(--color-blue-200)',
          textColor: 'var(--color-blue-700)',
        };
      case 2:
        return {
          icon: <BookOpen size={16} />,
          label: 'Traditional Knowledge',
          description: 'Traditional knowledge context available',
          color: 'amber',
          bgColor: 'var(--color-amber-50)',
          borderColor: 'var(--color-amber-200)',
          textColor: 'var(--color-amber-700)',
        };
      case 3:
        return {
          icon: <Heart size={16} />,
          label: 'Sacred Content',
          description: 'Sacred content - educational context provided',
          color: 'purple',
          bgColor: 'var(--color-purple-50)',
          borderColor: 'var(--color-purple-200)',
          textColor: 'var(--color-purple-700)',
        };
      default:
        return {
          icon: <HelpCircle size={16} />,
          label: 'Cultural Content',
          description: 'Cultural information available',
          color: 'gray',
          bgColor: 'var(--color-gray-50)',
          borderColor: 'var(--color-gray-200)',
          textColor: 'var(--color-gray-700)',
        };
    }
  };

  const levelInfo = () => getLevelInfo();

  const handleClick = () => {
    if (props.onClick) {
      props.onClick();
    }
  };

  const handleKeyDown = (e: any) => {
    if (props.onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };

  // Badge variant
  if (variant() === 'badge') {
    return (
      <div
        class={`${styles.culturalBadge} ${styles[levelInfo().color]} ${props.class || ''}`}
        onClick={props.onClick ? handleClick : undefined}
        onKeyDown={props.onClick ? handleKeyDown : undefined}
        tabindex={props.onClick ? 0 : undefined}
        role={props.onClick ? 'button' : 'status'}
        style={{
          'background-color': levelInfo().bgColor,
          'border-color': levelInfo().borderColor,
          color: levelInfo().textColor,
          padding: '0.25rem 0.5rem',
          'border-radius': '0.375rem',
          border: '1px solid',
          display: 'inline-flex',
          'align-items': 'center',
          gap: '0.25rem',
          'font-size': '0.75rem',
          'font-weight': '500',
        }}
        aria-label={
          props['aria-label'] || `Cultural sensitivity level ${level()}: ${levelInfo().description}`
        }
      >
        {levelInfo().icon}
        <Show when={props.showLevel !== false}>
          <span>Level {level()}</span>
        </Show>
      </div>
    );
  }

  // Compact variant
  if (variant() === 'compact') {
    return (
      <div
        class={`${styles.culturalIndicator} ${styles.compact} ${styles[size()]} ${styles[levelInfo().color]} ${props.class || ''}`}
        onClick={props.onClick ? handleClick : undefined}
        onKeyDown={props.onClick ? handleKeyDown : undefined}
        tabindex={props.onClick ? 0 : undefined}
        role={props.onClick ? 'button' : 'status'}
        aria-label={
          props['aria-label'] || `Cultural sensitivity level ${level()}: ${levelInfo().description}`
        }
        style={{
          'background-color': levelInfo().bgColor,
          'border-color': levelInfo().borderColor,
          color: levelInfo().textColor,
        }}
      >
        {levelInfo().icon}
        <Show when={props.showLevel !== false}>
          <span class={styles.levelText}>{level()}</span>
        </Show>
      </div>
    );
  }

  // Default and detailed variants
  return (
    <div
      class={`${styles.culturalIndicator} ${styles[variant()]} ${styles[size()]} ${styles[levelInfo().color]} ${props.class || ''}`}
      onClick={props.onClick ? handleClick : undefined}
      onKeyDown={props.onClick ? handleKeyDown : undefined}
      tabindex={props.onClick ? 0 : undefined}
      role={props.onClick ? 'button' : 'status'}
      aria-label={
        props['aria-label'] || `Cultural sensitivity level ${level()}: ${levelInfo().description}`
      }
      style={{
        'background-color': levelInfo().bgColor,
        'border-color': levelInfo().borderColor,
        color: levelInfo().textColor,
      }}
    >
      <div class={styles.indicatorHeader}>
        <div class={styles.iconContainer}>{levelInfo().icon}</div>

        <div class={styles.labelContainer}>
          <span class={styles.label}>{levelInfo().label}</span>
          <Show when={props.showLevel !== false}>
            <span class={styles.levelBadge}>Level {level()}</span>
          </Show>
        </div>

        <Show when={props.informationOnly}>
          <div class={styles.infoOnlyBadge}>
            <Eye size={12} />
            <span>Info Only</span>
          </div>
        </Show>
      </div>

      <Show when={variant() === 'detailed'}>
        <div class={styles.indicatorContent}>
          <p class={styles.description}>{levelInfo().description}</p>

          <Show when={props.culturalOrigin}>
            <div class={styles.originInfo}>
              <Users size={14} />
              <span>Origin: {props.culturalOrigin}</span>
            </div>
          </Show>

          <Show when={props.traditionalKnowledge}>
            <div class={styles.knowledgeInfo}>
              <BookOpen size={14} />
              <span>Contains traditional knowledge</span>
            </div>
          </Show>

          <Show when={props.communitySource}>
            <div class={styles.communityInfo}>
              <Shield size={14} />
              <span>Community verified source</span>
            </div>
          </Show>

          <Show when={props.showEducationalTip}>
            <div class={styles.educationalTip}>
              <CheckCircle size={14} />
              <span>Educational resources available</span>
            </div>
          </Show>
        </div>
      </Show>

      <Show when={props.informationOnly && variant() !== 'detailed'}>
        <div class={styles.infoNote}>
          <span>Educational context provided</span>
        </div>
      </Show>
    </div>
  );
};

export default CulturalIndicator;
