import { describe, it, expect } from 'vitest';
import { createState } from '../src/state.js';
import {
  applyElapsed, moodOf, stageOf, dayKey, feed, pet, clean, toggleSleep,
  finishFishGame, buy, equip, claimDailyGift,
} from '../src/rules.js';
import { HOUR, DAY, FOODS, START_COINS } from '../src/config.js';

const T0 = new Date(2026, 10, 8, 10, 0, 0).getTime();
const fresh = () => createState('Mochi', T0, 'en');
const withStats = (stats, extra = {}) => ({ ...fresh(), ...extra, stats: { ...fresh().stats, ...stats } });

describe('applyElapsed', () => {
  it('lowers stats over time', () => {
    const s = applyElapsed(fresh(), T0 + 2 * HOUR);
    expect(s.stats.hunger).toBeLessThan(fresh().stats.hunger);
    expect(s.lastSeen).toBe(T0 + 2 * HOUR);
  });

  it('after 3 days away stats are low but never below 0', () => {
    const s = applyElapsed(fresh(), T0 + 3 * DAY);
    for (const v of Object.values(s.stats)) expect(v).toBeGreaterThanOrEqual(0);
    expect(s.stats.hunger).toBe(0);
    expect(moodOf(s)).toBe('grumpy');
  });

  it('raises energy while asleep, capped at 100', () => {
    const s = applyElapsed(withStats({ energy: 20 }, { asleep: true }), T0 + 10 * HOUR);
    expect(s.stats.energy).toBe(100);
  });

  it('ignores a clock that went backwards', () => {
    const s = applyElapsed(fresh(), T0 - HOUR);
    expect(s.stats).toEqual(fresh().stats);
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
    const s = fresh();
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
    expect(state.stats.hunger).toBe(30 + FOODS[0].hunger);
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
    expect(state.stats.happiness).toBe(55);
  });
  it('does not eat while asleep', () => {
    expect(feed(withStats({ hunger: 30 }, { asleep: true }), 'kibble').result).toBe('asleep');
  });
});

describe('pet', () => {
  it('boosts happiness once per cooldown', () => {
    const a = pet(withStats({ happiness: 50 }), T0);
    expect(a.result).toBe('ok');
    expect(a.state.stats.happiness).toBeGreaterThan(50);
    const b = pet(a.state, T0 + 1000);
    expect(b.result).toBe('cooldown');
    expect(b.state.stats.happiness).toBe(a.state.stats.happiness);
  });
});

describe('clean', () => {
  it('fills cleanliness and pays only when it was dirty', () => {
    const dirty = clean(withStats({ cleanliness: 20 }));
    expect(dirty.state.stats.cleanliness).toBe(100);
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
    expect(state.stats.happiness).toBeGreaterThan(40);
    expect(state.stats.energy).toBe(50);
  });
});

describe('shop', () => {
  it('buys when affordable, not twice', () => {
    const a = buy(withStats({}, { coins: 20 }), 'hat_bow');
    expect(a.result).toBe('ok');
    expect(a.state.coins).toBe(5);
    expect(a.state.owned).toContain('hat_bow');
    expect(a.state.equipped.hat).toBe('hat_bow');
    expect(buy(a.state, 'hat_bow').result).toBe('owned');
    expect(buy(withStats({}, { coins: 1 }), 'hat_crown').result).toBe('poor');
  });
  it('equip toggles an owned hat or collar', () => {
    const owned = { ...fresh(), owned: ['hat_bow'], equipped: { hat: 'hat_bow', collar: null } };
    expect(equip(owned, 'hat_bow').equipped.hat).toBe(null);
    expect(equip(equip(owned, 'hat_bow'), 'hat_bow').equipped.hat).toBe('hat_bow');
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
  it('dayKey uses the local date', () => {
    expect(dayKey(T0)).toBe('2026-11-08');
  });
});
