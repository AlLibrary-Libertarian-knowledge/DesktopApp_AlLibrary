import { Component, createSignal, For, Show, createEffect } from 'solid-js';
import { Filter, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-solid';
import { Button } from '../../foundation/Button';
import { Input } from '../../foundation/Input';
import { Card } from '../../foundation/Card';
import styles from './FilterPanel.module.css';

export type FilterValue = string | number | boolean | Date | [Date, Date];

export interface FilterOption {
  value: FilterValue;
  label: string;
  count?: number;
  disabled?: boolean;
  culturalContext?: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  type: 'checkbox' | 'radio' | 'select' | 'range' | 'date' | 'text';
  options?: FilterOption[];
  multiple?: boolean;
  searchable?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  culturalInfo?: string;
  educationalContext?: string;
}

export interface FilterState {
  [key: string]: FilterValue | FilterValue[];
}

export interface AvailableFilters {
  types?: string[];
  culturalSensitivity?: string[];
  culturalOrigins?: string[];
  sensitivityLevels?: string[];
  knowledgeTypes?: string[];
  regions?: string[];
  dateRange?: [Date, Date];
  categories?: string[];
  formats?: string[];
  communities?: string[];
}

export interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableFilters: AvailableFilters;
  filterGroups?: FilterGroup[];
  variant?: 'sidebar' | 'horizontal' | 'modal' | 'compact';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  showFilterCount?: boolean;
  showClearAll?: boolean;
  showApplyButton?: boolean;
  culturalTheme?: 'indigenous' | 'traditional' | 'modern' | 'ceremonial' | 'community' | 'default';
  className?: string;
  ariaLabel?: string;
  onApply?: (filters: FilterState) => void;
  onClear?: () => void;
}

