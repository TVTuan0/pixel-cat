// Draws the room: wall, floor, furniture, window weather and light.
import { drawSprite } from './sprites.js';
import { rect, blob, line, disc } from './draw.js';
import { ROOM_W, ROOM_H, FLOOR_Y, ROOM_DOOR } from './layout.js';
import { weatherOf, seasonOf } from '../rules.js';
import { F, fineShape, fineLine } from './fine.js';
import {
  WOOD, WOOD_DARK, drawWallTrim, drawPlanks, drawTiles, drawCarpet, drawWindowFrame, drawCurtains, drawClock, drawGardenDoor,
  drawCatTree, drawSofa, drawBookshelf, drawLamp, drawFishbowlTable, drawFrame, drawBed, drawCushion, drawBeanbag, drawRug,
  drawLitter, drawBowl, drawPlant, drawAutoFeeder, drawLitterHood,
} from './furniture.js';

const WALLS = {
  default: { base: '#ddd0b8', accent: '#cbbb9c', pattern: 'old' },
  wall_stripes: { base: '#ffe3ea', accent: '#ffd0dc', pattern: 'stripes' },
  wall_mint: { base: '#dff5e8', accent: '#9fd8b4', pattern: 'leaves' },
  wall_stars: { base: '#dfe9ff', accent: '#b9c9f5', pattern: 'stars' },
};

const FLOORS = {
  default: { base: '#a07e62', light: '#a8866a', dark: '#967459', line: '#7e5f46', pattern: 'planks', worn: true },
  floor_dark: { base: '#6e4a3a', light: '#7a5444', dark: '#62402f', line: '#4a2e22', pattern: 'planks' },
  floor_oak: { base: '#c4803f', light: '#d39150', dark: '#b37036', line: '#7a4a22', pattern: 'planks', shine: true },
  floor_tiles: { base: '#f3ead8', line: '#9fd3c7', pattern: 'checker' },
  floor_carpet: { base: '#b49ad6', line: '#9a7fc0', pattern: 'speckle' },
};




// A soft shadow on the floor under furniture: [x, y, w] where y is the bottom of the item.
function shadow(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(40, 22, 8, 0.22)';
  ctx.fillRect(x + 2, y - 1, w - 4, 3);
  ctx.fillRect(x, y, w, 1);
}
const SHADOWS = {
  cat_tree: [3, 87, 32], sofa: [44, 86, 54], bookshelf: [124, 87, 26], lamp: [146, 86, 14],
  decor_plant: [33, 86, 11], decor_fishbowl: [100, 87, 22], decor_beanbag: [91, 109, 23],
  soft_bed: [19, 113, 30], cushion: [21, 112, 26], litter: [137, 106, 18], bowl: [49, 110, 12], auto_feeder: [60, 107, 10],
};

const isNight = (hour) => hour >= 19 || hour < 6;

function drawWall(ctx, style) {
  const w = WALLS[style ?? 'default'];
  rect(ctx, 0, 0, ROOM_W, FLOOR_Y, w.base);
  if (w.pattern === 'old') {
    // Faded paint with cracks and water stains.
    for (const [x, y, sw, sh] of [[8, 40, 10, 6], [92, 8, 8, 5], [118, 56, 12, 7]]) rect(ctx, x, y, sw, sh, w.accent);
    for (const [x, y, steps] of [[44, 4, 9], [140, 20, 7], [6, 58, 6]]) {
      for (let i = 0; i < steps; i++) rect(ctx, x + (i % 3 === 1 ? 1 : 0) + Math.floor(i / 3), y + i, 1, 1, '#a8987a');
    }
  } else if (w.pattern === 'dots') {
    for (let y = 4; y < FLOOR_Y - 4; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < ROOM_W; x += 8) rect(ctx, x, y, 1, 1, w.accent);
  } else if (w.pattern === 'stripes') {
    for (let x = 0; x < ROOM_W; x += 10) rect(ctx, x, 0, 4, FLOOR_Y, w.accent);
  } else if (w.pattern === 'leaves') {
    for (let y = 6; y < FLOOR_Y - 4; y += 12) {
      for (let x = (y / 6) % 4 ? 2 : 8; x < ROOM_W; x += 12) {
        rect(ctx, x, y, 2, 1, w.accent);
        rect(ctx, x + 1, y + 1, 2, 1, w.accent);
      }
    }
  } else if (w.pattern === 'stars') {
    for (let y = 6; y < FLOOR_Y - 4; y += 14) {
      for (let x = (y / 14) % 2 ? 4 : 11; x < ROOM_W; x += 14) {
        rect(ctx, x, y - 1, 1, 3, w.accent);
        rect(ctx, x - 1, y, 3, 1, w.accent);
      }
    }
  }
  drawWallTrim(ctx, FLOOR_Y);
}

