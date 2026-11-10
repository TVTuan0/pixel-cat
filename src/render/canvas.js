// Draws the whole scene and drives what each cat is doing on screen.
// Each cat is either in the room or out in the garden; the player looks at one of the two.
import { CAT_SIZES, FURS, agedFur, drawSprite } from './sprites.js';
import { drawRoom, drawDarkness } from './room.js';
import {
  drawGarden, drawGardenWeather, drawButterflies, stepButterflies, butterfliesOut, butterflyToChase, butterflyNear, scare,
} from './garden.js';
import { drawFrontCat, drawSideCat, FACES } from './cat.js';
import { createWalker } from './walker.js';
import { SPOTS, START_SPOTS, SLEEP_SPOTS, PRESENT_SPOTS, GARDEN_SPOTS, scratchPoint } from './layout.js';
import { pickBehavior } from './behavior.js';
import { active, playEffect, stopEffect, remaining } from './effects.js';
import { moodOf, stageOf, usableItems } from '../rules.js';
import { SHOP_ITEMS, BREAKABLE_SLOTS } from '../config.js';

export { ROOM_W, ROOM_H } from './layout.js';

// The two places a cat can be: which spots it walks between, the door it uses, and where cats start.
const PLACES = {
  room: { spots: SPOTS, door: 'door', start: START_SPOTS },
  garden: { spots: GARDEN_SPOTS, door: 'gate', start: ['lawn', 'middle', 'sunny', 'shade', 'front'] },
};
const whereOf = (cat) => (cat.outside ? 'garden' : 'room');

const walkers = new Map(); // cat id -> { where, walker, leaving }
const goingTo = new Map(); // cat id -> where the rules last said it should be
const nextIdleAt = new Map(); // cat id -> time of its next little animation
let boxes = []; // [{ id, box }] from the last live frame, front-most last
const catEvents = []; // things a cat did that it may want to talk about: [{ id, event }]
const leaping = new Set(); // ids of cats in the middle of a leap in the garden
let lastFrame = null;
const bugs = new Set(); // ids of cats pouncing on a little bug (not a toy)

const SCRATCH_MS = 2500;
const ITCH_MS = 1500;
// Where a cat waits before pouncing on a toy, facing it.
const TOY_POUNCE = {
  toy_yarn: { x: 98, g: 112, face: -1 },
  toy_mouse: { x: 142, g: 115, face: -1 },
};

// Animations belong to one cat, so their names carry the cat id.
const fx = (name, id) => `${name}:${id}`;
export function playCatEffect(name, id, ms, now = performance.now()) {
  playEffect(fx(name, id), ms, now);
}
export { playEffect };

// The present under a tap (its index in state.presents), or null. Generous, since presents are tiny.
export function presentAt(state, x, y) {
  const index = (state.presents ?? []).findIndex((p) => {
    const spot = PRESENT_SPOTS[p.spot];
    return x >= spot.x - 4 && x <= spot.x + 11 && y >= spot.y - 5 && y <= spot.y + 9;
  });
  return index === -1 ? null : index;
}

// Presents on the floor, with a little twinkle so they get noticed.
function drawPresents(ctx, state, now) {
  for (const [i, p] of (state.presents ?? []).entries()) {
    const spot = PRESENT_SPOTS[p.spot];
    drawSprite(ctx, `present_${p.look}`, spot.x, spot.y);
    if ((Math.floor(now / 700) + i) % 3 === 0) drawSprite(ctx, 'sparkle', spot.x + 5, spot.y - 4);
  }
}

// The top middle of each cat on screen in the last live frame, for speech bubbles: id -> { x, y }.
export function catHeads() {
  return new Map(boxes.map(({ id, box }) => [id, { x: box.headX + box.hw / 2, y: box.y }]));
}

// Things cats did since the last call, e.g. [{ id: 1, event: 'butterfly' }].
export function takeCatEvents() {
  return catEvents.splice(0);
}

// The cat under a tap, front-most first, or null.
export function catAt(x, y) {
  for (let i = boxes.length - 1; i >= 0; i--) {
    const { id, box: b } = boxes[i];
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return id;
  }
  return null;
}

// Where each cat curls up at night: the bed first, then other cozy places the room has (and that aren't broken).
function sleepSpots(state) {
  const usable = usableItems(state);
  return SLEEP_SPOTS.filter((name) => !SPOTS[name].needs || usable.includes(SPOTS[name].needs));
}

