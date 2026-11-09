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

// A save as written by the one-cat version of the game.
const VERSION_1_SAVE = {
  version: 1,
  name: 'Mochi',
  fur: 'calico',
  adoptedAt: T0 - 4 * DAY,
  lastSeen: T0,
  stats: { hunger: 50, happiness: 60, energy: 70, cleanliness: 80 },
  asleep: false,
  coins: 42,
  owned: ['hat_bow', 'wall_mint'],
  equipped: { hat: 'hat_bow', collar: null, wall: 'wall_mint', floor: null },
  lastGiftDay: '2026-11-08',
  streak: 3,
  lastPetAt: 0,
  seenStage: 'young',
  counters: { feed: 5 },
  daily: null,
  stickers: ['first_meal'],
  lang: 'vi',
  sound: true,
};

function storeWith(save) {
  const store = memoryStorage();
  store.setItem(SAVE_KEY, JSON.stringify(save));
  return store;
}

describe('state', () => {
  it('returns null when nothing is saved', () => {
    expect(loadState(memoryStorage(), T0)).toBe(null);
  });

  it('saves and loads, catching up on time away', () => {
    const store = memoryStorage();
    saveState(store, createState('Mochi', T0, 'vi', 'calico'));
    const loaded = loadState(store, T0 + 3 * DAY);
    expect(loaded.cats).toHaveLength(1);
    expect(loaded.cats[0]).toMatchObject({ id: 1, name: 'Mochi', fur: 'calico' });
    expect(loaded.cats[0].stats.hunger).toBe(0);
    expect(loaded.lang).toBe('vi');
  });

  it('ignores broken saves', () => {
    const store = memoryStorage();
    store.setItem(SAVE_KEY, '{not json');
    expect(loadState(store, T0)).toBe(null);
  });

  it('turns a one-cat save into cat #1, keeping everything', () => {
    const loaded = loadState(storeWith(VERSION_1_SAVE), T0);
    expect(loaded.version).toBe(2);
    expect(loaded.selected).toBe(1);
    expect(loaded.cats).toEqual([{
      id: 1,
      name: 'Mochi',
      fur: 'calico',
      adoptedAt: T0 - 4 * DAY,
      stats: { hunger: 50, happiness: 60, energy: 70, cleanliness: 80 },
      lastPetAt: 0,
      seenStage: 'young',
      equipped: { hat: 'hat_bow', collar: null },
    }]);
    expect(loaded).toMatchObject({
      coins: 42, owned: ['hat_bow', 'wall_mint'], equipped: { wall: 'wall_mint', floor: null },
      streak: 3, counters: { feed: 5 }, stickers: ['first_meal'], lang: 'vi', sound: true,
    });
    expect(loaded.name).toBeUndefined();
  });

  it('upgrades the oldest one-cat saves (no fur, no progress, no wallpaper)', () => {
    const oldest = { ...VERSION_1_SAVE, equipped: { hat: null, collar: 'collar_red' } };
    delete oldest.fur;
    delete oldest.counters;
    delete oldest.stickers;
    delete oldest.daily;
    const loaded = loadState(storeWith(oldest), T0);
    expect(loaded.cats[0].fur).toBe('orange');
    expect(loaded.cats[0].equipped).toEqual({ hat: null, collar: 'collar_red' });
    expect(loaded.equipped).toEqual({ wall: null, floor: null });
    expect(loaded).toMatchObject({ counters: {}, stickers: [], daily: null });
  });

  it('new cats start with sound off', () => {
    expect(createState('Mochi', T0, 'en').sound).toBe(false);
  });
});
