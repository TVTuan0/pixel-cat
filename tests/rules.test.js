import { describe, it, expect } from 'vitest';
import { createState } from '../src/state.js';
import {
  applyElapsed, moodOf, stageOf, dayKey, feed, pet, clean, toggleSleep,
  finishFishGame, buy, equip, claimDailyGift, weatherOf, selectedCat, selectCat, nextCatOffer, adoptCat, newCat,
} from '../src/rules.js';
import { HOUR, DAY, FOODS, START_COINS, NEW_CAT_PRICES, MAX_CATS } from '../src/config.js';

const T0 = new Date(2026, 10, 8, 10, 0, 0).getTime();
const fresh = () => ({ ...createState('Mochi', T0, 'en'), owned: ['bowl', 'litter', 'cushion'] });
const cat = (s) => selectedCat(s);
// A one-cat game whose cat has these stats, plus room-wide changes in `extra`.
const withStats = (stats, extra = {}) => {
  const s = fresh();
  return { ...s, ...extra, cats: [{ ...s.cats[0], stats: { ...s.cats[0].stats, ...stats } }] };
};

describe('applyElapsed', () => {
  it('lowers stats over time', () => {
    const s = applyElapsed(fresh(), T0 + 2 * HOUR);
    expect(cat(s).stats.hunger).toBeLessThan(cat(fresh()).stats.hunger);
    expect(s.lastSeen).toBe(T0 + 2 * HOUR);
  });

  it('after 3 days away stats are low but never below 0', () => {
    const s = applyElapsed(fresh(), T0 + 3 * DAY);
    for (const v of Object.values(cat(s).stats)) expect(v).toBeGreaterThanOrEqual(0);
    expect(cat(s).stats.hunger).toBe(0);
    expect(moodOf(s)).toBe('grumpy');
  });

  it('raises energy while asleep, capped at 100', () => {
    const s = applyElapsed(withStats({ energy: 20 }, { asleep: true }), T0 + 10 * HOUR);
    expect(cat(s).stats.energy).toBe(100);
  });

  it('ignores a clock that went backwards', () => {
    const s = applyElapsed(fresh(), T0 - HOUR);
    expect(cat(s).stats).toEqual(cat(fresh()).stats);
  });
});

describe('moodOf', () => {
  it('is happy when everything is high', () => {
    expect(moodOf(withStats({ hunger: 90, happiness: 90, energy: 90, cleanliness: 90 }))).toBe('happy');
  });
  it('is okay in the middle', () => {
    expect(moodOf(withStats({ hunger: 50, happiness: 50, energy: 50, cleanliness: 50 }))).toBe('okay');
  });
  it('names the single low need', () => {
    expect(moodOf(withStats({ hunger: 10 }))).toBe('hungry');
    expect(moodOf(withStats({ energy: 10 }))).toBe('sleepy');
    expect(moodOf(withStats({ cleanliness: 10 }))).toBe('dirty');
    expect(moodOf(withStats({ happiness: 10 }))).toBe('grumpy');
  });
  it('is grumpy when two needs are low', () => {
    expect(moodOf(withStats({ hunger: 10, energy: 10 }))).toBe('grumpy');
  });
  it('is sleeping when asleep', () => {
    expect(moodOf(withStats({ hunger: 10 }, { asleep: true }))).toBe('sleeping');
  });
});

describe('stageOf', () => {
  it('follows day boundaries', () => {
    const s = cat(fresh());
    expect(stageOf(s, T0)).toBe('kitten');
    expect(stageOf(s, T0 + 3 * DAY - 1)).toBe('kitten');
    expect(stageOf(s, T0 + 3 * DAY)).toBe('young');
    expect(stageOf(s, T0 + 7 * DAY - 1)).toBe('young');
    expect(stageOf(s, T0 + 7 * DAY)).toBe('adult');
  });
});

describe('feed', () => {
  it('free kibble raises hunger and pays a coin', () => {
    const { state, result } = feed(withStats({ hunger: 30 }), 'kibble');
    expect(result).toBe('ok');
    expect(cat(state).stats.hunger).toBe(30 + FOODS[0].hunger);
    expect(state.coins).toBe(START_COINS + 1);
  });
  it('refuses when full', () => {
    const before = withStats({ hunger: 98 });
    const { state, result } = feed(before, 'kibble');
    expect(result).toBe('full');
    expect(state).toBe(before);
  });
  it('needs coins for treats', () => {
    expect(feed(withStats({ hunger: 30 }, { coins: 0 }), 'cream').result).toBe('poor');
  });
  it('treats cost coins and raise happiness', () => {
    const { state, result } = feed(withStats({ hunger: 30, happiness: 30 }, { coins: 10 }), 'cream');
    expect(result).toBe('ok');
    expect(state.coins).toBe(5);
    expect(cat(state).stats.happiness).toBe(55);
  });
  it('does not eat while asleep', () => {
    expect(feed(withStats({ hunger: 30 }, { asleep: true }), 'kibble').result).toBe('asleep');
  });
});

