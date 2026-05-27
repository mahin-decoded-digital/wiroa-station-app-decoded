import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IwiNotice } from '@/types';

interface IwiState {
  notices: IwiNotice[];
  filterCategory: string;
  addNotice: (input: Omit<IwiNotice, 'id' | 'createdAt'>) => void;
  acknowledgeNotice: (noticeId: string, userId: string) => void;
  removeNotice: (id: string) => void;
  setFilterCategory: (category: string) => void;
}

export const useIwiStore = create<IwiState>()(
  persist(
    (set) => ({
      notices: [],
      filterCategory: 'all',

      addNotice: (input) => {
        const newNotice: IwiNotice = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          ...input,
        };
        set((state) => ({ notices: [newNotice, ...state.notices] }));
      },

      acknowledgeNotice: (noticeId, userId) => {
        set((state) => ({
          notices: state.notices.map((n) =>
            n.id === noticeId
              ? {
                  ...n,
                  acknowledgedBy: n.acknowledgedBy.includes(userId)
                    ? n.acknowledgedBy
                    : [...n.acknowledgedBy, userId],
                }
              : n
          ),
        }));
      },

      removeNotice: (id) => {
        set((state) => ({ notices: state.notices.filter((n) => n.id !== id) }));
      },

      setFilterCategory: (category) => {
        set({ filterCategory: category });
      },
    }),
    { name: 'wiroa-iwi' }
  )
);
