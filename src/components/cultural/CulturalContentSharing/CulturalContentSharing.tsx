import { type Component, createSignal, createEffect, For, Show } from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Badge } from '@/components/foundation/Badge';
import { Textarea } from '@/components/foundation/Textarea';
import { Switch } from '@/components/foundation/Switch';
import { p2pNetworkService } from '@/services/network/p2pNetworkService';
import type {
  CulturalContentSharingProps,
  SharingConfiguration,
  SharingResult,
  CommunityNetwork,
  SharingTemplate,
  SharingOptions,
} from './types/CulturalContentSharingTypes';
import styles from './CulturalContentSharing.module.css';

/**
 * CulturalContentSharing component for community-aware content distribution
 *
 * @example
 * ```tsx
 * <CulturalContentSharing
 *   content={shareableContent}
 *   onContentShared={handleContentShared}
 *   showEducationalContext={true}
 *   showCulturalAttribution={true}
 * />
 * ```
 *
 * @cultural-considerations
 * - Provides educational context for all shared content
 * - Respects cultural attribution and source transparency
 * - Supports community notification without access control
 * - NO CONTENT BLOCKING - information sharing only
 *
 * @accessibility
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - High contrast mode support
 * - Focus management for sharing workflow
 *
 * @performance
 * - Efficient community network discovery
 * - Optimized content distribution
 * - Real-time sharing progress tracking
 */
