/**
 * TimeFilter Domain Component
 *
 * A specialized time-based filtering component for document collections.
 * Provides intuitive time period selection with cultural context awareness.
 *
 * @example
 * ```tsx
 * <TimeFilter
 *   selectedFilter="last-week"
 *   onFilterChange={handleTimeFilterChange}
 *   showCulturalGrouping={true}
 *   documentCounts={{ 'last-week': 25, 'last-month': 150 }}
 * />
 * ```
 *
 * @accessibility
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - ARIA labels and descriptions
 * - Focus management
 *
 * @cultural-integration
 * - Cultural time period awareness (seasonal, ceremonial)
 * - Traditional calendar system support
 * - Educational context for time-based cultural content
 * - NO ACCESS RESTRICTIONS - information only
 */

import { Component, createSignal, createMemo, Show, For } from 'solid-js';
import { Calendar, Clock, Filter, Info } from 'lucide-solid';
import { Button } from '@/components/foundation/Button';
import { Badge } from '@/components/foundation/Badge';
import { Card } from '@/components/foundation/Card';
import { Tooltip } from '@/components/foundation/Tooltip';
import { CulturalIndicator } from '@/components/cultural/CulturalIndicator';
import styles from './TimeFilter.module.css';

export interface TimeFilterOption {
  /** Filter value */
  value: string;
  /** Display label */
  label: string;
  /** Filter description */
  description?: string;
  /** Cultural significance */
  culturalContext?: {
    level: number;
    description: string;
    traditionalName?: string;
  };
  /** Whether this is a custom time period */
  isCustom?: boolean;
  /** Icon for the filter */
  icon?: any;
}

export interface TimeFilterProps {
  /** Currently selected filter */
  selectedFilter: string;
  /** Available filter options */
  options?: TimeFilterOption[];
  /** Document counts for each filter */
  documentCounts?: Record<string, number>;
  /** Whether to show cultural grouping */
  showCulturalGrouping?: boolean;
  /** Whether to show document counts */
  showCounts?: boolean;
  /** Whether the filter is disabled */
  disabled?: boolean;
  /** Filter size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom CSS class */
  class?: string;
  /** Cultural theme */
  culturalTheme?: 'traditional' | 'indigenous' | 'ceremonial';
  /** Test ID for testing */
  'data-testid'?: string;
  /** Filter change handler */
  onFilterChange?: (filter: string) => void;
  /** Custom time range handler */
  onCustomRange?: (startDate: Date, endDate: Date) => void;
}

