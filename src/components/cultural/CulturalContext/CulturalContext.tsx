/**
 * Cultural Context Component
 *
 * Displays cultural context information for educational purposes.
 * INFORMATION ONLY - NO ACCESS CONTROL - Educational enhancement.
 */

import { Component, Show, For } from 'solid-js';
import styles from './CulturalContext.module.css';

export interface CulturalContextInfo {
  /** Cultural sensitivity level (1-3) */
  sensitivityLevel: number;
  /** Cultural origin or community */
  culturalOrigin?: string;
  /** Educational context description */
  educationalContext?: string;
  /** Traditional protocols for information */
  traditionalProtocols?: string[];
  /** Community information */
  communityInfo?: {
    primaryCommunities: string[];
    elderApproval?: boolean;
    educationalPurpose: boolean;
  };
  /** Educational resources */
  educationalResources?: string[];
  /** Source attribution */
  sourceAttribution?: string;
  /** Information only flag */
  readonly informationOnly: true;
}

export interface CulturalContextProps {
  /** Cultural context information */
  contextInfo: CulturalContextInfo;
  /** Display mode */
  displayMode?: 'full' | 'compact' | 'inline';
  /** Show educational resources */
  showEducationalResources?: boolean;
  /** Show community information */
  showCommunityInfo?: boolean;
  /** Cultural theme */
  culturalTheme?: 'indigenous' | 'traditional' | 'ceremonial' | 'default';
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Educational resource access handler */
  onEducationalResourceAccess?: (resource: string) => void;
}

export const CulturalContext: Component<CulturalContextProps> = props => {
  // Default props
  const displayMode = () => props.displayMode || 'full';
  const showEducationalResources = () => props.showEducationalResources ?? true;
  const showCommunityInfo = () => props.showCommunityInfo ?? true;
  const culturalTheme = () => props.culturalTheme || 'traditional';

  // Get sensitivity level description
  const getSensitivityDescription = (level: number) => {
    switch (level) {
      case 1:
        return 'General cultural context available';
      case 2:
        return 'Traditional knowledge context provided';
      case 3:
        return 'Sacred content - educational context provided';
      default:
        return 'Cultural information available';
    }
  };

  // Get sensitivity level icon
  const getSensitivityIcon = (level: number) => {
    switch (level) {
      case 1:
        return '🌿';
      case 2:
        return '🏛️';
      case 3:
        return '🙏';
      default:
        return 'ℹ️';
    }
  };

  // Handle educational resource access
  const handleEducationalResourceAccess = (resource: string) => {
    props.onEducationalResourceAccess?.(resource);
  };

  // Generate CSS classes
  const containerClasses = () =>
    [
      styles.culturalContext,
      styles[`mode-${displayMode()}`],
      styles[`theme-${culturalTheme()}`],
      styles[`sensitivity-${props.contextInfo.sensitivityLevel}`],
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  const { contextInfo } = props;

  return (
    <div class={containerClasses()} data-testid={props['data-testid']}>
      {/* Information Notice */}
      <div class={styles.informationNotice}>
        <div class={styles.noticeIcon}>{getSensitivityIcon(contextInfo.sensitivityLevel)}</div>
        <div class={styles.noticeContent}>
          <div class={styles.noticeTitle}>Cultural Context</div>
          <div class={styles.noticeDescription}>
            {getSensitivityDescription(contextInfo.sensitivityLevel)}
          </div>
        </div>
        <div class={styles.informationBadge}>Information Only</div>
      </div>

      {/* Cultural Origin */}
      <Show when={contextInfo.culturalOrigin && displayMode() !== 'compact'}>
        <div class={styles.culturalOrigin}>
          <h4 class={styles.sectionTitle}>Cultural Origin</h4>
          <p class={styles.originText}>{contextInfo.culturalOrigin}</p>
        </div>
      </Show>

      {/* Educational Context */}
      <Show when={contextInfo.educationalContext}>
        <div class={styles.educationalContext}>
          <h4 class={styles.sectionTitle}>Educational Context</h4>
          <p class={styles.contextText}>{contextInfo.educationalContext}</p>
        </div>
      </Show>

      {/* Community Information */}
      <Show when={showCommunityInfo() && contextInfo.communityInfo && displayMode() === 'full'}>
        <div class={styles.communityInfo}>
          <h4 class={styles.sectionTitle}>Community Information</h4>

          <Show when={contextInfo.communityInfo!.primaryCommunities.length > 0}>
            <div class={styles.primaryCommunities}>
              <strong>Primary Communities:</strong>
              <div class={styles.communitiesList}>
                <For each={contextInfo.communityInfo!.primaryCommunities}>
                  {community => <span class={styles.communityTag}>{community}</span>}
                </For>
              </div>
            </div>
          </Show>

          <Show when={contextInfo.communityInfo!.elderApproval}>
            <div class={styles.elderApproval}>
              <span class={styles.approvalIcon}>✓</span>
              <span class={styles.approvalText}>Elder acknowledgment received</span>
            </div>
          </Show>

          <div class={styles.educationalPurpose}>
            <span class={styles.purposeIcon}>📚</span>
            <span class={styles.purposeText}>Shared for educational purposes</span>
          </div>
        </div>
      </Show>

      {/* Traditional Protocols */}
      <Show
        when={
          contextInfo.traditionalProtocols &&
          contextInfo.traditionalProtocols.length > 0 &&
          displayMode() === 'full'
        }
      >
        <div class={styles.traditionalProtocols}>
          <h4 class={styles.sectionTitle}>Traditional Protocols</h4>
          <div class={styles.protocolsDescription}>
            Information about traditional protocols for educational understanding:
          </div>
          <ul class={styles.protocolsList}>
            <For each={contextInfo.traditionalProtocols}>
              {protocol => <li class={styles.protocolItem}>{protocol}</li>}
            </For>
          </ul>
        </div>
      </Show>

      {/* Educational Resources */}
      <Show
        when={
          showEducationalResources() &&
          contextInfo.educationalResources &&
          contextInfo.educationalResources.length > 0
        }
      >
        <div class={styles.educationalResources}>
          <h4 class={styles.sectionTitle}>Educational Resources</h4>
          <div class={styles.resourcesDescription}>
            Additional resources to enhance cultural understanding:
          </div>
          <div class={styles.resourcesList}>
            <For each={contextInfo.educationalResources}>
              {resource => (
                <button
                  class={styles.resourceButton}
                  onClick={() => handleEducationalResourceAccess(resource)}
                >
                  <span class={styles.resourceIcon}>📖</span>
                  <span class={styles.resourceText}>{resource}</span>
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Source Attribution */}
      <Show when={contextInfo.sourceAttribution && displayMode() === 'full'}>
        <div class={styles.sourceAttribution}>
          <h4 class={styles.sectionTitle}>Source Attribution</h4>
          <p class={styles.attributionText}>{contextInfo.sourceAttribution}</p>
        </div>
      </Show>

      {/* Footer Notice */}
      <Show when={displayMode() === 'full'}>
        <div class={styles.footerNotice}>
          <p class={styles.footerText}>
            <strong>Note:</strong> Cultural context is provided for educational purposes to enhance
            understanding and appreciation of cultural heritage. All information is shared with
            respect for cultural protocols and community values.
          </p>
        </div>
      </Show>
    </div>
  );
};

export default CulturalContext;
