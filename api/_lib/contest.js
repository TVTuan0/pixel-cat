// Weekly "Cutest Room" contest, server side. `store` is an Upstash Redis client (or a test stand-in).
// Players have no accounts: each browser sends a random id, which is only ever stored hashed.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cleanEntry, weekKey, weekEnd } from '../../src/contestRoom.js';
import { DAY } from '../../src/config.js';

const KEEP_SECONDS = 35 * 24 * 3600; // contest data is kept for 5 weeks
const TICKET_MS = 3600 * 1000; // a duel must be voted on within an hour
const LEAST_SHOWN_POOL = 6; // duels pick from the rooms shown least so far

export class ContestError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

const key = (week, ...parts) => `pc:${week}:${parts.join(':')}`;
const randomId = () => randomBytes(9).toString('base64url');
const hmac = (secret, text) => createHmac('sha256', secret).update(text).digest('base64url');
const deviceHash = (secret, device) => hmac(secret, `device:${device}`).slice(0, 24);

function sameText(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// A ticket names the two rooms shown and who saw them, signed so it can't be made up or changed.
function signTicket(secret, data) {
  const body = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${body}.${hmac(secret, body)}`;
}
function readTicket(secret, ticket) {
  const [body, signature] = String(ticket).split('.');
  if (!body || !signature || !sameText(signature, hmac(secret, body))) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
}

// At most `max` actions per window of `seconds`, per browser or per connection.
async function limit(store, name, who, max, seconds, now) {
  const k = `pc:rate:${name}:${who}:${Math.floor(now / 1000 / seconds)}`;
  const count = await store.incr(k);
  if (count === 1) await store.expire(k, seconds);
  if (count > max) throw new ContestError('slow_down', 429);
}

// Upstash returns [member, score, member, score, ...].
function pairs(flat) {
  const out = [];
  for (let i = 0; i < flat.length; i += 2) out.push({ id: String(flat[i]), score: Number(flat[i + 1]) });
  return out;
}

async function roomOf(store, week, id) {
  return (await store.get(key(week, 'entry', id)))?.room ?? null;
}

export async function enterContest(store, { secret, device, ip, entry, now }) {
  const room = cleanEntry(entry);
  if (!room) throw new ContestError('bad_entry');
  const dev = deviceHash(secret, device);
  await limit(store, 'enter', dev, 10, 3600, now);
  await limit(store, 'enter-ip', ip, 60, 3600, now);

  const week = weekKey(now);
  const entryId = (await store.get(key(week, 'device', dev))) ?? randomId();
  await store.set(key(week, 'entry', entryId), { id: entryId, room, at: now }, { ex: KEEP_SECONDS });
  await store.set(key(week, 'device', dev), entryId, { ex: KEEP_SECONDS });
  for (const board of ['shown', 'wins']) {
    await store.zadd(key(week, board), { nx: true }, { score: 0, member: entryId });
    await store.expire(key(week, board), KEEP_SECONDS);
  }
  return { week, entryId, room };
}

// Two rooms to compare, never the player's own, chosen from those shown least.
export async function nextDuel(store, { secret, device, now, random = Math.random }) {
  const week = weekKey(now);
  const dev = deviceHash(secret, device);
  const own = await store.get(key(week, 'device', dev));
  const pool = pairs(await store.zrange(key(week, 'shown'), 0, -1, { withScores: true }))
    .filter((e) => e.id !== own)
    .slice(0, LEAST_SHOWN_POOL);
  if (pool.length < 2) return { week, endsAt: weekEnd(now), pair: null };

  // The first room is one of the least shown; the second is any other from the pool.
  const leastShown = pool.filter((e) => e.score === pool[0].score);
  const first = leastShown[Math.floor(random() * leastShown.length)].id;
  const rest = pool.filter((e) => e.id !== first);
  const second = rest[Math.floor(random() * rest.length)].id;
  for (const id of [first, second]) await store.zincrby(key(week, 'shown'), 1, id);
  const ticket = signTicket(secret, { w: week, a: first, b: second, d: dev, t: now, n: randomId() });
  return {
    week,
    endsAt: weekEnd(now),
    ticket,
    pair: [{ id: first, room: await roomOf(store, week, first) }, { id: second, room: await roomOf(store, week, second) }],
  };
}

export async function castVote(store, { secret, device, ip, ticket, winner, now }) {
  const data = readTicket(secret, ticket);
  if (!data || data.d !== deviceHash(secret, device)) throw new ContestError('bad_ticket', 403);
  if (data.w !== weekKey(now)) throw new ContestError('week_over', 409);
  if (now - data.t > TICKET_MS) throw new ContestError('ticket_expired', 409);
  if (winner !== data.a && winner !== data.b) throw new ContestError('bad_vote');
  await limit(store, 'vote', data.d, 200, 3600, now);
  await limit(store, 'vote-ip', ip, 600, 3600, now);
  const fresh = await store.set(`pc:ticket:${data.n}`, 1, { nx: true, ex: 2 * 3600 });
  if (!fresh) throw new ContestError('already_voted', 409);
  await store.zincrby(key(data.w, 'wins'), 1, winner);
  return { ok: true };
}

// All rooms of a week, best first: most wins, then best win rate.
async function standings(store, week) {
  const wins = pairs(await store.zrange(key(week, 'wins'), 0, -1, { withScores: true }));
  const shown = new Map(pairs(await store.zrange(key(week, 'shown'), 0, -1, { withScores: true })).map((e) => [e.id, e.score]));
  const rate = (e) => e.score / Math.max(1, shown.get(e.id) ?? 0);
  return wins.sort((a, b) => b.score - a.score || rate(b) - rate(a) || (a.id < b.id ? -1 : 1));
}

export async function contestStatus(store, { secret, device, now }) {
  const week = weekKey(now);
  const lastWeek = weekKey(now - 7 * DAY);
  const dev = deviceHash(secret, device);

  const current = await standings(store, week);
  const mineId = await store.get(key(week, 'device', dev));
  const mineIndex = current.findIndex((e) => e.id === mineId);

  const last = await standings(store, lastWeek);
  const top = [];
  for (const [i, e] of last.filter((x) => x.score > 0).slice(0, 3).entries()) {
    top.push({ rank: i + 1, wins: e.score, room: await roomOf(store, lastWeek, e.id) });
  }
  const lastMineId = await store.get(key(lastWeek, 'device', dev));
  const lastIndex = last.findIndex((e) => e.id === lastMineId);

  return {
    week,
    endsAt: weekEnd(now),
    entries: current.length,
    mine: mineIndex < 0 ? null : { entryId: mineId, wins: current[mineIndex].score, rank: mineIndex + 1 },
    lastWeek: {
      week: lastWeek,
      top,
      mine: lastIndex < 0 ? null : { rank: lastIndex + 1, wins: last[lastIndex].score },
    },
  };
}
