/**
 * Collection Organizer Component
 *
 * Advanced collection organization interface with auto-tagging, relationship management,
 * P2P synchronization, and cultural validation workflows.
 */

import { createSignal, createEffect, For, Show, onMount, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { Collection } from '../../../types/Collection';
import type {
  OrganizationAnalysis,
  TagSuggestion,
  CategorySuggestion,
} from '../../../services/organizationService';
import type {
  RelationshipSuggestion,
  EducationalPathway,
} from '../../../services/relationshipService';
import type { SyncConflict, CulturalValidationRequest } from '../../../services/p2pService';
import { organizationService } from '../../../services/organizationService';
import { relationshipService } from '../../../services/relationshipService';
import { p2pService } from '../../../services/p2pService';
import { Button } from '../../foundation/Button';
import { Modal } from '../../foundation/Modal';
import { TopCard } from '../TopCard';
import styles from './CollectionOrganizer.module.css';

interface CollectionOrganizerProps {
  /** Collection to organize */
  collection: Collection;

  /** Organization mode */
  mode?: 'auto' | 'manual' | 'hybrid';

  /** Show advanced features */
  showAdvanced?: boolean;

  /** Enable P2P features */
  enableP2P?: boolean;

  /** Callback when organization is complete */
  onOrganizationComplete?: (collection: Collection) => void;

  /** Callback when conflicts arise */
  onConflictDetected?: (conflicts: SyncConflict[]) => void;
}

interface OrganizerState {
  // Analysis data
  analysis: OrganizationAnalysis | null;
  tagSuggestions: TagSuggestion[];
  categorySuggestions: CategorySuggestion[];
  relationshipSuggestions: RelationshipSuggestion[];
  educationalPathways: EducationalPathway[];

  // P2P data
  syncConflicts: SyncConflict[];
  validationRequests: CulturalValidationRequest[];

  // UI state
  isAnalyzing: boolean;
  isOrganizing: boolean;
  isSyncing: boolean;
  showTagModal: boolean;
  showRelationshipModal: boolean;
  showConflictModal: boolean;
  showValidationModal: boolean;

  // Selected items
  selectedTags: string[];
  selectedCategories: string[];
  selectedRelationships: string[];

  // Filters and settings
  confidenceThreshold: number;
  culturalValidationRequired: boolean;
  autoApplyEnabled: boolean;
}

export function CollectionOrganizer(props: CollectionOrganizerProps) {
  // State management
  const [state, setState] = createStore<OrganizerState>({
    analysis: null,
    tagSuggestions: [],
    categorySuggestions: [],
    relationshipSuggestions: [],
    educationalPathways: [],
    syncConflicts: [],
    validationRequests: [],
    isAnalyzing: false,
    isOrganizing: false,
    isSyncing: false,
    showTagModal: false,
    showRelationshipModal: false,
    showConflictModal: false,
    showValidationModal: false,
    selectedTags: [],
    selectedCategories: [],
    selectedRelationships: [],
    confidenceThreshold: 0.7,
    culturalValidationRequired: true,
    autoApplyEnabled: false,
  });

  // Reactive signals
  const [organizationProgress, setOrganizationProgress] = createSignal(0);
  const [currentTask, setCurrentTask] = createSignal('');

  // Initialize component
  onMount(async () => {
    await initializeOrganizer();

    // Set up periodic sync if P2P is enabled
    if (props.enableP2P) {
      startPeriodicSync();
    }
  });

  // Cleanup
  onCleanup(() => {
    // Clean up any ongoing processes
  });

  /**
   * Initialize the organizer with analysis
   */
  async function initializeOrganizer() {
    try {
      setState('isAnalyzing', true);
      setCurrentTask('Analyzing collection...');

      // Perform comprehensive analysis
      const analysis = await organizationService.analyzeItem(props.collection.id, 'collection');
      setState('analysis', analysis);
      setState('tagSuggestions', analysis.tagSuggestions);
      setState('categorySuggestions', analysis.categorySuggestions);

      setOrganizationProgress(25);
      setCurrentTask('Discovering relationships...');

      // Get relationship suggestions
      const relationships = await relationshipService.suggestRelationships(props.collection.id);
      setState('relationshipSuggestions', relationships);

      setOrganizationProgress(50);
      setCurrentTask('Generating educational pathways...');

      // Generate educational pathways
      const pathways = await relationshipService.generateEducationalPathways(props.collection.id);
      setState('educationalPathways', pathways);

      setOrganizationProgress(75);

      // Check for P2P conflicts if enabled
      if (props.enableP2P) {
        setCurrentTask('Checking for sync conflicts...');
        const conflicts = await p2pService.getConflicts();
        const collectionConflicts = conflicts.filter(c => c.collectionId === props.collection.id);
        setState('syncConflicts', collectionConflicts);

        // Get validation requests
        const validationRequests = await p2pService.getCulturalValidationRequests();
        const collectionValidations = validationRequests.filter(
          r => r.collectionId === props.collection.id
        );
        setState('validationRequests', collectionValidations);
      }

      setOrganizationProgress(100);
      setCurrentTask('Analysis complete');

      // Auto-apply if enabled and confidence is high
      if (state.autoApplyEnabled && analysis.overallConfidence >= state.confidenceThreshold) {
        await applyAutoOrganization();
      }
    } catch (error) {
      console.error('Failed to initialize organizer:', error);
      setCurrentTask('Analysis failed');
    } finally {
      setState('isAnalyzing', false);
    }
  }

  /**
   * Apply automatic organization
   */
  async function applyAutoOrganization() {
    try {
      setState('isOrganizing', true);
      setCurrentTask('Applying organization...');

      if (state.analysis) {
        await organizationService.applyAutoOrganization(
          props.collection.id,
          'collection',
          state.analysis
        );
      }

      setCurrentTask('Organization applied');
      props.onOrganizationComplete?.(props.collection);
    } catch (error) {
      console.error('Failed to apply auto-organization:', error);
      setCurrentTask('Organization failed');
    } finally {
      setState('isOrganizing', false);
    }
  }

  /**
   * Apply selected suggestions manually
   */
  async function applySelectedSuggestions() {
    try {
      setState('isOrganizing', true);
      setCurrentTask('Applying selected suggestions...');

      // Apply selected tags
      if (state.selectedTags.length > 0) {
        // Implementation would apply tags
        console.log('Applying tags:', state.selectedTags);
      }

      // Apply selected categories
      if (state.selectedCategories.length > 0) {
        // Implementation would apply categories
        console.log('Applying categories:', state.selectedCategories);
      }

      // Create selected relationships
      if (state.selectedRelationships.length > 0) {
        for (const relationshipId of state.selectedRelationships) {
          const suggestion = state.relationshipSuggestions.find(
            r => r.targetCollectionId === relationshipId
          );
          if (suggestion) {
            await relationshipService.createRelationship(
              props.collection.id,
              suggestion.targetCollectionId,
              suggestion.relationshipType
            );
          }
        }
      }

      setCurrentTask('Suggestions applied');
      props.onOrganizationComplete?.(props.collection);
    } catch (error) {
      console.error('Failed to apply suggestions:', error);
      setCurrentTask('Application failed');
    } finally {
      setState('isOrganizing', false);
    }
  }

  /**
   * Sync collection with P2P network
   */
  async function syncWithNetwork() {
    if (!props.enableP2P) return;

    try {
      setState('isSyncing', true);
      setCurrentTask('Syncing with network...');

      await p2pService.syncCollection(props.collection.id);

      // Check for new conflicts
      const conflicts = await p2pService.getConflicts();
      const collectionConflicts = conflicts.filter(c => c.collectionId === props.collection.id);
      setState('syncConflicts', collectionConflicts);

      if (collectionConflicts.length > 0) {
        props.onConflictDetected?.(collectionConflicts);
      }

      setCurrentTask('Sync complete');
    } catch (error) {
      console.error('Failed to sync with network:', error);
      setCurrentTask('Sync failed');
    } finally {
      setState('isSyncing', false);
    }
  }

  /**
   * Start periodic sync
   */
  function startPeriodicSync() {
    // Implementation would set up periodic sync
    console.log('Periodic sync started');
  }

  /**
   * Toggle tag selection
   */
  function toggleTagSelection(tag: string) {
    setState('selectedTags', prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  /**
   * Toggle category selection
   */
  function toggleCategorySelection(category: string) {
    setState('selectedCategories', prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  }

  /**
   * Toggle relationship selection
   */
  function toggleRelationshipSelection(relationshipId: string) {
    setState('selectedRelationships', prev =>
      prev.includes(relationshipId)
        ? prev.filter(r => r !== relationshipId)
        : [...prev, relationshipId]
    );
  }

  return (
    <div class={styles.organizer}>
      {/* Header */}
      <div class={styles.header}>
        <h2 class={styles.title}>Collection Organizer</h2>
        <div class={styles.headerActions}>
          <Button
            variant="futuristic"
            color="purple"
            onClick={initializeOrganizer}
            disabled={state.isAnalyzing}
          >
            {state.isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
          </Button>

          <Show when={props.enableP2P}>
            <Button
              variant="futuristic"
              color="blue"
              onClick={syncWithNetwork}
              disabled={state.isSyncing}
            >
              {state.isSyncing ? 'Syncing...' : 'Sync P2P'}
            </Button>
          </Show>
        </div>
      </div>

      {/* Progress Indicator */}
      <Show when={state.isAnalyzing || state.isOrganizing || state.isSyncing}>
        <div class={styles.progressSection}>
          <div class={styles.progressBar}>
            <div class={styles.progressFill} style={{ width: `${organizationProgress()}%` }} />
          </div>
          <p class={styles.progressText}>{currentTask()}</p>
        </div>
      </Show>

      {/* Analysis Overview */}
      <Show when={state.analysis}>
        <div class={styles.analysisOverview}>
          <TopCard
            title="Organization Analysis"
            value={`${Math.round((state.analysis?.overallConfidence || 0) * 100)}%`}
            subtitle="Confidence Score"
            trend="up"
            color="purple"
          />

          <TopCard
            title="Tag Suggestions"
            value={state.tagSuggestions.length.toString()}
            subtitle="Recommendations"
            trend="neutral"
            color="blue"
          />

          <TopCard
            title="Relationships"
            value={state.relationshipSuggestions.length.toString()}
            subtitle="Potential Connections"
            trend="up"
            color="green"
          />

          <Show when={props.enableP2P}>
            <TopCard
              title="Sync Status"
              value={state.syncConflicts.length > 0 ? 'Conflicts' : 'Clean'}
              subtitle="P2P Network"
              trend={state.syncConflicts.length > 0 ? 'down' : 'up'}
              color={state.syncConflicts.length > 0 ? 'red' : 'green'}
            />
          </Show>
        </div>
      </Show>

      {/* Organization Controls */}
      <div class={styles.controls}>
        <div class={styles.controlGroup}>
          <label class={styles.controlLabel}>
            <input
              type="checkbox"
              checked={state.autoApplyEnabled}
              onChange={e => setState('autoApplyEnabled', e.target.checked)}
            />
            Auto-apply high-confidence suggestions
          </label>
        </div>

        <div class={styles.controlGroup}>
          <label class={styles.controlLabel}>
            Confidence Threshold: {Math.round(state.confidenceThreshold * 100)}%
          </label>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={state.confidenceThreshold}
            onChange={e => setState('confidenceThreshold', parseFloat(e.target.value))}
            class={styles.slider}
          />
        </div>

        <div class={styles.controlGroup}>
          <label class={styles.controlLabel}>
            <input
              type="checkbox"
              checked={state.culturalValidationRequired}
              onChange={e => setState('culturalValidationRequired', e.target.checked)}
            />
            Require cultural validation
          </label>
        </div>
      </div>

      {/* Suggestions Sections */}
      <div class={styles.suggestionsGrid}>
        {/* Tag Suggestions */}
        <div class={styles.suggestionSection}>
          <div class={styles.sectionHeader}>
            <h3>Tag Suggestions</h3>
            <Button
              variant="futuristic"
              color="purple"
              size="small"
              onClick={() => setState('showTagModal', true)}
            >
              View All
            </Button>
          </div>

          <div class={styles.suggestionList}>
            <For each={state.tagSuggestions.slice(0, 5)}>
              {suggestion => (
                <div
                  class={`${styles.suggestionItem} ${state.selectedTags.includes(suggestion.tag) ? styles.selected : ''}`}
                  onClick={() => toggleTagSelection(suggestion.tag)}
                >
                  <div class={styles.suggestionContent}>
                    <span class={styles.suggestionTag}>{suggestion.tag}</span>
                    <span class={styles.suggestionConfidence}>
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                  <div class={styles.suggestionReason}>{suggestion.reason}</div>
                  <Show when={suggestion.traditionalKnowledge}>
                    <div class={styles.culturalBadge}>Traditional Knowledge</div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Category Suggestions */}
        <div class={styles.suggestionSection}>
          <div class={styles.sectionHeader}>
            <h3>Category Suggestions</h3>
          </div>

          <div class={styles.suggestionList}>
            <For each={state.categorySuggestions.slice(0, 5)}>
              {suggestion => (
                <div
                  class={`${styles.suggestionItem} ${state.selectedCategories.includes(suggestion.category) ? styles.selected : ''}`}
                  onClick={() => toggleCategorySelection(suggestion.category)}
                >
                  <div class={styles.suggestionContent}>
                    <span class={styles.suggestionTag}>{suggestion.category}</span>
                    <span class={styles.suggestionConfidence}>
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                  <Show when={suggestion.requiresCommunityValidation}>
                    <div class={styles.validationBadge}>Community Validation Required</div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Relationship Suggestions */}
        <div class={styles.suggestionSection}>
          <div class={styles.sectionHeader}>
            <h3>Relationship Suggestions</h3>
            <Button
              variant="futuristic"
              color="blue"
              size="small"
              onClick={() => setState('showRelationshipModal', true)}
            >
              Manage
            </Button>
          </div>

          <div class={styles.suggestionList}>
            <For each={state.relationshipSuggestions.slice(0, 3)}>
              {suggestion => (
                <div
                  class={`${styles.suggestionItem} ${state.selectedRelationships.includes(suggestion.targetCollectionId) ? styles.selected : ''}`}
                  onClick={() => toggleRelationshipSelection(suggestion.targetCollectionId)}
                >
                  <div class={styles.suggestionContent}>
                    <span class={styles.suggestionTag}>{suggestion.targetCollectionName}</span>
                    <span class={styles.relationshipType}>{suggestion.relationshipType}</span>
                  </div>
                  <div class={styles.suggestionReason}>{suggestion.reason}</div>
                  <Show when={suggestion.requiresCommunityValidation}>
                    <div class={styles.validationBadge}>Community Validation Required</div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div class={styles.actionButtons}>
        <Button
          variant="futuristic"
          color="green"
          onClick={applyAutoOrganization}
          disabled={state.isOrganizing || !state.analysis}
        >
          {state.isOrganizing ? 'Organizing...' : 'Auto-Organize'}
        </Button>

        <Button
          variant="futuristic"
          color="purple"
          onClick={applySelectedSuggestions}
          disabled={
            state.isOrganizing ||
            (state.selectedTags.length === 0 &&
              state.selectedCategories.length === 0 &&
              state.selectedRelationships.length === 0)
          }
        >
          Apply Selected
        </Button>
      </div>

      {/* Conflict Alerts */}
      <Show when={state.syncConflicts.length > 0}>
        <div class={styles.conflictAlert}>
          <h4>Sync Conflicts Detected</h4>
          <p>{state.syncConflicts.length} conflicts require resolution</p>
          <Button
            variant="futuristic"
            color="red"
            size="small"
            onClick={() => setState('showConflictModal', true)}
          >
            Resolve Conflicts
          </Button>
        </div>
      </Show>

      {/* Validation Requests */}
      <Show when={state.validationRequests.length > 0}>
        <div class={styles.validationAlert}>
          <h4>Cultural Validation Requested</h4>
          <p>{state.validationRequests.length} requests pending</p>
          <Button
            variant="futuristic"
            color="orange"
            size="small"
            onClick={() => setState('showValidationModal', true)}
          >
            Review Requests
          </Button>
        </div>
      </Show>

      {/* Modals */}
      <Modal
        isOpen={state.showTagModal}
        onClose={() => setState('showTagModal', false)}
        title="All Tag Suggestions"
      >
        <div class={styles.modalContent}>
          <For each={state.tagSuggestions}>
            {suggestion => (
              <div class={styles.modalSuggestionItem}>
                <div class={styles.suggestionHeader}>
                  <span class={styles.suggestionTag}>{suggestion.tag}</span>
                  <span class={styles.suggestionConfidence}>
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>
                <p class={styles.suggestionReason}>{suggestion.reason}</p>
                <Show when={suggestion.culturalContext}>
                  <p class={styles.culturalContext}>{suggestion.culturalContext}</p>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Modal>

      <Modal
        isOpen={state.showRelationshipModal}
        onClose={() => setState('showRelationshipModal', false)}
        title="Relationship Management"
      >
        <div class={styles.modalContent}>
          <For each={state.relationshipSuggestions}>
            {suggestion => (
              <div class={styles.modalSuggestionItem}>
                <div class={styles.suggestionHeader}>
                  <span class={styles.suggestionTag}>{suggestion.targetCollectionName}</span>
                  <span class={styles.relationshipType}>{suggestion.relationshipType}</span>
                </div>
                <p class={styles.suggestionReason}>{suggestion.reason}</p>
                <div class={styles.educationalBenefits}>
                  <h5>Educational Benefits:</h5>
                  <ul>
                    <For each={suggestion.educationalBenefits}>{benefit => <li>{benefit}</li>}</For>
                  </ul>
                </div>
              </div>
            )}
          </For>
        </div>
      </Modal>
    </div>
  );
}
