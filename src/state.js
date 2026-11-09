import { SAVE_KEY, SAVE_VERSION, START_COINS } from './config.js';
import { applyElapsed, newCat } from './rules.js';

// counters: lifetime action counts; daily: today's task progress; stickers: sticker ids earned.
const EMPTY_PROGRESS = { counters: {}, daily: null, stickers: [] };

export function createState(name, now, lang, fur = 'orange') {
  return {
    version: SAVE_VERSION,
    cats: [newCat(1, name, fur, now)],
    selected: 1,
    lastSeen: now,
    asleep: false,
    coins: START_COINS,
    owned: [],
    equipped: { wall: null, floor: null },
    lastGiftDay: null,
    streak: 0,
    ...EMPTY_PROGRESS,
    lang,
    sound: false,
  };
}

// Version 1 saves had one cat stored on the top level. It becomes cat #1.
// Even older version 1 saves miss fur (all cats were ginger), progress, and wallpaper/floor.
export function upgradeSave(save) {
  if (save.version === SAVE_VERSION) return save;
  const equipped = { hat: null, collar: null, wall: null, floor: null, ...save.equipped };
  const cat = {
    ...newCat(1, save.name, save.fur ?? 'orange', save.adoptedAt),
    stats: save.stats,
    lastPetAt: save.lastPetAt ?? 0,
    seenStage: save.seenStage ?? 'kitten',
    equipped: { hat: equipped.hat, collar: equipped.collar },
  };
  return {
    version: SAVE_VERSION,
    cats: [cat],
    selected: 1,
    lastSeen: save.lastSeen,
    asleep: save.asleep,
    coins: save.coins,
    owned: save.owned,
    equipped: { wall: equipped.wall, floor: equipped.floor },
    lastGiftDay: save.lastGiftDay,
    streak: save.streak,
    counters: save.counters ?? {},
    daily: save.daily ?? null,
    stickers: save.stickers ?? [],
    lang: save.lang,
    sound: save.sound,
  };
}

// Returns the saved cats caught up to `now`, or null if there is no usable save.
export function loadState(storage, now) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw);
    if (save?.version !== 1 && save?.version !== SAVE_VERSION) return null;
    return applyElapsed(upgradeSave(save), now);
  } catch {
    return null;
  }
}

export function saveState(storage, state) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked (private mode). The game keeps running.
  }
}

export function clearState(storage) {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    // Nothing to clear.
  }
}
