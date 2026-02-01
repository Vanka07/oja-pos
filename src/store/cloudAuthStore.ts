import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface CloudAuthState {
  session: Session | null;
  shopId: string | null;
  isAuthenticated: boolean;
  syncEnabled: boolean;
  loading: boolean;
  error: string | null;

  setSession: (session: Session | null) => void;
  setShopId: (shopId: string | null) => void;
  signUp: (email: string, password: string, shopName: string, ownerName?: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useCloudAuthStore = create<CloudAuthState>()(
  persist(
    (set, get) => ({
      session: null,
      shopId: null,
      isAuthenticated: false,
      syncEnabled: false,
      loading: false,
      error: null,

      setSession: (session) => {
        set({
          session,
          isAuthenticated: !!session,
          syncEnabled: !!session && !!get().shopId,
        });
      },

      setShopId: (shopId) => {
        set({
          shopId,
          syncEnabled: !!get().session && !!shopId,
        });
      },

      signUp: async (email, password, shopName, ownerName) => {
        set({ loading: true, error: null });
        try {
          // 1. Create Supabase auth user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error('Sign up failed - no user returned');

          // For Supabase, user might need email confirmation
          // If session is null, user needs to confirm email
          if (!authData.session) {
            set({
              loading: false,
              error: 'Please check your email to confirm your account, then sign in.',
            });
            return false;
          }

          // 2. Create shop
          const { data: shop, error: shopError } = await supabase
            .from('shops')
            .insert({
              name: shopName,
              owner_name: ownerName || '',
              currency: 'NGN',
            })
            .select()
            .single();

          if (shopError) throw shopError;

          // 3. Create shop_member linking user → shop
          const { error: memberError } = await supabase
            .from('shop_members')
            .insert({
              user_id: authData.user.id,
              shop_id: shop.id,
              role: 'owner',
              name: ownerName || email,
            });

          if (memberError) throw memberError;

          set({
            session: authData.session,
            shopId: shop.id,
            isAuthenticated: true,
            syncEnabled: true,
            loading: false,
            error: null,
          });

          return true;
        } catch (err: any) {
          set({ loading: false, error: err.message || 'Sign up failed' });
          return false;
        }
      },

      signIn: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;
          if (!data.session) throw new Error('Sign in failed');

          // Fetch shop membership
          const { data: members, error: memberError } = await supabase
            .from('shop_members')
            .select('shop_id')
            .eq('user_id', data.user.id)
            .limit(1);

          if (memberError) throw memberError;

          const shopId = members?.[0]?.shop_id || null;

          set({
            session: data.session,
            shopId,
            isAuthenticated: true,
            syncEnabled: !!shopId,
            loading: false,
            error: null,
          });

          return true;
        } catch (err: any) {
          set({ loading: false, error: err.message || 'Sign in failed' });
          return false;
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
        } catch (_) {
          // Ignore errors on sign out
        }
        set({
          session: null,
          shopId: null,
          isAuthenticated: false,
          syncEnabled: false,
          error: null,
        });
      },

      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Fetch shop membership
            const { data: members } = await supabase
              .from('shop_members')
              .select('shop_id')
              .eq('user_id', session.user.id)
              .limit(1);

            const shopId = members?.[0]?.shop_id || null;

            set({
              session,
              shopId,
              isAuthenticated: true,
              syncEnabled: !!shopId,
            });
          }
        } catch (_) {
          // Silent fail on init
        }
      },
    }),
    {
      name: 'cloud-auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        shopId: state.shopId,
        isAuthenticated: state.isAuthenticated,
        syncEnabled: state.syncEnabled,
      }),
    }
  )
);
