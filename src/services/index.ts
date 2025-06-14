/**
 * Services Index
 *
 * Central export point for all service modules following SOLID architecture
 * - Validation services (cultural information + security validation)
 * - Storage services (local database management)
 * - API services (external integrations)
 * - Network services (P2P communication)
 */

// Validation Services
export { validationService } from './validationService';
export { culturalValidator, securityValidator, documentValidator } from './validation';

// Export validation types
export type {
  CulturalSensitivityLevel,
  CulturalInformation,
  CulturalAnalysis,
} from '@/types/Cultural';

// Re-export commonly used service patterns
export { ValidationService } from './validationService';
