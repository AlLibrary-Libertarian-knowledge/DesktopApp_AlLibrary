import { Component, JSX } from 'solid-js';
import { useTranslation } from '../../../i18n/hooks';
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

  // i18n
  labelKey?: string; // Optional translation key for label
  trendLabelKey?: string; // Optional translation key for trend label
}

/**
 * StatCard Component
 *
 * A reusable stat card component for the dashboard with enhanced visuals,
 * accessibility support, and proper component isolation with i18n support.
 */
const StatCard: Component<StatCardProps> = props => {
  const { t } = useTranslation('components');

  const renderGraph = () => {
    const graphAriaLabel = t('statCard.accessibility.chartVisualization', { type: props.type });

    switch (props.graphType) {
      case 'chart':
        return (
          <div class={styles['mini-chart']} aria-label={graphAriaLabel}>
            {Array.from({ length: 7 }, (_, i) => (
              <div
                class={styles['chart-bar']}
                style={`height: ${Math.random() * 60 + 20}%`}
                aria-hidden="true"
                key={i}
              ></div>
            ))}
          </div>
        );

      case 'peers':
        return (
          <div class={styles['peer-visualization']} aria-label={graphAriaLabel}>
            {Array.from({ length: 6 }, (_, i) => (
              <div
                class={`${styles['peer-node']} ${i < 4 ? styles['active'] : ''}`}
                aria-hidden="true"
                key={i}
              ></div>
            ))}
          </div>
        );

      case 'map':
        return (
          <div class={styles['institution-map']} aria-label={graphAriaLabel}>
            <div class={styles['geo-dots']}>
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  class={styles['geo-dot']}
                  style={`top: ${Math.random() * 80}%; left: ${Math.random() * 80}%`}
                  aria-hidden="true"
                  key={i}
                ></div>
              ))}
            </div>
          </div>
        );

      case 'health':
        return (
          <div class={styles['health-ring']} aria-label={graphAriaLabel}>
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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Generate comprehensive accessibility label
  const getAriaLabel = () => {
    if (props.ariaLabel) {
      return props.ariaLabel;
    }

    const trendText = t(`statCard.trends.${props.trendType}`);
    const displayLabel = props.labelKey ? t(props.labelKey) : props.label;
    const displayTrendLabel = props.trendLabelKey ? t(props.trendLabelKey) : props.trendLabel;

    return t('statCard.ariaLabel', {
      label: displayLabel,
      value: props.number,
      trendType: trendText,
      trendValue: `${props.trendValue} ${displayTrendLabel || ''}`.trim(),
    });
  };

  // Get display label with i18n support
  const getDisplayLabel = () => {
    return props.labelKey ? t(props.labelKey) : props.label;
  };

  // Get trend label with i18n support
  const getTrendLabel = () => {
    return props.trendLabelKey ? t(props.trendLabelKey) : props.trendLabel;
  };

  return (
    <div
      class={`${styles['stat-card']} ${styles['enhanced']} ${styles[props.type]}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabindex={props.onClick ? 0 : undefined}
      role={props.onClick ? 'button' : 'article'}
      aria-label={getAriaLabel()}
      title={props.onClick ? t('statCard.accessibility.clickToExpand') : undefined}
    >
      <div class={styles['stat-content']}>
        <div
          class={styles['stat-icon']}
          aria-hidden="true"
          title={t(`statCard.types.${props.type}`)}
        >
          {props.icon}
        </div>
        <div class={styles['stat-info']}>
          <div class={styles['stat-main']}>
            <h3 class={styles['stat-number']} aria-live="polite">
              {props.number}
            </h3>
            <p class={styles['stat-label']}>{getDisplayLabel()}</p>
          </div>
          <div
            class={`${styles['stat-trend']} ${styles[props.trendType]}`}
            aria-label={t('statCard.accessibility.trendIndicator', { trend: props.trendType })}
          >
            <span aria-hidden="true">{props.trendIcon}</span>
            <span class={styles['trend-value']}>{props.trendValue}</span>
            {getTrendLabel() && <span class={styles['trend-label']}>{getTrendLabel()}</span>}
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
