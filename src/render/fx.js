// Animated pixel effects from pixelfx (src/vendor/pixelfx), drawn over the live scene.
// Positions are in room units; effects draw in screen pixels (RES per unit), like the rest of the art.
import { createFrame, clearFrame, createFx, composite } from '../vendor/pixelfx/core/index.js';
import * as heart from '../vendor/pixelfx/fx/pickups/heart-pickup.js';
import * as poof from '../vendor/pixelfx/fx/spawn/poof.js';
import * as pow from '../vendor/pixelfx/fx/explosions/cartoon-pow.js';
import * as sparkle from '../vendor/pixelfx/fx/pickups/collect-burst.js';
import * as coins from '../vendor/pixelfx/fx/spawn/coin-drop.js';
import * as chest from '../vendor/pixelfx/fx/pickups/chest-open.js';
import * as confetti from '../vendor/pixelfx/fx/ui/confetti.js';
import * as firework from '../vendor/pixelfx/fx/explosions/firework-burst.js';
import * as rain from '../vendor/pixelfx/fx/weather/rain.js';
import * as snow from '../vendor/pixelfx/fx/weather/snow.js';
import * as fireflies from '../vendor/pixelfx/fx/weather/fireflies.js';
import * as leaves from '../vendor/pixelfx/fx/weather/falling-leaves.js';
import * as blossoms from '../vendor/pixelfx/fx/weather/cherry-blossoms.js';
import * as butterfly from '../vendor/pixelfx/fx/critters/butterfly.js';
import * as bird from '../vendor/pixelfx/fx/critters/bird.js';
import { RES, SCENE_W, SCENE_H } from './layout.js';

const EFFECTS = { heart, poof, pow, sparkle, coins, chest, confetti, firework, rain, snow, fireflies, leaves, blossoms, butterfly, bird };

// What is playing: { fx, view: 'room' | 'garden', front: drawn over the cats?, stopAt: time to fade out, or null }.
const playing = [];
// Effects that run for a long time (weather, butterflies, birds), by name, so each starts once.
const ambient = new Map();

let frame = null, image = null, layer = null;
function surfaces() {
  if (!frame) {
    frame = createFrame(SCENE_W, SCENE_H);
    image = new ImageData(SCENE_W, SCENE_H);
    layer = document.createElement('canvas');
    layer.width = SCENE_W;
    layer.height = SCENE_H;
  }
  return layer.getContext('2d');
}

let clock = 0;
const seed = () => Math.floor(Math.random() * 1000);

// Plays an effect once at (x, y) in room units. `seconds` cuts a looping effect short.
export function playFx(name, x, y, { view = 'room', front = true, seconds = null, ...options } = {}) {
  const fx = createFx(EFFECTS[name], { x: Math.round(x * RES), y: Math.round(y * RES), seed: seed(), ...options });
  playing.push({ fx, view, front, stopAt: seconds === null ? null : clock + seconds });
  return fx;
}

// Starts (on) or fades out (off) a long-running effect, known by `key`. Returns it while it runs, to move it.
export function ambientFx(key, name, on, { view = 'garden', front = true, x = 0, y = 0, ...options } = {}) {
  const current = ambient.get(key);
  if (on && !current) {
    const fx = playFx(name, x, y, { view, front, ...options });
    ambient.set(key, fx);
    return fx;
  }
  if (!on && current) {
    current.stop();
    ambient.delete(key);
  }
  return on ? current : null;
}

// Moves a playing effect to (x, y) in room units; `flip` turns it to face left.
export function moveFx(fx, x, y, flip = fx.options.flip) {
  fx.options.x = Math.round(x * RES);
  fx.options.y = Math.round(y * RES);
  fx.options.flip = flip;
}

export function stepFx(dt) {
  clock += dt;
  for (let i = playing.length - 1; i >= 0; i--) {
    const p = playing[i];
    p.fx.update(dt);
    if (p.stopAt !== null && clock >= p.stopAt) p.fx.stop();
    if (p.fx.done()) playing.splice(i, 1);
  }
}

// Draws the effects of `view` that go behind the cats (front = false) or over them (front = true).
export function drawFx(ctx, view, front) {
  const list = playing.filter((p) => p.view === view && p.front === front);
  if (!list.length) return;
  const out = surfaces();
  clearFrame(frame);
  for (const p of list) {
    p.fx.draw(frame, 'back');
    p.fx.draw(frame, 'front');
  }
  composite(frame, image.data, null);
  out.putImageData(image, 0, 0);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

// Clears everything, e.g. when the game starts over.
export function clearFx() {
  playing.length = 0;
  ambient.clear();
}
