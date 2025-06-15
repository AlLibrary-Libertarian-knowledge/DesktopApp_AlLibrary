/**
 * Organization Service with AI-Powered Auto-Tagging and Cultural Intelligence
 *
 * Provides intelligent organization features including auto-tagging, smart categorization,
 * and automated workflows while respecting cultural protocols and traditional knowledge.
 */

import { invoke } from '@tauri-apps/api/core';
import type { Collection, OrganizationRule, CollectionOrganization } from '../types/Collection';
import type { Document } from '../types/Document';
import type { CulturalMetadata, CulturalSensitivityLevel } from '../types/Cultural';

/**
 * Auto-tagging suggestion with confidence score
 */
export interface TagSuggestion {
  /** Suggested tag */
  tag: string;

  /** Confidence score (0-1) */
  confidence: number;

  /** Reason for suggestion */
  reason: string;

  /** Cultural context if applicable */
  culturalContext?: string;

  /** Source of suggestion */
  source: 'content_analysis' | 'cultural_analysis' | 'community_input' | 'ai_inference';

  /** Traditional knowledge indicator */
  traditionalKnowledge?: boolean;
}

/**
 * Category suggestion with cultural awareness
 */
export interface CategorySuggestion {
  /** Suggested category */
  category: string;

  /** Confidence score (0-1) */
  confidence: number;

  /** Cultural appropriateness score (0-1) */
  culturalAppropriateness: number;

  /** Subcategories */
  subcategories?: string[];

  /** Cultural protocols to follow */
  culturalProtocols?: string[];

  /** Community validation required */
  requiresCommunityValidation: boolean;
}

/**
 * Organization analysis result
 */
export interface OrganizationAnalysis {
  /** Document or collection being analyzed */
  itemId: string;

  /** Item type */
  itemType: 'document' | 'collection';

  /** Tag suggestions */
  tagSuggestions: TagSuggestion[];

  /** Category suggestions */
  categorySuggestions: CategorySuggestion[];

  /** Cultural metadata suggestions */
  culturalSuggestions: Partial<CulturalMetadata>;

  /** Organization rule matches */
  ruleMatches: OrganizationRuleMatch[];

  /** Analysis timestamp */
  analyzedAt: Date;

  /** Analysis confidence */
  overallConfidence: number;
}

/**
 * Organization rule match
 */
export interface OrganizationRuleMatch {
  /** Rule that matched */
  rule: OrganizationRule;

  /** Match confidence */
  confidence: number;

  /** Matched values */
  matchedValues: any[];

  /** Suggested actions */
  suggestedActions: OrganizationAction[];
}

/**
 * Organization action
 */
export interface OrganizationAction {
  /** Action type */
  type:
    | 'add_tag'
    | 'set_category'
    | 'move_to_collection'
    | 'set_cultural_context'
    | 'request_validation';

  /** Action value */
  value: string;

  /** Action confidence */
  confidence: number;

  /** Cultural validation required */
  requiresCulturalValidation: boolean;

  /** Educational context */
  educationalContext?: string;
}

/**
 * Smart organization configuration
 */
export interface SmartOrganizationConfig {
  /** Enable auto-tagging */
  autoTagging: boolean;

  /** Auto-tagging confidence threshold */
  autoTaggingThreshold: number;

  /** Enable smart categorization */
  smartCategorization: boolean;

  /** Categorization confidence threshold */
  categorizationThreshold: number;

  /** Enable cultural analysis */
  culturalAnalysis: boolean;

  /** Require cultural validation for sensitive content */
  requireCulturalValidation: boolean;

  /** Enable community input */
  communityInput: boolean;

  /** Learning from user corrections */
  learningEnabled: boolean;

  /** Batch processing settings */
  batchProcessing: {
    enabled: boolean;
    batchSize: number;
    processingInterval: number; // minutes
  };
}

/**
 * Organization service interface
 */
export interface OrganizationService {
  // Analysis and suggestions
  analyzeItem(itemId: string, itemType: 'document' | 'collection'): Promise<OrganizationAnalysis>;
  generateTagSuggestions(
    content: string,
    culturalMetadata?: CulturalMetadata
  ): Promise<TagSuggestion[]>;
  generateCategorySuggestions(
    content: string,
    culturalMetadata?: CulturalMetadata
  ): Promise<CategorySuggestion[]>;
  analyzeCulturalContext(content: string): Promise<Partial<CulturalMetadata>>;

