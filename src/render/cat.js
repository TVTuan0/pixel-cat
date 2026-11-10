// Draws a cat from three angles, like the reference sheet (D:\projects\image\demo.png), in chunky 8-bit pixels:
// one pixel is one room unit.
// - side profile when standing, walking, jumping, crouching or scratching;
// - front view when sitting (and itching);
// - curled up when asleep (and as a newborn).
import { FURS, drawSprite } from './sprites.js';

// The cat being drawn right now: its colors and the context. Set at the start of drawCat.
let C = FURS.orange;
let ctx = null;

function P(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
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

// Sizes per growth stage, in pixels: body length and height, leg length, head size, ear height, tail length.
// Kittens have big heads and short legs; grown cats are long and leggy.
const BODY = {
  newborn: { L: 11, H: 6, leg: 2, hw: 8, hh: 7, ear: 3, tail: 6 },
  kitten: { L: 14, H: 7, leg: 4, hw: 9, hh: 8, ear: 3, tail: 9 },
  young: { L: 19, H: 8, leg: 5, hw: 10, hh: 8, ear: 4, tail: 12 },
  adult: { L: 23, H: 9, leg: 6, hw: 11, hh: 9, ear: 4, tail: 15 },
  mature: { L: 25, H: 10, leg: 6, hw: 11, hh: 10, ear: 4, tail: 16 },
  senior: { L: 25, H: 10, leg: 5, hw: 11, hh: 10, ear: 4, tail: 14, sag: true },
};

const COLLAR_COLORS = { collar_red: '#e8384f', collar_blue: '#3a7bff', collar_gold: '#8b4513' };

const pointsOr = (color) => C.points ?? color; // Siamese faces, paws and tails are dark
const whiskerColor = () => (['#2a2a34', '#3a3a48'].includes(C.fur) ? '#d8d8e4' : C.outline);
const striped = () => Boolean(C.stripes);
const iris = () => (C.eye === '#2a1d1d' ? '#6a4a2a' : C.eye);

// ---- Drawing helpers ----

function rowsOf(x, y, w, h, round = 2) {
  const rows = [];
  for (let r = 0; r < h; r++) {
    const t = (r + 0.5 - h / 2) / (h / 2);
    const half = (w / 2) * Math.pow(1 - Math.pow(Math.abs(t), round), 1 / round);
    rows.push([Math.round(x + w / 2 - half), Math.round(x + w / 2 + half), y + r]);
  }
  return rows;
}

// A rounded shape with a one-pixel outline. `inside` draws shading and markings, clipped to the shape.
function shape(x, y, w, h, fill, { round = 2.5, inside = null } = {}) {
  for (const [l, r, row] of rowsOf(x, y, w, h, round)) P(l, row, r - l, 1, C.outline);
  const inner = rowsOf(x + 1, y + 1, w - 2, h - 2, round);
  for (const [l, r, row] of inner) P(l, row, r - l, 1, fill);
  if (!inside) return;
  ctx.save();
  ctx.beginPath();
  for (const [l, r, row] of inner) ctx.rect(l, row, r - l, 1);
  ctx.clip();
  inside();
  ctx.restore();
}

// A line one pixel thick with an outline on each side, from point to point. Returns its pixels.
function thickLine(points, fill) {
  const dots = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i], [x1, y1] = points[i + 1];
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let k = 0; k <= n; k++) dots.push([Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n)]);
  }
  for (const [x, y] of dots) P(x - 1, y - 1, 3, 3, C.outline);
  for (const [x, y] of dots) P(x, y, 1, 1, fill);
  return dots;
}

// A leg three pixels wide from (x, top) down h pixels, with a light paw.
function leg(x, top, h, color) {
  P(x, top, 3, h, C.outline);
  P(x + 1, top, 1, h - 1, pointsOr(color));
  if (striped() && h >= 5) P(x + 1, top + Math.floor(h / 2) - 1, 1, 1, C.stripe);
  P(x + 1, top + h - 2, 1, 1, pointsOr(C.furLight));
}

