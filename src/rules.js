// Pure game rules. Every function takes a state and returns a new one.
// Most actions are for the selected cat; cleaning and lights are for the whole room.
import {
  HOUR, DAY, DECAY_PER_HOUR, SLEEP_ENERGY_PER_HOUR, LOW_STAT, HAPPY_AVERAGE,
  FULL_HUNGER, STAGES, PET_COOLDOWN_MS, PET_HAPPINESS, CLEAN_COINS_BELOW,
  CLEAN_COINS, CLEAN_STEP, PLAY_MIN_ENERGY, PLAY_ENERGY_COST, GIFT_BASE_COINS,
  GIFT_STREAK_BONUS, GIFT_STREAK_CAP, FOODS, SHOP_ITEMS, WEATHER_CHANCE,
  TASKS, TASKS_PER_DAY, STICKERS, LUNAR_DATES, MAX_CATS, NEW_CAT_PRICES, NEW_CAT_NEEDS_STAGE,
  CONTEST_ENTRY_COINS, CONTEST_PRIZES, MAX_HELP, BREAKABLE_SLOTS, ANGRY_BELOW, BREAK_EVERY_MINUTES, REPAIR_SHARE,
  GARDEN_JOY_PER_HOUR, GARDEN_STAY_HOURS, GARDEN_DAY, GARDEN_GO_OUT_CHANCE, GARDEN_COME_IN_CHANCE,
  PRESENT_EVERY_HOURS, MAX_PRESENTS, PRESENT_COINS, PRESENT_BOX_CHANCE, PRESENT_ITEMS, PRESENT_LOOKS,
} from './config.js';

const clamp = (v) => Math.max(0, Math.min(100, v));
const CAT_SLOTS = ['hat', 'collar']; // worn by one cat; wallpaper and floor belong to the room

function withStats(cat, changes) {
  const stats = { ...cat.stats };
  for (const [key, delta] of Object.entries(changes)) stats[key] = clamp(stats[key] + delta);
  return { ...cat, stats };
}

export function selectedCat(state) {
  return state.cats.find((c) => c.id === state.selected) ?? state.cats[0];
}

// Applies `change` to one cat (the selected one by default).
function updateCat(state, change, id = selectedCat(state).id) {
  return { ...state, cats: state.cats.map((c) => (c.id === id ? change(c) : c)) };
}

export function newCat(id, name, fur, now) {
  return {
    id,
    name,
    fur,
    adoptedAt: now,
    stats: { hunger: 80, happiness: 80, energy: 80, cleanliness: 100 },
    lastPetAt: 0,
    seenStage: 'kitten',
    equipped: { hat: null, collar: null },
    nextBreakAt: null, // when an angry cat breaks its next item
    outside: false, // playing in the garden
  };
}

// Owned items that still work (not broken by an angry cat).
export function usableItems(state) {
  const broken = state.broken ?? [];
  return state.owned.filter((id) => !broken.includes(id));
}

// How much slower `stat` drops thanks to the room's working items, in percent.
export function helpFor(state, stat) {
  const usable = usableItems(state);
  const total = SHOP_ITEMS
    .filter((i) => usable.includes(i.id))
    .reduce((sum, i) => sum + (i.help?.[stat] ?? 0), 0);
  return Math.min(MAX_HELP, total);
}

// How much each stat changes per hour (negative = drops). Sleep raises energy instead.
function changePerHour(state) {
  const change = {};
  for (const [stat, drop] of Object.entries(DECAY_PER_HOUR)) change[stat] = -drop * (1 - helpFor(state, stat) / 100);
  if (state.asleep) change.energy = SLEEP_ENERGY_PER_HOUR;
  return change;
}

// When a cat first went below ANGRY_BELOW between `from` and now, or null if it isn't angry now.
// Stats change in a straight line over time, so the moment can be worked out.
function angrySince(before, after, perHour, from) {
  let since = null;
  for (const [stat, value] of Object.entries(after.stats)) {
    if (value >= ANGRY_BELOW) continue;
    const start = before.stats[stat];
    const at = start < ANGRY_BELOW ? from : Math.max(from, from + ((start - ANGRY_BELOW) / -perHour[stat]) * HOUR);
    since = since === null ? at : Math.min(since, at);
  }
  return since;
}

// An angry cat breaks one working item, then another every BREAK_EVERY_MINUTES while it stays angry.
function breakThings(state, before, perHour, now, random) {
  let { broken = [], news = [] } = state;
  const cats = state.cats.map((cat) => {
    const old = before.cats.find((c) => c.id === cat.id) ?? cat;
    const since = angrySince(old, cat, perHour, before.lastSeen);
    if (since === null) return { ...cat, nextBreakAt: null };
    let next = cat.nextBreakAt ?? since;
    while (next <= now) {
      const breakable = breakableItems({ ...state, broken });
      if (breakable.length) {
        const item = breakable[Math.floor(random() * breakable.length)];
        broken = [...broken, item];
        news = [...news, { cat: cat.name, catId: cat.id, item }];
      }
      next += BREAK_EVERY_MINUTES * 60 * 1000;
    }
    return { ...cat, nextBreakAt: next };
  });
  return { ...state, cats, broken, news };
}