function place(id, where, spotName, now) {
  const w = { where, walker: createWalker(spotName, now, PLACES[where].spots), leaving: false };
  walkers.set(id, w);
  return w;
}

export function resetCats(state) {
  walkers.clear();
  const now = performance.now();
  const night = sleepSpots(state);
  state.cats.forEach((cat, i) => {
    const where = whereOf(cat);
    const spot = where === 'room' && state.asleep ? night[i] : PLACES[where].start[i];
    place(cat.id, where, spot, now);
  });
}

// A cat's walker. When the rules move a cat between the room and the garden, it first walks to the door
// in the place it is leaving, then turns up at the door on the other side.
function walkerFor(cat, now) {
  const where = whereOf(cat);
  goingTo.set(cat.id, where);
  const w = walkers.get(cat.id) ?? place(cat.id, where, PLACES[where].start[0], now);
  if (w.where !== where && !w.leaving) {
    w.leaving = true;
    w.walker.goTo(PLACES[w.where].door, () => {
      const goal = goingTo.get(cat.id);
      if (goal === w.where) w.leaving = false; // changed its mind on the way
      else place(cat.id, goal, PLACES[goal].door, performance.now());
    });
  }
  return w;
}

const inRoom = (id) => {
  const w = walkers.get(id);
  return w && w.where === 'room' && !w.leaving;
};

// Fill the bowl; this cat walks over and eats (if it is in the room).
export function feedCat(id) {
  playEffect('bowlFull', 30000);
  if (!inRoom(id)) return;
  walkers.get(id).walker.goTo('bowl', () => {
    stopEffect('bowlFull');
    playCatEffect('eat', id, 1500);
  });
}

// An angry cat walks over to an item and scratches it (or scratches where it is, if there's nothing).
// `itemId` is the item to go for; it doesn't have to work any more. Scratching only looks bad; breaking follows the rules.
export function scratchItem(id, itemId) {
  if (!walkers.has(id)) return;
  const scratch = () => playCatEffect('scratch', id, SCRATCH_MS);
  if (!itemId || !inRoom(id)) return scratch();
  walkers.get(id).walker.goToPoint(`item:${itemId}`, scratchPoint(itemId), scratch);
}

function scratchSomething(state, cat) {
  const items = SHOP_ITEMS.filter((i) => BREAKABLE_SLOTS.includes(i.slot) && state.owned.includes(i.id)).map((i) => i.id);
  scratchItem(cat.id, items[Math.floor(Math.random() * items.length)] ?? null);
}

// Pounces on a toy in the room when there is one, or else on a little bug on the floor.
function pounce(state, cat, walker, now) {
  const toys = Object.keys(TOY_POUNCE).filter((id) => usableItems(state).includes(id));
  if (toys.length && Math.random() < 0.7) {
    const toy = toys[Math.floor(Math.random() * toys.length)];
    walker.goToPoint(`toy:${toy}`, TOY_POUNCE[toy], () => {
      bugs.delete(cat.id);
      walker.startPounce(performance.now(), TOY_POUNCE[toy].face);
    });
    return;
  }
  const { x } = walker.pose(now);
  const dir = x < 40 ? 1 : x > 120 ? -1 : (Math.random() < 0.5 ? 1 : -1);
  if (walker.startPounce(now, dir)) bugs.add(cat.id);
}

// In the garden: creep up under a butterfly and pounce at it.
function chaseButterfly(cat, walker, now) {
  const from = walker.pose(now).x;
  const b = butterflyToChase(from);
  if (!b) return;
  const dir = b.x >= from ? 1 : -1;
  const x = Math.max(16, Math.min(146, Math.round(b.x - dir * 16)));
  const g = Math.max(88, Math.min(116, Math.round(b.y) + 8));
  walker.goToPoint('butterfly', { x, g, face: dir }, () => walker.startPounce(performance.now(), dir));
}

// After the player taps a butterfly down low, a cat in the garden goes for it right away.
export function chaseButterflies(state) {
  const now = performance.now();
  const outside = state.cats.filter((c) => walkers.get(c.id)?.where === 'garden' && !walkers.get(c.id).leaving);
  const cat = outside.find((c) => c.id === state.selected) ?? outside[0];
  if (cat) chaseButterfly(cat, walkers.get(cat.id).walker, now);
}

