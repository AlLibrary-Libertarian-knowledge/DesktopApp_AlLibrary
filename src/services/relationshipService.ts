/**
 * Relationship Service with Cultural Hierarchy and Community Connections
 *
 * Manages collection relationships including parent/child hierarchies, cultural variants,
 * community responses, and educational supplements while respecting traditional knowledge structures.
 */

import { invoke } from '@tauri-apps/api/core';
import type { Collection, CollectionRelationship } from '../types/Collection';
import type { CulturalMetadata } from '../types/Cultural';
import { CulturalSensitivityLevel } from '../types/Cultural';

/**
 * Relationship types with cultural awareness
 */
export enum RelationshipType {
  PARENT = 'parent',
  CHILD = 'child',
  SIBLING = 'sibling',
  CULTURAL_VARIANT = 'cultural_variant',
  TRANSLATION = 'translation',
  COMMUNITY_RESPONSE = 'community_response',
  EDUCATIONAL_SUPPLEMENT = 'educational_supplement',
  RESEARCH_EXTENSION = 'research_extension',
  TRADITIONAL_CONTINUATION = 'traditional_continuation',
  MODERN_ADAPTATION = 'modern_adaptation',
}

/**
 * Relationship suggestion with cultural context
 */
export interface RelationshipSuggestion {
  /** Target collection ID */
  targetCollectionId: string;

  /** Target collection name */
  targetCollectionName: string;

  /** Suggested relationship type */
  relationshipType: RelationshipType;

  /** Confidence score (0-1) */
  confidence: number;

  /** Reason for suggestion */
  reason: string;

  /** Cultural appropriateness score (0-1) */
  culturalAppropriateness: number;

  /** Bidirectional relationship */
  bidirectional: boolean;

  /** Cultural context */
  culturalContext?: string;

  /** Community validation required */
  requiresCommunityValidation: boolean;

  /** Educational benefits */
  educationalBenefits: string[];

  /** Traditional knowledge protocols */
  traditionalProtocols?: string[];
}

/**
 * Relationship network analysis
 */
export interface RelationshipNetwork {
  /** Central collection */
  centralCollection: Collection;

  /** Direct relationships */
  directRelationships: EnhancedRelationship[];

  /** Indirect relationships (2-3 degrees) */
  indirectRelationships: EnhancedRelationship[];

  /** Cultural clusters */
  culturalClusters: CulturalCluster[];

  /** Community networks */
  communityNetworks: CommunityNetwork[];

  /** Network statistics */
  networkStats: NetworkStatistics;
}

/**
 * Enhanced relationship with additional metadata
 */
export interface EnhancedRelationship extends CollectionRelationship {
  /** Target collection details */
  targetCollection: Collection;

  /** Relationship age */
  createdAt: Date;

  /** Relationship creator */
  createdBy: string;

  /** Community validation status */
  validationStatus: 'pending' | 'approved' | 'rejected' | 'community_reviewed';

  /** Educational value score */
  educationalValue: number;

  /** Cultural significance score */
  culturalSignificance: number;

  /** Usage statistics */
  usageStats: {
    viewCount: number;
    followCount: number;
    educationalAccess: number;
  };
}

/**
 * Cultural cluster of related collections
 */
export interface CulturalCluster {
  /** Cluster ID */
  id: string;

  /** Cultural origin */
  culturalOrigin: string;

  /** Collections in cluster */
  collections: Collection[];

  /** Cluster center (most representative collection) */
  centerCollection: Collection;

  /** Cultural significance score */
  culturalSignificance: number;

  /** Educational pathways */
  educationalPathways: EducationalPathway[];

  /** Traditional knowledge protocols */
  traditionalProtocols: string[];
}

/**
 * Community network of collections
 */
export interface CommunityNetwork {
  /** Network ID */
  id: string;

  /** Community identifier */
  communityId: string;

  /** Community name */
  communityName: string;

  /** Collections in network */
  collections: Collection[];

  /** Network relationships */
  relationships: EnhancedRelationship[];

  /** Community elders/guardians */
  culturalAuthorities: string[];

  /** Network health score */
  healthScore: number;
}

/**
 * Educational pathway through related collections
 */
export interface EducationalPathway {
  /** Pathway ID */
  id: string;

  /** Pathway name */
  name: string;

  /** Ordered collection sequence */
  collectionSequence: Collection[];

  /** Learning objectives */
  learningObjectives: string[];

  /** Cultural learning goals */
  culturalLearningGoals: string[];

