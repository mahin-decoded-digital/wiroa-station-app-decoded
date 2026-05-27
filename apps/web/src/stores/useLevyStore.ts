import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LevyPayment } from '@/types';

interface LevyState {
  payments: LevyPayment[];
  filterStatus: string;
  addLevy: (input: Omit<LevyPayment, 'id' | 'createdAt'>) => void;
  markPaid: (id: string, receiptRef: string) => void;
  removeLevy: (id: string) => void;
  setFilterStatus: (status: string) => void;
}

export const useLevyStore = create<LevyState>()(
  persist(
    (set) => ({
      payments: [],
      filterStatus: 'all',

      addLevy: (input) => {
        const newPayment: LevyPayment = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          ...input,
        };
        set((state) => ({ payments: [...state.payments, newPayment] }));
      },

      markPaid: (id, receiptRef) => {
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === id
              ? { ...p, status: 'paid', paidDate: new Date(), receiptRef }
              : p
          ),
        }));
      },

      removeLevy: (id) => {
        set((state) => ({ payments: state.payments.filter((p) => p.id !== id) }));
      },

      setFilterStatus: (status) => {
        set({ filterStatus: status });
      },
    }),
    { name: 'wiroa-levies' }
  )
);
