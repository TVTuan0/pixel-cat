// Mouse Catch: mice peek out of holes in the wall, tap them before they hide.
import { drawSprite } from '../render/sprites.js';
import { F, fineShape } from '../render/fine.js';

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

// The canvas has 2 pixels per game unit, like the room, so the art can be finer.
function setUp(canvas) {
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  return ctx;
}

// A plaster wall with faint bricks and a wooden skirting. Fine pixels (half a unit).
function drawWall(ctx) {
  F(ctx, 0, 0, 192, 240, '#ecd6b4');
  for (let y = 0, row = 0; y < 224; y += 14, row++) {
    F(ctx, 0, y + 13, 192, 1, '#dcc29c');
    for (let x = row % 2 ? 0 : 16; x < 192; x += 32) F(ctx, x, y, 1, 13, '#dcc29c');
    for (let x = row % 2 ? 3 : 19; x < 192; x += 32) F(ctx, x, y + 1, 10, 1, '#f6e4c8');
  }
  F(ctx, 0, 224, 192, 16, '#b9805a');
  F(ctx, 0, 224, 192, 2, '#d0986a');
  F(ctx, 0, 238, 192, 2, '#8a5a3a');
}

// A mouse hole: an arch in the skirting-board style, dark inside.
function drawHole(ctx, { x, y }) {
  fineShape(ctx, x * 2 - 19, y * 2 - 11, 38, 22, '#1a1210', '#5a3a1e', { round: 1.6 });
  F(ctx, x * 2 - 19, y * 2 + 6, 38, 4, '#5a3a1e');
  F(ctx, x * 2 - 14, y * 2 - 9, 10, 2, '#3a2a1e'); // a little depth at the top
}

// How far the thing has risen out of its hole: 0 hidden, 1 fully out.
function rise(pop, now) {
  const age = (now - pop.start) / 1000;
  const left = (pop.end - now) / 1000;
  return Math.max(0, Math.min(1, age / 0.12, left / 0.12));
}

// A mouse peeking out, its chin at (x, y) in game units.
function drawMouse(ctx, x, y, colors) {
  const { fur, dark } = colors;
  const cx = x * 2, cy = y * 2;
  for (const ex of [cx - 14, cx + 4]) { // round ears with pink insides
    fineShape(ctx, ex, cy - 26, 10, 10, dark, '#3a2a2a', { round: 2 });
    fineShape(ctx, ex + 2, cy - 24, 6, 6, '#ff8fa3', '#ff8fa3', { round: 2 });
  }
  fineShape(ctx, cx - 11, cy - 20, 22, 20, fur, '#3a2a2a', {
    round: 2.2,
    inside: () => {
      F(ctx, cx - 9, cy - 18, 6, 2, 'rgba(255,255,255,0.35)');
      F(ctx, cx + 5, cy - 18, 6, 18, dark);
      fineShape(ctx, cx - 6, cy - 9, 12, 9, '#f4f0ea', '#f4f0ea', { round: 2 }); // muzzle
    },
  });
  for (const ex of [cx - 7, cx + 4]) { // eyes with a shine
    F(ctx, ex, cy - 14, 3, 4, '#1a1a2e');
    F(ctx, ex, cy - 14, 1, 1, '#ffffff');
  }
  F(ctx, cx - 2, cy - 8, 4, 3, '#ff5a6e'); // nose
  F(ctx, cx - 1, cy - 8, 1, 1, '#ffb3c1');
  for (const dy of [-6, -3]) { // whiskers
    F(ctx, cx - 16, cy + dy, 9, 1, '#5a4a4a');
    F(ctx, cx + 7, cy + dy, 9, 1, '#5a4a4a');
  }
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
  const ctx = setUp(canvas);

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
  const ctx = setUp(canvas);
  drawWall(ctx);
  for (const hole of HOLES) drawHole(ctx, hole);
  const now = 1000;
  for (const [hole, kind] of [[1, 'mouse'], [3, 'gold'], [8, 'yarn'], [6, 'mouse']]) {
    drawPopUp(ctx, { hole, kind, start: 0, end: now * 10 }, now);
  }
}