  // Auto-organization
  applyAutoOrganization(
    itemId: string,
    itemType: 'document' | 'collection',
    analysis?: OrganizationAnalysis
  ): Promise<void>;
  applyOrganizationRules(
    itemId: string,
    itemType: 'document' | 'collection',
    rules: OrganizationRule[]
  ): Promise<OrganizationRuleMatch[]>;

  // Rule management
  createOrganizationRule(rule: Omit<OrganizationRule, 'id'>): Promise<OrganizationRule>;
  updateOrganizationRule(
    ruleId: string,
    updates: Partial<OrganizationRule>
  ): Promise<OrganizationRule>;
  deleteOrganizationRule(ruleId: string): Promise<void>;
  getOrganizationRules(collectionId?: string): Promise<OrganizationRule[]>;

  // Batch operations
  batchAnalyze(
    itemIds: string[],
    itemType: 'document' | 'collection'
  ): Promise<OrganizationAnalysis[]>;
  batchApplyOrganization(analyses: OrganizationAnalysis[]): Promise<void>;

  // Configuration
  getOrganizationConfig(): Promise<SmartOrganizationConfig>;
  updateOrganizationConfig(
    config: Partial<SmartOrganizationConfig>
  ): Promise<SmartOrganizationConfig>;

  // Learning and improvement
  recordUserCorrection(
    itemId: string,
    originalSuggestion: TagSuggestion | CategorySuggestion,
    userChoice: string
  ): Promise<void>;
  getOrganizationStatistics(): Promise<OrganizationStatistics>;
}

/**
 * Organization statistics
 */
export interface OrganizationStatistics {
  /** Total items analyzed */
  totalAnalyzed: number;

  /** Auto-organization success rate */
  successRate: number;

  /** Average confidence score */
  averageConfidence: number;

  /** Cultural validation requests */
  culturalValidationRequests: number;

  /** Community contributions */
  communityContributions: number;

  /** Most common tags */
  popularTags: { tag: string; count: number; culturalContext?: string }[];

  /** Most common categories */
  popularCategories: { category: string; count: number; culturalContext?: string }[];

  /** Processing performance */
  performance: {
    averageProcessingTime: number; // milliseconds
    itemsProcessedToday: number;
    itemsProcessedThisWeek: number;
  };
}

/**
 * Organization service implementation
 */
class OrganizationServiceImpl implements OrganizationService {
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private analysisCache = new Map<string, { data: OrganizationAnalysis; timestamp: number }>();
  private configCache: { data: SmartOrganizationConfig; timestamp: number } | null = null;

  /**
   * Analyze item for organization suggestions
   */
  async analyzeItem(
    itemId: string,
    itemType: 'document' | 'collection'
  ): Promise<OrganizationAnalysis> {
    try {
      // Check cache first
      const cacheKey = `${itemType}_${itemId}`;
      const cached = this.analysisCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      const result = await invoke<OrganizationAnalysis>('analyze_item_organization', {
        itemId,
        itemType,
      });

      // Process and enhance the analysis
      const enhancedAnalysis = await this.enhanceAnalysis(result);

      // Cache the result
      this.analysisCache.set(cacheKey, {
        data: enhancedAnalysis,
        timestamp: Date.now(),
      });

      return enhancedAnalysis;
    } catch (error) {
      console.error(`Failed to analyze ${itemType} ${itemId}:`, error);
      throw new Error('Unable to analyze item for organization');
    }
  }

  /**
   * Generate tag suggestions with cultural awareness
   */
  async generateTagSuggestions(
    content: string,
    culturalMetadata?: CulturalMetadata
  ): Promise<TagSuggestion[]> {
    try {
      const suggestions = await invoke<TagSuggestion[]>('generate_tag_suggestions', {
        content,
        culturalMetadata,
      });

      // Filter and enhance suggestions based on cultural appropriateness
      return this.filterCulturallyAppropriateTags(suggestions, culturalMetadata);
    } catch (error) {
      console.error('Failed to generate tag suggestions:', error);
      throw new Error('Unable to generate tag suggestions');
    }
  }

