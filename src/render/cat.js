// Draws the cat: front view when sitting or sleeping, side view when walking or jumping.
// Cats are drawn at double resolution: every number below is in fine pixels (half a room unit),
// while the functions take and return room units like the rest of the game.
import { FURS, drawSprite } from './sprites.js';

// Colors of the cat being drawn right now, and the context; set at the start of each draw call.
let C = FURS.orange;
let ctx = null;

// One fine pixel block: x, y, w, h in fine pixels.
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

const COLLAR_COLORS = { collar_red: '#e8384f', collar_blue: '#3a7bff', collar_gold: '#8b4513' };

// The dark face, ears, paws and tail of a Siamese; other furs use their normal color.
const pointsOr = (color) => C.points ?? color;
// Whiskers show light on dark cats and dark on light ones.
const whiskerColor = () => (['#2a2a34', '#3a3a48'].includes(C.fur) ? '#d8d8e4' : C.outline);

// The rows of a rounded shape (a "squircle"): [left, right, y] per row, in fine pixels.
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
function shape(x, y, w, h, fill, { round = 3, inside = null } = {}) {
  for (const [l, r, row] of rowsOf(x, y, w, h, round)) P(l, row, r - l, 1, C.outline);
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

// A thick line through `points` (fine pixels): an outline 2 wider than the fill.
function thickLine(points, width, fill) {
  for (const [x, y] of points) P(x - 1, y - 1, width + 2, width + 2, C.outline);
  for (const [x, y] of points) P(x, y, width, width, fill);
}

// A pointed ear. `x` is its left edge at the base, `base` the y of the base; `outward` -1 tips it left, 1 right.
function ear(x, base, w, h, outward, inner = true) {
  for (let i = 0; i < h; i++) {
    const rowW = Math.max(1, Math.round((w * (i + 1)) / h));
    const left = outward < 0 ? x : x + w - rowW;
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

// Eyes, `w` fine pixels wide. Colored eyes (yellow, green, blue) get a dark slit pupil.
function drawEye(x, y, w, kind, lookX = 0) {
  const h = w + 1;
  if (kind === 'open') {
    if (C.eye === '#2a1d1d') {
      P(x, y, w, h, C.eye); // dark eyes: one shiny bead
    } else {
      P(x, y, w, h, C.eye); // colored eyes: iris with a dark pupil
      P(x + Math.floor((w - 1) / 2) + lookX, y, w > 3 ? 2 : 1, h, '#1a1210'); // a slit, top to bottom
    }
    P(x + lookX, y, 1, 1, C.white);
    if (w > 3) P(x + w - 1 + lookX, y + h - 2, 1, 1, 'rgba(255,255,255,0.5)');
  } else if (kind === 'happy') {
    P(x, y + 2, 1, 2, C.outline);
    P(x + 1, y + 1, w - 2, 1, C.outline);
    P(x + w - 1, y + 2, 1, 2, C.outline);
  } else if (kind === 'sleepy') {
    P(x, y + 2, w, 1, C.outline);
    P(x, y + 3, w, 2, C.eye);
    P(x + 1, y + 3, 1, 1, C.white);
  } else if (kind === 'grumpy') {
    P(x, y + 2, w, 1, C.outline);
    P(x, y + 3, w, 2, C.eye);
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

// Hats are sprites in room units, placed from the head box.
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
  P(mid, y + 2, 3, 3, collar === 'collar_gold' ? '#ffcf3a' : '#ffd84a'); // tag
  P(mid + 1, y + 3, 1, 1, '#fff4c0');
}

// Tabby stripes and calico patches, drawn inside a body shape.
function bodyMarkings(x, y, w, h) {
  if (C.stripes) {
    for (let i = 0; i < 4; i++) {
      P(x + 2, y + 5 + i * 5, 4, 1, C.stripe);
      P(x + 2, y + 6 + i * 5, 2, 1, C.stripe);
      P(x + w - 6, y + 5 + i * 5, 4, 1, C.stripe);
      P(x + w - 4, y + 6 + i * 5, 2, 1, C.stripe);
    }
  }
  if (C.patch) {
    P(x + 1, y + 4, 7, 6, C.patch);
    P(x + w - 9, y + h - 9, 8, 5, C.stripe);
  }
}

// A back leg reaching up the left side to scratch behind the ear. `up` 0 or 1 moves the paw.
function drawItchPaw(bodyLeft, ground, headX, headY, up) {
  const pawX = headX - 8;
  const pawY = headY + 2 - up * 4;
  const points = [];
  for (let y = ground - 6, x = bodyLeft + 2; y > pawY + 6; y -= 2, x = Math.max(pawX + 4, x - 1)) points.push([x, y]);
  thickLine(points, 3, C.fur);
  shape(pawX, pawY, 9, 8, pointsOr(C.furLight), { round: 2 });
  P(pawX + 3, pawY, 1, 2, C.outline); // toes
  P(pawX + 5, pawY, 1, 2, C.outline);
}

// Front view. `lying` draws the curled-up shape (sleeping, or a newborn). `itch` (0/1, or null) scratches an ear.
// Takes and returns room units; the returned box is used for taps, hearts and speech bubbles.
export function drawFrontCat(context, { size, cx: cxUnits, ground: groundUnits, face, lying, look, bob, now, equipped, palette, itch = null }) {
  ctx = context;
  C = palette;
  const cx = Math.round(cxUnits * 2);
  const ground = Math.round(groundUnits * 2);
  const hw = size.hw * 2, hh = size.hh * 2, earH = size.ear * 2;
  const bw = (lying ? size.bw + 7 : size.bw) * 2;
  const bh = (lying ? size.bh - 3 : size.bh) * 2;
  const bodyX = cx - bw / 2;
  const bodyY = ground - bh;
  const headX = lying ? cx - hw / 2 - Math.round(bw * 0.12) : cx - hw / 2;
  const headY = lying ? bodyY - hh + 12 + bob * 2 : bodyY - hh + 6 + bob * 2;

  groundShadow(cx, ground, bw + 10);

  // Tail behind the body: up and swaying when sitting, wrapped around the front when lying.
  const sway = lying ? 0 : [0, 1, 2, 1, 0, -1, -2, -1][Math.floor(now / 160) % 8];
  const tail = [];
  if (lying) for (let i = 0; i < 12; i++) tail.push([bodyX + bw - 6 - i * 2, ground - 5 + Math.round(Math.sin(i / 4))]);
  else for (let i = 0; i < 14; i++) tail.push([bodyX + bw - 4 + Math.min(i, 6) + Math.round((i / 14) * sway), ground - 6 - Math.max(0, i - 3) * 2]);
  thickLine(tail, 3, pointsOr(C.fur));
  if (!C.points) P(tail[tail.length - 1][0], tail[tail.length - 1][1], 3, 3, C.stripe); // tip

  shape(bodyX, bodyY, bw, bh, C.fur, {
    round: 2.6,
    inside: () => {
      P(bodyX + bw - 7, bodyY, 6, bh, C.shade); // far side in shade
      P(bodyX, bodyY + bh - 4, bw, 4, C.shade);
      bodyMarkings(bodyX, bodyY, bw, bh);
    },
  });
  // Chest and belly.
  shape(cx - Math.round(bw * 0.24), bodyY + 3, Math.round(bw * 0.48), bh - 6, C.furLight, { round: 2.2 });
  if (!lying) {
    for (const px of [cx - 9, cx + 2]) {
      shape(px, ground - 6, 8, 6, pointsOr(C.furLight), { round: 2 });
      P(px + 3, ground - 4, 1, 3, C.outline); // toes
      P(px + 5, ground - 4, 1, 3, C.outline);
    }
  }

  // Ears go behind the head.
  const earW = Math.round(hw * 0.38);
  ear(headX + 2, headY + 4, earW, earH + 3, -1);
  ear(headX + hw - 2 - earW, headY + 4, earW, earH + 3, 1);

  const ey = headY + Math.round(hh * 0.42);
  const eyeW = hw >= 34 ? 4 : 3;
  const gap = Math.round(hw * 0.17) + 1;
  shape(headX, headY, hw, hh, C.fur, {
    round: 2.4,
    inside: () => {
      P(headX + hw - 5, headY, 4, hh, C.shade);
      P(headX + 3, headY + 2, 5, 1, 'rgba(255,255,255,0.18)'); // light on the crown
      if (C.stripes) {
        P(cx - 4, headY + 2, 1, 5, C.stripe);
        P(cx, headY + 1, 1, 7, C.stripe);
        P(cx + 4, headY + 2, 1, 5, C.stripe);
        P(headX + 1, ey + 2, 4, 1, C.stripe);
        P(headX + hw - 5, ey + 2, 4, 1, C.stripe);
      }
      if (C.patch) P(headX + hw - 11, headY + 1, 9, 8, C.patch);
      if (C.points) shape(cx - gap - eyeW - 4, ey - 3, (gap + eyeW + 4) * 2, hh - (ey - headY) + 6, C.points, { round: 2 });
    },
  });

  // Muzzle, nose, whiskers, eyes, mouth.
  const muzzleY = ey + eyeW;
  if (!C.points) shape(cx - 6, muzzleY - 1, 13, 8, C.furLight, { round: 2 });
  P(cx - 2, muzzleY, 5, 2, C.pink);
  P(cx - 1, muzzleY + 2, 3, 1, C.pink);
  const whisker = whiskerColor();
  for (const dy of [0, 3, 5]) {
    P(headX - 4, muzzleY + dy, 8, 1, whisker);
    P(headX + hw - 4, muzzleY + dy, 8, 1, whisker);
  }
  const lookX = face.eyes === 'open' ? look : 0;
  drawEye(cx - gap - eyeW, ey, eyeW, face.eyes, lookX);
  drawEye(cx + gap + 1, ey, eyeW, face.eyes, lookX);
  if (face.eyes === 'grumpy') {
    P(cx - gap - eyeW - 1, ey - 1, 2, 1, C.outline);
    P(cx - gap - eyeW + 1, ey, eyeW - 1, 1, C.outline);
    P(cx + gap + eyeW, ey - 1, 2, 1, C.outline);
    P(cx + gap + 1, ey, eyeW - 1, 1, C.outline);
  }
  drawMouth(cx, muzzleY + 4, face.mouth);
  if (face.blush) {
    ctx.fillStyle = 'rgba(255, 140, 160, 0.55)';
    ctx.fillRect((cx - gap - eyeW - 4) / 2, (muzzleY + 1) / 2, 2, 1);
    ctx.fillRect((cx + gap + eyeW + 1) / 2, (muzzleY + 1) / 2, 2, 1);
  }

  drawCollar(equipped.collar, cx - Math.round(hw * 0.28), headY + hh - 3, Math.round(hw * 0.56));
  drawHat(equipped.hat, headX, headY, hw);
  if (itch !== null && !lying) drawItchPaw(bodyX, ground, headX, headY, itch);

  const left = Math.min(headX, bodyX);
  return {
    x: left / 2 - 1, y: (headY - earH) / 2, w: Math.max(hw, bw) / 2 + 2, h: (ground - headY + earH) / 2,
    headX: headX / 2, headY: headY / 2, hw: hw / 2,
  };
}

// Claw marks in front of a scratching cat, flickering with each swipe.
function drawClawMarks(x, y, swipe) {
  for (let m = 0; m < 3; m++) for (let i = 0; i < 6; i++) P(x + m * 3 + Math.floor(i / 2), y + i + swipe * 2, 1, 1, '#5a3a1e');
}

// Side view facing right; `facing` -1 mirrors it. `frame` 0-3 moves the legs; `jumping` stretches them.
// `crouch` lowers the body and wiggles the back end before a pounce.
// `scratch` (0/1, or null) raises the front paws in turn to scratch whatever is in front.
export function drawSideCat(context, { size, x, ground: groundUnits, facing, frame, jumping, face, equipped, now, palette, crouch = false, scratch = null }) {
  ctx = context;
  C = palette;
  const L = size.side.L * 2, H = size.side.H * 2, hw = size.side.hw * 2, hh = size.side.hh * 2;
  const leg = crouch ? 0 : size.side.leg * 2;
  const earH = size.ear * 2;
  const ground = Math.round(groundUnits * 2);
  const bob = !jumping && !crouch && scratch === null && frame % 2 === 1 ? 2 : 0;
  const wiggle = crouch ? [0, 2, 0, -2][Math.floor(now / 90) % 4] : 0;

  if (!jumping) groundShadow(Math.round(x * 2), ground, L + 12);
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(facing, 1);

  const bx = -Math.round(L / 2);
  const bodyTop = ground - leg - H + 1 - bob;
  const legTop = bodyTop + H - 4;

  // Tail, raised behind the body.
  const sway = [0, 1, 2, 1, 0, -1, -2, -1][Math.floor(now / (crouch ? 80 : 140)) % 8];
  const tail = [];
  for (let i = 0; i < 11; i++) {
    const back = Math.min(i, 4) * 2;
    const hook = i > 8 ? (i - 8) * 2 : 0;
    tail.push([bx + 2 + wiggle - back + hook + Math.round((i / 11) * sway), bodyTop + 6 - Math.max(0, i - 2) * 2 - Math.min(i, 2)]);
  }
  thickLine(tail, 3, pointsOr(C.fur));
  if (!C.points) P(tail[tail.length - 1][0], tail[tail.length - 1][1], 3, 3, C.stripe);

  // Legs: diagonal pairs step together. Jumping stretches front legs forward and back legs back.
  const xs = [bx + 2, bx + 8, bx + L - 14, bx + L - 8];
  const step = [2, 0, -2, 0][frame % 4];
  xs.forEach((lx, i) => {
    if (scratch !== null && i >= 2) return; // front paws are up, drawn below
    const pairA = i === 0 || i === 3;
    const dx = jumping ? (i < 2 ? -4 : 4) : pairA ? step : -step;
    const lifted = !jumping && !crouch && dx > 0 ? 2 : 0;
    const h = leg + 3 + bob - lifted;
    const far = i === 1 || i === 2; // far legs are a touch darker
    P(lx + dx, legTop, 5, h, C.outline);
    P(lx + dx + 1, legTop, 3, h - 1, pointsOr(far ? C.shade : C.fur));
    P(lx + dx + 1, legTop + h - 3, 3, 2, pointsOr(C.furLight));
  });

  shape(bx, bodyTop, L, H, C.fur, {
    round: 2.4,
    inside: () => {
      P(bx, bodyTop, L, 3, C.shade); // darker along the back
      P(bx + 4, bodyTop + H - 6, L - 8, 6, C.furLight); // light belly
      if (C.stripes) for (let i = 0; i < 5; i++) P(bx + 5 + i * 5, bodyTop + 1, 2, H - 7, C.stripe);
      else if (!C.patch && !C.points) for (let i = 0; i < 3; i++) P(bx + 6 + i * 5, bodyTop + 1, 1, 3, C.stripe);
      if (C.patch) {
        P(bx + 4, bodyTop + 2, 8, 6, C.patch);
        P(bx + L - 14, bodyTop + 1, 7, 5, C.stripe);
      }
    },
  });

  const hx = bx + L - Math.round(hw * 0.55);
  const hy = bodyTop - hh + 10;
  // Ears: the far one first, without the pink inside.
  ear(hx + 3, hy + 4, Math.round(hw * 0.32), earH + 2, -1, false);
  shape(hx, hy, hw, hh, C.fur, {
    round: 2.4,
    inside: () => {
      P(hx, hy + hh - 4, hw, 4, C.shade);
      if (C.stripes) {
        P(hx + 6, hy + 2, 1, 4, C.stripe);
        P(hx + 9, hy + 1, 1, 5, C.stripe);
      }
      if (C.patch) P(hx + 2, hy + 1, 7, 6, C.patch);
      if (C.points) shape(hx + hw - 12, hy + Math.round(hh * 0.3), 14, hh, C.points, { round: 2 });
    },
  });
  ear(hx + Math.round(hw * 0.42), hy + 4, Math.round(hw * 0.34), earH + 3, 1);

  const ey = hy + Math.round(hh * 0.4);
  const ex = hx + hw - 9;
  const eyeW = hw >= 30 ? 4 : 3;
  if (!C.points) shape(hx + hw - 9, ey + eyeW - 1, 10, 7, C.furLight, { round: 2 });
  drawEye(ex, ey, eyeW, face.eyes);
  if (face.eyes === 'grumpy') P(ex - 1, ey - 1, eyeW + 1, 1, C.outline);
  P(hx + hw - 2, ey + eyeW, 3, 2, C.pink); // nose
  const mouthY = ey + eyeW + 3;
  P(hx + hw - 5, mouthY, 3, face.mouth === 'open' ? 3 : 1, C.outline);
  const whisker = whiskerColor();
  P(hx + hw - 2, ey + eyeW + 1, 7, 1, whisker);
  P(hx + hw - 2, ey + eyeW + 3, 6, 1, whisker);
  if (face.blush) {
    ctx.fillStyle = 'rgba(255, 140, 160, 0.55)';
    ctx.fillRect((ex - 4) / 2, (ey + eyeW + 1) / 2, 1.5, 1);
  }

  drawCollar(equipped.collar, hx + 2, hy + hh - 5, Math.round(hw * 0.45));
  drawHat(equipped.hat, hx, hy, hw);
  if (scratch !== null) {
    // Two front legs reaching forward from the chest, swiping in turn.
    const chestX = bx + L - 6;
    const chestY = bodyTop + H - 6;
    for (const i of [0, 1]) {
      const reach = i === scratch ? 6 : 0;
      const pawX = chestX + 10 + i * 4;
      const pawY = bodyTop - 2 - reach + i * 4;
      const points = [];
      for (let k = 0; k <= 5; k++) points.push([Math.round(chestX + ((pawX - chestX) * k) / 5), Math.round(chestY + ((pawY - chestY) * k) / 5)]);
      thickLine(points, 3, pointsOr(C.fur));
      P(pawX, pawY, 3, 3, pointsOr(C.furLight));
    }
    drawClawMarks(chestX + 20, bodyTop - 8, scratch);
  }
  ctx.restore();

  const left = x + (facing * bx) / 2;
  const right = x + (facing * (bx + L + 6)) / 2;
  const headLeft = facing > 0 ? x + hx / 2 : x - (hx + hw) / 2;
  return {
    x: Math.min(left, right) - 4, y: (hy - earH) / 2, w: L / 2 + 10, h: (ground - hy + earH) / 2,
    headX: headLeft, headY: hy / 2, hw: hw / 2,
  };
}
