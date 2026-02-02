import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

interface CatalogState {
  catalogEnabled: boolean;
  shopSlug: string | null;
  catalogProducts: string[];
  shopDescription: string;
  whatsappNumber: string;
  setCatalogEnabled: (enabled: boolean) => void;
  setShopSlug: (slug: string) => void;
  setShopDescription: (description: string) => void;
  setWhatsappNumber: (number: string) => void;
  setCatalogProducts: (productIds: string[]) => void;
  generateSlug: (shopName: string) => string;
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set) => ({
      catalogEnabled: false,
      shopSlug: null,
      catalogProducts: [],
      shopDescription: '',
      whatsappNumber: '',
      setCatalogEnabled: (enabled) => set({ catalogEnabled: enabled }),
      setShopSlug: (slug) => set({ shopSlug: slug }),
      setShopDescription: (description) => set({ shopDescription: description }),
      setWhatsappNumber: (number) => set({ whatsappNumber: number }),
      setCatalogProducts: (productIds) => set({ catalogProducts: productIds }),
      generateSlug: (shopName: string) => {
        const slug = shopName
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        set({ shopSlug: slug });
        return slug;
      },
    }),
    {
      name: 'catalog-store',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