function pickIdle(state, cat, w, now) {
  if (now < (nextIdleAt.get(cat.id) ?? 0) || state.asleep) return;
  nextIdleAt.set(cat.id, now + 5000 + Math.random() * 7000);
  const mood = moodOf(state, cat);
  const garden = w.where === 'garden';
  // Butterflies are hard to resist.
  const lively = !['newborn', 'senior'].includes(stageOf(cat, Date.now()));
  if (garden && lively && (mood === 'happy' || mood === 'okay') && butterfliesOut(Date.now()) && Math.random() < 0.5) {
    return chaseButterfly(cat, w.walker, now);
  }
  const stage = stageOf(cat, Date.now());
  const pick = pickBehavior(mood, cat.stats.cleanliness, Math.random, stage);
  if (pick === 'scratch') return garden ? playCatEffect('scratch', cat.id, SCRATCH_MS, now) : scratchSomething(state, cat);
  if (pick === 'pounce') return garden ? chaseButterfly(cat, w.walker, now) : pounce(state, cat, w.walker, now);
  const ms = { look: 1600, hop: 500, yawn: 1200, itch: ITCH_MS }[pick];
  playCatEffect(pick, cat.id, ms, now);
}

// Little actions that keep a cat in place until they finish.
const BUSY = ['eat', 'purr', 'scratch', 'itch'];

// Moves every cat (and the butterflies) along. Call once per animation frame.
export function stepCats(state, now) {
  const dt = lastFrame === null ? 0 : Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  stepButterflies(dt, now);
  const night = sleepSpots(state);
  state.cats.forEach((cat, i) => {
    const w = walkerFor(cat, now);
    const { walker } = w;
    const stage = stageOf(cat, Date.now());
    walker.setAge(stage === 'senior' ? 0.6 : stage === 'newborn' ? 0.5 : 1, stage !== 'newborn');
    if (w.leaving) return walker.update(dt, now);
    if (state.asleep && w.where === 'room') {
      if (walker.target() !== night[i]) walker.goTo(night[i]);
    } else if (BUSY.some((name) => active(fx(name, cat.id), now))) {
      walker.restFor(3000, now);
    } else {
      const neighbours = state.cats.filter((c) => c.id !== cat.id && walkers.get(c.id)?.where === w.where);
      const taken = neighbours.map((c) => walkers.get(c.id).walker.target());
      walker.wander(w.where === 'room' ? usableItems(state) : [], now, taken);
    }
    walker.update(dt, now);
    const pose = walker.pose(now);
    if (pose.mode !== 'crouch' && pose.mode !== 'leap') bugs.delete(cat.id);
    if (pose.mode === 'leap' && w.where === 'garden') {
      const hit = butterflyNear(pose.x + pose.facing * 8, pose.g - 12);
      if (hit >= 0) scare(hit, now);
      if (!leaping.has(cat.id)) catEvents.push({ id: cat.id, event: 'butterfly' });
      leaping.add(cat.id);
    } else leaping.delete(cat.id);
    if (pose.mode === 'sit') pickIdle(state, cat, w, now);
  });
}

function faceFor(state, cat, now) {
  let face = FACES[moodOf(state, cat)];
  if (active(fx('yawn', cat.id), now)) face = { eyes: 'closed', mouth: 'open' };
  if (active(fx('purr', cat.id), now) || active(fx('eat', cat.id), now)) face = { eyes: 'happy', mouth: 'w', blush: true };
  if (active(fx('itch', cat.id), now)) face = { eyes: 'happy', mouth: 'small' };
  // Cats blink at slightly different times.
  const blinking = !state.asleep && (now + cat.id * 1300) % 4000 < 140 && face.eyes === 'open';
  return blinking ? { ...face, eyes: 'closed' } : face;
}

// A tiny bug on the floor that a crouching cat is about to pounce on.
function drawBug(ctx, x, g, now) {
  const hop = Math.floor(now / 200) % 2;
  drawSprite(ctx, 'bug', x - 1, g - 3 - hop);
}

