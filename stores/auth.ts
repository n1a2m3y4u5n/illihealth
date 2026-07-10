import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  // Supabase 세션
  session: Session | null;
  user: User | null;
  // 픽토그램 PIN 설정 완료 여부 (최초 가입 플로우 완료 체크)
  pinConfigured: boolean;
  // 로딩 상태
  isLoading: boolean;
  // 오류 메시지
  error: string | null;

  // 액션
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setPinConfigured: (configured: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  session: null,
  user: null,
  pinConfigured: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setUser: (user) => set({ user }),

  setPinConfigured: (pinConfigured) => set({ pinConfigured }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
