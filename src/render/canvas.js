// Draws the room and the cat. Everything is in "room pixels" on a 96x80 canvas.
import { CAT_COLORS as C, CAT_SIZES, drawSprite } from './sprites.js';
import { moodOf, stageOf } from '../rules.js';

export const ROOM_W = 96;
export const ROOM_H = 80;
const FLOOR_Y = 52;
const CAT_X = 48;
const CAT_GROUND = 72;

// Short-lived animations, keyed by name -> end time.
const effects = {};
let lastCatBox = null;
let lastZzz = null;
let nextIdleAt = 0;

export function playEffect(name, ms, now = performance.now()) {
  effects[name] = now + ms;
}

function active(name, now) {
  return (effects[name] ?? 0) > now;
}

export function isOnCat(x, y) {
  const b = lastCatBox;
  return !!b && x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Outlined box with rounded (cut) corners.
function blob(ctx, x, y, w, h, fill) {
  rect(ctx, x + 2, y, w - 4, h, C.outline);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, C.outline);
  rect(ctx, x, y + 2, w, h - 4, C.outline);
  rect(ctx, x + 2, y + 1, w - 4, h - 2, fill);
  rect(ctx, x + 1, y + 2, w - 2, h - 4, fill);
}

function skyColors(hour) {
  if (hour >= 7 && hour < 17) return { sky: '#8fd3ff', night: false };
  if (hour >= 17 && hour < 19) return { sky: '#ffb38a', night: false };
  if (hour >= 5 && hour < 7) return { sky: '#ffd3a0', night: false };
  return { sky: '#2b3a67', night: true };
}

function drawWindow(ctx, clock) {
  const x = 8, y = 8, w = 24, h = 20;
  const { sky, night } = skyColors(clock.getHours());
  rect(ctx, x, y, w, h, '#8a5a2a');
  rect(ctx, x + 2, y + 2, w - 4, h - 4, sky);
  if (night) {
    drawSprite(ctx, 'moon', x + 13, y + 4);
    rect(ctx, x + 5, y + 5, 1, 1, '#fff');
    rect(ctx, x + 9, y + 11, 1, 1, '#fff');
    rect(ctx, x + 5, y + 14, 1, 1, '#fff');
  } else {
    const drift = Math.floor(clock.getMinutes() / 6) % 8;
    rect(ctx, x + 4 + drift, y + 6, 6, 2, '#ffffff');
    rect(ctx, x + 5 + drift, y + 5, 3, 1, '#ffffff');
  }
  rect(ctx, x + w / 2 - 1, y + 2, 2, h - 4, '#8a5a2a');
  rect(ctx, x + 2, y + h / 2 - 1, w - 4, 2, '#8a5a2a');
  rect(ctx, x - 2, y + h, w + 4, 2, '#6b4420');
}

