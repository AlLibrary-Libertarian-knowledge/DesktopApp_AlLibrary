import { Component, createSignal, createEffect, Show, For, Switch, Match } from 'solid-js';
import { Card, Button, Input } from '../../components/foundation';
import { Search, Heart, Globe, Shield, Users, Code, Book } from 'lucide-solid';
import styles from './About.module.css';

// About page sections configuration
const ABOUT_SECTIONS = [
  {
    id: 'mission',
    title: 'Mission & Vision',
    icon: '🎯',
    description: 'Our purpose and values',
  },
  {
    id: 'contributors',
    title: 'Contributors',
    icon: '👥',
    description: 'Community members who make AlLibrary possible',
  },
  {
    id: 'organizations',
    title: 'Supporting Organizations',
    icon: '🏛️',
    description: 'Partners and supporters',
  },
  {
    id: 'cultural',
    title: 'Cultural Acknowledgments',
    icon: '🌍',
    description: 'Honoring traditional knowledge and communities',
  },
  {
    id: 'legal',
    title: 'Legal Information',
    icon: '⚖️',
    description: 'Licenses, compliance, and legal notices',
  },
  {
    id: 'technical',
    title: 'Technical Details',
    icon: '⚙️',
    description: 'Technology stack and development information',
  },
] as const;

// Mock data structures following the business rules specifications
interface MissionContent {
  primaryMission: string;
  antiCensorshipCommitment: string;
  culturalRespectPledge: string;
  communityEmpowerment: string;
  accessibilityCommitment: string;
}

interface Contributor {
  id: string;
  name: string;
  preferredName?: string;
  contributorType:
    | 'developer'
    | 'cultural_advisor'
    | 'elder'
    | 'community_member'
    | 'technical_expert';
  culturalAffiliation?: string;
  contributions: string[];
  contributionPeriodStart: string;
  publicRecognition: boolean;
  elderOrGuardian?: boolean;
}

interface CulturalAcknowledgment {
  id: string;
  culturalOrigin: string;
  specificCommunity: string;
  acknowledgmentText: string;
  culturalLanguageText?: string;
  communityApproved: boolean;
  elderApproved: boolean;
  usageContext: string[];
  lastCommunityReview: string;
}

/**
 * AboutPage Component
 * Implements comprehensive mission, contributor, and cultural acknowledgment display
 * Following SOLID principles and anti-censorship standards
 */
