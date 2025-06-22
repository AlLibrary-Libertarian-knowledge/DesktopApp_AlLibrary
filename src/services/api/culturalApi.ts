/**
 * Cultural API Service
 *
 * Manages cultural context and educational information.
 * ANTI-CENSORSHIP: All cultural validation is informational only - never restricts access.
 */

import { apiClient, type ApiResponse } from './apiClient';
import type { CulturalSensitivityLevel, CulturalInformation } from '../../types/Cultural';

/**
 * Cultural context interfaces
 */
export interface CulturalContext {
  id: string;
  name: string;
  description: string;
  culturalOrigin: string;
  community: string;

  // Traditional knowledge information
  traditionalKnowledge: {
    knowledgeType: string;
    culturalSignificance: string;
    traditionalName?: string;
    alternativeNames: string[];
    historicalContext: string;
  };

  // Educational information (always accessible)
  educationalContent: {
    overview: string;
    culturalProtocols: string[];
    respectfulApproach: string[];
    learningResources: string[];
    crossCulturalConnections: string[];
  };

  // Community information
  communityInfo: {
    primaryCommunities: string[];
    geographicRegions: string[];
    languages: string[];
    timelineContext: string;
    contemporaryRelevance: string;
  };

  // Elder and guardian information (for respect, not restriction)
  authorityInfo: {
    eldersConsulted: boolean;
    guardianApproval: boolean;
    communityEndorsement: boolean;
    lastReviewDate: string;
    nextReviewScheduled: string;
  };

  // Sensitivity information (educational only)
  sensitivityInfo: {
    level: CulturalSensitivityLevel;
    educationalNotes: string[];
    contextRequirements: string[];
    respectfulUsage: string[];
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
  contributors: string[];
  sources: string[];
}

export interface TraditionalClassification {
  id: string;
  name: string;
  culturalOrigin: string;
  traditionName: string;
  description: string;

  // Traditional categorization system
  categories: {
    traditionalName: string;
    modernEquivalent: string;
    description: string;
    culturalContext: string;
    examples: string[];
  }[];

  // Mapping to modern categories
  modernMappings: {
    categoryId: string;
    relationshipType: 'equivalent' | 'contains' | 'overlaps' | 'related';
    confidence: number;
    notes: string;
  }[];

  // Authority and validation
  authorityInfo: {
    validators: string[];
    approvalDate: string;
    reviewCycle: string;
    lastValidation: string;
  };
}

export interface CulturalEducationContent {
  id: string;
  contextId: string;
  type: 'protocol' | 'history' | 'significance' | 'respect' | 'connections';

  content: {
    title: string;
    summary: string;
    detailedContent: string;
    keyPoints: string[];
    learningObjectives: string[];
  };

  // Interactive elements
  interactive: {
    videos?: string[];
    audio?: string[];
    images?: string[];
    documents?: string[];
    exercises?: any[];
  };

  // Cross-cultural connections
  connections: {
    relatedCultures: string[];
    universalThemes: string[];
    comparativeElements: string[];
    learningBridges: string[];
  };
}

/**
 * Cultural API Service Class
 * Implements Single Responsibility for cultural context management
 */
export class CulturalApiService {
  /**
   * Get cultural context for educational purposes
   * ANTI-CENSORSHIP: Always accessible, never restricts content
   */
  async getCulturalContext(contextId: string): Promise<ApiResponse<CulturalContext>> {
    return apiClient.get<CulturalContext>('cultural_context', {
      contextId,
      purpose: 'educational',
      includeFullDetails: true,
    });
  }

  /**
   * Search cultural contexts for learning
   */
  async searchCulturalContexts(
    query: string,
    filters: {
      culturalOrigins?: string[];
      sensitivityLevels?: CulturalSensitivityLevel[];
      knowledgeTypes?: string[];
      regions?: string[];
    } = {}
  ): Promise<ApiResponse<CulturalContext[]>> {
    return apiClient.search<CulturalContext[]>('cultural_contexts', query, {
      ...filters,
      educationalPurpose: true,
      respectfulAccess: true,
    });
  }

  /**
   * Get cultural education content
   */
  async getCulturalEducation(contextId: string): Promise<ApiResponse<CulturalEducationContent[]>> {
    return apiClient.get<CulturalEducationContent[]>('cultural_education', {
      contextId,
      includeInteractive: true,
      includeCrossConnections: true,
    });
  }

  /**
   * Get traditional classification systems
   */
  async getTraditionalClassifications(): Promise<ApiResponse<TraditionalClassification[]>> {
    return apiClient.get<TraditionalClassification[]>('traditional_classifications', {
      includeModernMappings: true,
      includeAuthorityInfo: true,
      educationalPurpose: true,
    });
  }

  /**
   * Get cultural contexts by origin/community
   */
  async getCulturalContextsByCommunity(community: string): Promise<ApiResponse<CulturalContext[]>> {
    return apiClient.get<CulturalContext[]>('cultural_contexts_by_community', {
      community,
      includeEducationalContent: true,
      respectCommunityProtocols: true,
    });
  }

