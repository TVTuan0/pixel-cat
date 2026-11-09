// Draws the room: wall, floor, furniture, window weather and light.
import { drawSprite } from './sprites.js';
import { rect, blob, line, disc } from './draw.js';
import { active } from './effects.js';
import { ROOM_W, ROOM_H, FLOOR_Y } from './layout.js';
import { weatherOf, seasonOf } from '../rules.js';

const WALLS = {
  default: { base: '#f6e7d0', accent: '#e8d2b0', pattern: 'dots' },
  wall_stripes: { base: '#ffe3ea', accent: '#ffd0dc', pattern: 'stripes' },
  wall_mint: { base: '#dff5e8', accent: '#9fd8b4', pattern: 'leaves' },
  wall_stars: { base: '#dfe9ff', accent: '#b9c9f5', pattern: 'stars' },
};

const FLOORS = {
  default: { base: '#b9805a', line: '#a46e4a', pattern: 'planks' },
  floor_dark: { base: '#6e4a3a', line: '#5a3a2c', pattern: 'planks' },
  floor_tiles: { base: '#f3ead8', line: '#9fd3c7', pattern: 'checker' },
  floor_carpet: { base: '#b49ad6', line: '#9a7fc0', pattern: 'speckle' },
};

const WOOD = '#8a5a2a';
const WOOD_DARK = '#5a3a1e';

const isNight = (hour) => hour >= 19 || hour < 6;

