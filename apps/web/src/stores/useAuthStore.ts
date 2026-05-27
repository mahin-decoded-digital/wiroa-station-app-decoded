import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  users: User[];
  currentUser: User | null;
  register: (input: {
    email: string;
    password: string;
    fullName: string;
    role: User['role'];
    lotNumber: string | null;
  }) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, 'fullName' | 'avatarInitials'>>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,

      register: (input) => {
        const { users } = get();
        const existing = users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
        if (existing) {
          return { ok: false, error: 'Email already registered' };
        }
        const initials = input.fullName
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0].toUpperCase())
          .slice(0, 2)
          .join('');
        const newUser: User = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          email: input.email,
          password: input.password,
          fullName: input.fullName,
          role: input.role,
          lotNumber: input.lotNumber,
          avatarInitials: initials,
          isBoardMember: false,
        };
        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser,
        }));
        return { ok: true };
      },

      login: (email, password) => {
        const { users } = get();
        const user = users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (user) {
          set({ currentUser: user });
          return { ok: true };
        }
        return { ok: false, error: 'Invalid credentials' };
      },

      logout: () => {
        set({ currentUser: null });
      },

      updateProfile: (updates) => {
        const { currentUser, users } = get();
        if (!currentUser) return;
        const updated = { ...currentUser, ...updates };
        set({
          currentUser: updated,
          users: users.map((u) => (u.id === currentUser.id ? updated : u)),
        });
      },
    }),
    { name: 'wiroa-auth' }
  )
);