const AboutPage: Component = () => {
  const [activeSection, setActiveSection] = createSignal<string>('mission');
  const [searchQuery, setSearchQuery] = createSignal<string>('');

  // Mock mission content following business rules
  const missionContent: MissionContent = {
    primaryMission: 'Decentralized, culturally-respectful global knowledge sharing',
    antiCensorshipCommitment: 'Resistance to information control and manipulation',
    culturalRespectPledge: 'Sacred commitment to traditional knowledge protocols',
    communityEmpowerment: 'Democratic governance and community-driven development',
    accessibilityCommitment: 'Universal access regardless of geography or resources',
  };

  // Mock contributors data
  const contributors: Contributor[] = [
    {
      id: 'contrib1',
      name: 'AlLibrary Development Team',
      contributorType: 'developer',
      contributions: [
        'Core Application Development',
        'SOLID Architecture Implementation',
        'Anti-Censorship Framework',
      ],
      contributionPeriodStart: '2024-01-01',
      publicRecognition: true,
    },
    {
      id: 'contrib2',
      name: 'Indigenous Knowledge Guardians',
      preferredName: 'Traditional Knowledge Keepers',
      contributorType: 'elder',
      culturalAffiliation: 'Various Indigenous Communities Worldwide',
      contributions: [
        'Cultural Protocol Guidance',
        'Traditional Knowledge Frameworks',
        'Elder Wisdom Integration',
      ],
      contributionPeriodStart: '2024-01-15',
      publicRecognition: true,
      elderOrGuardian: true,
    },
    {
      id: 'contrib3',
      name: 'Community Cultural Advisors',
      contributorType: 'cultural_advisor',
      contributions: [
        'Cultural Sensitivity Guidelines',
        'Educational Context Development',
        'Community Engagement',
      ],
      contributionPeriodStart: '2024-02-01',
      publicRecognition: true,
    },
  ];

  // Mock cultural acknowledgments following business rules
  const culturalAcknowledgments: CulturalAcknowledgment[] = [
    {
      id: 'ack1',
      culturalOrigin: 'Indigenous Communities Worldwide',
      specificCommunity: 'Traditional Knowledge Keepers',
      acknowledgmentText:
        'We respectfully acknowledge and honor the traditional knowledge systems, cultural protocols, and sacred wisdom of Indigenous communities worldwide. AlLibrary is built with deep respect for traditional knowledge and commits to supporting Indigenous data sovereignty.',
      communityApproved: true,
      elderApproved: true,
      usageContext: ['Educational', 'Cultural Preservation', 'Knowledge Sharing'],
      lastCommunityReview: '2024-06-01',
    },
    {
      id: 'ack2',
      culturalOrigin: 'Global Cultural Communities',
      specificCommunity: 'Diverse Cultural Traditions',
      acknowledgmentText:
        'We acknowledge the rich diversity of cultural knowledge traditions worldwide and commit to respectful representation, educational context, and cultural sovereignty in all knowledge sharing activities.',
      communityApproved: true,
      elderApproved: true,
      usageContext: ['Cultural Education', 'Cross-Cultural Understanding'],
      lastCommunityReview: '2024-06-01',
    },
  ];

  const filteredContributors = () => {
    if (!searchQuery()) return contributors;

    const query = searchQuery().toLowerCase();
    return contributors.filter(
      contributor =>
        contributor.name.toLowerCase().includes(query) ||
        contributor.contributorType.toLowerCase().includes(query) ||
        (contributor.culturalAffiliation &&
          contributor.culturalAffiliation.toLowerCase().includes(query))
    );
  };

  // Mission Section Component
  const MissionSection: Component = () => (
    <div class={styles.missionSection}>
      <div class={styles.missionHeader}>
        <h2>
          <Globe class={styles.sectionIcon} />
          Mission & Vision
        </h2>
        <p class={styles.missionSubtitle}>
          Democratizing knowledge while honoring cultural sovereignty
        </p>
      </div>

      <div class={styles.missionGrid}>
        <Card class={styles.missionCard}>
          <h3>
            <Heart class={styles.cardIcon} />
            Primary Mission
          </h3>
          <p>{missionContent.primaryMission}</p>
        </Card>

        <Card class={styles.missionCard}>
          <h3>
            <Shield class={styles.cardIcon} />
            Anti-Censorship Commitment
          </h3>
          <p>{missionContent.antiCensorshipCommitment}</p>
        </Card>

        <Card class={styles.missionCard}>
          <h3>
            <Users class={styles.cardIcon} />
            Cultural Respect
          </h3>
          <p>{missionContent.culturalRespectPledge}</p>
        </Card>

        <Card class={styles.missionCard}>
          <h3>
            <Globe class={styles.cardIcon} />
            Community Empowerment
          </h3>
          <p>{missionContent.communityEmpowerment}</p>
        </Card>
      </div>

      <div class={styles.visionStatement}>
        <h3>Our Vision</h3>
        <p>
          A world where knowledge flows freely while cultural protocols are respected, where
          traditional wisdom and modern information coexist harmoniously, and where communities
          maintain sovereignty over their cultural heritage while contributing to global
          understanding.
        </p>
      </div>
    </div>
  );

  // Contributors Section Component
  const ContributorsSection: Component = () => (
    <div class={styles.contributorsSection}>
      <div class={styles.sectionHeader}>
        <h2>
          <Users class={styles.sectionIcon} />
          Contributors & Community
        </h2>
        <p>Honoring those who make AlLibrary possible</p>
      </div>

      <div class={styles.contributorsGrid}>
        <For each={filteredContributors()}>
          {contributor => (
            <Card
              class={`${styles.contributorCard} ${contributor.elderOrGuardian ? styles.elderCard : ''}`}
            >
              <div class={styles.contributorHeader}>
                <h3>{contributor.preferredName || contributor.name}</h3>
                {contributor.elderOrGuardian && (
                  <span class={styles.elderBadge}>Elder/Guardian</span>
                )}
              </div>

              <div class={styles.contributorType}>
                {contributor.contributorType.replace('_', ' ').toUpperCase()}
              </div>

              {contributor.culturalAffiliation && (
                <div class={styles.culturalAffiliation}>
                  Cultural Affiliation: {contributor.culturalAffiliation}
                </div>
              )}

              <div class={styles.contributions}>
                <h4>Contributions:</h4>
                <ul>
                  <For each={contributor.contributions}>
                    {contribution => <li>{contribution}</li>}
                  </For>
                </ul>
              </div>

              <div class={styles.contributionPeriod}>
                Contributing since:{' '}
                {new Date(contributor.contributionPeriodStart).toLocaleDateString()}
              </div>
            </Card>
          )}
        </For>
      </div>
    </div>
  );

  // Cultural Acknowledgments Section Component
  const CulturalAcknowledgmentsSection: Component = () => (
    <div class={styles.culturalSection}>
      <div class={styles.sectionHeader}>
        <h2>
          <Globe class={styles.sectionIcon} />
          Cultural Acknowledgments
        </h2>
        <p>Honoring traditional knowledge and cultural sovereignty</p>
      </div>

      <div class={styles.acknowledgmentNotice}>
        <div class={styles.noticeHeader}>
          <Shield class={styles.noticeIcon} />
          <h3>Cultural Respect Commitment</h3>
        </div>
        <p>
          AlLibrary is built on the foundation of cultural respect and traditional knowledge
          sovereignty. All cultural information displayed is for educational purposes only and never
          restricts access to content or functionality. We honor the wisdom of traditional knowledge
          keepers while supporting information freedom and multiple perspectives.
        </p>
      </div>

      <div class={styles.acknowledgmentsList}>
        <For each={culturalAcknowledgments}>
          {acknowledgment => (
            <Card class={styles.acknowledgmentCard}>
              <div class={styles.acknowledgmentHeader}>
                <h3>{acknowledgment.culturalOrigin}</h3>
                <div class={styles.approvalBadges}>
                  {acknowledgment.communityApproved && (
                    <span class={styles.approvedBadge}>Community Approved</span>
                  )}
                  {acknowledgment.elderApproved && (
                    <span class={styles.elderApprovedBadge}>Elder Approved</span>
                  )}
                </div>
              </div>

              <div class={styles.specificCommunity}>
                Specific Community: {acknowledgment.specificCommunity}
              </div>

              <div class={styles.acknowledgmentText}>{acknowledgment.acknowledgmentText}</div>

              <div class={styles.usageContext}>
                <h4>Context of Use:</h4>
                <div class={styles.contextTags}>
                  <For each={acknowledgment.usageContext}>
                    {context => <span class={styles.contextTag}>{context}</span>}
                  </For>
                </div>
              </div>

              <div class={styles.reviewDate}>
                Last Community Review:{' '}
                {new Date(acknowledgment.lastCommunityReview).toLocaleDateString()}
              </div>
            </Card>
          )}
        </For>
      </div>
    </div>
  );

  // Legal Information Section Component
  const LegalInformationSection: Component = () => (
    <div class={styles.legalSection}>
      <div class={styles.sectionHeader}>
        <h2>Legal Information & Compliance</h2>
        <p>Transparency in licensing, governance, and compliance</p>
      </div>

      <div class={styles.legalGrid}>
        <Card class={styles.legalCard}>
          <h3>Software Licensing</h3>
          <ul>
            <li>
              <strong>Primary License:</strong> GNU AGPLv3 for core application code
            </li>
            <li>
              <strong>Component Licenses:</strong> Individual licenses for third-party components
            </li>
            <li>
              <strong>Cultural Protocol License:</strong> Special licensing for cultural protocol
              implementations
            </li>
            <li>
              <strong>Document Licenses:</strong> Respect for individual document licensing and
              copyright
            </li>
          </ul>
        </Card>

        <Card class={styles.legalCard}>
          <h3>Privacy & Data Protection</h3>
          <ul>
            <li>
              <strong>Local Storage:</strong> All data stored locally on user's device
            </li>
            <li>
              <strong>Cultural Data Protection:</strong> Special protections for traditional
              knowledge
            </li>
            <li>
              <strong>User Data Rights:</strong> Complete user control over personal data
            </li>
            <li>
              <strong>No Central Servers:</strong> Decentralized architecture protects privacy
            </li>
          </ul>
        </Card>

        <Card class={styles.legalCard}>
          <h3>Cultural Compliance</h3>
          <ul>
            <li>
              <strong>Traditional Knowledge Rights:</strong> Recognition and protection of
              traditional knowledge rights
            </li>
            <li>
              <strong>Community Intellectual Property:</strong> Respect for community-owned
              intellectual property
            </li>
            <li>
              <strong>Cultural Sovereignty:</strong> Support for Indigenous data sovereignty
            </li>
            <li>
              <strong>Educational Use:</strong> Cultural information for educational purposes only
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );

  // Technical Information Section Component
  const TechnicalInformationSection: Component = () => (
    <div class={styles.technicalSection}>
      <div class={styles.sectionHeader}>
        <h2>
          <Code class={styles.sectionIcon} />
          Technical Information
        </h2>
        <p>Technology stack and development transparency</p>
      </div>

      <div class={styles.techGrid}>
        <Card class={styles.techCard}>
          <h3>Frontend Framework</h3>
          <ul>
            <li>
              <strong>Framework:</strong> SolidJS with TypeScript
            </li>
            <li>
              <strong>Styling:</strong> CSS Modules with responsive design
            </li>
            <li>
              <strong>Icons:</strong> Lucide Solid icon library
            </li>
            <li>
              <strong>Architecture:</strong> SOLID principles throughout
            </li>
          </ul>
        </Card>

        <Card class={styles.techCard}>
          <h3>Backend & Desktop</h3>
          <ul>
            <li>
              <strong>Runtime:</strong> Rust + Tauri v2 desktop application
            </li>
            <li>
              <strong>Database:</strong> SQLite for local storage
            </li>
            <li>
              <strong>Security:</strong> Multi-layer validation and scanning
            </li>
            <li>
              <strong>Platform:</strong> Cross-platform desktop application
            </li>
          </ul>
        </Card>

        <Card class={styles.techCard}>
          <h3>Network & P2P</h3>
          <ul>
            <li>
              <strong>P2P Protocol:</strong> libp2p for peer-to-peer communication
            </li>
            <li>
              <strong>Content Addressing:</strong> IPFS for distributed content
            </li>
            <li>
              <strong>Anonymous Networking:</strong> TOR integration for privacy
            </li>
            <li>
              <strong>Decentralization:</strong> No central servers or dependencies
            </li>
          </ul>
        </Card>

        <Card class={styles.techCard}>
          <h3>Development Practices</h3>
          <ul>
            <li>
              <strong>Testing:</strong> Comprehensive test coverage with Vitest
            </li>
            <li>
              <strong>Code Quality:</strong> TypeScript strict mode &gt;95% coverage
            </li>
            <li>
              <strong>Documentation:</strong> Complete API and user documentation
            </li>
            <li>
              <strong>Open Source:</strong> Transparent development process
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );

  return (
    <div class={styles.aboutPage}>
      {/* Page Header */}
      <div class={styles.pageHeader}>
        <h1>
          <Book class={styles.pageIcon} />
          About AlLibrary
        </h1>
        <p class={styles.pageSubtitle}>
          Decentralized knowledge sharing with cultural respect and information freedom
        </p>
      </div>

      {/* Navigation */}
      <div class={styles.aboutNavigation}>
        <div class={styles.searchContainer}>
          <Input
            type="text"
            placeholder="Search contributors, organizations, or content..."
            value={searchQuery()}
            onInput={e => setSearchQuery(e.currentTarget.value)}
            class={styles.searchInput}
          />
          <Search class={styles.searchIcon} />
        </div>

        <div class={styles.sectionTabs}>
          <For each={ABOUT_SECTIONS}>
            {section => (
              <Button
                variant={activeSection() === section.id ? 'primary' : 'secondary'}
                onClick={() => setActiveSection(section.id)}
                class={styles.sectionTab}
              >
                <span class={styles.tabIcon}>{section.icon}</span>
                {section.title}
              </Button>
            )}
          </For>
        </div>
      </div>

      {/* Main Content */}
      <div class={styles.aboutContent}>
        <Switch>
          <Match when={activeSection() === 'mission'}>
            <MissionSection />
          </Match>

          <Match when={activeSection() === 'contributors'}>
            <ContributorsSection />
          </Match>

          <Match when={activeSection() === 'cultural'}>
            <CulturalAcknowledgmentsSection />
          </Match>

          <Match when={activeSection() === 'legal'}>
            <LegalInformationSection />
          </Match>

          <Match when={activeSection() === 'technical'}>
            <TechnicalInformationSection />
          </Match>
        </Switch>
      </div>

      {/* Footer */}
      <div class={styles.aboutFooter}>
        <p>
          Last Updated: {new Date().toLocaleDateString()} | Version: 1.0.0 | Built with respect for
          cultural sovereignty and information freedom
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