function drawFloor(ctx, style) {
  const f = FLOORS[style ?? 'default'];
  rect(ctx, 0, FLOOR_Y, ROOM_W, ROOM_H - FLOOR_Y, f.base);
  if (f.pattern === 'planks') {
    drawPlanks(ctx, f, FLOOR_Y);
    if (f.shine) {
      // Polished: a soft glow from the window, fading out to the sides.
      const glow = ctx.createLinearGradient(20, 0, 140, 0);
      glow.addColorStop(0, 'rgba(255, 230, 180, 0)');
      glow.addColorStop(0.5, 'rgba(255, 230, 180, 0.16)');
      glow.addColorStop(1, 'rgba(255, 230, 180, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(20, FLOOR_Y + 1, 120, 26);
    }
    if (f.worn) {
      // Scuffs and a cracked board.
      for (const [x, y, w] of [[30, 90, 6], [112, 96, 8], [70, 115, 5], [140, 84, 4]]) rect(ctx, x, y, w, 1, '#7a5c44');
      for (let i = 0; i < 5; i++) rect(ctx, 96 + i, 80 + (i % 2), 1, 1, '#5e4634');
    }
  } else if (f.pattern === 'checker') {
    drawTiles(ctx, f, FLOOR_Y);
  } else {
    drawCarpet(ctx, f, FLOOR_Y);
  }
}

function drawSky(ctx, clock, now) {
  const x = 58, y = 14, w = 28, h = 24;
  const hour = clock.getHours();
  const night = isNight(hour);
  const weather = weatherOf(clock.getTime());
  let sky = night ? '#2b3a67' : hour < 8 ? '#ffd3a0' : hour >= 17 ? '#ffb38a' : '#8fd3ff';
  if (weather === 'rain') sky = night ? '#26304a' : '#9fb3c8';
  if (weather === 'snow') sky = night ? '#34405e' : '#c9d6e8';
  rect(ctx, x, y, w, h, sky);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  drawTown(ctx, x, y + h, night);
  if (weather === 'clear') {
    if (night) {
      drawSprite(ctx, 'moon', x + 16, y + 3);
      for (const [sx, sy] of [[4, 4], [9, 12], [3, 17], [22, 18]]) rect(ctx, x + sx, y + sy, 1, 1, '#fff');
    } else {
      const drift = Math.floor(now / 3000) % 36;
      rect(ctx, x - 6 + drift, y + 6, 7, 2, '#ffffff');
      rect(ctx, x - 5 + drift, y + 5, 4, 1, '#ffffff');
    }
  } else {
    rect(ctx, x, y, w, 4, night ? '#3a4560' : '#b7c2cf');
    rect(ctx, x + 3, y + 4, 10, 2, night ? '#3a4560' : '#b7c2cf');
    const fall = now / (weather === 'rain' ? 30 : 140);
    for (let i = 0; i < 14; i++) {
      const px = x + ((i * 7 + (weather === 'snow' ? Math.floor(Math.sin(fall / 8 + i) * 2) : 0)) % w);
      const py = y + ((i * 11 + Math.floor(fall)) % h);
      if (weather === 'rain') rect(ctx, px, py, 1, 2, '#dbe9ff');
      else rect(ctx, px, py, 1, 1, '#ffffff');
    }
  }
  ctx.restore();
}

// Rooftops of the town seen through the window, with lit windows at night.
function drawTown(ctx, left, bottom, night) {
  const wall = night ? '#3c4566' : '#d8c8b4';
  const roof = night ? '#2c3352' : '#b9806a';
  for (const [dx, w, h] of [[-1, 9, 9], [7, 7, 6], [13, 10, 11], [22, 8, 7]]) {
    rect(ctx, left + dx, bottom - h, w, h, wall);
    rect(ctx, left + dx, bottom - h, w, 2, roof);
    for (let wy = bottom - h + 3; wy < bottom - 1; wy += 3) {
      for (let wx = left + dx + 1; wx < left + dx + w - 1; wx += 3) {
        rect(ctx, wx, wy, 1, 1, night ? ((wx + wy) % 4 ? '#ffd27f' : '#2c3352') : '#8fa8c0');
      }
    }
  }
}

function drawWindow(ctx, clock, now) {
  drawSky(ctx, clock, now);
  drawWindowFrame(ctx);
}







function drawLampGlow(ctx) {
  ctx.fillStyle = 'rgba(255, 214, 140, 0.18)';
  ctx.beginPath();
  ctx.moveTo(147, 38);
  ctx.lineTo(159, 38);
  ctx.lineTo(160, 100);
  ctx.lineTo(128, 100);
  ctx.closePath();
  ctx.fill();
}

// `broken`: the right half has come down and hangs off the wall, its bulbs dark.
function drawFairyLights(ctx, now, glow, broken = false) {
  const colors = ['#ff5a6e', '#ffd84a', '#5ab0ff', '#5cc96b'];
  const wireY = (x) => (broken && x > 80 ? 8 + Math.round((x - 80) * 0.9) : 3 + Math.round(Math.abs(Math.sin((x / 40) * Math.PI)) * 4));
  const end = broken ? 124 : ROOM_W;
  for (let x = 0; x < end; x++) rect(ctx, x, wireY(x), 1, 1, '#4a4a5a');
  for (let i = 0, x = 5; x < end; x += 10, i++) {
    const y = wireY(x) + 1;
    const on = (Math.floor(now / 600) + i) % 4 !== 0 && !(broken && x > 80);
    const c = colors[i % colors.length];
    if (glow && on) {
      ctx.fillStyle = `${c}55`;
      ctx.fillRect(x - 1, y - 1, 4, 5);
    }
    rect(ctx, x, y, 2, 3, on ? c : '#6a6a7a');
  }
}

function drawSunbeam(ctx, clock) {
  const hour = clock.getHours() + clock.getMinutes() / 60;
  if (hour < 7 || hour >= 17 || weatherOf(clock.getTime()) !== 'clear') return;
  const shift = Math.round((12 - hour) * 3);
  ctx.fillStyle = 'rgba(255, 236, 170, 0.28)';
  ctx.beginPath();
  ctx.moveTo(60 + shift, 88);
  ctx.lineTo(86 + shift, 88);
  ctx.lineTo(98 + shift * 2, 116);
  ctx.lineTo(70 + shift * 2, 116);
  ctx.closePath();
  ctx.fill();
}






// Seasonal decorations: one thing on the wall at the top left, one on top of the bookshelf.
function drawLantern(ctx, x, y, now) {
  const swing = Math.round(Math.sin(now / 700 + x));
  line(ctx, x + 3, 0, x + 3 + swing, y, '#6b4420');
  const lx = x + swing;
  rect(ctx, lx + 1, y, 5, 1, '#ffd84a');
  rect(ctx, lx, y + 1, 7, 6, '#e8384f');
  rect(ctx, lx + 1, y + 7, 5, 1, '#ffd84a');
  rect(ctx, lx + 3, y + 1, 1, 6, '#ff7a5a');
  rect(ctx, lx + 3, y + 8, 1, 3, '#ffd84a');
}

// `shelf`: the bookshelf is in the room, so its top can hold a decoration.
function drawSeason(ctx, season, now, shelf) {
  if (season === 'tet') {
    drawLantern(ctx, 24, 10, now);
    drawLantern(ctx, 38, 14, now);
    // Yellow apricot blossom (hoa mai) in a vase on the bookshelf.
    if (shelf) drawApricot(ctx);
  } else if (season === 'midautumn') {
    drawMidAutumn(ctx, now, shelf);
  } else if (season === 'halloween') {
    drawHalloween(ctx, now, shelf);
  } else if (season === 'christmas') {
    drawChristmas(ctx, now, shelf);
  }
}

function drawApricot(ctx) {
  rect(ctx, 133, 24, 6, 6, '#3a7bff');
  rect(ctx, 134, 25, 4, 1, '#ffffff');
  line(ctx, 136, 24, 130, 12, '#6b4420');
  line(ctx, 136, 24, 142, 10, '#6b4420');
  line(ctx, 136, 22, 136, 8, '#6b4420');
  for (const [x, y] of [[130, 12], [132, 15], [142, 10], [140, 14], [136, 8], [135, 12], [138, 17], [129, 10], [144, 12]]) {
    rect(ctx, x - 1, y, 3, 1, '#ffd84a');
    rect(ctx, x, y - 1, 1, 3, '#ffd84a');
    rect(ctx, x, y, 1, 1, '#ff8a3d');
  }
}

function drawMidAutumn(ctx, now, shelf) {
  // Star lantern (đèn ông sao) and mooncakes.
  const swing = Math.round(Math.sin(now / 700));
  line(ctx, 30, 0, 30 + swing, 10, '#6b4420');
  const cx = 30 + swing, cy = 17;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    line(ctx, cx, cy, cx + Math.round(Math.cos(a) * 7), cy + Math.round(Math.sin(a) * 7), '#e8384f');
  }
  disc(ctx, cx, cy, 3, '#ffd84a', '#e8384f');
  if (!shelf) return;
  rect(ctx, 129, 28, 16, 2, '#ffffff');
  for (const x of [131, 138]) {
    rect(ctx, x, 23, 6, 5, '#c98b4a');
    rect(ctx, x + 1, 24, 4, 3, '#e0aa6a');
  }
}

