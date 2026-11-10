// Draws the cat: front view when sitting or sleeping, side view when walking or jumping.
import { FURS, drawSprite } from './sprites.js';
import { rect, blob } from './draw.js';

// Colors of the cat being drawn right now; set at the start of each draw call.
let C = FURS.orange;

// Dark spots for a calico; other furs have none.
function patch(ctx, x, y, w, h) {
  if (C.patch) rect(ctx, x, y, w, h, C.patch);
}

// The dark face, ears, paws and tail of a Siamese; other furs use their normal color.
const pointsOr = (color) => C.points ?? color;

// A soft shadow on the ground under a cat.
function groundShadow(ctx, cx, ground, w) {
  ctx.fillStyle = 'rgba(30, 18, 8, 0.25)';
  ctx.fillRect(Math.round(cx - w / 2) + 1, ground - 1, w - 2, 2);
  ctx.fillRect(Math.round(cx - w / 2) + 3, ground + 1, w - 6, 1);
}

export const FACES = {
  happy: { eyes: 'happy', mouth: 'w', blush: true },
  okay: { eyes: 'open', mouth: 'w' },
  hungry: { eyes: 'open', mouth: 'open' },
  sleepy: { eyes: 'sleepy', mouth: 'small' },
  dirty: { eyes: 'open', mouth: 'frown' },
  grumpy: { eyes: 'grumpy', mouth: 'frown' },
  angry: { eyes: 'grumpy', mouth: 'open' },
  sleeping: { eyes: 'closed', mouth: 'small' },
};

const COLLAR_COLORS = { collar_red: '#e8384f', collar_blue: '#3a7bff', collar_gold: '#8b4513' };

function drawTail(ctx, baseX, baseY, points) {
  for (const [dx, dy] of points) rect(ctx, baseX + dx - 1, baseY + dy - 1, 3, 3, C.outline);
  points.forEach(([dx, dy], i) => rect(ctx, baseX + dx, baseY + dy, 1, 1, pointsOr(i === points.length - 1 ? C.stripe : C.fur)));
}

function drawEars(ctx, headX, headY, hw, ear) {
  for (let i = 0; i < ear; i++) {
    const w = i + 2;
    const y = headY - ear + 1 + i;
    for (const x of [headX + 1, headX + hw - 1 - w]) {
      rect(ctx, x, y, w, 1, C.outline);
      if (i > 0) rect(ctx, x + 1, y, w - 2, 1, pointsOr(C.fur));
      if (i > 1) rect(ctx, x + 2 - (x > headX + 1 ? 1 : 0), y, Math.max(0, w - 4), 1, C.pink);
    }
  }
}

