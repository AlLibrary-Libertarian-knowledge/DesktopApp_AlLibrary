/**
 * Community Contributions Component
 *
 * Displays community input and contributions for educational purposes.
 * INFORMATION ONLY - NO GATEKEEPING - Community empowerment through information.
 */

import { Component, createSignal, For, Show } from 'solid-js';
import styles from './CommunityContributions.module.css';

export interface CommunityContribution {
  id: string;
  type: 'feedback' | 'correction' | 'addition' | 'context' | 'translation' | 'verification';
  title: string;
  content: string;
  contributor: ContributorInfo;
  targetDocumentId?: string;
  targetDocumentTitle?: string;
  culturalContext: string;
  language: string;
  timestamp: Date;
  supportCount: number;
  responses: ContributionResponse[];
  tags: string[];
  verified: boolean;
  educationalValue: 'high' | 'medium' | 'low';
}

export interface ContributorInfo {
  id: string;
  name: string;
  culturalAffiliation?: string;
  expertise?: string[];
  contributionCount: number;
  reputation: number;
  anonymous: boolean;
}

export interface ContributionResponse {
  id: string;
  content: string;
  contributor: ContributorInfo;
  timestamp: Date;
  supportCount: number;
}

export interface CommunityContributionsProps {
  /** Community contributions to display */
  contributions: CommunityContribution[];
  /** Filter by contribution type */
  filterType?: string;
  /** Filter by cultural context */
  filterCulturalContext?: string;
  /** Show contributor information */
  showContributorInfo?: boolean;
  /** Show educational value indicators */
  showEducationalValue?: boolean;
  /** Cultural theme */
  culturalTheme?: 'indigenous' | 'traditional' | 'ceremonial' | 'default';
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Contribution selection handler */
  onContributionSelect?: (contribution: CommunityContribution) => void;
  /** Support contribution handler */
  onSupportContribution?: (contributionId: string) => void;
  /** Response handler */
  onResponseSubmit?: (contributionId: string, response: string) => void;
}

