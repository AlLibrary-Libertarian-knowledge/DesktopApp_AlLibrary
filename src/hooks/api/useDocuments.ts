import { createSignal } from 'solid-js';

export const useDocuments = () => {
  const [documents, setDocuments] = createSignal([
    {
      id: '1',
      title: 'Introduction to Cultural Heritage',
      author: 'Dr. Sarah Johnson',
      type: 'pdf',
      pages: 145,
      culturalMetadata: { sensitivityLevel: 1 },
    },
    {
      id: '2',
      title: 'Traditional Knowledge Systems',
      author: 'Elder Maria Santos',
      type: 'epub',
      pages: 89,
      culturalMetadata: { sensitivityLevel: 2 },
    },
  ]);

  return {
    documents,
    isLoading: () => false,
    error: () => null,
    loadDocuments: () => {},
    addDocument: (doc: any) => setDocuments(prev => [...prev, doc]),
    updateDocument: (_id: string, _updates: any) => {},
    deleteDocument: (_id: string) => {},
    getDocument: (id: string) => documents().find(d => d.id === id),
  };
};
