import { Component, Show, createSignal } from 'solid-js';
import { Folder, FileText, Users, Star, Info, Globe, ChevronRight } from 'lucide-solid';
import { Card } from '../../foundation/Card';
import { CULTURAL_LABELS } from '../../../constants/cultural';
import styles from './CategoryCard.module.css';

export type CulturalTheme =
  | 'indigenous'
  | 'traditional'
  | 'modern'
  | 'ceremonial'
  | 'community'
  | 'default';

export interface CategoryStats {
  documentCount: number;
  subcategoryCount: number;
  recentActivity: number;
  popularityScore: number;
}

export interface CulturalContext {
  sensitivityLevel: number;
  culturalOrigin?: string;
  educationalContext?: string;
  traditionalProtocols?: string[];
  communityInfo?: {
    primaryCommunities: string[];
    elderApproval?: boolean;
    educationalPurpose: boolean;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  stats?: CategoryStats;
  culturalContext?: CulturalContext;
  tags?: string[];
  parentId?: string;
  level: number;
  path: string[];
  lastUpdated: Date;
  createdBy?: string;
  featured?: boolean;
}

export interface CategoryCardProps {
  category: Category;
  onClick?: (categoryId: string) => void;
  onSecondaryAction?: (categoryId: string, action: string) => void;
  showCulturalContext?: boolean;
  showStats?: boolean;
  showDescription?: boolean;
  showTags?: boolean;
  variant?: 'default' | 'compact' | 'detailed' | 'list';
  culturalTheme?: CulturalTheme;
  selected?: boolean;
  disabled?: boolean;
  interactive?: boolean;
  className?: string;
  ariaLabel?: string;
  testId?: string;
}

const CategoryCard: Component<CategoryCardProps> = props => {
  const [showCulturalTooltip, setShowCulturalTooltip] = createSignal(false);
  const [isHovered, setIsHovered] = createSignal(false);

  const getCulturalInfo = () => {
    if (!props.category.culturalContext) return null;

    const context = props.category.culturalContext;
    const sensitivityLabel = CULTURAL_LABELS[context.sensitivityLevel] || 'Cultural Context';

    return {
      title: context.culturalOrigin || sensitivityLabel,
      description:
        context.educationalContext || 'Cultural context provided for educational purposes only',
      sensitivityLevel: sensitivityLabel,
      communities: context.communityInfo?.primaryCommunities || [],
      elderApproval: context.communityInfo?.elderApproval || false,
      protocols: context.traditionalProtocols || [],
    };
  };

  const getCulturalBadge = () => {
    const culturalInfo = getCulturalInfo();
    if (!culturalInfo) return null;

    return (
      <div
        class={styles['cultural-badge']}
        onMouseEnter={() => setShowCulturalTooltip(true)}
        onMouseLeave={() => setShowCulturalTooltip(false)}
        aria-label={`Cultural context: ${culturalInfo.sensitivityLevel}`}
      >
        <Globe size={12} />
        <span class={styles['cultural-label']}>{culturalInfo.sensitivityLevel}</span>
      </div>
    );
  };

  const handleClick = () => {
    if (props.disabled || !props.interactive) return;
    props.onClick?.(props.category.id);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const cardClasses = () =>
    [
      styles['category-card'],
      styles[`variant-${props.variant || 'default'}`],
      props.culturalTheme && styles[`cultural-${props.culturalTheme}`],
      props.selected && styles['selected'],
      props.disabled && styles['disabled'],
      props.interactive !== false && styles['interactive'],
      isHovered() && styles['hovered'],
      props.category.featured && styles['featured'],
      props.className,
    ]
      .filter(Boolean)
      .join(' ');

  const culturalInfo = getCulturalInfo();

  return (
    <div class={styles['card-wrapper']}>
      <Card
        class={cardClasses()}
        variant={props.variant === 'compact' ? 'outlined' : 'elevated'}
        culturalTheme={props.culturalTheme}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        tabIndex={props.interactive !== false ? 0 : -1}
        role={props.interactive !== false ? 'button' : 'article'}
        aria-label={props.ariaLabel || `Category: ${props.category.name}`}
        data-testid={props.testId}
      >
        {/* Category Header */}
        <div class={styles['category-header']}>
          <div class={styles['category-icon']}>
            <Show when={props.category.icon} fallback={<Folder size={20} />}>
              <span class={styles['custom-icon']}>{props.category.icon}</span>
            </Show>
          </div>

          <div class={styles['category-title-section']}>
            <h3 class={styles['category-title']}>{props.category.name}</h3>
            <Show when={props.category.level > 0}>
              <div class={styles['category-level']}>Level {props.category.level}</div>
            </Show>
          </div>

          <div class={styles['category-actions']}>
            {getCulturalBadge()}

            <Show when={props.category.featured}>
              <div class={styles['featured-badge']} aria-label="Featured category">
                <Star size={14} />
              </div>
            </Show>

            <Show when={props.interactive !== false}>
              <div class={styles['action-indicator']}>
                <ChevronRight size={16} />
              </div>
            </Show>
          </div>
        </div>

        {/* Category Description */}
        <Show when={props.showDescription !== false && props.category.description}>
          <div class={styles['category-description']}>
            <p>{props.category.description}</p>
          </div>
        </Show>

        {/* Category Stats */}
        <Show when={props.showStats && props.category.stats}>
          <div class={styles['category-stats']}>
            <div class={styles['stat-item']}>
              <FileText size={14} />
              <span class={styles['stat-value']}>{props.category.stats!.documentCount}</span>
              <span class={styles['stat-label']}>documents</span>
            </div>

            <Show when={props.category.stats!.subcategoryCount > 0}>
              <div class={styles['stat-item']}>
                <Folder size={14} />
                <span class={styles['stat-value']}>{props.category.stats!.subcategoryCount}</span>
                <span class={styles['stat-label']}>subcategories</span>
              </div>
            </Show>

            <Show when={props.category.stats!.recentActivity > 0}>
              <div class={styles['stat-item']}>
                <Users size={14} />
                <span class={styles['stat-value']}>{props.category.stats!.recentActivity}</span>
                <span class={styles['stat-label']}>recent</span>
              </div>
            </Show>
          </div>
        </Show>

        {/* Category Tags */}
        <Show when={props.showTags && props.category.tags?.length}>
          <div class={styles['category-tags']}>
            {props.category.tags!.slice(0, 3).map(tag => (
              <span class={styles['category-tag']}>{tag}</span>
            ))}
            <Show when={props.category.tags!.length > 3}>
              <span class={styles['more-tags']}>+{props.category.tags!.length - 3}</span>
            </Show>
          </div>
        </Show>

        {/* Cultural Context Information */}
        <Show when={props.showCulturalContext && culturalInfo}>
          <div class={styles['cultural-info']}>
            <div class={styles['cultural-header']}>
              <Info size={14} />
              <span class={styles['cultural-title']}>Cultural Context</span>
              <span class={styles['educational-label']}>Educational Only</span>
            </div>

            <Show when={culturalInfo?.communities.length}>
              <div class={styles['cultural-communities']}>
                <strong>Communities:</strong> {culturalInfo!.communities.join(', ')}
              </div>
            </Show>

            <Show when={culturalInfo?.elderApproval}>
              <div class={styles['elder-approval']}>
                <span class={styles['approval-indicator']}>✓</span>
                Elder acknowledgment received
              </div>
            </Show>
          </div>
        </Show>

        {/* Category Path */}
        <Show when={props.variant === 'detailed' && props.category.path.length > 1}>
          <div class={styles['category-path']}>
            <span class={styles['path-label']}>Path:</span>
            <div class={styles['path-breadcrumbs']}>
              {props.category.path.map((segment, index) => (
                <>
                  <span class={styles['path-segment']}>{segment}</span>
                  <Show when={index < props.category.path.length - 1}>
                    <ChevronRight size={12} class={styles['path-separator']} />
                  </Show>
                </>
              ))}
            </div>
          </div>
        </Show>

        {/* Last Updated */}
        <Show when={props.variant === 'detailed'}>
          <div class={styles['category-meta']}>
            <span class={styles['last-updated']}>
              Updated {props.category.lastUpdated.toLocaleDateString()}
            </span>
            <Show when={props.category.createdBy}>
              <span class={styles['created-by']}>by {props.category.createdBy}</span>
            </Show>
          </div>
        </Show>
      </Card>

      {/* Cultural Context Tooltip */}
      <Show when={showCulturalTooltip() && culturalInfo}>
        <div class={styles['cultural-tooltip']} role="tooltip">
          <div class={styles['tooltip-content']}>
            <strong>{culturalInfo!.title}</strong>
            <div class={styles['tooltip-description']}>{culturalInfo!.description}</div>

            <Show when={culturalInfo!.protocols.length}>
              <div class={styles['tooltip-protocols']}>
                <strong>Traditional Protocols:</strong>
                <ul>
                  {culturalInfo!.protocols.map(protocol => (
                    <li>{protocol}</li>
                  ))}
                </ul>
              </div>
            </Show>

            <div class={styles['tooltip-notice']}>
              Cultural information provided for educational purposes only
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default CategoryCard;
