// Shop icons made from the real room drawings, so an icon always looks like the item in the room.
// Each recipe draws the item and says which part of the room to cut out (in room units).
import { RES, ROOM_DOOR, ITEM_BOXES } from './layout.js';
import { spriteCanvas } from './sprites.js';
import {
  drawCatTree, drawSofa, drawBookshelf, drawLamp, drawFishbowlTable, drawFrame, drawBed, drawCushion, drawBeanbag,
  drawRug, drawLitter, drawBowl, drawPlant, drawAutoFeeder, drawLitterHood, drawGardenDoor,
} from './furniture.js';
import { drawWall, drawFloor, drawFairyLights } from './room.js';

const box = (id) => ITEM_BOXES[id];
const RECIPES = {
  bowl: { box: [49, 105, 12, 6], draw: (ctx) => drawBowl(ctx, 0) },
  litter: { box: [137, 99, 18, 8], draw: (ctx) => drawLitter(ctx, 100, 0) },
  cushion: { box: [21, 104, 26, 9], draw: drawCushion },
  cat_tree: { box: box('cat_tree'), draw: (ctx) => drawCatTree(ctx, 0) },
  soft_bed: { box: box('soft_bed'), draw: drawBed },
  auto_feeder: { box: [59, 97, 12, 11], draw: drawAutoFeeder },
  auto_litter: { box: [137, 91, 18, 16], draw: (ctx) => { drawLitter(ctx, 100, 0); drawLitterHood(ctx); } },
  sofa: { box: box('sofa'), draw: drawSofa },
  bookshelf: { box: box('bookshelf'), draw: drawBookshelf },
  lamp: { box: box('lamp'), draw: (ctx) => drawLamp(ctx, false) },
  garden_door: { box: ROOM_DOOR, draw: (ctx) => drawGardenDoor(ctx, true, ROOM_DOOR) },
  decor_plant: { box: [33, 72, 12, 15], draw: (ctx) => drawPlant(ctx, 0) },
  decor_rug: { box: [57, 99, 54, 16], draw: drawRug },
  decor_frame: { box: box('decor_frame'), draw: drawFrame },
  decor_lights: { box: [0, 1, 50, 12], draw: (ctx) => drawFairyLights(ctx, 600, false) },
  decor_beanbag: { box: box('decor_beanbag'), draw: drawBeanbag },
  decor_fishbowl: { box: box('decor_fishbowl'), draw: (ctx) => drawFishbowlTable(ctx, 0) },
};
// Wallpapers and floors: a square of the pattern, small enough to keep every pixel (thin patterns would vanish if shrunk).
for (const id of ['wall_stripes', 'wall_mint', 'wall_stars']) RECIPES[id] = { box: [2, 4, 13, 13], draw: (ctx) => drawWall(ctx, id) };
for (const id of ['floor_dark', 'floor_tiles', 'floor_carpet', 'floor_oak']) RECIPES[id] = { box: [20, 80, 13, 13], draw: (ctx) => drawFloor(ctx, id) };

const MAX_CELLS = { w: 26, h: 24 }; // an icon is at most this many pixels across, shown 2 screen pixels each

// The most common solid color in a block of pixels, or null if the block is mostly empty.
function blockColor(data, width, x0, y0, size) {
  const counts = new Map();
  let solid = 0;
  for (let y = y0; y < y0 + size; y++) {
    for (let x = x0; x < x0 + size; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 128) continue;
      solid++;
      const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  if (solid * 2 < size * size) return null;
  let best = 0, bestCount = -1;
  for (const [key, n] of counts) if (n > bestCount) [best, bestCount] = [key, n];
  return `#${best.toString(16).padStart(6, '0')}`;
}

function drawnIcon({ box: [bx, by, bw, bh], draw }) {
  const full = document.createElement('canvas');
  full.width = bw * RES;
  full.height = bh * RES;
  const ctx = full.getContext('2d');
  ctx.setTransform(RES, 0, 0, RES, -bx * RES, -by * RES);
  draw(ctx);
  // Shrink big items by whole blocks, keeping each block's main color, so pixels stay crisp.
  const step = Math.max(1, Math.ceil(full.width / MAX_CELLS.w), Math.ceil(full.height / MAX_CELLS.h));
  const icon = document.createElement('canvas');
  icon.width = Math.ceil(full.width / step);
  icon.height = Math.ceil(full.height / step);
  const out = icon.getContext('2d');
  const { data } = ctx.getImageData(0, 0, full.width, full.height);
  for (let y = 0; y < icon.height; y++) {
    for (let x = 0; x < icon.width; x++) {
      const color = blockColor(data, full.width, x * step, y * step, Math.min(step, full.width - x * step, full.height - y * step));
      if (!color) continue;
      out.fillStyle = color;
      out.fillRect(x, y, 1, 1);
    }
  }
  icon.className = 'sprite-icon';
  return icon;
}

// Claw marks and a dull shade over an icon, only where the item is (not around it).
export function markBroken(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const { width: w, height: h } = canvas;
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(40, 25, 20, 0.35)';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2a1d1d';
  const left = Math.max(0, Math.floor(w / 2) - 4);
  for (let m = 0; m < 3; m++) for (let i = 0; i < h; i++) ctx.fillRect(left + m * 3 + Math.floor(i / 3), i, 1, 1);
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

// The icon for a shop item: drawn from the room when there is a recipe, else its sprite.
// `scale` is screen pixels per icon pixel.
export function itemIcon(id, { broken = false, scale = 2 } = {}) {
  const canvas = RECIPES[id] ? drawnIcon(RECIPES[id]) : spriteCanvas(id, 4);
  if (RECIPES[id]) {
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
  }
  return broken ? markBroken(canvas) : canvas;
}
