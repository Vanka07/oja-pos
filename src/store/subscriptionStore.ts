import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

export type PlanType = 'starter' | 'business';

interface SubscriptionState {
  plan: PlanType;
  activatedAt: string | null;
  expiresAt: string | null;

  // Actions
  setPlan: (plan: PlanType) => void;
  activate: (plan: PlanType, durationDays?: number) => void;
  deactivate: () => void;
  isPremium: () => boolean;
  isExpired: () => boolean;
  daysRemaining: () => number;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan: 'starter',
      activatedAt: null,
      expiresAt: null,

      setPlan: (plan: PlanType) => {
        set({ plan });
      },

      activate: (plan: PlanType, durationDays = 30) => {
        const now = new Date();
        const expires = new Date(now);
        expires.setDate(expires.getDate() + durationDays);
        set({
          plan,
          activatedAt: now.toISOString(),
          expiresAt: expires.toISOString(),
        });
      },

      deactivate: () => {
        set({
          plan: 'starter',
          activatedAt: null,
          expiresAt: null,
        });
      },

      isPremium: () => {
        const { plan, expiresAt } = get();
        if (plan !== 'business') return false;
        if (!expiresAt) return false;
        return new Date(expiresAt) > new Date();
      },

      isExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return false;
        return new Date(expiresAt) <= new Date();
      },

      daysRemaining: () => {
        const { expiresAt } = get();
        if (!expiresAt) return 0;
        const diff = new Date(expiresAt).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      },
    }),
    {
      name: 'subscription-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        plan: state.plan,
        activatedAt: state.activatedAt,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
