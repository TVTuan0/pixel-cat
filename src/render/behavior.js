// Picks a cat's next little action from its mood. Kept apart from drawing so it can be tested.
import { ITCHY_BELOW } from '../config.js';

// How often each action is picked, by mood. Itching gets a bigger share when the cat is dirty.
function weightsFor(mood, cleanliness) {
  const itch = cleanliness < ITCHY_BELOW ? 6 : 1;
  if (mood === 'happy' || mood === 'okay') return { hop: 2, look: 2, yawn: 1, pounce: 2, itch };
  return { look: 2, itch };
}

// Returns one of: yawn, scratch, look, hop, pounce, itch.
export function pickBehavior(mood, cleanliness, random = Math.random) {
  if (mood === 'sleepy') return 'yawn';
  if (mood === 'angry') return random() < 0.7 ? 'scratch' : 'look';
  const weights = Object.entries(weightsFor(mood, cleanliness));
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [name, w] of weights) {
    roll -= w;
    if (roll < 0) return name;
  }
  return weights[weights.length - 1][0];
}
