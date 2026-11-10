// Draws a cat in three-quarter view, like the reference sheet (D:\projects\image\cats.png): a long body on four
// legs, the head turned toward us so both eyes show, a tall curling tail. Poses: stand, walk, jump, crouch,
// sit, scratch (front paws up), itch (sitting, a back paw at the ear) and lying (curled up asleep, or a newborn).
// Everything is drawn in fine pixels (half a room unit); drawCat takes and returns room units.
import { FURS, drawSprite } from './sprites.js';

// The cat being drawn right now: its colors and the context. Set at the start of drawCat.
let C = FURS.orange;
let ctx = null;

// One block of fine pixels.
function P(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x / 2, y / 2, w / 2, h / 2);
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

// Body proportions per growth stage, in fine pixels: body length and height, leg length, head size, ear height,
// tail length. Young cats have big heads and short legs; grown cats long bodies; old cats a sagging back.
const BODY = {
  newborn: { L: 24, H: 14, leg: 3, hw: 19, hh: 17, ear: 7, tail: 12, legW: 5 },
  kitten: { L: 28, H: 17, leg: 5, hw: 25, hh: 21, ear: 9, tail: 16, legW: 5 },
  young: { L: 36, H: 20, leg: 7, hw: 27, hh: 23, ear: 10, tail: 22, legW: 6 },
  adult: { L: 44, H: 24, leg: 8, hw: 30, hh: 26, ear: 11, tail: 26, legW: 7 },
  mature: { L: 48, H: 27, leg: 8, hw: 32, hh: 28, ear: 11, tail: 28, legW: 7 },
  senior: { L: 48, H: 26, leg: 7, hw: 31, hh: 27, ear: 10, tail: 26, legW: 7, sag: true },
};

const COLLAR_COLORS = { collar_red: '#e8384f', collar_blue: '#3a7bff', collar_gold: '#8b4513' };

// The dark face, ears, paws and tail of a Siamese; other furs use their normal color.
const pointsOr = (color) => C.points ?? color;
// Whiskers show light on dark cats and dark on light ones.
const whiskerColor = () => (['#2a2a34', '#3a3a48'].includes(C.fur) ? '#d8d8e4' : C.outline);

// ---- Drawing helpers ----

// The rows of a rounded shape (a "squircle"): [left, right, y] per row.
function rowsOf(x, y, w, h, round = 3) {
  const rows = [];
  for (let r = 0; r < h; r++) {
    const t = (r + 0.5 - h / 2) / (h / 2);
    const half = (w / 2) * Math.pow(1 - Math.pow(Math.abs(t), round), 1 / round);
    rows.push([Math.round(x + w / 2 - half), Math.round(x + w / 2 + half), y + r]);
  }
  return rows;
}

// A rounded shape with a thin outline. `inside` draws shading and markings, clipped to the shape.
function shape(x, y, w, h, fill, { round = 3, inside = null, outline = C.outline } = {}) {
  for (const [l, r, row] of rowsOf(x, y, w, h, round)) P(l, row, r - l, 1, outline);
  const inner = rowsOf(x + 1, y + 1, w - 2, h - 2, round);
  for (const [l, r, row] of inner) P(l, row, r - l, 1, fill);
  if (!inside) return;
  ctx.save();
  ctx.beginPath();
  for (const [l, r, row] of inner) ctx.rect(l / 2, row / 2, (r - l) / 2, 0.5);
  ctx.clip();
  inside();
  ctx.restore();
}

// A thick line through `points`: an outline 2 wider than the fill.
function thickLine(points, width, fill) {
  for (const [x, y] of points) P(x - 1, y - 1, width + 2, width + 2, C.outline);
  for (const [x, y] of points) P(x, y, width, width, fill);
}

// A leg from (x, top) down `h` pixels, `w` wide, with a lighter paw.
function leg(x, top, w, h, color) {
  P(x, top, w, h, C.outline);
  P(x + 1, top, w - 2, h - 1, pointsOr(color));
  P(x + 1, top + h - 3, w - 2, 2, pointsOr(C.furLight));
  P(x + 1, top + h - 1, w - 2, 1, C.outline);
}

