import { describe, it, expect } from 'vitest';
import { fakeStore } from './fakeStore.js';
import { enterContest, nextDuel, castVote, contestStatus } from '../api/_lib/contest.js';
import { DAY, HOUR } from '../src/config.js';

const SECRET = 'test-secret';
const T0 = Date.UTC(2026, 10, 11, 9); // Wednesday of the week starting 2026-11-09
const entry = (name, fur = 'orange') => ({ cats: [{ name, fur, stage: 'young', hat: null, collar: null }], decor: [], wall: null, floor: null });
const player = (n) => ({ secret: SECRET, device: `device-${n}-abcdefghij`, ip: `10.0.0.${n}` });

async function errorOf(promise) {
  try { await promise; return null; } catch (e) { return e.code; }
}

async function contestWith(count, store = fakeStore()) {
  for (let i = 1; i <= count; i++) await enterContest(store, { ...player(i), entry: entry(`Cat${i}`), now: T0 });
  return store;
}

describe('entering', () => {
  it('enters a room, and entering again the same week updates it', async () => {
    const store = fakeStore();
    const a = await enterContest(store, { ...player(1), entry: entry('Mochi'), now: T0 });
    expect(a.week).toBe('2026-11-09');
    const b = await enterContest(store, { ...player(1), entry: entry('Mochi', 'black'), now: T0 + HOUR });
    expect(b.entryId).toBe(a.entryId);
    const status = await contestStatus(store, { ...player(1), now: T0 + HOUR });
    expect(status.entries).toBe(1);
    expect(status.mine.entryId).toBe(a.entryId);
  });

  it('refuses rooms with unknown parts and cleans rude names', async () => {
    const store = fakeStore();
    expect(await errorOf(enterContest(store, { ...player(1), entry: { cats: [] }, now: T0 }))).toBe('bad_entry');
    const r = await enterContest(store, { ...player(1), entry: entry('fuck'), now: T0 });
    expect(r.room.cats[0].name).toBe('Cat');
  });

  it('limits how often one browser can enter', async () => {
    const store = fakeStore();
    for (let i = 0; i < 10; i++) await enterContest(store, { ...player(1), entry: entry('Mochi'), now: T0 });
    expect(await errorOf(enterContest(store, { ...player(1), entry: entry('Mochi'), now: T0 }))).toBe('slow_down');
  });
});

describe('duels', () => {
  it('needs two other rooms, and never shows your own', async () => {
    const store = await contestWith(2);
    expect((await nextDuel(store, { ...player(1), now: T0 })).pair).toBe(null);
    await contestWith(3, store);
    for (let i = 0; i < 10; i++) {
      const duel = await nextDuel(store, { ...player(1), now: T0 });
      const names = duel.pair.map((e) => e.room.cats[0].name).sort();
      expect(names).toEqual(['Cat2', 'Cat3']);
    }
  });

  it('shows less-seen rooms first, so every room gets a turn', async () => {
    const store = await contestWith(10);
    const times = new Map();
    for (let i = 0; i < 20; i++) {
      const duel = await nextDuel(store, { ...player(99), now: T0 });
      duel.pair.forEach((e) => times.set(e.id, (times.get(e.id) ?? 0) + 1));
    }
    expect(times.size).toBe(10);
    expect(Math.max(...times.values()) - Math.min(...times.values())).toBeLessThanOrEqual(3);
  });
});

describe('voting', () => {
  it('counts a vote once, for one of the two rooms shown', async () => {
    const store = await contestWith(3);
    const duel = await nextDuel(store, { ...player(9), now: T0 });
    const [a, b] = duel.pair;
    expect(await errorOf(castVote(store, { ...player(9), ticket: duel.ticket, winner: 'someone-else', now: T0 }))).toBe('bad_vote');
    expect(await castVote(store, { ...player(9), ticket: duel.ticket, winner: a.id, now: T0 })).toEqual({ ok: true });
    expect(await errorOf(castVote(store, { ...player(9), ticket: duel.ticket, winner: b.id, now: T0 }))).toBe('already_voted');
    const status = await contestStatus(store, { ...player(9), now: T0 });
    expect(status.entries).toBe(3);
  });

  it('refuses made-up, borrowed or old tickets', async () => {
    const store = await contestWith(3);
    const duel = await nextDuel(store, { ...player(9), now: T0 });
    const winner = duel.pair[0].id;
    const forged = duel.ticket.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'));
    expect(await errorOf(castVote(store, { ...player(9), ticket: forged, winner, now: T0 }))).toBe('bad_ticket');
    expect(await errorOf(castVote(store, { ...player(8), ticket: duel.ticket, winner, now: T0 }))).toBe('bad_ticket');
    expect(await errorOf(castVote(store, { ...player(9), ticket: duel.ticket, winner, now: T0 + 2 * HOUR }))).toBe('ticket_expired');
    expect(await errorOf(castVote(store, { ...player(9), ticket: duel.ticket, winner, now: T0 + 7 * DAY }))).toBe('week_over');
  });
});

describe('results', () => {
  it("shows last week's top 3 and each player's own place", async () => {
    const store = await contestWith(4);
    // Cat3 wins most, then Cat1, then Cat4; Cat2 never wins.
    const wins = { Cat3: 5, Cat1: 3, Cat4: 1 };
    let votes = 0;
    while (Object.values(wins).some((n) => n > 0) && votes < 400) {
      const voter = player(50 + (votes % 40));
      const duel = await nextDuel(store, { ...voter, now: T0 });
      const pick = duel.pair.find((e) => wins[e.room.cats[0].name] > 0);
      votes++;
      if (!pick) continue;
      wins[pick.room.cats[0].name]--;
      await castVote(store, { ...voter, ticket: duel.ticket, winner: pick.id, now: T0 });
    }
    const nextWeek = T0 + 7 * DAY;
    const status = await contestStatus(store, { ...player(1), now: nextWeek });
    expect(status.week).toBe('2026-11-16');
    expect(status.lastWeek.top.map((e) => [e.rank, e.room.cats[0].name, e.wins])).toEqual([[1, 'Cat3', 5], [2, 'Cat1', 3], [3, 'Cat4', 1]]);
    expect(status.lastWeek.mine).toEqual({ rank: 2, wins: 3 });
    expect((await contestStatus(store, { ...player(2), now: nextWeek })).lastWeek.mine).toEqual({ rank: 4, wins: 0 });
    expect((await contestStatus(store, { ...player(77), now: nextWeek })).lastWeek.mine).toBe(null);
  });
});
