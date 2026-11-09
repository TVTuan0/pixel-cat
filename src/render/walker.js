// Moves the cat around the room: walking on the floor, jumping up to the sofa or cat tree.
import { SPOTS, FLOOR_G, isHigh } from './layout.js';

const WALK_SPEED = 20; // room pixels per second
const JUMP_SECONDS = 0.6;
const JUMP_HEIGHT = 10;

// Steps to get from where the cat is to a spot.
// `from` = { x, g, base } where base is the floor x below a high perch.
export function planPath(from, spot) {
  const legs = [];
  if (isHigh(from.g)) legs.push({ type: 'jump', x: from.base ?? from.x, g: FLOOR_G });
  if (spot.base !== undefined) {
    legs.push({ type: 'walk', x: spot.base, g: FLOOR_G });
    legs.push({ type: 'jump', x: spot.x, g: spot.g, base: spot.base });
  } else {
    legs.push({ type: 'walk', x: spot.x, g: spot.g });
  }
  return legs;
}

const cat = {
  x: SPOTS.center.x,
  g: SPOTS.center.g,
  base: undefined,
  spot: 'center',
  facing: 1,
  path: [],
  jump: null, // { fromX, fromG, t }
  onArrive: null,
  walkTime: 0,
  restUntil: 0,
};

export function catPose() {
  const leg = cat.path[0];
  const moving = leg?.type === 'walk' ? 'walk' : leg?.type === 'jump' ? 'jump' : 'sit';
  return { x: Math.round(cat.x), g: Math.round(cat.g), facing: cat.facing, mode: moving, spot: cat.spot, walkFrame: Math.floor(cat.walkTime * 8) % 4 };
}

// Puts the cat straight at a spot. It sits there a few seconds before wandering.
export function placeCat(spotName, now = 0) {
  const spot = SPOTS[spotName];
  Object.assign(cat, { x: spot.x, g: spot.g, base: spot.base, spot: spotName, path: [], jump: null, onArrive: null, restUntil: now + 4000 });
}

export function goTo(spotName, onArrive = null) {
  if (cat.spot === spotName && cat.path.length === 0) {
    onArrive?.();
    return;
  }
  // Finish a jump already in the air before heading somewhere new.
  const current = cat.path[0]?.type === 'jump' ? cat.path[0] : null;
  const from = current ? { x: current.x, g: current.g, base: current.base } : { x: cat.x, g: cat.g, base: cat.base };
  cat.path = [...(current ? [current] : []), ...planPath(from, SPOTS[spotName])];
  cat.spot = null;
  cat.target = spotName;
  cat.onArrive = onArrive;
}

export function targetSpot() {
  return cat.path.length ? cat.target : cat.spot;
}

export function updateCat(dt, now) {
  const leg = cat.path[0];
  if (!leg) return;

  if (leg.type === 'walk') {
    const dx = leg.x - cat.x;
    const dg = leg.g - cat.g;
    const dist = Math.hypot(dx, dg);
    if (Math.abs(dx) > 0.5) cat.facing = Math.sign(dx);
    cat.walkTime += dt;
    if (dist <= WALK_SPEED * dt) {
      cat.x = leg.x;
      cat.g = leg.g;
      cat.path.shift();
    } else {
      cat.x += (dx / dist) * WALK_SPEED * dt;
      cat.g += (dg / dist) * WALK_SPEED * dt;
    }
  } else {
    cat.jump ??= { fromX: cat.x, fromG: cat.g, t: 0 };
    const j = cat.jump;
    if (leg.x !== j.fromX) cat.facing = Math.sign(leg.x - j.fromX);
    j.t = Math.min(1, j.t + dt / JUMP_SECONDS);
    cat.x = j.fromX + (leg.x - j.fromX) * j.t;
    cat.g = j.fromG + (leg.g - j.fromG) * j.t - Math.sin(j.t * Math.PI) * JUMP_HEIGHT;
    if (j.t >= 1) {
      cat.x = leg.x;
      cat.g = leg.g;
      cat.base = leg.base;
      cat.jump = null;
      cat.path.shift();
    }
  }

  if (cat.path.length === 0) {
    cat.spot = cat.target;
    cat.restUntil = now + 8000 + Math.random() * 8000;
    const done = cat.onArrive;
    cat.onArrive = null;
    done?.();
  }
}

// Picks somewhere new to go after resting a while.
export function maybeWander(owned, now) {
  if (cat.path.length || now < cat.restUntil) return;
  const choices = Object.entries(SPOTS).filter(([name, s]) => name !== cat.spot && s.weight > 0 && (!s.needs || owned.includes(s.needs)));
  const total = choices.reduce((sum, [, s]) => sum + s.weight, 0);
  let roll = Math.random() * total;
  for (const [name, s] of choices) {
    roll -= s.weight;
    if (roll <= 0) return goTo(name);
  }
}

export function restFor(ms, now) {
  cat.restUntil = Math.max(cat.restUntil, now + ms);
}
