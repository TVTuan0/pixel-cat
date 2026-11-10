import { SAVE_KEY, SAVE_VERSION, START_COINS, PRESENT_EVERY_HOURS, HOUR } from './config.js';
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
    broken: [], // owned items an angry cat broke
    news: [], // things that happened while away, shown once: [{ cat, item }]
    presents: [], // things the cats brought home, waiting on the floor
    nextPresentAt: now + PRESENT_EVERY_HOURS * HOUR,
    equipped: { wall: null, floor: null },
    lastGiftDay: null,
    streak: 0,
    ...EMPTY_PROGRESS,
    lang,
    sound: false,
  };
}

// Returns the saved cats caught up to `now`, or null if there is no usable save.
export function loadState(storage, now) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw);
    if (save?.version !== SAVE_VERSION) return null; // older saves are from before the empty-room start
    return applyElapsed(save, now);
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