function breakableItems(state) {
  const usable = usableItems(state);
  return SHOP_ITEMS.filter((i) => BREAKABLE_SLOTS.includes(i.slot) && usable.includes(i.id)).map((i) => i.id);
}

const isAngry = (cat) => Object.values(cat.stats).some((v) => v < ANGRY_BELOW);

// One present, on a free spot on the floor. `spot` is 0 to MAX_PRESENTS - 1; the room decides where that is.
function makePresent(state, presents, random) {
  const used = presents.map((p) => p.spot);
  const spot = [...Array(MAX_PRESENTS).keys()].find((i) => !used.includes(i));
  if (random() < PRESENT_BOX_CHANCE) {
    const coming = presents.map((p) => p.item);
    const items = PRESENT_ITEMS.filter((id) => !state.owned.includes(id) && !coming.includes(id));
    if (items.length) return { spot, look: 'box', item: items[Math.floor(random() * items.length)] };
  }
  const coins = PRESENT_COINS.min + Math.floor(random() * (PRESENT_COINS.max - PRESENT_COINS.min + 1));
  return { spot, look: PRESENT_LOOKS[Math.floor(random() * PRESENT_LOOKS.length)], coins };
}

// Every PRESENT_EVERY_HOURS a present arrives, unless a cat is angry or the floor already holds MAX_PRESENTS.
// When the floor is full the clock waits, so the next one comes a while after the player picks one up.
function bringPresents(state, now, random) {
  const every = PRESENT_EVERY_HOURS * HOUR;
  let presents = state.presents ?? [];
  let next = state.nextPresentAt ?? state.lastSeen + every;
  const angry = state.cats.some(isAngry);
  while (next <= now) {
    if (presents.length >= MAX_PRESENTS) {
      next = now + every;
      break;
    }
    if (!angry) presents = [...presents, makePresent(state, presents, random)];
    next += every;
  }
  return { ...state, presents, nextPresentAt: next };
}

// Picks up the present at `index`: its coins, or the item in a gift box.
export function pickUpPresent(state, index) {
  const present = (state.presents ?? [])[index];
  if (!present) return { state, present: null };
  const presents = state.presents.filter((_, i) => i !== index);
  const owned = present.item && !state.owned.includes(present.item) ? [...state.owned, present.item] : state.owned;
  return { state: { ...state, presents, owned, coins: state.coins + (present.coins ?? 0) }, present };
}

// ---- The garden ----

// Why cats can't be outside right now, or null if they can.
function whyNotOutside(state, time) {
  if (!state.owned.includes('garden_door')) return 'noDoor';
  if (state.asleep) return 'asleep';
  const hour = new Date(time).getHours();
  if (hour < GARDEN_DAY.from || hour >= GARDEN_DAY.to) return 'night';
  if (weatherOf(time) !== 'clear') return 'weather';
  return null;
}

export const canBeOutside = (state, time) => whyNotOutside(state, time) === null;

// result: ok | noDoor | asleep | night | weather
export function goOutside(state, id, time) {
  const why = whyNotOutside(state, time);
  if (why) return { state, result: why };
  return { state: updateCat(state, (c) => ({ ...c, outside: true }), id), result: 'ok' };
}

export function comeInside(state, id) {
  return updateCat(state, (c) => ({ ...c, outside: false }), id);
}

// Now and then a cat wanders out to the garden, or back in. Called every GARDEN_WANDER_SECONDS while the game is open.
export function wanderOutside(state, time, random = Math.random) {
  if (!canBeOutside(state, time)) return state;
  const cats = state.cats.map((c) => {
    if (c.outside) return random() < GARDEN_COME_IN_CHANCE ? { ...c, outside: false } : c;
    return random() < GARDEN_GO_OUT_CHANCE ? { ...c, outside: true } : c;
  });
  return { ...state, cats };
}

// How much a cat's stats change over `hours`. Outside, happiness goes up, but only for the first GARDEN_STAY_HOURS:
// after that the cat has come back in.
function changeFor(cat, perHour, hours) {
  const change = Object.fromEntries(Object.entries(perHour).map(([stat, c]) => [stat, c * hours]));
  if (cat.outside) {
    const out = Math.min(hours, GARDEN_STAY_HOURS);
    change.happiness = GARDEN_JOY_PER_HOUR * out + perHour.happiness * (hours - out);
  }
  return change;
}

