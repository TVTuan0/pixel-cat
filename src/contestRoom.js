// Contest entries: a room as small data (not a picture), checked on the server and redrawn by every player.
// Used by both the game and the server functions in /api.
import { DAY, SHOP_ITEMS, STAGES, FUR_IDS, MAX_CATS } from './config.js';
import { stageOf } from './rules.js';

const ids = (...slots) => SHOP_ITEMS.filter((i) => slots.includes(i.slot)).map((i) => i.id);
const HATS = ids('hat');
const COLLARS = ids('collar');
const DECOR = ids('basic', 'gear', 'furniture', 'decor', 'toy'); // everything that stands in the room
const WALLS = ids('wall');
const FLOORS = ids('floor');
const STAGE_IDS = STAGES.map((s) => s.id);
const NAME_MAX = 16;

// The contest week runs Monday 00:00 to Sunday 23:59, UTC. Its key is the Monday's date.
export function weekStart(time) {
  const d = new Date(time);
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - sinceMonday);
}
export const weekKey = (time) => new Date(weekStart(time)).toISOString().slice(0, 10);
export const weekEnd = (time) => weekStart(time) + 7 * DAY;

export function buildEntry(state, now) {
  return {
    cats: state.cats.map((c) => ({ name: c.name, fur: c.fur, stage: stageOf(c, now), hat: c.equipped.hat, collar: c.equipped.collar })),
    decor: state.owned.filter((id) => DECOR.includes(id)),
    broken: (state.broken ?? []).filter((id) => DECOR.includes(id)),
    wall: state.equipped.wall,
    floor: state.equipped.floor,
  };
}

// A drawable game state for an entry: happy cats of the right age, sitting in the decorated room.
export function entryToScene(entry, now) {
  const age = Object.fromEntries(STAGES.map((s) => [s.id, s.fromDay * DAY])); // just old enough for each stage
  return {
    cats: entry.cats.map((c, i) => ({
      id: i + 1,
      name: c.name,
      fur: c.fur,
      adoptedAt: now - age[c.stage],
      stats: { hunger: 90, happiness: 95, energy: 90, cleanliness: 100 },
      lastPetAt: 0,
      seenStage: c.stage,
      equipped: { hat: c.hat, collar: c.collar },
    })),
    selected: 1,
    owned: entry.decor,
    broken: entry.broken ?? [],
    equipped: { wall: entry.wall, floor: entry.floor },
    asleep: false,
    lastSeen: now,
  };
}

// Rude words. Short ones only count as a whole word, so names like "Clover" or "Salon" stay fine.
const RUDE_WORDS = new Set([
  'dm', 'dmm', 'dcm', 'dkm', 'dit', 'djt', 'lon', 'cac', 'buoi', 'deo', 'vl', 'vcl', 'cl', 'clm', 'cc', 'cmm', 'ditme',
  'fuk', 'fck', 'ass', 'dick', 'cock', 'sex', 'nazi', 'hitler',
]);
const RUDE_PARTS = ['fuck', 'shit', 'bitch', 'cunt', 'nigg', 'whore', 'slut', 'porn', 'rape'];

function isRude(name) {
  const plain = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const words = plain.split(/[^a-z0-9]+/).filter(Boolean);
  const squashed = words.join(''); // catches "Đ.ị.t"
  return words.some((w) => RUDE_WORDS.has(w)) || RUDE_WORDS.has(squashed) || RUDE_PARTS.some((p) => squashed.includes(p));
}

export function cleanName(name) {
  if (typeof name !== 'string') return 'Cat';
  const tidy = name.replace(/\p{C}/gu, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX).trim();
  return !tidy || isRude(tidy) ? 'Cat' : tidy;
}

// Returns a safe copy of an entry, or null if it has anything the game doesn't know.
export function cleanEntry(entry) {
  if (!entry || !Array.isArray(entry.cats) || entry.cats.length < 1 || entry.cats.length > MAX_CATS) return null;
  const oneOf = (value, allowed) => value === null || allowed.includes(value);
  const cats = [];
  for (const c of entry.cats) {
    if (!c || !FUR_IDS.includes(c.fur) || !STAGE_IDS.includes(c.stage) || !oneOf(c.hat, HATS) || !oneOf(c.collar, COLLARS)) return null;
    cats.push({ name: cleanName(c.name), fur: c.fur, stage: c.stage, hat: c.hat, collar: c.collar });
  }
  if (!oneOf(entry.wall ?? null, WALLS) || !oneOf(entry.floor ?? null, FLOORS)) return null;
  const decor = Array.isArray(entry.decor) ? [...new Set(entry.decor.filter((id) => DECOR.includes(id)))] : [];
  const broken = Array.isArray(entry.broken) ? [...new Set(entry.broken.filter((id) => decor.includes(id)))] : [];
  return { cats, decor, broken, wall: entry.wall ?? null, floor: entry.floor ?? null };
}
