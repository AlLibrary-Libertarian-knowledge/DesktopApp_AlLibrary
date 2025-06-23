/**
 * TypeScript types for CommunityNetworks component
 * Supports cultural community overlay networks with educational focus
 */

export interface CommunityNetwork {
  /** Unique identifier for the community network */
  id: string;

  /** Display name of the community network */
  name: string;

  /** Detailed description of the network's purpose and focus */
  description: string;

  /** Cultural sensitivity level (1-3) for educational context only */
  culturalSensitivityLevel: 1 | 2 | 3;

  /** Cultural context information for educational purposes */
  culturalContext: string;

  /** Primary cultural region or origin */
  culturalRegion: string;

  /** Primary language used in the network */
  primaryLanguage: string;

  /** Current number of active members */
  memberCount: number;

  /** Network creation timestamp */
  createdAt: string;

  /** Last activity timestamp */
  lastActivity: string;

  /** Network category for organization */
  category: CommunityNetworkCategory;

  /** Educational resources available in this network */
  educationalResources?: string[];

  /** Traditional knowledge areas covered */
  knowledgeAreas?: string[];

  /** Network status */
  status: 'active' | 'inactive' | 'maintenance';

  /** Network visibility */
  visibility: 'public' | 'discoverable' | 'invitation-only';

  /** Cultural protocols for educational reference (information only) */
  culturalProtocols?: CulturalProtocol[];

  /** Network moderators/elders for educational guidance */
  culturalGuides?: CulturalGuide[];

  /** Available learning paths */
  learningPaths?: LearningPath[];
}

export interface NetworkParticipation {
  /** Network identifier */
  networkId: string;

  /** User identifier */
  userId: string;

  /** Participation status */
  isActive: boolean;

  /** Join timestamp */
  joinedAt: string;

  /** Last interaction timestamp */
  lastInteraction: string;

  /** Participation type */
  participationType: 'information-sharing' | 'learning' | 'contributing' | 'observing';

  /** Educational progress in this network */
  educationalProgress?: EducationalProgress;

  /** Cultural learning completed */
  culturalLearningCompleted?: string[];

  /** Contributions made to the network */
  contributions?: NetworkContribution[];
}

export interface CulturalProtocol {
  /** Protocol identifier */
  id: string;

  /** Protocol name */
  name: string;

  /** Educational description of the protocol */
  description: string;

  /** Protocol type */
  type: 'greeting' | 'sharing' | 'discussion' | 'ceremony' | 'general';

  /** Educational context for understanding */
  educationalContext: string;

  /** Traditional significance (for learning) */
  traditionalSignificance?: string;

  /** Modern application guidance */
  modernApplication?: string;
}

export interface CulturalGuide {
  /** Guide identifier */
  id: string;

  /** Display name */
  name: string;

  /** Role in the community */
  role: string;

  /** Areas of expertise */
  expertise: string[];

  /** Educational background */
  background: string;

  /** Available for guidance */
  isAvailable: boolean;

  /** Preferred contact method */
  contactMethod?: 'direct-message' | 'public-forum' | 'scheduled-session';
}

export interface LearningPath {
  /** Learning path identifier */
  id: string;

  /** Path name */
  name: string;

  /** Description of learning objectives */
  description: string;

  /** Estimated completion time */
  estimatedDuration: string;

  /** Difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  /** Learning modules */
  modules: LearningModule[];

  /** Prerequisites */
  prerequisites?: string[];

  /** Cultural context provided */
  culturalContext: string;
}

export interface LearningModule {
  /** Module identifier */
  id: string;

  /** Module title */
  title: string;

  /** Module content summary */
  summary: string;

  /** Educational resources */
  resources: string[];

  /** Interactive elements */
  interactiveElements?: string[];

  /** Assessment method */
  assessmentType?: 'quiz' | 'discussion' | 'reflection' | 'practice';
}

export interface EducationalProgress {
  /** Total learning paths enrolled */
  pathsEnrolled: number;

  /** Learning paths completed */
  pathsCompleted: number;

  /** Current learning streak */
  learningStreak: number;

  /** Last learning activity */
  lastActivity: string;

  /** Certificates earned */
  certificatesEarned: string[];

  /** Cultural competency areas developed */
  competencyAreas: string[];
}

export interface NetworkContribution {
  /** Contribution identifier */
  id: string;

  /** Contribution type */
  type:
    | 'knowledge-share'
    | 'resource-upload'
    | 'discussion-lead'
    | 'cultural-context'
    | 'translation';

  /** Contribution title */
  title: string;

  /** Contribution timestamp */
  contributedAt: string;

  /** Community appreciation received */
  appreciationReceived: number;

  /** Educational impact score */
  educationalImpact?: number;
}

export type CommunityNetworkCategory =
  | 'indigenous-knowledge'
  | 'traditional-arts'
  | 'cultural-history'
  | 'language-preservation'
  | 'ceremonial-practices'
  | 'storytelling'
  | 'craft-techniques'
  | 'agricultural-wisdom'
  | 'healing-practices'
  | 'philosophical-traditions'
  | 'music-and-dance'
  | 'oral-traditions'
  | 'environmental-knowledge'
  | 'community-governance'
  | 'educational-initiatives';

export interface JoinNetworkRequest {
  /** Network to join */
  networkId: string;

  /** Type of participation desired */
  participationType: 'information-sharing' | 'learning' | 'contributing' | 'observing';

  /** Educational context acknowledgment */
  educationalContext: boolean;

  /** Respect for cultural protocols */
  respectCulturalProtocols: boolean;

  /** Initial learning interests */
  learningInterests?: string[];

  /** Background information (optional) */
  backgroundInfo?: string;
}

export interface CommunityNetworksProps {
  /** Callback when user joins a network */
  onJoinNetwork?: (network: CommunityNetwork) => void;

  /** Callback when user leaves a network */
  onLeaveNetwork?: (network: CommunityNetwork) => void;

  /** Callback when network is selected for details */
  onNetworkSelect?: (network: CommunityNetwork) => void;

  /** Whether to show educational context panel */
  showEducationalContext?: boolean;

  /** Filter networks by category */
  categoryFilter?: CommunityNetworkCategory[];

  /** Filter networks by cultural sensitivity level */
  sensitivityFilter?: (1 | 2 | 3)[];

  /** Maximum number of networks to display */
  maxNetworks?: number;

  /** CSS class name for styling */
  class?: string;

  /** Additional accessibility label */
  'aria-label'?: string;
}
