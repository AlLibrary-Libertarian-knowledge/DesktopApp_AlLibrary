import { Component, JSX } from 'solid-js';
import styles from './StatCard.module.css';

export interface StatCardProps {
  // Card identification
  type: 'documents' | 'peers' | 'institutions' | 'health';

  // Content
  icon: JSX.Element;
  number: string;
  label: string;

  // Trend information
  trendType: 'positive' | 'neutral' | 'negative';
  trendIcon: JSX.Element;
  trendValue: string;
  trendLabel?: string;

  // Graph visualization
  graphType: 'chart' | 'peers' | 'map' | 'health';
  graphData?: any;

  // Accessibility
  ariaLabel?: string;
  onClick?: () => void;
}

/**
 * StatCard Component
 *
 * A reusable stat card component for the dashboard with enhanced visuals,
 * accessibility support, and proper component isolation.
 */
const StatCard: Component<StatCardProps> = props => {
  const renderGraph = () => {
    switch (props.graphType) {
      case 'chart':
        return (
          <div class={styles['mini-chart']}>
            {Array.from({ length: 7 }, (_, _i) => (
              <div class={styles['chart-bar']} style={`height: ${Math.random() * 60 + 20}%`}></div>
            ))}
          </div>
        );

      case 'peers':
        return (
          <div class={styles['peer-visualization']}>
            {Array.from({ length: 6 }, (_, _i) => (
              <div class={`${styles['peer-node']} ${_i < 4 ? styles['active'] : ''}`}></div>
            ))}
          </div>
        );

      case 'map':
        return (
          <div class={styles['institution-map']}>
            <div class={styles['geo-dots']}>
              {Array.from({ length: 12 }, (_, _i) => (
                <div
                  class={styles['geo-dot']}
                  style={`top: ${Math.random() * 80}%; left: ${Math.random() * 80}%`}
                ></div>
              ))}
            </div>
          </div>
        );

      case 'health':
        return (
          <div class={styles['health-ring']}>
            <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="rgba(148, 163, 184, 0.2)"
                stroke-width="3"
              />
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="url(#healthGradient)"
                stroke-width="3"
                stroke-dasharray={`${2 * Math.PI * 25 * 0.98} ${2 * Math.PI * 25}`}
                stroke-dashoffset={2 * Math.PI * 25 * 0.25}
                class={styles['health-arc']}
              />
              <defs>
                <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color: #10b981" />
                  <stop offset="100%" style="stop-color: #34d399" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        );

      default:
        return null;
    }
  };

  const handleClick = () => {
    if (props.onClick) {
      props.onClick();
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      class={`${styles['stat-card']} ${styles['enhanced']} ${styles[props.type]}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabindex={props.onClick ? 0 : undefined}
      role={props.onClick ? 'button' : 'article'}
      aria-label={
        props.ariaLabel ||
        `${props.label}: ${props.number}. ${props.trendType} trend: ${props.trendValue} ${props.trendLabel || ''}`
      }
    >
      <div class={styles['stat-content']}>
        <div class={styles['stat-icon']} aria-hidden="true">
          {props.icon}
        </div>
        <div class={styles['stat-info']}>
          <div class={styles['stat-main']}>
            <h3 class={styles['stat-number']}>{props.number}</h3>
            <p class={styles['stat-label']}>{props.label}</p>
          </div>
          <div class={`${styles['stat-trend']} ${styles[props.trendType]}`}>
            <span aria-hidden="true">{props.trendIcon}</span>
            <span class={styles['trend-value']}>{props.trendValue}</span>
            {props.trendLabel && <span class={styles['trend-label']}>{props.trendLabel}</span>}
          </div>
        </div>
      </div>
      <div class={styles['stat-graph']} aria-hidden="true">
        {renderGraph()}
      </div>
    </div>
  );
};

export default StatCard;
