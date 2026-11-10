import { describe, it, expect } from 'vitest';
import { createState } from '../src/state.js';
import { feedAll, newCat } from '../src/rules.js';
import { FOODS, FULL_HUNGER } from '../src/config.js';

const T0 = new Date(2026, 10, 10, 10).getTime();
const cream = FOODS.find((f) => f.id === 'cream');

// Three cats with these hunger values, a bowl, and `coins`.
function family(hungers, coins = 100) {
  const s = createState('Cat1', T0, 'en');
  const cats = hungers.map((hunger, i) => ({ ...newCat(i + 1, `Cat${i + 1}`, 'grey', T0), stats: { hunger, happiness: 50, energy: 80, cleanliness: 80 } }));
  return { ...s, cats, coins, owned: ['bowl', 'litter'] };
}

describe('feeding the whole family', () => {
  it('feeds every cat that is not full and pays for each', () => {
    const r = feedAll(family([30, 40, FULL_HUNGER]), 'cream');
    expect(r.result).toBe('ok');
    expect(r.fed).toEqual([1, 2]);
    expect(r.state.cats.map((c) => c.stats.hunger)).toEqual([30 + cream.hunger, 40 + cream.hunger, FULL_HUNGER]);
    expect(r.state.coins).toBe(100 - 2 * cream.price);
  });

  it('feeds no one when there are not enough coins for all of them', () => {
    const r = feedAll(family([30, 40, 50], 2 * cream.price), 'cream');
    expect(r.result).toBe('poor');
    expect(r.state.coins).toBe(2 * cream.price);
    expect(r.fed).toEqual([]);
  });

  it('says so when every cat is full', () => {
    expect(feedAll(family([FULL_HUNGER, 99]), 'kibble').result).toBe('full');
  });

  it('needs a bowl and awake cats', () => {
    expect(feedAll({ ...family([30, 30]), owned: [] }, 'kibble').result).toBe('noBowl');
    expect(feedAll({ ...family([30, 30]), asleep: true }, 'kibble').result).toBe('asleep');
  });
});
