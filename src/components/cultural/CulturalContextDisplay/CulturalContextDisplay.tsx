import { Component, createSignal, Show, For } from 'solid-js';
import { Globe, Info, Users, BookOpen, X, ChevronDown, ChevronUp, Star } from 'lucide-solid';
import { Card } from '../../foundation/Card';
import { Button } from '../../foundation/Button';
import { CULTURAL_LABELS } from '../../../constants/cultural';
import styles from './CulturalContextDisplay.module.css';

export interface CulturalContext {
  id: string;
  sensitivityLevel: number;
  culturalOrigin: string;
  educationalContext: string;
  traditionalProtocols?: string[];
  communityInfo: {
    primaryCommunities: string[];
    elderApproval?: boolean;
    educationalPurpose: boolean;
    respectfulAccess: boolean;
    communityGuidelines?: string[];
  };
  historicalContext?: string;
  alternativePerspectives?: string[];
  sourceVerification?: {
    originalSource: string;
    verificationDate: Date;
    verificationMethod: string;
    authenticityScore: number;
    verifiedBy?: string[];
  };
  educationalResources?: {
    title: string;
    description: string;
    url?: string;
    type: 'article' | 'video' | 'book' | 'course' | 'website';
  }[];
  crossCulturalConnections?: {
    culture: string;
    connection: string;
    similarity: number;
  }[];
  learningObjectives?: string[];
  respectfulEngagement?: {
    guidelines: string[];
    dosList: string[];
    avoidList: string[];
  };
}

export interface CulturalContextDisplayProps {
  context: CulturalContext;
  expanded?: boolean;
  showEducationalContent?: boolean;
  showCommunityInfo?: boolean;
  showHistoricalContext?: boolean;
  showAlternativePerspectives?: boolean;
  showLearningResources?: boolean;
  showCrossCulturalConnections?: boolean;
  variant?: 'default' | 'compact' | 'detailed' | 'educational';
  culturalTheme?: 'indigenous' | 'traditional' | 'modern' | 'ceremonial' | 'community' | 'default';
  onClose?: () => void;
  onExpand?: (expanded: boolean) => void;
  onResourceClick?: (resource: any) => void;
  className?: string;
  ariaLabel?: string;
}

