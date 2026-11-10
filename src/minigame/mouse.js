// Mouse Catch: mice peek out of holes in the wall, tap them before they hide.
import { drawSprite } from '../render/sprites.js';

const W = 96;
const H = 120;
const GOLD_CHANCE = 1 / 8;
const YARN_CHANCE = 0.15;
const POINTS = { mouse: 1, gold: 3, yarn: -1 };

// Hole centers, 3 by 3.
const HOLES = [];
for (const y of [36, 66, 96]) for (const x of [18, 48, 78]) HOLES.push({ x, y });

export function scoreTap(score, kind) {
  return Math.max(0, score + POINTS[kind]);
}

const MOUSE_COLORS = {
  mouse: { fur: '#9aa0ad', dark: '#5a5a6a' },
  gold: { fur: '#ffd84a', dark: '#c89a1e' },
};

function drawWall(ctx) {
  ctx.fillStyle = '#e8d2b0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#d9bf98';
  for (let y = 6; y < H; y += 10) for (let x = (y / 10) % 2 ? 0 : 8; x < W; x += 16) ctx.fillRect(x, y, 12, 1);
  ctx.fillStyle = '#b9805a';
  ctx.fillRect(0, H - 8, W, 8);
}

function drawHole(ctx, { x, y }) {
  ctx.fillStyle = '#5a3a1e';
  ctx.fillRect(x - 9, y - 2, 18, 6);
  ctx.fillRect(x - 7, y - 5, 14, 3);
  ctx.fillStyle = '#1a1210';
  ctx.fillRect(x - 8, y - 1, 16, 5);
  ctx.fillRect(x - 6, y - 4, 12, 3);
}

// How far the thing has risen out of its hole: 0 hidden, 1 fully out.
function rise(pop, now) {
  const age = (now - pop.start) / 1000;
  const left = (pop.end - now) / 1000;
  return Math.max(0, Math.min(1, age / 0.12, left / 0.12));
}

function drawMouse(ctx, x, y, colors) {
  const { fur, dark } = colors;
  ctx.fillStyle = dark;
  ctx.fillRect(x - 6, y - 12, 4, 4); // ears
  ctx.fillRect(x + 2, y - 12, 4, 4);
  ctx.fillStyle = '#ff8fa3';
  ctx.fillRect(x - 5, y - 11, 2, 2);
  ctx.fillRect(x + 3, y - 11, 2, 2);
  ctx.fillStyle = fur;
  ctx.fillRect(x - 5, y - 9, 10, 9);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(x - 3, y - 6, 1, 2); // eyes
  ctx.fillRect(x + 2, y - 6, 1, 2);
  ctx.fillStyle = '#ff5a6e';
  ctx.fillRect(x - 1, y - 3, 2, 1); // nose
}

function drawPopUp(ctx, pop, now) {
  const hole = HOLES[pop.hole];
  const shown = rise(pop, now);
  if (shown <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(hole.x - 10, 0, 20, hole.y + 1); // hide whatever is still inside the hole
  ctx.clip();
  const y = hole.y + 1 + Math.round((1 - shown) * 12);
  if (pop.kind === 'yarn') drawSprite(ctx, 'toy_yarn', hole.x - 3, y - 7);
  else drawMouse(ctx, hole.x, y, MOUSE_COLORS[pop.kind]);
  ctx.restore();
}

export function runMouseGame(canvas, { seconds, onTick, onCatch, onEnd }) {
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;

  let pops = []; // { hole, kind, start, end }
  let flashes = []; // { x, y, text, until }
  let score = 0;
  let spawnIn = 0.4;
  let last = performance.now();
  const endAt = last + seconds * 1000;
  let frame = 0;
  let stopped = false;

  function onTap(e) {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    const now = performance.now();
    const hit = pops.find((p) => {
      const hole = HOLES[p.hole];
      return rise(p, now) > 0.3 && Math.abs(x - hole.x) <= 11 && y >= hole.y - 18 && y <= hole.y + 6;
    });
    if (!hit) return;
    score = scoreTap(score, hit.kind);
    const hole = HOLES[hit.hole];
    flashes.push({ x: hole.x, y: hole.y - 16, text: POINTS[hit.kind] > 0 ? `+${POINTS[hit.kind]}` : `${POINTS[hit.kind]}`, until: now + 500 });
    pops = pops.filter((p) => p !== hit);
    onCatch?.(score, hit.kind);
  }
  canvas.addEventListener('pointerdown', onTap);

  function spawn(now, progress) {
    const free = HOLES.map((_, i) => i).filter((i) => !pops.some((p) => p.hole === i));
    if (!free.length) return;
    const roll = Math.random();
    const kind = roll < YARN_CHANCE ? 'yarn' : roll < YARN_CHANCE + GOLD_CHANCE ? 'gold' : 'mouse';
    const stay = (1.15 - progress * 0.5) * (kind === 'gold' ? 0.8 : 1);
    pops.push({ hole: free[Math.floor(Math.random() * free.length)], kind, start: now, end: now + stay * 1000 });
  }

  function step(now) {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const left = Math.max(0, endAt - now);
    const progress = 1 - left / (seconds * 1000);

    spawnIn -= dt;
    if (spawnIn <= 0 && left > 800) {
      spawn(now, progress);
      spawnIn = 0.7 - progress * 0.35;
    }
    pops = pops.filter((p) => p.end > now);
    flashes = flashes.filter((f) => f.until > now);

    drawWall(ctx);
    for (const hole of HOLES) drawHole(ctx, hole);
    for (const p of pops) drawPopUp(ctx, p, now);
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    for (const f of flashes) {
      ctx.fillStyle = f.text.startsWith('+') ? '#2e7d32' : '#e8384f';
      ctx.fillText(f.text, f.x, f.y);
    }

    if (frame++ % 10 === 0) onTick?.(Math.ceil(left / 1000));
    if (left <= 0) {
      stop();
      onEnd(score);
      return;
    }
    requestAnimationFrame(step);
  }

  function stop() {
    stopped = true;
    canvas.removeEventListener('pointerdown', onTap);
  }

  drawWall(ctx);
  requestAnimationFrame(step);
  return stop;
}

export function drawMouseGameIdle(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;
  drawWall(ctx);
  for (const hole of HOLES) drawHole(ctx, hole);
  const now = 1000;
  for (const [hole, kind] of [[1, 'mouse'], [3, 'gold'], [8, 'yarn'], [6, 'mouse']]) {
    drawPopUp(ctx, { hole, kind, start: 0, end: now * 10 }, now);
  }
}