  /**
   * Generate category suggestions with cultural validation
   */
  async generateCategorySuggestions(
    content: string,
    culturalMetadata?: CulturalMetadata
  ): Promise<CategorySuggestion[]> {
    try {
      const suggestions = await invoke<CategorySuggestion[]>('generate_category_suggestions', {
        content,
        culturalMetadata,
      });

      // Validate cultural appropriateness
      return this.validateCulturalCategories(suggestions, culturalMetadata);
    } catch (error) {
      console.error('Failed to generate category suggestions:', error);
      throw new Error('Unable to generate category suggestions');
    }
  }

  /**
   * Analyze cultural context of content
   */
  async analyzeCulturalContext(content: string): Promise<Partial<CulturalMetadata>> {
    try {
      const analysis = await invoke<Partial<CulturalMetadata>>('analyze_cultural_context', {
        content,
      });

      // Always return educational information, never restrict access
      return {
        ...analysis,
        // Ensure educational purpose is maintained
        educationalContext:
          analysis.educationalContext ||
          'Content analyzed for cultural context to enhance understanding',
      };
    } catch (error) {
      console.error('Failed to analyze cultural context:', error);
      // Return basic metadata on error
      return {
        sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
        educationalContext: 'Cultural context analysis unavailable',
      };
    }
  }

  /**
   * Apply auto-organization to an item
   */
  async applyAutoOrganization(
    itemId: string,
    itemType: 'document' | 'collection',
    analysis?: OrganizationAnalysis
  ): Promise<void> {
    try {
      // Get analysis if not provided
      const itemAnalysis = analysis || (await this.analyzeItem(itemId, itemType));

      // Get configuration
      const config = await this.getOrganizationConfig();

      // Apply auto-tagging
      if (config.autoTagging) {
        const highConfidenceTags = itemAnalysis.tagSuggestions
          .filter(tag => tag.confidence >= config.autoTaggingThreshold)
          .map(tag => tag.tag);

        if (highConfidenceTags.length > 0) {
          await this.applyTags(itemId, itemType, highConfidenceTags);
        }
      }

      // Apply smart categorization
      if (config.smartCategorization) {
        const highConfidenceCategories = itemAnalysis.categorySuggestions
          .filter(
            cat =>
              cat.confidence >= config.categorizationThreshold && cat.culturalAppropriateness > 0.8
          )
          .map(cat => cat.category);

        if (highConfidenceCategories.length > 0) {
          await this.applyCategories(itemId, itemType, highConfidenceCategories);
        }
      }

      // Apply cultural metadata if analysis is confident
      if (config.culturalAnalysis && itemAnalysis.overallConfidence > 0.7) {
        await this.applyCulturalMetadata(itemId, itemType, itemAnalysis.culturalSuggestions);
      }

      // Apply organization rules
      if (itemAnalysis.ruleMatches.length > 0) {
        await this.applyRuleActions(itemId, itemType, itemAnalysis.ruleMatches);
      }
    } catch (error) {
      console.error(`Failed to apply auto-organization to ${itemType} ${itemId}:`, error);
      throw new Error('Unable to apply auto-organization');
    }
  }

  /**
   * Apply organization rules to an item
   */
  async applyOrganizationRules(
    itemId: string,
    itemType: 'document' | 'collection',
    rules: OrganizationRule[]
  ): Promise<OrganizationRuleMatch[]> {
    try {
      return await invoke<OrganizationRuleMatch[]>('apply_organization_rules', {
        itemId,
        itemType,
        rules,
      });
    } catch (error) {
      console.error(`Failed to apply organization rules to ${itemType} ${itemId}:`, error);
      throw new Error('Unable to apply organization rules');
    }
  }

  /**
   * Create a new organization rule
   */
  async createOrganizationRule(rule: Omit<OrganizationRule, 'id'>): Promise<OrganizationRule> {
    try {
      // Validate rule for cultural appropriateness
      await this.validateOrganizationRule(rule);

      const result = await invoke<OrganizationRule>('create_organization_rule', {
        rule: {
          ...rule,
          id: crypto.randomUUID(),
        },
      });

      return result;
    } catch (error) {
      console.error('Failed to create organization rule:', error);
      throw new Error('Unable to create organization rule');
    }
  }