function drawRoom(ctx, state, now, clock) {
  rect(ctx, 0, 0, ROOM_W, FLOOR_Y, '#f6e7d0');
  for (let y = 4; y < FLOOR_Y - 2; y += 8) {
    for (let x = (y / 8) % 2 ? 4 : 0; x < ROOM_W; x += 8) rect(ctx, x, y, 1, 1, '#e8d2b0');
  }
  rect(ctx, 0, FLOOR_Y - 2, ROOM_W, 2, '#c9a27e');
  rect(ctx, 0, FLOOR_Y, ROOM_W, ROOM_H - FLOOR_Y, '#b9805a');
  for (let y = FLOOR_Y + 5, i = 0; y < ROOM_H; y += 6, i++) {
    rect(ctx, 0, y, ROOM_W, 1, '#a46e4a');
    for (let x = (i % 2) * 12 + 6; x < ROOM_W; x += 24) rect(ctx, x, y - 5, 1, 5, '#a46e4a');
  }

  drawWindow(ctx, new Date(clock));

  const owned = new Set(state.owned);
  if (owned.has('decor_frame')) {
    rect(ctx, 64, 10, 18, 14, '#8a5a2a');
    rect(ctx, 66, 12, 14, 10, '#bfe6ff');
    drawSprite(ctx, 'fish', 69, 14);
  }
  if (owned.has('decor_plant')) drawSprite(ctx, 'decor_plant', 1, FLOOR_Y - 9);
  if (owned.has('decor_rug')) {
    rect(ctx, CAT_X - 18, CAT_GROUND - 2, 36, 1, '#c8553d');
    rect(ctx, CAT_X - 21, CAT_GROUND - 1, 42, 4, '#c8553d');
    rect(ctx, CAT_X - 18, CAT_GROUND + 3, 36, 1, '#c8553d');
    rect(ctx, CAT_X - 17, CAT_GROUND + 1, 34, 1, '#f2c14e');
  }

  // Food bowl, with food on top while eating.
  drawSprite(ctx, 'bowl', 10, 68);
  if (active('eat', now)) {
    const left = Math.ceil(((effects.eat - now) / 1500) * 3);
    for (let i = 0; i < left; i++) rect(ctx, 12 + i * 2, 66 + (i % 2), 2, 2, '#b06a3b');
  }

  // Litter box: specks build up as cleanliness drops.
  drawSprite(ctx, 'litter', 76, 62);
  const specks = Math.ceil((100 - state.stats.cleanliness) / 15);
  const spots = [[79, 63], [84, 63], [88, 63], [81, 62], [86, 62], [78, 62], [89, 62]];
  for (let i = 0; i < specks && i < spots.length; i++) rect(ctx, spots[i][0], spots[i][1], 2, 1, '#8a6a4a');
  if (state.stats.cleanliness < 40) {
    const wave = Math.floor(now / 300) % 2;
    for (const sx of [80, 85, 90]) {
      rect(ctx, sx + wave, 56, 1, 2, '#7fae5a');
      rect(ctx, sx + 1 - wave, 58, 1, 2, '#7fae5a');
    }
  }
  if (active('sparkle', now)) {
    const f = Math.floor(now / 120) % 2;
    drawSprite(ctx, 'sparkle', 78 + f * 6, 57 - f);
    drawSprite(ctx, 'sparkle', 86 - f * 4, 59 + f);
  }

  if (owned.has('toy_yarn')) drawSprite(ctx, 'toy_yarn', 26, 72);
  if (owned.has('toy_mouse')) drawSprite(ctx, 'toy_mouse', 64, 74, Math.floor(now / 2000) % 2 === 0);
}

function drawTail(ctx, baseX, baseY, now, asleep) {
  const sway = asleep ? 0 : [0, 1, 1, 0, -1, -1][Math.floor(now / 250) % 6];
  const points = asleep
    ? [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, -1]]
    : [[1, 0], [2, 0], [3, -1], [3, -2], [4 + sway, -3], [4 + sway, -4], [4 + sway, -5], [3 + sway, -6]];
  for (const [dx, dy] of points) rect(ctx, baseX + dx - 1, baseY + dy - 1, 3, 3, C.outline);
  points.forEach(([dx, dy], i) => rect(ctx, baseX + dx, baseY + dy, 1, 1, i === points.length - 1 ? C.stripe : C.fur));
}

function drawEars(ctx, headX, headY, hw, ear) {
  for (let i = 0; i < ear; i++) {
    const w = i + 2;
    const y = headY - ear + 1 + i;
    for (const x of [headX + 1, headX + hw - 1 - w]) {
      rect(ctx, x, y, w, 1, C.outline);
      if (i > 0) rect(ctx, x + 1, y, w - 2, 1, C.fur);
      if (i > 1) rect(ctx, x + 2 - (x > headX + 1 ? 1 : 0), y, Math.max(0, w - 4), 1, C.pink);
    }
  }
}

