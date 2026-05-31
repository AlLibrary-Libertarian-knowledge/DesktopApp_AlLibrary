/**
 * Legacy stub — cultural sensitivity analysis removed from the product.
 */

import type { CulturalAnalysis, CulturalInformation } from '@/types/Cultural';
import { CulturalSensitivityLevel } from '@/types/Cultural';
import type { Document } from '@/types/Document';

export class CulturalValidator {
  async analyzeCulturalSensitivity(content: string | Document): Promise<CulturalAnalysis> {
    void content;
    return {
      sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
      detectedLevel: CulturalSensitivityLevel.PUBLIC,
      confidence: 0,
      detectedSymbols: [],
      suggestedContext: 'Content accessible — cultural analysis disabled',
      recommendedInformation: [],
      informationOnly: true,
      educationalPurpose: true,
      analysisMetadata: {
        analyzedAt: new Date(),
        analysisVersion: 'stub',
        reviewRequired: false,
      },
    };
  }

  async provideCulturalInformation(
    _documentId: string,
    _userId: string
  ): Promise<CulturalInformation> {
    return {
      informationOnly: true,
      educationalPurpose: true,
      culturalContext: 'Cultural information unavailable in minimal product mode',
    };
  }
}

export const culturalValidator = new CulturalValidator();