function drawWall(ctx, style) {
  const w = WALLS[style ?? 'default'];
  rect(ctx, 0, 0, ROOM_W, FLOOR_Y, w.base);
  if (w.pattern === 'dots') {
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
  rect(ctx, 0, FLOOR_Y - 2, ROOM_W, 2, '#c9a27e');
}

function drawFloor(ctx, style) {
  const f = FLOORS[style ?? 'default'];
  rect(ctx, 0, FLOOR_Y, ROOM_W, ROOM_H - FLOOR_Y, f.base);
  if (f.pattern === 'planks') {
    for (let y = FLOOR_Y + 6, i = 0; y < ROOM_H; y += 7, i++) {
      rect(ctx, 0, y, ROOM_W, 1, f.line);
      for (let x = (i % 2) * 14 + 8; x < ROOM_W; x += 28) rect(ctx, x, y - 6, 1, 6, f.line);
    }
  } else if (f.pattern === 'checker') {
    for (let y = FLOOR_Y, r = 0; y < ROOM_H; y += 8, r++) {
      for (let x = (r % 2) * 8; x < ROOM_W; x += 16) rect(ctx, x, y, 8, 8, f.line);
    }
  } else {
    for (let y = FLOOR_Y + 3; y < ROOM_H; y += 5) for (let x = (y % 3) * 3; x < ROOM_W; x += 9) rect(ctx, x, y, 1, 1, f.line);
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

function drawWindow(ctx, clock, now) {
  rect(ctx, 56, 12, 32, 28, WOOD);
  drawSky(ctx, clock, now);
  rect(ctx, 71, 14, 2, 24, WOOD);
  rect(ctx, 58, 25, 28, 2, WOOD);
  rect(ctx, 54, 40, 36, 2, '#6b4420');
}

function drawCurtains(ctx, now) {
  rect(ctx, 46, 9, 52, 2, '#6b4420');
  const sway = Math.round(Math.sin(now / 900));
  for (const [x, flip] of [[48, 1], [87, -1]]) {
    rect(ctx, x, 11, 9, 30, '#e07a8f');
    rect(ctx, x + sway * flip, 41, 9, 5, '#e07a8f');
    for (const fx of [2, 5]) rect(ctx, x + fx, 11, 1, 30, '#c45d74');
    rect(ctx, x + (flip > 0 ? 7 : 1), 30, 1, 3, '#f2c14e'); // tie-back
  }
}

function drawClock(ctx, clock) {
  const cx = 113, cy = 19;
  disc(ctx, cx, cy, 7, '#fffaf0', WOOD);
  for (const [dx, dy] of [[0, -5], [5, 0], [0, 5], [-5, 0]]) rect(ctx, cx + dx, cy + dy, 1, 1, WOOD_DARK);
  const minutes = clock.getMinutes();
  const hours = (clock.getHours() % 12) + minutes / 60;
  const ha = (hours / 12) * Math.PI * 2;
  const ma = (minutes / 60) * Math.PI * 2;
  line(ctx, cx, cy, cx + Math.round(Math.sin(ha) * 3), cy - Math.round(Math.cos(ha) * 3), '#2a1d3a');
  line(ctx, cx, cy, cx + Math.round(Math.sin(ma) * 5), cy - Math.round(Math.cos(ma) * 5), '#c8553d');
}

function drawCatTree(ctx, now) {
  rect(ctx, 4, 84, 30, 4, '#a87a50');
  rect(ctx, 4, 87, 30, 1, '#6b4420');
  rect(ctx, 16, 50, 5, 34, '#d9c49a');
  for (let y = 52; y < 84; y += 3) rect(ctx, 16, y, 5, 1, '#bfa577');
  rect(ctx, 5, 46, 24, 4, '#7a6ad6');
  rect(ctx, 5, 49, 24, 1, '#4a3a8a');
  rect(ctx, 21, 64, 13, 3, '#7a6ad6');
  rect(ctx, 21, 66, 13, 1, '#4a3a8a');
  const swing = Math.round(Math.sin(now / 500));
  line(ctx, 26, 50, 26 + swing, 56, '#4a3a2a');
  rect(ctx, 25 + swing, 56, 3, 3, '#ff5a6e');
}

function drawSofa(ctx) {
  const base = '#5b8bd9', dark = '#2f4f8a', light = '#7fa6e6';
  blob(ctx, 46, 50, 52, 20, base, dark);
  rect(ctx, 71, 52, 1, 14, dark);
  blob(ctx, 44, 60, 10, 24, light, dark);
  blob(ctx, 90, 60, 10, 24, light, dark);
  rect(ctx, 53, 66, 37, 6, light);
  rect(ctx, 53, 72, 37, 1, dark);
  rect(ctx, 53, 73, 37, 9, base);
  rect(ctx, 53, 82, 37, 1, dark);
  rect(ctx, 48, 84, 3, 3, WOOD_DARK);
  rect(ctx, 93, 84, 3, 3, WOOD_DARK);
}

function drawBookshelf(ctx) {
  rect(ctx, 126, 30, 22, 57, WOOD);
  rect(ctx, 128, 32, 18, 53, WOOD_DARK);
  const colors = ['#e8384f', '#3a7bff', '#f2c14e', '#5cc96b', '#9b7bff', '#ff8fa3'];
  [46, 60, 74].forEach((y, shelf) => {
    rect(ctx, 128, y, 18, 2, WOOD);
    let x = 129;
    for (let i = 0; x < 144 && i < 6; i++) {
      const h = 7 + ((i + shelf) % 3) * 2;
      const w = 2 + ((i + shelf * 2) % 2);
      rect(ctx, x, y - h, w, h, colors[(i + shelf * 2) % colors.length]);
      x += w + 1;
    }
  });
  rect(ctx, 130, 79, 6, 5, '#d0704a'); // little pot on the bottom shelf
  rect(ctx, 131, 76, 4, 3, '#4caf50');
}

function drawLamp(ctx, lit) {
  rect(ctx, 152, 38, 2, 46, '#4a4a5a');
  rect(ctx, 148, 84, 10, 2, '#4a4a5a');
  for (let i = 0; i < 10; i++) {
    const w = 8 + Math.floor(i * 0.5);
    rect(ctx, 153 - Math.floor(w / 2), 28 + i, w, 1, lit ? '#fff2b0' : '#ffd27f');
  }
  rect(ctx, 149, 28, 8, 1, WOOD);
  rect(ctx, 147, 37, 12, 1, WOOD);
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

function drawFairyLights(ctx, now, glow) {
  const colors = ['#ff5a6e', '#ffd84a', '#5ab0ff', '#5cc96b'];
  for (let x = 0; x < ROOM_W; x++) rect(ctx, x, 3 + Math.round(Math.abs(Math.sin((x / 40) * Math.PI)) * 4), 1, 1, '#4a4a5a');
  for (let i = 0, x = 5; x < ROOM_W; x += 10, i++) {
    const y = 4 + Math.round(Math.abs(Math.sin((x / 40) * Math.PI)) * 4);
    const on = (Math.floor(now / 600) + i) % 4 !== 0;
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

function drawFishbowlTable(ctx, now) {
  rect(ctx, 101, 76, 20, 3, WOOD);
  rect(ctx, 103, 79, 2, 8, WOOD_DARK);
  rect(ctx, 117, 79, 2, 8, WOOD_DARK);
  drawSprite(ctx, 'decor_fishbowl', 106, 67);
  const rise = Math.floor(now / 250) % 5;
  rect(ctx, 110, 72 - rise, 1, 1, '#e8f6ff');
}

function drawBed(ctx) {
  rect(ctx, 22, 103, 24, 1, '#7a2e45');
  rect(ctx, 20, 104, 28, 8, '#7a2e45');
  rect(ctx, 22, 112, 24, 1, '#7a2e45');
  rect(ctx, 21, 104, 26, 7, '#c0587a');
  rect(ctx, 24, 105, 20, 5, '#ffb3c6');
}

function drawBeanbag(ctx) {
  blob(ctx, 92, 97, 20, 13, '#ff9f43', '#a0521d');
  blob(ctx, 95, 94, 14, 7, '#ff9f43', '#a0521d');
  rect(ctx, 96, 96, 4, 2, '#ffc785');
  rect(ctx, 94, 101, 2, 3, '#ffc785');
}

function drawRug(ctx) {
  rect(ctx, 64, 100, 40, 1, '#c8553d');
  rect(ctx, 60, 101, 48, 12, '#c8553d');
  rect(ctx, 64, 113, 40, 1, '#c8553d');
  rect(ctx, 63, 103, 42, 1, '#f2c14e');
  rect(ctx, 63, 110, 42, 1, '#f2c14e');
}

function drawLitter(ctx, cleanliness, now) {
  drawSprite(ctx, 'litter', 138, 100);
  const specks = Math.ceil((100 - cleanliness) / 15);
  const spots = [[141, 101], [146, 101], [150, 101], [143, 100], [148, 100], [140, 100], [151, 100]];
  for (let i = 0; i < specks && i < spots.length; i++) rect(ctx, spots[i][0], spots[i][1], 2, 1, '#8a6a4a');
  if (cleanliness < 40) {
    const wave = Math.floor(now / 300) % 2;
    for (const sx of [142, 147, 152]) {
      rect(ctx, sx + wave, 93, 1, 2, '#7fae5a');
      rect(ctx, sx + 1 - wave, 95, 1, 2, '#7fae5a');
    }
  }
  if (active('sparkle', now)) {
    const f = Math.floor(now / 120) % 2;
    drawSprite(ctx, 'sparkle', 140 + f * 6, 95 - f);
    drawSprite(ctx, 'sparkle', 148 - f * 4, 97 + f);
  }
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

function drawSeason(ctx, season, now) {
  if (season === 'tet') {
    drawLantern(ctx, 24, 10, now);
    drawLantern(ctx, 38, 14, now);
    // Yellow apricot blossom (hoa mai) in a vase on the bookshelf.
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
  } else if (season === 'midautumn') {
    // Star lantern (đèn ông sao) and mooncakes.
    const swing = Math.round(Math.sin(now / 700));
    line(ctx, 30, 0, 30 + swing, 10, '#6b4420');
    const cx = 30 + swing, cy = 17;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      line(ctx, cx, cy, cx + Math.round(Math.cos(a) * 7), cy + Math.round(Math.sin(a) * 7), '#e8384f');
    }
    disc(ctx, cx, cy, 3, '#ffd84a', '#e8384f');
    rect(ctx, 129, 28, 16, 2, '#ffffff');
    for (const x of [131, 138]) {
      rect(ctx, x, 23, 6, 5, '#c98b4a');
      rect(ctx, x + 1, 24, 4, 3, '#e0aa6a');
    }
  } else if (season === 'halloween') {
    // Pumpkin on the bookshelf and a flapping bat.
    rect(ctx, 136, 19, 2, 3, '#4caf50');
    blob(ctx, 130, 21, 14, 9, '#ff8a3d', '#a0521d');
    rect(ctx, 133, 24, 2, 2, '#ffd84a');
    rect(ctx, 139, 24, 2, 2, '#ffd84a');
    rect(ctx, 134, 27, 6, 1, '#ffd84a');
    const flap = Math.floor(now / 200) % 2;
    rect(ctx, 28, 16, 4, 3, '#2a1d3a');
    rect(ctx, 23, 15 + flap, 5, 2, '#2a1d3a');
    rect(ctx, 32, 15 + flap, 5, 2, '#2a1d3a');
    rect(ctx, 29, 16, 1, 1, '#ff5a6e');
    rect(ctx, 31, 16, 1, 1, '#ff5a6e');
  } else if (season === 'christmas') {
    // Small tree on the bookshelf and a wreath on the wall.
    for (let i = 0; i < 12; i++) rect(ctx, 137 - Math.floor(i / 2), 14 + i, 1 + Math.floor(i / 2) * 2, 1, '#2e7d32');
    rect(ctx, 136, 26, 2, 4, '#6b4420');
    drawSprite(ctx, 'sparkle', 136, 11);
    const twinkle = Math.floor(now / 500) % 2;
    for (const [x, y, c] of [[135, 18, '#e8384f'], [139, 21, '#ffd84a'], [133, 23, '#5ab0ff'], [140, 24, '#e8384f']]) rect(ctx, x, y, 1, 1, twinkle ? c : '#ffffff');
    disc(ctx, 30, 18, 6, '#2e7d32', '#1b5e20');
    disc(ctx, 30, 18, 2, '#f6e7d0', '#2e7d32');
    rect(ctx, 28, 23, 5, 2, '#e8384f');
  }
}

function drawPlant(ctx, now) {
  drawSprite(ctx, 'decor_plant', 34, 73);
  if (Math.floor(now / 800) % 2) rect(ctx, 35, 76, 1, 1, '#4caf50'); // leaf sways
}

// Everything behind the cat.
export function drawRoom(ctx, state, now, clock) {
  const time = new Date(clock);
  const owned = new Set(state.owned);
  drawWall(ctx, state.equipped.wall);
  drawFloor(ctx, state.equipped.floor);
  if (owned.has('decor_lights')) drawFairyLights(ctx, now, false);

  drawWindow(ctx, time, now);
  drawCurtains(ctx, now);
  drawClock(ctx, time);
  if (owned.has('decor_frame')) {
    rect(ctx, 104, 32, 18, 14, WOOD);
    rect(ctx, 106, 34, 14, 10, '#bfe6ff');
    drawSprite(ctx, 'fish', 109, 36);
  }
  drawSunbeam(ctx, time);

  drawCatTree(ctx, now);
  drawSofa(ctx);
  drawBookshelf(ctx);
  drawSeason(ctx, seasonOf(clock), now);
  drawLamp(ctx, state.asleep || isNight(time.getHours()));
  if (owned.has('decor_plant')) drawPlant(ctx, now);
  if (owned.has('decor_fishbowl')) drawFishbowlTable(ctx, now);

  if (owned.has('decor_rug')) drawRug(ctx);
  drawBed(ctx);
  if (owned.has('decor_beanbag')) drawBeanbag(ctx);
  drawSprite(ctx, 'bowl', 50, 106);
  if (active('bowlFull', now) || active('eat', now)) {
    for (let i = 0; i < 3; i++) rect(ctx, 52 + i * 2, 104 + (i % 2), 2, 2, '#b06a3b');
  }
  drawLitter(ctx, state.stats.cleanliness, now);
  if (owned.has('toy_yarn')) drawSprite(ctx, 'toy_yarn', 80, 108);
  if (owned.has('toy_mouse')) drawSprite(ctx, 'toy_mouse', 122, 112, Math.floor(now / 2000) % 2 === 0);
}

// Darkens the room when the lights are off; window, lamp and fairy lights still glow.
export function drawDarkness(ctx, state, now, clock) {
  const time = new Date(clock);
  ctx.fillStyle = 'rgba(12, 14, 40, 0.6)';
  ctx.fillRect(0, 0, ROOM_W, ROOM_H);
  drawWindow(ctx, time, now);
  drawLamp(ctx, true);
  drawLampGlow(ctx);
  if (state.owned.includes('decor_lights')) drawFairyLights(ctx, now, true);
  drawSeason(ctx, seasonOf(clock), now);
}
