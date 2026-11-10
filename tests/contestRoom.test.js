import { describe, it, expect } from 'vitest';
import { createState } from '../src/state.js';
import { newCat, stageOf } from '../src/rules.js';
import { buildEntry, entryToScene, weekKey, weekEnd, cleanEntry, cleanName } from '../src/contestRoom.js';
import { DAY, FUR_IDS } from '../src/config.js';
import { FURS } from '../src/render/sprites.js';

const T0 = new Date(Date.UTC(2026, 10, 11, 9)).getTime(); // Wednesday

function decoratedState() {
  const s = createState('Mochi', T0 - 8 * DAY, 'en', 'calico');
  s.cats.push({ ...newCat(2, 'Mun', 'black', T0 - DAY), equipped: { hat: 'hat_bow', collar: null } });
  s.cats[0].equipped = { hat: 'hat_crown', collar: 'collar_red' };
  s.owned = ['hat_crown', 'hat_bow', 'collar_red', 'bowl', 'sofa', 'decor_rug', 'toy_yarn', 'wall_mint'];
  s.broken = ['sofa'];
  s.equipped = { wall: 'wall_mint', floor: null };
  return s;
}

describe('contest week', () => {
  it('runs Monday to Sunday in UTC', () => {
    expect(weekKey(T0)).toBe('2026-11-09');
    expect(weekKey(Date.UTC(2026, 10, 15, 23, 59))).toBe('2026-11-09');
    expect(weekKey(Date.UTC(2026, 10, 16, 0, 0))).toBe('2026-11-16');
    expect(weekEnd(T0)).toBe(Date.UTC(2026, 10, 16));
  });
});

describe('entries', () => {
  it('turns a room into a small entry and back into a scene', () => {
    const entry = buildEntry(decoratedState(), T0);
    expect(entry).toEqual({
      cats: [
        { name: 'Mochi', fur: 'calico', stage: 'adult', hat: 'hat_crown', collar: 'collar_red' },
        { name: 'Mun', fur: 'black', stage: 'kitten', hat: 'hat_bow', collar: null },
      ],
      decor: ['bowl', 'sofa', 'decor_rug', 'toy_yarn'],
      broken: ['sofa'],
      wall: 'wall_mint',
      floor: null,
    });
    const scene = entryToScene(entry, T0);
    expect(scene.cats.map((c) => [c.name, c.fur, stageOf(c, T0), c.equipped.hat])).toEqual([
      ['Mochi', 'calico', 'adult', 'hat_crown'],
      ['Mun', 'black', 'kitten', 'hat_bow'],
    ]);
    expect(scene.owned).toEqual(['bowl', 'sofa', 'decor_rug', 'toy_yarn']);
    expect(scene.broken).toEqual(['sofa']);
    expect(scene.equipped).toEqual({ wall: 'wall_mint', floor: null });
    expect(scene.asleep).toBe(false);
  });

  it('accepts a good entry as is', () => {
    const entry = buildEntry(decoratedState(), T0);
    expect(cleanEntry(entry)).toEqual(entry);
  });

  it('keeps only broken items that are in the room', () => {
    const good = buildEntry(decoratedState(), T0);
    expect(cleanEntry({ ...good, broken: ['sofa', 'lamp', 'hat_bow'] }).broken).toEqual(['sofa']);
    expect(cleanEntry({ ...good, broken: undefined }).broken).toEqual([]);
  });

  it('rejects entries with unknown or missing parts', () => {
    const good = buildEntry(decoratedState(), T0);
    expect(cleanEntry(null)).toBe(null);
    expect(cleanEntry({ ...good, cats: [] })).toBe(null);
    expect(cleanEntry({ ...good, cats: Array(6).fill(good.cats[0]) })).toBe(null);
    expect(cleanEntry({ ...good, cats: [{ ...good.cats[0], fur: 'rainbow' }] })).toBe(null);
    expect(cleanEntry({ ...good, cats: [{ ...good.cats[0], hat: 'hat_tophat' }] })).toBe(null);
    expect(cleanEntry({ ...good, cats: [{ ...good.cats[0], stage: 'elder' }] })).toBe(null);
    expect(cleanEntry({ ...good, wall: 'floor_tiles' })).toBe(null);
  });

  it('drops unknown decor and duplicates instead of failing', () => {
    const good = buildEntry(decoratedState(), T0);
    expect(cleanEntry({ ...good, decor: ['decor_rug', 'decor_rug', 'hat_crown', 'decor_castle'] }).decor).toEqual(['decor_rug']);
  });

  it('every fur the game can draw is allowed', () => {
    expect(Object.keys(FURS).sort()).toEqual([...FUR_IDS].sort());
  });
});

describe('cat names', () => {
  it('keeps normal names, trims and shortens them', () => {
    expect(cleanName('  Mochi  ')).toBe('Mochi');
    expect(cleanName('Bông')).toBe('Bông');
    expect(cleanName('A very very long cat name')).toBe('A very very long');
    expect(cleanName('Mi\u0000lo‮')).toBe('Milo');
  });
  it('replaces rude or empty names with "Cat"', () => {
    expect(cleanName('')).toBe('Cat');
    expect(cleanName('   ')).toBe('Cat');
    expect(cleanName(42)).toBe('Cat');
    expect(cleanName('fuck')).toBe('Cat');
    expect(cleanName('Mr Shitty')).toBe('Cat');
    expect(cleanName('đm mày')).toBe('Cat');
    expect(cleanName('Đ.ị.t')).toBe('Cat');
  });
  it('does not block innocent names that contain short rude words', () => {
    expect(cleanName('Clover')).toBe('Clover');
    expect(cleanName('Salon')).toBe('Salon');
    expect(cleanName('Cacao')).toBe('Cacao');
    expect(cleanName('Dime')).toBe('Dime');
  });
});
