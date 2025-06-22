import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { Search, X, Filter } from 'lucide-solid';
import { CULTURAL_SENSITIVITY_LEVELS, CULTURAL_LABELS } from '../../../constants/cultural';
import styles from './SearchBar.module.css';

/**
 * Cultural Theme Types for SearchBar Styling
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
 * Search Types for Different Content Categories
 * Ensures technical security without content censorship
 */
export type SearchType = 'document' | 'category' | 'cultural' | 'community' | 'general';

/**
 * Enhanced SearchBar Props Interface
 * Follows SOLID principles with comprehensive accessibility and cultural support
 */
export interface SearchBarProps {
  // Core Search Properties
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  autoFocus?: boolean;
  debounceMs?: number;

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: CulturalTheme;
  culturalSensitivityLevel?: number;
  culturalContext?: string;
  showCulturalIndicator?: boolean;
  searchType?: SearchType;

  // Search Features
  showClearButton?: boolean;
  showFilterButton?: boolean;
  showSearchIcon?: boolean;
  showSuggestions?: boolean;
  suggestions?: string[];
  recentSearches?: string[];
  maxSuggestions?: number;

  // Accessibility Properties
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;

  // Event Handlers
  onSearch?: (query: string) => void;
  onChange?: (value: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onFilterClick?: () => void;
  onSuggestionSelect?: (suggestion: string) => void;

  // Styling
  class?: string;
  className?: string;
  id?: string;
}

/**
 * SearchBar Component
 *
 * A comprehensive, accessible search bar component with cultural theme support
 * and intelligent suggestions. Cultural information is displayed for educational
 * purposes only - never for access restriction.
 *
 * @example
 * ```tsx
 * <SearchBar
 *   placeholder="Search cultural heritage..."
 *   culturalTheme="indigenous"
 *   culturalContext="Traditional knowledge search"
 *   onSearch={handleSearch}
 *   showSuggestions={true}
 * />
 * ```
 */
const SearchBar: Component<SearchBarProps> = props => {
  // Internal state for search functionality
  const [internalValue, setInternalValue] = createSignal(props.value || '');
  const [isFocused, setIsFocused] = createSignal(false);
  const [showSuggestionList, setShowSuggestionList] = createSignal(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = createSignal(-1);
  const [showCulturalTooltip, setShowCulturalTooltip] = createSignal(false);

  let searchTimeout: number;
  let inputRef: HTMLInputElement | undefined;

  // Debounced search effect
  createEffect(() => {
    const value = internalValue();
    if (props.debounceMs && props.onSearch) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        props.onSearch?.(value);
      }, props.debounceMs);
    }
  });

  // Update internal value when props change
  createEffect(() => {
    if (props.value !== undefined && props.value !== internalValue()) {
      setInternalValue(props.value);
    }
  });

  /**
   * Generate Cultural Context Tooltip
   */
  const getCulturalTooltip = () => {
    if (!props.culturalContext && !props.culturalSensitivityLevel) return null;

    const sensitivityLabel = props.culturalSensitivityLevel
      ? CULTURAL_LABELS[props.culturalSensitivityLevel] || 'Cultural Context'
      : null;

    return {
      title: props.culturalContext || sensitivityLabel,
      description: 'Cultural context provided for educational purposes only',
      sensitivityLevel: sensitivityLabel,
      searchType: props.searchType,
    };
  };

  /**
   * Handle Input Change
   */
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    setInternalValue(value);
    props.onChange?.(value);

    // Show suggestions if enabled
    if (props.showSuggestions && value.length > 0) {
      setShowSuggestionList(true);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowSuggestionList(false);
    }

    // Immediate search if no debounce
    if (!props.debounceMs && props.onSearch) {
      props.onSearch(value);
    }
  };

  /**
   * Handle Search Submit
   */
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const value = internalValue().trim();
    props.onSearch?.(value);
    setShowSuggestionList(false);
  };

  /**
   * Handle Clear Search
   */
  const handleClear = () => {
    setInternalValue('');
    setShowSuggestionList(false);
    props.onChange?.('');
    props.onClear?.();
    inputRef?.focus();
  };

  /**
   * Handle Focus Events
   */
  const handleFocus = () => {
    setIsFocused(true);
    props.onFocus?.();

    // Show suggestions if available
    if (props.showSuggestions && internalValue().length > 0) {
      setShowSuggestionList(true);
    }
  };

  /**
   * Handle Blur Events
   */
  const handleBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestionList(false);
      setSelectedSuggestionIndex(-1);
    }, 150);
    props.onBlur?.();
  };

  /**
   * Handle Keyboard Navigation
   */
  const handleKeyDown = (e: KeyboardEvent) => {
    const suggestions = getFilteredSuggestions();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (showSuggestionList() && suggestions.length > 0) {
          setSelectedSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (showSuggestionList() && suggestions.length > 0) {
          setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex() >= 0 && suggestions[selectedSuggestionIndex()]) {
          handleSuggestionSelect(suggestions[selectedSuggestionIndex()]);
        } else {
          handleSubmit(e);
        }
        break;

      case 'Escape':
        setShowSuggestionList(false);
        setSelectedSuggestionIndex(-1);
        inputRef?.blur();
        break;
    }
  };

  /**
   * Handle Suggestion Selection
   */
  const handleSuggestionSelect = (suggestion: string) => {
    setInternalValue(suggestion);
    setShowSuggestionList(false);
    setSelectedSuggestionIndex(-1);
    props.onChange?.(suggestion);
    props.onSuggestionSelect?.(suggestion);
    props.onSearch?.(suggestion);
  };

  /**
   * Get Filtered Suggestions
   */
  const getFilteredSuggestions = () => {
    const query = internalValue().toLowerCase();
    const suggestions = props.suggestions || [];
    const recentSearches = props.recentSearches || [];
    const maxSuggestions = props.maxSuggestions || 8;

    // Combine and filter suggestions
    const allSuggestions = [...new Set([...suggestions, ...recentSearches])];
    const filtered = allSuggestions
      .filter(suggestion => suggestion.toLowerCase().includes(query))
      .slice(0, maxSuggestions);

    return filtered;
  };

  /**
   * Generate CSS Classes
   */
  const searchBarClasses = () =>
    [
      styles['search-bar'],
      styles[`search-bar-${props.size || 'md'}`],
      styles[`search-bar-${props.variant || 'default'}`],
      props.culturalTheme && styles[`search-bar-cultural-${props.culturalTheme}`],
      props.disabled && styles['search-bar-disabled'],
      props.loading && styles['search-bar-loading'],
      isFocused() && styles['search-bar-focused'],
      props.class || props.className,
    ]
      .filter(Boolean)
      .join(' ');

  /**
   * Generate ARIA Attributes
   */
  const ariaAttributes = () => ({
    'aria-label': props.ariaLabel || 'Search input',
    'aria-describedby': props.ariaDescribedBy,
    'aria-expanded': showSuggestionList(),
    'aria-autocomplete': 'list' as const,
    'aria-activedescendant':
      selectedSuggestionIndex() >= 0 ? `suggestion-${selectedSuggestionIndex()}` : undefined,
    role: props.role || 'searchbox',
  });

  const culturalTooltip = getCulturalTooltip();
  const filteredSuggestions = getFilteredSuggestions();

  return (
    <div class={styles['search-bar-wrapper']}>
      <form class={searchBarClasses()} onSubmit={handleSubmit}>
        {/* Search Icon */}
        <Show when={props.showSearchIcon !== false}>
          <div class={styles['search-icon']}>
            <Search size={20} />
          </div>
        </Show>

        {/* Cultural Indicator */}
        <Show when={props.showCulturalIndicator && props.culturalTheme}>
          <div
            class={styles['search-cultural-indicator']}
            aria-label={`Cultural theme: ${props.culturalTheme}`}
          >
            🌿
          </div>
        </Show>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          class={styles['search-input']}
          placeholder={props.placeholder || 'Search...'}
          value={internalValue()}
          disabled={props.disabled}
          autoFocus={props.autoFocus}
          id={props.id}
          {...ariaAttributes()}
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => {
            if (culturalTooltip) setShowCulturalTooltip(true);
          }}
          onMouseLeave={() => {
            setShowCulturalTooltip(false);
          }}
        />

        {/* Loading Indicator */}
        <Show when={props.loading}>
          <div class={styles['search-loading']} aria-label="Searching...">
            <div class={styles['search-spinner']} />
          </div>
        </Show>

        {/* Clear Button */}
        <Show
          when={props.showClearButton !== false && internalValue().length > 0 && !props.loading}
        >
          <button
            type="button"
            class={styles['search-clear']}
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        </Show>

        {/* Filter Button */}
        <Show when={props.showFilterButton}>
          <button
            type="button"
            class={styles['search-filter']}
            onClick={props.onFilterClick}
            aria-label="Open filters"
          >
            <Filter size={16} />
          </button>
        </Show>
      </form>

      {/* Suggestions Dropdown */}
      <Show when={showSuggestionList() && filteredSuggestions.length > 0}>
        <div class={styles['suggestions-dropdown']} role="listbox">
          <For each={filteredSuggestions}>
            {(suggestion, index) => (
              <div
                id={`suggestion-${index()}`}
                class={`${styles['suggestion-item']} ${
                  selectedSuggestionIndex() === index() ? styles['suggestion-selected'] : ''
                }`}
                role="option"
                aria-selected={selectedSuggestionIndex() === index()}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <Search size={14} class={styles['suggestion-icon']} />
                <span class={styles['suggestion-text']}>{suggestion}</span>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Cultural Context Tooltip */}
      <Show when={showCulturalTooltip() && culturalTooltip}>
        <div class={styles['search-cultural-tooltip']} role="tooltip">
          <div class={styles['tooltip-content']}>
            <strong>{culturalTooltip?.title}</strong>
            {culturalTooltip?.sensitivityLevel && (
              <div class={styles['sensitivity-level']}>{culturalTooltip.sensitivityLevel}</div>
            )}
            {culturalTooltip?.searchType && (
              <div class={styles['search-type']}>Search Type: {culturalTooltip.searchType}</div>
            )}
            <div class={styles['tooltip-description']}>{culturalTooltip?.description}</div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default SearchBar;
export { SearchBar };
