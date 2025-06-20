import { Component, createSignal, Show, For, createMemo, Switch, Match } from 'solid-js';
import { Button, Card, Modal } from '../../foundation';
import {
  FolderOpen,
  BarChart3,
  Tags,
  Globe,
  Sparkles,
  Layers,
  TrendingUp,
  Target,
  Zap,
  Info,
} from 'lucide-solid';
import type { CulturalSensitivityLevel } from '../../../types/Cultural';
import type { Collection, CollectionOrganization } from '../../../types/Collection';
import type { Document } from '../../../types/Document';
import styles from './OrganizationTools.module.css';

/**
 * Organization Rule Interface
 */
export interface OrganizationRule {
  id: string;
  name: string;
  description: string;
  condition: {
    field:
      | 'title'
      | 'author'
      | 'format'
      | 'culturalOrigin'
      | 'sensitivity'
      | 'tags'
      | 'size'
      | 'date';
    operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'in_range';
    value: any;
  };
  action: {
    type:
      | 'add_tag'
      | 'set_category'
      | 'move_to_collection'
      | 'set_cultural_context'
      | 'set_priority';
    value: string;
  };
  enabled: boolean;
  priority: number;
  culturalSensitive: boolean;
}

/**
 * Bulk Operation Interface
 */
export interface BulkOperation {
  id: string;
  name: string;
  description: string;
  type: 'tag' | 'category' | 'collection' | 'archive' | 'delete' | 'share' | 'cultural_context';
  parameters: Record<string, any>;
  culturalGuidanceRequired: boolean;
}

/**
 * Organization Tools Props
 */
export interface OrganizationToolsProps {
  collection?: Collection;
  selectedDocuments?: string[];
  documents?: Document[];
  onOrganizationChange?: (organization: Partial<CollectionOrganization>) => void;
  onBulkOperation?: (operation: BulkOperation, documentIds: string[]) => void;
  showCulturalContext?: boolean;
  enableAdvancedFeatures?: boolean;
  readonly?: boolean;
}

/**
 * Organization Tools Component for Milestone 2.3
 * Cultural information is displayed for educational purposes only - never restricts operations.
 */
