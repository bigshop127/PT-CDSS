import { create } from 'zustand';

interface DocumentStore {
  pendingInsert: string | null;
  setPendingInsert: (text: string | null) => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  pendingInsert: null,
  setPendingInsert: (text) => set({ pendingInsert: text }),
}));
