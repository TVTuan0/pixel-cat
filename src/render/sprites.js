// Small pixel sprites as text grids. One character = one color, '.' = empty.

const FACE_COLORS = { pink: '#ff8fa3', eye: '#2a1d1d', white: '#ffffff', blush: '#ffb3c1' };

// One palette per fur. `patch` adds the dark spots of a calico.
export const FURS = {
  orange: { ...FACE_COLORS, outline: '#4a2c2a', fur: '#f2a65a', furLight: '#ffe0b8', stripe: '#d9783a' },
  grey: { ...FACE_COLORS, outline: '#2f3340', fur: '#9aa0ad', furLight: '#dfe3ea', stripe: '#6f7583' },
  black: { ...FACE_COLORS, outline: '#15151d', fur: '#3a3a48', furLight: '#6a6a7a', stripe: '#2a2a36', eye: '#ffd84a' },
  white: { ...FACE_COLORS, outline: '#6b5d55', fur: '#f7f4ee', furLight: '#ffffff', stripe: '#e3ddd2' },
  calico: { ...FACE_COLORS, outline: '#4a2c2a', fur: '#f7f4ee', furLight: '#ffffff', stripe: '#f2a65a', patch: '#3a3a48' },
};


// Body sizes per growth stage, in room pixels. `side` is the walking (side view) shape.
export const CAT_SIZES = {
  kitten: { hw: 15, hh: 12, bw: 11, bh: 8, ear: 4, side: { L: 14, H: 7, leg: 3, hw: 11, hh: 10 } },
  young: { hw: 17, hh: 13, bw: 15, bh: 11, ear: 4, side: { L: 19, H: 9, leg: 4, hw: 13, hh: 11 } },
  adult: { hw: 19, hh: 14, bw: 19, bh: 14, ear: 5, side: { L: 24, H: 11, leg: 4, hw: 15, hh: 12 } },
};