// A pointed ear, base on `base`, from x to x + w; `lean` -1 tips it left, 1 right.
function ear(x, base, w, h, lean, inner = true) {
  for (let i = 0; i < h; i++) {
    const rowW = Math.max(1, Math.round((w * (i + 1)) / h));
    const left = lean < 0 ? x : x + w - rowW;
    const y = base - h + i;
    P(left, y, rowW, 1, C.outline);
    if (rowW > 2) P(left + 1, y, rowW - 2, 1, pointsOr(C.fur));
    if (inner && rowW > 5 && i > 2) P(left + 2, y, rowW - 4, 1, C.pink);
  }
}

function groundShadow(cx, ground, w) {
  ctx.fillStyle = 'rgba(30, 18, 8, 0.25)';
  ctx.fillRect((cx - w / 2 + 2) / 2, (ground - 2) / 2, (w - 4) / 2, 1.5);
  ctx.fillRect((cx - w / 2 + 6) / 2, (ground - 0.5) / 2, (w - 12) / 2, 1);
}

// An eye `w` pixels wide. Colored eyes (yellow, green, blue) get a slit pupil.
function drawEye(x, y, w, kind, lookX = 0) {
  const h = w + 1;
  if (kind === 'open') {
    P(x, y, w, h, C.eye);
    if (C.eye !== '#2a1d1d') P(x + Math.floor((w - 1) / 2) + lookX, y, w > 3 ? 2 : 1, h, '#1a1210');
    P(x + lookX, y, 1, 1, C.white);
    if (w > 3) P(x + w - 1 + lookX, y + h - 2, 1, 1, 'rgba(255,255,255,0.5)');
  } else if (kind === 'happy') {
    P(x, y + 2, 1, 2, C.outline);
    P(x + 1, y + 1, w - 2, 1, C.outline);
    P(x + w - 1, y + 2, 1, 2, C.outline);
  } else if (kind === 'sleepy' || kind === 'grumpy') {
    P(x, y + 2, w, 1, C.outline);
    P(x, y + 3, w, 2, C.eye);
    if (kind === 'sleepy') P(x + 1, y + 3, 1, 1, C.white);
  } else {
    P(x, y + 3, 1, 1, C.outline); // closed: a little curve
    P(x + 1, y + 4, w - 2, 1, C.outline);
    P(x + w - 1, y + 3, 1, 1, C.outline);
  }
}

function drawMouth(cx, y, kind) {
  if (kind === 'w') {
    P(cx - 3, y, 1, 1, C.outline);
    P(cx - 2, y + 1, 2, 1, C.outline);
    P(cx, y, 1, 1, C.outline);
    P(cx + 1, y + 1, 2, 1, C.outline);
    P(cx + 3, y, 1, 1, C.outline);
  } else if (kind === 'open') {
    P(cx - 2, y, 5, 4, C.outline);
    P(cx - 1, y + 2, 3, 2, C.pink);
  } else if (kind === 'frown') {
    P(cx - 2, y, 5, 1, C.outline);
    P(cx - 3, y + 1, 1, 1, C.outline);
    P(cx + 3, y + 1, 1, 1, C.outline);
  } else {
    P(cx, y, 1, 1, C.outline);
  }
}

// Hats are sprites in room units, placed from the head box (fine pixels).
function drawHat(hat, headX, headY, hw) {
  const x = headX / 2, y = headY / 2, w = hw / 2;
  const mid = x + Math.floor(w / 2);
  if (hat === 'hat_bow') drawSprite(ctx, 'hat_bow', x + w - 8, y - 3);
  if (hat === 'hat_party') drawSprite(ctx, 'hat_party', mid - 3, y - 6);
  if (hat === 'hat_crown') drawSprite(ctx, 'hat_crown', mid - 4, y - 4);
}

