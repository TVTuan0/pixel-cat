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

const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');

// t('dayCount', { n: 3 }) -> "Day 3"
export function t(key, values = {}) {
  return fill(LANGUAGES[current][key] ?? LANGUAGES.en[key] ?? key, values);
}

// One line at random from a list of lines, e.g. line('talk_feed').
export function line(key, values = {}, random = Math.random) {
  const lines = [LANGUAGES[current][key] ?? LANGUAGES.en[key] ?? key].flat();
  return fill(lines[Math.floor(random() * lines.length)], values);
}
