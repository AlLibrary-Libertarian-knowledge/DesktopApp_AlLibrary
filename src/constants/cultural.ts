/** Legacy constants — cultural sensitivity UI removed; kept for foundation component props. */

export const CULTURAL_SENSITIVITY_LEVELS = {
  PUBLIC: 1,
  COMMUNITY: 2,
  TRADITIONAL: 3,
  SACRED: 4,
  CEREMONIAL: 5,
};

export const CULTURAL_LABELS: Record<number, string> = {
  [CULTURAL_SENSITIVITY_LEVELS.PUBLIC]: 'Document',
  [CULTURAL_SENSITIVITY_LEVELS.COMMUNITY]: 'Document',
  [CULTURAL_SENSITIVITY_LEVELS.TRADITIONAL]: 'Document',
  [CULTURAL_SENSITIVITY_LEVELS.SACRED]: 'Document',
  [CULTURAL_SENSITIVITY_LEVELS.CEREMONIAL]: 'Document',
};

export const CULTURAL_INFORMATION = {
  EDUCATIONAL_PURPOSE: 'Additional context may be available for this document.',
  NO_ACCESS_CONTROL: 'All documents remain accessible.',
  MULTIPLE_PERSPECTIVES: 'AlLibrary supports open document sharing.',
  INFORMATION_FREEDOM: 'Context is informational only.',
};
