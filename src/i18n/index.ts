import en from './en';
import yo from './yo';
import pcm from './pcm';
import ig from './ig';
import ha from './ha';

 
export const translations: Record<string, any> = { en, yo, pcm, ig, ha };

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'yo', name: 'Yorùbá', nativeName: 'Yorùbá', flag: '🇳🇬' },
  { code: 'pcm', name: 'Pidgin', nativeName: 'Naija Pidgin', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
];

/**
 * Translate a dot-notation key using the given language, falling back to English.
 */
export function t(key: string, lang: string): string {
  const resolve = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  };

  const value = resolve(translations[lang], key);
  if (typeof value === 'string') return value;

  // Fallback to English
  const fallback = resolve(translations.en, key);
  if (typeof fallback === 'string') return fallback;

  return key;
}
