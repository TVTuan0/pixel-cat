// Pure game rules. Every function takes a state and returns a new one.
import {
  HOUR, DAY, DECAY_PER_HOUR, SLEEP_ENERGY_PER_HOUR, LOW_STAT, HAPPY_AVERAGE,
  FULL_HUNGER, STAGES, PET_COOLDOWN_MS, PET_HAPPINESS, CLEAN_COINS_BELOW,
  CLEAN_COINS, PLAY_MIN_ENERGY, PLAY_ENERGY_COST, GIFT_BASE_COINS,
  GIFT_STREAK_BONUS, GIFT_STREAK_CAP, FOODS, SHOP_ITEMS,
} from './config.js';

const clamp = (v) => Math.max(0, Math.min(100, v));

function withStats(state, changes) {
  const stats = { ...state.stats };
  for (const [key, delta] of Object.entries(changes)) stats[key] = clamp(stats[key] + delta);
  return { ...state, stats };
}

export function applyElapsed(state, now) {
  const hours = Math.max(0, now - state.lastSeen) / HOUR;
  const energyChange = state.asleep ? SLEEP_ENERGY_PER_HOUR : -DECAY_PER_HOUR.energy;
  const next = withStats(state, {
    hunger: -DECAY_PER_HOUR.hunger * hours,
    happiness: -DECAY_PER_HOUR.happiness * hours,
    energy: energyChange * hours,
    cleanliness: -DECAY_PER_HOUR.cleanliness * hours,
  });
  return { ...next, lastSeen: Math.max(now, state.lastSeen) };
}

const LOW_NEED_MOOD = { hunger: 'hungry', energy: 'sleepy', cleanliness: 'dirty', happiness: 'grumpy' };

export function moodOf(state) {
  if (state.asleep) return 'sleeping';
  const low = Object.keys(LOW_NEED_MOOD).filter((k) => state.stats[k] < LOW_STAT);
  if (low.length > 1) return 'grumpy';
  if (low.length === 1) return LOW_NEED_MOOD[low[0]];
  const values = Object.values(state.stats);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  return average >= HAPPY_AVERAGE ? 'happy' : 'okay';
}

export function ageInDays(state, now) {
  return Math.floor(Math.max(0, now - state.adoptedAt) / DAY);
}

export function stageOf(state, now) {
  const days = ageInDays(state, now);
  let stage = STAGES[0].id;
  for (const s of STAGES) if (days >= s.fromDay) stage = s.id;
  return stage;
}

export function dayKey(time) {
  const d = new Date(time);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function feed(state, foodId) {
  const food = FOODS.find((f) => f.id === foodId);
  if (state.asleep) return { state, result: 'asleep' };
  if (state.stats.hunger >= FULL_HUNGER) return { state, result: 'full' };
  if (state.coins < food.price) return { state, result: 'poor' };
  const fed = withStats(state, { hunger: food.hunger, happiness: food.happiness });
  return { state: { ...fed, coins: state.coins - food.price + food.coins }, result: 'ok' };
}

export function pet(state, now) {
  if (state.asleep) return { state, result: 'asleep' };
  if (now - state.lastPetAt < PET_COOLDOWN_MS) return { state, result: 'cooldown' };
  const petted = withStats(state, { happiness: PET_HAPPINESS });
  return { state: { ...petted, lastPetAt: now }, result: 'ok' };
}

export function clean(state) {
  const paid = state.stats.cleanliness < CLEAN_COINS_BELOW ? CLEAN_COINS : 0;
  const cleaned = withStats(state, { cleanliness: 100 });
  return { state: { ...cleaned, coins: state.coins + paid }, result: 'ok', coins: paid };
}

export function toggleSleep(state) {
  return { ...state, asleep: !state.asleep };
}

export function canPlay(state) {
  if (state.asleep) return 'asleep';
  if (state.stats.energy < PLAY_MIN_ENERGY) return 'tired';
  return 'ok';
}

export function finishFishGame(state, caught) {
  const played = withStats(state, {
    happiness: Math.min(30, 10 + caught * 2),
    energy: -PLAY_ENERGY_COST,
  });
  return { state: { ...played, coins: state.coins + caught }, result: 'ok' };
}

export function buy(state, itemId) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (state.owned.includes(itemId)) return { state, result: 'owned' };
  if (state.coins < item.price) return { state, result: 'poor' };
  const bought = { ...state, coins: state.coins - item.price, owned: [...state.owned, itemId] };
  const wearable = item.slot === 'hat' || item.slot === 'collar';
  const equipped = wearable ? { ...state.equipped, [item.slot]: itemId } : state.equipped;
  return { state: { ...bought, equipped }, result: 'ok' };
}

// Puts on an owned hat or collar, or takes it off if already worn.
export function equip(state, itemId) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!state.owned.includes(itemId)) return state;
  const current = state.equipped[item.slot];
  return { ...state, equipped: { ...state.equipped, [item.slot]: current === itemId ? null : itemId } };
}

export function claimDailyGift(state, now) {
  const today = dayKey(now);
  if (state.lastGiftDay === today) return { state, coins: 0 };
  const yesterday = dayKey(now - DAY);
  const streak = state.lastGiftDay === yesterday ? state.streak + 1 : 1;
  const coins = GIFT_BASE_COINS + Math.min(streak, GIFT_STREAK_CAP) * GIFT_STREAK_BONUS;
  return { state: { ...state, coins: state.coins + coins, streak, lastGiftDay: today }, coins };
}