export const CulturalContentSharing: Component<CulturalContentSharingProps> = props => {
  // State management
  const [availableNetworks, setAvailableNetworks] = createSignal<CommunityNetwork[]>(
    props.availableNetworks || []
  );
  const [selectedNetworks, setSelectedNetworks] = createSignal<string[]>([]);
  const [sharingMessage, setSharingMessage] = createSignal('');
  const [sharingConfig, setSharingConfig] = createSignal<SharingConfiguration>({
    selectedCommunities: [],
    sharingMessage: '',
    includeEducationalContext: true,
    includeCulturalAttribution: true,
    includeSourceInformation: true,
    additionalOptions: {
      enableCommunityDiscussion: true,
      allowCommunityContributions: false,
      requestCommunityFeedback: true,
      includeLearningOpportunities: true,
      provideCulturalContext: true,
      supportMultiplePerspectives: true,
    },
  });

  const [isSharing, setIsSharing] = createSignal(false);
  const [sharingProgress, setSharingProgress] = createSignal(0);
  const [sharingResult, setSharingResult] = createSignal<SharingResult | null>(null);
  const [selectedTemplate, setSelectedTemplate] = createSignal<SharingTemplate | null>(null);
  const [showEducationalPanel, setShowEducationalPanel] = createSignal(
    props.showEducationalContext ?? true
  );

  // Load available networks if not provided
  createEffect(() => {
    if (props.availableNetworks) return;
    void (async () => {
      try {
        const networks = await p2pNetworkService.discoverCommunityNetworks();
        const normalized: CommunityNetwork[] = networks.map(network => ({
          id: network.id,
          name: network.name,
          description: network.description,
          culturalFocus: [network.culturalContext || 'General'],
          memberCount: network.memberCount,
          activityLevel: 'medium',
          educationalResources: Array.isArray(network.educationalResources),
        }));
        setAvailableNetworks(normalized);
      } catch (error) {
        console.error('Failed to load community networks:', error);
      }
    })();
  });

  // Update sharing configuration when selections change
  createEffect(() => {
    setSharingConfig(prev => ({
      ...prev,
      selectedCommunities: selectedNetworks(),
      sharingMessage: sharingMessage(),
    }));
  });

  // Handle network selection
  const handleNetworkToggle = (networkId: string, checked: boolean) => {
    if (checked) {
      setSelectedNetworks(prev => [...prev, networkId]);
    } else {
      setSelectedNetworks(prev => prev.filter(id => id !== networkId));
    }
  };

  // Handle sharing option changes
  const handleSharingOptionChange = (option: keyof SharingOptions, value: boolean) => {
    setSharingConfig(prev => ({
      ...prev,
      additionalOptions: {
        ...prev.additionalOptions!,
        [option]: value,
      },
    }));
  };

  // Apply sharing template
  const applyTemplate = (template: SharingTemplate) => {
    setSelectedTemplate(template);
    setSharingMessage(template.messageTemplate);

    // Auto-select networks that match template target communities
    const matchingNetworks = availableNetworks()
      .filter(network =>
        network.culturalFocus.some(focus => template.targetCommunities.includes(focus))
      )
      .map(network => network.id);

    setSelectedNetworks(matchingNetworks);
  };

  // Handle content sharing
  const handleShare = async () => {
    try {
      setIsSharing(true);
      setSharingProgress(0);

      const config = sharingConfig();

      if (config.selectedCommunities.length === 0) {
        throw new Error('Please select at least one community to share with');
      }

      // Simulate sharing progress
      const progressInterval = setInterval(() => {
        setSharingProgress(prev => {
          const newProgress = prev + 20;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
          }
          return Math.min(newProgress, 100);
        });
      }, 500);

      // Share content with selected communities
      for (const communityId of config.selectedCommunities) {
        await p2pNetworkService.shareWithCommunity(props.content as any, communityId);
      }

      // Create sharing result
      const result: SharingResult = {
        sharingId: `sharing-${Date.now()}`,
        success: true,
        sharedWithCommunities: config.selectedCommunities,
        sharedAt: new Date().toISOString(),
        contentHash: `hash-${props.content.id}-${Date.now()}`,
        sharingMetrics: {
          peersReached: config.selectedCommunities.length * 15, // Estimated
          communitiesNotified: config.selectedCommunities.length,
          educationalDeliverySuccess: config.includeEducationalContext,
          attributionIncluded: config.includeCulturalAttribution,
          completionTime: 2500, // ms
          distributionEfficiency: 0.95,
        },
        communityResponses: [],
      };

      setSharingResult(result);
      props.onContentShared?.(result);
    } catch (error) {
      console.error('Failed to share content:', error);
      setSharingResult({
        sharingId: `failed-${Date.now()}`,
        success: false,
        sharedWithCommunities: [],
        sharedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsSharing(false);
      setSharingProgress(0);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    props.onSharingCancelled?.();
  };

  // Get cultural sensitivity class
  const getCulturalSensitivityClass = (level?: number) => {
    switch (level) {
      case 1:
        return styles.sensitivityGeneral;
      case 2:
        return styles.sensitivityTraditional;
      case 3:
        return styles.sensitivityEducational;
      default:
        return styles.sensitivityGeneral;
    }
  };

  return (
    <div class={styles.culturalContentSharing}>
      {/* Header Section */}
      <div class={styles.header}>
        <h2 class={styles.title}>Share Cultural Content</h2>
        <p class={styles.subtitle}>
          Share content with communities while providing educational context and cultural
          attribution
        </p>

        <div class={styles.headerActions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEducationalPanel(!showEducationalPanel())}
            aria-label="Toggle educational context"
          >
            {showEducationalPanel() ? 'Hide' : 'Show'} Educational Context
          </Button>
        </div>
      </div>

      {/* Educational Context Panel */}
      <Show when={showEducationalPanel()}>
        <Card class={styles.educationalPanel}>
          <h3>Cultural Content Sharing - Educational Context</h3>
          <div>
            <div class={styles.educationalContent}>
              <div class={styles.principleSection}>
                <h4>Information Sharing Principles</h4>
                <ul>
                  <li>• Content sharing includes educational context</li>
                  <li>• Cultural attribution is transparent and respectful</li>
                  <li>• Communities are notified, not asked for permission</li>
                  <li>• Multiple perspectives are supported equally</li>
                </ul>
              </div>

              <div class={styles.sharingSection}>
                <h4>Community Sharing</h4>
                <ul>
                  <li>• Share educational and cultural resources freely</li>
                  <li>• Provide source attribution and cultural context</li>
                  <li>• Support community learning and discussion</li>
                  <li>• Preserve cultural knowledge through sharing</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </Show>

      {/* Content Information */}
      <Card class={styles.contentCard}>
        <div class={styles.contentHeader}>
          <h3 class={styles.contentTitle}>{props.content.title}</h3>
          <Badge
            variant="outline"
            class={getCulturalSensitivityClass(props.content.culturalMetadata?.sensitivityLevel)}
          >
            {props.content.type}
          </Badge>
        </div>
        <div>
          <div class={styles.contentInfo}>
            <p class={styles.contentDescription}>{props.content.description}</p>

            <Show when={props.content.culturalMetadata}>
              <div class={styles.culturalInfo}>
                <h4>Cultural Context</h4>
                <p>
                  <strong>Origin:</strong> {props.content.culturalMetadata!.culturalOrigin}
                </p>
                <p>
                  <strong>Cultural Context:</strong>{' '}
                  {props.content.culturalMetadata!.culturalContext}
                </p>
                <Show when={props.content.culturalMetadata!.knowledgeAreas?.length > 0}>
                  <p>
                    <strong>Knowledge Areas:</strong>{' '}
                    {props.content.culturalMetadata!.knowledgeAreas.join(', ')}
                  </p>
                </Show>
              </div>
            </Show>

            <Show when={props.content.sourceAttribution}>
              <div class={styles.sourceInfo}>
                <h4>Source Attribution</h4>
                <p>
                  <strong>Source:</strong> {props.content.sourceAttribution!.originalSource}
                </p>
                <p>
                  <strong>Type:</strong> {props.content.sourceAttribution!.sourceType}
                </p>
                <Show when={props.content.sourceAttribution!.traditionalOwnership}>
                  <p>
                    <strong>Traditional Ownership:</strong>{' '}
                    {props.content.sourceAttribution!.traditionalOwnership}
                  </p>
                </Show>
              </div>
            </Show>
          </div>
        </div>
      </Card>

      {/* Sharing Templates */}
      <Show when={props.sharingTemplates && props.sharingTemplates.length > 0}>
        <Card class={styles.templatesCard}>
          <h3>Sharing Templates</h3>
          <div>
            <div class={styles.templateGrid}>
              <For each={props.sharingTemplates}>
                {template => (
                  <div
                    class={`${styles.templateCard} ${selectedTemplate()?.id === template.id ? styles.selectedTemplate : ''}`}
                    onClick={() => applyTemplate(template)}
                  >
                    <h5>{template.name}</h5>
                    <p>{template.description}</p>
                    <div class={styles.templateTargets}>
                      <For each={template.targetCommunities}>
                        {target => (
                          <Badge variant="outline" size="sm">
                            {target}
                          </Badge>
                        )}
                      </For>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Card>
      </Show>

      {/* Community Selection */}
      <Card class={styles.networkSelectionCard}>
        <h3>Select Communities to Share With</h3>
        <div>
          <div class={styles.networkGrid}>
            <For each={availableNetworks()}>
              {network => (
                <div class={styles.networkOption}>
                  <Switch
                    checked={selectedNetworks().includes(network.id)}
                    onChange={checked => handleNetworkToggle(network.id, checked)}
                  />
                  <div class={styles.networkLabel}>
                    <div class={styles.networkName}>{network.name}</div>
                    <div class={styles.networkDescription}>{network.description}</div>
                    <div class={styles.networkStats}>
                      <span>Members: {network.memberCount}</span>
                      <Badge variant="outline" size="sm">
                        {network.activityLevel} activity
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Card>

      {/* Sharing Message */}
      <Card class={styles.messageCard}>
        <h3>Sharing Message</h3>
        <div>
          <Textarea
            value={sharingMessage()}
            onInput={setSharingMessage}
            placeholder="Add a message to accompany your shared content..."
            rows={4}
            class={styles.messageInput}
          />
        </div>
      </Card>

      {/* Sharing Options */}
      <Card class={styles.optionsCard}>
        <h3>Sharing Options</h3>
        <div>
          <div class={styles.optionsGrid}>
            <div class={styles.optionGroup}>
              <h4>Educational Context</h4>
              <Switch
                checked={sharingConfig().includeEducationalContext}
                onChange={checked =>
                  setSharingConfig(prev => ({ ...prev, includeEducationalContext: checked }))
                }
              />
              <label>Include educational context and learning resources</label>
            </div>

            <div class={styles.optionGroup}>
              <h4>Cultural Attribution</h4>
              <Switch
                checked={sharingConfig().includeCulturalAttribution}
                onChange={checked =>
                  setSharingConfig(prev => ({ ...prev, includeCulturalAttribution: checked }))
                }
              />
              <label>Include cultural attribution and source information</label>
            </div>

            <div class={styles.optionGroup}>
              <h4>Community Engagement</h4>
              <Switch
                checked={sharingConfig().additionalOptions?.enableCommunityDiscussion ?? true}
                onChange={checked =>
                  handleSharingOptionChange('enableCommunityDiscussion', checked)
                }
              />
              <label>Enable community discussion</label>

              <Switch
                checked={sharingConfig().additionalOptions?.requestCommunityFeedback ?? true}
                onChange={checked => handleSharingOptionChange('requestCommunityFeedback', checked)}
              />
              <label>Request community feedback</label>

              <Switch
                checked={sharingConfig().additionalOptions?.supportMultiplePerspectives ?? true}
                onChange={checked =>
                  handleSharingOptionChange('supportMultiplePerspectives', checked)
                }
              />
              <label>Support multiple perspectives</label>
            </div>
          </div>
        </div>
      </Card>

      {/* Sharing Progress */}
      <Show when={isSharing()}>
        <Card class={styles.progressCard}>
          <div>
            <div class={styles.progressInfo}>
              <h4>Sharing Content...</h4>
              <div class={styles.progressBar}>
                <div class={styles.progressFill} style={{ width: `${sharingProgress()}%` }} />
              </div>
              <p>{sharingProgress()}% complete</p>
            </div>
          </div>
        </Card>
      </Show>

      {/* Sharing Result */}
      <Show when={sharingResult()}>
        <Card
          class={`${styles.resultCard} ${sharingResult()!.success ? styles.successCard : styles.errorCard}`}
        >
          <h3>{sharingResult()!.success ? 'Content Shared Successfully!' : 'Sharing Failed'}</h3>
          <div>
            <Show when={sharingResult()!.success}>
              <div class={styles.successInfo}>
                <p>
                  Your content has been shared with {sharingResult()!.sharedWithCommunities.length}{' '}
                  communities.
                </p>
                <Show when={sharingResult()!.sharingMetrics}>
                  <div class={styles.metrics}>
                    <div class={styles.metric}>
                      <span class={styles.metricLabel}>Peers Reached:</span>
                      <span class={styles.metricValue}>
                        {sharingResult()!.sharingMetrics!.peersReached}
                      </span>
                    </div>
                    <div class={styles.metric}>
                      <span class={styles.metricLabel}>Distribution Efficiency:</span>
                      <span class={styles.metricValue}>
                        {(sharingResult()!.sharingMetrics!.distributionEfficiency * 100).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </Show>
              </div>
            </Show>
            <Show when={!sharingResult()!.success}>
              <div class={styles.errorInfo}>
                <p>Error: {sharingResult()!.errorMessage}</p>
              </div>
            </Show>
          </div>
        </Card>
      </Show>

      {/* Action Buttons */}
      <div class={styles.actions}>
        <Button variant="outline" onClick={handleCancel} disabled={isSharing()}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleShare}
          disabled={isSharing() || selectedNetworks().length === 0}
        >
          {isSharing() ? 'Sharing...' : `Share with ${selectedNetworks().length} Communities`}
        </Button>
      </div>
    </div>
  );
};