function drawHalloween(ctx, now, shelf) {
  // Pumpkin on the bookshelf and a flapping bat.
  if (shelf) {
    rect(ctx, 136, 19, 2, 3, '#4caf50');
    blob(ctx, 130, 21, 14, 9, '#ff8a3d', '#a0521d');
    rect(ctx, 133, 24, 2, 2, '#ffd84a');
    rect(ctx, 139, 24, 2, 2, '#ffd84a');
    rect(ctx, 134, 27, 6, 1, '#ffd84a');
  }
  const flap = Math.floor(now / 200) % 2;
  rect(ctx, 28, 16, 4, 3, '#2a1d3a');
  rect(ctx, 23, 15 + flap, 5, 2, '#2a1d3a');
  rect(ctx, 32, 15 + flap, 5, 2, '#2a1d3a');
  rect(ctx, 29, 16, 1, 1, '#ff5a6e');
  rect(ctx, 31, 16, 1, 1, '#ff5a6e');
}

function drawChristmas(ctx, now, shelf) {
  // Small tree on the bookshelf and a wreath on the wall.
  if (shelf) {
    for (let i = 0; i < 12; i++) rect(ctx, 137 - Math.floor(i / 2), 14 + i, 1 + Math.floor(i / 2) * 2, 1, '#2e7d32');
    rect(ctx, 136, 26, 2, 4, '#6b4420');
    drawSprite(ctx, 'sparkle', 136, 11);
    const twinkle = Math.floor(now / 500) % 2;
    for (const [x, y, c] of [[135, 18, '#e8384f'], [139, 21, '#ffd84a'], [133, 23, '#5ab0ff'], [140, 24, '#e8384f']]) rect(ctx, x, y, 1, 1, twinkle ? c : '#ffffff');
  }
  disc(ctx, 30, 18, 6, '#2e7d32', '#1b5e20');
  disc(ctx, 30, 18, 2, '#f6e7d0', '#2e7d32');
  rect(ctx, 28, 23, 5, 2, '#e8384f');
}

