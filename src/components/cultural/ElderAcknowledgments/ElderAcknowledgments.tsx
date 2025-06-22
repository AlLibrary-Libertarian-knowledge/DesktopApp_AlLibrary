/**
 * Elder Acknowledgments Component
 *
 * Displays respectful acknowledgments of elders and knowledge keepers.
 * INFORMATION ONLY - Cultural respect through recognition and education.
 */

import { Component, createSignal, For, Show } from 'solid-js';
import styles from './ElderAcknowledgments.module.css';

export interface ElderAcknowledgment {
  id: string;
  elderName: string;
  culturalName?: string;
  community: string;
  culturalRole: string;
  knowledgeAreas: string[];
  contribution: string;
  acknowledgmentText: string;
  relationToContent?: string;
  language: string;
  dateOfAcknowledgment: Date;
  consentGiven: boolean;
  photoUrl?: string;
  audioUrl?: string;
  traditionalTitle?: string;
  respectfulProtocols: string[];
}

export interface ElderAcknowledgmentsProps {
  /** Elder acknowledgments to display */
  acknowledgments: ElderAcknowledgment[];
  /** Show elder photos */
  showPhotos?: boolean;
  /** Show audio acknowledgments */
  showAudio?: boolean;
  /** Show traditional protocols */
  showProtocols?: boolean;
  /** Cultural theme */
  culturalTheme?: 'indigenous' | 'traditional' | 'ceremonial' | 'default';
  /** Display mode */
  displayMode?: 'full' | 'compact' | 'list';
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Elder acknowledgment selection handler */
  onElderSelect?: (elder: ElderAcknowledgment) => void;
  /** Audio playback handler */
  onAudioPlay?: (audioUrl: string) => void;
  /** Protocol information handler */
  onProtocolInfo?: (protocols: string[]) => void;
}

