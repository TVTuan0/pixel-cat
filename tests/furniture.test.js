import { describe, it, expect } from 'vitest';
import { createState } from '../src/state.js';
import { applyElapsed, helpFor, usableItems, selectedCat, feed, clean, repair, repairPrice } from '../src/rules.js';
import { HOUR, DECAY_PER_HOUR, MAX_HELP } from '../src/config.js';

const MINUTE = 60 * 1000;

const T0 = new Date(2026, 10, 10, 10).getTime();
const fresh = (extra = {}) => ({ ...createState('Mochi', T0, 'en'), ...extra });

describe('help from items', () => {
  it('adds up help from owned items', () => {
    expect(helpFor(fresh(), 'happiness')).toBe(0);
    expect(helpFor(fresh({ owned: ['cat_tree'] }), 'happiness')).toBe(15);
    expect(helpFor(fresh({ owned: ['cat_tree', 'sofa'] }), 'happiness')).toBe(25);
    expect(helpFor(fresh({ owned: ['cat_tree'] }), 'hunger')).toBe(0);
  });

  it('never helps more than the cap', () => {
    const owned = ['cat_tree', 'sofa', 'bookshelf', 'decor_plant', 'decor_frame', 'decor_lights', 'toy_yarn'];
    expect(helpFor(fresh({ owned }), 'happiness')).toBe(MAX_HELP);
  });

  it('broken items do not help and are not usable', () => {
    const s = fresh({ owned: ['cat_tree', 'sofa'], broken: ['cat_tree'] });
    expect(helpFor(s, 'happiness')).toBe(10);
    expect(usableItems(s)).toEqual(['sofa']);
  });

  it('slows the drop of the helped stat', () => {
    const plain = applyElapsed(fresh(), T0 + 2 * HOUR);
    const helped = applyElapsed(fresh({ owned: ['cat_tree'] }), T0 + 2 * HOUR);
    const start = selectedCat(fresh()).stats.happiness;
    expect(start - selectedCat(plain).stats.happiness).toBeCloseTo(2 * DECAY_PER_HOUR.happiness);
    expect(start - selectedCat(helped).stats.happiness).toBeCloseTo(2 * DECAY_PER_HOUR.happiness * 0.85);
  });
});

describe('fresh start', () => {
  it('starts with just enough coins for the basics and nothing broken', () => {
    const s = fresh();
    expect(s.coins).toBe(25);
    expect(s.owned).toEqual([]);
    expect(s.broken).toEqual([]);
  });
});

describe('basic supplies', () => {
  it('feeding needs a bowl and cleaning needs a litter box', () => {
    const s = { ...fresh(), cats: [{ ...fresh().cats[0], stats: { hunger: 30, happiness: 50, energy: 50, cleanliness: 30 } }] };
    expect(feed(s, 'kibble').result).toBe('noBowl');
    expect(clean(s).result).toBe('noLitter');
    const ready = { ...s, owned: ['bowl', 'litter'] };
    expect(feed(ready, 'kibble').result).toBe('ok');
    expect(clean(ready).result).toBe('ok');
  });
});

describe('angry cats', () => {
  const BREAKABLE = ['cat_tree', 'sofa', 'lamp', 'decor_plant'];
  // One cat with these stats; everything else is high. Owns basics plus breakable items.
  const room = (stats, extra = {}) => {
    const s = fresh({ owned: ['bowl', 'litter', 'cushion', ...BREAKABLE], ...extra });
    return { ...s, cats: [{ ...s.cats[0], stats: { hunger: 90, happiness: 90, energy: 90, cleanliness: 90, ...stats } }] };
  };
  const first = () => 0; // always picks the first breakable item

  it('breaks one item when a stat drops below 10', () => {
    const s = applyElapsed(room({ hunger: 15 }), T0 + 52 * MINUTE, first); // goes below 10 at 50 minutes
    expect(s.broken).toEqual(['cat_tree']);
    expect(s.news).toEqual([{ cat: 'Mochi', catId: 1, item: 'cat_tree' }]);
  });

  it('a calm cat breaks nothing', () => {
    const s = applyElapsed(room({ hunger: 50 }), T0 + HOUR, first);
    expect(s.broken).toEqual([]);
    expect(s.news).toEqual([]);
    expect(selectedCat(s).nextBreakAt).toBe(null);
  });

  it('keeps breaking every 5 minutes while it stays angry', () => {
    const s = applyElapsed(room({ hunger: 5 }), T0 + 13 * MINUTE, first);
    expect(s.broken).toEqual(['cat_tree', 'sofa', 'lamp']);
    expect(selectedCat(s).nextBreakAt).toBe(T0 + 15 * MINUTE);
  });

  it('the clock starts again after the cat calms down', () => {
    const angry = applyElapsed(room({ hunger: 5 }), T0 + MINUTE, first);
    expect(selectedCat(angry).nextBreakAt).toBe(T0 + 5 * MINUTE);
    const fed = { ...angry, cats: angry.cats.map((c) => ({ ...c, stats: { ...c.stats, hunger: 80 } })) };
    expect(selectedCat(applyElapsed(fed, T0 + 2 * MINUTE, first)).nextBreakAt).toBe(null);
  });

  it('never breaks basic supplies, so nothing happens when only basics are owned', () => {
    const s = applyElapsed(room({ hunger: 0 }, { owned: ['bowl', 'litter', 'cushion', 'hat_bow', 'wall_mint'] }), T0 + 20 * HOUR, first);
    expect(s.broken).toEqual([]);
    expect(s.news).toEqual([]);
  });
});

describe('repair', () => {
  const broken = (coins) => fresh({ owned: ['sofa'], broken: ['sofa'], coins });

  it('costs half the price, rounded up', () => {
    expect(repairPrice('sofa')).toBe(25);
    expect(repairPrice('toy_yarn')).toBe(6);
    expect(repairPrice('decor_plant')).toBe(8);
  });

  it('fixes a broken item for coins', () => {
    const r = repair(broken(30), 'sofa');
    expect(r.result).toBe('ok');
    expect(r.state.broken).toEqual([]);
    expect(r.state.coins).toBe(5);
  });

  it('refuses when the item is fine or coins are short', () => {
    expect(repair(fresh({ owned: ['sofa'], coins: 99 }), 'sofa').result).toBe('notBroken');
    expect(repair(broken(10), 'sofa').result).toBe('poor');
  });
});