// Contest trophies sit on a small shelf under the picture frame.
const TROPHIES = ['trophy_gold', 'trophy_silver', 'trophy_bronze'];
function drawTrophyShelf(ctx, owned) {
  const won = TROPHIES.filter((id) => owned.has(id));
  if (!won.length) return;
  rect(ctx, 100, 52, 22, 2, WOOD);
  rect(ctx, 101, 54, 2, 2, WOOD_DARK);
  rect(ctx, 119, 54, 2, 2, WOOD_DARK);
  won.forEach((id, i) => drawSprite(ctx, id, 102 + i * 7, 46));
}


// ---- How each item looks once an angry cat has broken it (fine pixels: half a room unit) ----

const STUFFING = '#f4f1ea';
const STUFFING_SHADE = '#d8d2c4';

// A tuft of white stuffing poking out of a tear.
function fluff(ctx, x, y) {
  fineShape(ctx, x, y, 7, 5, STUFFING, STUFFING_SHADE, { round: 2 });
  F(ctx, x + 2, y - 1, 2, 1, STUFFING);
}

// A jagged tear across fabric, dark inside.
function tear(ctx, x, y, length, color) {
  for (let i = 0; i < length; i++) {
    F(ctx, x + i, y + (i % 2), 1, 1, color);
    F(ctx, x + i, y + 1 + (i % 2), 1, 1, 'rgba(0,0,0,0.25)');
  }
}

