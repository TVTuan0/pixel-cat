// Draws the whole scene and drives what each cat is doing on screen.
import { CAT_SIZES, FURS, drawSprite } from './sprites.js';
import { drawRoom, drawDarkness } from './room.js';
import { drawFrontCat, drawSideCat, FACES } from './cat.js';
import { createWalker } from './walker.js';
import { SPOTS, START_SPOTS, SLEEP_SPOTS } from './layout.js';
import { active, playEffect, stopEffect, remaining } from './effects.js';
import { moodOf, stageOf, usableItems } from '../rules.js';

export { ROOM_W, ROOM_H } from './layout.js';

const walkers = new Map(); // cat id -> walker
const nextIdleAt = new Map(); // cat id -> time of its next little animation
let boxes = []; // [{ id, box }] from the last live frame, front-most last
let lastFrame = null;

// Animations belong to one cat, so their names carry the cat id.
const fx = (name, id) => `${name}:${id}`;
export function playCatEffect(name, id, ms, now = performance.now()) {
  playEffect(fx(name, id), ms, now);
}
export { playEffect };

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

export function resetCats(state) {
  walkers.clear();
  const now = performance.now();
  const night = sleepSpots(state);
  state.cats.forEach((cat, i) => walkers.set(cat.id, createWalker(state.asleep ? night[i] : START_SPOTS[i], now)));
}

function walkerFor(cat, now) {
  if (!walkers.has(cat.id)) walkers.set(cat.id, createWalker('center', now));
  return walkers.get(cat.id);
}

// Fill the bowl; this cat walks over and eats.
export function feedCat(id) {
  playEffect('bowlFull', 30000);
  walkers.get(id)?.goTo('bowl', () => {
    stopEffect('bowlFull');
    playCatEffect('eat', id, 1500);
  });
}

function pickIdle(state, cat, now) {
  if (now < (nextIdleAt.get(cat.id) ?? 0) || state.asleep) return;
  nextIdleAt.set(cat.id, now + 5000 + Math.random() * 7000);
  const mood = moodOf(state, cat);
  if (mood === 'sleepy') return playCatEffect('yawn', cat.id, 1200, now);
  const options = mood === 'happy' || mood === 'okay' ? ['hop', 'look', 'yawn'] : ['look'];
  const pick = options[Math.floor(Math.random() * options.length)];
  playCatEffect(pick, cat.id, pick === 'look' ? 1600 : pick === 'hop' ? 500 : 1200, now);
}

// Moves every cat along. Call once per animation frame.
export function stepCats(state, now) {
  const dt = lastFrame === null ? 0 : Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  const night = sleepSpots(state);
  state.cats.forEach((cat, i) => {
    const walker = walkerFor(cat, now);
    if (state.asleep) {
      if (walker.target() !== night[i]) walker.goTo(night[i]);
    } else if (active(fx('eat', cat.id), now) || active(fx('purr', cat.id), now)) {
      walker.restFor(3000, now);
    } else {
      const taken = state.cats.filter((c) => c.id !== cat.id).map((c) => walkerFor(c, now).target());
      walker.wander(usableItems(state), now, taken);
    }
    walker.update(dt, now);
    if (walker.pose().mode === 'sit') pickIdle(state, cat, now);
  });
}

function faceFor(state, cat, now) {
  let face = FACES[moodOf(state, cat)];
  if (active(fx('yawn', cat.id), now)) face = { eyes: 'closed', mouth: 'open' };
  if (active(fx('purr', cat.id), now) || active(fx('eat', cat.id), now)) face = { eyes: 'happy', mouth: 'w', blush: true };
  // Cats blink at slightly different times.
  const blinking = !state.asleep && (now + cat.id * 1300) % 4000 < 140 && face.eyes === 'open';
  return blinking ? { ...face, eyes: 'closed' } : face;
}

function drawCat(ctx, state, cat, pose, now, clock) {
  const size = CAT_SIZES[stageOf(cat, clock)];
  const face = faceFor(state, cat, now);
  const palette = FURS[cat.fur];

  if (pose.mode !== 'sit') {
    return drawSideCat(ctx, {
      size, x: pose.x, ground: pose.g, facing: pose.facing, frame: pose.walkFrame,
      jumping: pose.mode === 'jump', face, equipped: cat.equipped, now, palette,
    });
  }

  const lying = state.asleep;
  let lift = 0;
  if (active(fx('hop', cat.id), now)) lift = Math.round(Math.sin(remaining(fx('hop', cat.id), now, 500) * Math.PI) * 4);
  if (active(fx('purr', cat.id), now)) lift = Math.floor(now / 100) % 2;
  return drawFrontCat(ctx, {
    size, cx: pose.x, ground: pose.g - lift, face, lying,
    look: active(fx('look', cat.id), now) ? (Math.floor(now / 800) % 2 ? 1 : -1) : 0,
    bob: lying ? Math.floor(now / 1200) % 2 : Math.floor(now / 700) % 2,
    now, equipped: cat.equipped, palette,
  });
}

// Where each cat is. Live scenes use the walking cats; previews sit them at their start spots.
function posesFor(state, live) {
  return state.cats.map((cat, i) => {
    if (live && walkers.has(cat.id)) return walkers.get(cat.id).pose();
    const spot = SPOTS[START_SPOTS[i]];
    return { x: spot.x, g: spot.g, facing: 1, mode: 'sit', spot: START_SPOTS[i], walkFrame: 0 };
  });
}

// Draws the whole scene. `now` drives animation; `clock` is real time for age, sky and the wall clock.
// `live` uses the walking cats (the main room, snapshots); otherwise cats sit still (previews).
// `marker` shows the arrow over the selected cat (on by default in the live room).
export function drawScene(ctx, state, now, clock = Date.now(), { live = false, marker = live } = {}) {
  ctx.imageSmoothingEnabled = false;
  drawRoom(ctx, state, now, clock);

  const poses = posesFor(state, live);
  const order = state.cats.map((cat, i) => ({ cat, pose: poses[i] })).sort((a, b) => a.pose.g - b.pose.g);
  const drawn = order.map(({ cat, pose }) => ({ id: cat.id, box: drawCat(ctx, state, cat, pose, now, clock) }));
  if (live) boxes = drawn;

  if (state.asleep) {
    drawDarkness(ctx, state, now, clock);
    const step = Math.floor(now / 700) % 3;
    for (const { box } of drawn) drawSprite(ctx, 'zzz', box.headX + box.hw + 1 + step, box.headY - 2 - step * 3);
  }
  for (const { id, box } of drawn) {
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
  return moodOf(state);
}
