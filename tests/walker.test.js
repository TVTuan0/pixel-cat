import { describe, it, expect } from 'vitest';
import { planPath, placeCat, goTo, updateCat, catPose } from '../src/render/walker.js';
import { SPOTS, FLOOR_G } from '../src/render/layout.js';

function runUntilStill(maxSeconds = 30) {
  let now = 0;
  for (let i = 0; i < maxSeconds * 60; i++) {
    now += 1000 / 60;
    updateCat(1 / 60, now);
    if (catPose().mode === 'sit') return;
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
    placeCat('center');
    let arrived = false;
    goTo('bed', () => { arrived = true; });
    updateCat(1 / 60, 0);
    expect(catPose().mode).toBe('walk');
    expect(catPose().facing).toBe(-1);
    runUntilStill();
    expect(arrived).toBe(true);
    expect(catPose()).toMatchObject({ x: SPOTS.bed.x, g: SPOTS.bed.g, spot: 'bed', mode: 'sit' });
  });
  it('can go from the cat tree to the sofa', () => {
    placeCat('tree');
    goTo('sofa');
    runUntilStill();
    expect(catPose()).toMatchObject({ x: SPOTS.sofa.x, g: SPOTS.sofa.g, spot: 'sofa' });
  });
});