// Three slanted claw marks, each with a light edge.
function claws(ctx, x, y, color, length = 8) {
  for (let m = 0; m < 3; m++) {
    for (let i = 0; i < length; i++) {
      F(ctx, x + m * 3 + Math.floor(i / 2), y + i, 1, 1, color);
      F(ctx, x + m * 3 + Math.floor(i / 2) + 1, y + i, 1, 1, 'rgba(255,255,255,0.2)');
    }
  }
}

function brokenSofa(ctx) {
  claws(ctx, 116, 108, '#2f4f8a');
  claws(ctx, 160, 110, '#2f4f8a');
  tear(ctx, 112, 138, 18, '#2f4f8a');
  fluff(ctx, 116, 134);
  tear(ctx, 156, 154, 14, '#2f4f8a');
  fluff(ctx, 162, 150);
  fluff(ctx, 92, 126); // armrest
  fluff(ctx, 132, 180); // on the floor
  fluff(ctx, 172, 184);
}

function brokenBookshelf(ctx) {
  F(ctx, 258, 70, 14, 22, WOOD_DARK); // books pulled off the shelves...
  F(ctx, 276, 100, 12, 20, WOOD_DARK);
  // ...and lying on the floor.
  for (const [x, y, w, color] of [[232, 178, 16, '#e8384f'], [242, 184, 14, '#3a7bff'], [260, 180, 12, '#f2c14e']]) {
    F(ctx, x, y, w, 4, color);
    F(ctx, x, y, w, 1, 'rgba(255,255,255,0.4)');
    F(ctx, x + 2, y + 1, 1, 2, 'rgba(255,255,255,0.5)');
  }
  F(ctx, 278, 186, 12, 4, '#ffffff'); // an open book
  F(ctx, 284, 186, 1, 4, '#9a9a9a');
  F(ctx, 294, 180, 4, 10, '#5cc96b');
}

function brokenFishbowl(ctx, now) {
  fineLine(ctx, 214, 132, 220, 140, '#ffffff'); // cracked glass
  fineLine(ctx, 220, 140, 216, 146, '#ffffff');
  fineLine(ctx, 226, 134, 230, 142, '#ffffff');
  fineShape(ctx, 200, 174, 44, 6, '#9fd6ff', '#6cc3ff', { round: 2 }); // puddle under the table
  F(ctx, 220, 160 + (Math.floor(now / 300) % 4) * 4, 1, 2, '#9fd6ff'); // dripping
}

