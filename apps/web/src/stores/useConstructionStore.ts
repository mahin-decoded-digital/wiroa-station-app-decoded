import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConstructionUpdate } from '@/types';

interface ConstructionState {
  updates: ConstructionUpdate[];
  filterScope: string;
  filterPhase: string;
  addUpdate: (input: Omit<ConstructionUpdate, 'id' | 'createdAt'>) => void;
  editUpdate: (id: string, changes: Partial<Omit<ConstructionUpdate, 'id' | 'createdAt'>>) => void;
  removeUpdate: (id: string) => void;
  setFilterScope: (scope: string) => void;
  setFilterPhase: (phase: string) => void;
}

export const useConstructionStore = create<ConstructionState>()(
  persist(
    (set) => ({
      updates: [],
      filterScope: 'all',
      filterPhase: '',

      addUpdate: (input) => {
        const newUpdate: ConstructionUpdate = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          ...input,
        };
        set((state) => ({ updates: [newUpdate, ...state.updates] }));
      },

      editUpdate: (id, changes) => {
        set((state) => ({
          updates: state.updates.map((u) => (u.id === id ? { ...u, ...changes } : u)),
        }));
      },

      removeUpdate: (id) => {
        set((state) => ({ updates: state.updates.filter((u) => u.id !== id) }));
      },

      setFilterScope: (scope) => {
        set({ filterScope: scope });
      },

      setFilterPhase: (phase) => {
        set({ filterPhase: phase });
      },
    }),
    { name: 'wiroa-construction' }
  )
);
