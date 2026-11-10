import { describe, it, expect } from 'vitest';
import { createState } from '../src/state.js';
import { applyElapsed, helpFor, usableItems, selectedCat } from '../src/rules.js';
import { HOUR, DECAY_PER_HOUR, MAX_HELP } from '../src/config.js';

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