function brokenFrame(ctx) {
  fineLine(ctx, 214, 70, 226, 80, '#ffffff');
  fineLine(ctx, 226, 80, 220, 88, '#ffffff');
  fineLine(ctx, 226, 80, 236, 76, '#ffffff');
  F(ctx, 206, 92, 4, 2, WOOD); // a splinter hanging off
}

function brokenRug(ctx) {
  claws(ctx, 140, 204, '#7a2e20', 12);
  claws(ctx, 184, 208, '#7a2e20', 12);
  for (const x of [126, 134, 150, 176, 198, 208]) F(ctx, x, 227, 1, 2 + (x % 3), '#c8553d'); // loose threads
}

function brokenBeanbag(ctx) {
  tear(ctx, 194, 202, 14, '#a0521d');
  for (const [x, y] of [[180, 220], [186, 224], [192, 222], [218, 218], [224, 222], [210, 224], [200, 226]]) F(ctx, x, y, 2, 2, '#ffffff');
}

function brokenBed(ctx) {
  tear(ctx, 52, 212, 18, '#7a2e45');
  fluff(ctx, 60, 208);
  claws(ctx, 76, 210, '#7a2e45', 6);
}

function brokenLitterHood(ctx) {
  fineLine(ctx, 282, 188, 290, 196, '#2a2a3a');
  fineLine(ctx, 290, 196, 286, 202, '#2a2a3a');
  F(ctx, 300, 190, 3, 2, '#e8384f'); // warning light instead of green
}

function brokenYarn(ctx, now) {
  // A loose thread trailing across the floor.
  const wave = Math.floor(now / 600) % 2;
  for (let x = 172; x < 216; x++) F(ctx, x, 225 + Math.round(Math.sin(x / 5 + wave) * 2), 1, 1, '#9b7bff');
}

function brokenToyMouse(ctx) {
  fluff(ctx, 250, 220);
  F(ctx, 258, 226, 4, 1, '#5a5a6a');
}

// The cat tree with a frayed post, a sagging top platform and its toy fallen to the floor.
function drawBrokenCatTree(ctx) {
  fineShape(ctx, 8, 166, 60, 10, '#a87a50', '#6b4420', { round: 4 });
  F(ctx, 31, 100, 12, 68, '#8a7550');
  F(ctx, 32, 100, 10, 68, '#d9c49a');
  for (let y = 101; y < 168; y += 3) F(ctx, 32, y, 10, 1, '#bfa577');
  for (let y = 104; y < 164; y += 7) { // frayed rope
    F(ctx, 28, y, 4, 1, '#bfa577');
    F(ctx, 42, y + 3, 4, 1, '#bfa577');
    F(ctx, 27, y + 1, 2, 1, '#bfa577');
  }
  for (let i = 0; i < 48; i++) { // top platform, tilted
    const drop = Math.floor(i / 10);
    F(ctx, 10 + i, 90 + drop, 1, 1, '#3a2a6a');
    F(ctx, 10 + i, 91 + drop, 1, 6, '#7a6ad6');
    F(ctx, 10 + i, 92 + drop, 1, 1, '#9a8ae6');
    F(ctx, 10 + i, 97 + drop, 1, 1, '#3a2a6a');
  }
  fineShape(ctx, 42, 126, 26, 10, '#7a6ad6', '#3a2a6a', { round: 5 });
  claws(ctx, 46, 127, '#3a2a6a', 6);
  F(ctx, 52, 100, 1, 4, '#4a3a2a'); // the string snapped
  fineShape(ctx, 60, 176, 7, 7, '#ff5a6e', '#a02a3a', { round: 2 });
}

// The lamp with a crooked, cracked shade. It no longer lights up.
function drawBrokenLamp(ctx) {
  F(ctx, 302, 76, 6, 92, '#3a3a4a');
  F(ctx, 303, 76, 4, 92, '#5a5a6a');
  fineShape(ctx, 294, 166, 22, 6, '#4a4a5a', '#2a2a3a', { round: 3 });
  for (let i = 0; i < 20; i++) {
    const w = 16 + Math.floor(i * 0.5);
    F(ctx, 305 - Math.floor(w / 2) + Math.floor(i / 4) - 2, 58 + i, w, 1, '#c8a860');
  }
  fineLine(ctx, 300, 60, 306, 70, '#6b4420');
  fineLine(ctx, 306, 70, 302, 76, '#6b4420');
}

