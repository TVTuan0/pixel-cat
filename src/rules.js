// Pure game rules. Every function takes a state and returns a new one.
import {
  HOUR, DAY, DECAY_PER_HOUR, SLEEP_ENERGY_PER_HOUR, LOW_STAT, HAPPY_AVERAGE,
  FULL_HUNGER, STAGES, PET_COOLDOWN_MS, PET_HAPPINESS, CLEAN_COINS_BELOW,
  CLEAN_COINS, PLAY_MIN_ENERGY, PLAY_ENERGY_COST, GIFT_BASE_COINS,
  GIFT_STREAK_BONUS, GIFT_STREAK_CAP, FOODS, SHOP_ITEMS, EQUIP_SLOTS, WEATHER_CHANCE,
  TASKS, TASKS_PER_DAY, STICKERS, LUNAR_DATES,
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
  const equipped = EQUIP_SLOTS.includes(item.slot) ? { ...state.equipped, [item.slot]: itemId } : state.equipped;
  return { state: { ...bought, equipped }, result: 'ok' };
}

// Uses an owned one-at-a-time item (hat, collar, wallpaper, floor), or stops using it.
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

// A number from the date, so everyone gets the same pick on the same day. `salt` gives different picks.
function dayHash(time, salt = '') {
  let hash = 0;
  for (const ch of dayKey(time) + salt) hash = (hash * 31 + ch.charCodeAt(0)) % 1000003;
  return hash;
}

// Weather outside the window. Same for everyone on the same day.
export function weatherOf(time) {
  const roll = dayHash(time) % 100;
  if (roll < WEATHER_CHANCE.clear) return 'clear';
  if (roll < WEATHER_CHANCE.clear + WEATHER_CHANCE.rain) return 'rain';
  return 'snow';
}

// Today's task ids. Same for everyone on the same day.
export function dailyTasks(time) {
  const pool = [...TASKS];
  const picks = [];
  for (let i = 0; i < TASKS_PER_DAY; i++) picks.push(pool.splice(dayHash(time, `task${i}`) % pool.length, 1)[0].id);
  return picks;
}

// Today's progress, starting fresh on a new day.
function todayOf(state, time) {
  const day = dayKey(time);
  return state.daily?.day === day ? state.daily : { day, progress: {}, claimed: [] };
}

// Counts an action (feed, treat, pet, clean, play, fish, tasks) for today's tasks and for stickers.
export function recordAction(state, action, amount, time) {
  const today = todayOf(state, time);
  const counters = state.counters ?? {};
  return {
    ...state,
    daily: { ...today, progress: { ...today.progress, [action]: (today.progress[action] ?? 0) + amount } },
    counters: { ...counters, [action]: (counters[action] ?? 0) + amount },
  };
}

export function taskProgress(state, taskId, time) {
  const task = TASKS.find((x) => x.id === taskId);
  const today = todayOf(state, time);
  return { task, done: Math.min(task.goal, today.progress[task.counter] ?? 0), claimed: today.claimed.includes(taskId) };
}

export function claimTask(state, taskId, time) {
  if (!dailyTasks(time).includes(taskId)) return { state, result: 'notToday' };
  const { task, done, claimed } = taskProgress(state, taskId, time);
  if (claimed) return { state, result: 'claimed' };
  if (done < task.goal) return { state, result: 'notDone' };
  const today = todayOf(state, time);
  const paid = { ...state, coins: state.coins + task.coins, daily: { ...today, claimed: [...today.claimed, taskId] } };
  return { state: recordAction(paid, 'tasks', 1, time), result: 'ok' };
}

function stickerEarned(sticker, state, time) {
  switch (sticker.kind) {
    case 'counter': return (state.counters?.[sticker.counter] ?? 0) >= sticker.goal;
    case 'streak': return state.streak >= sticker.goal;
    case 'stage': return STAGES.findIndex((s) => s.id === stageOf(state, time)) >= STAGES.findIndex((s) => s.id === sticker.stage);
    case 'owned': return state.owned.length >= sticker.goal;
    case 'ownsAll': return SHOP_ITEMS.filter((i) => i.slot === sticker.slot).every((i) => state.owned.includes(i.id));
    default: return false;
  }
}

// Gives any stickers newly earned, with their coins.
export function checkStickers(state, time) {
  const have = state.stickers ?? [];
  const earned = STICKERS.filter((s) => !have.includes(s.id) && stickerEarned(s, state, time));
  if (!earned.length) return { state, earned: [] };
  const coins = earned.reduce((sum, s) => sum + s.coins, 0);
  return { state: { ...state, coins: state.coins + coins, stickers: [...have, ...earned.map((s) => s.id)] }, earned: earned.map((s) => s.id) };
}

// Which seasonal decoration to show, or null.
export function seasonOf(time) {
  const now = new Date(time);
  const year = now.getFullYear();
  const daysFrom = (mmdd) => {
    const [m, d] = mmdd.split('-').map(Number);
    return Math.round((now - new Date(year, m - 1, d, now.getHours(), now.getMinutes())) / DAY);
  };
  const near = (mmdd, before, after) => mmdd && daysFrom(mmdd) >= -before && daysFrom(mmdd) <= after;
  if (near(LUNAR_DATES.tet[year], 10, 7)) return 'tet';
  if (near(LUNAR_DATES.midautumn[year], 10, 2)) return 'midautumn';
  if (near('10-31', 11, 0)) return 'halloween';
  if (near('12-25', 24, 1)) return 'christmas';
  return null;
}
