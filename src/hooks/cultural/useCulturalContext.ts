import { createSignal, createEffect } from 'solid-js';

export interface CulturalContext {
  sensitivityLevel: 1 | 2 | 3;
  origin?: string;
  traditionalKnowledge?: boolean;
  communityVerified?: boolean;
  educationalResources?: string[];
  description?: string;
}

export const useCulturalContext = (documentId?: string) => {
  const [context, setContext] = createSignal<CulturalContext | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);

  // Default context
  const defaultContext: CulturalContext = {
    sensitivityLevel: 1,
    origin: 'Academic',
    traditionalKnowledge: false,
    communityVerified: true,
    description: 'General cultural context available for educational purposes.',
  };

  // Mock cultural contexts
  const mockContexts: Record<string, CulturalContext> = {
    '1': defaultContext,
    '2': {
      sensitivityLevel: 2,
      origin: 'Indigenous',
      traditionalKnowledge: true,
      communityVerified: true,
      description: 'Traditional knowledge context available with educational resources.',
    },
    '3': {
      sensitivityLevel: 3,
      origin: 'Tribal',
      traditionalKnowledge: true,
      communityVerified: true,
      description: 'Sacred content with comprehensive educational context provided.',
    },
  };

  const loadCulturalContext = async (docId: string) => {
    setIsLoading(true);

    try {
      const culturalContext = mockContexts[docId] ?? defaultContext;
      setContext(culturalContext);
    } catch (error) {
      console.error('Failed to load cultural context:', error);
      setContext(defaultContext);
    } finally {
      setIsLoading(false);
    }
  };

  createEffect(() => {
    if (documentId) {
      loadCulturalContext(documentId);
    }
  });

  return {
    context,
    isLoading,
    loadCulturalContext,
    hasContext: () => !!context(),
    sensitivityLevel: () => context()?.sensitivityLevel || 1,
    canAccess: () => true, // Always true - information only
    educationalPurpose: () => true,
  };
};