  /**
   * Update an organization rule
   */
  async updateOrganizationRule(
    ruleId: string,
    updates: Partial<OrganizationRule>
  ): Promise<OrganizationRule> {
    try {
      // Validate updates for cultural appropriateness
      if (updates.action || updates.condition) {
        await this.validateOrganizationRule(updates as any);
      }

      return await invoke<OrganizationRule>('update_organization_rule', {
        ruleId,
        updates,
      });
    } catch (error) {
      console.error(`Failed to update organization rule ${ruleId}:`, error);
      throw new Error('Unable to update organization rule');
    }
  }

  /**
   * Delete an organization rule
   */
  async deleteOrganizationRule(ruleId: string): Promise<void> {
    try {
      await invoke('delete_organization_rule', { ruleId });
    } catch (error) {
      console.error(`Failed to delete organization rule ${ruleId}:`, error);
      throw new Error('Unable to delete organization rule');
    }
  }

  /**
   * Get organization rules
   */
  async getOrganizationRules(collectionId?: string): Promise<OrganizationRule[]> {
    try {
      return await invoke<OrganizationRule[]>('get_organization_rules', {
        collectionId,
      });
    } catch (error) {
      console.error('Failed to get organization rules:', error);
      throw new Error('Unable to load organization rules');
    }
  }

