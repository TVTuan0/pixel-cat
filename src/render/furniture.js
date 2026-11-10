// Room furniture and fittings at double resolution. Every number is in fine pixels (half a room unit).
// Each item keeps the place and size it had at single resolution.
import { F, fineShape, fineLine } from './fine.js';
import { active } from './effects.js';
import { drawSprite } from './sprites.js';

export const WOOD = '#8a5a2a';
export const WOOD_DARK = '#5a3a1e';
export const WOOD_LIGHT = '#b5824e';
const INK = '#3a2418';

// ---- Walls and floor ----

// Wood trim: a strip under the ceiling, a rail across the middle, skirting at the floor, and shaded corners.
export function drawWallTrim(ctx, floorY) {
  ctx.fillStyle = 'rgba(110, 70, 30, 0.08)';
  ctx.fillRect(0, 52, 160, floorY - 52);
  F(ctx, 0, 0, 320, 5, WOOD);
  F(ctx, 0, 1, 320, 1, WOOD_LIGHT);
  F(ctx, 0, 5, 320, 1, WOOD_DARK);
  F(ctx, 0, 6, 320, 1, 'rgba(60,35,15,0.15)');
  F(ctx, 0, 98, 320, 1, WOOD_LIGHT);
  F(ctx, 0, 99, 320, 4, WOOD);
  F(ctx, 0, 103, 320, 1, WOOD_DARK);
  F(ctx, 0, 104, 320, 1, 'rgba(60,35,15,0.15)');
  const skirt = floorY * 2 - 8;
  F(ctx, 0, skirt, 320, 1, WOOD_LIGHT);
  F(ctx, 0, skirt + 1, 320, 6, WOOD);
  F(ctx, 0, skirt + 3, 320, 1, 'rgba(255,255,255,0.08)');
  F(ctx, 0, skirt + 7, 320, 1, WOOD_DARK);
  for (let i = 0; i < 12; i++) {
    const shade = `rgba(60, 35, 15, ${(0.13 - i * 0.011).toFixed(3)})`;
    F(ctx, i, 0, 1, floorY * 2, shade);
    F(ctx, 319 - i, 0, 1, floorY * 2, shade);
  }
}

// Wood planks, each one a slightly different shade, with a lit top edge, seams, grain and the odd knot.
export function drawPlanks(ctx, f, floorY) {
  const top0 = floorY * 2;
  for (let top = top0, row = 0; top < 240; top += 14, row++) {
    for (let x = -((row * 22) % 56), k = 0; x < 320; x += 56, k++) {
      const tone = [f.base, f.light, f.dark][(row * 7 + k * 5) % 3];
      F(ctx, x, top, 56, 13, tone);
      F(ctx, x, top, 56, 1, f.light);
      F(ctx, x + 6 + ((row + k) % 3) * 10, top + 4 + (k % 2) * 3, 16, 1, f.dark);
      F(ctx, x + 26 + ((row + k) % 2) * 8, top + 9, 12, 1, f.dark);
      if ((row + k) % 4 === 0) F(ctx, x + 42, top + 5, 3, 2, f.line); // knot
      F(ctx, x + 55, top, 1, 13, f.line);
    }
    F(ctx, 0, top + 13, 320, 1, f.line);
  }
}

export function drawTiles(ctx, f, floorY) {
  for (let y = floorY * 2, r = 0; y < 240; y += 16, r++) {
    for (let x = 0, c = 0; x < 320; x += 16, c++) {
      F(ctx, x, y, 16, 16, (r + c) % 2 ? f.line : f.base);
      F(ctx, x, y, 16, 1, 'rgba(255,255,255,0.35)');
      F(ctx, x, y + 15, 16, 1, 'rgba(0,0,0,0.08)');
    }
  }
}

export function drawCarpet(ctx, f, floorY) {
  for (let y = floorY * 2 + 2; y < 240; y += 4) {
    for (let x = (y * 3) % 7; x < 320; x += 7) F(ctx, x, y, 1, 1, f.line);
  }
}

// ---- Window, curtains, clock, door ----

