/**
 * Cultural Contexts Page
 *
 * Dedicated educational interface for exploring cultural contexts and learning.
 * ANTI-CENSORSHIP: All cultural information is educational only - never restricts access.
 * Provides comprehensive cultural learning experiences with respect and understanding.
 */

import { Component, createSignal, createEffect, For, Show, ErrorBoundary } from 'solid-js';
import { createAsync } from '@solidjs/router';
import {
  culturalApi,
  categoryApi,
  type CulturalContext,
  type CulturalEducationContent,
} from '../../services/api';
import { SearchBar } from '../../components/foundation/SearchBar/SearchBar';
import { FilterPanel } from '../../components/composite/FilterPanel/FilterPanel';
import { LoadingSpinner } from '../../components/foundation/LoadingSpinner/LoadingSpinner';
import { ErrorMessage } from '../../components/foundation/ErrorMessage/ErrorMessage';
import { CulturalContextDisplay } from '../../components/cultural/CulturalContextDisplay/CulturalContextDisplay';
import { TraditionalClassificationView } from '../../components/cultural/TraditionalClassificationView/TraditionalClassificationView';
import { CulturalLearningPath } from '../../components/cultural/CulturalLearningPath/CulturalLearningPath';
import { CommunityContributions } from '../../components/cultural/CommunityContributions/CommunityContributions';
import { ElderAcknowledgments } from '../../components/cultural/ElderAcknowledgments/ElderAcknowledgments';
import styles from './CulturalContextsPage.module.css';

/**
 * Cultural Contexts Page Component
 * Provides comprehensive cultural education and exploration
 */