// A pointed ear on `base`: h rows, widening by one pixel a row; `lean` -1 keeps the left side straight, 1 the right.
function ear(x, base, h, lean, inner = true) {
  for (let i = 0; i < h; i++) {
    const w = i + 1;
    const left = lean < 0 ? x : x + h - w;
    P(left, base - h + i, w, 1, C.outline);
    if (w >= 3) P(left + 1, base - h + i, w - 2, 1, inner && i >= 2 ? C.pink : pointsOr(C.fur));
  }
}

function groundShadow(cx, ground, w) {
  ctx.fillStyle = 'rgba(30, 18, 8, 0.25)';
  ctx.fillRect(Math.round(cx - w / 2) + 1, ground - 1, w - 2, 1);
}

// One eye, two pixels wide. `pupilRight` puts the dark pupil on the right half.
function drawEye(x, y, kind, pupilRight = true) {
  if (kind === 'open') {
    P(x, y, 2, 2, iris());
    P(pupilRight ? x + 1 : x, y, 1, 2, '#1a1210');
  } else if (kind === 'happy') {
    P(x, y + 1, 1, 1, C.outline);
    P(x + 1, y, 1, 1, C.outline);
    P(x + 2, y + 1, 1, 1, C.outline);
  } else if (kind === 'sleepy' || kind === 'grumpy') {
    P(x, y, 2, 1, C.outline);
    P(x, y + 1, 2, 1, iris());
  } else {
    P(x, y + 1, 2, 1, C.outline); // closed
  }
}

// The mouth under a nose at (cx, y - 1).
function drawMouth(cx, y, kind) {
  if (kind === 'w') {
    P(cx, y, 1, 1, C.outline);
    P(cx - 1, y + 1, 1, 1, C.outline);
    P(cx + 1, y + 1, 1, 1, C.outline);
  } else if (kind === 'open') {
    P(cx - 1, y, 3, 2, C.outline);
    P(cx, y + 1, 1, 1, C.pink);
  } else if (kind === 'frown') {
    P(cx, y, 1, 1, C.outline);
    P(cx - 1, y + 1, 3, 1, C.outline);
  } else {
    P(cx, y, 1, 1, C.outline);
  }
}

function drawHat(hat, x, y, w) {
  const mid = x + Math.floor(w / 2);
  if (hat === 'hat_bow') drawSprite(ctx, 'hat_bow', x + w - 6, y - 3);
  if (hat === 'hat_party') drawSprite(ctx, 'hat_party', mid - 3, y - 7);
  if (hat === 'hat_crown') drawSprite(ctx, 'hat_crown', mid - 4, y - 5);
}

function drawCollar(collar, x, y, w) {
  if (!collar) return;
  P(x, y, w, 1, COLLAR_COLORS[collar]);
  P(x + Math.floor(w / 2), y + 1, 1, 1, collar === 'collar_gold' ? '#ffcf3a' : '#ffd84a');
}

// ---- Side profile (facing right; drawCat mirrors it for facing left) ----

function drawProfileTail(baseX, baseY, length, now, wiggle) {
  const sway = Math.round(Math.sin(now / 280)) + wiggle;
  const top = baseY - length;
  const dots = thickLine([
    [baseX, baseY],
    [baseX - Math.round(length * 0.25), baseY - Math.round(length * 0.35)],
    [baseX - Math.round(length * 0.2), baseY - Math.round(length * 0.75)],
    [baseX + sway, top],
  ], pointsOr(C.fur));
  if (striped()) dots.forEach(([x, y], i) => i % 3 === 2 && P(x, y, 1, 1, C.stripe));
  P(baseX + sway, top, 1, 1, C.points ?? C.stripe);
}

