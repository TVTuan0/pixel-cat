import { describe, it, expect } from 'vitest';
import { SPRITES } from '../src/render/sprites.js';
import { SHOP_ITEMS, FOODS } from '../src/config.js';

describe('sprites', () => {
  it('every row has the same width and every letter has a color', () => {
    for (const [name, { rows, colors }] of Object.entries(SPRITES)) {
      const width = rows[0].length;
      for (const row of rows) {
        expect(row.length, `${name}: "${row}"`).toBe(width);
        for (const ch of row) if (ch !== '.') expect(colors[ch], `${name} '${ch}'`).toBeTruthy();
      }
    }
  });
  it('every shop item and food has an icon', () => {
    for (const id of [...SHOP_ITEMS.map((i) => i.id), ...FOODS.map((f) => `food_${f.id}`)]) {
      expect(SPRITES[id], id).toBeTruthy();
    }
  });
});

describe('half-unit sprites', () => {
  it('a sprite drawn in half units is half the size in room units', async () => {
    const { spriteSize } = await import('../src/render/sprites.js');
    SPRITES.__half = { cell: 0.5, colors: { a: '#000' }, rows: ['aaaa', 'aaaa'] };
    expect(spriteSize('__half')).toEqual({ w: 2, h: 1 });
    delete SPRITES.__half;
  });
});
