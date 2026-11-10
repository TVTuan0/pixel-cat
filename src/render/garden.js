// The garden outside: sky, fence, grass, a tree, flowers, and butterflies for the cats to chase.
import { drawSprite } from './sprites.js';
import { rect, blob, disc } from './draw.js';
import { ROOM_W, ROOM_H } from './layout.js';
import { weatherOf } from '../rules.js';
import { GARDEN_DAY } from '../config.js';

const GRASS_Y = 78;
const isDay = (hour) => hour >= GARDEN_DAY.from && hour < GARDEN_DAY.to;

function skyColor(hour) {
  if (!isDay(hour)) return '#1f2a55';
  if (hour < 8) return '#ffd6a5'; // morning
  if (hour >= 17) return '#ffb38a'; // evening
  return '#8fd3ff';
}

function drawSky(ctx, time, now) {
  const hour = time.getHours();
  const weather = weatherOf(time.getTime());
  rect(ctx, 0, 0, ROOM_W, GRASS_Y, skyColor(hour));
  if (!isDay(hour)) {
    drawSprite(ctx, 'moon', 118, 8);
    for (const [x, y] of [[30, 10], [70, 22], [96, 6], [148, 30], [52, 36]]) rect(ctx, x, y, 1, 1, '#ffffff');
  } else if (weather === 'clear') {
    disc(ctx, 124, 14, 6, '#ffe066', '#ffb703');
  }
  const cloud = weather === 'clear' ? '#ffffff' : '#9aa3b5';
  for (const [offset, y, w] of [[0, 10, 26], [90, 24, 20], [150, 6, 18]]) {
    const x = ((now / 400 + offset) % 200) - 30;
    blob(ctx, Math.round(x), y, w, 8, cloud, cloud);
  }
  // Hills far away.
  blob(ctx, -20, 42, 110, 30, '#8bd17c', '#79c06a');
  blob(ctx, 60, 46, 130, 26, '#9bdc8a', '#79c06a');
}

function drawFence(ctx) {
  for (let x = 22; x < ROOM_W; x += 8) {
    rect(ctx, x, 50, 6, 28, '#e8d2b0');
    rect(ctx, x + 1, 48, 4, 2, '#e8d2b0');
    rect(ctx, x + 2, 47, 2, 1, '#e8d2b0');
    rect(ctx, x, 50, 1, 28, '#c9a27e');
  }
  rect(ctx, 22, 56, ROOM_W, 3, '#c9a27e');
  rect(ctx, 22, 68, ROOM_W, 3, '#c9a27e');
}

// The back of the house on the left, with its door open to the garden.
function drawHouse(ctx) {
  rect(ctx, 0, 0, 24, 92, '#d9a77e');
  for (let y = 4; y < 92; y += 6) {
    rect(ctx, 0, y, 24, 1, '#c18c63');
    for (let x = (y / 6) % 2 ? 2 : 8; x < 24; x += 12) rect(ctx, x, y - 5, 1, 5, '#c18c63');
  }
  rect(ctx, 4, 58, 16, 34, '#8a5a2a');
  rect(ctx, 6, 60, 12, 32, '#3a2a1e');
  rect(ctx, 6, 60, 12, 4, '#5a4030'); // a glimpse of the room inside
}

function drawGrass(ctx) {
  rect(ctx, 0, GRASS_Y, ROOM_W, ROOM_H - GRASS_Y, '#7ccf5a');
  for (let y = GRASS_Y + 3; y < ROOM_H; y += 5) {
    for (let x = (y * 7) % 9; x < ROOM_W; x += 9) rect(ctx, x, y, 1, 2, '#5aa83e');
  }
  rect(ctx, 0, GRASS_Y, ROOM_W, 1, '#5aa83e');
}

function drawTree(ctx) {
  ctx.fillStyle = 'rgba(20, 60, 20, 0.18)';
  ctx.fillRect(110, 100, 44, 7); // shade on the grass
  rect(ctx, 130, 36, 8, 66, '#8a5a2a');
  rect(ctx, 131, 36, 2, 66, '#a8743c');
  rect(ctx, 127, 98, 14, 4, '#8a5a2a');
  blob(ctx, 108, 14, 48, 30, '#4caf50', '#2e7d32');
  blob(ctx, 116, 0, 42, 24, '#5cc96b', '#2e7d32');
  blob(ctx, 102, 26, 36, 20, '#4caf50', '#2e7d32');
  for (const [x, y] of [[118, 10], [134, 22], [146, 12], [112, 34]]) rect(ctx, x, y, 2, 2, '#ff5a6e'); // little fruit
}

const FLOWERS = [
  [28, 84, '#ff5a6e'], [34, 86, '#ffd84a'], [40, 83, '#ffffff'], [62, 84, '#9b7bff'], [70, 86, '#ff8fa3'],
  [92, 83, '#ffd84a'], [98, 85, '#ff5a6e'], [8, 108, '#ffffff'], [14, 114, '#ff8fa3'], [44, 118, '#ffd84a'],
];
function drawFlowers(ctx) {
  for (const [x, y, color] of FLOWERS) {
    rect(ctx, x, y + 2, 1, 3, '#3e8a2e');
    rect(ctx, x - 1, y, 3, 2, color);
    rect(ctx, x, y - 1, 1, 1, color);
    rect(ctx, x, y + 1, 1, 1, '#ffb703');
  }
}