const FilterPanel: Component<FilterPanelProps> = props => {
  const [isCollapsed, setIsCollapsed] = createSignal(props.defaultCollapsed || false);
  const [collapsedGroups, setCollapsedGroups] = createSignal<Set<string>>(new Set());
  const [searchTerms, setSearchTerms] = createSignal<Record<string, string>>({});
  const [pendingFilters, setPendingFilters] = createSignal<FilterState>(props.filters);

  // Update pending filters when props change
  createEffect(() => {
    setPendingFilters(props.filters);
  });

  // Generate default filter groups from available filters
  const getDefaultFilterGroups = (): FilterGroup[] => {
    const groups: FilterGroup[] = [];

    if (props.availableFilters.types?.length) {
      groups.push({
        key: 'types',
        label: 'Content Types',
        type: 'checkbox',
        multiple: true,
        options: props.availableFilters.types.map(type => ({
          value: type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
        })),
      });
    }

    if (props.availableFilters.categories?.length) {
      groups.push({
        key: 'categories',
        label: 'Categories',
        type: 'checkbox',
        multiple: true,
        searchable: true,
        options: props.availableFilters.categories.map(category => ({
          value: category,
          label: category,
        })),
      });
    }

    if (props.availableFilters.culturalOrigins?.length) {
      groups.push({
        key: 'culturalOrigins',
        label: 'Cultural Origins',
        type: 'checkbox',
        multiple: true,
        searchable: true,
        culturalInfo: 'Cultural information provided for educational purposes only',
        educationalContext: 'Organize content by cultural background for learning',
        options: props.availableFilters.culturalOrigins.map(origin => ({
          value: origin,
          label: origin,
          culturalContext: 'Educational organization only',
        })),
      });
    }

    if (props.availableFilters.sensitivityLevels?.length) {
      groups.push({
        key: 'sensitivityLevels',
        label: 'Cultural Context Levels',
        type: 'checkbox',
        multiple: true,
        culturalInfo: 'Cultural sensitivity levels for educational understanding',
        educationalContext: 'Learn about different cultural contexts and protocols',
        options: props.availableFilters.sensitivityLevels.map(level => ({
          value: level,
          label: level.charAt(0).toUpperCase() + level.slice(1) + ' Context',
          culturalContext: 'Educational context level',
        })),
      });
    }

    if (props.availableFilters.knowledgeTypes?.length) {
      groups.push({
        key: 'knowledgeTypes',
        label: 'Knowledge Types',
        type: 'checkbox',
        multiple: true,
        options: props.availableFilters.knowledgeTypes.map(type => ({
          value: type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
        })),
      });
    }

    if (props.availableFilters.regions?.length) {
      groups.push({
        key: 'regions',
        label: 'Regions',
        type: 'checkbox',
        multiple: true,
        searchable: true,
        options: props.availableFilters.regions.map(region => ({
          value: region,
          label: region,
        })),
      });
    }

    if (props.availableFilters.formats?.length) {
      groups.push({
        key: 'formats',
        label: 'File Formats',
        type: 'checkbox',
        multiple: true,
        options: props.availableFilters.formats.map(format => ({
          value: format,
          label: format.toUpperCase(),
        })),
      });
    }

    if (props.availableFilters.communities?.length) {
      groups.push({
        key: 'communities',
        label: 'Communities',
        type: 'checkbox',
        multiple: true,
        searchable: true,
        culturalInfo: 'Community information for educational connection',
        educationalContext: 'Connect with knowledge from different communities',
        options: props.availableFilters.communities.map(community => ({
          value: community,
          label: community,
          culturalContext: 'Community knowledge sharing',
        })),
      });
    }

    return groups;
  };

  const filterGroups = () => props.filterGroups || getDefaultFilterGroups();

  const getActiveFilterCount = () => {
    const filters = pendingFilters();
    return Object.values(filters).filter(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== null && value !== undefined && value !== '';
    }).length;
  };

  const handleFilterChange = (groupKey: string, value: FilterValue, checked?: boolean) => {
    const currentFilters = { ...pendingFilters() };
    const group = filterGroups().find(g => g.key === groupKey);

    if (group?.multiple) {
      const currentValues = Array.isArray(currentFilters[groupKey])
        ? (currentFilters[groupKey] as FilterValue[])
        : [];

      if (checked) {
        currentFilters[groupKey] = [...currentValues, value];
      } else {
        currentFilters[groupKey] = currentValues.filter(v => v !== value);
      }
    } else {
      currentFilters[groupKey] = value;
    }

    setPendingFilters(currentFilters);

    if (!props.showApplyButton) {
      props.onFiltersChange(currentFilters);
    }
  };

  const handleApply = () => {
    props.onFiltersChange(pendingFilters());
    props.onApply?.(pendingFilters());
  };

  const handleClearAll = () => {
    const clearedFilters: FilterState = {};
    setPendingFilters(clearedFilters);
    props.onFiltersChange(clearedFilters);
    props.onClear?.();
  };

  const toggleGroupCollapse = (groupKey: string) => {
    const current = collapsedGroups();
    const newSet = new Set(current);

    if (newSet.has(groupKey)) {
      newSet.delete(groupKey);
    } else {
      newSet.add(groupKey);
    }

    setCollapsedGroups(newSet);
  };

  const filterOptions = (group: FilterGroup, options: FilterOption[]) => {
    const searchTerm = searchTerms()[group.key]?.toLowerCase() || '';
    if (!searchTerm) return options;

    return options.filter(option => option.label.toLowerCase().includes(searchTerm));
  };

  const isOptionSelected = (groupKey: string, value: FilterValue) => {
    const currentValue = pendingFilters()[groupKey];
    if (Array.isArray(currentValue)) {
      return currentValue.includes(value);
    }
    return currentValue === value;
  };

  const panelClasses = () =>
    [
      styles['filter-panel'],
      styles[`variant-${props.variant || 'sidebar'}`],
      props.culturalTheme && styles[`cultural-${props.culturalTheme}`],
      isCollapsed() && styles['collapsed'],
      props.className,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <Card class={panelClasses()} variant="outlined" aria-label={props.ariaLabel || 'Filter panel'}>
      {/* Filter Header */}
      <div class={styles['filter-header']}>
        <div class={styles['header-content']}>
          <div class={styles['header-title']}>
            <Filter size={16} />
            <h3 class={styles['title']}>Filters</h3>
            <Show when={props.showFilterCount && getActiveFilterCount() > 0}>
              <span class={styles['filter-count']}>{getActiveFilterCount()}</span>
            </Show>
          </div>

          <div class={styles['header-actions']}>
            <Show when={props.showClearAll && getActiveFilterCount() > 0}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                ariaLabel="Clear all filters"
              >
                <RotateCcw size={14} />
                Clear All
              </Button>
            </Show>

            <Show when={props.collapsible}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed())}
                ariaLabel={isCollapsed() ? 'Expand filters' : 'Collapse filters'}
              >
                {isCollapsed() ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </Button>
            </Show>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      <Show when={!isCollapsed()}>
        <div class={styles['filter-content']}>
          <For each={filterGroups()}>
            {group => (
              <div class={styles['filter-group']}>
                {/* Group Header */}
                <div class={styles['group-header']}>
                  <button
                    class={styles['group-toggle']}
                    onClick={() => group.collapsible && toggleGroupCollapse(group.key)}
                    disabled={!group.collapsible}
                    aria-expanded={!collapsedGroups().has(group.key)}
                  >
                    <span class={styles['group-label']}>{group.label}</span>
                    <Show when={group.collapsible}>
                      {collapsedGroups().has(group.key) ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronUp size={14} />
                      )}
                    </Show>
                  </button>

                  {/* Cultural Information Badge */}
                  <Show when={group.culturalInfo}>
                    <div class={styles['cultural-badge']} title={group.educationalContext}>
                      🌿 Educational
                    </div>
                  </Show>
                </div>

                {/* Group Content */}
                <Show when={!collapsedGroups().has(group.key)}>
                  <div class={styles['group-content']}>
                    {/* Search Input for Searchable Groups */}
                    <Show when={group.searchable && group.options && group.options.length > 5}>
                      <div class={styles['group-search']}>
                        <Input
                          type="text"
                          placeholder={`Search ${group.label.toLowerCase()}...`}
                          value={searchTerms()[group.key] || ''}
                          onInput={value => {
                            setSearchTerms(prev => ({
                              ...prev,
                              [group.key]: value,
                            }));
                          }}
                          size="sm"
                        />
                      </div>
                    </Show>

                    {/* Filter Options */}
                    <div class={styles['options-container']}>
                      <Show when={group.options}>
                        <For each={filterOptions(group, group.options!)}>
                          {option => (
                            <label class={styles['option-label']}>
                              <input
                                type={group.multiple ? 'checkbox' : 'radio'}
                                name={group.key}
                                checked={isOptionSelected(group.key, option.value)}
                                disabled={option.disabled}
                                onChange={e =>
                                  handleFilterChange(group.key, option.value, e.target.checked)
                                }
                                class={styles['option-input']}
                              />

                              <div class={styles['option-content']}>
                                <span class={styles['option-text']}>{option.label}</span>

                                <Show when={option.count !== undefined}>
                                  <span class={styles['option-count']}>({option.count})</span>
                                </Show>

                                <Show when={option.culturalContext}>
                                  <span
                                    class={styles['cultural-indicator']}
                                    title={option.culturalContext}
                                  >
                                    🌿
                                  </span>
                                </Show>
                              </div>
                            </label>
                          )}
                        </For>
                      </Show>
                    </div>

                    {/* Cultural Information Notice */}
                    <Show when={group.culturalInfo}>
                      <div class={styles['cultural-notice']}>
                        <span class={styles['notice-text']}>{group.culturalInfo}</span>
                      </div>
                    </Show>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>

        {/* Apply Button */}
        <Show when={props.showApplyButton}>
          <div class={styles['filter-actions']}>
            <Button
              variant="primary"
              onClick={handleApply}
              disabled={getActiveFilterCount() === 0}
              class={styles['apply-button']}
            >
              Apply Filters ({getActiveFilterCount()})
            </Button>
          </div>
        </Show>
      </Show>
    </Card>
  );
};

export default FilterPanel;
