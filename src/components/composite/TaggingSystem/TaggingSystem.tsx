import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { Button, Input, Card } from '../../foundation';
import { X, Search, Hash, TrendingUp, Users, Star, Globe, Info } from 'lucide-solid';
import type { CulturalSensitivityLevel } from '../../../types/Cultural';
import styles from './TaggingSystem.module.css';

/**
 * Tag Interface
 */
export interface TagData {
  id: string;
  name: string;
  description?: string;
  category:
    | 'general'
    | 'subject'
    | 'format'
    | 'language'
    | 'cultural'
    | 'geographical'
    | 'temporal'
    | 'academic'
    | 'community';
  usageCount: number;
  culturalContext?: {
    sensitivityLevel: CulturalSensitivityLevel;
    culturalOrigin?: string;
    culturalSignificance?: string;
  };
  createdAt: Date;
  lastUsed: Date;
  suggested: boolean;
  verified: boolean;
}

/**
 * Tagging System Props
 */
export interface TaggingSystemProps {
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  allowTagCreation?: boolean;
  showCulturalContext?: boolean;
  maxTags?: number;
  placeholder?: string;
  compact?: boolean;
  readonly?: boolean;
}

/**
 * Tagging System Component for Milestone 2.3
 * Cultural information is displayed for educational purposes only - never restricts tagging.
 */