function drawWeather(ctx, time, now) {
  const weather = weatherOf(time.getTime());
  if (weather === 'rain') {
    for (let i = 0; i < 40; i++) {
      const x = (i * 37 + Math.floor(now / 20)) % ROOM_W;
      const y = (i * 53 + Math.floor(now / 8)) % ROOM_H;
      rect(ctx, x, y, 1, 3, 'rgba(200, 225, 255, 0.7)');
    }
  } else if (weather === 'snow') {
    for (let i = 0; i < 30; i++) {
      const x = (i * 41 + Math.round(Math.sin(now / 900 + i) * 4)) % ROOM_W;
      const y = (i * 29 + Math.floor(now / 60)) % ROOM_H;
      rect(ctx, x, y, 1, 1, '#ffffff');
    }
  }
}

// Everything behind the cats.
export function drawGarden(ctx, state, now, clock) {
  const time = new Date(clock);
  drawSky(ctx, time, now);
  drawFence(ctx);
  drawGrass(ctx);
  drawHouse(ctx);
  drawTree(ctx);
  drawFlowers(ctx);
}

// Rain or snow and the dark of night, over the cats.
export function drawGardenWeather(ctx, state, now, clock) {
  const time = new Date(clock);
  drawWeather(ctx, time, now);
  if (!isDay(time.getHours()) || state.asleep) {
    ctx.fillStyle = 'rgba(12, 14, 40, 0.5)';
    ctx.fillRect(0, 0, ROOM_W, ROOM_H);
  }
}

// ---- Butterflies ----

const BUTTERFLY_COLORS = ['#ffb3c6', '#ffd84a', '#9fd8ff'];
const SPEED = { drift: 14, swoop: 26, flee: 45 };
const SWOOP_MS = 5000; // how long a tapped butterfly stays low
const butterflies = BUTTERFLY_COLORS.slice(0, 2).map((color, i) => ({
  color, x: 40 + i * 60, y: 30 + i * 15, tx: 80, ty: 40, mode: 'drift', until: 0,
}));

// Butterflies are out in the daytime when it's dry.
export const butterfliesOut = (clock) => isDay(new Date(clock).getHours()) && weatherOf(clock) === 'clear';

function newTarget(b) {
  if (b.mode === 'swoop') {
    b.tx = Math.max(20, Math.min(150, b.x + (Math.random() - 0.5) * 30));
    b.ty = 96 + Math.random() * 14;
  } else {
    b.tx = 20 + Math.random() * 130;
    b.ty = (b.mode === 'flee' ? 8 : 20) + Math.random() * 50;
  }
}

export function stepButterflies(dt, now) {
  for (const b of butterflies) {
    if (b.mode !== 'drift' && now > b.until) b.mode = 'drift';
    const dx = b.tx - b.x;
    const dy = b.ty - b.y;
    const dist = Math.hypot(dx, dy);
    const step = SPEED[b.mode] * dt;
    if (dist <= step) newTarget(b);
    else {
      b.x += (dx / dist) * step;
      b.y += (dy / dist) * step + Math.sin(now / 120 + b.x) * 0.3; // fluttering
    }
  }
}

export function drawButterflies(ctx, now) {
  for (const [i, b] of butterflies.entries()) {
    const x = Math.round(b.x);
    const y = Math.round(b.y);
    const open = Math.floor(now / 140 + i) % 2 === 0;
    rect(ctx, x, y, 1, 3, '#2a1d3a');
    if (open) {
      rect(ctx, x - 2, y - 1, 2, 2, b.color);
      rect(ctx, x + 1, y - 1, 2, 2, b.color);
      rect(ctx, x - 1, y + 1, 1, 1, b.color);
      rect(ctx, x + 1, y + 1, 1, 1, b.color);
    } else {
      rect(ctx, x - 1, y - 1, 1, 2, b.color);
      rect(ctx, x + 1, y - 1, 1, 2, b.color);
    }
  }
}

// The butterfly under a tap (generous, they are tiny), or -1.
export function butterflyAt(x, y) {
  return butterflies.findIndex((b) => Math.abs(b.x - x) <= 7 && Math.abs(b.y - y) <= 7);
}

// A tapped butterfly flutters down low, where the cats can get it.
export function swoop(i, now) {
  const b = butterflies[i];
  b.mode = 'swoop';
  b.until = now + SWOOP_MS;
  newTarget(b);
}

// A cat pounced near it: the butterfly flies up and away (it is never caught for good).
export function scare(i, now) {
  const b = butterflies[i];
  b.mode = 'flee';
  b.until = now + 2500;
  newTarget(b);
}

// The butterfly a cat should go after: a low one first, else the nearest. { i, x, y } or null.
export function butterflyToChase(x) {
  if (!butterflies.length) return null;
  const low = butterflies.findIndex((b) => b.mode === 'swoop');
  const i = low >= 0 ? low : butterflies.reduce((best, b, k) => (Math.abs(b.x - x) < Math.abs(butterflies[best].x - x) ? k : best), 0);
  const b = butterflies[i];
  // A swooping butterfly is heading down low: go for where it is heading.
  return b.mode === 'swoop' ? { i, x: b.tx, y: b.ty } : { i, x: b.x, y: b.y };
}

// The butterfly within reach of a leaping cat's head, or -1.
export function butterflyNear(x, y) {
  return butterflies.findIndex((b) => Math.abs(b.x - x) <= 10 && Math.abs(b.y - y) <= 12);
}
