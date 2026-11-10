import { describe, it, expect } from 'vitest';
import { scoreTap } from '../src/minigame/mouse.js';

describe('Mouse Catch scoring', () => {
  it('a mouse is worth 1, a golden mouse 3, and a yarn ball costs 1', () => {
    expect(scoreTap(4, 'mouse')).toBe(5);
    expect(scoreTap(4, 'gold')).toBe(7);
    expect(scoreTap(4, 'yarn')).toBe(3);
  });

  it('the score never goes below 0', () => {
    expect(scoreTap(0, 'yarn')).toBe(0);
  });
});
