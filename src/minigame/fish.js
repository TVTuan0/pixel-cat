// Fish Catch: fish fall from the sky, move the basket under them.
import { drawSprite, spriteSize } from '../render/sprites.js';

const W = 96;
const H = 120;
const BASKET_Y = H - 14;
const GOLD_CHANCE = 0.12;

export function runFishGame(canvas, { seconds, onTick, onCatch, onEnd }) {
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;
  const basket = spriteSize('basket');
  const fishSize = spriteSize('fish');

  let basketX = W / 2;
  let targetX = W / 2;
  let fish = [];
  let caught = 0;
  let spawnIn = 0;
  let last = performance.now();
  const endAt = last + seconds * 1000;
  let frame = 0;
  let stopped = false;

  function pointerToX(e) {
    const r = canvas.getBoundingClientRect();
    targetX = ((e.clientX - r.left) / r.width) * W;
  }
  function onKey(e) {
    if (e.key === 'ArrowLeft') targetX = Math.max(0, basketX - 16);
    if (e.key === 'ArrowRight') targetX = Math.min(W, basketX + 16);
  }
  canvas.addEventListener('pointerdown', pointerToX);
  canvas.addEventListener('pointermove', pointerToX);
  window.addEventListener('keydown', onKey);

  function drawBackground() {
    ctx.fillStyle = '#8fd3ff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#b5e3ff';
    for (let y = 0; y < H - 10; y += 16) ctx.fillRect(0, y, W, 6);
    ctx.fillStyle = '#5cc96b';
    ctx.fillRect(0, H - 6, W, 6);
    ctx.fillStyle = '#3e9a4d';
    for (let x = 0; x < W; x += 6) ctx.fillRect(x, H - 7, 2, 1);
  }

  function step(now) {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const left = Math.max(0, endAt - now);
    const progress = 1 - left / (seconds * 1000);

    basketX += (targetX - basketX) * Math.min(1, dt * 12);
    basketX = Math.max(basket.w / 2, Math.min(W - basket.w / 2, basketX));

    spawnIn -= dt;
    if (spawnIn <= 0 && left > 600) {
      fish.push({
        x: 4 + Math.random() * (W - fishSize.w - 8),
        y: -fishSize.h,
        speed: 30 + progress * 35 + Math.random() * 10,
        gold: Math.random() < GOLD_CHANCE,
      });
      spawnIn = 0.7 - progress * 0.35;
    }

    const left0 = basketX - basket.w / 2;
    fish = fish.filter((f) => {
      f.y += f.speed * dt;
      const centerX = f.x + fishSize.w / 2;
      const inBasket = f.y + fishSize.h >= BASKET_Y && f.y < BASKET_Y + 4 && centerX >= left0 && centerX <= left0 + basket.w;
      if (inBasket) {
        caught += f.gold ? 3 : 1;
        onCatch?.(caught);
        return false;
      }
      return f.y < H;
    });

    drawBackground();
    for (const f of fish) drawSprite(ctx, f.gold ? 'goldfish' : 'fish', Math.round(f.x), Math.round(f.y));
    drawSprite(ctx, 'basket', Math.round(left0), BASKET_Y);

    if (frame++ % 10 === 0) onTick?.(Math.ceil(left / 1000));
    if (left <= 0) {
      stop();
      onEnd(caught);
      return;
    }
    requestAnimationFrame(step);
  }

  function stop() {
    stopped = true;
    canvas.removeEventListener('pointerdown', pointerToX);
    canvas.removeEventListener('pointermove', pointerToX);
    window.removeEventListener('keydown', onKey);
  }

  drawBackground();
  requestAnimationFrame(step);
  return stop;
}

export function drawFishGameIdle(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;
  ctx.fillStyle = '#8fd3ff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#5cc96b';
  ctx.fillRect(0, H - 6, W, 6);
  drawSprite(ctx, 'fish', 30, 30);
  drawSprite(ctx, 'goldfish', 58, 52);
  drawSprite(ctx, 'fish', 40, 74);
  drawSprite(ctx, 'basket', 40, BASKET_Y);
}