// The plant knocked over, its pot on its side and soil spilled on the floor.
function drawBrokenPlant(ctx) {
  fineShape(ctx, 58, 162, 24, 12, '#d0704a', '#7a3a2a', { round: 3 });
  fineShape(ctx, 79, 163, 5, 10, '#3a2a1e', '#3a2a1e', { round: 2 }); // open top of the pot
  for (const [x, y] of [[86, 168], [90, 171], [94, 168], [88, 173], [96, 172], [100, 170]]) F(ctx, x, y, 3, 2, '#5e4634');
  for (const [x, y] of [[88, 162], [94, 160], [92, 165], [99, 163], [101, 167]]) fineShape(ctx, x, y, 5, 4, '#5cc96b', '#2e7d32', { round: 2 });
}

// The feeder knocked on its side with kibble everywhere.
function drawBrokenFeeder(ctx) {
  fineShape(ctx, 120, 206, 22, 12, '#d8e0ea', '#3a3a5a', { round: 3, inside: () => F(ctx, 126, 209, 6, 6, '#b06a3b') });
  for (const [x, y] of [[114, 216], [144, 214], [148, 220], [134, 222], [140, 224], [118, 222]]) F(ctx, x, y, 3, 2, '#b06a3b');
}

// The floor gets dirtier as the dirtiest cat's cleanliness drops: stains, then muddy paw prints, then messes with flies.
const DIRT = { stains: 40, paws: 25, mess: 10 };
const MUD = 'rgba(60, 40, 22, 0.5)';
function drawFloorDirt(ctx, cleanliness) {
  if (cleanliness >= DIRT.stains) return;
  ctx.fillStyle = MUD;
  for (const [x, y, w, h] of [[28, 92, 12, 4], [114, 98, 14, 4], [70, 115, 10, 3], [136, 111, 9, 3], [84, 87, 8, 3]]) {
    ctx.fillRect(x, y, w, h);
    ctx.fillRect(x + 1, y - 1, w - 2, 1);
  }
  if (cleanliness >= DIRT.paws) return;
  // A trail of muddy paw prints across the room.
  ctx.fillStyle = 'rgba(60, 40, 22, 0.55)';
  for (let i = 0; i < 9; i++) {
    const x = 36 + i * 11;
    const y = 104 + (i % 2) * 4 - Math.round(Math.sin(i / 2) * 3);
    ctx.fillRect(x, y, 2, 2);
    ctx.fillRect(x - 1, y - 2, 1, 1);
    ctx.fillRect(x + 1, y - 2, 1, 1);
    ctx.fillRect(x + 3, y - 1, 1, 1);
  }
}

// Little messes on the floor, with flies buzzing around them. Drawn over the furniture so they show.
const MESSES = [[118, 106], [10, 104], [86, 113]];
function drawMesses(ctx, cleanliness, now) {
  if (cleanliness >= DIRT.mess) return;
  for (const [i, [x, y]] of MESSES.entries()) {
    rect(ctx, x - 1, y + 3, 8, 2, '#4a2e16');
    rect(ctx, x, y + 1, 6, 2, '#6b4420');
    rect(ctx, x + 1, y - 1, 4, 2, '#6b4420');
    rect(ctx, x + 2, y - 2, 2, 1, '#6b4420');
    rect(ctx, x + 2, y, 1, 1, '#9a6a3e');
    for (let f = 0; f < 2; f++) {
      const a = now / (300 + f * 90) + i * 2 + f * 3;
      rect(ctx, x + 2 + Math.round(Math.cos(a) * 4), y - 4 + Math.round(Math.sin(a * 1.3) * 2), 1, 1, '#1a1a2e');
    }
  }
}