  /** Estimated completion time */
  estimatedTime: number; // minutes

  /** Difficulty level */
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  /** Cultural sensitivity requirements */
  culturalRequirements: string[];
}

/**
 * Network statistics
 */
export interface NetworkStatistics {
  /** Total relationships */
  totalRelationships: number;

  /** Relationship types distribution */
  relationshipTypes: { [key in RelationshipType]: number };

  /** Cultural diversity score */
  culturalDiversity: number;

  /** Network density */
  networkDensity: number;

  /** Average path length */
  averagePathLength: number;

  /** Community participation */
  communityParticipation: number;

  /** Educational pathways count */
  educationalPathways: number;
}

/**
 * Relationship validation result
 */
export interface RelationshipValidation {
  /** Validation passed */
  valid: boolean;

  /** Validation issues */
  issues: string[];

  /** Cultural appropriateness */
  culturallyAppropriate: boolean;

  /** Community approval required */
  requiresCommunityApproval: boolean;

  /** Educational value */
  educationalValue: number;

  /** Suggested improvements */
  suggestions: string[];
}

/**
 * Relationship service interface
 */
export interface RelationshipService {
  // Relationship management
  createRelationship(
    sourceId: string,
    targetId: string,
    type: RelationshipType,
    context?: string
  ): Promise<EnhancedRelationship>;
  updateRelationship(
    relationshipId: string,
    updates: Partial<CollectionRelationship>
  ): Promise<EnhancedRelationship>;
  deleteRelationship(relationshipId: string): Promise<void>;
  getRelationships(collectionId: string): Promise<EnhancedRelationship[]>;

  // Relationship discovery
  suggestRelationships(collectionId: string): Promise<RelationshipSuggestion[]>;
  findSimilarCollections(collectionId: string, limit?: number): Promise<Collection[]>;
  discoverCulturalVariants(collectionId: string): Promise<Collection[]>;
  findCommunityResponses(collectionId: string): Promise<Collection[]>;

  // Network analysis
  analyzeRelationshipNetwork(collectionId: string, depth?: number): Promise<RelationshipNetwork>;
  getCulturalClusters(culturalOrigin?: string): Promise<CulturalCluster[]>;
  getCommunityNetworks(communityId?: string): Promise<CommunityNetwork[]>;

  // Educational pathways
  generateEducationalPathways(collectionId: string): Promise<EducationalPathway[]>;
  createCustomPathway(
    collections: string[],
    metadata: Partial<EducationalPathway>
  ): Promise<EducationalPathway>;
  getRecommendedPathways(userId: string, interests?: string[]): Promise<EducationalPathway[]>;

  // Validation and quality
  validateRelationship(
    sourceId: string,
    targetId: string,
    type: RelationshipType
  ): Promise<RelationshipValidation>;
  getNetworkHealth(collectionId: string): Promise<number>;
  optimizeRelationships(collectionId: string): Promise<RelationshipSuggestion[]>;

  // Cultural and community features
  requestCommunityValidation(relationshipId: string, reason: string): Promise<void>;
  getCulturalProtocols(
    relationshipType: RelationshipType,
    culturalOrigin: string
  ): Promise<string[]>;
  getTraditionalHierarchies(culturalOrigin: string): Promise<CulturalCluster[]>;
}

/**
 * Relationship service implementation
 */
class RelationshipServiceImpl implements RelationshipService {
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  private relationshipCache = new Map<
    string,
    { data: EnhancedRelationship[]; timestamp: number }
  >();
  private networkCache = new Map<string, { data: RelationshipNetwork; timestamp: number }>();

  /**
   * Create a new relationship between collections
   */
  async createRelationship(
    sourceId: string,
    targetId: string,
    type: RelationshipType,
    context?: string
  ): Promise<EnhancedRelationship> {
    try {
      // Validate the relationship first
      const validation = await this.validateRelationship(sourceId, targetId, type);
      if (!validation.valid) {
        throw new Error(`Invalid relationship: ${validation.issues.join(', ')}`);
      }

      // Check for cultural protocols
      const sourceCollection = await this.getCollection(sourceId);
      const targetCollection = await this.getCollection(targetId);

      if (sourceCollection && targetCollection) {
        const protocols = await this.getCulturalProtocols(
          type,
          sourceCollection.culturalMetadata.culturalOrigin || ''
        );

        // If community approval is required, create pending relationship
        if (validation.requiresCommunityApproval) {
          console.log('Relationship requires community validation, creating pending relationship');
        }
      }

      const relationship = await invoke<EnhancedRelationship>('create_collection_relationship', {
        sourceId,
        targetId,
        relationshipType: type,
        description: context,
        bidirectional: this.isBidirectionalRelationship(type),
        strength: this.calculateRelationshipStrength(type, validation.educationalValue),
        culturalContext: context,
      });

      // Clear cache
      this.relationshipCache.delete(sourceId);
      this.relationshipCache.delete(targetId);
      this.networkCache.clear();

      return relationship;
    } catch (error) {
      console.error(`Failed to create relationship between ${sourceId} and ${targetId}:`, error);
      throw new Error('Unable to create collection relationship');
    }
  }

