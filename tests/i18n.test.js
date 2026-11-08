import { describe, it, expect } from 'vitest';
import en from '../src/i18n/en.js';
import vi from '../src/i18n/vi.js';
import { FOODS, SHOP_ITEMS, STAGES } from '../src/config.js';

describe('i18n', () => {
  it('English and Vietnamese have the same keys', () => {
    expect(Object.keys(vi).sort()).toEqual(Object.keys(en).sort());
  });
  it('every food, item and stage has a name', () => {
    const needed = [
      ...FOODS.map((f) => `food_${f.id}`),
      ...SHOP_ITEMS.map((i) => `item_${i.id}`),
      ...STAGES.map((s) => `stage_${s.id}`),
    ];
    for (const key of needed) expect(en[key], key).toBeTruthy();
  });
});