export function applyElapsed(state, now, random = Math.random) {
  const hours = Math.max(0, now - state.lastSeen) / HOUR;
  const perHour = changePerHour(state);
  const later = Math.max(now, state.lastSeen);
  const allowed = canBeOutside(state, later);
  const cats = state.cats.map((cat) => {
    const changed = withStats(cat, changeFor(cat, perHour, hours));
    const stillOut = cat.outside && allowed && hours < GARDEN_STAY_HOURS;
    return cat.outside && !stillOut ? { ...changed, outside: false } : changed;
  });
  const caughtUp = bringPresents(breakThings({ ...state, cats }, state, perHour, later, random), later, random);
  return { ...caughtUp, lastSeen: later };
}

export const repairPrice = (itemId) => Math.ceil(SHOP_ITEMS.find((i) => i.id === itemId).price * REPAIR_SHARE);

export function repair(state, itemId) {
  if (!(state.broken ?? []).includes(itemId)) return { state, result: 'notBroken' };
  const price = repairPrice(itemId);
  if (state.coins < price) return { state, result: 'poor' };
  return { state: { ...state, coins: state.coins - price, broken: state.broken.filter((id) => id !== itemId) }, result: 'ok' };
}

const LOW_NEED_MOOD = { hunger: 'hungry', energy: 'sleepy', cleanliness: 'dirty', happiness: 'grumpy' };

// Mood of a cat (the selected one by default).
export function moodOf(state, cat = selectedCat(state)) {
  if (state.asleep) return 'sleeping';
  if (Object.values(cat.stats).some((v) => v < ANGRY_BELOW)) return 'angry';
  const low = Object.keys(LOW_NEED_MOOD).filter((k) => cat.stats[k] < LOW_STAT);
  if (low.length > 1) return 'grumpy';
  if (low.length === 1) return LOW_NEED_MOOD[low[0]];
  const values = Object.values(cat.stats);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  return average >= HAPPY_AVERAGE ? 'happy' : 'okay';
}

export function needsCare(cat) {
  return Object.values(cat.stats).some((v) => v < LOW_STAT);
}

export function ageInDays(cat, now) {
  return Math.floor(Math.max(0, now - cat.adoptedAt) / DAY);
}

export function stageOf(cat, now) {
  const days = ageInDays(cat, now);
  let stage = STAGES[0].id;
  for (const s of STAGES) if (days >= s.fromDay) stage = s.id;
  return stage;
}

const stageIndex = (stage) => STAGES.findIndex((s) => s.id === stage);

export function selectCat(state, id) {
  return state.cats.some((c) => c.id === id) ? { ...state, selected: id } : state;
}

// Can the player adopt another cat? result: ok | max | growing (newest cat still a kitten) | poor.
export function nextCatOffer(state, now) {
  if (state.cats.length >= MAX_CATS) return { result: 'max' };
  const price = NEW_CAT_PRICES[state.cats.length - 1];
  const newest = state.cats[state.cats.length - 1];
  if (stageIndex(stageOf(newest, now)) < stageIndex(NEW_CAT_NEEDS_STAGE)) return { result: 'growing', price, waitFor: newest.name };
  if (state.coins < price) return { result: 'poor', price };
  return { result: 'ok', price };
}

export function adoptCat(state, name, fur, now) {
  const offer = nextCatOffer(state, now);
  if (offer.result !== 'ok') return { state, result: offer.result };
  const id = Math.max(...state.cats.map((c) => c.id)) + 1;
  return {
    state: { ...state, coins: state.coins - offer.price, cats: [...state.cats, newCat(id, name, fur, now)], selected: id },
    result: 'ok',
  };
}