function drawCollar(collar, x, y, w) {
  if (!collar) return;
  P(x, y, w, 3, COLLAR_COLORS[collar]);
  P(x, y + 2, w, 1, 'rgba(0,0,0,0.25)');
  const mid = x + Math.floor(w / 2) - 1;
  P(mid, y + 2, 3, 3, collar === 'collar_gold' ? '#ffcf3a' : '#ffd84a');
  P(mid + 1, y + 3, 1, 1, '#fff4c0');
}

// ---- Body parts (facing right; drawCat mirrors the whole cat for facing left) ----

// The tail: up from the rump, leaning back, then curling forward at the tip.
function drawTail(baseX, baseY, length, now, wiggle = 0) {
  const sway = Math.sin(now / 260) * 2 + wiggle;
  const points = [];
  const steps = Math.round(length / 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push([
      Math.round(baseX - Math.sin(t * Math.PI * 0.75) * length * 0.32 + t * t * length * 0.3 + t * sway),
      Math.round(baseY - t * length),
    ]);
  }
  const thick = points.slice(0, Math.ceil(points.length * 0.55));
  thickLine(thick, 4, pointsOr(C.fur));
  thickLine(points.slice(thick.length - 1), 3, pointsOr(C.fur));
  const [tx, ty] = points[points.length - 1];
  if (!C.points) P(tx, ty, 3, 3, C.stripe); // a darker tip
}

// Stripes, patches and a light belly on the body.
function bodyMarkings(x, y, w, h) {
  P(x, y, w, 3, C.shade); // darker along the back
  P(x + 4, y + h - 6, w - 10, 6, C.furLight); // light belly
  if (C.stripes) for (let i = 0; i < 6; i++) P(x + 4 + i * 6, y + 1, 2, h - 8, C.stripe);
  if (C.patch) {
    P(x + 3, y + 2, 10, 7, C.patch);
    P(x + w - 18, y + 1, 9, 6, C.stripe);
  }
}

// The head, turned three-quarters toward us: both eyes, the muzzle toward the front, ears, whiskers.
// Returns the head box for hats and the collar.
function drawHead(hx, hy, b, face, look, equipped) {
  const { hw, hh } = b;
  const earH = b.ear + 2;
  // The far ear first, then the head over its base, then the near ear.
  ear(hx + Math.round(hw * 0.58), hy + 5, Math.round(hw * 0.34), earH, 1, true);
  shape(hx, hy, hw, hh, C.fur, {
    round: 2.3,
    inside: () => {
      P(hx, hy, 4, hh, C.shade); // the back of the head in shade
      P(hx + 6, hy + 2, 6, 1, 'rgba(255,255,255,0.18)');
      if (C.stripes) {
        P(hx + Math.round(hw * 0.42), hy + 1, 1, 5, C.stripe);
        P(hx + Math.round(hw * 0.55), hy + 1, 1, 6, C.stripe);
        P(hx + Math.round(hw * 0.68), hy + 2, 1, 4, C.stripe);
        P(hx + 1, hy + Math.round(hh * 0.55), 4, 1, C.stripe);
      }
      if (C.patch) P(hx + 2, hy + 1, 9, 8, C.patch);
      if (C.points) shape(hx + Math.round(hw * 0.3), hy + Math.round(hh * 0.32), Math.round(hw * 0.72), hh, C.points, { round: 2 });
    },
  });
  ear(hx + Math.round(hw * 0.06), hy + 5, Math.round(hw * 0.38), earH + 1, -1, true);

  // The face sits toward the front of the head.
  const fx = hx + Math.round(hw * 0.6);
  const eyeW = hw >= 28 ? 5 : hw >= 22 ? 4 : 3;
  const ey = hy + Math.round(hh * 0.4);
  const muzzleY = ey + eyeW;
  if (!C.points) shape(fx - 6, muzzleY - 1, 14, 8, C.furLight, { round: 2 });
  // Cheek fluff at the back of the jaw.
  P(hx + 2, hy + hh - 4, 3, 2, C.fur);
  P(hx + 1, hy + hh - 3, 1, 1, C.outline);
  const lookX = face.eyes === 'open' ? look : 0;
  drawEye(fx - eyeW - 4, ey, eyeW, face.eyes, lookX); // near eye
  drawEye(fx + 4, ey, eyeW - 1, face.eyes, lookX); // far eye, a little narrower
  if (face.eyes === 'grumpy') {
    P(fx - eyeW - 5, ey - 1, 2, 1, C.outline);
    P(fx - eyeW - 3, ey, eyeW - 1, 1, C.outline);
    P(fx + 4 + eyeW - 1, ey - 1, 2, 1, C.outline);
    P(fx + 4, ey, eyeW - 2, 1, C.outline);
  }
  P(fx - 1, muzzleY, 4, 2, C.pink); // nose
  P(fx, muzzleY + 2, 2, 1, C.pink);
  drawMouth(fx + 1, muzzleY + 4, face.mouth);
  const whisker = whiskerColor();
  for (const dy of [1, 3]) {
    P(fx - 12, muzzleY + dy, 7, 1, whisker);
    P(fx + 7, muzzleY + dy, 8, 1, whisker);
  }
  if (face.blush) {
    ctx.fillStyle = 'rgba(255, 140, 160, 0.55)';
    ctx.fillRect((fx - eyeW - 7) / 2, (muzzleY + 1) / 2, 1.5, 1);
    ctx.fillRect((fx + 6) / 2, (muzzleY + 1) / 2, 1.5, 1);
  }
  drawCollar(equipped.collar, hx + Math.round(hw * 0.25), hy + hh - 3, Math.round(hw * 0.5));
  drawHat(equipped.hat, hx, hy, hw);
}

