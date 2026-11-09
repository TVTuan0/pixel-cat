// An in-memory stand-in for the few Upstash Redis commands the contest uses.
export function fakeStore() {
  const values = new Map();
  const sets = new Map(); // key -> Map(member -> score)
  const zset = (key) => { if (!sets.has(key)) sets.set(key, new Map()); return sets.get(key); };
  const copy = (v) => (v === undefined ? null : structuredClone(v));

  return {
    values,
    async get(key) { return copy(values.get(key)); },
    async set(key, value, opts = {}) {
      if (opts.nx && values.has(key)) return null;
      values.set(key, copy(value));
      return 'OK';
    },
    async incr(key) { const n = (values.get(key) ?? 0) + 1; values.set(key, n); return n; },
    async expire() { return 1; },
    async zadd(key, opts, { score, member }) {
      const z = zset(key);
      if (opts.nx && z.has(member)) return 0;
      z.set(member, score);
      return 1;
    },
    async zincrby(key, by, member) { const z = zset(key); z.set(member, (z.get(member) ?? 0) + by); return z.get(member); },
    async zrange(key, start, stop, opts = {}) {
      const sorted = [...zset(key)].sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1));
      return opts.withScores ? sorted.flat() : sorted.map(([m]) => m);
    },
  };
}
