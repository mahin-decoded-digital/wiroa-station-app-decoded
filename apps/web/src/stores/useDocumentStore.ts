import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Document } from '@/types';

interface DocumentState {
  documents: Document[];
  filterCategory: string;
  searchQuery: string;
  addDocument: (input: Omit<Document, 'id' | 'createdAt'>) => void;
  removeDocument: (id: string) => void;
  setFilterCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set) => ({
      documents: [],
      filterCategory: 'all',
      searchQuery: '',

      addDocument: (input) => {
        const newDocument: Document = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          ...input,
        };
        set((state) => ({ documents: [newDocument, ...state.documents] }));
      },

      removeDocument: (id) => {
        set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
      },

      setFilterCategory: (category) => {
        set({ filterCategory: category });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },
    }),
    { name: 'wiroa-documents' }
  )
);