export const CulturalContextsPage: Component = () => {
  // State management
  const [selectedContextId, setSelectedContextId] = createSignal<string | undefined>();
  const [searchQuery, setSearchQuery] = createSignal('');
  const [viewMode, setViewMode] = createSignal<
    'contexts' | 'learning' | 'communities' | 'acknowledgments'
  >('contexts');
  const [selectedFilters, setSelectedFilters] = createSignal({
    culturalOrigins: [] as string[],
    sensitivityLevels: [] as string[],
    knowledgeTypes: [] as string[],
    regions: [] as string[],
    hasEducationalContent: false,
    elderApproved: false,
  });
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Data loading
  const allCulturalContexts = createAsync(async () => {
    try {
      setError(null);
      const response = await culturalApi.searchCulturalContexts('', {});
      return response.success ? response.data : [];
    } catch (err) {
      setError('Failed to load cultural contexts');
      return [];
    }
  });

  const traditionalClassifications = createAsync(async () => {
    try {
      const response = await culturalApi.getTraditionalClassifications();
      return response.success ? response.data : [];
    } catch (err) {
      console.error('Failed to load traditional classifications:', err);
      return [];
    }
  });

  const learningPathways = createAsync(async () => {
    try {
      const response = await culturalApi.getCulturalLearningPathways();
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Failed to load learning pathways:', err);
      return null;
    }
  });

  const elderAcknowledgments = createAsync(async () => {
    try {
      const response = await culturalApi.getElderGuardianAcknowledgments();
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Failed to load elder acknowledgments:', err);
      return null;
    }
  });

  // Search results
  const searchResults = createAsync(async () => {
    const query = searchQuery();
    const filters = selectedFilters();

    if (!query && Object.values(filters).every(v => !v || (Array.isArray(v) && v.length === 0))) {
      return [];
    }

    try {
      setIsLoading(true);
      const response = await culturalApi.searchCulturalContexts(query, filters);
      return response.success ? response.data : [];
    } catch (err) {
      console.error('Cultural context search failed:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  });

  // Selected context details
  const selectedContext = createAsync(async () => {
    const contextId = selectedContextId();
    if (!contextId) return null;

    try {
      const response = await culturalApi.getCulturalContext(contextId);
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Failed to load context details:', err);
      return null;
    }
  });

  // Educational content for selected context
  const educationalContent = createAsync(async () => {
    const contextId = selectedContextId();
    if (!contextId) return [];

    try {
      const response = await culturalApi.getCulturalEducation(contextId);
      return response.success ? response.data : [];
    } catch (err) {
      console.error('Failed to load educational content:', err);
      return [];
    }
  });

  // Cross-cultural connections
  const crossCulturalConnections = createAsync(async () => {
    const contextId = selectedContextId();
    if (!contextId) return null;

    try {
      const response = await culturalApi.getCrossCulturalConnections(contextId);
      return response.success ? response.data : null;
    } catch (err) {
      console.debug('Cross-cultural connections not available:', err);
      return null;
    }
  });

  // Available communities for filtering
  const availableCommunities = () => {
    const contexts = allCulturalContexts() || [];
    const communities = new Set<string>();
    contexts.forEach(context => {
      communities.add(context.community);
      context.communityInfo.primaryCommunities.forEach(c => communities.add(c));
    });
    return Array.from(communities).sort();
  };

  // Event handlers
  const handleContextSelect = (contextId: string) => {
    setSelectedContextId(contextId);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedContextId(undefined);
  };

  const handleFilterChange = (filters: typeof selectedFilters) => {
    setSelectedFilters(filters);
  };

  const handleViewModeChange = (mode: typeof viewMode) => {
    setViewMode(mode);
    setSelectedContextId(undefined);
  };

  const handleBackToList = () => {
    setSelectedContextId(undefined);
  };

  // Get contexts to display
  const contextsToDisplay = () => {
    const query = searchQuery();
    const results = searchResults();
    const all = allCulturalContexts();

    if (query || results.length > 0) {
      return results;
    }

    return all || [];
  };

  // Get featured contexts for educational purposes
  const getFeaturedContexts = () => {
    const contexts = allCulturalContexts() || [];
    return contexts
      .filter(
        context =>
          context.authorityInfo.eldersConsulted && context.authorityInfo.communityEndorsement
      )
      .slice(0, 6);
  };

  return (
    <ErrorBoundary
      fallback={err => (
        <ErrorMessage
          message="Failed to load cultural contexts page"
          details={err.message}
          onRetry={() => window.location.reload()}
        />
      )}
    >
      <div class={styles.culturalContextsPage}>
        {/* Header Section */}
        <header class={styles.pageHeader}>
          <div class={styles.titleSection}>
            <h1 class={styles.pageTitle}>Cultural Contexts & Learning</h1>
            <p class={styles.pageSubtitle}>
              Explore diverse cultural knowledge systems with respect, understanding, and
              educational purpose. All information is shared with community approval and elder
              guidance.
            </p>
          </div>

          {/* View Mode Controls */}
          <div class={styles.viewControls}>
            <button
              class={`${styles.viewButton} ${viewMode() === 'contexts' ? styles.active : ''}`}
              onClick={() => handleViewModeChange('contexts')}
              aria-label="Cultural contexts view"
            >
              Cultural Contexts
            </button>
            <button
              class={`${styles.viewButton} ${viewMode() === 'learning' ? styles.active : ''}`}
              onClick={() => handleViewModeChange('learning')}
              aria-label="Learning pathways view"
            >
              Learning Pathways
            </button>
            <button
              class={`${styles.viewButton} ${viewMode() === 'communities' ? styles.active : ''}`}
              onClick={() => handleViewModeChange('communities')}
              aria-label="Community contributions view"
            >
              Communities
            </button>
            <button
              class={`${styles.viewButton} ${viewMode() === 'acknowledgments' ? styles.active : ''}`}
              onClick={() => handleViewModeChange('acknowledgments')}
              aria-label="Elder acknowledgments view"
            >
              Acknowledgments
            </button>
          </div>

          {/* Cultural Respect Notice */}
          <div class={styles.respectNotice}>
            <div class={styles.respectIcon}>🙏</div>
            <p class={styles.respectText}>
              We approach all cultural knowledge with deep respect, guided by community elders and
              cultural guardians. This information is shared for educational understanding and
              cross-cultural learning.
            </p>
          </div>
        </header>

        {/* Search and Filter Section - Only for contexts view */}
        <Show when={viewMode() === 'contexts'}>
          <div class={styles.searchFilterSection}>
            <div class={styles.searchContainer}>
              <SearchBar
                placeholder="Search cultural contexts..."
                value={searchQuery()}
                onSearch={handleSearch}
                onClear={() => setSearchQuery('')}
                className={styles.contextSearch}
              />
            </div>

            <FilterPanel
              filters={selectedFilters()}
              onFiltersChange={handleFilterChange}
              availableFilters={{
                culturalOrigins: availableCommunities(),
                sensitivityLevels: ['low', 'medium', 'high'],
                knowledgeTypes: [
                  'traditional',
                  'ceremonial',
                  'practical',
                  'spiritual',
                  'historical',
                ],
                regions: [], // Will be populated from backend
              }}
              className={styles.filterPanel}
            />
          </div>
        </Show>

        {/* Loading State */}
        <Show when={isLoading()}>
          <div class={styles.loadingContainer}>
            <LoadingSpinner size="large" message="Loading cultural contexts..." />
          </div>
        </Show>

        {/* Error State */}
        <Show when={error()}>
          <ErrorMessage
            message={error()!}
            onRetry={() => {
              setError(null);
              window.location.reload();
            }}
          />
        </Show>

        {/* Main Content Area */}
        <main class={styles.mainContent}>
          {/* Cultural Contexts View */}
          <Show when={viewMode() === 'contexts'}>
            {/* Selected Context Detail View */}
            <Show when={selectedContext()}>
              <div class={styles.contextDetailView}>
                <div class={styles.contextHeader}>
                  <button
                    class={styles.backButton}
                    onClick={handleBackToList}
                    aria-label="Back to contexts list"
                  >
                    ← Back to Contexts
                  </button>

                  <div class={styles.contextInfo}>
                    <h2 class={styles.contextTitle}>{selectedContext()?.name}</h2>
                    <div class={styles.contextMeta}>
                      <span class={styles.culturalOrigin}>{selectedContext()?.culturalOrigin}</span>
                      <span class={styles.community}>{selectedContext()?.community}</span>
                      <Show when={selectedContext()?.authorityInfo.eldersConsulted}>
                        <span class={styles.elderApproval}>Elder Guided ✓</span>
                      </Show>
                    </div>
                  </div>
                </div>

                {/* Cultural Context Display */}
                <CulturalContextDisplay
                  context={selectedContext()!}
                  expanded={true}
                  showEducationalContent={true}
                  showCommunityInfo={true}
                  className={styles.contextDisplay}
                />

                {/* Educational Content */}
                <Show when={educationalContent().length > 0}>
                  <div class={styles.educationalSection}>
                    <h3 class={styles.sectionTitle}>Educational Content</h3>
                    <div class={styles.educationalGrid}>
                      <For each={educationalContent()}>
                        {content => (
                          <div class={styles.educationalCard}>
                            <h4 class={styles.contentTitle}>{content.content.title}</h4>
                            <p class={styles.contentSummary}>{content.content.summary}</p>

                            <div class={styles.learningObjectives}>
                              <h5>Learning Objectives:</h5>
                              <ul>
                                <For each={content.content.learningObjectives}>
                                  {objective => <li>{objective}</li>}
                                </For>
                              </ul>
                            </div>

                            <Show when={content.connections.relatedCultures.length > 0}>
                              <div class={styles.connections}>
                                <h5>Related Cultures:</h5>
                                <div class={styles.cultureList}>
                                  <For each={content.connections.relatedCultures}>
                                    {culture => <span class={styles.cultureTag}>{culture}</span>}
                                  </For>
                                </div>
                              </div>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>

                {/* Cross-Cultural Connections */}
                <Show when={crossCulturalConnections()}>
                  <div class={styles.connectionsSection}>
                    <h3 class={styles.sectionTitle}>Cross-Cultural Connections</h3>
                    <div class={styles.connectionsContent}>
                      <div class={styles.universalThemes}>
                        <h4>Universal Themes</h4>
                        <For each={crossCulturalConnections()?.universalThemes}>
                          {theme => <span class={styles.themeTag}>{theme}</span>}
                        </For>
                      </div>

                      <div class={styles.learningBridges}>
                        <h4>Learning Bridges</h4>
                        <For each={crossCulturalConnections()?.learningBridges}>
                          {bridge => <div class={styles.bridgeItem}>{bridge}</div>}
                        </For>
                      </div>
                    </div>
                  </div>
                </Show>
              </div>
            </Show>

            {/* Contexts List View */}
            <Show when={!selectedContext()}>
              {/* Featured Contexts */}
              <Show when={getFeaturedContexts().length > 0 && !searchQuery()}>
                <section class={styles.featuredSection}>
                  <h2 class={styles.sectionTitle}>Featured Cultural Contexts</h2>
                  <p class={styles.sectionDescription}>
                    These contexts have been specially curated with elder guidance and community
                    approval
                  </p>

                  <div class={styles.featuredGrid}>
                    <For each={getFeaturedContexts()}>
                      {context => (
                        <div
                          class={styles.contextCard}
                          onClick={() => handleContextSelect(context.id)}
                        >
                          <div class={styles.cardHeader}>
                            <h3 class={styles.cardTitle}>{context.name}</h3>
                            <div class={styles.cardMeta}>
                              <span class={styles.origin}>{context.culturalOrigin}</span>
                              <Show when={context.authorityInfo.eldersConsulted}>
                                <span class={styles.approved}>Elder Approved</span>
                              </Show>
                            </div>
                          </div>

                          <p class={styles.cardDescription}>{context.description}</p>

                          <div class={styles.cardFooter}>
                            <span class={styles.community}>{context.community}</span>
                            <span class={styles.significance}>
                              {context.traditionalKnowledge.culturalSignificance}
                            </span>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </section>
              </Show>

              {/* All Contexts */}
              <section class={styles.allContextsSection}>
                <h2 class={styles.sectionTitle}>
                  {searchQuery() ? 'Search Results' : 'All Cultural Contexts'}
                </h2>

                <Show
                  when={contextsToDisplay().length > 0}
                  fallback={
                    <div class={styles.emptyState}>
                      <h3>No cultural contexts found</h3>
                      <p>Try adjusting your search terms or filters</p>
                    </div>
                  }
                >
                  <div class={styles.contextsGrid}>
                    <For each={contextsToDisplay()}>
                      {context => (
                        <div
                          class={styles.contextCard}
                          onClick={() => handleContextSelect(context.id)}
                        >
                          <div class={styles.cardHeader}>
                            <h3 class={styles.cardTitle}>{context.name}</h3>
                            <div class={styles.cardMeta}>
                              <span class={styles.origin}>{context.culturalOrigin}</span>
                              <span
                                class={`${styles.sensitivity} ${styles[context.sensitivityInfo.level]}`}
                              >
                                {context.sensitivityInfo.level}
                              </span>
                            </div>
                          </div>

                          <p class={styles.cardDescription}>{context.description}</p>

                          <div class={styles.knowledgeType}>
                            <span class={styles.typeLabel}>Knowledge Type:</span>
                            <span class={styles.typeValue}>
                              {context.traditionalKnowledge.knowledgeType}
                            </span>
                          </div>

                          <div class={styles.cardFooter}>
                            <span class={styles.community}>{context.community}</span>
                            <div class={styles.approvals}>
                              <Show when={context.authorityInfo.eldersConsulted}>
                                <span class={styles.approval}>Elder Consulted</span>
                              </Show>
                              <Show when={context.authorityInfo.communityEndorsement}>
                                <span class={styles.approval}>Community Endorsed</span>
                              </Show>
                            </div>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </section>
            </Show>
          </Show>

          {/* Learning Pathways View */}
          <Show when={viewMode() === 'learning' && learningPathways()}>
            <CulturalLearningPath
              pathways={learningPathways()!}
              onPathwaySelect={pathwayId => {
                // Handle pathway selection
                console.log('Selected pathway:', pathwayId);
              }}
              className={styles.learningSection}
            />
          </Show>

          {/* Communities View */}
          <Show when={viewMode() === 'communities'}>
            <div class={styles.communitiesSection}>
              <h2 class={styles.sectionTitle}>Cultural Communities</h2>
              <p class={styles.sectionDescription}>
                Explore the diverse communities that contribute to our cultural knowledge base
              </p>

              <div class={styles.communitiesGrid}>
                <For each={availableCommunities()}>
                  {community => (
                    <div class={styles.communityCard}>
                      <h3 class={styles.communityName}>{community}</h3>
                      <div class={styles.communityStats}>
                        <span class={styles.contextCount}>
                          {
                            (allCulturalContexts() || []).filter(
                              c =>
                                c.community === community ||
                                c.communityInfo.primaryCommunities.includes(community)
                            ).length
                          }{' '}
                          contexts
                        </span>
                      </div>
                      <button
                        class={styles.exploreButton}
                        onClick={() => {
                          setSelectedFilters(prev => ({
                            ...prev,
                            culturalOrigins: [community],
                          }));
                          setViewMode('contexts');
                        }}
                      >
                        Explore
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Elder Acknowledgments View */}
          <Show when={viewMode() === 'acknowledgments' && elderAcknowledgments()}>
            <ElderAcknowledgments
              acknowledgments={elderAcknowledgments()!}
              className={styles.acknowledgementsSection}
            />
          </Show>
        </main>

        {/* Cultural Respect Footer */}
        <footer class={styles.pageFooter}>
          <div class={styles.culturalStatement}>
            <h3 class={styles.statementTitle}>Our Commitment to Cultural Respect</h3>
            <p class={styles.statementText}>
              All cultural information presented here is shared with the explicit approval and
              guidance of cultural elders, community leaders, and knowledge guardians. We are
              committed to educational sharing that honors traditional protocols and promotes
              cross-cultural understanding.
            </p>

            <div class={styles.principlesGrid}>
              <div class={styles.principle}>
                <h4>Elder Guidance</h4>
                <p>All content reviewed by respected community elders</p>
              </div>
              <div class={styles.principle}>
                <h4>Community Approval</h4>
                <p>Shared with explicit community endorsement</p>
              </div>
              <div class={styles.principle}>
                <h4>Educational Purpose</h4>
                <p>Information shared to promote understanding and respect</p>
              </div>
              <div class={styles.principle}>
                <h4>Cultural Protocols</h4>
                <p>Traditional protocols and respectful practices maintained</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default CulturalContextsPage;
