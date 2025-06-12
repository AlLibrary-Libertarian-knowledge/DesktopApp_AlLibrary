/**
 * Cultural Sensitivity and Protection System
 *
 * Implements the mandatory 5-level cultural sensitivity framework
 * to respect traditional knowledge protocols and community sovereignty.
 *
 * @cultural-considerations
 * - No cultural censorship - information only, no access restriction
 * - Educational approach - provide context without blocking
 * - Community empowerment - support cultural sovereignty
 * - Multiple perspectives - support diverse interpretations
 */

/**
 * 5-Level Cultural Sensitivity Classification System
 *
 * Each level provides information and context, never restricts access.
 * This is an educational and respectful framework, not a censorship system.
 */
export enum CulturalSensitivityLevel {
  /**
   * Level 1: PUBLIC
   * Open access content with no cultural considerations needed.
   */
  PUBLIC = 1,

  /**
   * Level 2: EDUCATIONAL
   * Content benefits from cultural context for better understanding.
   * Provides educational resources but does not require completion.
   */
  EDUCATIONAL = 2,

  /**
   * Level 3: COMMUNITY
   * Content with community cultural significance.
   * Shows community context and history for educational purposes.
   */
  COMMUNITY = 3,

  /**
   * Level 4: GUARDIAN
   * Content with traditional knowledge protocols.
   * Displays cultural protocols and traditional context information.
   */
  GUARDIAN = 4,

  /**
   * Level 5: SACRED
   * Content with sacred or ceremonial significance.
   * Provides maximum cultural context and traditional protocol information.
   */
  SACRED = 5,
}

/**
 * Cultural metadata for content
 */
export interface CulturalMetadata {
  /** Sensitivity level of the content */
  sensitivityLevel: CulturalSensitivityLevel;

  /** Cultural origin or tradition */
  culturalOrigin?: string;

  /** Community identifier if applicable */
  communityId?: string;

  /** Traditional protocols for respectful engagement */
  traditionalProtocols?: string[];

  /** Educational context and resources */
  educationalContext?: string;

  /** Historical and cultural background */
  culturalContext?: string;

  /** Source attribution and provenance */
  sourceAttribution?: string;

  /** Language or cultural group */
  culturalGroup?: string;

  /** Related cultural concepts or connections */
  relatedConcepts?: string[];

  /** Timestamp of cultural validation */
  validatedAt?: Date;

  /** Community notes or additional context */
  communityNotes?: string;
}

/**
 * Cultural education module for user learning
 */
export interface CulturalEducationModule {
  /** Unique identifier for the module */
  id: string;

  /** Cultural context this module teaches */
  culturalContext: string;

  /** Learning objectives */
  objectives: string[];

  /** Educational content */
  content: string;

  /** Interactive elements or assessments */
  interactiveElements?: any[];

  /** Estimated completion time */
  estimatedTime: number;

  /** Prerequisites for this module */
  prerequisites?: string[];

  /** Cultural advisors who contributed */
  advisors?: string[];
}

/**
 * Cultural information response (information only, no access control)
 */
export interface CulturalInformation {
  /** The content's cultural sensitivity level */
  sensitivityLevel: CulturalSensitivityLevel;

  /** Cultural context and background */
  culturalContext?: string;

  /** Educational resources available */
  educationalResources?: CulturalEducationModule[];

  /** Traditional protocols for respectful engagement */
  traditionalProtocols?: string[];

  /** Community information and background */
  communityInformation?: string;

  /** Historical context */
  historicalContext?: string;

  /** Source information and provenance */
  sourceInformation?: string;

  /** Related cultural concepts */
  relatedConcepts?: string[];

  /** Community provided context */
  communityContext?: string;

  /** Information only - no access control */
  readonly informationOnly: true;

  /** Educational enhancement, not restriction */
  readonly educationalPurpose: true;
}

/**
 * Cultural analysis result from content scanning
 */
export interface CulturalAnalysis {
  /** Detected sensitivity level */
  detectedLevel: CulturalSensitivityLevel;

  /** Confidence in the detection */
  confidence: number;

  /** Detected cultural symbols or references */
  detectedSymbols: SacredSymbol[];

  /** Detected cultural origin */
  detectedOrigin?: string;

  /** Suggested educational context */
  suggestedContext?: string;

  /** Recommended cultural information */
  recommendedInformation?: string[];

  /** Analysis metadata */
  analysisMetadata: {
    analyzedAt: Date;
    analysisVersion: string;
    reviewRequired: boolean;
  };
}

/**
 * Sacred symbol or cultural element detection
 */
export interface SacredSymbol {
  /** Symbol identifier */
  symbolId: string;

  /** Symbol description */
  description: string;

  /** Cultural significance */
  culturalSignificance: string;

  /** Traditional protocols for this symbol */
  protocols: string[];

  /** Educational context */
  educationalContext: string;

  /** Confidence in detection */
  confidence: number;

  /** Position in content where detected */
  position?: {
    page?: number;
    line?: number;
    offset?: number;
  };
}

/**
 * Community information (for educational context, not access control)
 */
export interface CommunityInformation {
  /** Community identifier */
  communityId: string;

  /** Community name */
  name: string;

  /** Cultural background and context */
  culturalBackground: string;

  /** Traditional knowledge areas */
  traditionalKnowledge: string[];

  /** Educational resources provided by community */
  educationalResources: CulturalEducationModule[];

  /** Community protocols for respectful engagement */
  engagementProtocols: string[];

  /** Community contact information for questions */
  contactInformation?: string;

  /** Community-provided learning materials */
  learningMaterials?: any[];

  /** Information only - no approval authority */
  readonly informationOnly: true;
}

/**
 * Cultural validation context (information gathering, not access control)
 */
export interface CulturalValidationContext {
  /** Content being validated */
  contentId: string;

  /** User requesting information */
  userId: string;

  /** Detected cultural metadata */
  culturalMetadata: CulturalMetadata;

  /** Educational information provided */
  educationalInformation: CulturalInformation;

  /** Community context if applicable */
  communityContext?: CommunityInformation;

  /** Validation timestamp */
  validatedAt: Date;

  /** Information only - no restrictions applied */
  readonly informationOnly: true;

  /** Educational enhancement purpose */
  readonly educationalPurpose: true;
}

/**
 * Cultural education progress tracking (for user learning, not access control)
 */
export interface CulturalEducationProgress {
  /** User identifier */
  userId: string;

  /** Cultural context being learned */
  culturalContext: string;

  /** Completed modules */
  completedModules: string[];

  /** Current module */
  currentModule?: string;

  /** Progress percentage */
  progressPercentage: number;

  /** Last activity timestamp */
  lastActivity: Date;

  /** Learning goals */
  learningGoals: string[];

  /** Notes and reflections */
  userNotes?: string;

  /** For learning enhancement, not access control */
  readonly educationalPurpose: true;
}
