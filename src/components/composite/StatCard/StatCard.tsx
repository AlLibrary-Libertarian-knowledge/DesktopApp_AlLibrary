import { type Component, type JSX, createMemo } from 'solid-js';
import { useTranslation } from '../../../i18n/hooks';
import styles from './StatCard.module.css';

export interface StatCardProps {
  type: 'documents' | 'peers' | 'institutions' | 'health';
  icon: JSX.Element;
  number: string;
  label: string;
  trendType: 'positive' | 'neutral' | 'negative';
  trendIcon: JSX.Element;
  trendValue: string;
  trendLabel?: string;
  graphType: 'chart' | 'peers' | 'map' | 'health';
  graphData?: unknown;
  ariaLabel?: string;
  onClick?: () => void;
  labelKey?: string;
  trendLabelKey?: string;
}

function parseMetric(value: string): number {
  const n = Number.parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** Stable pseudo-random in [0, 1) from a seed. */
function hash01(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const GEO_DOTS: Array<{ top: number; left: number }> = [
  { top: 18, left: 14 },
  { top: 42, left: 28 },
  { top: 22, left: 48 },
  { top: 58, left: 40 },
  { top: 34, left: 66 },
  { top: 70, left: 58 },
  { top: 48, left: 78 },
  { top: 26, left: 82 },
  { top: 62, left: 18 },
  { top: 78, left: 72 },
  { top: 12, left: 60 },
  { top: 54, left: 8 },
];

const StatCard: Component<StatCardProps> = props => {
  const { t } = useTranslation('components');
  const metric = createMemo(() => parseMetric(props.number));
  const gradientId = createMemo(() => `health-grad-${props.type}`);

  const chartHeights = createMemo(() => {
    const base = metric();
    return Array.from({ length: 7 }, (_, i) => {
      const wave = hash01(base * 11 + i * 3 + 1);
      return Math.round(22 + wave * 58 + Math.min(base, 20));
    });
  });

  const activePeers = createMemo(() => {
    const count = Math.round(metric());
    return Math.max(0, Math.min(6, count > 0 ? Math.min(count, 6) : 0));
  });

  const healthRatio = createMemo(() => Math.min(1, Math.max(0, metric() / 100)));

  const renderGraph = () => {
    const graphAriaLabel = t('statCard.accessibility.chartVisualization', { type: props.type });

    switch (props.graphType) {
      case 'chart':
        return (
          <div class={styles['mini-chart']} aria-label={graphAriaLabel}>
            {chartHeights().map((height, i) => (
              <div
                class={styles['chart-bar']}
                style={{ height: `${Math.min(100, height)}%` }}
                aria-hidden="true"
                data-bar={i}
              />
            ))}
          </div>
        );

      case 'peers':
        return (
          <div class={styles['peer-visualization']} aria-label={graphAriaLabel}>
            {Array.from({ length: 6 }, (_, i) => (
              <div
                class={`${styles['peer-node']} ${i < activePeers() ? styles.active : ''}`}
                aria-hidden="true"
              />
            ))}
          </div>
        );

      case 'map':
        return (
          <div class={styles['institution-map']} aria-label={graphAriaLabel}>
            <div class={styles['geo-dots']}>
              {GEO_DOTS.map(dot => (
                <div
                  class={styles['geo-dot']}
                  style={{ top: `${dot.top}%`, left: `${dot.left}%` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        );

      case 'health': {
        const circumference = 2 * Math.PI * 25;
        const filled = circumference * healthRatio();
        return (
          <div class={styles['health-ring']} aria-label={graphAriaLabel}>
            <svg width="48" height="48" viewBox="0 0 60 60" aria-hidden="true">
              <defs>
                <linearGradient id={gradientId()} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#10b981" />
                  <stop offset="100%" stop-color="#34d399" />
                </linearGradient>
              </defs>
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="rgba(148, 163, 184, 0.22)"
                stroke-width="3.5"
              />
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke={`url(#${gradientId()})`}
                stroke-width="3.5"
                stroke-linecap="round"
                stroke-dasharray={`${filled} ${circumference}`}
                class={styles['health-arc']}
              />
            </svg>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const handleClick = () => props.onClick?.();

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!props.onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const getAriaLabel = () => {
    if (props.ariaLabel) return props.ariaLabel;

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

  const getDisplayLabel = () => (props.labelKey ? t(props.labelKey) : props.label);
  const getTrendLabel = () => (props.trendLabelKey ? t(props.trendLabelKey) : props.trendLabel);

  return (
    <div
      class={`${styles['stat-card']} ${styles.enhanced} ${styles[props.type]} ${
        props.onClick ? styles.clickable : ''
      }`}
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