  /**
   * Update an existing relationship
   */
  async updateRelationship(
    relationshipId: string,
    updates: Partial<CollectionRelationship>
  ): Promise<EnhancedRelationship> {
    try {
      const relationship = await invoke<EnhancedRelationship>('update_collection_relationship', {
        relationshipId,
        updates,
      });

      // Clear cache
      this.relationshipCache.clear();
      this.networkCache.clear();

      return relationship;
    } catch (error) {
      console.error(`Failed to update relationship ${relationshipId}:`, error);
      throw new Error('Unable to update collection relationship');
    }
  }

  /**
   * Delete a relationship
   */
  async deleteRelationship(relationshipId: string): Promise<void> {
    try {
      await invoke('delete_collection_relationship', { relationshipId });

      // Clear cache
      this.relationshipCache.clear();
      this.networkCache.clear();
    } catch (error) {
      console.error(`Failed to delete relationship ${relationshipId}:`, error);
      throw new Error('Unable to delete collection relationship');
    }
  }

  /**
   * Get relationships for a collection
   */
  async getRelationships(collectionId: string): Promise<EnhancedRelationship[]> {
    try {
      // Check cache first
      const cached = this.relationshipCache.get(collectionId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      const relationships = await invoke<EnhancedRelationship[]>('get_collection_relationships', {
        collectionId,
      });

      // Enhance relationships with additional data
      const enhancedRelationships = await Promise.all(
        relationships.map(rel => this.enhanceRelationship(rel))
      );

      // Cache the results
      this.relationshipCache.set(collectionId, {
        data: enhancedRelationships,
        timestamp: Date.now(),
      });

      return enhancedRelationships;
    } catch (error) {
      console.error(`Failed to get relationships for collection ${collectionId}:`, error);
      throw new Error('Unable to load collection relationships');
    }
  }

  /**
   * Suggest relationships for a collection
   */
  async suggestRelationships(collectionId: string): Promise<RelationshipSuggestion[]> {
    try {
      const suggestions = await invoke<RelationshipSuggestion[]>(
        'suggest_collection_relationships',
        {
          collectionId,
        }
      );

      // Filter and enhance suggestions based on cultural appropriateness
      return this.filterCulturallyAppropriateSuggestions(suggestions);
    } catch (error) {
      console.error(`Failed to suggest relationships for collection ${collectionId}:`, error);
      throw new Error('Unable to generate relationship suggestions');
    }
  }

  /**
   * Find similar collections
   */
  async findSimilarCollections(collectionId: string, limit = 10): Promise<Collection[]> {
    try {
      return await invoke<Collection[]>('find_similar_collections', {
        collectionId,
        limit,
      });
    } catch (error) {
      console.error(`Failed to find similar collections for ${collectionId}:`, error);
      throw new Error('Unable to find similar collections');
    }
  }

  /**
   * Discover cultural variants
   */
  async discoverCulturalVariants(collectionId: string): Promise<Collection[]> {
    try {
      return await invoke<Collection[]>('discover_cultural_variants', {
        collectionId,
      });
    } catch (error) {
      console.error(`Failed to discover cultural variants for ${collectionId}:`, error);
      throw new Error('Unable to discover cultural variants');
    }
  }

  /**
   * Find community responses
   */
  async findCommunityResponses(collectionId: string): Promise<Collection[]> {
    try {
      return await invoke<Collection[]>('find_community_responses', {
        collectionId,
      });
    } catch (error) {
      console.error(`Failed to find community responses for ${collectionId}:`, error);
      throw new Error('Unable to find community responses');
    }
  }

  /**
   * Analyze relationship network
   */
  async analyzeRelationshipNetwork(collectionId: string, depth = 3): Promise<RelationshipNetwork> {
    try {
      // Check cache first
      const cacheKey = `${collectionId}_${depth}`;
      const cached = this.networkCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      const network = await invoke<RelationshipNetwork>('analyze_relationship_network', {
        collectionId,
        depth,
      });

      // Enhance network with additional analysis
      const enhancedNetwork = await this.enhanceNetworkAnalysis(network);

      // Cache the result
      this.networkCache.set(cacheKey, {
        data: enhancedNetwork,
        timestamp: Date.now(),
      });

      return enhancedNetwork;
    } catch (error) {
      console.error(`Failed to analyze relationship network for ${collectionId}:`, error);
      throw new Error('Unable to analyze relationship network');
    }
  }

  /**
   * Get cultural clusters
   */
  async getCulturalClusters(culturalOrigin?: string): Promise<CulturalCluster[]> {
    try {
      return await invoke<CulturalCluster[]>('get_cultural_clusters', {
        culturalOrigin,
      });
    } catch (error) {
      console.error('Failed to get cultural clusters:', error);
      throw new Error('Unable to load cultural clusters');
    }
  }

  /**
   * Get community networks
   */
  async getCommunityNetworks(communityId?: string): Promise<CommunityNetwork[]> {
    try {
      return await invoke<CommunityNetwork[]>('get_community_networks', {
        communityId,
      });
    } catch (error) {
      console.error('Failed to get community networks:', error);
      throw new Error('Unable to load community networks');
    }
  }

  /**
   * Generate educational pathways
   */
  async generateEducationalPathways(collectionId: string): Promise<EducationalPathway[]> {
    try {
      const pathways = await invoke<EducationalPathway[]>('generate_educational_pathways', {
        collectionId,
      });

      // Enhance pathways with cultural learning goals
      return pathways.map(pathway => this.enhanceEducationalPathway(pathway));
    } catch (error) {
      console.error(`Failed to generate educational pathways for ${collectionId}:`, error);
      throw new Error('Unable to generate educational pathways');
    }
  }

  /**
   * Create custom educational pathway
   */
  async createCustomPathway(
    collections: string[],
    metadata: Partial<EducationalPathway>
  ): Promise<EducationalPathway> {
    try {
      return await invoke<EducationalPathway>('create_custom_pathway', {
        collections,
        metadata: {
          ...metadata,
          id: crypto.randomUUID(),
        },
      });
    } catch (error) {
      console.error('Failed to create custom pathway:', error);
      throw new Error('Unable to create custom educational pathway');
    }
  }

  /**
   * Get recommended pathways for user
   */
  async getRecommendedPathways(
    userId: string,
    interests: string[] = []
  ): Promise<EducationalPathway[]> {
    try {
      return await invoke<EducationalPathway[]>('get_recommended_pathways', {
        userId,
        interests,
      });
    } catch (error) {
      console.error(`Failed to get recommended pathways for user ${userId}:`, error);
      throw new Error('Unable to load recommended pathways');
    }
  }

  /**
   * Validate a potential relationship
   */
  async validateRelationship(
    sourceId: string,
    targetId: string,
    type: RelationshipType
  ): Promise<RelationshipValidation> {
    try {
      const validation = await invoke<RelationshipValidation>('validate_collection_relationship', {
        sourceId,
        targetId,
        relationshipType: type,
      });

      // Enhance validation with cultural considerations
      return this.enhanceRelationshipValidation(validation, sourceId, targetId, type);
    } catch (error) {
      console.error(`Failed to validate relationship between ${sourceId} and ${targetId}:`, error);
      return {
        valid: false,
        issues: ['Validation failed'],
        culturallyAppropriate: false,
        requiresCommunityApproval: true,
        educationalValue: 0,
        suggestions: ['Please try again later'],
      };
    }
  }

  /**
   * Get network health score
   */
  async getNetworkHealth(collectionId: string): Promise<number> {
    try {
      return await invoke<number>('get_network_health', {
        collectionId,
      });
    } catch (error) {
      console.error(`Failed to get network health for ${collectionId}:`, error);
      return 0.5; // Default moderate health
    }
  }

  /**
   * Optimize relationships for a collection
   */
  async optimizeRelationships(collectionId: string): Promise<RelationshipSuggestion[]> {
    try {
      const suggestions = await invoke<RelationshipSuggestion[]>(
        'optimize_collection_relationships',
        {
          collectionId,
        }
      );

      return this.filterCulturallyAppropriateSuggestions(suggestions);
    } catch (error) {
      console.error(`Failed to optimize relationships for ${collectionId}:`, error);
      throw new Error('Unable to optimize collection relationships');
    }
  }

  /**
   * Request community validation for relationship
   */
  async requestCommunityValidation(relationshipId: string, reason: string): Promise<void> {
    try {
      await invoke('request_relationship_validation', {
        relationshipId,
        reason,
      });
    } catch (error) {
      console.error(
        `Failed to request community validation for relationship ${relationshipId}:`,
        error
      );
      throw new Error('Unable to request community validation');
    }
  }

  /**
   * Get cultural protocols for relationship type
   */
  async getCulturalProtocols(
    relationshipType: RelationshipType,
    culturalOrigin: string
  ): Promise<string[]> {
    try {
      return await invoke<string[]>('get_cultural_protocols', {
        relationshipType,
        culturalOrigin,
      });
    } catch (error) {
      console.error(`Failed to get cultural protocols for ${relationshipType}:`, error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get traditional hierarchies for cultural origin
   */
  async getTraditionalHierarchies(culturalOrigin: string): Promise<CulturalCluster[]> {
    try {
      return await invoke<CulturalCluster[]>('get_traditional_hierarchies', {
        culturalOrigin,
      });
    } catch (error) {
      console.error(`Failed to get traditional hierarchies for ${culturalOrigin}:`, error);
      throw new Error('Unable to load traditional hierarchies');
    }
  }

  // Private helper methods

  /**
   * Get collection by ID
   */
  private async getCollection(collectionId: string): Promise<Collection | null> {
    try {
      return await invoke<Collection | null>('get_collection', {
        id: collectionId,
      });
    } catch (error) {
      console.error(`Failed to get collection ${collectionId}:`, error);
      return null;
    }
  }

  /**
   * Check if relationship type is bidirectional
   */
  private isBidirectionalRelationship(type: RelationshipType): boolean {
    const bidirectionalTypes = [
      RelationshipType.SIBLING,
      RelationshipType.CULTURAL_VARIANT,
      RelationshipType.TRANSLATION,
    ];
    return bidirectionalTypes.includes(type);
  }

  /**
   * Calculate relationship strength
   */
  private calculateRelationshipStrength(type: RelationshipType, educationalValue: number): number {
    const baseStrengths = {
      [RelationshipType.PARENT]: 0.9,
      [RelationshipType.CHILD]: 0.9,
      [RelationshipType.SIBLING]: 0.8,
      [RelationshipType.CULTURAL_VARIANT]: 0.85,
      [RelationshipType.TRANSLATION]: 0.8,
      [RelationshipType.COMMUNITY_RESPONSE]: 0.7,
      [RelationshipType.EDUCATIONAL_SUPPLEMENT]: 0.75,
      [RelationshipType.RESEARCH_EXTENSION]: 0.7,
      [RelationshipType.TRADITIONAL_CONTINUATION]: 0.95,
      [RelationshipType.MODERN_ADAPTATION]: 0.75,
    };

    const baseStrength = baseStrengths[type] || 0.5;
    return Math.min(1.0, baseStrength + educationalValue * 0.2);
  }

  /**
   * Enhance relationship with additional metadata
   */
  private async enhanceRelationship(
    relationship: EnhancedRelationship
  ): Promise<EnhancedRelationship> {
    // Add usage statistics and validation status
    return {
      ...relationship,
      educationalValue: this.calculateEducationalValue(relationship),
      culturalSignificance: this.calculateCulturalSignificance(relationship),
      usageStats: {
        viewCount: 0, // Would be populated from analytics
        followCount: 0,
        educationalAccess: 0,
      },
    };
  }

  /**
   * Filter suggestions for cultural appropriateness
   */
  private filterCulturallyAppropriateSuggestions(
    suggestions: RelationshipSuggestion[]
  ): RelationshipSuggestion[] {
    return suggestions.filter(suggestion => {
      // Always allow high-confidence, culturally appropriate suggestions
      if (suggestion.confidence > 0.8 && suggestion.culturalAppropriateness > 0.8) {
        return true;
      }

      // Require community validation for sensitive relationships
      if (suggestion.culturalAppropriateness < 0.7) {
        suggestion.requiresCommunityValidation = true;
      }

      return suggestion.confidence > 0.5;
    });
  }

  /**
   * Enhance network analysis
   */
  private async enhanceNetworkAnalysis(network: RelationshipNetwork): Promise<RelationshipNetwork> {
    // Calculate additional network metrics
    const enhancedStats: NetworkStatistics = {
      ...network.networkStats,
      culturalDiversity: this.calculateCulturalDiversity(network),
      communityParticipation: this.calculateCommunityParticipation(network),
    };

    return {
      ...network,
      networkStats: enhancedStats,
    };
  }

  /**
   * Enhance educational pathway
   */
  private enhanceEducationalPathway(pathway: EducationalPathway): EducationalPathway {
    // Add cultural learning goals based on collections
    const culturalLearningGoals = pathway.collectionSequence
      .filter(collection => collection.culturalMetadata.culturalOrigin)
      .map(
        collection => `Learn about ${collection.culturalMetadata.culturalOrigin} cultural context`
      )
      .filter((goal, index, array) => array.indexOf(goal) === index); // Remove duplicates

    return {
      ...pathway,
      culturalLearningGoals,
      culturalRequirements: this.extractCulturalRequirements(pathway),
    };
  }

  /**
   * Enhance relationship validation
   */
  private async enhanceRelationshipValidation(
    validation: RelationshipValidation,
    sourceId: string,
    targetId: string,
    type: RelationshipType
  ): Promise<RelationshipValidation> {
    // Check for cultural sensitivity requirements
    const sourceCollection = await this.getCollection(sourceId);
    const targetCollection = await this.getCollection(targetId);

    if (sourceCollection && targetCollection) {
      const sourceSensitivity = sourceCollection.culturalMetadata.sensitivityLevel;
      const targetSensitivity = targetCollection.culturalMetadata.sensitivityLevel;

      // Require community approval for sensitive content relationships
      if (
        sourceSensitivity >= CulturalSensitivityLevel.GUARDIAN ||
        targetSensitivity >= CulturalSensitivityLevel.GUARDIAN
      ) {
        validation.requiresCommunityApproval = true;
      }

      // Check cultural origin compatibility
      if (
        sourceCollection.culturalMetadata.culturalOrigin !==
        targetCollection.culturalMetadata.culturalOrigin
      ) {
        if (type === RelationshipType.CULTURAL_VARIANT) {
          validation.educationalValue += 0.2; // Cross-cultural learning value
        }
      }
    }

    return validation;
  }

  /**
   * Calculate educational value of relationship
   */
  private calculateEducationalValue(relationship: EnhancedRelationship): number {
    let value = 0.5; // Base value

    // Higher value for educational relationship types
    if (relationship.relationshipType === RelationshipType.EDUCATIONAL_SUPPLEMENT) {
      value += 0.3;
    }

    // Cultural learning value
    if (relationship.culturalContext) {
      value += 0.2;
    }

    return Math.min(1.0, value);
  }

  /**
   * Calculate cultural significance of relationship
   */
  private calculateCulturalSignificance(relationship: EnhancedRelationship): number {
    let significance = 0.5; // Base significance

    // Higher significance for cultural relationship types
    const culturalTypes = [
      RelationshipType.CULTURAL_VARIANT,
      RelationshipType.TRADITIONAL_CONTINUATION,
      RelationshipType.COMMUNITY_RESPONSE,
    ];

    if (culturalTypes.includes(relationship.relationshipType as RelationshipType)) {
      significance += 0.3;
    }

    return Math.min(1.0, significance);
  }

  /**
   * Calculate cultural diversity of network
   */
  private calculateCulturalDiversity(network: RelationshipNetwork): number {
    const culturalOrigins = new Set();

    network.directRelationships.forEach(rel => {
      if (rel.targetCollection.culturalMetadata.culturalOrigin) {
        culturalOrigins.add(rel.targetCollection.culturalMetadata.culturalOrigin);
      }
    });

    // Normalize by total possible diversity (arbitrary max of 10)
    return Math.min(1.0, culturalOrigins.size / 10);
  }

  /**
   * Calculate community participation in network
   */
  private calculateCommunityParticipation(network: RelationshipNetwork): number {
    const communityRelationships = network.directRelationships.filter(
      rel => rel.relationshipType === RelationshipType.COMMUNITY_RESPONSE
    );

    return communityRelationships.length / Math.max(1, network.directRelationships.length);
  }

  /**
   * Extract cultural requirements from pathway
   */
  private extractCulturalRequirements(pathway: EducationalPathway): string[] {
    const requirements: string[] = [];

    pathway.collectionSequence.forEach(collection => {
      if (collection.culturalMetadata.traditionalProtocols) {
        requirements.push(...collection.culturalMetadata.traditionalProtocols);
      }
    });

    // Remove duplicates and return
    return [...new Set(requirements)];
  }
}

// Export singleton instance
export const relationshipService: RelationshipService = new RelationshipServiceImpl();
