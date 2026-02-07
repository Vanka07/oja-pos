import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import { useStaffStore, isAppRole } from './staffStore';

const generateRecoveryCodeValue = (length: number): string => {
  const cryptoObj: { getRandomValues?: (array: Uint8Array) => void } | undefined =
    typeof globalThis !== 'undefined' ? (globalThis as any).crypto : undefined;

  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(length);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes, (b) => (b % 10).toString()).join('');
  }

  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
};


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
        const hasAppPin = staffStore.staff.some(
          (s) => s.active && isAppRole(s.role) && typeof s.pin === 'string' && s.pin.length > 0
        );
        // Has PIN if either legacy pin is set OR active app-role staff exists
        return get().pin !== null || hasAppPin;
      },

      generateRecoveryCode: () => {
        const code = generateRecoveryCodeValue(6);
        set({ recoveryCode: code });
        return code;
      },

      resetWithRecovery: (code: string, newPin: string) => {
        const stored = get().recoveryCode;
        if (stored && stored === code) {
          set({ pin: newPin, isLocked: false, recoveryCode: null });
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
          // Old version didn't persist isLocked — set to false so users
          // without a PIN aren't locked after this update
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
          const hasAppPin = staffState.staff.some(
            (s) => s.active && isAppRole(s.role) && typeof s.pin === 'string' && s.pin.length > 0
          );
          const hasPinOrStaff = authState.pin !== null || hasAppPin;

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