export function dayKey(time) {
  const d = new Date(time);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function feed(state, foodId) {
  const food = FOODS.find((f) => f.id === foodId);
  if (state.asleep) return { state, result: 'asleep' };
  if (!state.owned.includes('bowl')) return { state, result: 'noBowl' };
  if (selectedCat(state).stats.hunger >= FULL_HUNGER) return { state, result: 'full' };
  if (state.coins < food.price) return { state, result: 'poor' };
  const fed = updateCat(state, (c) => withStats(c, { hunger: food.hunger, happiness: food.happiness }));
  return { state: { ...fed, coins: state.coins - food.price + food.coins }, result: 'ok' };
}

// Feeds every cat that isn't full with the same food, paying for each. `fed` lists the ids of cats that ate.
export function feedAll(state, foodId) {
  const food = FOODS.find((f) => f.id === foodId);
  if (state.asleep) return { state, result: 'asleep', fed: [] };
  if (!state.owned.includes('bowl')) return { state, result: 'noBowl', fed: [] };
  const fed = state.cats.filter((c) => c.stats.hunger < FULL_HUNGER).map((c) => c.id);
  if (!fed.length) return { state, result: 'full', fed };
  if (state.coins < food.price * fed.length) return { state, result: 'poor', fed: [] };
  const cats = state.cats.map((c) => (fed.includes(c.id) ? withStats(c, { hunger: food.hunger, happiness: food.happiness }) : c));
  return { state: { ...state, cats, coins: state.coins + (food.coins - food.price) * fed.length }, result: 'ok', fed };
}

export function pet(state, now, id = selectedCat(state).id) {
  if (state.asleep) return { state, result: 'asleep' };
  const cat = state.cats.find((c) => c.id === id);
  if (now - cat.lastPetAt < PET_COOLDOWN_MS) return { state, result: 'cooldown' };
  return { state: updateCat(state, (c) => ({ ...withStats(c, { happiness: PET_HAPPINESS }), lastPetAt: now }), id), result: 'ok' };
}

// The litter box and floor are shared, so cleaning helps every cat. Each go cleans CLEAN_STEP more.
// result: ok | clean (nothing left to clean) | noLitter. `done`: the room is spotless now.
export function clean(state) {
  if (!state.owned.includes('litter')) return { state, result: 'noLitter' };
  const dirtiest = Math.min(...state.cats.map((c) => c.stats.cleanliness));
  if (dirtiest >= 99) return { state, result: 'clean', coins: 0 }; // stats start dropping right after a clean-up
  const paid = dirtiest < CLEAN_COINS_BELOW ? CLEAN_COINS : 0;
  const cats = state.cats.map((c) => withStats(c, { cleanliness: CLEAN_STEP }));
  const done = cats.every((c) => c.stats.cleanliness >= 100);
  return { state: { ...state, cats, coins: state.coins + paid }, result: 'ok', coins: paid, done };
}

export function toggleSleep(state) {
  return { ...state, asleep: !state.asleep };
}

export function canPlay(state) {
  if (state.asleep) return 'asleep';
  if (selectedCat(state).stats.energy < PLAY_MIN_ENERGY) return 'tired';
  return 'ok';
}

// After Fish Catch or Mouse Catch: the score is paid in coins.
export function finishMiniGame(state, coins) {
  const played = updateCat(state, (c) => withStats(c, {
    happiness: Math.min(30, 10 + coins * 2),
    energy: -PLAY_ENERGY_COST,
  }));
  return { state: { ...played, coins: state.coins + coins }, result: 'ok' };
}

// Puts an item on: a hat or collar on the selected cat, or a wallpaper or floor on the room.
function wear(state, item, itemId) {
  if (CAT_SLOTS.includes(item.slot)) return updateCat(state, (c) => ({ ...c, equipped: { ...c.equipped, [item.slot]: itemId } }));
  if (item.slot === 'wall' || item.slot === 'floor') return { ...state, equipped: { ...state.equipped, [item.slot]: itemId } };
  return state;
}

export function wornItem(state, slot) {
  return CAT_SLOTS.includes(slot) ? selectedCat(state).equipped[slot] : state.equipped[slot];
}

export function buy(state, itemId) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (state.owned.includes(itemId)) return { state, result: 'owned' };
  if (state.coins < item.price) return { state, result: 'poor' };
  const bought = { ...state, coins: state.coins - item.price, owned: [...state.owned, itemId] };
  return { state: wear(bought, item, itemId), result: 'ok' };
}

// Uses an owned one-at-a-time item (hat, collar, wallpaper, floor), or stops using it.
export function equip(state, itemId) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!state.owned.includes(itemId)) return state;
  return wear(state, item, wornItem(state, item.slot) === itemId ? null : itemId);
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
  // Scramble it, so that the next day (whose text differs by one letter) gives a very different number.
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return (hash ^ (hash >>> 16)) >>> 0;
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
    case 'stage': return state.cats.some((c) => stageIndex(stageOf(c, time)) >= stageIndex(sticker.stage));
    case 'cats': return state.cats.length >= sticker.goal;
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

// Weekly contest. state.contest = { entered: week the player last joined, prizes: weeks already paid }.
export function rewardContestEntry(state, week) {
  const contest = state.contest ?? {};
  if (contest.entered === week) return { state, coins: 0 };
  return { state: { ...state, coins: state.coins + CONTEST_ENTRY_COINS, contest: { ...contest, entered: week } }, coins: CONTEST_ENTRY_COINS };
}

export function claimContestPrize(state, week, rank) {
  const contest = state.contest ?? {};
  const prize = CONTEST_PRIZES[rank - 1] ?? null;
  if (!prize || (contest.prizes ?? []).includes(week)) return { state, prize: null };
  const owned = state.owned.includes(prize.trophy) ? state.owned : [...state.owned, prize.trophy];
  return {
    state: { ...state, owned, coins: state.coins + prize.coins, contest: { ...contest, prizes: [...(contest.prizes ?? []), week] } },
    prize,
  };
}