  /**
   * Batch analyze multiple items
   */
  async batchAnalyze(
    itemIds: string[],
    itemType: 'document' | 'collection'
  ): Promise<OrganizationAnalysis[]> {
    try {
      // Process in batches to avoid overwhelming the system
      const batchSize = 10;
      const results: OrganizationAnalysis[] = [];

      for (let i = 0; i < itemIds.length; i += batchSize) {
        const batch = itemIds.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(id => this.analyzeItem(id, itemType)));
        results.push(...batchResults);
      }

      return results;
    } catch (error) {
      console.error('Failed to batch analyze items:', error);
      throw new Error('Unable to batch analyze items');
    }
  }

  /**
   * Batch apply organization
   */
  async batchApplyOrganization(analyses: OrganizationAnalysis[]): Promise<void> {
    try {
      // Apply organization in parallel with rate limiting
      const batchSize = 5;

      for (let i = 0; i < analyses.length; i += batchSize) {
        const batch = analyses.slice(i, i + batchSize);
        await Promise.all(
          batch.map(analysis =>
            this.applyAutoOrganization(analysis.itemId, analysis.itemType, analysis)
          )
        );

        // Small delay between batches to avoid overwhelming the system
        if (i + batchSize < analyses.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Failed to batch apply organization:', error);
      throw new Error('Unable to batch apply organization');
    }
  }

  /**
   * Get organization configuration
   */
  async getOrganizationConfig(): Promise<SmartOrganizationConfig> {
    try {
      // Check cache first
      if (this.configCache && Date.now() - this.configCache.timestamp < this.CACHE_TTL) {
        return this.configCache.data;
      }

      const config = await invoke<SmartOrganizationConfig>('get_organization_config');

      // Cache the result
      this.configCache = {
        data: config,
        timestamp: Date.now(),
      };

      return config;
    } catch (error) {
      console.error('Failed to get organization config:', error);

      // Return default configuration
      return {
        autoTagging: true,
        autoTaggingThreshold: 0.8,
        smartCategorization: true,
        categorizationThreshold: 0.7,
        culturalAnalysis: true,
        requireCulturalValidation: true,
        communityInput: true,
        learningEnabled: true,
        batchProcessing: {
          enabled: true,
          batchSize: 10,
          processingInterval: 60,
        },
      };
    }
  }

  /**
   * Update organization configuration
   */
  async updateOrganizationConfig(
    config: Partial<SmartOrganizationConfig>
  ): Promise<SmartOrganizationConfig> {
    try {
      const result = await invoke<SmartOrganizationConfig>('update_organization_config', {
        config,
      });

      // Clear cache
      this.configCache = null;

      return result;
    } catch (error) {
      console.error('Failed to update organization config:', error);
      throw new Error('Unable to update organization configuration');
    }
  }

  /**
   * Record user correction for learning
   */
  async recordUserCorrection(
    itemId: string,
    originalSuggestion: TagSuggestion | CategorySuggestion,
    userChoice: string
  ): Promise<void> {
    try {
      await invoke('record_user_correction', {
        itemId,
        originalSuggestion,
        userChoice,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to record user correction:', error);
      // Don't throw error for learning data - it's not critical
    }
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStatistics(): Promise<OrganizationStatistics> {
    try {
      return await invoke<OrganizationStatistics>('get_organization_statistics');
    } catch (error) {
      console.error('Failed to get organization statistics:', error);
      throw new Error('Unable to load organization statistics');
    }
  }

  // Private helper methods

  /**
   * Enhance analysis with additional processing
   */
  private async enhanceAnalysis(analysis: OrganizationAnalysis): Promise<OrganizationAnalysis> {
    // Add cultural validation flags
    const enhancedTagSuggestions = analysis.tagSuggestions.map(tag => ({
      ...tag,
      traditionalKnowledge: this.isTraditionalKnowledgeTag(tag.tag),
    }));

    // Calculate overall confidence
    const avgTagConfidence =
      analysis.tagSuggestions.reduce((sum, tag) => sum + tag.confidence, 0) /
        analysis.tagSuggestions.length || 0;
    const avgCategoryConfidence =
      analysis.categorySuggestions.reduce((sum, cat) => sum + cat.confidence, 0) /
        analysis.categorySuggestions.length || 0;
    const overallConfidence = (avgTagConfidence + avgCategoryConfidence) / 2;

    return {
      ...analysis,
      tagSuggestions: enhancedTagSuggestions,
      overallConfidence,
    };
  }

  /**
   * Filter tags for cultural appropriateness
   */
  private filterCulturallyAppropriateTags(
    suggestions: TagSuggestion[],
    culturalMetadata?: CulturalMetadata
  ): TagSuggestion[] {
    return suggestions.filter(tag => {
      // Always allow general tags
      if (tag.source !== 'cultural_analysis') {
        return true;
      }

      // For cultural tags, ensure they're appropriate
      if (
        tag.traditionalKnowledge &&
        culturalMetadata?.sensitivityLevel &&
        culturalMetadata.sensitivityLevel >= CulturalSensitivityLevel.GUARDIAN
      ) {
        // Add educational context for traditional knowledge tags
        tag.reason += ' (Traditional knowledge - educational context provided)';
        return true;
      }

      return !tag.traditionalKnowledge || tag.confidence > 0.9;
    });
  }

  /**
   * Validate categories for cultural appropriateness
   */
  private validateCulturalCategories(
    suggestions: CategorySuggestion[],
    culturalMetadata?: CulturalMetadata
  ): CategorySuggestion[] {
    return suggestions.map(category => {
      // Ensure cultural appropriateness is calculated
      if (!category.culturalAppropriateness) {
        category.culturalAppropriateness = this.calculateCulturalAppropriateness(
          category.category,
          culturalMetadata
        );
      }

      // Add community validation requirement for sensitive categories
      if (
        category.culturalAppropriateness < 0.8 ||
        (culturalMetadata?.sensitivityLevel &&
          culturalMetadata.sensitivityLevel >= CulturalSensitivityLevel.COMMUNITY)
      ) {
        category.requiresCommunityValidation = true;
      }

      return category;
    });
  }

  /**
   * Check if a tag relates to traditional knowledge
   */
  private isTraditionalKnowledgeTag(tag: string): boolean {
    const traditionalKeywords = [
      'traditional',
      'sacred',
      'ceremonial',
      'ritual',
      'indigenous',
      'tribal',
      'ancestral',
      'spiritual',
      'medicine',
      'healing',
      'elder',
      'wisdom',
      'cultural',
      'heritage',
      'community',
      'oral',
      'storytelling',
    ];

    return traditionalKeywords.some(keyword => tag.toLowerCase().includes(keyword.toLowerCase()));
  }

  /**
   * Calculate cultural appropriateness score
   */
  private calculateCulturalAppropriateness(
    category: string,
    culturalMetadata?: CulturalMetadata
  ): number {
    // Base appropriateness
    let score = 0.8;

    // Adjust based on cultural sensitivity
    if (culturalMetadata?.sensitivityLevel) {
      if (culturalMetadata.sensitivityLevel >= CulturalSensitivityLevel.SACRED) {
        score = 0.6; // Require more validation for sacred content
      } else if (culturalMetadata.sensitivityLevel >= CulturalSensitivityLevel.GUARDIAN) {
        score = 0.7;
      }
    }

    // Check for potentially sensitive categories
    const sensitiveCategoryKeywords = ['sacred', 'ceremonial', 'ritual', 'spiritual'];
    if (sensitiveCategoryKeywords.some(keyword => category.toLowerCase().includes(keyword))) {
      score = Math.min(score, 0.6);
    }

    return score;
  }

  /**
   * Validate organization rule for cultural appropriateness
   */
  private async validateOrganizationRule(rule: Partial<OrganizationRule>): Promise<void> {
    // Check if rule action involves cultural content
    if (rule.action?.type === 'set_cultural_context') {
      // Ensure educational purpose
      if (!rule.action.value.includes('educational') && !rule.action.value.includes('learning')) {
        throw new Error('Cultural context rules must include educational purpose');
      }
    }

    // Validate condition doesn't restrict based on cultural factors inappropriately
    if (rule.condition?.field === 'cultural_origin' && rule.condition.operator === 'equals') {
      console.warn('Organization rule may need community validation for cultural origin filtering');
    }
  }

  /**
   * Apply tags to an item
   */
  private async applyTags(
    itemId: string,
    itemType: 'document' | 'collection',
    tags: string[]
  ): Promise<void> {
    try {
      await invoke('apply_tags_to_item', {
        itemId,
        itemType,
        tags,
      });
    } catch (error) {
      console.error(`Failed to apply tags to ${itemType} ${itemId}:`, error);
    }
  }

  /**
   * Apply categories to an item
   */
  private async applyCategories(
    itemId: string,
    itemType: 'document' | 'collection',
    categories: string[]
  ): Promise<void> {
    try {
      await invoke('apply_categories_to_item', {
        itemId,
        itemType,
        categories,
      });
    } catch (error) {
      console.error(`Failed to apply categories to ${itemType} ${itemId}:`, error);
    }
  }

  /**
   * Apply cultural metadata to an item
   */
  private async applyCulturalMetadata(
    itemId: string,
    itemType: 'document' | 'collection',
    metadata: Partial<CulturalMetadata>
  ): Promise<void> {
    try {
      await invoke('apply_cultural_metadata_to_item', {
        itemId,
        itemType,
        metadata,
      });
    } catch (error) {
      console.error(`Failed to apply cultural metadata to ${itemType} ${itemId}:`, error);
    }
  }

  /**
   * Apply rule actions to an item
   */
  private async applyRuleActions(
    itemId: string,
    itemType: 'document' | 'collection',
    ruleMatches: OrganizationRuleMatch[]
  ): Promise<void> {
    try {
      for (const match of ruleMatches) {
        for (const action of match.suggestedActions) {
          if (action.confidence > 0.7) {
            await this.executeOrganizationAction(itemId, itemType, action);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to apply rule actions to ${itemType} ${itemId}:`, error);
    }
  }

  /**
   * Execute a specific organization action
   */
  private async executeOrganizationAction(
    itemId: string,
    itemType: 'document' | 'collection',
    action: OrganizationAction
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'add_tag':
          await this.applyTags(itemId, itemType, [action.value]);
          break;
        case 'set_category':
          await this.applyCategories(itemId, itemType, [action.value]);
          break;
        case 'set_cultural_context':
          await this.applyCulturalMetadata(itemId, itemType, {
            culturalContext: action.value,
            educationalContext: action.educationalContext,
          });
          break;
        case 'move_to_collection':
          await invoke('move_item_to_collection', {
            itemId,
            itemType,
            targetCollectionId: action.value,
          });
          break;
        case 'request_validation':
          await invoke('request_cultural_validation', {
            itemId,
            itemType,
            reason: action.value,
          });
          break;
      }
    } catch (error) {
      console.error(`Failed to execute organization action ${action.type}:`, error);
    }
  }
}

// Export singleton instance
export const organizationService: OrganizationService = new OrganizationServiceImpl();
