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
      informationOnly: true,
      educationalPurpose: true,
    };
  }

  async provideCulturalInformation(
    _documentId: string,
    _userId: string
  ): Promise<CulturalInformation> {
    return { informationOnly: true, educationalPurpose: true };
  }
}

export const culturalValidator = new CulturalValidator();