export const TimeFilter: Component<TimeFilterProps> = props => {
  // State management
  const [showCustomRange, setShowCustomRange] = createSignal(false);
  const [customStartDate, setCustomStartDate] = createSignal('');
  const [customEndDate, setCustomEndDate] = createSignal('');

  // Default props
  const size = () => props.size || 'md';
  const showCounts = () => props.showCounts ?? true;
  const showCulturalGrouping = () => props.showCulturalGrouping ?? false;

  // Default time filter options
  const defaultOptions: TimeFilterOption[] = [
    {
      value: 'today',
      label: 'Today',
      description: 'Documents added today',
      icon: Clock,
    },
    {
      value: 'last-week',
      label: 'Last Week',
      description: 'Documents from the past 7 days',
      icon: Calendar,
    },
    {
      value: 'last-month',
      label: 'Last Month',
      description: 'Documents from the past 30 days',
      icon: Calendar,
    },
    {
      value: 'last-quarter',
      label: 'Last Quarter',
      description: 'Documents from the past 3 months',
      icon: Calendar,
      culturalContext: {
        level: 2,
        description: 'Seasonal knowledge collection period',
        traditionalName: 'Seasonal Gathering',
      },
    },
    {
      value: 'last-year',
      label: 'Last Year',
      description: 'Documents from the past 12 months',
      icon: Calendar,
      culturalContext: {
        level: 3,
        description: 'Annual traditional knowledge cycle',
        traditionalName: 'Yearly Wisdom Circle',
      },
    },
    {
      value: 'all-time',
      label: 'All Time',
      description: 'All documents in the collection',
      icon: Calendar,
    },
    {
      value: 'custom',
      label: 'Custom Range',
      description: 'Select a custom date range',
      isCustom: true,
      icon: Filter,
    },
  ];

  const options = () => props.options || defaultOptions;

  // Group options by cultural significance
  const groupedOptions = createMemo(() => {
    if (!showCulturalGrouping()) {
      return { standard: options(), cultural: [] };
    }

    const cultural = options().filter(opt => opt.culturalContext);
    const standard = options().filter(opt => !opt.culturalContext);

    return { standard, cultural };
  });

  // Get document count for a filter
  const getDocumentCount = (filterValue: string) => {
    return props.documentCounts?.[filterValue] || 0;
  };

  // Handle filter selection
  const handleFilterSelect = (filterValue: string) => {
    if (props.disabled) return;

    if (filterValue === 'custom') {
      setShowCustomRange(true);
    } else {
      props.onFilterChange?.(filterValue);
    }
  };

  // Handle custom range submission
  const handleCustomRangeSubmit = () => {
    const startDate = new Date(customStartDate());
    const endDate = new Date(customEndDate());

    if (startDate && endDate && startDate <= endDate) {
      props.onCustomRange?.(startDate, endDate);
      setShowCustomRange(false);
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  // Generate CSS classes
  const filterClasses = () =>
    [
      styles.timeFilter,
      styles[`timeFilter-${size()}`],
      props.disabled && styles.disabled,
      props.culturalTheme && styles[`cultural-${props.culturalTheme}`],
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  const renderFilterOption = (option: TimeFilterOption) => {
    const isSelected = props.selectedFilter === option.value;
    const count = getDocumentCount(option.value);
    const Icon = option.icon;

    return (
      <Tooltip content={option.description}>
        <Button
          variant={isSelected ? 'primary' : 'outline'}
          size={size()}
          class={`${styles.filterOption} ${isSelected ? styles.selected : ''}`}
          onClick={() => handleFilterSelect(option.value)}
          disabled={props.disabled}
          aria-pressed={isSelected}
          aria-describedby={option.culturalContext ? `cultural-${option.value}` : undefined}
        >
          <Show when={Icon}>
            <Icon size={16} class={styles.optionIcon} />
          </Show>

          <span class={styles.optionLabel}>{option.label}</span>

          <Show when={showCounts() && count > 0}>
            <Badge variant="secondary" size="sm" class={styles.countBadge}>
              {count}
            </Badge>
          </Show>

          <Show when={option.culturalContext}>
            <CulturalIndicator
              level={option.culturalContext!.level}
              size="sm"
              informationOnly={true}
              class={styles.culturalIndicator}
            />
          </Show>
        </Button>
      </Tooltip>
    );
  };

  return (
    <div class={filterClasses()} data-testid={props['data-testid']}>
      {/* Standard Time Filters */}
      <div class={styles.filterGroup}>
        <div class={styles.filterOptions}>
          <For each={groupedOptions().standard}>{option => renderFilterOption(option)}</For>
        </div>
      </div>

      {/* Cultural Time Filters */}
      <Show when={showCulturalGrouping() && groupedOptions().cultural.length > 0}>
        <div class={styles.culturalGroup}>
          <div class={styles.culturalHeader}>
            <h3 class={styles.culturalTitle}>Traditional Time Periods</h3>
            <Tooltip content="Cultural time periods provide educational context for traditional knowledge organization">
              <Info size={16} class={styles.culturalInfo} />
            </Tooltip>
          </div>

          <div class={styles.filterOptions}>
            <For each={groupedOptions().cultural}>
              {option => (
                <div class={styles.culturalOption}>
                  {renderFilterOption(option)}
                  <Show when={option.culturalContext}>
                    <div id={`cultural-${option.value}`} class={styles.culturalContext}>
                      <p class={styles.culturalDescription}>
                        {option.culturalContext!.description}
                      </p>
                      <Show when={option.culturalContext!.traditionalName}>
                        <p class={styles.traditionalName}>
                          Traditional name: {option.culturalContext!.traditionalName}
                        </p>
                      </Show>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Custom Date Range Modal */}
      <Show when={showCustomRange()}>
        <Card class={styles.customRangeModal}>
          <div class={styles.customRangeHeader}>
            <h3>Select Custom Date Range</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomRange(false)}
              aria-label="Close custom range"
            >
              ×
            </Button>
          </div>

          <div class={styles.customRangeContent}>
            <div class={styles.dateInput}>
              <label for="start-date">Start Date:</label>
              <input
                id="start-date"
                type="date"
                value={customStartDate()}
                onInput={e => setCustomStartDate(e.currentTarget.value)}
                class={styles.dateField}
              />
            </div>

            <div class={styles.dateInput}>
              <label for="end-date">End Date:</label>
              <input
                id="end-date"
                type="date"
                value={customEndDate()}
                onInput={e => setCustomEndDate(e.currentTarget.value)}
                class={styles.dateField}
                min={customStartDate()}
              />
            </div>
          </div>

          <div class={styles.customRangeActions}>
            <Button variant="outline" onClick={() => setShowCustomRange(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCustomRangeSubmit}
              disabled={!customStartDate() || !customEndDate()}
            >
              Apply Range
            </Button>
          </div>
        </Card>
      </Show>
    </div>
  );
};

export default TimeFilter;
