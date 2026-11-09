// Short-lived animations, keyed by name -> end time (performance.now() ms).
const ends = {};

export function playEffect(name, ms, now = performance.now()) {
  ends[name] = now + ms;
}

export function stopEffect(name) {
  delete ends[name];
}

export function active(name, now) {
  return (ends[name] ?? 0) > now;
}

// 1 at the start of an effect, falling to 0 at its end.
export function remaining(name, now, ms) {
  return Math.max(0, ((ends[name] ?? 0) - now) / ms);
}
