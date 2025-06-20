import { Component, JSX, createSignal, Show, For } from 'solid-js';
import { Button, Card } from '../../foundation';
import {
  Download,
  Heart,
  Trash2,
  Archive,
  Share,
  Tag,
  FolderPlus,
  CheckSquare,
  Square,
  X,
  Info,
  AlertTriangle,
} from 'lucide-solid';
import styles from './BatchActionsToolbar.module.css';

/**
 * Batch Action Types
 */
export type BatchActionType =
  | 'download'
  | 'favorite'
  | 'unfavorite'
  | 'delete'
  | 'archive'
  | 'share'
  | 'add-tags'
  | 'remove-tags'
  | 'move-to-collection'
  | 'cultural-context-review';

/**
 * Batch Operation Result
 */
export interface BatchOperationResult {
  success: boolean;
  processedCount: number;
  totalCount: number;
  errors: string[];
  skippedItems: Array<{
    id: string;
    reason: string;
  }>;
}

/**
 * Document for Batch Operations
 */
export interface BatchDocument {
  id: string;
  title: string;
  format: string;
  size: number;
  culturalContext?: {
    sensitivityLevel: number;
    culturalOrigin: string;
    educationalContext: string;
    informationOnly: true; // MANDATORY: Cultural info is educational only
    educationalPurpose: true;
  };
  securityValidated: boolean;
  isDownloaded: boolean;
  isFavorite: boolean;
}

/**
 * Batch Actions Toolbar Props Interface
 * Follows SOLID principles with cultural theme support and anti-censorship compliance
 */
export interface BatchActionsToolbarProps {
  // Core Properties
  selectedDocuments: BatchDocument[];
  isVisible: boolean;
  isProcessing?: boolean;

  // Cultural Context Properties (INFORMATION ONLY - NO ACCESS CONTROL)
  culturalTheme?: 'indigenous' | 'traditional' | 'modern' | 'ceremonial' | 'community' | 'default';
  showCulturalWarnings?: boolean; // Educational warnings only
  enableCulturalContextReview?: boolean; // For educational purposes

  // Available Actions Configuration
  enableDownload?: boolean;
  enableFavorites?: boolean;
  enableDelete?: boolean;
  enableArchive?: boolean;
  enableSharing?: boolean;
  enableTagging?: boolean;
  enableCollectionManagement?: boolean;

  // Event Handlers
  onBatchAction?: (
    action: BatchActionType,
    documents: BatchDocument[]
  ) => Promise<BatchOperationResult>;
  onClearSelection?: () => void;
  onSelectAll?: () => void;
  onCulturalContextReview?: (documents: BatchDocument[]) => void;

  // Accessibility
  ariaLabel?: string;
  class?: string;
}

/**
 * Batch Actions Toolbar Component
 *
 * Handles bulk operations on selected documents with cultural context awareness.
 * Cultural information is provided for educational purposes only - never restricts operations.
 * All batch actions respect user choice while providing educational context.
 *
 * @example
 * ```tsx
 * <BatchActionsToolbar
 *   selectedDocuments={selectedDocs}
 *   isVisible={true}
 *   culturalTheme="indigenous"
 *   showCulturalWarnings={true}
 *   onBatchAction={handleBatchAction}
 * />
 * ```
 */
