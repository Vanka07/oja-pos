import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

interface AuthState {
  pin: string | null;
  isLocked: boolean;
  setPin: (pin: string) => void;
  unlock: (pin: string) => boolean;
  lock: () => void;
  hasPin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      pin: null,
      isLocked: true,

      setPin: (pin: string) => {
        set({ pin, isLocked: false });
      },

      unlock: (pin: string) => {
        const stored = get().pin;
        if (stored === pin) {
          set({ isLocked: false });
          return true;
        }
        return false;
      },

      lock: () => {
        set({ isLocked: true });
      },

      hasPin: () => {
        return get().pin !== null;
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        pin: state.pin,
        isLocked: state.isLocked,
      }),
    }
  )
);
