// The garden outside: sky, fence, grass, a tree, flowers, and butterflies for the cats to chase.
import { rect } from './draw.js';
import { F, fineShape, rowsOf } from './fine.js';
import { ROOM_W, ROOM_H } from './layout.js';
import { weatherOf } from '../rules.js';
import { GARDEN_DAY } from '../config.js';

const GRASS_Y = 78;
const isDay = (hour) => hour >= GARDEN_DAY.from && hour < GARDEN_DAY.to;

// Sky colors from the top down, by time of day.
function skyColors(hour) {
  if (!isDay(hour)) return ['#141c40', '#1f2a55', '#2c3a6a'];
  if (hour < 8) return ['#a8d8f8', '#ffd6a5', '#ffc48a']; // morning
  if (hour >= 17) return ['#8fb8e8', '#ffb38a', '#ff9a6a']; // evening
  return ['#6cc0f4', '#8fd3ff', '#bfe6ff'];
}

// Everything below is in fine pixels (half a room unit).
function drawSky(ctx, time, now) {
  const hour = time.getHours();
  const weather = weatherOf(time.getTime());
  const [top, mid, low] = skyColors(hour);
  const grey = weather !== 'clear';
  F(ctx, 0, 0, 320, 52, grey ? (isDay(hour) ? '#9aa8ba' : '#262f4a') : top);
  F(ctx, 0, 52, 320, 52, grey ? (isDay(hour) ? '#aab6c6' : '#2a3452') : mid);
  F(ctx, 0, 104, 320, 52, grey ? (isDay(hour) ? '#b8c2d0' : '#303a58') : low);
  if (!isDay(hour)) {
    fineShape(ctx, 156, 14, 22, 22, '#fff2b0', '#e8d080', { round: 2, inside: () => fineShape(ctx, 164, 10, 20, 20, '#141c40', '#141c40', { round: 2 }) });
    for (const [x, y] of [[60, 20], [140, 44], [192, 12], [296, 60], [104, 72], [24, 52], [272, 24]]) {
      F(ctx, x, y, 1, 1, '#ffffff');
      if ((x + Math.floor(now / 700)) % 3 === 0) F(ctx, x - 1, y, 3, 1, 'rgba(255,255,255,0.5)');
    }
  } else if (!grey) {
    fineShape(ctx, 160, 16, 22, 22, '#ffe066', '#ffb703', { round: 2, inside: () => F(ctx, 164, 20, 6, 4, '#fff6b0') });
  }
  // Puffy clouds drifting by.
  const night = !isDay(hour);
  const cloud = night ? '#323d64' : grey ? '#8a96a8' : '#ffffff';
  const shadeC = night ? '#2a3456' : grey ? '#7a8698' : '#e0eef8';
  for (const [offset, y, w] of [[0, 18, 52], [180, 46, 40], [300, 12, 36]]) {
    const x = Math.round((((now / 200 + offset) % 400) - 60));
    fineShape(ctx, x, y + 6, w, 12, cloud, cloud, { round: 2 });
    fineShape(ctx, x + Math.round(w * 0.2), y, Math.round(w * 0.45), 12, cloud, cloud, { round: 2 });
    fineShape(ctx, x + Math.round(w * 0.5), y + 2, Math.round(w * 0.35), 10, cloud, cloud, { round: 2 });
    F(ctx, x + 4, y + 15, w - 8, 2, shadeC);
  }
  // Hills far away, with a few trees.
  fineShape(ctx, -40, 84, 220, 60, '#8bd17c', '#79c06a', { round: 2 });
  fineShape(ctx, 120, 92, 260, 52, '#9bdc8a', '#79c06a', { round: 2 });
  for (const [x, y] of [[40, 86], [70, 90], [230, 96], [280, 98]]) {
    fineShape(ctx, x, y, 8, 8, '#5aa84a', '#4a9a3e', { round: 2 });
    F(ctx, x + 3, y + 8, 2, 3, '#7a5a3a');
  }
}

function drawFence(ctx) {
  for (let x = 44; x < 320; x += 16) {
    F(ctx, x, 100, 12, 56, '#e8d2b0');
    F(ctx, x + 2, 96, 8, 4, '#e8d2b0');
    F(ctx, x + 4, 94, 4, 2, '#e8d2b0');
    F(ctx, x, 100, 1, 56, '#c9a27e'); // edge in shade
    F(ctx, x + 11, 100, 1, 56, '#f8ecd6'); // edge in light
    F(ctx, x + 4, 106, 1, 40, '#dcc4a0'); // wood grain
    F(ctx, x + 7, 120, 1, 26, '#dcc4a0');
  }
  for (const y of [112, 136]) {
    F(ctx, 44, y, 276, 6, '#c9a27e');
    F(ctx, 44, y, 276, 1, '#dcbc94');
    F(ctx, 44, y + 6, 276, 1, 'rgba(60,40,20,0.25)');
  }
}