const CulturalContextDisplay: Component<CulturalContextDisplayProps> = props => {
  const [isExpanded, setIsExpanded] = createSignal(props.expanded || false);
  const [activeSection, setActiveSection] = createSignal<string | null>(null);
  const [showRespectfulEngagement, setShowRespectfulEngagement] = createSignal(false);

  const getSensitivityInfo = () => {
    const level = props.context.sensitivityLevel;
    const label = CULTURAL_LABELS[level] || 'Cultural Context';

    const colors = {
      1: { bg: '#f0f9ff', border: '#0ea5e9', text: '#0c4a6e' },
      2: { bg: '#fefce8', border: '#eab308', text: '#713f12' },
      3: { bg: '#fef2f2', border: '#ef4444', text: '#7f1d1d' },
      4: { bg: '#f3e8ff', border: '#a855f7', text: '#581c87' },
    };

    return {
      label,
      level,
      color: colors[level as keyof typeof colors] || colors[1],
    };
  };

  const handleExpand = () => {
    const newExpanded = !isExpanded();
    setIsExpanded(newExpanded);
    props.onExpand?.(newExpanded);
  };

  const handleSectionToggle = (section: string) => {
    setActiveSection(activeSection() === section ? null : section);
  };

  const displayClasses = () =>
    [
      styles['cultural-display'],
      styles[`variant-${props.variant || 'default'}`],
      props.culturalTheme && styles[`cultural-${props.culturalTheme}`],
      isExpanded() && styles['expanded'],
      props.className,
    ]
      .filter(Boolean)
      .join(' ');

  const sensitivityInfo = getSensitivityInfo();

  return (
    <Card
      class={displayClasses()}
      variant="outlined"
      aria-label={props.ariaLabel || `Cultural context for ${props.context.culturalOrigin}`}
    >
      {/* Cultural Context Header */}
      <div class={styles['context-header']}>
        <div class={styles['header-content']}>
          <div class={styles['context-icon']}>
            <Globe size={20} />
          </div>

          <div class={styles['context-info']}>
            <h3 class={styles['context-title']}>Cultural Context</h3>
            <div class={styles['context-meta']}>
              <span class={styles['cultural-origin']}>{props.context.culturalOrigin}</span>
              <div
                class={styles['sensitivity-badge']}
                style={{
                  'background-color': sensitivityInfo.color.bg,
                  'border-color': sensitivityInfo.color.border,
                  color: sensitivityInfo.color.text,
                }}
              >
                {sensitivityInfo.label}
              </div>
            </div>
          </div>

          <div class={styles['header-actions']}>
            <Show when={props.context.communityInfo.elderApproval}>
              <div class={styles['elder-approval']} title="Elder acknowledgment received">
                <Star size={16} />
                <span>Elder Acknowledged</span>
              </div>
            </Show>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpand}
              ariaLabel={isExpanded() ? 'Collapse context' : 'Expand context'}
            >
              {isExpanded() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>

            <Show when={props.onClose}>
              <Button
                variant="ghost"
                size="sm"
                onClick={props.onClose}
                ariaLabel="Close cultural context"
              >
                <X size={16} />
              </Button>
            </Show>
          </div>
        </div>

        {/* Educational Purpose Notice */}
        <div class={styles['educational-notice']}>
          <Info size={14} />
          <span>
            Cultural information provided for educational purposes only - promoting understanding
            and respect
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      <Show when={isExpanded()}>
        <div class={styles['context-content']}>
          {/* Educational Context */}
          <Show when={props.showEducationalContent !== false}>
            <div class={styles['content-section']}>
              <h4 class={styles['section-title']}>Educational Context</h4>
              <p class={styles['educational-text']}>{props.context.educationalContext}</p>
            </div>
          </Show>

          {/* Community Information */}
          <Show when={props.showCommunityInfo !== false && props.context.communityInfo}>
            <div class={styles['content-section']}>
              <button
                class={styles['section-toggle']}
                onClick={() => handleSectionToggle('community')}
                aria-expanded={activeSection() === 'community'}
              >
                <Users size={16} />
                <span>Community Information</span>
                {activeSection() === 'community' ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              <Show when={activeSection() === 'community'}>
                <div class={styles['section-content']}>
                  <div class={styles['community-info']}>
                    <div class={styles['community-item']}>
                      <strong>Primary Communities:</strong>
                      <div class={styles['community-list']}>
                        <For each={props.context.communityInfo.primaryCommunities}>
                          {community => <span class={styles['community-tag']}>{community}</span>}
                        </For>
                      </div>
                    </div>

                    <Show when={props.context.communityInfo.communityGuidelines?.length}>
                      <div class={styles['community-item']}>
                        <strong>Community Guidelines:</strong>
                        <ul class={styles['guidelines-list']}>
                          <For each={props.context.communityInfo.communityGuidelines}>
                            {guideline => <li>{guideline}</li>}
                          </For>
                        </ul>
                      </div>
                    </Show>
                  </div>
                </div>
              </Show>
            </div>
          </Show>

          {/* Traditional Protocols */}
          <Show when={props.context.traditionalProtocols?.length}>
            <div class={styles['content-section']}>
              <button
                class={styles['section-toggle']}
                onClick={() => handleSectionToggle('protocols')}
                aria-expanded={activeSection() === 'protocols'}
              >
                <BookOpen size={16} />
                <span>Traditional Protocols (Educational)</span>
                {activeSection() === 'protocols' ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              <Show when={activeSection() === 'protocols'}>
                <div class={styles['section-content']}>
                  <div class={styles['protocols-notice']}>
                    <Info size={14} />
                    <span>
                      These protocols are shared for educational understanding and cultural
                      awareness
                    </span>
                  </div>
                  <ul class={styles['protocols-list']}>
                    <For each={props.context.traditionalProtocols}>
                      {protocol => <li>{protocol}</li>}
                    </For>
                  </ul>
                </div>
              </Show>
            </div>
          </Show>

          {/* Historical Context */}
          <Show when={props.showHistoricalContext !== false && props.context.historicalContext}>
            <div class={styles['content-section']}>
              <button
                class={styles['section-toggle']}
                onClick={() => handleSectionToggle('historical')}
                aria-expanded={activeSection() === 'historical'}
              >
                <span>Historical Context</span>
                {activeSection() === 'historical' ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              <Show when={activeSection() === 'historical'}>
                <div class={styles['section-content']}>
                  <p class={styles['historical-text']}>{props.context.historicalContext}</p>
                </div>
              </Show>
            </div>
          </Show>

          {/* Alternative Perspectives (ANTI-CENSORSHIP) */}
          <Show
            when={
              props.showAlternativePerspectives !== false &&
              props.context.alternativePerspectives?.length
            }
          >
            <div class={styles['content-section']}>
              <button
                class={styles['section-toggle']}
                onClick={() => handleSectionToggle('perspectives')}
                aria-expanded={activeSection() === 'perspectives'}
              >
                <span>Multiple Perspectives</span>
                {activeSection() === 'perspectives' ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              <Show when={activeSection() === 'perspectives'}>
                <div class={styles['section-content']}>
                  <div class={styles['perspectives-notice']}>
                    <Info size={14} />
                    <span>
                      Supporting diverse viewpoints and interpretations for comprehensive
                      understanding
                    </span>
                  </div>
                  <ul class={styles['perspectives-list']}>
                    <For each={props.context.alternativePerspectives}>
                      {perspective => <li>{perspective}</li>}
                    </For>
                  </ul>
                </div>
              </Show>
            </div>
          </Show>

          {/* Learning Resources */}
          <Show
            when={
              props.showLearningResources !== false && props.context.educationalResources?.length
            }
          >
            <div class={styles['content-section']}>
              <button
                class={styles['section-toggle']}
                onClick={() => handleSectionToggle('resources')}
                aria-expanded={activeSection() === 'resources'}
              >
                <BookOpen size={16} />
                <span>Learning Resources</span>
                {activeSection() === 'resources' ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              <Show when={activeSection() === 'resources'}>
                <div class={styles['section-content']}>
                  <div class={styles['resources-grid']}>
                    <For each={props.context.educationalResources}>
                      {resource => (
                        <div
                          class={styles['resource-card']}
                          onClick={() => props.onResourceClick?.(resource)}
                        >
                          <div class={styles['resource-type']}>{resource.type}</div>
                          <h5 class={styles['resource-title']}>{resource.title}</h5>
                          <p class={styles['resource-description']}>{resource.description}</p>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </Show>

          {/* Cross-Cultural Connections */}
          <Show
            when={
              props.showCrossCulturalConnections !== false &&
              props.context.crossCulturalConnections?.length
            }
          >
            <div class={styles['content-section']}>
              <button
                class={styles['section-toggle']}
                onClick={() => handleSectionToggle('connections')}
                aria-expanded={activeSection() === 'connections'}
              >
                <Globe size={16} />
                <span>Cross-Cultural Connections</span>
                {activeSection() === 'connections' ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              <Show when={activeSection() === 'connections'}>
                <div class={styles['section-content']}>
                  <div class={styles['connections-list']}>
                    <For each={props.context.crossCulturalConnections}>
                      {connection => (
                        <div class={styles['connection-item']}>
                          <div class={styles['connection-culture']}>{connection.culture}</div>
                          <div class={styles['connection-description']}>
                            {connection.connection}
                          </div>
                          <div class={styles['similarity-score']}>
                            Similarity: {Math.round(connection.similarity * 100)}%
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </Show>

          {/* Respectful Engagement Guidelines */}
          <Show when={props.context.respectfulEngagement}>
            <div class={styles['content-section']}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowRespectfulEngagement(!showRespectfulEngagement())}
                class={styles['engagement-toggle']}
              >
                <Users size={14} />
                Respectful Engagement Guidelines
              </Button>

              <Show when={showRespectfulEngagement()}>
                <div class={styles['engagement-content']}>
                  <div class={styles['engagement-section']}>
                    <h5>Guidelines for Respectful Engagement</h5>
                    <ul>
                      <For each={props.context.respectfulEngagement!.guidelines}>
                        {guideline => <li>{guideline}</li>}
                      </For>
                    </ul>
                  </div>

                  <div class={styles['engagement-section']}>
                    <h5>Recommended Practices</h5>
                    <ul class={styles['do-list']}>
                      <For each={props.context.respectfulEngagement!.dosList}>
                        {item => <li>✓ {item}</li>}
                      </For>
                    </ul>
                  </div>

                  <div class={styles['engagement-section']}>
                    <h5>Please Avoid</h5>
                    <ul class={styles['avoid-list']}>
                      <For each={props.context.respectfulEngagement!.avoidList}>
                        {item => <li>✗ {item}</li>}
                      </For>
                    </ul>
                  </div>
                </div>
              </Show>
            </div>
          </Show>

          {/* Source Verification */}
          <Show when={props.context.sourceVerification}>
            <div class={styles['verification-section']}>
              <h4 class={styles['verification-title']}>Source Verification</h4>
              <div class={styles['verification-content']}>
                <div class={styles['verification-item']}>
                  <strong>Original Source:</strong>{' '}
                  {props.context.sourceVerification!.originalSource}
                </div>
                <div class={styles['verification-item']}>
                  <strong>Verification Date:</strong>{' '}
                  {props.context.sourceVerification!.verificationDate.toLocaleDateString()}
                </div>
                <div class={styles['verification-item']}>
                  <strong>Method:</strong> {props.context.sourceVerification!.verificationMethod}
                </div>
                <div class={styles['verification-item']}>
                  <strong>Authenticity Score:</strong>
                  <span class={styles['authenticity-score']}>
                    {Math.round(props.context.sourceVerification!.authenticityScore * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </Show>

      {/* Cultural Respect Footer */}
      <div class={styles['cultural-footer']}>
        <div class={styles['footer-content']}>
          <span class={styles['footer-text']}>
            This cultural information is shared with respect for {props.context.culturalOrigin}{' '}
            communities and is intended for educational purposes to promote understanding and
            cultural appreciation.
          </span>
        </div>
      </div>
    </Card>
  );
};

export default CulturalContextDisplay;
