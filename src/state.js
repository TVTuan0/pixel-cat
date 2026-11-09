import { SAVE_KEY, SAVE_VERSION, START_COINS } from './config.js';
import { applyElapsed } from './rules.js';

const EMPTY_EQUIPPED = { hat: null, collar: null, wall: null, floor: null };

export function createState(name, now, lang) {
  return {
    version: SAVE_VERSION,
    name,
    adoptedAt: now,
    lastSeen: now,
    stats: { hunger: 80, happiness: 80, energy: 80, cleanliness: 100 },
    asleep: false,
    coins: START_COINS,
    owned: [],
    equipped: { ...EMPTY_EQUIPPED },
    lastGiftDay: null,
    streak: 0,
    lastPetAt: 0,
    seenStage: 'kitten',
    lang,
    sound: false,
  };
}

// Returns the saved cat caught up to `now`, or null if there is no usable save.
export function loadState(storage, now) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (state?.version !== SAVE_VERSION) return null;
    // Saves from before wallpapers and floors existed have no slot for them.
    const upgraded = { ...state, equipped: { ...EMPTY_EQUIPPED, ...state.equipped } };
    return applyElapsed(upgraded, now);
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