// The window frame around the sky (the sky itself is drawn separately inside it).
export function drawWindowFrame(ctx) {
  F(ctx, 112, 24, 64, 4, WOOD);
  F(ctx, 112, 76, 64, 4, WOOD);
  F(ctx, 112, 24, 4, 56, WOOD);
  F(ctx, 172, 24, 4, 56, WOOD);
  F(ctx, 112, 24, 64, 1, WOOD_LIGHT);
  F(ctx, 112, 24, 1, 56, WOOD_LIGHT);
  F(ctx, 116, 28, 56, 1, WOOD_DARK); // inner shadow
  F(ctx, 116, 28, 1, 48, WOOD_DARK);
  F(ctx, 142, 28, 4, 48, WOOD);
  F(ctx, 142, 28, 1, 48, WOOD_LIGHT);
  F(ctx, 116, 50, 56, 4, WOOD);
  F(ctx, 116, 50, 56, 1, WOOD_LIGHT);
  // Shine on the glass.
  for (const [x, y] of [[120, 32], [148, 32], [120, 56], [148, 56]]) {
    for (let i = 0; i < 5; i++) F(ctx, x + i, y + 6 - i, 1, 1, 'rgba(255,255,255,0.45)');
    for (let i = 0; i < 3; i++) F(ctx, x + 3 + i, y + 9 - i, 1, 1, 'rgba(255,255,255,0.3)');
  }
  // Sill.
  F(ctx, 108, 80, 72, 4, '#7a4c22');
  F(ctx, 108, 80, 72, 1, WOOD_LIGHT);
  F(ctx, 108, 84, 72, 1, 'rgba(60,35,15,0.25)');
}

export function drawCurtains(ctx, now) {
  F(ctx, 92, 18, 104, 3, '#6b4420');
  F(ctx, 92, 18, 104, 1, WOOD_LIGHT);
  F(ctx, 89, 16, 5, 6, '#c8a24a');
  F(ctx, 194, 16, 5, 6, '#c8a24a');
  const sway = Math.round(Math.sin(now / 900) * 2);
  const folds = ['#f08ea2', '#e07a8f', '#e07a8f', '#c45d74'];
  for (const [x, flip] of [[96, 1], [174, -1]]) {
    for (let c = 0; c < 18; c++) {
      const color = folds[c % 4];
      F(ctx, x + c, 21, 1, 39, color);
      // Below the tie-back the curtain flares out and sways.
      // Below the tie-back the curtain flares out a little and sways; 2 pixels wide so there are no gaps.
      const flare = Math.round((c - 9) * 0.12 * flip) + sway * flip;
      F(ctx, x + c + flare, 66, 2, 26, color);
    }
    F(ctx, x + (flip > 0 ? 2 : 0), 60, 16, 6, folds[1]);
    F(ctx, x, 61, 18, 3, '#f2c14e'); // tie-back
    F(ctx, x, 61, 18, 1, '#ffe08a');
    F(ctx, x - 1, 92, 20, 1, '#c45d74');
  }
}

