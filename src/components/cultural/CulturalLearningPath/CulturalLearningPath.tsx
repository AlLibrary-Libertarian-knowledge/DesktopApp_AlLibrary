/**
 * Cultural Learning Path Component
 *
 * Provides educational pathways for cultural understanding.
 * INFORMATION ONLY - NO ACCESS CONTROL - Educational enhancement.
 */

import { Component, createSignal, For, Show } from 'solid-js';
import styles from './CulturalLearningPath.module.css';

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'audio' | 'interactive' | 'document';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  culturalContext: string;
  language: string;
  url: string;
  completed?: boolean;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  culturalFocus: string;
  community: string;
  totalResources: number;
  estimatedTime: number; // in hours
  resources: LearningResource[];
  prerequisites?: string[];
  outcomes: string[];
  sourceAttribution: string;
}

export interface CulturalLearningPathProps {
  /** Available learning paths */
  learningPaths: LearningPath[];
  /** Currently selected path ID */
  selectedPathId?: string;
  /** User progress data */
  userProgress?: Record<string, boolean>;
  /** Show progress tracking */
  showProgress?: boolean;
  /** Cultural theme */
  culturalTheme?: 'indigenous' | 'traditional' | 'ceremonial' | 'default';
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Path selection handler */
  onPathSelect?: (path: LearningPath) => void;
  /** Resource access handler */
  onResourceAccess?: (resource: LearningResource) => void;
  /** Progress update handler */
  onProgressUpdate?: (resourceId: string, completed: boolean) => void;
}

