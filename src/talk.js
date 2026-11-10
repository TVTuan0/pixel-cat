// What cats say, and in which tone. The lines themselves live in the language files as lists
// (talk_<situation> or talk_<situation>_<tone>); one is picked at random each time.

// A cat's tone of voice for its mood: smug when happy, grumbling when it needs something, snappy when angry.
export function talkGroup(mood) {
  if (mood === 'happy' || mood === 'okay') return 'happy';
  if (mood === 'angry') return 'angry';
  return 'grumpy';
}

// Situations where the tone depends on the mood.
const BY_MOOD = ['pet', 'idle'];
// Situations with one set of lines.
const PLAIN = ['feed', 'treat', 'feedFull', 'clean', 'play', 'present', 'outside', 'comeIn', 'broke', 'butterfly', 'bought', 'idle_garden'];

export const TALK_KEYS = [
  ...BY_MOOD.flatMap((s) => ['happy', 'grumpy', 'angry'].map((g) => `talk_${s}_${g}`)),
  ...PLAIN.map((s) => `talk_${s}`),
];

// The language key for a situation: talkKey('pet', 'hungry') -> 'talk_pet_grumpy'.
export function talkKey(situation, mood) {
  return BY_MOOD.includes(situation) ? `talk_${situation}_${talkGroup(mood)}` : `talk_${situation}`;
}