export const CommunityContributions: Component<CommunityContributionsProps> = props => {
  const [selectedContribution, setSelectedContribution] = createSignal<string | undefined>();
  const [filterType, setFilterType] = createSignal(props.filterType || 'all');
  const [filterCultural, setFilterCultural] = createSignal(props.filterCulturalContext || 'all');
  const [sortBy, setSortBy] = createSignal<'recent' | 'popular' | 'educational'>('recent');

  // Default props
  const showContributorInfo = () => props.showContributorInfo ?? true;
  const showEducationalValue = () => props.showEducationalValue ?? true;
  const culturalTheme = () => props.culturalTheme || 'traditional';

  // Handle contribution selection
  const handleContributionSelect = (contribution: CommunityContribution) => {
    setSelectedContribution(contribution.id);
    props.onContributionSelect?.(contribution);
  };

  // Handle support
  const handleSupport = (contributionId: string) => {
    props.onSupportContribution?.(contributionId);
  };

  // Filter and sort contributions
  const getFilteredContributions = () => {
    let filtered = props.contributions;

    // Filter by type
    if (filterType() !== 'all') {
      filtered = filtered.filter(c => c.type === filterType());
    }

    // Filter by cultural context
    if (filterCultural() !== 'all') {
      filtered = filtered.filter(c => c.culturalContext === filterCultural());
    }

    // Sort
    const sort = sortBy();
    if (sort === 'recent') {
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } else if (sort === 'popular') {
      filtered.sort((a, b) => b.supportCount - a.supportCount);
    } else if (sort === 'educational') {
      const valueOrder = { high: 3, medium: 2, low: 1 };
      filtered.sort((a, b) => valueOrder[b.educationalValue] - valueOrder[a.educationalValue]);
    }

    return filtered;
  };

  // Get unique cultural contexts
  const getCulturalContexts = () => {
    const contexts = new Set(props.contributions.map(c => c.culturalContext));
    return Array.from(contexts).sort();
  };

  // Format contribution type
  const formatContributionType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get educational value indicator
  const getEducationalValueColor = (value: string) => {
    switch (value) {
      case 'high':
        return '#22c55e';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  // Generate CSS classes
  const containerClasses = () =>
    [styles.communityContributions, styles[`theme-${culturalTheme()}`], props.class]
      .filter(Boolean)
      .join(' ');

  const filteredContributions = getFilteredContributions();
  const culturalContexts = getCulturalContexts();

  return (
    <div class={containerClasses()} data-testid={props['data-testid']}>
      {/* Information Notice */}
      <div class={styles.informationNotice}>
        <div class={styles.noticeIcon}>🤝</div>
        <div class={styles.noticeText}>
          <strong>Community Contributions:</strong> Community input is displayed for educational and
          informational purposes. All contributions are shared to enhance collective understanding
          and preserve diverse perspectives. No gatekeeping - information empowers communities.
        </div>
      </div>

      {/* Filters and Controls */}
      <div class={styles.controlsSection}>
        <div class={styles.filtersGroup}>
          <div class={styles.filterGroup}>
            <label class={styles.filterLabel}>Type:</label>
            <select
              class={styles.filterSelect}
              value={filterType()}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="feedback">Feedback</option>
              <option value="correction">Corrections</option>
              <option value="addition">Additions</option>
              <option value="context">Context</option>
              <option value="translation">Translations</option>
              <option value="verification">Verifications</option>
            </select>
          </div>

          <div class={styles.filterGroup}>
            <label class={styles.filterLabel}>Cultural Context:</label>
            <select
              class={styles.filterSelect}
              value={filterCultural()}
              onChange={e => setFilterCultural(e.target.value)}
            >
              <option value="all">All Contexts</option>
              <For each={culturalContexts}>
                {context => <option value={context}>{context}</option>}
              </For>
            </select>
          </div>

          <div class={styles.filterGroup}>
            <label class={styles.filterLabel}>Sort by:</label>
            <select
              class={styles.filterSelect}
              value={sortBy()}
              onChange={e => setSortBy(e.target.value as any)}
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Supported</option>
              <option value="educational">Educational Value</option>
            </select>
          </div>
        </div>

        <div class={styles.statsSection}>
          <div class={styles.stat}>
            <span class={styles.statNumber}>{filteredContributions.length}</span>
            <span class={styles.statLabel}>Contributions</span>
          </div>
          <div class={styles.stat}>
            <span class={styles.statNumber}>{culturalContexts.length}</span>
            <span class={styles.statLabel}>Cultural Contexts</span>
          </div>
        </div>
      </div>

      {/* Contributions List */}
      <div class={styles.contributionsList}>
        <For each={filteredContributions}>
          {contribution => {
            const isSelected = selectedContribution() === contribution.id;

            return (
              <div
                class={`${styles.contributionCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleContributionSelect(contribution)}
              >
                <div class={styles.contributionHeader}>
                  <div class={styles.contributionMeta}>
                    <span
                      class={`${styles.contributionType} ${styles[`type-${contribution.type}`]}`}
                    >
                      {formatContributionType(contribution.type)}
                    </span>

                    {showEducationalValue() && (
                      <span
                        class={styles.educationalValue}
                        style={`color: ${getEducationalValueColor(contribution.educationalValue)}`}
                      >
                        {contribution.educationalValue} educational value
                      </span>
                    )}

                    {contribution.verified && <span class={styles.verifiedBadge}>✓ Verified</span>}
                  </div>

                  <div class={styles.contributionActions}>
                    <button
                      class={styles.supportButton}
                      onClick={e => {
                        e.stopPropagation();
                        handleSupport(contribution.id);
                      }}
                    >
                      👍 {contribution.supportCount}
                    </button>
                  </div>
                </div>

                <h3 class={styles.contributionTitle}>{contribution.title}</h3>
                <p class={styles.contributionContent}>{contribution.content}</p>

                <div class={styles.contributionDetails}>
                  <div class={styles.culturalContext}>
                    <strong>Cultural Context:</strong> {contribution.culturalContext}
                  </div>

                  {contribution.targetDocumentTitle && (
                    <div class={styles.targetDocument}>
                      <strong>Related to:</strong> {contribution.targetDocumentTitle}
                    </div>
                  )}

                  <div class={styles.contributionTags}>
                    <For each={contribution.tags}>
                      {tag => <span class={styles.tag}>{tag}</span>}
                    </For>
                  </div>
                </div>

                {showContributorInfo() && !contribution.contributor.anonymous && (
                  <div class={styles.contributorInfo}>
                    <div class={styles.contributorName}>{contribution.contributor.name}</div>
                    {contribution.contributor.culturalAffiliation && (
                      <div class={styles.culturalAffiliation}>
                        {contribution.contributor.culturalAffiliation}
                      </div>
                    )}
                    <div class={styles.contributorStats}>
                      {contribution.contributor.contributionCount} contributions •
                      {contribution.contributor.reputation} reputation
                    </div>
                  </div>
                )}

                <div class={styles.contributionFooter}>
                  <div class={styles.timestamp}>
                    {contribution.timestamp.toLocaleDateString()} at{' '}
                    {contribution.timestamp.toLocaleTimeString()}
                  </div>
                  <div class={styles.language}>Language: {contribution.language}</div>
                </div>

                {/* Responses */}
                <Show when={contribution.responses.length > 0}>
                  <div class={styles.responsesSection}>
                    <h4 class={styles.responsesTitle}>
                      Community Responses ({contribution.responses.length})
                    </h4>
                    <div class={styles.responsesList}>
                      <For each={contribution.responses.slice(0, 3)}>
                        {response => (
                          <div class={styles.response}>
                            <p class={styles.responseContent}>{response.content}</p>
                            <div class={styles.responseFooter}>
                              {!response.contributor.anonymous && (
                                <span class={styles.responseName}>{response.contributor.name}</span>
                              )}
                              <span class={styles.responseSupport}>👍 {response.supportCount}</span>
                              <span class={styles.responseTime}>
                                {response.timestamp.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </For>

                      {contribution.responses.length > 3 && (
                        <div class={styles.moreResponses}>
                          +{contribution.responses.length - 3} more responses
                        </div>
                      )}
                    </div>
                  </div>
                </Show>
              </div>
            );
          }}
        </For>
      </div>

      {filteredContributions.length === 0 && (
        <div class={styles.emptyState}>
          <div class={styles.emptyIcon}>📝</div>
          <h3 class={styles.emptyTitle}>No contributions found</h3>
          <p class={styles.emptyDescription}>
            Try adjusting your filters or check back later for new community contributions.
          </p>
        </div>
      )}
    </div>
  );
};

export default CommunityContributions;
