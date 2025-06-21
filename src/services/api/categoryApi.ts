/**
 * Category API Service
 *
 * Manages category operations for hierarchical content organization.
 * Follows SOLID principles and anti-censorship standards.
 */

import { apiClient, type ApiResponse } from './apiClient';
import type { CulturalSensitivityLevel } from '../../types/Cultural';

/**
 * Category interfaces following the business requirements
 */
export interface Category {
  id: string;
  name: string;
  description: string;
  type: CategoryType;

  // Hierarchy
  parentId?: string;
  children: string[];
  level: number;
  path: string[];

  // Cultural context (informational only)
  culturalContext?: {
    sensitivityLevel: CulturalSensitivityLevel;
    culturalOrigin?: string;
    traditionalName?: string;
    culturalSignificance?: string;
    elderApproved?: boolean;
    communityEndorsed?: boolean;
  };

  // Content organization
  contentCount: number;
  subcategoryCount: number;
  featuredContent: string[];

  // Display
  icon: string;
  color: string;
  thumbnail?: string;
  isVisible: boolean;
  sortOrder: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
  tags: string[];
  keywords: string[];
}

export enum CategoryType {
  CULTURAL = 'cultural',
  TOPICAL = 'topical',
  FORMAT = 'format',
  TEMPORAL = 'temporal',
  GEOGRAPHIC = 'geographic',
  KNOWLEDGE_SYSTEM = 'knowledge_system',
  PRACTICE = 'practice',
  LANGUAGE = 'language',
}

export interface CategoryTree {
  [key: string]: CategoryNode;
}

export interface CategoryNode extends Category {
  subcategories: CategoryNode[];
  parentCategory?: CategoryNode;
}

export interface CategoryFilters {
  types: CategoryType[];
  culturalSensitivity: CulturalSensitivityLevel[];
  hasContent: boolean;
  minContentCount: number;
  searchQuery: string;
  culturalOrigins: string[];
}

export interface CategorySearchResult {
  category: Category;
  relevanceScore: number;
  matchedFields: string[];
  culturalContext?: string;
}

/**
 * Category API Service Class
 * Implements Interface Segregation Principle - focused on category operations only
 */
export class CategoryApiService {
  /**
   * Get complete category tree with cultural context
   */
  async getCategoryTree(
    options: {
      includeMetadata?: boolean;
      includeCulturalContext?: boolean;
      maxDepth?: number;
    } = {}
  ): Promise<ApiResponse<CategoryTree>> {
    return apiClient.get<CategoryTree>('category_tree', {
      includeMetadata: options.includeMetadata ?? true,
      includeCulturalContext: options.includeCulturalContext ?? true,
      maxDepth: options.maxDepth ?? 6,
    });
  }

  /**
   * Get specific category with full details
   */
  async getCategory(categoryId: string): Promise<ApiResponse<CategoryNode>> {
    return apiClient.get<CategoryNode>('category', {
      categoryId,
      includeSubcategories: true,
      includeContentStats: true,
    });
  }

  /**
   * Get categories by parent (for navigation)
   */
  async getSubcategories(parentId?: string): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('subcategories', {
      parentId,
      includeCulturalContext: true,
    });
  }

  /**
   * Search categories with cultural awareness
   */
  async searchCategories(
    query: string,
    filters: Partial<CategoryFilters> = {}
  ): Promise<ApiResponse<CategorySearchResult[]>> {
    return apiClient.search<CategorySearchResult[]>('categories', query, {
      ...filters,
      respectCulturalProtocols: true,
      educationalPurpose: true,
    });
  }

  /**
   * Get category hierarchy path (breadcrumbs)
   */
  async getCategoryPath(categoryId: string): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('category_path', { categoryId });
  }

  /**
   * Get featured categories for homepage/discovery
   */
  async getFeaturedCategories(limit: number = 12): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('featured_categories', {
      limit,
      includeCulturalContext: true,
    });
  }

  /**
   * Get categories by type
   */
  async getCategoriesByType(type: CategoryType): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('categories_by_type', {
      type,
      includeCulturalContext: true,
    });
  }

  /**
   * Get cultural categories with traditional classifications
   */
  async getCulturalCategories(): Promise<
    ApiResponse<{
      categories: Category[];
      traditionalClassifications: Record<string, Category[]>;
      culturalHierarchies: Record<string, CategoryNode[]>;
    }>
  > {
    return apiClient.get('cultural_categories', {
      includeTraditionalClassifications: true,
      includeCulturalHierarchies: true,
      educationalPurpose: true,
    });
  }

  /**
   * Get category statistics for analytics
   */
  async getCategoryStatistics(categoryId?: string): Promise<
    ApiResponse<{
      totalCategories: number;
      categoriesByType: Record<CategoryType, number>;
      contentDistribution: Record<string, number>;
      culturalRepresentation: Record<string, number>;
      popularCategories: Category[];
    }>
  > {
    return apiClient.get('category_statistics', { categoryId });
  }

  /**
   * Create new category (with cultural validation for information only)
   */
  async createCategory(
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<Category>> {
    // Cultural validation is informational only - never blocks creation
    const culturalValidation = await apiClient.validateCulturalProtocols(category);

    return apiClient.create<Category>('category', {
      ...category,
      culturalValidationInfo: culturalValidation, // For educational context only
    });
  }

  /**
   * Update category with cultural context validation
   */
  async updateCategory(
    categoryId: string,
    updates: Partial<Category>
  ): Promise<ApiResponse<Category>> {
    // Cultural validation is informational only
    const culturalValidation = await apiClient.validateCulturalProtocols(updates);

    return apiClient.update<Category>('category', categoryId, {
      ...updates,
      culturalValidationInfo: culturalValidation,
    });
  }

  /**
   * Get category content with pagination
   */
  async getCategoryContent(
    categoryId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'recent' | 'popular' | 'alphabetical' | 'cultural';
      includeSubcategories?: boolean;
    } = {}
  ): Promise<
    ApiResponse<{
      content: any[]; // TODO: Replace with proper Document type
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
      culturalContext?: string;
    }>
  > {
    return apiClient.get('category_content', {
      categoryId,
      page: options.page ?? 1,
      limit: options.limit ?? 20,
      sortBy: options.sortBy ?? 'recent',
      includeSubcategories: options.includeSubcategories ?? false,
    });
  }

  /**
   * Get related categories based on content similarity and cultural connections
   */
  async getRelatedCategories(
    categoryId: string,
    limit: number = 8
  ): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('related_categories', {
      categoryId,
      limit,
      includeCulturalRelations: true,
    });
  }

  /**
   * Get category recommendations for a user (personalization)
   */
  async getRecommendedCategories(
    userPreferences?: {
      culturalInterests: string[];
      contentTypes: CategoryType[];
      recentCategories: string[];
    },
    limit: number = 10
  ): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('recommended_categories', {
      userPreferences,
      limit,
      respectCulturalPreferences: true,
    });
  }

  /**
   * Validate category hierarchy for consistency
   */
  async validateCategoryHierarchy(): Promise<
    ApiResponse<{
      valid: boolean;
      issues: string[];
      culturalConsistency: boolean;
      suggestions: string[];
    }>
  > {
    return apiClient.get('validate_category_hierarchy', {
      includeCulturalValidation: true,
      educationalPurpose: true,
    });
  }
}

// Export singleton instance
export const categoryApi = new CategoryApiService();

// Export types for use in components
export type { Category, CategoryNode, CategoryTree, CategoryFilters, CategorySearchResult };