  /**
   * Get cultural protocol guidelines for respectful interaction
   */
  async getCulturalProtocols(contextId: string): Promise<
    ApiResponse<{
      protocols: string[];
      respectfulApproaches: string[];
      educationalGuidelines: string[];
      culturalEtiquette: string[];
      commonMisunderstandings: string[];
      learningRecommendations: string[];
    }>
  > {
    return apiClient.get('cultural_protocols', {
      contextId,
      purpose: 'education_and_respect',
      includeGuidance: true,
    });
  }

  /**
   * Get cross-cultural connections and learning bridges
   */
  async getCrossCulturalConnections(contextId: string): Promise<
    ApiResponse<{
      relatedContexts: CulturalContext[];
      universalThemes: string[];
      learningBridges: string[];
      comparativeStudies: string[];
      culturalExchange: string[];
    }>
  > {
    return apiClient.get('cross_cultural_connections', {
      contextId,
      includeLearningOpportunities: true,
      promoteUnderstanding: true,
    });
  }

  /**
   * Validate cultural content for educational appropriateness
   * ANTI-CENSORSHIP: Information only, never blocks access
   */
  async validateCulturalContent(content: any): Promise<
    ApiResponse<{
      educationalValue: number;
      culturalAccuracy: number;
      respectfulPresentation: number;
      recommendations: string[];
      educationalEnhancements: string[];
      culturalContext: string[];
      // Note: No blocking recommendations - all informational
    }>
  > {
    return apiClient.call('validate_cultural_content', {
      content,
      purpose: 'educational_enhancement',
      enforcementMode: 'informational_only', // Never blocks
    });
  }

  /**
   * Get cultural sensitivity information for education
   * ANTI-CENSORSHIP: Educational context only, never for access control
   */
  async getCulturalSensitivityInfo(
    itemId: string,
    itemType: 'document' | 'category' | 'collection'
  ): Promise<
    ApiResponse<{
      sensitivityLevel: CulturalSensitivityLevel;
      educationalContext: string[];
      culturalSignificance: string;
      respectfulApproach: string[];
      learningOpportunities: string[];
      crossCulturalPerspectives: string[];
    }>
  > {
    return apiClient.get('cultural_sensitivity_info', {
      itemId,
      itemType,
      purpose: 'educational_awareness',
      includeContext: true,
    });
  }

  /**
   * Get cultural community information for understanding
   */
  async getCommunityInformation(communityId: string): Promise<
    ApiResponse<{
      name: string;
      description: string;
      culturalBackground: string;
      traditionalPractices: string[];
      modernContext: string;
      geographicContext: string[];
      languageInfo: string[];
      culturalValues: string[];
      knowledgeContributions: string[];
      learningResources: string[];
      respectfulEngagement: string[];
    }>
  > {
    return apiClient.get('community_information', {
      communityId,
      educationalPurpose: true,
      promoteUnderstanding: true,
    });
  }

  /**
   * Get elder and guardian acknowledgments for educational context
   */
  async getElderGuardianAcknowledgments(): Promise<
    ApiResponse<{
      acknowledgments: {
        id: string;
        elderName?: string; // Only if publicly shareable
        guardianTitle: string;
        community: string;
        culturalRole: string;
        acknowledgmentText: string;
        approvalScope: string[];
        guidanceProvided: string[];
        educationalMessage: string;
      }[];
      generalGuidance: string[];
      respectfulPractices: string[];
      educationalPrinciples: string[];
    }>
  > {
    return apiClient.get('elder_guardian_acknowledgments', {
      educationalPurpose: true,
      respectPrivacy: true,
      promoteUnderstanding: true,
    });
  }

  /**
   * Submit cultural context for community review
   * (Educational contribution, not validation for access)
   */
  async submitCulturalContext(context: Partial<CulturalContext>): Promise<
    ApiResponse<{
      submissionId: string;
      reviewProcess: string[];
      educationalValue: string;
      communityBenefit: string;
      expectedTimeline: string;
    }>
  > {
    return apiClient.create('cultural_context_submission', {
      ...context,
      purpose: 'educational_contribution',
      contributionType: 'community_education',
    });
  }

  /**
   * Get cultural learning pathways and recommendations
   */
  async getCulturalLearningPathways(
    userInterests?: string[],
    currentKnowledge?: string[]
  ): Promise<
    ApiResponse<{
      recommendedPathways: {
        id: string;
        name: string;
        description: string;
        culturalContexts: string[];
        learningSteps: string[];
        estimatedTime: string;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        culturalBenefits: string[];
      }[];
      personalizedRecommendations: string[];
      crossCulturalOpportunities: string[];
      respectfulLearningPrinciples: string[];
    }>
  > {
    return apiClient.get('cultural_learning_pathways', {
      userInterests,
      currentKnowledge,
      educationalGoals: true,
      culturalRespect: true,
    });
  }
}

// Export singleton instance
export const culturalApi = new CulturalApiService();