describe('pet', () => {
  it('boosts happiness once per cooldown', () => {
    const a = pet(withStats({ happiness: 50 }), T0);
    expect(a.result).toBe('ok');
    expect(cat(a.state).stats.happiness).toBeGreaterThan(50);
    const b = pet(a.state, T0 + 1000);
    expect(b.result).toBe('cooldown');
    expect(cat(b.state).stats.happiness).toBe(cat(a.state).stats.happiness);
  });
});

describe('clean', () => {
  it('fills cleanliness and pays only when it was dirty', () => {
    const dirty = clean(withStats({ cleanliness: 20 }));
    expect(cat(dirty.state).stats.cleanliness).toBe(100);
    expect(dirty.state.coins).toBe(START_COINS + 2);
    expect(clean(withStats({ cleanliness: 90 })).state.coins).toBe(START_COINS);
  });
});

describe('toggleSleep', () => {
  it('flips asleep', () => {
    const s = toggleSleep(fresh());
    expect(s.asleep).toBe(true);
    expect(toggleSleep(s).asleep).toBe(false);
  });
});

describe('finishFishGame', () => {
  it('pays coins per fish and costs energy', () => {
    const { state, result } = finishFishGame(withStats({ happiness: 40, energy: 60 }, { coins: 0 }), 6);
    expect(result).toBe('ok');
    expect(state.coins).toBe(6);
    expect(cat(state).stats.happiness).toBeGreaterThan(40);
    expect(cat(state).stats.energy).toBe(50);
  });
});

describe('shop', () => {
  it('buys when affordable, not twice', () => {
    const a = buy(withStats({}, { coins: 20 }), 'hat_bow');
    expect(a.result).toBe('ok');
    expect(a.state.coins).toBe(5);
    expect(a.state.owned).toContain('hat_bow');
    expect(cat(a.state).equipped.hat).toBe('hat_bow');
    expect(buy(a.state, 'hat_bow').result).toBe('owned');
    expect(buy(withStats({}, { coins: 1 }), 'hat_crown').result).toBe('poor');
  });
  it('buying a wallpaper or floor puts it in use, and it can be switched off', () => {
    const a = buy(withStats({}, { coins: 50 }), 'wall_mint');
    expect(a.state.equipped.wall).toBe('wall_mint');
    const b = buy(a.state, 'floor_tiles');
    expect(b.state.equipped.floor).toBe('floor_tiles');
    expect(equip(b.state, 'floor_tiles').equipped.floor).toBe(null);
  });
  it('decor is not "worn"', () => {
    const a = buy(withStats({}, { coins: 50 }), 'decor_fishbowl');
    expect(a.state.owned).toContain('decor_fishbowl');
    expect(a.state.equipped).toEqual(fresh().equipped);
  });
  it('equip toggles an owned hat or collar', () => {
    const owned = buy({ ...fresh(), coins: 99 }, 'hat_bow').state;
    expect(cat(equip(owned, 'hat_bow')).equipped.hat).toBe(null);
    expect(cat(equip(equip(owned, 'hat_bow'), 'hat_bow')).equipped.hat).toBe('hat_bow');
  });
});

describe('claimDailyGift', () => {
  it('gives once per day and builds a streak', () => {
    const base = { ...fresh(), coins: 0, lastGiftDay: null, streak: 0 };
    const d1 = claimDailyGift(base, T0);
    expect(d1.coins).toBeGreaterThan(0);
    expect(d1.state.streak).toBe(1);
    expect(claimDailyGift(d1.state, T0 + HOUR).coins).toBe(0);
    const d2 = claimDailyGift(d1.state, T0 + DAY);
    expect(d2.state.streak).toBe(2);
    expect(d2.coins).toBeGreaterThan(d1.coins);
    expect(claimDailyGift(d2.state, T0 + 4 * DAY).state.streak).toBe(1);
  });
  it('weather is the same all day and every kind shows up over a year', () => {
    expect(weatherOf(T0)).toBe(weatherOf(T0 + 5 * HOUR));
    const seen = new Set();
    for (let d = 0; d < 365; d++) seen.add(weatherOf(T0 + d * DAY));
    expect([...seen].sort()).toEqual(['clear', 'rain', 'snow']);
  });
  it('dayKey uses the local date', () => {
    expect(dayKey(T0)).toBe('2026-11-08');
  });
});

