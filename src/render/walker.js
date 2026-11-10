// Moves one cat around the room: walking on the floor, jumping up to the sofa or cat tree.
// Each cat gets its own walker.
import { SPOTS, FLOOR_G } from './layout.js';

const WALK_SPEED = 20; // room pixels per second
const JUMP_SECONDS = 0.6;
const JUMP_HEIGHT = 10;
const CROUCH_MS = 900; // a pounce starts low, wiggling
const LEAP_MS = 300; // then the cat springs forward
const LEAP_DISTANCE = 14;
const LEAP_HEIGHT = 5;

// Steps to get from where the cat is to a spot.
// `from` = { x, g, base } where base is the floor x below a high perch.
export function planPath(from, spot) {
  const legs = [];
  if (from.base !== undefined) legs.push({ type: 'jump', x: from.base ?? from.x, g: FLOOR_G });
  if (spot.base !== undefined) {
    legs.push({ type: 'walk', x: spot.base, g: FLOOR_G });
    legs.push({ type: 'jump', x: spot.x, g: spot.g, base: spot.base });
  } else {
    legs.push({ type: 'walk', x: spot.x, g: spot.g });
  }
  return legs;
}

// A cat that starts sitting at `spotName` and rests a few seconds before wandering.
// `spots` is the place it is in: the room (default) or the garden.
export function createWalker(spotName, now = 0, spots = SPOTS) {
  const spot = spots[spotName];
  const cat = {
    x: spot.x,
    g: spot.g,
    base: spot.base,
    spot: spotName,
    target: spotName,
    facing: 1,
    path: [],
    jump: null, // { fromX, fromG, t }
    onArrive: null,
    walkTime: 0,
    restUntil: now + 4000,
    face: null, // which way to turn on arrival
    pounce: null, // { start, fromX, fromG, dir }
    pace: 1, // walking speed, as a share of the usual
    canJump: true, // newborns can't get up onto perches yet
  };

  // Heads to `spot` ({ x, g, base?, face? }), known by `name`.
  function go(name, spot, onArrive) {
    cat.pounce = null;
    if (cat.spot === name && cat.path.length === 0) {
      if (spot.face) cat.facing = spot.face;
      onArrive?.();
      return;
    }
    // Finish a jump already in the air before heading somewhere new.
    const current = cat.path[0]?.type === 'jump' ? cat.path[0] : null;
    const from = current ? { x: current.x, g: current.g, base: current.base } : { x: cat.x, g: cat.g, base: cat.base };
    cat.path = [...(current ? [current] : []), ...planPath(from, spot)];
    cat.spot = null;
    cat.target = name;
    cat.face = spot.face ?? null;
    cat.onArrive = onArrive;
  }

  const goTo = (spotName, onArrive = null) => go(spotName, spots[spotName], onArrive);

  // Crouches, wiggles, then springs forward. `dir` 1 = right. Only from the floor.
  function startPounce(now, dir) {
    if (cat.path.length || cat.base !== undefined) return false; // not from up on a perch
    cat.facing = dir;
    cat.pounce = { start: now, fromX: cat.x, fromG: cat.g, dir };
    cat.spot = null;
    return true;
  }

  function updatePounce(now) {
    const p = cat.pounce;
    const leap = (now - p.start - CROUCH_MS) / LEAP_MS;
    if (leap <= 0) return;
    const t = Math.min(1, leap);
    cat.x = p.fromX + p.dir * LEAP_DISTANCE * t;
    cat.g = p.fromG - Math.sin(t * Math.PI) * LEAP_HEIGHT;
    if (t >= 1) {
      cat.g = p.fromG;
      cat.pounce = null;
      cat.restUntil = now + 3000;
    }
  }

  function update(dt, now) {
    if (cat.pounce) return updatePounce(now);
    const leg = cat.path[0];
    if (!leg) return;

    if (leg.type === 'walk') {
      const dx = leg.x - cat.x;
      const dg = leg.g - cat.g;
      const dist = Math.hypot(dx, dg);
      if (Math.abs(dx) > 0.5) cat.facing = Math.sign(dx);
      cat.walkTime += dt;
      const speed = WALK_SPEED * cat.pace;
      if (dist <= speed * dt) {
        cat.x = leg.x;
        cat.g = leg.g;
        cat.path.shift();
      } else {
        cat.x += (dx / dist) * speed * dt;
        cat.g += (dg / dist) * speed * dt;
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
      if (cat.face) cat.facing = cat.face;
      cat.restUntil = now + 8000 + Math.random() * 8000;
      const done = cat.onArrive;
      cat.onArrive = null;
      done?.();
    }
  }

  // Picks somewhere new to go after resting a while, skipping spots in `taken` (where other cats are or are going).
  function wander(owned, now, taken = []) {
    if (cat.path.length || cat.pounce || now < cat.restUntil) return;
    const choices = Object.entries(spots).filter(([name, s]) =>
      name !== cat.spot && !taken.includes(name) && s.weight > 0 && (!s.needs || owned.includes(s.needs))
      && (cat.canJump || s.base === undefined));
    const total = choices.reduce((sum, [, s]) => sum + s.weight, 0);
    let roll = Math.random() * total;
    for (const [name, s] of choices) {
      roll -= s.weight;
      if (roll <= 0) return goTo(name);
    }
  }

  return {
    goTo,
    goToPoint: (name, point, onArrive = null) => go(name, point, onArrive),
    startPounce,
    // How this cat gets about at its age.
    setAge(pace, canJump) {
      cat.pace = pace;
      cat.canJump = canJump;
    },
    update,
    wander,
    target: () => (cat.path.length ? cat.target : cat.spot),
    restFor: (ms, now) => { cat.restUntil = Math.max(cat.restUntil, now + ms); },
    pose(now = performance.now()) {
      const leg = cat.path[0];
      let mode = leg?.type === 'walk' ? 'walk' : leg?.type === 'jump' ? 'jump' : 'sit';
      if (cat.pounce) mode = now - cat.pounce.start < CROUCH_MS ? 'crouch' : 'leap';
      return { x: Math.round(cat.x), g: Math.round(cat.g), facing: cat.facing, mode, spot: cat.spot, walkFrame: Math.floor(cat.walkTime * 8) % 4 };
    },
  };
}
