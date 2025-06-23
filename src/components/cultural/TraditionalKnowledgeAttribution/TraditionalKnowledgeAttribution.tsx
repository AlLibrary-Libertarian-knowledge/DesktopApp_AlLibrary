import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { Card } from '@/components/foundation/Card';
import { Button } from '@/components/foundation/Button';
import { Badge } from '@/components/foundation/Badge';
import { Collapsible } from '@/components/foundation/Collapsible';
import { Modal } from '@/components/foundation/Modal';
import { Textarea } from '@/components/foundation/Textarea';
import type {
  TraditionalKnowledgeAttributionProps,
  AttributionInformation,
  ProvenanceRecord,
  CommunityAcknowledgment,
  SourceInformation,
  TraditionalOwnership,
  EducationalAttribution,
  VerificationStatus,
  ConfidenceLevel,
  AttributionType,
  SourceType,
} from './types/TraditionalKnowledgeAttributionTypes';
import styles from './TraditionalKnowledgeAttribution.module.css';

/**
 * TraditionalKnowledgeAttribution component for source tracking and provenance display
 *
 * @example
 * ```tsx
 * <TraditionalKnowledgeAttribution
 *   content={attributableContent}
 *   showProvenanceChain={true}
 *   showEducationalContext={true}
 *   onAttributionUpdated={handleAttributionUpdate}
 * />
 * ```
 *
 * @cultural-considerations
 * - Displays source attribution and provenance transparently
 * - Respects traditional ownership through information display
 * - Supports multiple perspectives and conflicting attributions
 * - NO ACCESS CONTROL - information display only
 *
 * @accessibility
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - High contrast mode support
 * - Focus management for complex attribution data
 *
 * @performance
 * - Efficient rendering of complex attribution hierarchies
 * - Lazy loading of detailed provenance information
 * - Optimized for large attribution datasets
 */
export const TraditionalKnowledgeAttribution: Component<
  TraditionalKnowledgeAttributionProps
