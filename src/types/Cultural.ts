/**
 * Legacy cultural type stubs — sensitivity UI removed; types kept for compile compatibility.
 */

export enum CulturalSensitivityLevel {
  PUBLIC = 1,
  EDUCATIONAL = 2,
  COMMUNITY = 3,
  GUARDIAN = 4,
  SACRED = 5,
}

export interface CulturalMetadata {
  sensitivityLevel: CulturalSensitivityLevel;
  culturalOrigin?: string;
  communityId?: string;
  traditionalProtocols?: string[];
  educationalContext?: string;
  culturalContext?: string;
  sourceAttribution?: string;
  culturalGroup?: string;
  relatedConcepts?: string[];
  communityNotes?: string;
  [key: string]: unknown;
}

export interface CulturalInformation {
  sensitivityLevel?: CulturalSensitivityLevel;
  culturalContext?: string;
  educationalResources?: string[];
  traditionalProtocols?: string[];
  informationOnly?: boolean;
  educationalPurpose?: boolean;
  [key: string]: unknown;
}

export interface CulturalAnalysis {
  sensitivityLevel: CulturalSensitivityLevel;
  detectedLevel: CulturalSensitivityLevel;
  informationOnly?: boolean;
  educationalPurpose?: boolean;
  suggestedContext?: string;
  recommendedInformation?: string[];
  detectedOrigin?: string;
  analysisMetadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CulturalValidationContext {
  [key: string]: unknown;
}

export interface CulturalValidationStatus {
  [key: string]: unknown;
}

export interface CulturalEducationModule {
  id?: string;
  title?: string;
  [key: string]: unknown;
}

export interface CulturalEducationProgress {
  completedModules?: number;
  totalModules?: number;
  [key: string]: unknown;
}

export interface SacredSymbol {
  name?: string;
  [key: string]: unknown;
}

export interface CommunityInformation {
  id?: string;
  name?: string;
  description?: string;
  [key: string]: unknown;
}