function drawEye(ctx, ex, ey, kind) {
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
  } else {
    rect(ctx, ex, ey + 1, 2, 1, C.eye); // closed or grumpy
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

function drawHat(ctx, hat, headX, headY, hw) {
  const mid = headX + Math.floor(hw / 2);
  if (hat === 'hat_bow') drawSprite(ctx, 'hat_bow', headX + hw - 8, headY - 3);
  if (hat === 'hat_party') drawSprite(ctx, 'hat_party', mid - 3, headY - 6);
  if (hat === 'hat_crown') drawSprite(ctx, 'hat_crown', mid - 4, headY - 4);
}

// A back leg reaching up the left side to scratch behind the ear. `up` 0 or 1 moves the paw.
function drawItchPaw(ctx, bodyLeft, ground, headX, headY, up) {
  const pawX = headX - 4;
  const pawY = headY + 1 - up * 2;
  const steps = [];
  for (let y = ground - 3, x = bodyLeft + 1; y > pawY + 3; y -= 2) steps.push([x, y]), (x = Math.max(pawX + 2, x - 1));
  for (const [x, y] of steps) rect(ctx, x - 1, y - 1, 3, 3, C.outline);
  for (const [x, y] of steps) rect(ctx, x, y, 1, 1, C.fur);
  blob(ctx, pawX, pawY, 5, 5, C.fur, C.outline);
  rect(ctx, pawX + 1, pawY + 1, 3, 1, C.furLight);
  rect(ctx, pawX + 1, pawY - 1, 1, 1, C.outline); // toes
  rect(ctx, pawX + 3, pawY - 1, 1, 1, C.outline);
}

// Front view. `lying` draws the curled-up sleeping shape. `itch` (0/1, or null) scratches an ear.
// Returns the head box for hearts/Zzz.
export function drawFrontCat(ctx, { size, cx, ground, face, lying, look, bob, now, equipped, palette, itch = null }) {
  C = palette;
  const { hw, hh, ear } = size;
  const bw = lying ? size.bw + 6 : size.bw;
  const bh = lying ? size.bh - 3 : size.bh;
  const bodyX = cx - Math.floor(bw / 2);
  const bodyY = ground - bh;
  const headX = cx - Math.floor(hw / 2);
  const headY = lying ? bodyY - hh + 6 + bob : bodyY - hh + 3 + bob;

  groundShadow(ctx, cx, ground, bw + 6);
  const sway = lying ? 0 : [0, 1, 1, 0, -1, -1][Math.floor(now / 250) % 6];
  const tail = lying
    ? [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, -1]]
    : [[1, 0], [2, 0], [3, -1], [3, -2], [4 + sway, -3], [4 + sway, -4], [4 + sway, -5], [3 + sway, -6]];
  drawTail(ctx, bodyX + bw - 1, ground - 3, tail);

  blob(ctx, bodyX, bodyY, bw, bh, C.fur, C.outline);
  rect(ctx, bodyX + bw - 3, bodyY + 2, 2, Math.max(1, bh - 3), C.shade); // shade on the far side
  rect(ctx, bodyX + 1, bodyY + bh - 2, bw - 2, 1, C.shade);
  if (C.stripes) {
    for (let i = 0; i < 3 && bodyY + 3 + i * 3 < ground - 2; i++) {
      rect(ctx, bodyX + 1, bodyY + 3 + i * 3, 2, 1, C.stripe);
      rect(ctx, bodyX + bw - 3, bodyY + 3 + i * 3, 2, 1, C.stripe);
    }
  }
  const belly = Math.floor(bw / 4);
  rect(ctx, cx - belly, bodyY + 2, belly * 2 + 1, Math.max(1, bh - 4), C.furLight);
  patch(ctx, bodyX + 1, bodyY + 2, 2, 3);
  if (!lying) {
    rect(ctx, cx - 4, ground - 3, 3, 2, pointsOr(C.furLight));
    rect(ctx, cx + 2, ground - 3, 3, 2, pointsOr(C.furLight));
    rect(ctx, cx - 2, ground - 3, 1, 2, C.outline);
    rect(ctx, cx + 1, ground - 3, 1, 2, C.outline);
  }

  blob(ctx, headX, headY, hw, hh, C.fur, C.outline);
  rect(ctx, headX + hw - 3, headY + 3, 1, Math.max(1, hh - 6), C.shade);
  patch(ctx, headX + hw - 5, headY + 1, 3, 3);
  drawEars(ctx, headX, headY, hw, ear);
  rect(ctx, cx - 2, headY + 1, 1, 2, C.stripe);
  rect(ctx, cx, headY + 1, 1, 3, C.stripe);
  rect(ctx, cx + 2, headY + 1, 1, 2, C.stripe);

  const ey = headY + Math.round(hh * 0.42);
  const gap = Math.round(hw * 0.18) + 1;
  rect(ctx, cx - 3, ey + 2, 7, Math.min(3, headY + hh - ey - 3), C.furLight);
  if (C.points) rect(ctx, cx - gap - 3, ey - 1, gap * 2 + 7, Math.min(6, headY + hh - ey), C.points); // dark mask
  rect(ctx, cx - 1, ey + 2, 3, 1, C.pink);
  rect(ctx, headX - 2, ey + 3, 3, 1, C.outline);
  rect(ctx, headX + hw - 1, ey + 3, 3, 1, C.outline);

  const shift = face.eyes === 'open' ? look : 0;
  drawEye(ctx, cx - gap - 1 + shift, ey, face.eyes);
  drawEye(ctx, cx + gap + shift, ey, face.eyes);
  if (face.eyes === 'grumpy') {
    const l = cx - gap - 1, r = cx + gap;
    rect(ctx, l - 1, ey - 2, 1, 1, C.outline);
    rect(ctx, l, ey - 1, 2, 1, C.outline);
    rect(ctx, r + 2, ey - 2, 1, 1, C.outline);
    rect(ctx, r, ey - 1, 2, 1, C.outline);
  }
  drawMouth(ctx, cx, ey + 3, face.mouth);
  if (face.blush) {
    rect(ctx, cx - gap - 3, ey + 2, 2, 1, C.blush);
    rect(ctx, cx + gap + 2, ey + 2, 2, 1, C.blush);
  }

  if (equipped.collar) {
    rect(ctx, cx - 4, headY + hh - 1, 9, 2, COLLAR_COLORS[equipped.collar]);
    if (equipped.collar === 'collar_gold') rect(ctx, cx - 1, headY + hh, 3, 2, '#ffcf3a');
  }
  drawHat(ctx, equipped.hat, headX, headY, hw);
  if (itch !== null && !lying) drawItchPaw(ctx, bodyX, ground, headX, headY, itch);

  return { x: Math.min(headX, bodyX) - 1, y: headY - ear, w: Math.max(hw, bw) + 2, h: ground - headY + ear, headX, headY, hw };
}