// Standing, walking, jumping, crouching or scratching: the long body on four legs.
function drawStanding(b, { ground, pose, frame, now, face, look, equipped, scratch }) {
  const crouch = pose === 'crouch';
  const jumping = pose === 'jump';
  const legH = crouch ? 3 : b.leg;
  const bob = pose === 'walk' && frame % 2 === 1 ? 1 : 0;
  const wiggle = crouch ? [0, 2, 0, -2][Math.floor(now / 90) % 4] : 0;
  const bx = -Math.round(b.L / 2);
  const bodyTop = ground - legH - b.H - bob;
  const legTop = bodyTop + b.H - 6;
  const legW = b.legW;
  const step = pose === 'walk' ? [3, 0, -3, 0][frame % 4] : 0;
  const scratching = scratch !== null && scratch !== undefined;

  drawTail(bx + 3 + wiggle, bodyTop + 5, crouch ? b.tail * 0.6 : b.tail, now, wiggle);

  // Far legs: a little behind and darker. Near legs go over the body.
  const back = bx + 3, front = bx + b.L - legW - 5;
  const reach = (x, i) => (jumping ? (i < 2 ? -5 : 5) : x);
  if (!scratching) leg(front + 3 + reach(-step, 2), legTop, legW, legH + 6 - (step < 0 ? 2 : 0), C.shade);
  leg(back + 3 + reach(step, 0), legTop, legW, legH + 6 - (step > 0 ? 2 : 0), C.shade);

  shape(bx, bodyTop, b.L, b.H, C.fur, {
    round: 1.9,
    inside: () => {
      bodyMarkings(bx, bodyTop, b.L, b.H);
      if (b.sag) P(bx + 10, bodyTop, b.L - 20, 1, C.shade);
    },
  });
  // The near back thigh: a round haunch over the top of the back leg.
  shape(bx + 1, bodyTop + Math.round(b.H * 0.22), legW + 9, Math.round(b.H * 0.78), C.fur, {
    round: 1.8,
    inside: () => {
      P(bx + 1, bodyTop + b.H - 4, legW + 9, 4, C.shade);
      if (C.stripes) for (let i = 0; i < 3; i++) P(bx + 4, bodyTop + 8 + i * 4, legW + 3, 1, C.stripe);
      if (C.patch) P(bx + 3, bodyTop + 8, 6, 5, C.stripe);
    },
  });
  // A soft chest at the front.
  shape(bx + b.L - 14, bodyTop + Math.round(b.H * 0.3), 12, Math.round(b.H * 0.7), C.furLight, { round: 2 });

  leg(back + reach(-step, 1), legTop + 1, legW, legH + 5 - (step < 0 ? 2 : 0), C.fur);
  if (!scratching) leg(front + reach(step, 3), legTop + 1, legW, legH + 5 - (step > 0 ? 2 : 0), C.fur);

  const hx = bx + b.L - Math.round(b.hw * 0.42);
  const hy = bodyTop - Math.round(b.hh * 0.62) + (crouch ? 4 : 0);
  drawHead(hx, hy, b, face, look, equipped);

  if (scratching) {
    // Front legs reaching forward and up, swiping in turn, with claw marks ahead.
    const chestX = bx + b.L - 6, chestY = bodyTop + b.H - 6;
    for (const i of [0, 1]) {
      const pawX = chestX + 12 + i * 4, pawY = bodyTop - 2 - (i === scratch ? 6 : 0) + i * 4;
      const points = [];
      for (let k = 0; k <= 5; k++) points.push([Math.round(chestX + ((pawX - chestX) * k) / 5), Math.round(chestY + ((pawY - chestY) * k) / 5)]);
      thickLine(points, 3, pointsOr(C.fur));
      P(pawX, pawY, 3, 3, pointsOr(C.furLight));
    }
    for (let m = 0; m < 3; m++) for (let i = 0; i < 6; i++) P(chestX + 22 + m * 3 + Math.floor(i / 2), bodyTop - 8 + i + scratch * 2, 1, 1, '#5a3a1e');
  }
  return { left: bx - 6, right: Math.max(bx + b.L, hx + b.hw) + 2, top: hy - b.ear - 2, hx, hy };
}

