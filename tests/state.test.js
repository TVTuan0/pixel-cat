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
  it('loads saves made before wallpapers and floors existed', () => {
    const store = memoryStorage();
    const old = createState('Mochi', T0, 'en');
    old.equipped = { hat: 'hat_bow', collar: null };
    old.owned = ['hat_bow'];
    saveState(store, old);
    const loaded = loadState(store, T0);
    expect(loaded.equipped).toEqual({ hat: 'hat_bow', collar: null, wall: null, floor: null });
  });
  it('keeps the chosen fur, and old saves become ginger', () => {
    const store = memoryStorage();
    saveState(store, createState('Mochi', T0, 'en', 'calico'));
    expect(loadState(store, T0).fur).toBe('calico');
    const old = createState('Mochi', T0, 'en');
    delete old.fur;
    saveState(store, old);
    expect(loadState(store, T0).fur).toBe('orange');
  });
  it('gives old saves an empty sticker book and counters', () => {
    const store = memoryStorage();
    const old = createState('Mochi', T0, 'en');
    delete old.stickers;
    delete old.counters;
    delete old.daily;
    saveState(store, old);
    const loaded = loadState(store, T0);
    expect(loaded.stickers).toEqual([]);
    expect(loaded.counters).toEqual({});
    expect(loaded.daily).toBe(null);
  });
  it('new cats start with sound off', () => {
    expect(createState('Mochi', T0, 'en').sound).toBe(false);
  });
});