const TaggingSystem: Component<TaggingSystemProps> = props => {
  const [searchQuery, setSearchQuery] = createSignal('');
  const [showSuggestions, setShowSuggestions] = createSignal(false);
  const [selectedTags, setSelectedTags] = createSignal<string[]>(props.selectedTags || []);

  // Mock tags data
  const [availableTags] = createSignal<TagData[]>([
    {
      id: 'tag1',
      name: 'Indigenous Knowledge',
      description: 'Traditional knowledge systems and practices',
      category: 'cultural',
      usageCount: 127,
      culturalContext: {
        sensitivityLevel: 3 as CulturalSensitivityLevel,
        culturalOrigin: 'Various Indigenous Communities',
        culturalSignificance: 'Sacred and traditional knowledge requiring respect',
      },
      createdAt: new Date('2024-01-15'),
      lastUsed: new Date('2024-06-18'),
      suggested: false,
      verified: true,
    },
    {
      id: 'tag2',
      name: 'PDF',
      description: 'Portable Document Format files',
      category: 'format',
      usageCount: 342,
      createdAt: new Date('2024-01-01'),
      lastUsed: new Date('2024-06-20'),
      suggested: false,
      verified: true,
    },
    {
      id: 'tag3',
      name: 'Research',
      description: 'Academic and scientific research materials',
      category: 'academic',
      usageCount: 198,
      createdAt: new Date('2024-01-08'),
      lastUsed: new Date('2024-06-19'),
      suggested: true,
      verified: true,
    },
  ]);

  createEffect(() => {
    if (props.selectedTags) {
      setSelectedTags(props.selectedTags);
    }
  });

  const filteredTags = () => {
    let tags = availableTags();
    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      tags = tags.filter(
        tag =>
          tag.name.toLowerCase().includes(query) ||
          (tag.description && tag.description.toLowerCase().includes(query))
      );
    }
    return tags.sort((a, b) => b.usageCount - a.usageCount);
  };

  const suggestedTags = () => {
    return availableTags()
      .filter(tag => tag.suggested && !selectedTags().includes(tag.id))
      .slice(0, 5);
  };

  const toggleTag = (tagId: string) => {
    const current = selectedTags();
    const newTags = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId];

    if (props.maxTags && newTags.length > props.maxTags) {
      return;
    }

    setSelectedTags(newTags);
    props.onTagsChange?.(newTags);
  };

  const getSensitivityColor = (level: CulturalSensitivityLevel) => {
    switch (level) {
      case 1:
        return 'var(--color-success, #10b981)';
      case 2:
        return 'var(--color-info, #3b82f6)';
      case 3:
        return 'var(--color-warning, #f59e0b)';
      case 4:
        return 'var(--color-danger, #ef4444)';
      case 5:
        return 'var(--color-sacred, #8b5cf6)';
      default:
        return 'var(--color-info, #3b82f6)';
    }
  };

  const getSensitivityName = (level: CulturalSensitivityLevel) => {
    switch (level) {
      case 1:
        return 'Public';
      case 2:
        return 'Educational';
      case 3:
        return 'Traditional';
      case 4:
        return 'Guardian';
      case 5:
        return 'Sacred';
      default:
        return 'Unknown';
    }
  };

  return (
    <div class={`${styles.taggingSystem} ${props.compact ? styles.compact : ''}`}>
      {/* Selected Tags */}
      <Show when={selectedTags().length > 0}>
        <div class={styles.selectedTags}>
          <div class={styles.selectedTagsHeader}>
            <span class={styles.selectedTagsLabel}>
              Selected Tags ({selectedTags().length}
              {props.maxTags ? `/${props.maxTags}` : ''})
            </span>
          </div>
          <div class={styles.selectedTagsList}>
            <For each={selectedTags()}>
              {tagId => {
                const tag = availableTags().find(t => t.id === tagId);
                if (!tag) return null;

                return (
                  <div class={styles.selectedTag}>
                    <span class={styles.selectedTagName}>{tag.name}</span>
                    <Show when={props.showCulturalContext && tag.culturalContext}>
                      <span
                        class={styles.culturalIndicator}
                        style={{
                          'background-color': getSensitivityColor(
                            tag.culturalContext!.sensitivityLevel
                          ),
                        }}
                        title={`Cultural Level: ${getSensitivityName(tag.culturalContext!.sensitivityLevel)}`}
                      >
                        {getSensitivityName(tag.culturalContext!.sensitivityLevel)}
                      </span>
                    </Show>
                    <Show when={!props.readonly}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTag(tagId)}
                        class={styles.removeTagButton}
                      >
                        <X size={14} />
                      </Button>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>

      {/* Tag Input */}
      <Show when={!props.readonly}>
        <div class={styles.tagInput}>
          <div class={styles.searchContainer}>
            <Search class={styles.searchIcon} size={16} />
            <Input
              type="text"
              placeholder={props.placeholder || 'Search tags or create new...'}
              value={searchQuery()}
              onInput={setSearchQuery}
              onFocus={() => setShowSuggestions(true)}
              class={styles.searchInput}
            />
          </div>
        </div>
      </Show>

      {/* Suggested Tags */}
      <Show when={suggestedTags().length > 0 && !props.readonly}>
        <div class={styles.suggestedTags}>
          <div class={styles.suggestedTagsHeader}>
            <TrendingUp size={16} />
            <span>Suggested Tags</span>
          </div>
          <div class={styles.suggestedTagsList}>
            <For each={suggestedTags()}>
              {tag => (
                <button
                  type="button"
                  class={styles.suggestedTag}
                  onClick={() => toggleTag(tag.id)}
                  title={tag.description}
                >
                  <Hash size={12} />
                  <span>{tag.name}</span>
                  <span class={styles.tagUsage}>{tag.usageCount}</span>
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Available Tags Browser */}
      <Show when={showSuggestions() || searchQuery()}>
        <Card class={styles.tagsBrowser}>
          <div class={styles.tagsBrowserHeader}>
            <span class={styles.tagsBrowserTitle}>Available Tags ({filteredTags().length})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSuggestions(false);
                setSearchQuery('');
              }}
            >
              <X size={16} />
            </Button>
          </div>

          <div class={styles.tagsList}>
            <For each={filteredTags()}>
              {tag => (
                <div
                  class={`${styles.tagItem} ${selectedTags().includes(tag.id) ? styles.selected : ''}`}
                  onClick={() => !props.readonly && toggleTag(tag.id)}
                >
                  <div class={styles.tagItemContent}>
                    <div class={styles.tagItemHeader}>
                      <span class={styles.tagItemName}>{tag.name}</span>
                      <div class={styles.tagItemMeta}>
                        <span class={styles.tagCategory}>{tag.category}</span>
                        <span class={styles.tagUsage}>
                          <Users size={12} />
                          {tag.usageCount}
                        </span>
                        <Show when={tag.verified}>
                          <span class={styles.tagVerified}>
                            <Star size={12} />
                          </span>
                        </Show>
                      </div>
                    </div>

                    <Show when={tag.description}>
                      <p class={styles.tagDescription}>{tag.description}</p>
                    </Show>

                    {/* Cultural Context Display (EDUCATIONAL ONLY) */}
                    <Show when={props.showCulturalContext && tag.culturalContext}>
                      <div class={styles.culturalContext}>
                        <div class={styles.culturalHeader}>
                          <span
                            class={styles.culturalBadge}
                            style={{
                              'background-color': getSensitivityColor(
                                tag.culturalContext!.sensitivityLevel
                              ),
                            }}
                          >
                            {getSensitivityName(tag.culturalContext!.sensitivityLevel)}
                          </span>
                          <Show when={tag.culturalContext!.culturalOrigin}>
                            <span class={styles.culturalOrigin}>
                              <Globe size={12} />
                              {tag.culturalContext!.culturalOrigin}
                            </span>
                          </Show>
                        </div>
                        <Show when={tag.culturalContext!.culturalSignificance}>
                          <div class={styles.culturalNote}>
                            <Info size={12} />
                            <span>{tag.culturalContext!.culturalSignificance}</span>
                          </div>
                        </Show>
                      </div>
                    </Show>
                  </div>

                  <Show when={selectedTags().includes(tag.id)}>
                    <div class={styles.selectedIndicator}>✓</div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Card>
      </Show>

      {/* Anti-Censorship Notice */}
      <Show when={props.showCulturalContext}>
        <div class={styles.culturalNotice}>
          <Info size={14} />
          <span>
            Cultural information is provided for educational understanding. All tags remain
            accessible for organizational purposes.
          </span>
        </div>
      </Show>
    </div>
  );
};

export default TaggingSystem;
