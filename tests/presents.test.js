import { describe, it, expect } from 'vitest';
import { createState } from '../src/state.js';
import { applyElapsed, pickUpPresent } from '../src/rules.js';
import { HOUR, PRESENT_EVERY_HOURS, MAX_PRESENTS } from '../src/config.js';

const T0 = new Date(2026, 10, 10, 10).getTime();
const fresh = () => ({ ...createState('Mochi', T0, 'en'), owned: ['bowl', 'litter', 'cushion'] });
// Rolls: the first decides coins or a gift box, the rest pick the coins / item / look.
const always = (value) => () => value;
const COINS_ROLL = always(0.5); // above the gift-box chance: a small present with coins

describe('presents', () => {
  it('a new game starts with no presents', () => {
    expect(fresh().presents).toEqual([]);
  });

  it('a cat brings a present every few hours', () => {
    const s = applyElapsed(fresh(), T0 + PRESENT_EVERY_HOURS * HOUR + 1, COINS_ROLL);
    expect(s.presents).toHaveLength(1);
    expect(s.presents[0].coins).toBeGreaterThanOrEqual(3);
    expect(s.presents[0].coins).toBeLessThanOrEqual(8);
  });

  it('never more than a few wait at once, and the next one comes a while after picking up', () => {
    // Full stats, so the cat is still calm after 4 rounds away.
    const full = { ...fresh(), cats: fresh().cats.map((c) => ({ ...c, stats: { hunger: 100, happiness: 100, energy: 100, cleanliness: 100 } })) };
    const away = applyElapsed(full, T0 + 4 * PRESENT_EVERY_HOURS * HOUR + 1, COINS_ROLL);
    expect(away.presents).toHaveLength(MAX_PRESENTS);
    const picked = pickUpPresent(away, 0).state;
    expect(applyElapsed(picked, picked.lastSeen + 60 * 1000, COINS_ROLL).presents).toHaveLength(MAX_PRESENTS - 1);
  });

  it('presents sit in different places on the floor', () => {
    const s = applyElapsed(fresh(), T0 + 3 * PRESENT_EVERY_HOURS * HOUR + 1, COINS_ROLL);
    expect(new Set(s.presents.map((p) => p.spot)).size).toBe(s.presents.length);
  });

  it('an angry cat brings nothing', () => {
    const s = fresh();
    const angry = { ...s, cats: [{ ...s.cats[0], stats: { ...s.cats[0].stats, hunger: 5 } }] };
    expect(applyElapsed(angry, T0 + PRESENT_EVERY_HOURS * HOUR + 1, COINS_ROLL).presents).toEqual([]);
  });

  it('picking up a present pays its coins', () => {
    const s = applyElapsed(fresh(), T0 + PRESENT_EVERY_HOURS * HOUR + 1, COINS_ROLL);
    const { state, present } = pickUpPresent(s, 0);
    expect(state.presents).toEqual([]);
    expect(state.coins).toBe(s.coins + present.coins);
  });

  it('sometimes it is a gift box with an item the player does not have yet', () => {
    const s = applyElapsed(fresh(), T0 + PRESENT_EVERY_HOURS * HOUR + 1, always(0));
    expect(s.presents[0].item).toBeTruthy();
    const { state } = pickUpPresent(s, 0);
    expect(state.owned).toContain(s.presents[0].item);
  });

  it('a gift box falls back to coins when the player already owns every gift item', () => {
    const owned = ['bowl', 'litter', 'cushion', 'toy_mouse', 'toy_yarn', 'decor_plant'];
    const s = applyElapsed({ ...fresh(), owned }, T0 + PRESENT_EVERY_HOURS * HOUR + 1, always(0));
    expect(s.presents[0].item).toBeUndefined();
    expect(s.presents[0].coins).toBeGreaterThan(0);
  });
});
