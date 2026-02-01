import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import { useStaffStore } from './staffStore';

interface AuthState {
  // Legacy single PIN — kept for backward compat / first-time setup
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
        const staffStore = useStaffStore.getState();
        const hasStaff = staffStore.staff.length > 0;

        if (hasStaff) {
          // Staff system active — match PIN against all active app-role staff
          const success = staffStore.switchStaff(pin);
          if (success) {
            set({ isLocked: false });
            return true;
          }
          return false;
        }

        // Fallback: legacy single PIN (no staff members created yet)
        const stored = get().pin;
        if (stored === pin) {
          set({ isLocked: false });
          return true;
        }
        return false;
      },

      lock: () => {
        // Also clear current staff on lock
        useStaffStore.getState().logout();
        set({ isLocked: true });
      },

      hasPin: () => {
        const staffStore = useStaffStore.getState();
        // Has PIN if either legacy pin is set OR staff members exist
        return get().pin !== null || staffStore.staff.length > 0;
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
