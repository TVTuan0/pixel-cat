import { describe, it, expect } from 'vitest';
import { planPath, createWalker } from '../src/render/walker.js';
import { SPOTS, FLOOR_G } from '../src/render/layout.js';

function runUntilStill(walker, maxSeconds = 30) {
  let now = 0;
  for (let i = 0; i < maxSeconds * 60; i++) {
    now += 1000 / 60;
    walker.update(1 / 60, now);
    if (walker.pose().mode === 'sit') return;
  }
}

describe('planPath', () => {
  it('walks straight to a floor spot', () => {
    expect(planPath({ x: 80, g: FLOOR_G }, SPOTS.bed)).toEqual([{ type: 'walk', x: 34, g: FLOOR_G }]);
  });
  it('walks under a high spot, then jumps up', () => {
    const legs = planPath({ x: 80, g: FLOOR_G }, SPOTS.sofa);
    expect(legs.map((l) => l.type)).toEqual(['walk', 'jump']);
    expect(legs[1]).toMatchObject({ x: SPOTS.sofa.x, g: SPOTS.sofa.g });
  });
  it('jumps down first when up high', () => {
    const legs = planPath({ x: 16, g: 46, base: 24 }, SPOTS.bed);
    expect(legs[0]).toEqual({ type: 'jump', x: 24, g: FLOOR_G });
    expect(legs[1].type).toBe('walk');
  });
});

describe('walking', () => {
  it('reaches the spot, faces the way it walked, and calls back on arrival', () => {
    const walker = createWalker('center');
    let arrived = false;
    walker.goTo('bed', () => { arrived = true; });
    walker.update(1 / 60, 0);
    expect(walker.pose().mode).toBe('walk');
    expect(walker.pose().facing).toBe(-1);
    runUntilStill(walker);
    expect(arrived).toBe(true);
    expect(walker.pose()).toMatchObject({ x: SPOTS.bed.x, g: SPOTS.bed.g, spot: 'bed', mode: 'sit' });
  });
  it('can go from the cat tree to the sofa', () => {
    const walker = createWalker('tree');
    walker.goTo('sofa');
    runUntilStill(walker);
    expect(walker.pose()).toMatchObject({ x: SPOTS.sofa.x, g: SPOTS.sofa.g, spot: 'sofa' });
  });
  it('each cat walks on its own', () => {
    const a = createWalker('center');
    const b = createWalker('bed');
    a.goTo('sofa');
    expect(b.pose()).toMatchObject({ spot: 'bed', mode: 'sit' });
  });
  it('does not wander to a spot another cat has taken', () => {
    const everythingElse = Object.keys(SPOTS).filter((s) => s !== 'center' && s !== 'front');
    for (let i = 0; i < 20; i++) {
      const walker = createWalker('center');
      walker.wander([], 10_000, everythingElse);
      expect(walker.target()).toBe('front');
    }
  });
});
