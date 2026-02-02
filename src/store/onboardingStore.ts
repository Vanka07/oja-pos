import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

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
  businessType: string | null;
  setShopInfo: (info: ShopInfo) => void;
  setBusinessType: (type: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      shopInfo: null,
      businessType: null,
      setShopInfo: (info) => set({ shopInfo: info }),
      setBusinessType: (type) => set({ businessType: type }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false, shopInfo: null, businessType: null }),
    }),
    {
      name: 'onboarding-store',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