> = props => {
  // State management
  const [selectedAttribution, setSelectedAttribution] = createSignal<AttributionInformation>(
    props.content.attribution
  );
  const [showProvenanceDetails, setShowProvenanceDetails] = createSignal(
    props.showProvenanceChain ?? true
  );
  const [showEducational, setShowEducational] = createSignal(props.showEducationalContext ?? true);
  const [showCommunityAck, setShowCommunityAck] = createSignal(
    props.showCommunityAcknowledgments ?? true
  );
  const [expandedSections, setExpandedSections] = createSignal<Set<string>>(new Set());
  const [showAlternativeModal, setShowAlternativeModal] = createSignal(false);
  const [selectedAlternative, setSelectedAlternative] = createSignal<AttributionInformation | null>(
    null
  );
  const [additionalNotesModal, setAdditionalNotesModal] = createSignal(false);
  const [additionalNotes, setAdditionalNotes] = createSignal('');

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const expanded = expandedSections();
    const newExpanded = new Set(expanded);
    if (expanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Handle attribution selection
  const handleAttributionSelection = (attribution: AttributionInformation) => {
    setSelectedAttribution(attribution);
    props.onAttributionUpdated?.(attribution);
  };

  // Handle alternative attribution viewing
  const viewAlternativeAttribution = (alternative: AttributionInformation) => {
    setSelectedAlternative(alternative);
    setShowAlternativeModal(true);
  };

  // Handle educational context access
  const handleEducationalAccess = (contextType: string) => {
    props.onEducationalContextAccessed?.(contextType);
  };

  // Handle additional notes
  const handleAdditionalNotes = () => {
    if (additionalNotes().trim()) {
      // In a real implementation, this would save the notes
      console.log('Additional notes added:', additionalNotes());
      setAdditionalNotesModal(false);
      setAdditionalNotes('');
    }
  };

  // Get verification status styling
  const getVerificationStatusClass = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return styles.statusVerified;
      case 'partially-verified':
        return styles.statusPartial;
      case 'pending-verification':
        return styles.statusPending;
      case 'disputed':
        return styles.statusDisputed;
      case 'multiple-sources':
        return styles.statusMultiple;
      case 'unverified':
        return styles.statusUnverified;
      case 'under-review':
        return styles.statusReview;
      default:
        return styles.statusUnknown;
    }
  };

  // Get confidence level styling
  const getConfidenceLevelClass = (level: ConfidenceLevel) => {
    switch (level) {
      case 'very-high':
        return styles.confidenceVeryHigh;
      case 'high':
        return styles.confidenceHigh;
      case 'medium':
        return styles.confidenceMedium;
      case 'low':
        return styles.confidenceLow;
      case 'very-low':
        return styles.confidenceVeryLow;
      case 'uncertain':
        return styles.confidenceUncertain;
      default:
        return styles.confidenceMedium;
    }
  };

  // Get attribution type display
  const getAttributionTypeDisplay = (type: AttributionType) => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get source type display
  const getSourceTypeDisplay = (type: SourceType) => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div class={styles.traditionalKnowledgeAttribution}>
      {/* Header Section */}
      <div class={styles.header}>
        <h2 class={styles.title}>Traditional Knowledge Attribution</h2>
        <p class={styles.subtitle}>
          Source tracking and provenance information for educational transparency
        </p>

        <div class={styles.headerActions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEducational(!showEducational())}
            aria-label="Toggle educational context"
          >
            {showEducational() ? 'Hide' : 'Show'} Educational Context
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProvenanceDetails(!showProvenanceDetails())}
            aria-label="Toggle provenance details"
          >
            {showProvenanceDetails() ? 'Hide' : 'Show'} Provenance Chain
          </Button>
        </div>
      </div>

      {/* Educational Context Panel */}
      <Show when={showEducational()}>
        <Card class={styles.educationalPanel}>
          <Card.Header>
            <Card.Title>Attribution & Provenance - Educational Context</Card.Title>
          </Card.Header>
          <Card.Content>
            <div class={styles.educationalContent}>
              <div class={styles.principleSection}>
                <h4>Attribution Principles</h4>
                <ul>
                  <li>• Source information displayed transparently</li>
                  <li>• Traditional ownership acknowledged respectfully</li>
                  <li>• Multiple perspectives supported equally</li>
                  <li>• Provenance tracked for educational purposes</li>
                </ul>
              </div>

              <div class={styles.transparencySection}>
                <h4>Information Transparency</h4>
                <ul>
                  <li>• All attribution information freely accessible</li>
                  <li>• Community acknowledgments displayed</li>
                  <li>• Verification methods explained</li>
                  <li>• Alternative attributions supported</li>
                </ul>
              </div>
            </div>
          </Card.Content>
        </Card>
      </Show>

      {/* Content Overview */}
      <Card class={styles.contentOverview}>
        <Card.Header>
          <div class={styles.contentHeader}>
            <Card.Title class={styles.contentTitle}>{props.content.title}</Card.Title>
            <div class={styles.contentBadges}>
              <Badge variant="outline">{props.content.type}</Badge>
              <Badge
                variant="outline"
                class={getVerificationStatusClass(props.content.verificationStatus)}
              >
                {props.content.verificationStatus}
              </Badge>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          <p class={styles.contentDescription}>{props.content.description}</p>

          <div class={styles.contentMetadata}>
            <div class={styles.metadataItem}>
              <span class={styles.metadataLabel}>Documented:</span>
              <span class={styles.metadataValue}>
                {new Date(props.content.documentedDate).toLocaleDateString()}
              </span>
            </div>
            <Show when={props.content.lastVerified}>
              <div class={styles.metadataItem}>
                <span class={styles.metadataLabel}>Last Verified:</span>
                <span class={styles.metadataValue}>
                  {new Date(props.content.lastVerified!).toLocaleDateString()}
                </span>
              </div>
            </Show>
          </div>
        </Card.Content>
      </Card>

      {/* Primary Attribution */}
      <Card class={styles.primaryAttribution}>
        <Card.Header>
          <Card.Title>Primary Attribution</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class={styles.attributionDetails}>
            <div class={styles.attributionHeader}>
              <div class={styles.attributionType}>
                <span class={styles.typeLabel}>Type:</span>
                <Badge variant="outline" size="lg">
                  {getAttributionTypeDisplay(selectedAttribution().attributionType)}
                </Badge>
              </div>
              <div class={styles.confidenceLevel}>
                <span class={styles.confidenceLabel}>Confidence:</span>
                <Badge
                  variant="outline"
                  class={getConfidenceLevelClass(selectedAttribution().confidenceLevel)}
                >
                  {selectedAttribution().confidenceLevel}
                </Badge>
              </div>
            </div>

            {/* Primary Source Information */}
            <div class={styles.sourceSection}>
              <h4>Primary Source</h4>
              <div class={styles.sourceCard}>
                <div class={styles.sourceName}>{selectedAttribution().primarySource.name}</div>
                <div class={styles.sourceType}>
                  Type: {getSourceTypeDisplay(selectedAttribution().primarySource.sourceType)}
                </div>
                <div class={styles.sourceOrigin}>
                  Cultural Origin: {selectedAttribution().primarySource.culturalOrigin}
                </div>
                <p class={styles.sourceDescription}>
                  {selectedAttribution().primarySource.description}
                </p>

                <Show when={selectedAttribution().primarySource.timePeriod}>
                  <div class={styles.timePeriod}>
                    <strong>Time Period:</strong>{' '}
                    {selectedAttribution().primarySource.timePeriod!.description}
                  </div>
                </Show>

                <div class={styles.credibilityScore}>
                  <span>Credibility Score: </span>
                  <Badge variant="outline">
                    {selectedAttribution().primarySource.credibility.score}/10
                  </Badge>
                </div>
              </div>
            </div>

            {/* Traditional Ownership */}
            <Show when={selectedAttribution().traditionalOwnership}>
              <div class={styles.ownershipSection}>
                <h4>Traditional Ownership</h4>
                <div class={styles.ownershipCard}>
                  <div class={styles.owningCommunity}>
                    <strong>Community:</strong>{' '}
                    {selectedAttribution().traditionalOwnership!.owningCommunity}
                  </div>
                  <div class={styles.ownershipType}>
                    <strong>Type:</strong>{' '}
                    {selectedAttribution().traditionalOwnership!.ownershipType}
                  </div>
                  <div class={styles.culturalSignificance}>
                    <strong>Cultural Significance:</strong>
                    <p>{selectedAttribution().traditionalOwnership!.culturalSignificance}</p>
                  </div>

                  <Show when={selectedAttribution().traditionalOwnership!.educationalSharingNotes}>
                    <div class={styles.sharingNotes}>
                      <strong>Educational Sharing Notes:</strong>
                      <p>{selectedAttribution().traditionalOwnership!.educationalSharingNotes}</p>
                    </div>
                  </Show>
                </div>
              </div>
            </Show>

            {/* Verification Information */}
            <div class={styles.verificationSection}>
              <h4>Source Verification</h4>
              <div class={styles.verificationCard}>
                <div class={styles.verificationStatus}>
                  <span>Status: </span>
                  <Badge
                    variant="outline"
                    class={getVerificationStatusClass(selectedAttribution().verification.status)}
                  >
                    {selectedAttribution().verification.status}
                  </Badge>
                </div>

                <div class={styles.verificationMethods}>
                  <strong>Verification Methods:</strong>
                  <div class={styles.methodsList}>
                    <For each={selectedAttribution().verification.methods}>
                      {method => (
                        <Badge variant="outline" size="sm">
                          {method}
                        </Badge>
                      )}
                    </For>
                  </div>
                </div>

                <div class={styles.verificationDate}>
                  <strong>Verified:</strong>{' '}
                  {new Date(
                    selectedAttribution().verification.verificationDate
                  ).toLocaleDateString()}
                </div>

                <div class={styles.verifiedBy}>
                  <strong>Verified By:</strong>
                  <div class={styles.verifiersList}>
                    <For each={selectedAttribution().verification.verifiedBy}>
                      {verifier => (
                        <div class={styles.verifierCard}>
                          <span class={styles.verifierName}>{verifier.name}</span>
                          <Badge variant="outline" size="sm">
                            {verifier.type}
                          </Badge>
                        </div>
                      )}
                    </For>
                  </div>
                </div>

                <div class={styles.confidenceScore}>
                  <strong>Confidence Score:</strong>{' '}
                  {selectedAttribution().verification.confidenceScore}/10
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Alternative Attributions */}
      <Show
        when={
          props.content.alternativeAttributions && props.content.alternativeAttributions.length > 0
        }
      >
        <Card class={styles.alternativeAttributions}>
          <Card.Header>
            <Card.Title>Alternative Attributions</Card.Title>
            <p class={styles.alternativeNote}>
              Multiple perspectives and sources provide different attribution information
            </p>
          </Card.Header>
          <Card.Content>
            <div class={styles.alternativesList}>
              <For each={props.content.alternativeAttributions}>
                {alternative => (
                  <div class={styles.alternativeCard}>
                    <div class={styles.alternativeHeader}>
                      <div class={styles.alternativeSource}>{alternative.primarySource.name}</div>
                      <Badge
                        variant="outline"
                        class={getConfidenceLevelClass(alternative.confidenceLevel)}
                      >
                        {alternative.confidenceLevel}
                      </Badge>
                    </div>
                    <div class={styles.alternativeType}>
                      {getAttributionTypeDisplay(alternative.attributionType)}
                    </div>
                    <div class={styles.alternativeActions}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewAlternativeAttribution(alternative)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAttributionSelection(alternative)}
                      >
                        Select as Primary
                      </Button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Card.Content>
        </Card>
      </Show>

      {/* Provenance Chain */}
      <Show when={showProvenanceDetails() && selectedAttribution().provenanceChain.length > 0}>
        <Card class={styles.provenanceChain}>
          <Card.Header>
            <Card.Title>Provenance Chain</Card.Title>
            <p class={styles.provenanceNote}>
              Complete tracking of source information from origin to current form
            </p>
          </Card.Header>
          <Card.Content>
            <div class={styles.provenanceTimeline}>
              <For each={selectedAttribution().provenanceChain.sort((a, b) => a.step - b.step)}>
                {record => (
                  <div class={styles.provenanceStep}>
                    <div class={styles.stepNumber}>{record.step}</div>
                    <div class={styles.stepContent}>
                      <div class={styles.stepHeader}>
                        <div class={styles.stepDescription}>{record.description}</div>
                        <div class={styles.stepDate}>
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                      </div>

                      <div class={styles.responsibleParty}>
                        <strong>Responsible:</strong> {record.responsible.name}
                        <Show when={record.responsible.role}>
                          <span class={styles.partyRole}>({record.responsible.role})</span>
                        </Show>
                      </div>

                      <Show when={record.changes && record.changes.length > 0}>
                        <div class={styles.stepChanges}>
                          <strong>Changes:</strong>
                          <ul>
                            <For each={record.changes}>{change => <li>{change}</li>}</For>
                          </ul>
                        </div>
                      </Show>

                      <Show when={record.context}>
                        <div class={styles.stepContext}>
                          <strong>Context:</strong> {record.context}
                        </div>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Card.Content>
        </Card>
      </Show>

      {/* Community Acknowledgments */}
      <Show
        when={
          showCommunityAck &&
          props.content.communityAcknowledgments &&
          props.content.communityAcknowledgments.length > 0
        }
      >
        <Card class={styles.communityAcknowledgments}>
          <Card.Header>
            <Card.Title>Community Acknowledgments</Card.Title>
            <p class={styles.acknowledgmentNote}>
              Community responses and acknowledgments regarding this attribution
            </p>
          </Card.Header>
          <Card.Content>
            <div class={styles.acknowledgmentsList}>
              <For each={props.content.communityAcknowledgments}>
                {ack => (
                  <div class={styles.acknowledgmentCard}>
                    <div class={styles.acknowledgmentHeader}>
                      <div class={styles.acknowledgmentCommunity}>{ack.community}</div>
                      <Badge variant="outline">{ack.acknowledgmentType}</Badge>
                    </div>

                    <div class={styles.acknowledgmentMessage}>{ack.message}</div>

                    <div class={styles.acknowledgmentMeta}>
                      <div class={styles.acknowledgmentDate}>
                        {new Date(ack.dateProvided).toLocaleDateString()}
                      </div>
                      <Show when={ack.providedBy}>
                        <div class={styles.acknowledgmentProvider}>
                          by {ack.providedBy!.name}
                          <Show when={ack.providedBy!.role}>
                            <span class={styles.providerRole}>({ack.providedBy!.role})</span>
                          </Show>
                        </div>
                      </Show>
                    </div>

                    <Show when={ack.additionalContext}>
                      <div class={styles.additionalContext}>
                        <strong>Additional Context:</strong> {ack.additionalContext}
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Card.Content>
        </Card>
      </Show>

      {/* Educational Attribution */}
      <Show when={props.content.educationalContext}>
        <Card class={styles.educationalAttribution}>
          <Card.Header>
            <Card.Title>Educational Attribution Context</Card.Title>
          </Card.Header>
          <Card.Content>
            <div class={styles.educationalDetails}>
              <div class={styles.educationalPurpose}>
                <strong>Educational Purpose:</strong>
                <p>{props.content.educationalContext!.purpose}</p>
              </div>

              <div class={styles.learningObjectives}>
                <strong>Learning Objectives:</strong>
                <ul>
                  <For each={props.content.educationalContext!.learningObjectives}>
                    {objective => <li>{objective}</li>}
                  </For>
                </ul>
              </div>

              <div class={styles.culturalContextExplanation}>
                <strong>Cultural Context:</strong>
                <p>{props.content.educationalContext!.culturalContextExplanation}</p>
              </div>

              <Show when={props.content.educationalContext!.resources.length > 0}>
                <div class={styles.educationalResources}>
                  <strong>Educational Resources:</strong>
                  <div class={styles.resourcesList}>
                    <For each={props.content.educationalContext!.resources}>
                      {resource => (
                        <div class={styles.resourceCard}>
                          <div class={styles.resourceTitle}>{resource.title}</div>
                          <div class={styles.resourceType}>{resource.type}</div>
                          <div class={styles.resourceDescription}>{resource.description}</div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEducationalAccess(resource.type)}
                          >
                            Access Resource
                          </Button>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </Card.Content>
        </Card>
      </Show>

      {/* Action Buttons */}
      <Show when={props.allowAdditionalEntries}>
        <div class={styles.actions}>
          <Button variant="outline" onClick={() => setAdditionalNotesModal(true)}>
            Add Notes
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              // In a real implementation, this would save the current state
              console.log('Attribution information saved');
            }}
          >
            Save Attribution
          </Button>
        </div>
      </Show>

      {/* Alternative Attribution Modal */}
      <Modal
        isOpen={showAlternativeModal()}
        onClose={() => setShowAlternativeModal(false)}
        title="Alternative Attribution Details"
        size="lg"
      >
        <Show when={selectedAlternative()}>
          <div class={styles.modalContent}>
            <div class={styles.alternativeDetails}>
              <h4>Source: {selectedAlternative()!.primarySource.name}</h4>
              <p>{selectedAlternative()!.primarySource.description}</p>

              <div class={styles.alternativeVerification}>
                <strong>Verification Status:</strong> {selectedAlternative()!.verification.status}
              </div>

              <div class={styles.alternativeConfidence}>
                <strong>Confidence Level:</strong> {selectedAlternative()!.confidenceLevel}
              </div>

              <Show when={selectedAlternative()!.notes}>
                <div class={styles.alternativeNotes}>
                  <strong>Notes:</strong>
                  <p>{selectedAlternative()!.notes}</p>
                </div>
              </Show>
            </div>

            <div class={styles.modalActions}>
              <Button variant="outline" onClick={() => setShowAlternativeModal(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleAttributionSelection(selectedAlternative()!);
                  setShowAlternativeModal(false);
                }}
              >
                Use This Attribution
              </Button>
            </div>
          </div>
        </Show>
      </Modal>

      {/* Additional Notes Modal */}
      <Modal
        isOpen={additionalNotesModal()}
        onClose={() => setAdditionalNotesModal(false)}
        title="Add Additional Notes"
        size="md"
      >
        <div class={styles.notesModalContent}>
          <p>Add additional information or context about this attribution:</p>
          <Textarea
            value={additionalNotes()}
            onInput={e => setAdditionalNotes(e.currentTarget.value)}
            placeholder="Enter your notes here..."
            rows={6}
            class={styles.notesInput}
          />

          <div class={styles.modalActions}>
            <Button variant="outline" onClick={() => setAdditionalNotesModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAdditionalNotes}
              disabled={!additionalNotes().trim()}
            >
              Save Notes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
