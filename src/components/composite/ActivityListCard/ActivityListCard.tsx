import { JSX } from 'solid-js';
import { Download, Upload, CheckCircle } from 'lucide-solid';
import { useTranslation } from '../../../i18n/hooks';
import styles from './ActivityListCard.module.css';

export interface ActivityItemProps {
  type: 'downloading' | 'seeding' | 'completed' | 'peer-connected' | 'institution' | 'discovery';
  title: string;
  subtitle?: string;
  fileSize?: string;
  progress?: number;
  speed?: string;
  status: string;
  metadata?: string;
  resultCount?: number;
  peerCount?: number;
}

interface ActivityListCardProps {
  title: string;
  subtitle?: string;
  icon?: JSX.Element;
  items: ActivityItemProps[];
  cardType?: 'downloads' | 'network' | 'default';
  class?: string;
  'data-testid'?: string;
}

const ActivityListItem = (props: { item: ActivityItemProps }) => {
  const getIndicator = () => {
    switch (props.item.type) {
      case 'downloading': {
        const progress = props.item.progress || 0;
        const circumference = 2 * Math.PI * 16;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (progress / 100) * circumference;

        return (
          <div class={styles['progress-ring']}>
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="rgba(59, 130, 246, 0.2)"
                stroke-width="2"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="#3b82f6"
                stroke-width="2"
                stroke-dasharray={strokeDasharray.toString()}
                stroke-dashoffset={strokeDashoffset}
                class={styles['progress-arc']}
              />
            </svg>
            <Download size={16} class={styles['progress-icon'] || ''} />
          </div>
        );
      }
      case 'seeding':
        return (
          <div class={styles['upload-indicator']}>
            <Upload size={16} />
          </div>
        );
      case 'completed':
        return (
          <div class={styles['complete-indicator']}>
            <CheckCircle size={16} />
          </div>
        );
      default:
        return (
          <div class={styles['default-indicator']}>
            <div class={styles['status-dot']} />
          </div>
        );
    }
  };

  return (
    <div class={`${styles['activity-item']} ${styles[props.item.type]}`}>
      <div class={styles['item-indicator']}>{getIndicator()}</div>

      <div class={styles['activity-content']}>
        <div class={styles['content-header']}>
          <h4 class={styles['activity-title']}>{props.item.title}</h4>
          {props.item.fileSize && <div class={styles['file-size']}>{props.item.fileSize}</div>}
        </div>

        <div class={styles['content-meta']}>
          <span class={styles['meta-text']}>{props.item.metadata || props.item.subtitle}</span>
          {props.item.speed && <span class={styles['speed-text']}>{props.item.speed}</span>}
        </div>

        {props.item.progress !== undefined && (
          <div class={styles['content-progress']}>
            <div class={styles['progress-bar']}>
              <div class={styles['progress-fill']} style={`width: ${props.item.progress}%`} />
            </div>
          </div>
        )}
      </div>

      <div class={styles['activity-status']}>
        <span class={`${styles['status-badge']} ${styles[props.item.type]}`}>
          {props.item.type === 'downloading' && <Download size={12} />}
          {props.item.type === 'seeding' && <Upload size={12} />}
          {props.item.type === 'completed' && <CheckCircle size={12} />}
          <div class={styles['status-pulse']} />
          {props.item.status}
        </span>
      </div>
    </div>
  );
};

export const ActivityListCard = (props: ActivityListCardProps) => {
  const { t } = useTranslation('components');

  return (
    <div
      class={`${styles['activity-card']} ${props.cardType ? styles[props.cardType] : ''} ${props.class || ''}`}
      data-testid={props['data-testid']}
    >
      <div class={styles['card-header']}>
        <div class={styles['header-icon']}>{props.icon}</div>
        <div class={styles['header-content']}>
          <h3 class={styles['card-title']}>{props.title}</h3>
          {props.subtitle && <p class={styles['card-subtitle']}>{props.subtitle}</p>}
        </div>
        <div class={styles['header-metrics']}>
          <span class={styles['metric-badge']}>
            {t('collectionCard.itemCount', { count: props.items.length })}
          </span>
        </div>
      </div>

      <div class={styles['activity-list']}>
        {props.items.map((item, _index) => (
          <ActivityListItem item={item} />
        ))}
      </div>
    </div>
  );
};

export default ActivityListCard;
