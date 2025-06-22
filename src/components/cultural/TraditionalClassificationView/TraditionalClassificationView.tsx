/**
 * Traditional Classification View Cultural Component
 *
 * Displays traditional knowledge classification systems for educational purposes.
 * INFORMATION ONLY - NO ACCESS CONTROL - Educational context provided.
 */

import { Component, createSignal, For, Show } from 'solid-js';
import styles from './TraditionalClassificationView.module.css';

export interface TraditionalClassification {
  /** Unique identifier */
  id: string;
  /** Classification name */
  name: string;
  /** Description of the classification system */
  description: string;
  /** Cultural origin */
  culturalOrigin: string;
  /** Community associated */
  community: string;
  /** Traditional categories */
  categories: TraditionalCategory[];
  /** Educational resources */
  educationalResources: EducationalResource[];
  /** Source attribution */
  sourceAttribution: string;
  /** Information only - no access control */
  readonly informationOnly: true;
}

export interface TraditionalCategory {
  /** Category ID */
  id: string;
  /** Category name */
  name: string;
  /** Traditional name in original language */
  traditionalName?: string;
  /** Description */
  description: string;
  /** Subcategories */
  subcategories?: TraditionalCategory[];
  /** Document count */
  documentCount: number;
  /** Cultural significance */
  culturalSignificance: string;
  /** Educational context */
  educationalContext: string;
}

export interface EducationalResource {
  /** Resource ID */
  id: string;
  /** Resource title */
  title: string;
  /** Resource type */
  type: 'article' | 'video' | 'audio' | 'document' | 'website';
  /** Resource URL or path */
  url: string;
  /** Description */
  description: string;
  /** Language */
  language: string;
}

export interface TraditionalClassificationViewProps {
  /** Classification systems to display */
  classifications: TraditionalClassification[];
  /** Selected classification ID */
  selectedClassificationId?: string;
  /** Show educational resources */
  showEducationalResources?: boolean;
  /** Show cultural context */
  showCulturalContext?: boolean;
  /** Compact display mode */
  compact?: boolean;
  /** Cultural theme */
  culturalTheme?: 'indigenous' | 'traditional' | 'ceremonial' | 'default';
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Classification selection handler */
  onClassificationSelect?: (classification: TraditionalClassification) => void;
  /** Category selection handler */
  onCategorySelect?: (category: TraditionalCategory) => void;
  /** Educational resource access handler */
  onEducationalResourceAccess?: (resource: EducationalResource) => void;
}

export const TraditionalClassificationView: Component<
  TraditionalClassificationViewProps
