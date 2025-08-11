import { createSignal } from 'solid-js';

export type GlobalNote = {
  id: string;
  docPath?: string | undefined; // optional to allow cross-document notes
  page?: number; // optional; when present, enables jump
  title?: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
};

const STORAGE_KEY = 'alibrary:globalNotes:v1';

function loadFromStorage(): GlobalNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GlobalNote[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(notes: GlobalNote[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

const [notes, setNotes] = createSignal<GlobalNote[]>(loadFromStorage());

export const globalNotesStore = {
  notes,
  listAll: (): GlobalNote[] => notes(),
  listByDoc: (docPath?: string): GlobalNote[] =>
    notes().filter(n => (docPath ? n.docPath === docPath : true)),
  add: (payload: Omit<GlobalNote, 'id' | 'createdAt'>): GlobalNote => {
    const newNote: GlobalNote = {
      id: `gn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
      ...payload,
    };
    const updated = [newNote, ...notes()];
    setNotes(updated);
    saveToStorage(updated);
    return newNote;
  },
  update: (id: string, update: Partial<GlobalNote>) => {
    const updated = notes().map(n => (n.id === id ? { ...n, ...update, updatedAt: Date.now() } : n));
    setNotes(updated);
    saveToStorage(updated);
  },
  remove: (id: string) => {
    const updated = notes().filter(n => n.id !== id);
    setNotes(updated);
    saveToStorage(updated);
  },
};

export type GlobalNotesStore = typeof globalNotesStore;