function drawCat(ctx, state, cat, pose, now, clock) {
  const stage = stageOf(cat, clock);
  const size = CAT_SIZES[stage];
  const face = faceFor(state, cat, now);
  const palette = stage === 'senior' ? agedFur(cat.fur) : FURS[cat.fur];

  const scratching = !state.asleep && active(fx('scratch', cat.id), now);
  if (pose.mode !== 'sit' || scratching) {
    if (pose.mode === 'crouch' && bugs.has(cat.id)) drawBug(ctx, pose.x + pose.facing * 18, pose.g, now);
    return drawSideCat(ctx, {
      size, x: pose.x, ground: pose.g, facing: pose.facing, frame: pose.walkFrame,
      jumping: pose.mode === 'jump' || pose.mode === 'leap', crouch: pose.mode === 'crouch',
      scratch: scratching ? Math.floor(now / 150) % 2 : null,
      face, equipped: cat.equipped, now, palette,
    });
  }

  const lying = state.asleep || stage === 'newborn';
  let lift = 0;
  if (active(fx('hop', cat.id), now)) lift = Math.round(Math.sin(remaining(fx('hop', cat.id), now, 500) * Math.PI) * 4);
  if (active(fx('purr', cat.id), now)) lift = Math.floor(now / 100) % 2;
  return drawFrontCat(ctx, {
    size, cx: pose.x, ground: pose.g - lift, face, lying,
    look: active(fx('look', cat.id), now) ? (Math.floor(now / 800) % 2 ? 1 : -1) : 0,
    itch: !lying && active(fx('itch', cat.id), now) ? Math.floor(now / 120) % 2 : null,
    bob: lying ? Math.floor(now / 1200) % 2 : Math.floor(now / 700) % 2,
    now, equipped: cat.equipped, palette,
  });
}

// The cats in `view` and where they are. Live scenes use the walking cats; previews sit every cat
// at its start spot in the room.
function catsIn(state, live, now, view) {
  return state.cats.flatMap((cat, i) => {
    const w = live ? walkers.get(cat.id) : null;
    if (w) return w.where === view ? [{ cat, pose: w.walker.pose(now) }] : [];
    if (view !== 'room') return [];
    const spot = SPOTS[START_SPOTS[i]];
    return [{ cat, pose: { x: spot.x, g: spot.g, facing: 1, mode: 'sit', spot: START_SPOTS[i], walkFrame: 0 } }];
  });
}

// Hearts, anger marks and the arrow over the selected cat.
function drawCatMarks(ctx, state, drawn, now, marker) {
  for (const { id, box } of drawn) {
    const cat = state.cats.find((c) => c.id === id);
    if (!state.asleep && moodOf(state, cat) === 'angry') {
      drawSprite(ctx, 'anger', box.headX + box.hw - 2, box.headY - 4 - (Math.floor(now / 300) % 2));
    }
    if (active(fx('purr', id), now)) {
      const rise = Math.floor((now % 900) / 90);
      drawSprite(ctx, 'heart', box.headX + box.hw, box.headY - rise);
      drawSprite(ctx, 'heart', box.headX - 5, box.headY + 3 - rise);
    }
    // A small arrow marks which cat the buttons are for, when there is more than one.
    if (marker && id === state.selected && state.cats.length > 1 && !state.asleep) {
      drawSprite(ctx, 'arrow', box.headX + Math.floor(box.hw / 2) - 2, box.y - 6 - (Math.floor(now / 400) % 2));
    }
  }
}

// Draws the whole scene. `now` drives animation; `clock` is real time for age, sky and the wall clock.
// `live` uses the walking cats (the main room, snapshots); otherwise cats sit still (previews).
// `marker` shows the arrow over the selected cat (on by default in the live room).
// `view` is 'room' or 'garden'.
export function drawScene(ctx, state, now, clock = Date.now(), { live = false, marker = live, view = 'room' } = {}) {
  ctx.imageSmoothingEnabled = false;
  if (view === 'garden') drawGarden(ctx, state, now, clock);
  else {
    drawRoom(ctx, state, now, clock);
    if (!state.asleep) drawPresents(ctx, state, now);
  }

  const order = catsIn(state, live, now, view).sort((a, b) => a.pose.g - b.pose.g);
  const drawn = order.map(({ cat, pose }) => ({ id: cat.id, box: drawCat(ctx, state, cat, pose, now, clock) }));
  if (live) boxes = drawn;

  if (view === 'garden') {
    if (butterfliesOut(clock)) drawButterflies(ctx, now);
    drawGardenWeather(ctx, state, now, clock);
  } else if (state.asleep) {
    drawDarkness(ctx, state, now, clock);
    const step = Math.floor(now / 700) % 3;
    for (const { box } of drawn) drawSprite(ctx, 'zzz', box.headX + box.hw + 1 + step, box.headY - 2 - step * 3);
  }
  drawCatMarks(ctx, state, drawn, now, marker);
  return moodOf(state);
}