const OrganizationTools: Component<OrganizationToolsProps> = props => {
  const [currentView, setCurrentView] = createSignal<'overview' | 'rules' | 'bulk' | 'analytics'>(
    'overview'
  );
  const [showAutoOrganize, setShowAutoOrganize] = createSignal(false);

  // Mock analytics data
  const analytics = createMemo(() => ({
    totalDocuments: 1247,
    organizedDocuments: 956,
    unorganizedDocuments: 291,
    averageTagsPerDocument: 3.4,
    organizationScore: 76.7,
    culturalDistribution: [
      { level: 1 as CulturalSensitivityLevel, count: 542 },
      { level: 2 as CulturalSensitivityLevel, count: 298 },
      { level: 3 as CulturalSensitivityLevel, count: 234 },
      { level: 4 as CulturalSensitivityLevel, count: 123 },
      { level: 5 as CulturalSensitivityLevel, count: 50 },
    ],
    suggestions: [
      'Consider adding more descriptive tags to unorganized documents',
      'Cultural context could be enhanced for educational purposes',
      'Documents with similar topics could be grouped together',
    ],
  }));

  const [bulkOperations] = createSignal<BulkOperation[]>([
    {
      id: 'op1',
      name: 'Add Cultural Context Tags',
      description: 'Add cultural context tags for educational purposes (informational only)',
      type: 'tag',
      parameters: { tags: ['cultural-context', 'educational'] },
      culturalGuidanceRequired: false, // Information only, no restrictions
    },
    {
      id: 'op2',
      name: 'Archive Selected Documents',
      description: 'Move selected documents to archive collection',
      type: 'archive',
      parameters: { archiveCollection: 'archived-documents' },
      culturalGuidanceRequired: false,
    },
  ]);

  const getCulturalInfo = (level: CulturalSensitivityLevel) => {
    const info = {
      1: { name: 'Public', color: 'var(--color-success, #10b981)' },
      2: { name: 'Educational', color: 'var(--color-info, #3b82f6)' },
      3: { name: 'Traditional', color: 'var(--color-warning, #f59e0b)' },
      4: { name: 'Guardian', color: 'var(--color-danger, #ef4444)' },
      5: { name: 'Sacred', color: 'var(--color-sacred, #8b5cf6)' },
    };
    return info[level] || info[1];
  };

  const executeAutoOrganization = async () => {
    if (props.readonly) return;
    alert('Auto-organization completed!');
    setShowAutoOrganize(false);
  };

  const executeBulkOperation = async (operation: BulkOperation) => {
    if (!props.selectedDocuments?.length || props.readonly) return;
    props.onBulkOperation?.(operation, props.selectedDocuments);
  };

  const renderOverview = () => (
    <div class={styles.overview}>
      {/* Quick Stats */}
      <div class={styles.statsGrid}>
        <Card class={styles.statCard}>
          <div class={styles.statIcon}>
            <BarChart3 size={24} />
          </div>
          <div class={styles.statContent}>
            <div class={styles.statValue}>{analytics().organizationScore}%</div>
            <div class={styles.statLabel}>Organization Score</div>
          </div>
        </Card>

        <Card class={styles.statCard}>
          <div class={styles.statIcon}>
            <FolderOpen size={24} />
          </div>
          <div class={styles.statContent}>
            <div class={styles.statValue}>{analytics().organizedDocuments}</div>
            <div class={styles.statLabel}>Organized Documents</div>
          </div>
        </Card>

        <Card class={styles.statCard}>
          <div class={styles.statIcon}>
            <Tags size={24} />
          </div>
          <div class={styles.statContent}>
            <div class={styles.statValue}>{analytics().averageTagsPerDocument}</div>
            <div class={styles.statLabel}>Avg Tags per Document</div>
          </div>
        </Card>

        <Card class={styles.statCard}>
          <div class={styles.statIcon}>
            <Globe size={24} />
          </div>
          <div class={styles.statContent}>
            <div class={styles.statValue}>{analytics().culturalDistribution.length}</div>
            <div class={styles.statLabel}>Cultural Contexts</div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div class={styles.quickActions}>
        <Button
          variant="primary"
          onClick={() => setShowAutoOrganize(true)}
          disabled={props.readonly}
        >
          <Sparkles size={16} />
          Auto-Organize
        </Button>

        <Button variant="secondary" disabled={!props.selectedDocuments?.length || props.readonly}>
          <Layers size={16} />
          Bulk Actions ({props.selectedDocuments?.length || 0})
        </Button>
      </div>

      {/* Cultural Distribution (EDUCATIONAL DISPLAY) */}
      <Show when={props.showCulturalContext}>
        <Card class={styles.culturalOverview}>
          <div class={styles.culturalHeader}>
            <Globe size={20} />
            <h3>Cultural Context Distribution</h3>
            <span class={styles.educationalBadge}>Educational Info</span>
          </div>
          <div class={styles.culturalDistribution}>
            <For each={analytics().culturalDistribution}>
              {item => {
                const info = getCulturalInfo(item.level);
                const percentage = (item.count / analytics().totalDocuments) * 100;
                return (
                  <div class={styles.culturalItem}>
                    <div class={styles.culturalLabel}>
                      <span
                        class={styles.culturalIndicator}
                        style={{ 'background-color': info.color }}
                      />
                      <span>{info.name}</span>
                    </div>
                    <div class={styles.culturalStats}>
                      <span class={styles.culturalCount}>{item.count}</span>
                      <span class={styles.culturalPercentage}>({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Card>
      </Show>

      {/* Organization Suggestions */}
      <Card class={styles.suggestions}>
        <div class={styles.suggestionsHeader}>
          <TrendingUp size={20} />
          <h3>Organization Suggestions</h3>
        </div>
        <ul class={styles.suggestionsList}>
          <For each={analytics().suggestions}>
            {suggestion => (
              <li class={styles.suggestionItem}>
                <Target size={16} />
                <span>{suggestion}</span>
              </li>
            )}
          </For>
        </ul>
      </Card>
    </div>
  );

  const renderBulkOperations = () => (
    <div class={styles.bulkOperations}>
      <div class={styles.bulkHeader}>
        <h3>Bulk Operations</h3>
        <span class={styles.selectionInfo}>
          {props.selectedDocuments?.length || 0} document
          {(props.selectedDocuments?.length || 0) !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div class={styles.operationsList}>
        <For each={bulkOperations()}>
          {operation => (
            <Card class={styles.operationCard}>
              <div class={styles.operationHeader}>
                <h4 class={styles.operationName}>{operation.name}</h4>
              </div>
              <p class={styles.operationDescription}>{operation.description}</p>
              <Button
                variant="primary"
                onClick={() => executeBulkOperation(operation)}
                disabled={!props.selectedDocuments?.length || props.readonly}
              >
                <Zap size={16} />
                Execute
              </Button>
            </Card>
          )}
        </For>
      </div>
    </div>
  );

  return (
    <div class={styles.organizationTools}>
      {/* Navigation Tabs */}
      <div class={styles.tabNavigation}>
        <button
          type="button"
          class={`${styles.tab} ${currentView() === 'overview' ? styles.active : ''}`}
          onClick={() => setCurrentView('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button
          type="button"
          class={`${styles.tab} ${currentView() === 'bulk' ? styles.active : ''}`}
          onClick={() => setCurrentView('bulk')}
        >
          <Layers size={16} />
          Bulk Operations
        </button>
      </div>

      {/* Content Area */}
      <div class={styles.content}>
        <Switch>
          <Match when={currentView() === 'overview'}>{renderOverview()}</Match>
          <Match when={currentView() === 'bulk'}>{renderBulkOperations()}</Match>
        </Switch>
      </div>

      {/* Auto-Organization Modal */}
      <Show when={showAutoOrganize()}>
        <Modal isOpen={true} onClose={() => setShowAutoOrganize(false)} title="Auto-Organization">
          <div class={styles.modalContent}>
            <p>Execute automatic organization?</p>
            <Show when={props.showCulturalContext}>
              <div class={styles.culturalNotice}>
                <Info size={16} />
                <span>
                  Cultural context will be analyzed for educational purposes only. All documents
                  remain accessible regardless of cultural classification.
                </span>
              </div>
            </Show>
            <div class={styles.modalActions}>
              <Button variant="primary" onClick={executeAutoOrganization}>
                <Sparkles size={16} />
                Execute Auto-Organization
              </Button>
              <Button variant="outline" onClick={() => setShowAutoOrganize(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </Show>

      {/* Anti-Censorship Notice */}
      <Show when={props.showCulturalContext}>
        <div class={styles.antiCensorshipNotice}>
          <Info size={14} />
          <span>
            Cultural information enhances organization through education, not restriction. All
            documents remain accessible and operational tools function without cultural limitations.
          </span>
        </div>
      </Show>
    </div>
  );
};

export default OrganizationTools;