const BatchActionsToolbar: Component<BatchActionsToolbarProps> = props => {
  // Component state
  const [expandedActions, setExpandedActions] = createSignal(false);
  const [operationResults, setOperationResults] = createSignal<BatchOperationResult | null>(null);
  const [showCulturalInfo, setShowCulturalInfo] = createSignal(false);

  /**
   * Get cultural statistics for educational display
   */
  const getCulturalStats = () => {
    const stats = {
      total: props.selectedDocuments.length,
      withCulturalContext: 0,
      sensitivityLevels: { 1: 0, 2: 0, 3: 0 },
      culturalOrigins: new Set<string>(),
    };

    props.selectedDocuments.forEach(doc => {
      if (doc.culturalContext) {
        stats.withCulturalContext++;
        stats.sensitivityLevels[
          doc.culturalContext.sensitivityLevel as keyof typeof stats.sensitivityLevels
        ]++;
        stats.culturalOrigins.add(doc.culturalContext.culturalOrigin);
      }
    });

    return stats;
  };

  /**
   * Execute batch action with cultural awareness
   */
  const handleBatchAction = async (action: BatchActionType) => {
    if (!props.onBatchAction || props.selectedDocuments.length === 0) return;

    // Show cultural information for educational purposes (NOT FOR BLOCKING)
    if (props.showCulturalWarnings && getCulturalStats().withCulturalContext > 0) {
      setShowCulturalInfo(true);
      // Note: This is informational - does NOT block the action
    }

    try {
      const result = await props.onBatchAction(action, props.selectedDocuments);
      setOperationResults(result);

      // Auto-hide results after success
      if (result.success && result.errors.length === 0) {
        setTimeout(() => setOperationResults(null), 3000);
      }
    } catch (error) {
      console.error('Batch action failed:', error);
      setOperationResults({
        success: false,
        processedCount: 0,
        totalCount: props.selectedDocuments.length,
        errors: ['Batch operation failed'],
        skippedItems: [],
      });
    }
  };

  /**
   * Get action button configuration
   */
  const getActionButtons = () => {
    const buttons = [];

    if (props.enableDownload) {
      buttons.push({
        action: 'download' as BatchActionType,
        icon: <Download size={16} />,
        label: 'Download',
        variant: 'primary' as const,
        disabled: props.selectedDocuments.some(doc => !doc.isDownloaded),
      });
    }

    if (props.enableFavorites) {
      const allFavorited = props.selectedDocuments.every(doc => doc.isFavorite);
      buttons.push({
        action: (allFavorited ? 'unfavorite' : 'favorite') as BatchActionType,
        icon: <Heart size={16} />,
        label: allFavorited ? 'Remove from Favorites' : 'Add to Favorites',
        variant: 'secondary' as const,
        disabled: false,
      });
    }

    if (props.enableSharing) {
      buttons.push({
        action: 'share' as BatchActionType,
        icon: <Share size={16} />,
        label: 'Share',
        variant: 'secondary' as const,
        disabled: false,
      });
    }

    if (props.enableTagging) {
      buttons.push({
        action: 'add-tags' as BatchActionType,
        icon: <Tag size={16} />,
        label: 'Add Tags',
        variant: 'secondary' as const,
        disabled: false,
      });
    }

    if (props.enableCollectionManagement) {
      buttons.push({
        action: 'move-to-collection' as BatchActionType,
        icon: <FolderPlus size={16} />,
        label: 'Add to Collection',
        variant: 'secondary' as const,
        disabled: false,
      });
    }

    if (props.enableArchive) {
      buttons.push({
        action: 'archive' as BatchActionType,
        icon: <Archive size={16} />,
        label: 'Archive',
        variant: 'secondary' as const,
        disabled: false,
      });
    }

    if (props.enableDelete) {
      buttons.push({
        action: 'delete' as BatchActionType,
        icon: <Trash2 size={16} />,
        label: 'Delete',
        variant: 'danger' as const,
        disabled: false,
      });
    }

    return buttons;
  };

  const selectedCount = () => props.selectedDocuments.length;
  const culturalStats = () => getCulturalStats();
  const actionButtons = () => getActionButtons();

  return (
    <Show when={props.isVisible && selectedCount() > 0}>
      <div
        class={`${styles.batchToolbar} ${props.class || ''}`}
        data-cultural-theme={props.culturalTheme}
      >
        <Card class={styles.toolbarCard} variant="elevated">
          <div class={styles.toolbarContent}>
            {/* Selection Summary */}
            <div class={styles.selectionSummary}>
              <div class={styles.selectionCount}>
                <CheckSquare size={16} />
                <span class={styles.countText}>
                  {selectedCount()} item{selectedCount() !== 1 ? 's' : ''} selected
                </span>
              </div>

              {/* Cultural Information Display (EDUCATIONAL ONLY) */}
              <Show when={props.showCulturalWarnings && culturalStats().withCulturalContext > 0}>
                <div class={styles.culturalIndicator}>
                  <Info size={14} />
                  <span class={styles.culturalText}>
                    {culturalStats().withCulturalContext} with cultural context
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCulturalInfo(prev => !prev)}
                    ariaLabel="View cultural information"
                    class={styles.infoButton}
                  >
                    <Info size={12} />
                  </Button>
                </div>
              </Show>

              <div class={styles.selectionActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={props.onSelectAll}
                  ariaLabel="Select all documents"
                >
                  <Square size={16} />
                  Select All
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={props.onClearSelection}
                  ariaLabel="Clear selection"
                >
                  <X size={16} />
                  Clear
                </Button>
              </div>
            </div>

            {/* Primary Actions */}
            <div class={styles.primaryActions}>
              <For each={actionButtons().slice(0, expandedActions() ? actionButtons().length : 3)}>
                {button => (
                  <Button
                    variant={button.variant}
                    size="sm"
                    onClick={() => handleBatchAction(button.action)}
                    disabled={button.disabled || props.isProcessing}
                    ariaLabel={`${button.label} ${selectedCount()} selected items`}
                    class={styles.actionButton}
                  >
                    {button.icon}
                    {button.label}
                  </Button>
                )}
              </For>

              {/* More Actions Toggle */}
              <Show when={actionButtons().length > 3}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedActions(prev => !prev)}
                  ariaLabel={expandedActions() ? 'Show fewer actions' : 'Show more actions'}
                  class={styles.expandButton}
                >
                  {expandedActions() ? 'Less' : 'More'}
                </Button>
              </Show>
            </div>

            {/* Cultural Context Review (EDUCATIONAL ONLY) */}
            <Show
              when={props.enableCulturalContextReview && culturalStats().withCulturalContext > 0}
            >
              <div class={styles.culturalActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => props.onCulturalContextReview?.(props.selectedDocuments)}
                  ariaLabel="Review cultural context for educational purposes"
                  class={styles.culturalButton}
                >
                  <Info size={16} />
                  Cultural Context Review
                </Button>
              </div>
            </Show>
          </div>

          {/* Cultural Information Panel (EDUCATIONAL ONLY) */}
          <Show when={showCulturalInfo()}>
            <div class={styles.culturalInfoPanel}>
              <div class={styles.culturalHeader}>
                <h4 class={styles.culturalTitle}>Cultural Context Information</h4>
                <span class={styles.educationalLabel}>Educational Purpose Only</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCulturalInfo(false)}
                  ariaLabel="Close cultural information"
                >
                  <X size={14} />
                </Button>
              </div>

              <div class={styles.culturalStats}>
                <div class={styles.statItem}>
                  <strong>Documents with cultural context:</strong>{' '}
                  {culturalStats().withCulturalContext} of {culturalStats().total}
                </div>

                <div class={styles.sensitivityBreakdown}>
                  <strong>Sensitivity levels:</strong>
                  <ul class={styles.sensitivityList}>
                    <li>General Context: {culturalStats().sensitivityLevels[1]} documents</li>
                    <li>Traditional Knowledge: {culturalStats().sensitivityLevels[2]} documents</li>
                    <li>Sacred Content: {culturalStats().sensitivityLevels[3]} documents</li>
                  </ul>
                </div>

                <Show when={culturalStats().culturalOrigins.size > 0}>
                  <div class={styles.originsBreakdown}>
                    <strong>Cultural origins represented:</strong>
                    <div class={styles.originsList}>
                      <For each={Array.from(culturalStats().culturalOrigins)}>
                        {origin => <span class={styles.originTag}>{origin}</span>}
                      </For>
                    </div>
                  </div>
                </Show>

                <div class={styles.culturalNote}>
                  <Info size={14} />
                  <span>
                    This information is provided for educational understanding. All operations
                    remain available with appropriate cultural awareness and respect for community
                    sovereignty.
                  </span>
                </div>
              </div>
            </div>
          </Show>

          {/* Operation Results */}
          <Show when={operationResults()}>
            <div
              class={`${styles.resultsPanel} ${
                operationResults()?.success ? styles.success : styles.error
              }`}
            >
              <div class={styles.resultsHeader}>
                {operationResults()?.success ? (
                  <CheckSquare size={16} class={styles.successIcon} />
                ) : (
                  <AlertTriangle size={16} class={styles.errorIcon} />
                )}
                <span class={styles.resultsTitle}>
                  {operationResults()?.success ? 'Operation Completed' : 'Operation Failed'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOperationResults(null)}
                  ariaLabel="Close results"
                >
                  <X size={14} />
                </Button>
              </div>

              <div class={styles.resultsContent}>
                <p>
                  Processed {operationResults()?.processedCount} of {operationResults()?.totalCount}{' '}
                  items
                </p>

                <Show when={operationResults()?.errors.length}>
                  <div class={styles.errorsList}>
                    <strong>Errors:</strong>
                    <ul>
                      <For each={operationResults()?.errors}>{error => <li>{error}</li>}</For>
                    </ul>
                  </div>
                </Show>

                <Show when={operationResults()?.skippedItems.length}>
                  <div class={styles.skippedList}>
                    <strong>Skipped items:</strong>
                    <ul>
                      <For each={operationResults()?.skippedItems}>
                        {item => (
                          <li>
                            {item.id}: {item.reason}
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          {/* Anti-Censorship Notice */}
          <div class={styles.antiCensorshipNotice}>
            <Info size={12} />
            <span>
              Cultural information enhances understanding but never restricts operations. User
              choice and community sovereignty are always respected.
            </span>
          </div>
        </Card>
      </div>
    </Show>
  );
};

export default BatchActionsToolbar;