// Claw marks in front of a scratching cat, flickering with each swipe.
function drawClawMarks(ctx, x, y, swipe) {
  for (let m = 0; m < 3; m++) {
    for (let i = 0; i < 3; i++) rect(ctx, x + m * 2 + (i === 2 ? 1 : 0), y + i + swipe, 1, 1, '#5a3a1e');
  }
}

// Side view facing right; `facing` -1 mirrors it. `frame` 0-3 moves the legs; `jumping` stretches them.
// `crouch` lowers the body and wiggles the back end before a pounce.
// `scratch` (0/1, or null) raises the front paws in turn to scratch whatever is in front.
export function drawSideCat(ctx, { size, x, ground, facing, frame, jumping, face, equipped, now, palette, crouch = false, scratch = null }) {
  C = palette;
  const { L, H, hw, hh } = size.side;
  const leg = crouch ? 0 : size.side.leg;
  const ear = size.ear;
  const bob = !jumping && !crouch && scratch === null && frame % 2 === 1 ? 1 : 0;
  const wiggle = crouch ? [0, 1, 0, -1][Math.floor(now / 90) % 4] : 0;

  if (!jumping) groundShadow(ctx, x, ground, L + 6);
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(facing, 1);

  const bx = -Math.floor(L / 2);
  const bodyTop = ground - leg - H - bob;
  const legTop = bodyTop + H - 2;

  // Tail, raised behind the body.
  const sway = [0, 1, 0, -1][Math.floor(now / (crouch ? 90 : 200)) % 4];
  drawTail(ctx, bx + wiggle, bodyTop + 2, [[0, 0], [-1, 0], [-2, -1], [-3, -2], [-3, -3], [-3 + sway, -4], [-2 + sway, -5]]);

  // Legs: diagonal pairs step together. Jumping stretches front legs forward and back legs back.
  const xs = [bx + 1, bx + 4, bx + L - 7, bx + L - 4];
  const step = [1, 0, -1, 0][frame % 4];
  xs.forEach((lx, i) => {
    if (scratch !== null && i >= 2) return; // front paws are up, drawn below
    const pairA = i === 0 || i === 3;
    const dx = jumping ? (i < 2 ? -2 : 2) : pairA ? step : -step;
    const lifted = !jumping && !crouch && dx > 0 ? 1 : 0;
    const h = leg + 2 + bob - lifted;
    rect(ctx, lx + dx, legTop, 3, h, C.outline);
    rect(ctx, lx + dx + 1, legTop, 1, h - 1, pointsOr(C.fur));
    rect(ctx, lx + dx + 1, legTop + h - 2, 1, 1, pointsOr(C.furLight));
  });

  blob(ctx, bx, bodyTop, L, H, C.fur, C.outline);
  rect(ctx, bx + 2, bodyTop + 1, L - 4, 1, C.shade); // darker along the back
  rect(ctx, bx + 3, bodyTop + H - 3, L - 6, 2, C.furLight);
  const stripeLength = C.stripes ? H - 4 : 2;
  for (let i = 0; i < (C.stripes ? 4 : 3); i++) rect(ctx, bx + 3 + i * 3, bodyTop + 1, 1, stripeLength, C.stripe);
  patch(ctx, bx + L - 9, bodyTop + 2, 3, 2);

  const hx = bx + L - Math.floor(hw / 2) - 1;
  const hy = bodyTop - hh + 5;
  blob(ctx, hx, hy, hw, hh, C.fur, C.outline);
  drawEars(ctx, hx, hy, hw, ear);
  rect(ctx, hx + 3, hy + 1, 1, 2, C.stripe);
  rect(ctx, hx + 5, hy + 1, 1, 2, C.stripe);

  const ey = hy + Math.round(hh * 0.4);
  const ex = hx + hw - 5;
  rect(ctx, hx + hw - 5, ey + 2, 4, Math.min(3, hy + hh - ey - 3), C.furLight);
  if (C.points) rect(ctx, hx + hw - 6, ey - 1, 6, Math.min(6, hy + hh - ey), C.points); // dark mask
  drawEye(ctx, ex, ey, face.eyes);
  if (face.eyes === 'grumpy') {
    rect(ctx, ex - 1, ey - 2, 1, 1, C.outline);
    rect(ctx, ex, ey - 1, 2, 1, C.outline);
  }
  rect(ctx, hx + hw - 2, ey + 2, 1, 1, C.pink);
  rect(ctx, hx + hw - 3, ey + 3 + (face.mouth === 'open' ? 1 : 0), 1, 1, C.outline);
  rect(ctx, hx + hw - 1, ey + 3, 3, 1, C.outline);
  if (face.blush) rect(ctx, ex - 2, ey + 2, 2, 1, C.blush);

  if (equipped.collar) {
    rect(ctx, hx + 1, hy + hh - 2, 5, 2, COLLAR_COLORS[equipped.collar]);
    if (equipped.collar === 'collar_gold') rect(ctx, hx + 3, hy + hh - 1, 2, 2, '#ffcf3a');
  }
  drawHat(ctx, equipped.hat, hx, hy, hw);
  if (scratch !== null) {
    // Two front legs reaching forward from the chest, swiping in turn.
    const chestX = bx + L - 3;
    const chestY = bodyTop + H - 3;
    for (const i of [0, 1]) {
      const reach = i === scratch ? 3 : 0;
      const pawX = chestX + 5 + i * 2;
      const pawY = bodyTop - 1 - reach + i * 2;
      for (let k = 0; k <= 3; k++) {
        const x = Math.round(chestX + ((pawX - chestX) * k) / 3);
        const y = Math.round(chestY + ((pawY - chestY) * k) / 3);
        rect(ctx, x - 1, y - 1, 3, 3, C.outline);
      }
      for (let k = 0; k <= 3; k++) {
        const x = Math.round(chestX + ((pawX - chestX) * k) / 3);
        const y = Math.round(chestY + ((pawY - chestY) * k) / 3);
        rect(ctx, x, y, 1, 1, k === 3 ? C.furLight : C.fur);
      }
    }
    drawClawMarks(ctx, chestX + 10, bodyTop - 4, scratch);
  }
  ctx.restore();

  const left = x + facing * bx;
  const right = x + facing * (bx + L + 3);
  return { x: Math.min(left, right) - 4, y: hy - ear, w: L + 10, h: ground - hy + ear, headX: facing > 0 ? x + hx : x - hx - hw, headY: hy, hw };
}