function drawEyes(ctx, cx, ey, gap, kind, look) {
  for (const ex of [cx - gap - 1 + look, cx + gap + look]) {
    if (kind === 'open') {
      rect(ctx, ex, ey, 2, 2, C.eye);
      rect(ctx, ex, ey, 1, 1, C.white);
    } else if (kind === 'happy') {
      rect(ctx, ex, ey, 2, 1, C.eye);
      rect(ctx, ex - 1, ey + 1, 1, 1, C.eye);
      rect(ctx, ex + 2, ey + 1, 1, 1, C.eye);
    } else if (kind === 'sleepy') {
      rect(ctx, ex, ey, 2, 1, C.stripe);
      rect(ctx, ex, ey + 1, 2, 1, C.eye);
    } else if (kind === 'grumpy') {
      rect(ctx, ex, ey + 1, 2, 1, C.eye);
    } else {
      rect(ctx, ex, ey + 1, 2, 1, C.eye); // closed
    }
  }
  if (kind === 'grumpy') {
    const l = cx - gap - 1, r = cx + gap;
    rect(ctx, l - 1, ey - 2, 1, 1, C.outline);
    rect(ctx, l, ey - 1, 2, 1, C.outline);
    rect(ctx, r + 2, ey - 2, 1, 1, C.outline);
    rect(ctx, r, ey - 1, 2, 1, C.outline);
  }
}

function drawMouth(ctx, cx, y, kind) {
  if (kind === 'w') {
    rect(ctx, cx - 2, y, 1, 1, C.outline);
    rect(ctx, cx - 1, y + 1, 1, 1, C.outline);
    rect(ctx, cx, y, 1, 1, C.outline);
    rect(ctx, cx + 1, y + 1, 1, 1, C.outline);
    rect(ctx, cx + 2, y, 1, 1, C.outline);
  } else if (kind === 'open') {
    rect(ctx, cx - 1, y, 3, 2, C.outline);
    rect(ctx, cx, y + 1, 1, 1, C.pink);
  } else if (kind === 'frown') {
    rect(ctx, cx - 1, y, 3, 1, C.outline);
    rect(ctx, cx - 2, y + 1, 1, 1, C.outline);
    rect(ctx, cx + 2, y + 1, 1, 1, C.outline);
  } else {
    rect(ctx, cx, y, 1, 1, C.outline);
  }
}

const FACES = {
  happy: { eyes: 'happy', mouth: 'w', blush: true },
  okay: { eyes: 'open', mouth: 'w' },
  hungry: { eyes: 'open', mouth: 'open' },
  sleepy: { eyes: 'sleepy', mouth: 'small' },
  dirty: { eyes: 'open', mouth: 'frown' },
  grumpy: { eyes: 'grumpy', mouth: 'frown' },
  sleeping: { eyes: 'closed', mouth: 'small' },
};

function pickIdle(state, mood, now) {
  if (now < nextIdleAt || state.asleep) return;
  nextIdleAt = now + 5000 + Math.random() * 7000;
  if (mood === 'sleepy') return playEffect('yawn', 1200, now);
  const options = mood === 'happy' || mood === 'okay' ? ['hop', 'look', 'yawn'] : ['look'];
  const pick = options[Math.floor(Math.random() * options.length)];
  playEffect(pick, pick === 'look' ? 1600 : pick === 'hop' ? 500 : 1200, now);
}