// A game with `count` cats; the newest was adopted `newestAge` ago.
function withCats(count, { newestAge = 3 * DAY, coins = 1000 } = {}) {
  const s = createState('Cat1', T0 - 30 * DAY, 'en');
  const cats = Array.from({ length: count }, (_, i) => newCat(i + 1, `Cat${i + 1}`, 'grey', T0 - (i === count - 1 ? newestAge : 30 * DAY)));
  return { ...s, cats, coins, lastSeen: T0, owned: ['bowl', 'litter', 'cushion'] };
}

describe('more cats', () => {
  it('the 2nd cat waits until the first is a young cat, then costs coins', () => {
    const kitten = { ...fresh(), coins: 1000 };
    expect(nextCatOffer(kitten, T0 + DAY).result).toBe('growing');
    expect(nextCatOffer({ ...kitten, coins: 0 }, T0 + 3 * DAY)).toEqual({ result: 'poor', price: NEW_CAT_PRICES[0] });
    const { state, result } = adoptCat(kitten, 'Bông', 'white', T0 + 3 * DAY);
    expect(result).toBe('ok');
    expect(state.cats.map((c) => c.name)).toEqual(['Mochi', 'Bông']);
    expect(state.coins).toBe(1000 - NEW_CAT_PRICES[0]);
    expect(cat(state)).toMatchObject({ id: 2, name: 'Bông', fur: 'white', adoptedAt: T0 + 3 * DAY });
  });

  it('each next cat waits for the newest one to grow, and costs more', () => {
    expect(nextCatOffer(withCats(2, { newestAge: DAY }), T0).result).toBe('growing');
    expect(nextCatOffer(withCats(2), T0)).toEqual({ result: 'ok', price: NEW_CAT_PRICES[1] });
    expect(nextCatOffer(withCats(4), T0)).toEqual({ result: 'ok', price: NEW_CAT_PRICES[3] });
    expect(nextCatOffer(withCats(MAX_CATS), T0).result).toBe('max');
  });

  it('feeding and petting go to the selected cat only', () => {
    let s = withCats(2);
    s = { ...s, cats: s.cats.map((c) => ({ ...c, stats: { ...c.stats, hunger: 30 } })) };
    s = selectCat(s, 1);
    const fed = feed(s, 'kibble').state;
    expect(fed.cats.map((c) => c.stats.hunger)).toEqual([55, 30]);
    const petted = pet(fed, T0, 2).state;
    expect(petted.cats[1].lastPetAt).toBe(T0);
    expect(petted.cats[0].lastPetAt).toBe(0);
  });

  it('cleaning the shared litter box helps every cat', () => {
    const s = withCats(3);
    const dirty = { ...s, cats: s.cats.map((c, i) => ({ ...c, stats: { ...c.stats, cleanliness: 10 * (i + 1) } })) };
    const r = clean(dirty);
    expect(r.state.cats.every((c) => c.stats.cleanliness === 100)).toBe(true);
    expect(r.coins).toBe(2);
  });

  it('each cat wears its own hat; wallpaper is for the room', () => {
    let s = buy(selectCat(withCats(2), 1), 'hat_crown').state;
    s = selectCat(s, 2);
    expect(cat(s).equipped.hat).toBe(null);
    s = equip(s, 'hat_crown');
    expect(s.cats.map((c) => c.equipped.hat)).toEqual(['hat_crown', 'hat_crown']);
    s = buy(s, 'wall_mint').state;
    expect(s.equipped.wall).toBe('wall_mint');
  });

  it('time away affects every cat, and each grows at its own pace', () => {
    const s = applyElapsed(withCats(2, { newestAge: 0 }), T0 + 2 * DAY);
    expect(s.cats.every((c) => c.stats.hunger === 0)).toBe(true);
    expect(s.cats.map((c) => stageOf(c, T0))).toEqual(['adult', 'kitten']);
  });

  it('ignores selecting a cat that does not exist', () => {
    const s = fresh();
    expect(selectCat(s, 9)).toBe(s);
  });
});