// The back of the house on the left, with its door open to the garden.
function drawHouse(ctx) {
  F(ctx, 0, 0, 48, 184, '#d9a77e');
  for (let y = 0, row = 0; y < 184; y += 8, row++) {
    F(ctx, 0, y + 7, 48, 1, '#c18c63');
    for (let x = row % 2 ? 4 : 16; x < 48; x += 24) F(ctx, x, y, 1, 7, '#c18c63');
    for (let x = row % 2 ? 6 : 18; x < 48; x += 24) F(ctx, x, y + 1, 6, 1, '#e4b890'); // light on each brick
  }
  F(ctx, 46, 0, 2, 184, '#b07a52');
  F(ctx, 8, 116, 32, 68, '#8a5a2a');
  F(ctx, 8, 116, 32, 1, '#b5824e');
  F(ctx, 12, 120, 24, 64, '#3a2a1e');
  F(ctx, 12, 120, 24, 8, '#5a4030'); // a glimpse of the room inside
  F(ctx, 4, 182, 40, 4, '#9a9488'); // doorstep
  F(ctx, 4, 182, 40, 1, '#c0bab0');
}

function drawGrass(ctx) {
  F(ctx, 0, 156, 320, 84, '#7ccf5a');
  F(ctx, 0, 156, 320, 2, '#5aa83e');
  for (let y = 160, row = 0; y < 240; y += 6, row++) {
    for (let x = (row * 7) % 11; x < 320; x += 11) {
      F(ctx, x, y, 1, 3, '#5aa83e');
      F(ctx, x + 2, y + 1, 1, 2, '#5aa83e');
      if ((x + row) % 5 === 0) F(ctx, x + 5, y + 2, 1, 2, '#9ce07a');
    }
  }
}

function drawTree(ctx) {
  for (const [l, r, row] of rowsOf(214, 198, 104, 16, 2)) F(ctx, l, row, r - l, 1, 'rgba(20, 60, 20, 0.18)'); // shade on the grass
  F(ctx, 258, 72, 18, 132, '#7a4a22');
  F(ctx, 262, 72, 4, 132, '#a8743c');
  F(ctx, 272, 72, 3, 132, '#5a3a1e');
  for (let y = 84; y < 196; y += 14) F(ctx, 266, y, 4, 1, '#5a3a1e'); // bark
  F(ctx, 250, 196, 34, 8, '#7a4a22');
  F(ctx, 250, 196, 34, 1, '#a8743c');
  const leaf = '#4caf50', leafLight = '#6cd06a', edge = '#2e7d32';
  for (const [x, y, w, h] of [[204, 52, 72, 48], [216, 26, 80, 52], [236, 4, 76, 44], [264, 34, 56, 48]]) {
    fineShape(ctx, x, y, w, h, leaf, edge, {
      round: 2,
      inside: () => {
        F(ctx, x + 6, y + 4, Math.round(w * 0.4), 4, leafLight);
        F(ctx, x, y + h - 8, w, 8, '#3e9a42');
      },
    });
  }
  for (const [x, y] of [[236, 20], [268, 44], [292, 24], [224, 68], [252, 56]]) {
    fineShape(ctx, x, y, 5, 5, '#ff5a6e', '#b02a3a', { round: 2 }); // little fruit
    F(ctx, x + 1, y + 1, 1, 1, '#ffd0d6');
  }
}

const FLOWERS = [
  [28, 84, '#ff5a6e'], [34, 86, '#ffd84a'], [40, 83, '#ffffff'], [62, 84, '#9b7bff'], [70, 86, '#ff8fa3'],
  [92, 83, '#ffd84a'], [98, 85, '#ff5a6e'], [8, 108, '#ffffff'], [14, 114, '#ff8fa3'], [44, 118, '#ffd84a'],
];
function drawFlowers(ctx) {
  for (const [ux, uy, color] of FLOWERS) {
    const x = ux * 2, y = uy * 2;
    F(ctx, x, y + 3, 1, 7, '#3e8a2e');
    F(ctx, x + 1, y + 6, 2, 1, '#5aa83e'); // a leaf
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) F(ctx, x + dx - 1, y + dy - 1, 3, 3, color);
    F(ctx, x - 1, y - 1, 3, 3, '#ffb703');
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
    const x = Math.round(b.x * 2);
    const y = Math.round(b.y * 2);
    const open = Math.floor(now / 140 + i) % 2 === 0;
    F(ctx, x, y - 1, 2, 7, '#2a1d3a'); // body
    F(ctx, x - 1, y - 3, 1, 2, '#2a1d3a'); // antennae
    F(ctx, x + 2, y - 3, 1, 2, '#2a1d3a');
    if (open) {
      for (const side of [-1, 1]) {
        const wx = side < 0 ? x - 6 : x + 2;
        F(ctx, wx, y - 2, 6, 4, b.color);
        F(ctx, wx + 1, y + 2, 4, 3, b.color);
        F(ctx, wx + (side < 0 ? 1 : 3), y - 1, 2, 2, '#ffffff');
        F(ctx, wx, y - 2, 6, 1, 'rgba(0,0,0,0.25)');
      }
    } else {
      F(ctx, x - 2, y - 2, 2, 5, b.color);
      F(ctx, x + 2, y - 2, 2, 5, b.color);
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