// Sitting upright: a round haunch behind, the chest up, front legs straight, the tail around the feet.
// `itch` (0/1, or null) raises a back paw to the ear.
function drawSitting(b, { ground, now, face, look, equipped, itch }) {
  const bx = -Math.round(b.L / 2);
  const hauW = Math.round(b.L * 0.66), hauH = Math.round(b.H * 1.3);
  const chestW = Math.round(b.L * 0.42), chestH = Math.round(b.H * 1.4);
  const chestX = bx + Math.round(b.L * 0.36);
  // Tail wrapped round the front, along the ground.
  const tail = [];
  for (let i = 0; i <= 14; i++) tail.push([bx + 4 + Math.round(i * (b.L * 0.06)), ground - 4 - Math.round(Math.sin((i / 14) * Math.PI) * 3)]);
  thickLine(tail, 3, pointsOr(C.fur));
  shape(bx + 2, ground - hauH, hauW, hauH, C.fur, {
    round: 2,
    inside: () => {
      P(bx + 2, ground - hauH, 4, hauH, C.shade);
      if (C.stripes) for (let i = 0; i < 4; i++) P(bx + 8 + i * 6, ground - hauH + 2, 2, hauH - 6, C.stripe);
      if (C.patch) P(bx + 6, ground - hauH + 3, 9, 7, C.patch);
    },
  });
  shape(chestX, ground - chestH, chestW, chestH - 2, C.fur, {
    round: 2.2,
    inside: () => {
      P(chestX + Math.round(chestW * 0.4), ground - chestH + 4, Math.round(chestW * 0.6), chestH, C.furLight);
      if (C.stripes) P(chestX + 2, ground - chestH + 6, 3, 1, C.stripe);
    },
  });
  const legW = b.legW;
  leg(chestX + chestW - legW - 2, ground - Math.round(chestH * 0.45), legW, Math.round(chestH * 0.45), C.shade);
  leg(chestX + chestW - legW * 2 - 2, ground - Math.round(chestH * 0.42), legW, Math.round(chestH * 0.42), C.fur);
  const hx = chestX - Math.round(b.hw * 0.08);
  const hy = ground - chestH - Math.round(b.hh * 0.5);
  drawHead(hx, hy, b, face, look, equipped);
  if (itch !== null && itch !== undefined) {
    // A back leg from the haunch up to behind the ear.
    const pawX = hx - 2, pawY = hy + 3 - itch * 4;
    const points = [];
    for (let k = 0; k <= 6; k++) points.push([Math.round(bx + 10 + ((pawX - bx - 10) * k) / 6), Math.round(ground - hauH + 6 + ((pawY - ground + hauH - 6) * k) / 6)]);
    thickLine(points, 4, C.fur);
    shape(pawX - 2, pawY - 2, 8, 7, pointsOr(C.furLight), { round: 2 });
  }
  return { left: bx, right: Math.max(chestX + chestW, hx + b.hw) + 2, top: hy - b.ear - 2, hx, hy };
}

