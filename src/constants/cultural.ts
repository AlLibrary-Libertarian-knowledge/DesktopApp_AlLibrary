// Cultural Information Constants (NO ACCESS CONTROL - INFORMATION ONLY)
export const CULTURAL_SENSITIVITY_LEVELS = {
  PUBLIC: 1,
  COMMUNITY: 2,
  TRADITIONAL: 3,
  SACRED: 4,
  CEREMONIAL: 5,
};

export const CULTURAL_LABELS = {
  [CULTURAL_SENSITIVITY_LEVELS.PUBLIC]: 'General Cultural Context',
  [CULTURAL_SENSITIVITY_LEVELS.COMMUNITY]: 'Community Knowledge',
  [CULTURAL_SENSITIVITY_LEVELS.TRADITIONAL]: 'Traditional Knowledge',
  [CULTURAL_SENSITIVITY_LEVELS.SACRED]: 'Sacred Content',
  [CULTURAL_SENSITIVITY_LEVELS.CEREMONIAL]: 'Ceremonial Content',
};

export const CULTURAL_INFORMATION = {
  EDUCATIONAL_PURPOSE: 'This content provides cultural context for educational purposes',
  NO_ACCESS_CONTROL: 'Cultural information is provided for learning - not for access restriction',
  MULTIPLE_PERSPECTIVES: 'AlLibrary supports diverse cultural interpretations equally',
  INFORMATION_FREEDOM: 'Cultural context enhances understanding without limiting access',
};