// Everything behind the cat. Only items the player owns are in the room.
export function drawRoom(ctx, state, now, clock) {
  const time = new Date(clock);
  const owned = new Set(state.owned);
  const broken = new Set(state.broken ?? []);
  const has = (id) => owned.has(id);
  // Draws an owned item. When broken, `damage` is drawn on top, or `brokenDraw` replaces it.
  const item = (id, draw, { damage = null, brokenDraw = null } = {}) => {
    if (!has(id)) return;
    if (broken.has(id) && brokenDraw) return brokenDraw();
    draw();
    if (broken.has(id)) damage?.();
  };

  drawWall(ctx, state.equipped.wall);
  drawFloor(ctx, state.equipped.floor);
  const cleanliness = Math.min(...state.cats.map((c) => c.stats.cleanliness));
  drawFloorDirt(ctx, cleanliness);
  for (const [id, [x, y, w]] of Object.entries(SHADOWS)) if (has(id)) shadow(ctx, x, y, w);
  item('decor_lights', () => drawFairyLights(ctx, now, false, broken.has('decor_lights')));

  drawGardenDoor(ctx, has('garden_door'), ROOM_DOOR);
  drawWindow(ctx, time, now);
  drawCurtains(ctx, now);
  drawClock(ctx, time);
  item('decor_frame', () => drawFrame(ctx), { damage: () => brokenFrame(ctx) });
  drawTrophyShelf(ctx, owned);
  drawSunbeam(ctx, time);

  item('cat_tree', () => drawCatTree(ctx, now), { brokenDraw: () => drawBrokenCatTree(ctx) });
  item('sofa', () => drawSofa(ctx), { damage: () => brokenSofa(ctx) });
  item('bookshelf', () => drawBookshelf(ctx), { damage: () => brokenBookshelf(ctx) });
  drawSeason(ctx, seasonOf(clock), now, has('bookshelf'));
  item('lamp', () => drawLamp(ctx, state.asleep || isNight(time.getHours())), { brokenDraw: () => drawBrokenLamp(ctx) });
  item('decor_plant', () => drawPlant(ctx, now), { brokenDraw: () => drawBrokenPlant(ctx) });
  item('decor_fishbowl', () => drawFishbowlTable(ctx, now), { damage: () => brokenFishbowl(ctx, now) });

  item('decor_rug', () => drawRug(ctx), { damage: () => brokenRug(ctx) });
  if (has('soft_bed')) item('soft_bed', () => drawBed(ctx), { damage: () => brokenBed(ctx) });
  else if (has('cushion')) drawCushion(ctx);
  item('decor_beanbag', () => drawBeanbag(ctx), { damage: () => brokenBeanbag(ctx) });
  if (has('bowl')) drawBowl(ctx, now);
  item('auto_feeder', () => drawAutoFeeder(ctx), { brokenDraw: () => drawBrokenFeeder(ctx) });
  if (has('litter')) drawLitter(ctx, cleanliness, now);
  item('auto_litter', () => drawLitterHood(ctx), { damage: () => brokenLitterHood(ctx) });
  item('toy_yarn', () => drawSprite(ctx, 'toy_yarn', 80, 108), { damage: () => brokenYarn(ctx, now) });
  item('toy_mouse', () => drawSprite(ctx, 'toy_mouse', 122, 112, Math.floor(now / 2000) % 2 === 0), { damage: () => brokenToyMouse(ctx) });
  drawMesses(ctx, cleanliness, now);
}

// Darkens the room when the lights are off; window, lamp and fairy lights still glow.
export function drawDarkness(ctx, state, now, clock) {
  const time = new Date(clock);
  const working = (id) => state.owned.includes(id) && !(state.broken ?? []).includes(id);
  ctx.fillStyle = 'rgba(12, 14, 40, 0.6)';
  ctx.fillRect(0, 0, ROOM_W, ROOM_H);
  drawWindow(ctx, time, now);
  if (working('lamp')) {
    drawLamp(ctx, true);
    drawLampGlow(ctx);
  }
  if (working('decor_lights')) drawFairyLights(ctx, now, true);
  drawSeason(ctx, seasonOf(clock), now, state.owned.includes('bookshelf'));
}