// Curled up: a round body, the head resting at the front, the tail wrapped round.
function drawLying(b, { ground, now, face, look, equipped }) {
  const w = Math.round(b.L * 1.05), h = Math.round(b.H * 1.05);
  const bx = -Math.round(w / 2);
  const breathe = Math.floor(now / 1200) % 2;
  shape(bx, ground - h - breathe, w, h + breathe, C.fur, {
    round: 2,
    inside: () => {
      P(bx, ground - h - breathe, w, 3, C.shade);
      if (C.stripes) for (let i = 0; i < 5; i++) P(bx + 5 + i * 6, ground - h, 2, h - 4, C.stripe);
      if (C.patch) P(bx + 5, ground - h + 2, 10, 7, C.patch);
    },
  });
  const tail = [];
  for (let i = 0; i <= 12; i++) tail.push([bx + w - 4 - Math.round(i * w * 0.06), ground - 4 + Math.round(Math.sin((i / 12) * Math.PI) * 1)]);
  thickLine(tail, 3, pointsOr(C.fur));
  const small = { ...b, hw: Math.round(b.hw * 0.9), hh: Math.round(b.hh * 0.85) };
  const hx = bx + w - Math.round(small.hw * 0.8);
  const hy = ground - small.hh - 2;
  drawHead(hx, hy, small, face, look, equipped);
  return { left: bx, right: Math.max(bx + w, hx + small.hw) + 2, top: hy - b.ear - 2, hx, hy, hw: small.hw };
}

// Draws one cat. x and ground in room units; `facing` 1 = right, -1 = left. Returns its box in room units
// (for taps, hearts and speech bubbles) and the head box.
export function drawCat(context, { stage, x, ground: groundUnits, facing = 1, pose = 'stand', frame = 0, face, look = 0, now, equipped, palette, scratch = null, itch = null }) {
  ctx = context;
  C = palette;
  const b = BODY[stage];
  const ground = Math.round(groundUnits * 2);
  const flying = pose === 'jump';
  if (!flying) groundShadow(Math.round(x * 2), ground, (pose === 'lying' ? b.L : b.L + b.hw * 0.5) + 8);
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(facing, 1);
  const args = { ground, pose, frame, now, face, look, equipped, scratch, itch };
  const box = pose === 'lying' ? drawLying(b, args) : pose === 'sit' || pose === 'itch' ? drawSitting(b, args) : drawStanding(b, args);
  ctx.restore();
  const hw = box.hw ?? b.hw;
  const sx = (fine) => x + (facing * fine) / 2; // fine pixels from the cat's middle -> room units
  const [l, r] = [sx(box.left), sx(box.right)].sort((a, b2) => a - b2);
  const headLeft = Math.min(sx(box.hx), sx(box.hx + hw));
  return { x: l, y: box.top / 2, w: r - l, h: (ground - box.top) / 2, headX: headLeft, headY: box.hy / 2, hw: hw / 2 };
}
