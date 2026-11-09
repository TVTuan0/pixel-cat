// Draws the whole scene and drives what the cat is doing on screen.
import { CAT_SIZES, FURS, drawSprite } from './sprites.js';
import { drawRoom, drawDarkness } from './room.js';
import { drawFrontCat, drawSideCat, FACES } from './cat.js';
import { catPose, updateCat, maybeWander, goTo, placeCat, targetSpot, restFor } from './walker.js';
import { active, playEffect, stopEffect, remaining } from './effects.js';
import { moodOf, stageOf } from '../rules.js';

export { ROOM_W, ROOM_H } from './layout.js';
export { playEffect };

let lastCatBox = null;
let nextIdleAt = 0;
let lastFrame = null;

export function isOnCat(x, y) {
  const b = lastCatBox;
  return !!b && x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
}

export function resetCat(state) {
  placeCat(state.asleep ? 'bed' : 'center', performance.now());
}

// Fill the bowl; the cat walks over and eats.
export function feedCat() {
  playEffect('bowlFull', 30000);
  goTo('bowl', () => {
    stopEffect('bowlFull');
    playEffect('eat', 1500);
  });
}

function pickIdle(state, now) {
  if (now < nextIdleAt || state.asleep) return;
  nextIdleAt = now + 5000 + Math.random() * 7000;
  const mood = moodOf(state);
  if (mood === 'sleepy') return playEffect('yawn', 1200, now);
  const options = mood === 'happy' || mood === 'okay' ? ['hop', 'look', 'yawn'] : ['look'];
  const pick = options[Math.floor(Math.random() * options.length)];
  playEffect(pick, pick === 'look' ? 1600 : pick === 'hop' ? 500 : 1200, now);
}

// Moves the cat along. Call once per animation frame.
export function stepCat(state, now) {
  const dt = lastFrame === null ? 0 : Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  if (state.asleep) {
    if (targetSpot() !== 'bed') goTo('bed');
  } else if (active('eat', now) || active('purr', now)) {
    restFor(3000, now);
  } else {
    maybeWander(state.owned, now);
  }
  updateCat(dt, now);
  if (catPose().mode === 'sit') pickIdle(state, now);
}

function faceFor(state, now) {
  let face = FACES[moodOf(state)];
  if (active('yawn', now)) face = { eyes: 'closed', mouth: 'open' };
  if (active('purr', now) || active('eat', now)) face = { eyes: 'happy', mouth: 'w', blush: true };
  const blinking = !state.asleep && now % 4000 < 140 && face.eyes === 'open';
  return blinking ? { ...face, eyes: 'closed' } : face;
}

function drawCat(ctx, state, now, clock) {
  const size = CAT_SIZES[stageOf(state, clock)];
  const pose = catPose();
  const face = faceFor(state, now);

  if (pose.mode !== 'sit') {
    return drawSideCat(ctx, {
      size, x: pose.x, ground: pose.g, facing: pose.facing, frame: pose.walkFrame,
      jumping: pose.mode === 'jump', face, equipped: state.equipped, now, palette: FURS[state.fur],
    });
  }

  const lying = state.asleep && pose.spot === 'bed';
  let lift = 0;
  if (active('hop', now)) lift = Math.round(Math.sin(remaining('hop', now, 500) * Math.PI) * 4);
  if (active('purr', now)) lift = Math.floor(now / 100) % 2;
  return drawFrontCat(ctx, {
    size, cx: pose.x, ground: pose.g - lift, face, lying,
    look: active('look', now) ? (Math.floor(now / 800) % 2 ? 1 : -1) : 0,
    bob: lying ? Math.floor(now / 1200) % 2 : Math.floor(now / 700) % 2,
    now, equipped: state.equipped, palette: FURS[state.fur],
  });
}

// Draws the whole scene. `now` drives animation; `clock` is real time for age, sky and the wall clock.
export function drawScene(ctx, state, now, clock = Date.now()) {
  ctx.imageSmoothingEnabled = false;
  drawRoom(ctx, state, now, clock);
  const box = drawCat(ctx, state, now, clock);
  lastCatBox = box;

  if (state.asleep) {
    drawDarkness(ctx, state, now, clock);
    const step = Math.floor(now / 700) % 3;
    drawSprite(ctx, 'zzz', box.headX + box.hw + 1 + step, box.headY - 2 - step * 3);
  }
  if (active('purr', now)) {
    const rise = Math.floor((now % 900) / 90);
    drawSprite(ctx, 'heart', box.headX + box.hw, box.headY - rise);
    drawSprite(ctx, 'heart', box.headX - 5, box.headY + 3 - rise);
  }
  return moodOf(state);
}
