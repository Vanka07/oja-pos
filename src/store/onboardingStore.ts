import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ShopInfo {
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  currency: string;
}

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  shopInfo: ShopInfo | null;
  setShopInfo: (info: ShopInfo) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      shopInfo: null,
      setShopInfo: (info) => set({ shopInfo: info }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false, shopInfo: null }),
    }),
    {
      name: 'onboarding-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
