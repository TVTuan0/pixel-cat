import { describe, it, expect } from 'vitest';
import { createState } from '../src/state.js';
import { moodOf } from '../src/rules.js';
import { pickBehavior } from '../src/render/behavior.js';
import { scratchPoint, ROOM_W, FLOOR_G } from '../src/render/layout.js';
import { BREAKABLE_SLOTS, SHOP_ITEMS } from '../src/config.js';

const T0 = new Date(2026, 10, 10, 10).getTime();
// Always rolls the same number, so the pick is the option at that point of the weights.
const rolls = (value) => () => value;

describe('angry mood', () => {
  it('a cat with any stat below 10 is angry', () => {
    const s = createState('Mochi', T0, 'en');
    const angry = { ...s, cats: [{ ...s.cats[0], stats: { ...s.cats[0].stats, happiness: 9 } }] };
    expect(moodOf(angry)).toBe('angry');
    expect(moodOf({ ...angry, asleep: true })).toBe('sleeping');
  });
});

describe('picking what a cat does next', () => {
  it('an angry cat mostly scratches things', () => {
    expect(pickBehavior('angry', 50, rolls(0.1))).toBe('scratch');
    expect(pickBehavior('angry', 50, rolls(0.9))).toBe('look');
  });

  it('a sleepy cat yawns', () => {
    expect(pickBehavior('sleepy', 50, rolls(0.5))).toBe('yawn');
  });

  it('a happy cat can pounce and itch, a hungry cat cannot pounce', () => {
    const happy = new Set([0, 0.2, 0.4, 0.6, 0.8, 0.99].map((r) => pickBehavior('happy', 90, rolls(r))));
    expect(happy).toContain('pounce');
    expect(happy).toContain('itch');
    const hungry = new Set([0, 0.2, 0.4, 0.6, 0.8, 0.99].map((r) => pickBehavior('hungry', 90, rolls(r))));
    expect(hungry).not.toContain('pounce');
  });

  it('a dirty cat itches much more often', () => {
    const share = (cleanliness) => {
      let itch = 0;
      for (let i = 0; i < 100; i++) if (pickBehavior('okay', cleanliness, rolls(i / 100)) === 'itch') itch++;
      return itch;
    };
    expect(share(30)).toBeGreaterThan(share(90) * 3);
  });
});

describe('where a cat stands to scratch an item', () => {
  it('stands inside the room, on the floor, next to every breakable item', () => {
    for (const item of SHOP_ITEMS.filter((i) => BREAKABLE_SLOTS.includes(i.slot))) {
      const p = scratchPoint(item.id);
      expect(p.x, item.id).toBeGreaterThanOrEqual(10);
      expect(p.x, item.id).toBeLessThanOrEqual(ROOM_W - 10);
      expect(p.g, item.id).toBeGreaterThan(80);
      expect(p.g, item.id).toBeLessThanOrEqual(FLOOR_G + 7);
      expect([1, -1], item.id).toContain(p.face);
    }
  });
});

describe('what cats do at each age', () => {
  const picks = (stage) => new Set(Array.from({ length: 100 }, (_, i) => pickBehavior('happy', 30, () => i / 100, stage)));

  it('a newborn only yawns and looks around', () => {
    expect([...picks('newborn')].sort()).toEqual(['look', 'yawn']);
  });

  it('an old cat no longer hops or pounces', () => {
    const old = picks('senior');
    expect(old).not.toContain('hop');
    expect(old).not.toContain('pounce');
    expect(old).toContain('itch');
  });

  it('cats in their prime do everything', () => {
    expect(picks('adult')).toContain('pounce');
  });
});