function drawCat(ctx, state, now, clock) {
  const size = CAT_SIZES[stageOf(state, clock)];
  const mood = moodOf(state);
  const asleep = state.asleep;
  const { hw, hh, ear } = size;
  const bw = asleep ? size.bw + 6 : size.bw;
  const bh = asleep ? size.bh - 3 : size.bh;
  const cx = CAT_X;

  let lift = 0;
  if (active('hop', now)) lift = Math.round(Math.sin(((effects.hop - now) / 500) * Math.PI) * 4);
  if (active('purr', now)) lift = Math.floor(now / 100) % 2;
  const ground = CAT_GROUND - lift;
  const bob = asleep ? Math.floor(now / 1200) % 2 : Math.floor(now / 700) % 2;

  const bodyX = cx - Math.floor(bw / 2);
  const bodyY = ground - bh;
  const headX = cx - Math.floor(hw / 2);
  const headY = asleep ? bodyY - hh + 6 + bob : bodyY - hh + 3 + bob;

  drawTail(ctx, bodyX + bw - 1, ground - 3, now, asleep);
  blob(ctx, bodyX, bodyY, bw, bh, C.fur);
  const belly = Math.floor(bw / 4);
  rect(ctx, cx - belly, bodyY + 2, belly * 2 + 1, Math.max(1, bh - 4), C.furLight);
  if (!asleep) {
    rect(ctx, cx - 4, ground - 3, 3, 2, C.furLight);
    rect(ctx, cx + 2, ground - 3, 3, 2, C.furLight);
    rect(ctx, cx - 2, ground - 3, 1, 2, C.outline);
    rect(ctx, cx + 1, ground - 3, 1, 2, C.outline);
  }

  blob(ctx, headX, headY, hw, hh, C.fur);
  drawEars(ctx, headX, headY, hw, ear);
  rect(ctx, cx - 2, headY + 1, 1, 2, C.stripe);
  rect(ctx, cx, headY + 1, 1, 3, C.stripe);
  rect(ctx, cx + 2, headY + 1, 1, 2, C.stripe);

  const ey = headY + Math.round(hh * 0.42);
  const gap = Math.round(hw * 0.18) + 1;
  rect(ctx, cx - 3, ey + 2, 7, Math.min(3, headY + hh - ey - 3), C.furLight);
  rect(ctx, cx - 1, ey + 2, 3, 1, C.pink);
  rect(ctx, headX - 2, ey + 3, 3, 1, C.outline);
  rect(ctx, headX + hw - 1, ey + 3, 3, 1, C.outline);

  let face = FACES[mood];
  if (active('yawn', now)) face = { eyes: 'closed', mouth: 'open' };
  if (active('purr', now) || active('eat', now)) face = { eyes: 'happy', mouth: 'w', blush: true };
  const blinking = !asleep && now % 4000 < 140;
  const look = active('look', now) ? (Math.floor(now / 800) % 2 ? 1 : -1) : 0;
  drawEyes(ctx, cx, ey, gap, blinking && face.eyes === 'open' ? 'closed' : face.eyes, face.eyes === 'open' ? look : 0);
  drawMouth(ctx, cx, ey + 3, face.mouth);
  if (face.blush) {
    rect(ctx, cx - gap - 3, ey + 2, 2, 1, C.blush);
    rect(ctx, cx + gap + 2, ey + 2, 2, 1, C.blush);
  }

  // Accessories
  const collar = state.equipped.collar;
  if (collar) {
    const color = collar === 'collar_blue' ? '#3a7bff' : collar === 'collar_gold' ? '#8b4513' : '#e8384f';
    rect(ctx, cx - 4, headY + hh - 1, 9, 2, color);
    if (collar === 'collar_gold') rect(ctx, cx - 1, headY + hh, 3, 2, '#ffcf3a');
  }
  const hat = state.equipped.hat;
  if (hat === 'hat_bow') drawSprite(ctx, 'hat_bow', headX + hw - 8, headY - 3);
  if (hat === 'hat_party') drawSprite(ctx, 'hat_party', cx - 3, headY - 6);
  if (hat === 'hat_crown') drawSprite(ctx, 'hat_crown', cx - 4, headY - 4);

  // Floating extras
  const step = Math.floor(now / 700) % 3;
  lastZzz = asleep ? { x: headX + hw + 1 + step, y: headY - 2 - step * 3 } : null;
  if (active('purr', now)) {
    const rise = Math.floor((now % 900) / 90);
    drawSprite(ctx, 'heart', headX + hw, headY - rise);
    drawSprite(ctx, 'heart', headX - 5, headY + 3 - rise);
  }

  lastCatBox = { x: Math.min(headX, bodyX) - 1, y: headY - ear, w: Math.max(hw, bw) + 2, h: ground - headY + ear };
  return mood;
}

// Draws the whole scene. `now` drives animation; `clock` is real time for age and sky.
export function drawScene(ctx, state, now, clock = Date.now()) {
  ctx.imageSmoothingEnabled = false;
  drawRoom(ctx, state, now, clock);
  const mood = drawCat(ctx, state, now, clock);
  if (state.asleep) {
    ctx.fillStyle = 'rgba(12, 14, 40, 0.55)';
    ctx.fillRect(0, 0, ROOM_W, ROOM_H);
    drawWindow(ctx, new Date(clock));
    if (lastZzz) drawSprite(ctx, 'zzz', lastZzz.x, lastZzz.y);
  }
  return mood;
}

export function tickIdle(state, now) {
  pickIdle(state, moodOf(state), now);
}
