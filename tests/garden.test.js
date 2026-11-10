import { describe, it, expect } from 'vitest';
import { createState } from '../src/state.js';
import { applyElapsed, goOutside, comeInside, wanderOutside, weatherOf, selectedCat, buy } from '../src/rules.js';
import { HOUR, DAY, SHOP_ITEMS, DECAY_PER_HOUR, GARDEN_JOY_PER_HOUR, GARDEN_STAY_HOURS } from '../src/config.js';

// Finds a day with this weather, at 10 in the morning.
function dayWith(weather) {
  let t = new Date(2026, 10, 10, 10).getTime();
  while (weatherOf(t) !== weather) t += DAY;
  return t;
}
const SUNNY = dayWith('clear');
const RAINY = dayWith('rain');

const withDoor = (time = SUNNY) => ({ ...createState('Mochi', time, 'en'), owned: ['bowl', 'litter', 'garden_door'] });
const cat = (s) => selectedCat(s);
const outside = (time = SUNNY) => goOutside(withDoor(time), 1, time).state;

describe('garden door', () => {
  it('is sold in the shop for 150 coins', () => {
    expect(SHOP_ITEMS.find((i) => i.id === 'garden_door')).toMatchObject({ slot: 'garden', price: 150 });
    expect(buy({ ...createState('Mochi', SUNNY, 'en'), coins: 150 }, 'garden_door').state.owned).toContain('garden_door');
  });
});

describe('going outside', () => {
  it('needs the garden door', () => {
    expect(goOutside(createState('Mochi', SUNNY, 'en'), 1, SUNNY).result).toBe('noDoor');
  });

  it('works on a sunny day', () => {
    const r = goOutside(withDoor(), 1, SUNNY);
    expect(r.result).toBe('ok');
    expect(cat(r.state).outside).toBe(true);
    expect(cat(comeInside(r.state, 1)).outside).toBe(false);
  });

  it('not at night, in the rain, or with the lights off', () => {
    const night = new Date(SUNNY).setHours(22);
    expect(goOutside(withDoor(night), 1, night).result).toBe('night');
    expect(goOutside(withDoor(RAINY), 1, RAINY).result).toBe('weather');
    expect(goOutside({ ...withDoor(), asleep: true }, 1, SUNNY).result).toBe('asleep');
  });
});

describe('time in the garden', () => {
  it('makes a cat happier instead of sadder', () => {
    const start = cat(outside()).stats.happiness;
    const later = applyElapsed(outside(), SUNNY + HOUR / 2);
    expect(cat(later).stats.happiness).toBeCloseTo(start + GARDEN_JOY_PER_HOUR / 2);
    const inside = applyElapsed(withDoor(), SUNNY + HOUR / 2);
    expect(cat(inside).stats.happiness).toBeLessThan(start);
  });

  it('a cat comes back in on its own after a while, so leaving it out all day does not keep it happy', () => {
    const start = cat(outside()).stats.happiness;
    const later = applyElapsed(outside(), SUNNY + 3 * HOUR);
    expect(cat(later).outside).toBe(false);
    const expected = start + GARDEN_JOY_PER_HOUR * GARDEN_STAY_HOURS - DECAY_PER_HOUR.happiness * (3 - GARDEN_STAY_HOURS);
    expect(cat(later).stats.happiness).toBeCloseTo(expected);
  });

  it('cats come in when evening falls', () => {
    const evening = new Date(SUNNY).setHours(19, 1);
    const start = { ...outside(), lastSeen: evening - 60 * 1000 };
    expect(cat(applyElapsed(start, evening)).outside).toBe(false);
  });

  it('cats come in when the lights go off', () => {
    expect(cat(applyElapsed({ ...outside(), asleep: true }, SUNNY + 1000)).outside).toBe(false);
  });
});

describe('cats wandering in and out', () => {
  it('now and then a cat goes out, or comes back in', () => {
    expect(cat(wanderOutside(withDoor(), SUNNY, () => 0.01)).outside).toBe(true);
    expect(cat(wanderOutside(outside(), SUNNY, () => 0.01)).outside).toBe(false);
  });

  it('mostly they stay where they are', () => {
    expect(cat(wanderOutside(withDoor(), SUNNY, () => 0.9)).outside).toBe(false);
    expect(cat(wanderOutside(outside(), SUNNY, () => 0.9)).outside).toBe(true);
  });

  it('never without the door, at night or in the rain', () => {
    expect(cat(wanderOutside(createState('Mochi', SUNNY, 'en'), SUNNY, () => 0)).outside).toBeFalsy();
    expect(cat(wanderOutside(withDoor(RAINY), RAINY, () => 0)).outside).toBeFalsy();
  });
});