export function drawClock(ctx, clock) {
  const cx = 226, cy = 38;
  fineShape(ctx, cx - 15, cy - 15, 30, 30, '#fffaf0', WOOD, { round: 2 });
  fineShape(ctx, cx - 14, cy - 14, 28, 28, '#fffaf0', '#c89a60', { round: 2 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const len = i % 3 === 0 ? 2 : 1;
    F(ctx, Math.round(cx + Math.sin(a) * 11), Math.round(cy - Math.cos(a) * 11), len, len, WOOD_DARK);
  }
  const minutes = clock.getMinutes();
  const hours = (clock.getHours() % 12) + minutes / 60;
  const ha = (hours / 12) * Math.PI * 2;
  const ma = (minutes / 60) * Math.PI * 2;
  fineLine(ctx, cx, cy, Math.round(cx + Math.sin(ha) * 6), Math.round(cy - Math.cos(ha) * 6), '#2a1d3a');
  fineLine(ctx, cx + 1, cy, Math.round(cx + 1 + Math.sin(ha) * 6), Math.round(cy - Math.cos(ha) * 6), '#2a1d3a');
  fineLine(ctx, cx, cy, Math.round(cx + Math.sin(ma) * 10), Math.round(cy - Math.cos(ma) * 10), '#c8553d');
  F(ctx, cx - 1, cy - 1, 3, 3, '#2a1d3a');
}

// The garden door, locked until bought; then its glass shows the green garden.
export function drawGardenDoor(ctx, open, [x, y, w, h]) {
  const X = x * 2, Y = y * 2, W = w * 2, H = h * 2;
  F(ctx, X, Y, W, H, WOOD_DARK);
  F(ctx, X + 2, Y + 2, W - 4, H - 2, open ? '#5aa83e' : '#a86a34');
  F(ctx, X + 2, Y + 2, 1, H - 2, open ? '#7ccf5a' : '#c0824a');
  // Upper panel (glass once open) and lower panel, each with a bevel.
  for (const [py, ph, glass] of [[Y + 6, 18, open], [Y + 30, 28, false]]) {
    F(ctx, X + 6, py, W - 12, ph, glass ? '#cdeeb8' : open ? '#4c9434' : '#8e5426');
    F(ctx, X + 6, py, W - 12, 1, glass ? '#ffffff' : open ? '#3e7a2a' : '#6e4020');
    F(ctx, X + 6, py, 1, ph, glass ? '#ffffff' : open ? '#3e7a2a' : '#6e4020');
    F(ctx, X + 6, py + ph - 1, W - 12, 1, open ? '#7ccf5a' : '#c0824a');
  }
  if (open) {
    F(ctx, X + 8, Y + 14, W - 16, 8, '#8fd06a'); // grass seen through the glass
    F(ctx, X + 14, Y + 8, 4, 6, '#fff2b0');
  }
  F(ctx, X + W - 8, Y + 34, 4, 4, '#c8a020'); // brass knob
  F(ctx, X + W - 8, Y + 34, 2, 2, '#fff2b0');
  if (!open) {
    F(ctx, X + W - 10, Y + 41, 8, 6, '#c8a020'); // padlock
    F(ctx, X + W - 8, Y + 38, 4, 3, '#8a7a60');
    F(ctx, X + W - 7, Y + 43, 2, 2, '#5a4a20');
  }
}

// ---- Furniture ----

export function drawCatTree(ctx, now) {
  fineShape(ctx, 8, 166, 60, 10, '#a87a50', '#6b4420', { round: 4 });
  F(ctx, 10, 167, 56, 2, '#c09068');
  // Sisal post: rope wound around it.
  F(ctx, 31, 100, 12, 68, '#8a7550');
  F(ctx, 32, 100, 10, 68, '#d9c49a');
  for (let y = 101; y < 168; y += 3) {
    F(ctx, 32, y, 10, 1, '#bfa577');
    F(ctx, 32, y + 1, 2, 1, '#bfa577');
  }
  F(ctx, 33, 100, 2, 68, 'rgba(255,255,255,0.25)');
  // Platforms with soft fabric tops.
  for (const [x, y, w] of [[10, 90, 48], [42, 126, 26]]) {
    fineShape(ctx, x, y, w, 10, '#7a6ad6', '#3a2a6a', { round: 5 });
    F(ctx, x + 2, y + 2, w - 4, 2, '#9a8ae6');
    F(ctx, x + 2, y + 7, w - 4, 1, '#5a4aa6');
  }
  // Dangling toy.
  const swing = Math.round(Math.sin(now / 500) * 2);
  fineLine(ctx, 52, 100, 52 + swing, 112, '#4a3a2a');
  fineShape(ctx, 49 + swing, 112, 7, 7, '#ff5a6e', '#a02a3a', { round: 2 });
  F(ctx, 51 + swing, 113, 2, 2, '#ffb3c1');
}

export function drawSofa(ctx) {
  const base = '#5b8bd9', dark = '#2f4f8a', light = '#7fa6e6', lighter = '#a3c0f0';
  fineShape(ctx, 92, 100, 104, 42, base, dark, {
    round: 5,
    inside: () => {
      F(ctx, 92, 100, 104, 3, light);
      F(ctx, 92, 134, 104, 8, '#4a76c2');
    },
  });
  // Two back cushions.
  for (const x of [102, 146]) {
    fineShape(ctx, x, 104, 42, 28, base, dark, {
      round: 4,
      inside: () => {
        F(ctx, x + 3, 106, 36, 3, lighter);
        F(ctx, x + 3, 109, 2, 18, light);
        F(ctx, x, 126, 42, 6, '#4a76c2');
      },
    });
  }
  // Arms.
  for (const x of [88, 180]) {
    fineShape(ctx, x, 118, 20, 50, light, dark, {
      round: 3,
      inside: () => {
        F(ctx, x + 2, 120, 6, 4, lighter);
        F(ctx, x + 12, 118, 8, 50, base);
      },
    });
  }
  // Seat cushions and the front.
  for (const x of [106, 144]) {
    fineShape(ctx, x, 130, 40, 16, light, dark, {
      round: 3,
      inside: () => {
        F(ctx, x + 2, 132, 36, 2, lighter);
        F(ctx, x, 142, 40, 4, base);
      },
    });
  }
  F(ctx, 106, 146, 78, 18, base);
  F(ctx, 106, 147, 78, 1, light);
  F(ctx, 106, 160, 78, 4, '#4a76c2');
  F(ctx, 106, 164, 78, 1, dark);
  for (const x of [98, 186]) {
    F(ctx, x, 166, 6, 7, WOOD_DARK);
    F(ctx, x, 166, 2, 7, WOOD);
  }
}

const BOOK_COLORS = ['#e8384f', '#3a7bff', '#f2c14e', '#5cc96b', '#9b7bff', '#ff8fa3', '#ff9f43'];
export function drawBookshelf(ctx) {
  F(ctx, 252, 60, 44, 114, WOOD);
  F(ctx, 252, 60, 44, 2, WOOD_LIGHT);
  F(ctx, 252, 60, 2, 114, WOOD_LIGHT);
  F(ctx, 294, 60, 2, 114, WOOD_DARK);
  F(ctx, 256, 64, 36, 106, WOOD_DARK);
  for (let y = 68; y < 170; y += 9) F(ctx, 258, y, 30, 1, '#4e321a'); // back panel boards
  [92, 120, 148].forEach((y, shelf) => {
    let x = 258;
    for (let i = 0; x < 288 && i < 7; i++) {
      const h = 14 + ((i + shelf) % 3) * 4;
      const w = 4 + ((i + shelf * 2) % 3);
      const color = BOOK_COLORS[(i + shelf * 2) % BOOK_COLORS.length];
      F(ctx, x, y - h, w, h, color);
      F(ctx, x, y - h, 1, h, 'rgba(255,255,255,0.25)');
      F(ctx, x, y - h + 2, w, 1, 'rgba(255,255,255,0.45)'); // gold bands on the spine
      F(ctx, x, y - 4, w, 1, 'rgba(0,0,0,0.25)');
      x += w + 1;
    }
    F(ctx, 256, y, 36, 4, WOOD);
    F(ctx, 256, y, 36, 1, WOOD_LIGHT);
    F(ctx, 256, y + 4, 36, 1, 'rgba(0,0,0,0.3)');
  });
  // A little plant pot on the bottom shelf.
  fineShape(ctx, 260, 158, 12, 10, '#d0704a', '#7a3a2a', { round: 3 });
  F(ctx, 259, 157, 14, 2, '#b85a38');
  for (const [lx, ly] of [[262, 150], [266, 148], [269, 151], [264, 153]]) fineShape(ctx, lx, ly, 4, 6, '#5cc96b', '#2e7d32', { round: 2 });
}

export function drawLamp(ctx, lit) {
  F(ctx, 302, 76, 6, 92, '#3a3a4a');
  F(ctx, 303, 76, 4, 92, '#5a5a6a');
  F(ctx, 304, 76, 1, 92, '#8a8a9a');
  fineShape(ctx, 294, 166, 22, 6, '#4a4a5a', '#2a2a3a', { round: 3 });
  // Pleated shade.
  for (let i = 0; i < 20; i++) {
    const w = 16 + Math.floor(i * 0.5);
    const left = 305 - Math.floor(w / 2);
    F(ctx, left, 56 + i, w, 1, lit ? '#fff2b0' : '#ffd27f');
    for (let p = left + 2; p < left + w - 1; p += 3) F(ctx, p, 56 + i, 1, 1, lit ? '#ffe68a' : '#e8b860');
  }
  F(ctx, 297, 55, 16, 2, WOOD);
  F(ctx, 293, 75, 24, 2, WOOD);
  if (lit) F(ctx, 299, 77, 12, 1, 'rgba(255,240,180,0.8)');
}

export function drawFishbowlTable(ctx, now) {
  F(ctx, 202, 152, 40, 6, WOOD);
  F(ctx, 202, 152, 40, 1, WOOD_LIGHT);
  F(ctx, 202, 157, 40, 1, WOOD_DARK);
  for (const x of [206, 234]) {
    F(ctx, x, 158, 4, 16, WOOD_DARK);
    F(ctx, x, 158, 1, 16, WOOD);
  }
  // The bowl: glass, water, a goldfish and a rising bubble.
  fineShape(ctx, 210, 128, 24, 23, '#d8f0ff', '#6cc3ff', {
    round: 2,
    inside: () => {
      F(ctx, 210, 134, 24, 17, '#7ccaff');
      F(ctx, 210, 134, 24, 1, '#b8e4ff');
      const swim = Math.round(Math.sin(now / 700) * 4);
      fineShape(ctx, 218 + swim, 140, 7, 5, '#ff8a3d', '#c85a1e', { round: 2 });
      F(ctx, 224 + swim, 141, 3, 3, '#ff8a3d');
      F(ctx, 219 + swim, 141, 1, 1, '#1a1210');
      F(ctx, 213, 136, 2, 8, 'rgba(255,255,255,0.5)');
    },
  });
  F(ctx, 214, 127, 16, 2, '#9fd6ff');
  const rise = Math.floor(now / 200) % 8;
  F(ctx, 226, 145 - rise * 1.5, 2, 2, '#e8f6ff');
}

export function drawFrame(ctx) {
  F(ctx, 208, 64, 36, 28, WOOD);
  F(ctx, 208, 64, 36, 1, WOOD_LIGHT);
  F(ctx, 208, 64, 1, 28, WOOD_LIGHT);
  F(ctx, 243, 64, 1, 28, WOOD_DARK);
  F(ctx, 208, 91, 36, 1, WOOD_DARK);
  F(ctx, 211, 67, 30, 22, '#f6ecd8');
  F(ctx, 213, 69, 26, 18, '#9fd6ff');
  F(ctx, 213, 81, 26, 6, '#6cc3ff');
  // A fish in the picture.
  fineShape(ctx, 219, 74, 11, 7, '#3a7bff', '#1a3a8a', { round: 2 });
  F(ctx, 229, 74, 4, 7, '#3a7bff');
  F(ctx, 221, 76, 1, 1, '#ffffff');
}

export function drawBed(ctx) {
  fineShape(ctx, 40, 206, 56, 20, '#c0587a', '#7a2e45', {
    round: 4,
    inside: () => {
      F(ctx, 40, 207, 56, 2, '#d8789a');
      F(ctx, 40, 220, 56, 6, '#a04462');
    },
  });
  fineShape(ctx, 47, 209, 42, 12, '#ffb3c6', '#d07090', {
    round: 3,
    inside: () => F(ctx, 50, 210, 20, 2, '#ffd6e0'),
  });
}

export function drawCushion(ctx) {
  fineShape(ctx, 44, 210, 48, 14, '#c9b08a', '#6b5040', {
    round: 3,
    inside: () => {
      F(ctx, 46, 211, 30, 2, '#dcc6a2');
      F(ctx, 56, 214, 4, 2, '#a08860'); // worn patches
      F(ctx, 76, 216, 6, 2, '#a08860');
      for (let x = 50; x < 88; x += 4) F(ctx, x, 221, 2, 1, '#8a7050'); // stitches
    },
  });
}

export function drawBeanbag(ctx) {
  fineShape(ctx, 184, 192, 40, 26, '#ff9f43', '#a0521d', {
    round: 2.2,
    inside: () => {
      F(ctx, 212, 192, 12, 26, '#e8862c');
      F(ctx, 184, 212, 40, 6, '#e8862c');
      fineLine(ctx, 196, 200, 204, 206, '#d07a2a');
      fineLine(ctx, 206, 204, 214, 200, '#d07a2a');
    },
  });
  fineShape(ctx, 190, 186, 28, 14, '#ffb060', '#a0521d', {
    round: 2.2,
    inside: () => F(ctx, 194, 188, 10, 3, '#ffd09a'),
  });
}

export function drawRug(ctx) {
  for (let y = 202; y < 226; y += 3) {
    F(ctx, 115, y, 6, 1, '#f2e2c0'); // fringe
    F(ctx, 215, y, 6, 1, '#f2e2c0');
  }
  fineShape(ctx, 120, 200, 96, 28, '#c8553d', '#8a3020', {
    round: 6,
    inside: () => {
      F(ctx, 124, 205, 88, 1, '#f2c14e');
      F(ctx, 124, 222, 88, 1, '#f2c14e');
      for (let x = 132; x < 208; x += 12) {
        F(ctx, x + 3, 210, 2, 1, '#f2c14e'); // little diamonds
        F(ctx, x + 2, 211, 4, 2, '#f2c14e');
        F(ctx, x + 3, 213, 2, 1, '#f2c14e');
      }
      F(ctx, 120, 200, 96, 2, '#d8705a');
    },
  });
}

export function drawLitter(ctx, cleanliness, now) {
  fineShape(ctx, 276, 200, 32, 13, '#7fb8d6', '#3c5a6e', {
    round: 5,
    inside: () => {
      F(ctx, 276, 201, 32, 4, '#f1d9a7');
      for (let x = 279; x < 306; x += 3) F(ctx, x, 202 + (x % 2), 1, 1, '#d8bc84');
      F(ctx, 276, 206, 32, 1, '#a8d8f0');
    },
  });
  const specks = Math.ceil((100 - cleanliness) / 15);
  const spots = [[282, 202], [292, 202], [300, 202], [286, 201], [296, 201], [280, 201], [302, 201]];
  for (let i = 0; i < specks && i < spots.length; i++) F(ctx, spots[i][0], spots[i][1], 3, 2, '#8a6a4a');
  if (cleanliness < 40) {
    const wave = Math.floor(now / 300) % 2;
    for (const sx of [284, 294, 304]) {
      F(ctx, sx + wave, 186, 1, 3, '#7fae5a');
      F(ctx, sx + 1 - wave, 189, 1, 3, '#7fae5a');
      F(ctx, sx + wave, 192, 1, 3, '#7fae5a');
    }
  }
  if (active('sparkle', now)) { // just cleaned
    const k = Math.floor(now / 120) % 2;
    drawSprite(ctx, 'sparkle', 140 + k * 6, 95 - k);
    drawSprite(ctx, 'sparkle', 148 - k * 4, 97 + k);
  }
}

export function drawBowl(ctx, now) {
  const full = active('bowlFull', now) || active('eat', now);
  fineShape(ctx, 100, 212, 20, 9, '#5ab0ff', '#2a4a7a', {
    round: 2.5,
    inside: () => {
      F(ctx, 100, 213, 20, 2, '#a8d8ff');
      F(ctx, 100, 218, 20, 3, '#3a8ad8');
    },
  });
  if (full) {
    for (const [x, y] of [[104, 210], [107, 209], [110, 210], [113, 209], [106, 211], [112, 211]]) F(ctx, x, y, 3, 2, '#b06a3b');
  }
}

export function drawPlant(ctx, now) {
  const sway = Math.floor(now / 800) % 2;
  for (const [lx, ly, lw, lh] of [[70, 148, 5, 10], [74, 144, 5, 12], [79, 147, 5, 10], [67, 153, 6, 6], [80, 152, 6, 6]]) {
    fineShape(ctx, lx + (ly < 147 ? sway : 0), ly, lw, lh, '#5cc96b', '#2e7d32', { round: 2 });
  }
  fineLine(ctx, 76, 150, 76, 158, '#2e7d32');
  fineShape(ctx, 70, 160, 14, 12, '#d0704a', '#7a3a2a', {
    round: 3,
    inside: () => F(ctx, 72, 162, 3, 8, '#e08a60'),
  });
  F(ctx, 68, 158, 18, 3, '#b85a38');
  F(ctx, 68, 158, 18, 1, '#d0805a');
}

export function drawAutoFeeder(ctx) {
  fineShape(ctx, 122, 196, 16, 14, '#d8e0ea', '#3a3a5a', {
    round: 3,
    inside: () => {
      F(ctx, 124, 197, 4, 12, '#eef2f8');
      F(ctx, 126, 199, 8, 6, '#b06a3b'); // kibble behind the window
      F(ctx, 126, 199, 8, 1, '#d8945a');
      F(ctx, 127, 200, 2, 3, 'rgba(255,255,255,0.5)');
    },
  });
  F(ctx, 134, 207, 2, 2, '#5cc96b'); // power light
  fineShape(ctx, 119, 208, 22, 7, '#5ab0ff', '#2a4a7a', { round: 2.5, inside: () => F(ctx, 120, 209, 20, 2, '#a8d8ff') });
}

export function drawLitterHood(ctx) {
  fineShape(ctx, 276, 184, 32, 22, '#9fd6ff', '#3c5a6e', {
    round: 2.2,
    inside: () => {
      F(ctx, 280, 186, 12, 2, '#d8f0ff'); // shine
      F(ctx, 276, 200, 32, 6, '#7fb8d6');
      fineShape(ctx, 286, 192, 12, 14, '#2a2a3a', '#2a2a3a', { round: 2 }); // the way in
      F(ctx, 300, 190, 3, 2, '#5cc96b'); // ready light
    },
  });
}
