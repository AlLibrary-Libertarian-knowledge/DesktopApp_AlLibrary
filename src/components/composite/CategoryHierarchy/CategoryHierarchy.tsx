/**
 * Category Hierarchy Composite Component
 *
 * A hierarchical tree view for browsing categories with cultural context.
 * Supports collapsible nodes and cultural sensitivity indicators.
 */

import { Component, createSignal, For, Show, JSX } from 'solid-js';
import styles from './CategoryHierarchy.module.css';

export interface CategoryNode {
  /** Unique category ID */
  id: string;
  /** Category name */
  name: string;
  /** Category description */
  description?: string;
  /** Parent category ID */
  parentId?: string;
  /** Hierarchy level (0 = root) */
  level: number;
  /** Number of documents in category */
  documentCount: number;
  /** Cultural sensitivity level */
  culturalSensitivityLevel?: number;
  /** Cultural origin */
  culturalOrigin?: string;
  /** Child categories */
  children?: CategoryNode[];
  /** Whether category has content */
  hasContent: boolean;
  /** Category icon */
  icon?: JSX.Element;
  /** Traditional knowledge indicator */
  isTraditionalKnowledge?: boolean;
}

export interface CategoryHierarchyProps {
  /** Root categories to display */
  categories: CategoryNode[];
  /** Currently selected category ID */
  selectedCategoryId?: string;
  /** Expanded category IDs */
  expandedCategories?: Set<string>;
  /** Maximum depth to display */
  maxDepth?: number;
  /** Show document counts */
  showDocumentCounts?: boolean;
  /** Show cultural indicators */
  showCulturalIndicators?: boolean;
  /** Cultural theme */
  culturalTheme?: 'default' | 'indigenous' | 'traditional' | 'ceremonial';
  /** Compact mode */
  compact?: boolean;
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Category selection handler */
  onCategorySelect?: (category: CategoryNode) => void;
  /** Category expansion handler */
  onCategoryToggle?: (categoryId: string, expanded: boolean) => void;
  /** Cultural context request handler */
  onCulturalContextRequest?: (category: CategoryNode) => void;
}

export const CategoryHierarchy: Component<CategoryHierarchyProps> = props => {
  // Local state for expanded categories if not controlled
  const [localExpanded, setLocalExpanded] = createSignal<Set<string>>(new Set());

  // Default props
  const maxDepth = () => props.maxDepth || 10;
  const showDocumentCounts = () => props.showDocumentCounts ?? true;
  const showCulturalIndicators = () => props.showCulturalIndicators ?? true;
  const culturalTheme = () => props.culturalTheme || 'default';

  // Get expanded categories (controlled or local)
  const getExpandedCategories = () => {
    return props.expandedCategories || localExpanded();
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    const expanded = getExpandedCategories();
    const isExpanded = expanded.has(categoryId);

    if (props.expandedCategories) {
      // Controlled mode
      props.onCategoryToggle?.(categoryId, !isExpanded);
    } else {
      // Local mode
      const newExpanded = new Set(expanded);
      if (isExpanded) {
        newExpanded.delete(categoryId);
      } else {
        newExpanded.add(categoryId);
      }
      setLocalExpanded(newExpanded);
      props.onCategoryToggle?.(categoryId, !isExpanded);
    }
  };

  // Handle category selection
  const handleCategorySelect = (category: CategoryNode, event: MouseEvent) => {
    event.stopPropagation();
    props.onCategorySelect?.(category);
  };

  // Handle cultural context request
  const handleCulturalContextRequest = (category: CategoryNode, event: MouseEvent) => {
    event.stopPropagation();
    props.onCulturalContextRequest?.(category);
  };

  // Generate CSS classes
  const hierarchyClasses = () =>
    [
      styles.categoryHierarchy,
      styles[`hierarchy-cultural-${culturalTheme()}`],
      props.compact && styles.compact,
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  const nodeClasses = (category: CategoryNode) => {
    const isSelected = props.selectedCategoryId === category.id;
    const isExpanded = getExpandedCategories().has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return [
      styles.categoryNode,
      styles[`level-${Math.min(category.level, 5)}`],
      isSelected && styles.selected,
      isExpanded && styles.expanded,
      hasChildren && styles.hasChildren,
      !category.hasContent && styles.empty,
      category.isTraditionalKnowledge && styles.traditionalKnowledge,
      category.culturalSensitivityLevel &&
        category.culturalSensitivityLevel > 0 &&
        styles.culturallySensitive,
    ]
      .filter(Boolean)
      .join(' ');
  };

  // Render category node
  const renderCategoryNode = (category: CategoryNode): JSX.Element => {
    if (category.level >= maxDepth()) {
      return <></>;
    }

    const isExpanded = getExpandedCategories().has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div class={nodeClasses(category)}>
        <div
          class={styles.categoryContent}
          onClick={e => handleCategorySelect(category, e)}
          role="button"
          tabIndex={0}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={`${category.name}${category.documentCount > 0 ? `, ${category.documentCount} documents` : ''}`}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCategorySelect(category, e as any);
            }
          }}
        >
          {/* Expansion toggle */}
          {hasChildren && (
            <button
              class={styles.expandToggle}
              onClick={e => {
                e.stopPropagation();
                toggleCategory(category.id);
              }}
              aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
            >
              <svg
                class={styles.expandIcon}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                {isExpanded ? <path d="M18 15l-6-6-6 6" /> : <path d="M9 18l6-6-6-6" />}
              </svg>
            </button>
          )}

          {/* Category icon */}
          {category.icon && <span class={styles.categoryIcon}>{category.icon}</span>}

          {/* Category name and details */}
          <div class={styles.categoryDetails}>
            <span class={styles.categoryName}>{category.name}</span>

            {showDocumentCounts() && category.documentCount > 0 && (
              <span class={styles.documentCount}>({category.documentCount})</span>
            )}

            {category.description && (
              <span class={styles.categoryDescription}>{category.description}</span>
            )}
          </div>

          {/* Cultural indicators */}
          {showCulturalIndicators() && (
            <div class={styles.culturalIndicators}>
              {category.isTraditionalKnowledge && (
                <span
                  class={styles.traditionalKnowledgeIndicator}
                  title="Traditional Knowledge"
                  aria-label="Contains traditional knowledge"
                >
                  🏛️
                </span>
              )}

              {category.culturalSensitivityLevel && category.culturalSensitivityLevel > 0 && (
                <button
                  class={styles.culturalSensitivityIndicator}
                  title={`Cultural sensitivity level: ${category.culturalSensitivityLevel}`}
                  aria-label={`Cultural sensitivity level ${category.culturalSensitivityLevel} - click for context`}
                  onClick={e => handleCulturalContextRequest(category, e)}
                >
                  🌿
                </button>
              )}

              {category.culturalOrigin && (
                <span
                  class={styles.culturalOriginIndicator}
                  title={`Cultural origin: ${category.culturalOrigin}`}
                  aria-label={`Cultural origin: ${category.culturalOrigin}`}
                >
                  🗺️
                </span>
              )}
            </div>
          )}
        </div>

        {/* Child categories */}
        <Show when={hasChildren && isExpanded}>
          <div class={styles.childCategories} role="group">
            <For each={category.children}>{child => renderCategoryNode(child)}</For>
          </div>
        </Show>
      </div>
    );
  };

  return (
    <div
      class={hierarchyClasses()}
      role="tree"
      aria-label="Category hierarchy"
      data-testid={props['data-testid']}
    >
      <For each={props.categories}>{category => renderCategoryNode(category)}</For>
    </div>
  );
};

export default CategoryHierarchy;
