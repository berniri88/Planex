import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      setUser: (user: User | null) => set({ user }),
      setSession: (session: Session | null) => set({ session, isLoading: false }),
      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null });
      },
    }),
    {
      name: 'planex-auth-storage',
    }
  )
);

supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session);
  useAuthStore.getState().setUser(session?.user ?? null);
});
