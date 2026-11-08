import en from './en.js';
import vi from './vi.js';

export const LANGUAGES = { en, vi };

let current = 'en';

export function setLanguage(lang) {
  current = LANGUAGES[lang] ? lang : 'en';
  document.documentElement.lang = current;
}

export function guessLanguage() {
  return (navigator.language || '').toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

// t('dayCount', { n: 3 }) -> "Day 3"
export function t(key, values = {}) {
  const text = LANGUAGES[current][key] ?? LANGUAGES.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}