function drawProfileHead(hx, hy, b, face, equipped) {
  const { hw, hh } = b;
  ear(hx + Math.round(hw * 0.5), hy + 2, b.ear, 1, false); // far ear
  shape(hx, hy, hw, hh, C.fur, {
    inside: () => {
      P(hx, hy, 2, hh, C.shade);
      if (striped()) {
        P(hx + 3, hy + 1, 1, 2, C.stripe);
        P(hx + 5, hy + 1, 1, 2, C.stripe);
        P(hx + 2, hy + hh - 4, 3, 1, C.stripe);
      }
      if (C.patch) P(hx + 1, hy + 1, 4, 3, C.patch);
      if (C.points) P(hx + Math.round(hw * 0.5), hy + 3, hw, hh, C.points);
    },
  });
  ear(hx + 1, hy + 2, b.ear + 1, -1, true); // near ear
  // The muzzle sticks out in front, nose at its tip.
  const my = hy + Math.round(hh * 0.45);
  shape(hx + hw - 3, my, 5, 4, pointsOr(C.furLight), { round: 1.6 });
  P(hx + hw + 1, my + 1, 1, 1, C.pink);
  if (face.mouth === 'open') P(hx + hw, my + 2, 1, 1, C.outline);
  drawEye(hx + hw - 5, hy + Math.round(hh * 0.3), face.eyes, true);
  if (face.eyes === 'grumpy') P(hx + hw - 6, hy + Math.round(hh * 0.3) - 1, 2, 1, C.outline);
  if (face.blush) P(hx + hw - 5, my + 2, 1, 1, '#ff9ab0');
  P(hx + hw + 2, my + 2, 3, 1, whiskerColor());
  drawCollar(equipped.collar, hx + 1, hy + hh - 2, Math.round(hw * 0.5));
  drawHat(equipped.hat, hx, hy, hw);
}

function drawProfile(b, { ground, pose, frame, now, face, equipped, scratch }) {
  const crouch = pose === 'crouch';
  const jumping = pose === 'jump';
  const scratching = scratch !== null && scratch !== undefined;
  const legH = crouch ? 2 : b.leg;
  const bob = pose === 'walk' && frame % 2 === 1 ? 1 : 0;
  const wiggle = crouch ? [0, 1, 0, -1][Math.floor(now / 90) % 4] : 0;
  const bx = -Math.round(b.L / 2);
  const bodyTop = ground - legH - b.H + 2 - bob;
  const legTop = bodyTop + b.H - 2;
  const legLen = ground - legTop;
  const step = pose === 'walk' ? [1, 0, -1, 0][frame % 4] : 0;
  const stretch = (i) => (jumping ? (i < 2 ? -2 : 2) : 0);
  const backX = bx + 2, frontX = bx + b.L - 6;

  drawProfileTail(bx + 1 + wiggle, bodyTop + 1, crouch ? Math.round(b.tail * 0.6) : b.tail, now, wiggle);
  leg(backX + 2 + step + stretch(0), legTop, legLen, C.shade); // far legs
  if (!scratching) leg(frontX + 2 - step + stretch(2), legTop, legLen, C.shade);

  shape(bx, bodyTop, b.L, b.H, C.fur, {
    round: 1.8,
    inside: () => {
      P(bx, bodyTop, b.L, 2, C.shade);
      P(bx + 4, bodyTop + b.H - 3, b.L - 8, 2, C.furLight); // light belly
      P(bx + b.L - 5, bodyTop + 3, 5, b.H, pointsOr(C.furLight)); // light chest
      if (striped()) for (let x = bx + 2; x < bx + b.L - 5; x += 3) P(x, bodyTop + 1, 1, b.H - 4, C.stripe);
      if (C.patch) {
        P(bx + 2, bodyTop + 1, 5, 3, C.patch);
        P(bx + b.L - 10, bodyTop + 1, 4, 3, C.stripe);
      }
      if (b.sag) P(bx + 5, bodyTop + 1, b.L - 10, 1, C.shade);
    },
  });
  leg(backX + step + stretch(1), legTop, legLen, C.fur);
  if (!scratching) leg(frontX - step + stretch(3), legTop, legLen, C.fur);

  const hx = bx + b.L - Math.round(b.hw * 0.45);
  const hy = bodyTop - Math.round(b.hh * 0.6) + (crouch ? 2 : 0);
  shape(bx + b.L - 6, hy + Math.round(b.hh * 0.5), 6, bodyTop - hy, C.fur, { round: 1.8 }); // neck
  drawProfileHead(hx, hy, b, face, equipped);

  if (scratching) {
    // Front legs reaching up, swiping in turn, with claw marks ahead.
    const chestX = bx + b.L - 3, chestY = bodyTop + b.H - 3;
    for (const i of [0, 1]) {
      const pawX = chestX + 5 + i * 2, pawY = bodyTop - 1 - (i === scratch ? 3 : 0) + i * 2;
      thickLine([[chestX, chestY], [pawX, pawY]], pointsOr(C.fur));
      P(pawX, pawY, 1, 1, pointsOr(C.furLight));
    }
    for (let m = 0; m < 3; m++) for (let i = 0; i < 3; i++) P(chestX + 10 + m * 2 + Math.floor(i / 2), bodyTop - 4 + i + scratch, 1, 1, '#5a3a1e');
  }
  return { left: bx - 3, right: hx + b.hw + 4, top: hy - b.ear - 1, hx, hy, hw: b.hw };
}

