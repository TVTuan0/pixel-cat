import { describe, it, expect } from 'vitest';
import { createState, loadState, saveState } from '../src/state.js';
import { SAVE_KEY, DAY } from '../src/config.js';

function memoryStorage() {
  const data = {};
  return {
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
  };
}

const T0 = new Date(2026, 10, 8, 10).getTime();

describe('state', () => {
  it('returns null when nothing is saved', () => {
    expect(loadState(memoryStorage(), T0)).toBe(null);
  });
  it('saves and loads, catching up on time away', () => {
    const store = memoryStorage();
    saveState(store, createState('Mochi', T0, 'vi'));
    const loaded = loadState(store, T0 + 3 * DAY);
    expect(loaded.name).toBe('Mochi');
    expect(loaded.lang).toBe('vi');
    expect(loaded.stats.hunger).toBe(0);
  });
  it('ignores broken saves', () => {
    const store = memoryStorage();
    store.setItem(SAVE_KEY, '{not json');
    expect(loadState(store, T0)).toBe(null);
  });
  it('new cats start with sound off', () => {
    expect(createState('Mochi', T0, 'en').sound).toBe(false);
  });
});