export const ElderAcknowledgments: Component<ElderAcknowledgmentsProps> = props => {
  const [selectedElder, setSelectedElder] = createSignal<string | undefined>();
  const [showProtocolDetails, setShowProtocolDetails] = createSignal(false);

  // Default props
  const showPhotos = () => props.showPhotos ?? true;
  const showAudio = () => props.showAudio ?? true;
  const showProtocols = () => props.showProtocols ?? true;
  const culturalTheme = () => props.culturalTheme || 'traditional';
  const displayMode = () => props.displayMode || 'full';

  // Handle elder selection
  const handleElderSelect = (elder: ElderAcknowledgment) => {
    setSelectedElder(elder.id);
    props.onElderSelect?.(elder);
  };

  // Handle audio playback
  const handleAudioPlay = (audioUrl: string) => {
    props.onAudioPlay?.(audioUrl);
  };

  // Handle protocol information
  const handleProtocolInfo = (protocols: string[]) => {
    setShowProtocolDetails(true);
    props.onProtocolInfo?.(protocols);
  };

  // Group acknowledgments by community
  const getAcknowledmentsByCommunity = () => {
    const grouped = props.acknowledgments.reduce(
      (acc, ack) => {
        if (!acc[ack.community]) {
          acc[ack.community] = [];
        }
        acc[ack.community].push(ack);
        return acc;
      },
      {} as Record<string, ElderAcknowledgment[]>
    );

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  // Generate CSS classes
  const containerClasses = () =>
    [
      styles.elderAcknowledgments,
      styles[`theme-${culturalTheme()}`],
      styles[`mode-${displayMode()}`],
      props.class,
    ]
      .filter(Boolean)
      .join(' ');

  const acknowledgmentsByCommunity = getAcknowledmentsByCommunity();

  return (
    <div class={containerClasses()} data-testid={props['data-testid']}>
      {/* Respectful Introduction */}
      <div class={styles.respectfulIntroduction}>
        <div class={styles.introIcon}>🙏</div>
        <div class={styles.introText}>
          <h2 class={styles.introTitle}>Elder Acknowledgments</h2>
          <p class={styles.introDescription}>
            We respectfully acknowledge the elders and knowledge keepers who have shared their
            wisdom and cultural knowledge. These acknowledgments honor their contributions and
            maintain the cultural protocols of recognition and respect.
          </p>
        </div>
      </div>

      {/* Cultural Protocols Notice */}
      {showProtocols() && (
        <div class={styles.protocolsNotice}>
          <div class={styles.protocolsHeader}>
            <h3 class={styles.protocolsTitle}>Cultural Protocols</h3>
            <button
              class={styles.protocolsButton}
              onClick={() => setShowProtocolDetails(!showProtocolDetails())}
            >
              {showProtocolDetails() ? 'Hide' : 'Show'} Protocol Information
            </button>
          </div>

          <Show when={showProtocolDetails()}>
            <div class={styles.protocolsContent}>
              <p>
                These acknowledgments follow traditional protocols of respect and recognition. All
                elders have given their consent for these acknowledgments to be shared. Please
                approach this knowledge with the respect and reverence it deserves.
              </p>
            </div>
          </Show>
        </div>
      )}

      {/* Acknowledgments by Community */}
      <div class={styles.acknowledgmentsSections}>
        <For each={acknowledgmentsByCommunity}>
          {([community, elders]) => (
            <div class={styles.communitySection}>
              <h3 class={styles.communityTitle}>{community}</h3>

              <div class={styles.eldersGrid}>
                <For each={elders}>
                  {elder => {
                    const isSelected = selectedElder() === elder.id;

                    return (
                      <div
                        class={`${styles.elderCard} ${isSelected ? styles.selected : ''}`}
                        onClick={() => handleElderSelect(elder)}
                      >
                        {/* Elder Photo */}
                        {showPhotos() && elder.photoUrl && elder.consentGiven && (
                          <div class={styles.elderPhoto}>
                            <img
                              src={elder.photoUrl}
                              alt={`${elder.elderName}`}
                              class={styles.photoImage}
                            />
                          </div>
                        )}

                        {/* Elder Information */}
                        <div class={styles.elderInfo}>
                          <div class={styles.elderHeader}>
                            <h4 class={styles.elderName}>{elder.elderName}</h4>
                            {elder.traditionalTitle && (
                              <span class={styles.traditionalTitle}>{elder.traditionalTitle}</span>
                            )}
                            {elder.culturalName && (
                              <span class={styles.culturalName}>({elder.culturalName})</span>
                            )}
                          </div>

                          <div class={styles.elderDetails}>
                            <div class={styles.culturalRole}>
                              <strong>Role:</strong> {elder.culturalRole}
                            </div>

                            <div class={styles.knowledgeAreas}>
                              <strong>Knowledge Areas:</strong>
                              <div class={styles.knowledgeTags}>
                                <For each={elder.knowledgeAreas}>
                                  {area => <span class={styles.knowledgeTag}>{area}</span>}
                                </For>
                              </div>
                            </div>

                            <div class={styles.contribution}>
                              <strong>Contribution:</strong> {elder.contribution}
                            </div>

                            {elder.relationToContent && (
                              <div class={styles.relationToContent}>
                                <strong>Relation to Content:</strong> {elder.relationToContent}
                              </div>
                            )}
                          </div>

                          {/* Acknowledgment Text */}
                          <div class={styles.acknowledgmentText}>
                            <h5 class={styles.acknowledgmentTitle}>Acknowledgment:</h5>
                            <p class={styles.acknowledgmentContent}>{elder.acknowledgmentText}</p>
                          </div>

                          {/* Audio Acknowledgment */}
                          {showAudio() && elder.audioUrl && elder.consentGiven && (
                            <div class={styles.audioSection}>
                              <button
                                class={styles.audioButton}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleAudioPlay(elder.audioUrl!);
                                }}
                              >
                                🔊 Listen to Acknowledgment
                              </button>
                            </div>
                          )}

                          {/* Protocols */}
                          {showProtocols() && elder.respectfulProtocols.length > 0 && (
                            <div class={styles.protocolsSection}>
                              <h6 class={styles.protocolsSubtitle}>Respectful Protocols:</h6>
                              <ul class={styles.protocolsList}>
                                <For each={elder.respectfulProtocols}>
                                  {protocol => <li class={styles.protocolItem}>{protocol}</li>}
                                </For>
                              </ul>
                            </div>
                          )}

                          {/* Metadata */}
                          <div class={styles.elderMetadata}>
                            <div class={styles.language}>
                              <strong>Language:</strong> {elder.language}
                            </div>
                            <div class={styles.acknowledgmentDate}>
                              <strong>Acknowledged:</strong>{' '}
                              {elder.dateOfAcknowledgment.toLocaleDateString()}
                            </div>
                            <div class={styles.consentStatus}>
                              {elder.consentGiven ? (
                                <span class={styles.consentGiven}>✓ Consent Given</span>
                              ) : (
                                <span class={styles.consentPending}>⏳ Consent Pending</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>

      {props.acknowledgments.length === 0 && (
        <div class={styles.emptyState}>
          <div class={styles.emptyIcon}>🏛️</div>
          <h3 class={styles.emptyTitle}>No Elder Acknowledgments</h3>
          <p class={styles.emptyDescription}>
            Elder acknowledgments will be displayed here when available, following proper cultural
            protocols and with appropriate consent.
          </p>
        </div>
      )}

      {/* Footer Note */}
      <div class={styles.footerNote}>
        <p>
          <strong>Note:</strong> All elder acknowledgments are displayed with full respect for
          cultural protocols and with the explicit consent of the acknowledged elders. This
          information is shared to honor their contributions and maintain cultural connections.
        </p>
      </div>
    </div>
  );
};

export default ElderAcknowledgments;
