import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import { useStaffStore } from './staffStore';

interface AuthState {
  // Legacy single PIN — kept for backward compat / first-time setup
  pin: string | null;
  isLocked: boolean;
  recoveryCode: string | null;

  setPin: (pin: string) => void;
  unlock: (pin: string) => boolean;
  lock: () => void;
  hasPin: () => boolean;
  generateRecoveryCode: () => string;
  resetWithRecovery: (code: string, newPin: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      pin: null,
      isLocked: true,
      recoveryCode: null,

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
            // Mark session as authenticated on web to prevent re-lock on refresh
            if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('oja_authenticated', 'true');
            }
            return true;
          }
          return false;
        }

        // Fallback: legacy single PIN (no staff members created yet)
        const stored = get().pin;
        if (stored === pin) {
          set({ isLocked: false });
          // Mark session as authenticated on web to prevent re-lock on refresh
          if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('oja_authenticated', 'true');
          }
          return true;
        }
        return false;
      },

      lock: () => {
        // Also clear current staff on lock
        useStaffStore.getState().logout();
        // Clear session authentication on web so next refresh will require PIN
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('oja_authenticated');
        }
        set({ isLocked: true });
      },

      hasPin: () => {
        const staffStore = useStaffStore.getState();
        // Has PIN if either legacy pin is set OR staff members exist
        return get().pin !== null || staffStore.staff.length > 0;
      },

      generateRecoveryCode: () => {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        set({ recoveryCode: code });
        return code;
      },

      resetWithRecovery: (code: string, newPin: string) => {
        const stored = get().recoveryCode;
        if (stored && stored === code) {
          set({ pin: newPin, isLocked: false });
          return true;
        }
        return false;
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => zustandStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Old version didn't persist isLocked — set to false so existing
          // users aren't locked on every refresh after this update
          persistedState.isLocked = false;
        }
        return persistedState;
      },
      partialize: (state) => ({
        pin: state.pin,
        // Don't persist isLocked — always start locked if PIN exists
        recoveryCode: state.recoveryCode,
      }),
      onRehydrateStorage: () => (state) => {
        // After hydration, lock if PIN exists UNLESS already authenticated this session (web)
        // Use setTimeout to ensure this runs after all stores hydrate
        setTimeout(() => {
          const authState = useAuthStore.getState();
          const staffState = useStaffStore.getState();
          const hasPinOrStaff = authState.pin !== null || staffState.staff.length > 0;
          
          // Check if user already authenticated in this browser session
          const sessionAuthenticated = typeof window !== 'undefined' && 
            typeof sessionStorage !== 'undefined' && 
            sessionStorage.getItem('oja_authenticated') === 'true';
          
          if (hasPinOrStaff && !sessionAuthenticated) {
            useAuthStore.setState({ isLocked: true });
          } else if (hasPinOrStaff && sessionAuthenticated) {
            useAuthStore.setState({ isLocked: false });
          }
        }, 50);
      },
    }
  )
);