export const SPRITES = {
  hat_bow: {
    colors: { o: '#7a2e45', p: '#ff7aa8', k: '#d6457a' },
    rows: ['oo...oo', 'opo.opo', 'opkkkpo', 'opo.opo', 'oo...oo'],
  },
  hat_party: {
    colors: { o: '#3a2a4a', y: '#ffd84a', b: '#5ab0ff', r: '#ff5a6e' },
    rows: ['...y...', '..oyo..', '..obo..', '.orrro.', '.obbbo.', 'orrrrro', 'obbbbbo'],
  },
  hat_crown: {
    colors: { y: '#ffcf3a', r: '#e8384f', b: '#3a7bff', o: '#b8860b' },
    rows: ['y...y...y', 'yy.yry.yy', 'yyyyyyyyy', 'ybyyryyby', 'ooooooooo'],
  },
  collar_red: {
    colors: { c: '#e8384f' },
    rows: ['.cccccc.', 'cc....cc', 'cc....cc', '.cccccc.'],
  },
  collar_blue: {
    colors: { c: '#3a7bff' },
    rows: ['.cccccc.', 'cc....cc', 'cc....cc', '.cccccc.'],
  },
  collar_gold: {
    colors: { c: '#8b4513', g: '#ffcf3a' },
    rows: ['.cccccc.', 'cc....cc', 'cc....cc', '.ccggcc.', '...gg...'],
  },
  fish: {
    colors: { o: '#2a4a7a', b: '#6cc3ff', k: '#1a1a2e' },
    rows: ['..ooo..o', '.obbbooo', 'obkbbbbo', '.obbbooo', '..ooo..o'],
  },
  goldfish: {
    colors: { o: '#a0521d', b: '#ffb347', k: '#1a1a2e' },
    rows: ['..ooo..o', '.obbbooo', 'obkbbbbo', '.obbbooo', '..ooo..o'],
  },
  toy_yarn: {
    colors: { o: '#4a3a8a', p: '#9b7bff', q: '#cdbbff' },
    rows: ['.oooo.', 'oppqpo', 'opqppo', 'oqpppo', 'oppqpo', '.oooo.'],
  },
  toy_mouse: {
    colors: { o: '#5a5a6a', g: '#b8b8c8', p: '#ff8fa3', k: '#1a1a2e' },
    rows: ['..pp.....', '.ogggg...', 'okggggo..', '.oooooopp'],
  },
  decor_plant: {
    colors: { l: '#4caf50', s: '#2e7d32', o: '#7a3a2a', t: '#d0704a' },
    rows: [
      '...l.l...', '..lll.l..', '.l.lll.l.', 'llll.llll', '.lllllll.', '..lllll..',
      '...lll...', '....s....', '.ooooooo.', '.ottttto.', '..ottto..', '..ottto..', '..ooooo..',
    ],
  },
  decor_rug: {
    colors: { r: '#c8553d', y: '#f2c14e' },
    rows: ['.rrrrrr.', 'ryyyyyyr', 'rrrrrrrr', '.rrrrrr.'],
  },
  decor_frame: {
    colors: { o: '#8a5a2a', s: '#bfe6ff', b: '#6cc3ff', k: '#1a1a2e' },
    rows: ['oooooooo', 'ossssbso', 'osbbkbbo', 'ossssbso', 'oooooooo'],
  },
  decor_lights: {
    colors: { w: '#4a4a5a', r: '#ff5a6e', b: '#5ab0ff', y: '#ffd84a', g: '#5cc96b' },
    rows: ['w........w', '.ww....ww.', '.r.wwww.b.', '...y..g...'],
  },
  decor_beanbag: {
    colors: { o: '#a0521d', b: '#ff9f43', l: '#ffc785' },
    rows: ['...oooo...', '..obbbbo..', '.obblbbbo.', 'obblbbbbbo', 'obbbbbbbbo', 'obbbbbbbbo', '.oooooooo.'],
  },
  decor_fishbowl: {
    colors: { o: '#9fd6ff', w: '#6cc3ff', f: '#ff8a3d' },
    rows: ['...ooooo...', '..o.....o..', '.owwwwwwwo.', 'owwwwffwwwo', 'owwwwwfffwo', 'owwwwffwwwo', '.owwwwwwwo.', '..owwwwwo..', '...ooooo...'],
  },
  wall_stripes: {
    colors: { p: '#ffe3ea', q: '#ffb3c6' },
    rows: Array(8).fill('ppqqppqq'),
  },
  wall_mint: {
    colors: { m: '#dff5e8', l: '#6cc08b' },
    rows: ['mmmmmmmm', 'mlmmmmmm', 'mmmmmlmm', 'mmmmmmmm', 'mmlmmmmm', 'mmmmmmml', 'mmmmmmmm', 'mmmmlmmm'],
  },
  wall_stars: {
    colors: { b: '#dfe9ff', w: '#ffffff', y: '#ffd84a' },
    rows: ['bbbbbbbb', 'bwbbbbbb', 'bbbbbybb', 'bbbbbbbb', 'bbybbbbb', 'bbbbbbwb', 'bbbbbbbb', 'bbbbwbbb'],
  },
  floor_dark: {
    colors: { d: '#6e4a3a', l: '#5a3a2c' },
    rows: ['dddldddd', 'dddldddd', 'llllllll', 'ddddddld', 'ddddddld', 'llllllll', 'dldddddd', 'dldddddd'],
  },
  floor_tiles: {
    colors: { c: '#f3ead8', t: '#9fd3c7' },
    rows: ['cccctttt', 'cccctttt', 'cccctttt', 'cccctttt', 'ttttcccc', 'ttttcccc', 'ttttcccc', 'ttttcccc'],
  },
  floor_carpet: {
    colors: { c: '#b49ad6', s: '#9a7fc0' },
    rows: ['cccccccc', 'cscccccc', 'ccccccsc', 'cccscccc', 'cccccccc', 'csccccsc', 'cccccccc', 'ccccsccc'],
  },
  bowl: {
    colors: { o: '#3a3a5a', b: '#5ab0ff' },
    rows: ['oooooooooo', 'obbbbbbbbo', '.obbbbbbo.', '..oooooo..'],
  },
  food_kibble: {
    colors: { k: '#b06a3b', o: '#3a3a5a', b: '#5ab0ff' },
    rows: ['..k.kk.k..', '.kkkkkkkk.', 'oooooooooo', 'obbbbbbbbo', '.obbbbbbo.', '..oooooo..'],
  },
  food_fish: null, // uses fish
  food_cream: {
    colors: { w: '#fffaf0', o: '#7a2e45', p: '#ff8fa3' },
    rows: ['..wwwwww..', '.wwwwwwww.', 'oooooooooo', 'oppppppppo', '.oppppppo.', '..oooooo..'],
  },
  litter: {
    colors: { o: '#3c5a6e', S: '#f1d9a7', B: '#7fb8d6' },
    rows: [
      'oooooooooooooooo', 'oSSSSSSSSSSSSSSo', 'oBBBBBBBBBBBBBBo', 'oBBBBBBBBBBBBBBo',
      'oBBBBBBBBBBBBBBo', '.oooooooooooooo.',
    ],
  },
  heart: { colors: { r: '#ff4d6d' }, rows: ['.r.r.', 'rrrrr', '.rrr.', '..r..'] },
  zzz: { colors: { z: '#ffffff' }, rows: ['zzzz', '..z.', '.z..', 'zzzz'] },
  sparkle: { colors: { w: '#ffffff' }, rows: ['.w.', 'www', '.w.'] },
  coin: {
    colors: { o: '#b8860b', y: '#ffd23f', w: '#fff6c8' },
    rows: ['.oooo.', 'oywyyo', 'owyyyo', 'oyyyyo', 'oyyyyo', '.oooo.'],
  },
  moon: {
    colors: { y: '#ffe066' },
    rows: ['..yyyy..', '.yyy....', 'yyy.....', 'yyy.....', 'yyy.....', 'yyy.....', '.yyy....', '..yyyy..'],
  },
  sun: {
    colors: { y: '#ffb703' },
    rows: [
      '....y....', '.y..y..y.', '..yyyyy..', '..yyyyy..', 'yyyyyyyyy',
      '..yyyyy..', '..yyyyy..', '.y..y..y.', '....y....',
    ],
  },
  bag: {
    colors: { o: '#7a2e45', b: '#ff8fa3', w: '#ffffff' },
    rows: ['..oooo..', '.o....o.', '.o....o.', 'oooooooo', 'obbbbbbo', 'obbwwbbo', 'obbwwbbo', 'obbbbbbo', 'oooooooo'],
  },
  camera: {
    colors: { o: '#2a2a3a', g: '#5a6a7a', w: '#cfe8ff', k: '#1a1a2e' },
    rows: ['..ooo.....', 'oooooooooo', 'ogggwwgggo', 'oggwkkwggo', 'oggwkkwggo', 'ogggwwgggo', 'oooooooooo'],
  },
  broom: {
    colors: { o: '#8a5a2a', y: '#e8c35a' },
    rows: ['.......o.', '......o..', '.....o...', '....o....', '...o.....', '..yyy....', '.yyyyy...', 'yyyyyy...', 'yyyyy....', 'yyyy.....'],
  },
  star: {
    colors: { y: '#ffd84a', o: '#b8860b' },
    rows: ['...o...', '..oyo..', 'oooyooo', 'oyyyyyo', '.oyyyo.', 'oyo.oyo', 'oo...oo'],
  },
  sound_on: {
    colors: { o: '#ffd84a' },
    rows: ['...o......', '..oo...o..', 'oooo.o..o.', 'oooo..o.o.', 'oooo..o.o.', 'oooo.o..o.', '..oo...o..', '...o......'],
  },
  sound_off: {
    colors: { o: '#cbbde6' },
    rows: ['...o......', '..oo......', 'oooo.o..o.', 'oooo..oo..', 'oooo..oo..', 'oooo.o..o.', '..oo......', '...o......'],
  },
  gear: {
    colors: { g: '#8a8aa0', o: '#4a4a60' },
    rows: ['...gg...', '.gggggg.', '.gg..gg.', 'ggo..ogg', 'ggo..ogg', '.gg..gg.', '.gggggg.', '...gg...'],
  },
  basket: {
    colors: { o: '#6b3e1f', b: '#c98b4a', l: '#e0aa6a' },
    rows: ['oo............oo', 'obo..........obo', 'obbllllllllllbbo', 'obblbblbblbblbbo', '.obbbbbbbbbbbbo.', '..oooooooooooo..'],
  },
};

SPRITES.food_fish = SPRITES.fish;

export function spriteSize(name) {
  const s = SPRITES[name];
  return { w: s.rows[0].length, h: s.rows.length };
}

export function drawSprite(ctx, name, x, y, flip = false) {
  const { colors, rows } = SPRITES[name];
  const w = rows[0].length;
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const color = colors[row[rx]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + (flip ? w - 1 - rx : rx), y + ry, 1, 1);
    }
  });
}

// A small canvas showing one sprite, for buttons and shop rows.
export function spriteCanvas(name, scale = 4) {
  const { w, h } = spriteSize(name);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.className = 'sprite-icon';
  canvas.style.width = `${w * scale}px`;
  canvas.style.height = `${h * scale}px`;
  drawSprite(canvas.getContext('2d'), name, 0, 0);
  return canvas;
}