// ---- Front view ----

// A head seen from the front, `w` pixels wide (odd, so the nose sits in the middle).
function drawFrontHead(hx, hy, w, h, b, face, equipped) {
  ear(hx, hy + 2, b.ear + 1, -1, true);
  ear(hx + w - b.ear - 1, hy + 2, b.ear + 1, 1, true);
  const cx = hx + Math.floor(w / 2);
  const ey = hy + Math.round(h * 0.38);
  shape(hx, hy, w, h, C.fur, {
    inside: () => {
      P(hx + w - 2, hy, 2, h, C.shade);
      if (striped()) {
        // The tabby "M" on the forehead and stripes on the cheeks.
        for (const dx of [-2, 0, 2]) P(cx + dx, hy + 1, 1, 2, C.stripe);
        P(hx + 1, ey + 2, 2, 1, C.stripe);
        P(hx + w - 3, ey + 2, 2, 1, C.stripe);
      }
      if (C.patch) P(hx + w - 5, hy + 1, 4, 3, C.patch);
      if (C.points) P(cx - 3, ey - 1, 7, h, C.points);
      if (!C.points) P(cx - 2, ey + 2, 5, 3, C.furLight); // light muzzle
    },
  });
  drawEye(cx - 3, ey, face.eyes, true);
  drawEye(cx + 2, ey, face.eyes, false);
  if (face.eyes === 'grumpy') {
    P(cx - 4, ey - 1, 2, 1, C.outline);
    P(cx + 3, ey - 1, 2, 1, C.outline);
  }
  P(cx, ey + 2, 1, 1, C.pink); // nose
  drawMouth(cx, ey + 3, face.mouth);
  const whisker = whiskerColor();
  for (const dy of [2, 4]) {
    P(hx - 2, ey + dy, 3, 1, whisker);
    P(hx + w - 1, ey + dy, 3, 1, whisker);
  }
  if (face.blush) {
    P(cx - 4, ey + 3, 1, 1, '#ff9ab0');
    P(cx + 4, ey + 3, 1, 1, '#ff9ab0');
  }
  drawCollar(equipped.collar, cx - 3, hy + h - 1, 7);
  drawHat(equipped.hat, hx, hy, w);
}

// Sitting up tall, facing us: round haunches, a light chest, straight front legs, the tail round the paws.
// `itch` (0/1, or null) raises a back paw to scratch behind an ear.
function drawFrontSit(b, { ground, face, equipped, itch }) {
  const bodyH = b.H + b.leg;
  const half = Math.round(b.hw / 2) + 1;
  const hauH = Math.round(bodyH * 0.55);
  shape(-half - 1, ground - hauH, half + 2, hauH, C.fur, {
    inside: () => striped() && P(-half, ground - hauH + 2, half, 1, C.stripe),
  });
  shape(-1, ground - hauH, half + 2, hauH, C.fur, {
    inside: () => {
      P(half - 1, ground - hauH, 2, hauH, C.shade);
      if (striped()) P(0, ground - hauH + 2, half, 1, C.stripe);
    },
  });
  const bw = b.hw - 1 - ((b.hw - 1) % 2 === 0 ? 1 : 0); // odd, so it centers
  const bl = -Math.floor(bw / 2);
  shape(bl, ground - bodyH, bw, bodyH, C.fur, {
    round: 2,
    inside: () => {
      P(bl + bw - 2, ground - bodyH, 2, bodyH, C.shade);
      if (striped()) for (let y = ground - bodyH + 3; y < ground - 3; y += 3) {
        P(bl + 1, y, 2, 1, C.stripe);
        P(bl + bw - 3, y, 2, 1, C.stripe);
      }
      if (C.patch) P(bl + 1, ground - bodyH + 2, 3, 4, C.patch);
      P(-1, ground - bodyH + 2, 3, bodyH - 4, pointsOr(C.furLight)); // light chest
    },
  });
  const legH = Math.round(bodyH * 0.5);
  leg(-3, ground - legH, legH, C.fur);
  leg(1, ground - legH, legH, C.fur);
  const tail = thickLine([[half + 1, ground - 3], [half - 1, ground - 2], [-half + 1, ground - 2]], pointsOr(C.fur));
  if (striped()) tail.forEach(([x, y], i) => i % 3 === 2 && P(x, y, 1, 1, C.stripe));
  const hw = b.hw + 2 + ((b.hw + 2) % 2 === 0 ? 1 : 0);
  const hh = b.hh + 1;
  const hx = -Math.floor(hw / 2), hy = ground - bodyH - Math.round(hh * 0.65);
  drawFrontHead(hx, hy, hw, hh, b, face, equipped);
  if (itch !== null && itch !== undefined) {
    const pawX = hx - 2, pawY = hy + 2 - itch * 2;
    thickLine([[-half, ground - 3], [pawX, pawY]], C.fur);
    P(pawX - 1, pawY - 1, 2, 2, pointsOr(C.furLight));
  }
  return { left: -half - 4, right: half + 4, top: hy - b.ear - 2, hx, hy, hw };
}