export const CulturalLearningPath: Component<CulturalLearningPathProps> = props => {
  const [selectedPath, setSelectedPath] = createSignal<string | undefined>(props.selectedPathId);
  const [expandedSections, setExpandedSections] = createSignal<Set<string>>(new Set());

  // Default props
  const showProgress = () => props.showProgress ?? true;
  const culturalTheme = () => props.culturalTheme || 'traditional';

  // Handle path selection
  const handlePathSelect = (path: LearningPath) => {
    setSelectedPath(path.id);
    props.onPathSelect?.(path);
  };

  // Handle resource access
  const handleResourceAccess = (resource: LearningResource) => {
    props.onResourceAccess?.(resource);
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const expanded = expandedSections();
    const newExpanded = new Set(expanded);

    if (expanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }

    setExpandedSections(newExpanded);
  };

  // Get selected path
  const getSelectedPath = () => {
    const id = selectedPath();
    return props.learningPaths.find(p => p.id === id);
  };

  // Calculate progress
  const calculateProgress = (path: LearningPath) => {
    if (!props.userProgress) return 0;
    const completed = path.resources.filter(r => props.userProgress![r.id]).length;
    return Math.round((completed / path.resources.length) * 100);
  };

  // Group resources by difficulty
  const groupResourcesByDifficulty = (resources: LearningResource[]) => {
    return {
      beginner: resources.filter(r => r.difficulty === 'beginner'),
      intermediate: resources.filter(r => r.difficulty === 'intermediate'),
      advanced: resources.filter(r => r.difficulty === 'advanced'),
    };
  };

  // Generate CSS classes
  const containerClasses = () =>
    [styles.culturalLearningPath, styles[`theme-${culturalTheme()}`], props.class]
      .filter(Boolean)
      .join(' ');

  const selectedPathData = getSelectedPath();

  return (
    <div class={containerClasses()} data-testid={props['data-testid']}>
      {/* Educational Notice */}
      <div class={styles.educationalNotice}>
        <div class={styles.noticeIcon}>📚</div>
        <div class={styles.noticeText}>
          <strong>Cultural Learning Paths:</strong> These educational resources are provided to
          enhance cultural understanding and appreciation. All content is shared with respect for
          cultural heritage and traditional knowledge systems.
        </div>
      </div>

      {/* Learning Paths Overview */}
      <div class={styles.pathsOverview}>
        <h2 class={styles.overviewTitle}>Available Learning Paths</h2>
        <div class={styles.pathsList}>
          <For each={props.learningPaths}>
            {path => {
              const progress = calculateProgress(path);
              const isSelected = selectedPath() === path.id;

              return (
                <div
                  class={`${styles.pathCard} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handlePathSelect(path)}
                >
                  <div class={styles.pathHeader}>
                    <h3 class={styles.pathName}>{path.name}</h3>
                    {showProgress() && <div class={styles.progressBadge}>{progress}% Complete</div>}
                  </div>

                  <p class={styles.pathDescription}>{path.description}</p>

                  <div class={styles.pathMeta}>
                    <div class={styles.culturalFocus}>
                      <strong>Focus:</strong> {path.culturalFocus}
                    </div>
                    <div class={styles.community}>
                      <strong>Community:</strong> {path.community}
                    </div>
                    <div class={styles.pathStats}>
                      <span>{path.totalResources} resources</span>
                      <span>{path.estimatedTime}h estimated</span>
                    </div>
                  </div>

                  {showProgress() && (
                    <div class={styles.progressBar}>
                      <div class={styles.progressFill} style={`width: ${progress}%`} />
                    </div>
                  )}
                </div>
              );
            }}
          </For>
        </div>
      </div>

      {/* Selected Path Details */}
      <Show when={selectedPathData}>
        {path => {
          const groupedResources = groupResourcesByDifficulty(path().resources);

          return (
            <div class={styles.pathDetails}>
              <div class={styles.pathDetailsHeader}>
                <h2 class={styles.pathTitle}>{path().name}</h2>
                <p class={styles.pathDescription}>{path().description}</p>

                <div class={styles.pathInfo}>
                  <div class={styles.culturalContext}>
                    <strong>Cultural Focus:</strong> {path().culturalFocus}
                  </div>
                  <div class={styles.community}>
                    <strong>Community:</strong> {path().community}
                  </div>
                  <div class={styles.sourceAttribution}>
                    <strong>Source:</strong> {path().sourceAttribution}
                  </div>
                </div>

                <Show when={path().prerequisites && path().prerequisites!.length > 0}>
                  <div class={styles.prerequisites}>
                    <h4>Prerequisites:</h4>
                    <ul>
                      <For each={path().prerequisites}>{prereq => <li>{prereq}</li>}</For>
                    </ul>
                  </div>
                </Show>

                <div class={styles.learningOutcomes}>
                  <h4>Learning Outcomes:</h4>
                  <ul>
                    <For each={path().outcomes}>{outcome => <li>{outcome}</li>}</For>
                  </ul>
                </div>
              </div>

              {/* Learning Resources by Difficulty */}
              <div class={styles.resourcesSections}>
                <For
                  each={[
                    {
                      key: 'beginner',
                      title: 'Beginner Resources',
                      resources: groupedResources.beginner,
                    },
                    {
                      key: 'intermediate',
                      title: 'Intermediate Resources',
                      resources: groupedResources.intermediate,
                    },
                    {
                      key: 'advanced',
                      title: 'Advanced Resources',
                      resources: groupedResources.advanced,
                    },
                  ]}
                >
                  {section => (
                    <Show when={section.resources.length > 0}>
                      <div class={styles.resourcesSection}>
                        <div
                          class={styles.sectionHeader}
                          onClick={() => toggleSection(section.key)}
                        >
                          <h3 class={styles.sectionTitle}>{section.title}</h3>
                          <span class={styles.resourceCount}>
                            ({section.resources.length} resources)
                          </span>
                          <button class={styles.expandButton}>
                            {expandedSections().has(section.key) ? '▼' : '▶'}
                          </button>
                        </div>

                        <Show when={expandedSections().has(section.key)}>
                          <div class={styles.resourcesList}>
                            <For each={section.resources}>
                              {resource => {
                                const isCompleted = props.userProgress?.[resource.id] || false;

                                return (
                                  <div
                                    class={`${styles.resourceCard} ${isCompleted ? styles.completed : ''}`}
                                  >
                                    <div class={styles.resourceHeader}>
                                      <h4 class={styles.resourceTitle}>{resource.title}</h4>
                                      <div class={styles.resourceMeta}>
                                        <span class={styles.resourceType}>{resource.type}</span>
                                        <span class={styles.resourceDuration}>
                                          {resource.duration}min
                                        </span>
                                        <span class={styles.resourceLanguage}>
                                          {resource.language}
                                        </span>
                                      </div>
                                    </div>

                                    <p class={styles.resourceDescription}>{resource.description}</p>

                                    <div class={styles.culturalContext}>
                                      <strong>Cultural Context:</strong> {resource.culturalContext}
                                    </div>

                                    <div class={styles.resourceActions}>
                                      <button
                                        class={styles.accessButton}
                                        onClick={() => handleResourceAccess(resource)}
                                      >
                                        Access Resource
                                      </button>

                                      {showProgress() && (
                                        <button
                                          class={`${styles.progressButton} ${isCompleted ? styles.completed : ''}`}
                                          onClick={() =>
                                            props.onProgressUpdate?.(resource.id, !isCompleted)
                                          }
                                        >
                                          {isCompleted ? '✓ Completed' : 'Mark Complete'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              }}
                            </For>
                          </div>
                        </Show>
                      </div>
                    </Show>
                  )}
                </For>
              </div>
            </div>
          );
        }}
      </Show>
    </div>
  );
};

export default CulturalLearningPath;
