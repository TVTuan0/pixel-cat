import { describe, it, expect } from 'vitest';
import en from '../src/i18n/en.js';
import vi from '../src/i18n/vi.js';
import { line, setLanguage } from '../src/i18n/index.js';
import { TALK_KEYS, talkGroup } from '../src/talk.js';

describe('what cats say', () => {
  it('every situation has a few lines in both languages, short enough for a bubble', () => {
    for (const key of TALK_KEYS) {
      for (const [lang, texts] of [['en', en], ['vi', vi]]) {
        const lines = texts[key];
        expect(Array.isArray(lines), `${lang} ${key}`).toBe(true);
        expect(lines.length, `${lang} ${key}`).toBeGreaterThanOrEqual(3);
        for (const text of lines) expect(text.length, `${lang} "${text}"`).toBeLessThanOrEqual(42);
      }
    }
  });

  it('picks one of the lines and fills in names', () => {
    globalThis.document ??= { documentElement: {} };
    setLanguage('vi');
    const first = line('talk_pet_happy', {}, () => 0);
    expect(first).toBe(vi.talk_pet_happy[0]);
    expect(line('talk_pet_happy', {}, () => 0.999)).toBe(vi.talk_pet_happy.at(-1));
  });

  it('groups moods by tone of voice', () => {
    expect(talkGroup('happy')).toBe('happy');
    expect(talkGroup('okay')).toBe('happy');
    expect(talkGroup('hungry')).toBe('grumpy');
    expect(talkGroup('dirty')).toBe('grumpy');
    expect(talkGroup('angry')).toBe('angry');
  });
});