// ---- Curled up asleep ----

function drawCurled(b, { ground, now, face, equipped }) {
  const w = Math.round(b.L * 0.85), h = Math.round(b.H * 1.7);
  const bx = -Math.round(w / 2) + 2;
  const breathe = Math.floor(now / 1200) % 2;
  shape(bx, ground - h - breathe, w, h + breathe, C.fur, {
    round: 2,
    inside: () => {
      P(bx, ground - h - breathe, w, 3, C.shade);
      P(bx + w - 3, ground - h, 3, h, C.shade);
      // Stripes bend round the curled back: longer in the middle, shorter at the ends.
      if (striped()) for (let x = bx + 3; x < bx + w - 2; x += 3) {
        const mid = 1 - Math.abs((x - bx) / w - 0.5) * 2;
        P(x, ground - h, 1, Math.round(2 + mid * (h - 6)), C.stripe);
      }
      if (C.patch) P(bx + 3, ground - h + 1, 5, 4, C.patch);
    },
  });
  const tail = thickLine([[bx + w - 2, ground - 4], [bx + w - 4, ground - 2], [bx + 4, ground - 2]], pointsOr(C.fur));
  if (striped()) tail.forEach(([x, y], i) => i % 3 === 2 && P(x, y, 1, 1, C.stripe));
  const hw = b.hw + (b.hw % 2 === 0 ? 1 : 0);
  const hh = b.hh - 1;
  const hx = bx - Math.round(hw * 0.3), hy = ground - hh;
  drawFrontHead(hx, hy, hw, hh, b, face, equipped);
  return { left: hx - 3, right: bx + w + 1, top: hy - b.ear - 2, hx, hy, hw };
}

// Draws one cat. x and ground in room units; `facing` 1 = right, -1 = left. Returns its box (for taps, hearts
// and speech bubbles) and the head box, in room units.
export function drawCat(context, { stage, x, ground: groundUnits, facing = 1, pose = 'stand', frame = 0, face, look = 0, now, equipped, palette, scratch = null, itch = null }) {
  ctx = context;
  C = palette;
  const b = BODY[stage];
  const ground = Math.round(groundUnits);
  const cx = Math.round(x);
  if (pose !== 'jump') groundShadow(cx, ground, b.L + 6);
  ctx.save();
  ctx.translate(cx, 0);
  ctx.scale(facing, 1);
  const args = { ground, pose, frame, now, face, look, equipped, scratch, itch };
  const box = pose === 'lying' ? drawCurled(b, args) : pose === 'sit' || pose === 'itch' ? drawFrontSit(b, args) : drawProfile(b, args);
  ctx.restore();
  const sx = (px) => cx + facing * px;
  const [l, r] = [sx(box.left), sx(box.right)].sort((a, c) => a - c);
  const headLeft = Math.min(sx(box.hx), sx(box.hx + box.hw));
  return { x: l, y: box.top, w: r - l, h: ground - box.top, headX: headLeft, headY: box.hy, hw: box.hw };
}
