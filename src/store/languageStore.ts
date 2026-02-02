import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import { t } from '@/i18n';
import { useCallback } from 'react';

interface LanguageStore {
  language: string;
  setLanguage: (code: string) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'oja-language',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

/**
 * Convenience hook: returns a translation function bound to the current language.
 */
export function useT() {
  const language = useLanguageStore((s) => s.language);
  return useCallback((key: string) => t(key, language), [language]);
}