> = props => {
  const [selectedClassification, setSelectedClassification] = createSignal<string | undefined>(
    props.selectedClassificationId
  );
  const [expandedCategories, setExpandedCategories] = createSignal<Set<string>>(new Set());

  // Default props
  const showEducationalResources = () => props.showEducationalResources ?? true;
  const showCulturalContext = () => props.showCulturalContext ?? true;
  const culturalTheme = () => props.culturalTheme || 'traditional';

  // Handle classification selection
  const handleClassificationSelect = (classification: TraditionalClassification) => {
    setSelectedClassification(classification.id);
    props.onClassificationSelect?.(classification);
  };

  // Handle category selection
  const handleCategorySelect = (category: TraditionalCategory) => {
    props.onCategorySelect?.(category);
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    const expanded = expandedCategories();
    const newExpanded = new Set(expanded);

    if (expanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }

    setExpandedCategories(newExpanded);
  };

  // Handle educational resource access
  const handleEducationalResourceAccess = (resource: EducationalResource) => {
    props.onEducationalResourceAccess?.(resource);
  };

  // Get selected classification
  const getSelectedClassification = () => {
    const id = selectedClassification();
    return props.classifications.find(c => c.id === id);
  };

  // Render category tree
  const renderCategory = (category: TraditionalCategory, level: number = 0): any => {
    const isExpanded = expandedCategories().has(category.id);
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;

    return (
      <div class={`${styles.category} ${styles[`level-${Math.min(level, 3)}`]}`}>
        <div class={styles.categoryHeader} onClick={() => handleCategorySelect(category)}>
          {hasSubcategories && (
            <button
              class={styles.expandButton}
              onClick={e => {
                e.stopPropagation();
                toggleCategory(category.id);
              }}
              aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}

          <div class={styles.categoryInfo}>
            <h4 class={styles.categoryName}>{category.name}</h4>
            {category.traditionalName && (
              <span class={styles.traditionalName}>({category.traditionalName})</span>
            )}
            <p class={styles.categoryDescription}>{category.description}</p>

            {showCulturalContext() && (
              <div class={styles.culturalContext}>
                <strong>Cultural Significance:</strong> {category.culturalSignificance}
              </div>
            )}

            <div class={styles.documentCount}>{category.documentCount} documents</div>
          </div>
        </div>

        {hasSubcategories && isExpanded && (
          <div class={styles.subcategories}>
            <For each={category.subcategories}>
              {subcategory => renderCategory(subcategory, level + 1)}
            </For>
          </div>
        )}
      </div>
    );
  };

  // Generate CSS classes
  const containerClasses = () =>
    [
      styles.traditionalClassificationView,
      styles[`theme-${culturalTheme()}`],
      props.compact && styles.compact,
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  const selectedClassificationData = getSelectedClassification();

  return (
    <div class={containerClasses()} data-testid={props['data-testid']}>
      {/* Information Notice */}
      <div class={styles.informationNotice}>
        <div class={styles.noticeIcon}>ℹ️</div>
        <div class={styles.noticeText}>
          <strong>Educational Information:</strong> Traditional classification systems are displayed
          for educational and cultural understanding purposes. All content is shared with respect
          for cultural heritage and traditional knowledge.
        </div>
      </div>

      {/* Classification Selector */}
      <div class={styles.classificationSelector}>
        <h3 class={styles.selectorTitle}>Traditional Classification Systems</h3>
        <div class={styles.classificationList}>
          <For each={props.classifications}>
            {classification => (
              <div
                class={`${styles.classificationItem} ${
                  selectedClassification() === classification.id ? styles.selected : ''
                }`}
                onClick={() => handleClassificationSelect(classification)}
              >
                <h4 class={styles.classificationName}>{classification.name}</h4>
                <p class={styles.classificationDescription}>{classification.description}</p>
                <div class={styles.classificationMeta}>
                  <span class={styles.culturalOrigin}>{classification.culturalOrigin}</span>
                  <span class={styles.community}>{classification.community}</span>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Selected Classification Details */}
      <Show when={selectedClassificationData}>
        {classification => (
          <div class={styles.classificationDetails}>
            <div class={styles.classificationHeader}>
              <h2 class={styles.classificationTitle}>{classification().name}</h2>
              <p class={styles.classificationDescription}>{classification().description}</p>

              {showCulturalContext() && (
                <div class={styles.culturalInfo}>
                  <div class={styles.culturalOrigin}>
                    <strong>Cultural Origin:</strong> {classification().culturalOrigin}
                  </div>
                  <div class={styles.community}>
                    <strong>Community:</strong> {classification().community}
                  </div>
                  <div class={styles.sourceAttribution}>
                    <strong>Source:</strong> {classification().sourceAttribution}
                  </div>
                </div>
              )}
            </div>

            {/* Categories */}
            <div class={styles.categoriesSection}>
              <h3 class={styles.sectionTitle}>Categories</h3>
              <div class={styles.categoriesContainer}>
                <For each={classification().categories}>{category => renderCategory(category)}</For>
              </div>
            </div>

            {/* Educational Resources */}
            <Show
              when={showEducationalResources() && classification().educationalResources.length > 0}
            >
              <div class={styles.educationalSection}>
                <h3 class={styles.sectionTitle}>Educational Resources</h3>
                <div class={styles.resourcesList}>
                  <For each={classification().educationalResources}>
                    {resource => (
                      <div class={styles.educationalResource}>
                        <h4 class={styles.resourceTitle}>{resource.title}</h4>
                        <p class={styles.resourceDescription}>{resource.description}</p>
                        <div class={styles.resourceMeta}>
                          <span class={styles.resourceType}>{resource.type}</span>
                          <span class={styles.resourceLanguage}>{resource.language}</span>
                        </div>
                        <button
                          class={styles.resourceButton}
                          onClick={() => handleEducationalResourceAccess(resource)}
                        >
                          Access Resource
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
};

export default TraditionalClassificationView;
