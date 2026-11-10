import { F } from './fine.js';

// Small pixel sprites as text grids. One character = one color, '.' = empty.

const FACE_COLORS = { pink: '#ff8fa3', eye: '#2a1d1d', white: '#ffffff', blush: '#ffb3c1' };

// One palette per fur. `shade` darkens the back and sides for shape. `stripes` draws tabby stripes,
// `patch` the dark spots of a calico, and `points` the dark face, ears, paws and tail of a Siamese.
export const FURS = {
  orange: { ...FACE_COLORS, outline: '#4a2c2a', fur: '#f2a65a', furLight: '#ffe0b8', stripe: '#d9783a', shade: '#de8f48', stripes: true },
  grey: { ...FACE_COLORS, outline: '#2f3340', fur: '#9aa0ad', furLight: '#dfe3ea', stripe: '#6f7583', shade: '#878d9b' },
  black: { ...FACE_COLORS, outline: '#15151d', fur: '#3a3a48', furLight: '#6a6a7a', stripe: '#2a2a36', shade: '#30303c', eye: '#ffd84a' },
  white: { ...FACE_COLORS, outline: '#6b5d55', fur: '#f7f4ee', furLight: '#ffffff', stripe: '#e3ddd2', shade: '#e6e0d4' },
  calico: { ...FACE_COLORS, outline: '#4a2c2a', fur: '#f7f4ee', furLight: '#ffffff', stripe: '#f2a65a', shade: '#e6e0d4', patch: '#3a3a48' },
  tuxedo: { ...FACE_COLORS, outline: '#101016', fur: '#2a2a34', furLight: '#ffffff', stripe: '#2a2a34', shade: '#1f1f28', eye: '#8fd65a' },
  tabby: { ...FACE_COLORS, outline: '#3a2a1c', fur: '#a8845c', furLight: '#ecdcc2', stripe: '#5a4028', shade: '#94724c', stripes: true },
  siamese: { ...FACE_COLORS, outline: '#4a3a30', fur: '#efe2c8', furLight: '#fbf4e6', stripe: '#ddcdb0', shade: '#ddcdb0', points: '#4a3428', eye: '#5ab0ff' },
};


// An old cat's fur, a little faded toward grey.
const mix = (hex, toward, amount) => {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(toward.slice(1), 16);
  const ch = (n, shift) => Math.round(((n >> shift) & 255) * (1 - amount) + ((b >> shift) & 255) * amount);
  return `#${[16, 8, 0].map((s) => ch(a, s).toString(16).padStart(2, '0')).join('')}`;
};
const agedCache = new Map();
export function agedFur(fur) {
  if (!agedCache.has(fur)) {
    const p = { ...FURS[fur] };
    for (const key of ['fur', 'furLight', 'shade', 'stripe', 'patch', 'points']) if (p[key]) p[key] = mix(p[key], '#d6d2ca', 0.35);
    agedCache.set(fur, p);
  }
  return agedCache.get(fur);
}


export const SPRITES = {
  hat_bow: {
    cell: 0.5,
    colors: { o: '#7a2e45', p: '#ff7aa8', l: '#ffc0d8', k: '#d6457a' },
    rows: [
      '.oo.......oo.', 'oppo.....oppo', 'oplpoo.oopppo', 'oppppokkopppo',
      'opppokkkkoppo', 'oppppokkopppo', 'opppoo.oopppo', 'oppo.....oppo',
      '.oo.......oo.',
    ],
  },
  hat_party: {
    cell: 0.5,
    colors: { o: '#3a2a4a', y: '#ffd84a', b: '#5ab0ff', r: '#ff5a6e' },
    rows: [
      '......yy......', '.....yyyy.....', '......yy......', '......oo......',
      '.....orro.....', '.....obbo.....', '....orrrro....', '....obbbbo....',
      '...orrrrrro...', '...obbybbbo...', '..orrrrrrrro..', '..obbbbbbbbo..',
      '.oyyyyyyyyyyo.', '.oooooooooooo.',
    ],
  },
  hat_crown: {
    cell: 0.5,
    colors: { y: '#ffcf3a', l: '#fff2a0', r: '#e8384f', b: '#3a7bff', o: '#b8860b' },
    rows: [
      'y.......y.......y', 'yy.....yly.....yy', 'yyy...yyryy...yyy', 'yyyy.yyyyyyy.yyyy',
      'ylyyyyyyyyyyyyyly', 'yyyyyyyyyyyyyyyyy', 'yybyyyyrrryyyybyy', 'yyyyyyyyyyyyyyyyy',
      'ooooooooooooooooo',
    ],
  },
  collar_red: {
    cell: 0.5,
    colors: { c: '#e8384f', l: '#ff7a8a', d: '#a82038' },
    rows: [
      '...cccccccccc...', '.ccllllllllllcc.', 'cc............cc', 'cc............cc',
      'cc............cc', '.ccddddddddddcc.', '...cccccccccc...',
    ],
  },
  collar_blue: {
    cell: 0.5,
    colors: { c: '#3a7bff', l: '#8ab4ff', d: '#2050b8' },
    rows: [
      '...cccccccccc...', '.ccllllllllllcc.', 'cc............cc', 'cc............cc',
      'cc............cc', '.ccddddddddddcc.', '...cccccccccc...',
    ],
  },
  collar_gold: {
    cell: 0.5,
    colors: { c: '#8b4513', l: '#b86a30', d: '#5a2a08', g: '#ffcf3a' },
    rows: [
      '...cccccccccc...', '.ccllllllllllcc.', 'cc............cc', 'cc............cc',
      'cc............cc', '.ccddddggddddcc.', '...ccccggcccc...', '......gggg......',
      '.......gg.......',
    ],
  },
  fish: {
    cell: 0.5,
    colors: { o: '#2a4a7a', b: '#6cc3ff', l: '#a8e0ff', d: '#3a8ad8', w: '#ffffff', k: '#1a1a2e' },
    rows: [
      '....ooooo.....oo', '..oobbbbboo..obo', '.obwbbblbbbooobo', 'obkbbbbbbbbbbbbo',
      'obbbbbbbbbbbbbbo', '.obbbbdbbbbooobo', '..oodddddoo..obo', '....ooooo.....oo',
    ],
  },
  goldfish: {
    cell: 0.5,
    colors: { o: '#a0521d', b: '#ffb347', l: '#ffd890', d: '#e08a2a', w: '#ffffff', k: '#1a1a2e' },
    rows: [
      '....ooooo.....oo', '..oobbbbboo..obo', '.obwbbblbbbooobo', 'obkbbbbbbbbbbbbo',
      'obbbbbbbbbbbbbbo', '.obbbbdbbbbooobo', '..oodddddoo..obo', '....ooooo.....oo',
    ],
  },
  toy_yarn: {
    cell: 0.5,
    colors: { o: '#4a3a8a', p: '#9b7bff', q: '#cdbbff', d: '#7a5ad6' },
    rows: [
      '...oooooo...', '..oppqppdo..', '.opqppqppdo.', 'oppqpppqppdo', 'oqpppqpppqdo', 'opppqpppqpdo',
      'oppqpppqppdo', 'opqpppqpppdo', '.oppqpppqdo.', '..odddddo...', '...oooooo..p', '..........pp',
    ],
  },
  toy_mouse: {
    cell: 0.5,
    colors: { o: '#5a5a6a', g: '#b8b8c8', l: '#d8d8e4', p: '#ff8fa3', k: '#1a1a2e' },
    rows: [
      '...pp.............', '..pgpo............', '.oggggoo..........', 'okglgggggoo.......', 'opgggggggggo......',
      '.oggggggggggopp...', '..ooooooooooo.pppp', '................pp',
    ],
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
  floor_oak: {
    colors: { a: '#c4803f', b: '#d39150', c: '#b37036', l: '#7a4a22' },
    rows: ['aaaalbbb', 'aaaalbbb', 'llllllll', 'cccbbbbl', 'cccbbbbl', 'llllllll', 'blaaaaaa', 'blaaaaaa'],
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
    cell: 0.5,
    colors: { k: '#b06a3b', h: '#d8945a', o: '#2a4a7a', l: '#a8d8ff', b: '#5ab0ff' },
    rows: [
      '......kk..kk..k.....', '....kkkkkkkkkkkk....', '...kkhkkkkhkkkhkk...', 'oooooooooooooooooooo',
      'ollllllllllllllllllo', 'obbbbbbbbbbbbbbbbbbo', '.obbbbbbbbbbbbbbbbo.', '..obbbbbbbbbbbbbbo..',
      '...oooooooooooooo...',
    ],
  },
  food_fish: null, // uses fish
  food_cream: {
    cell: 0.5,
    colors: { w: '#fffaf0', h: '#ffffff', o: '#7a2e45', l: '#ffc0d0', b: '#ff8fa3' },
    rows: [
      '......wwwwwwww......', '....wwwwwwwwwwww....', '...wwhwwwwwwwwwww...', 'oooooooooooooooooooo',
      'ollllllllllllllllllo', 'obbbbbbbbbbbbbbbbbbo', '.obbbbbbbbbbbbbbbbo.', '..obbbbbbbbbbbbbbo..',
      '...oooooooooooooo...',
    ],
  },
  litter: {
    colors: { o: '#3c5a6e', S: '#f1d9a7', B: '#7fb8d6' },
    rows: [
      'oooooooooooooooo', 'oSSSSSSSSSSSSSSo', 'oBBBBBBBBBBBBBBo', 'oBBBBBBBBBBBBBBo',
      'oBBBBBBBBBBBBBBo', '.oooooooooooooo.',
    ],
  },
  cushion: {
    colors: { o: '#6b5040', c: '#c9b08a', d: '#a08860' },
    rows: ['..oooooo..', '.occcccco.', 'occdccdcco', 'occcccccco', '.oooooooo.'],
  },
  cat_tree: {
    colors: { p: '#7a6ad6', q: '#4a3a8a', s: '#d9c49a', b: '#a87a50', d: '#6b4420' },
    rows: [
      '.pppppp...', '.qqqqqq...', '...ss.....', '...ss.pppp', '...ss.qqqq',
      '...ss.....', '...ss.....', '...ss.....', 'bbbbbbbbb.', 'ddddddddd.',
    ],
  },
  soft_bed: {
    colors: { r: '#7a2e45', p: '#c0587a', w: '#ffb3c6' },
    rows: ['.rrrrrrrrrr.', 'rppppppppppr', 'rpwwwwwwwwpr', 'rpwwwwwwwwpr', 'rrrrrrrrrrrr'],
  },
  auto_feeder: {
    colors: { o: '#3a3a5a', g: '#d8e0ea', k: '#b06a3b', b: '#5ab0ff' },
    rows: ['.oooooo.', '.oggggo.', '.okkkko.', '.oggggo.', '.oggggo.', 'oooooooo', 'obbbbbbo', '.oooooo.'],
  },
  auto_litter: {
    colors: { o: '#3c5a6e', h: '#9fd6ff', g: '#5cc96b', k: '#2a2a3a' },
    rows: [
      '....oooooooo....', '..oohhhhhhhhoo..', '.ohhhhhhhhhhhho.', 'ohhhhhgghhhhhhho',
      'ohhhhkkkkkkhhhho', 'ohhhhkkkkkkhhhho', '.oooooooooooooo.',
    ],
  },
  sofa: {
    colors: { b: '#2f4f8a', B: '#5b8bd9', l: '#7fa6e6', L: '#a8c4f0', d: '#5a3a1e' },
    rows: ['..bbbbbbbbbb..', '.bBBBBBBBBBBb.', 'lbBBBBBBBBBBbl', 'llLLLLLLLLLLll', 'llbbbbbbbbbbll', '.d..........d.'],
  },
  bookshelf: {
    colors: { o: '#8a5a2a', d: '#5a3a1e', r: '#e8384f', b: '#3a7bff', y: '#f2c14e', g: '#5cc96b', p: '#9b7bff' },
    rows: [
      'oooooooooo', 'odrbydgdpo', 'odrbydgdpo', 'oooooooooo', 'odgdpryddo',
      'odgdpryddo', 'oooooooooo', 'oddydbrddo', 'oddydbrddo', 'oooooooooo',
    ],
  },
  lamp: {
    colors: { y: '#ffd27f', o: '#8a5a2a', g: '#4a4a5a' },
    rows: ['..yyyy..', '.yyyyyy.', 'yyyyyyyy', 'oooooooo', '...gg...', '...gg...', '...gg...', '...gg...', '.gggggg.'],
  },
  // Icons for the four stats in the top bar.
  stat_hunger: {
    colors: { o: '#2a6a9a', b: '#6cc3ff', k: '#1a1a2e' },
    rows: ['..ooo...', '.obbbo.o', 'obkbbboo', 'obbbbbbo', 'obbbbboo', '.obbbo.o', '..ooo...'],
  },
  stat_happiness: {
    colors: { r: '#ff4d6d', w: '#ffffff' },
    rows: ['.rr.rr.', 'rwrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'],
  },
  stat_energy: {
    colors: { y: '#ffd84a' },
    rows: ['...yyy', '..yyy.', '.yyy..', 'yyyyyy', '..yyy.', '.yyy..', '.yy...', 'y.....'],
  },
  stat_cleanliness: {
    colors: { b: '#5ab0ff', w: '#ffffff' },
    rows: ['...b...', '..bbb..', '.bbbbb.', 'bbwbbbb', 'bwbbbbb', 'bbbbbbb', '.bbbbb.', '..bbb..'],
  },
  heart: {
    cell: 0.5,
    colors: { r: '#ff4d6d', d: '#c8304e', w: '#ffffff' },
    rows: ['.rr...rr.', 'rwrr.rrrr', 'rwrrrrrrr', 'rrrrrrrrd', '.rrrrrrd.', '..rrrrd..', '...rrd...', '....d....'],
  },
  bug: {
    cell: 0.5,
    colors: { k: '#2a1d1d', r: '#c83a3a', l: '#7a6a85', w: '#ffffff' },
    rows: ['.l..l.', '..kk..', '.kwrk.', 'krkrrk', 'krrkrk', '.kkkk.'],
  },
  anger: {
    cell: 0.5,
    colors: { r: '#e8384f', d: '#a82038' },
    rows: [
      '.rr....rr.', 'rd.r..r.dr', 'r..r..r..r', '.rrr..rrr.', '..........',
      '..........', '.rrr..rrr.', 'r..r..r..r', 'rd.r..r.dr', '.rr....rr.',
    ],
  },
  zzz: {
    cell: 0.5,
    colors: { z: '#ffffff', s: '#a8b4e0' },
    rows: ['zzzzz....', 'sssz.....', '..z......', '.z...zzz.', 'zzzzzssz.', 'sssss.z..', '.....zzz.', '.....sss.'],
  },
  sparkle: {
    cell: 0.5,
    colors: { w: '#ffffff', y: '#fff6b0' },
    rows: ['...w...', '...w...', '..wyw..', 'wwyyyww', '..wyw..', '...w...', '...w...'],
  },
  garden_door: {
    colors: { o: '#3e5a2a', g: '#6cc04a', w: '#cfe8ff', b: '#9fd8ff', y: '#ffd84a' },
    rows: ['.oooooo.', 'oggggggo', 'ogwwwwgo', 'ogwbbwgo', 'ogwwwwgo', 'oggggggo', 'ogggggyo', 'oggggggo', 'oggggggo', 'oooooooo'],
  },
  // Buttons for going between the room and the garden.
  nav_garden: {
    colors: { g: '#5cc96b', d: '#2e7d32', b: '#8a5a2a' },
    rows: ['..gggg..', '.gggggg.', 'gggdgggg', 'gggggdgg', '.gggggg.', '..gggg..', '...bb...', '...bb...', '..bbbb..'],
  },
  nav_home: {
    colors: { r: '#e8384f', w: '#f6e7d0', b: '#5ab0ff', k: '#8a5a2a' },
    rows: ['....r....', '...rrr...', '..rrrrr..', '.rrrrrrr.', '.wwwwwww.', '.wbwwkkw.', '.wwwwkkw.'],
  },
  // Things a cat brings home.
  present_leaf: {
    cell: 0.5,
    colors: { g: '#5cc96b', l: '#8ee07a', d: '#2e7d32', s: '#7a5a3a' },
    rows: [
      '.........ggg', '.......gglgg', '.....gglggdg', '....gglggdg.', '...gglgdgg..', '..gggdgg....',
      '.ggdgg......', '.gdgg.......', 'sd..........', 's...........',
    ],
  },
  present_feather: {
    cell: 0.5,
    colors: { w: '#ffffff', g: '#c8d0e0', q: '#8a96b0' },
    rows: [
      '..........ww', '........wwwg', '......wwwwg.', '....wwwwgg..', '...wwwggg...', '..wwgg......',
      '.wgg........', 'q...........',
    ],
  },
  present_sock: {
    cell: 0.5,
    colors: { r: '#e8384f', d: '#b02a3a', w: '#ffffff', g: '#e0e0e8' },
    rows: [
      '.wwwwww...', '.wgwgwg...', '.rrrrrr...', '.rwwwwr...', '.rrrrrr...', '.rrrrrd...', '.rwwwwr...',
      '.rrrrrd...', 'rrrrrrrr..', 'rrrrrrrrd.', 'wwwwwwwgg.', '.wwwwwgg..',
    ],
  },
  present_box: {
    cell: 0.5,
    colors: { b: '#5ab0ff', l: '#8ccaff', d: '#3a8ad8', r: '#e8384f', y: '#ffd84a', o: '#2a4a7a' },
    rows: [
      '..yy....yy..', '.y..y..y..y.', '..yy.rr.yy..', 'ooooorroooo.', 'olllllrllllo', 'orrrrrrrrrro',
      'obbbbrrbbbbo', 'obbbbrrbbbdo', 'obbbbrrbbbdo', 'obbbbrrbbddo', 'oddddrrdddo.', 'ooooooooooo.',
    ],
  },
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
  trophy_gold: { colors: { y: '#ffcf3a', l: '#ffffff', o: '#8a5a2a' }, rows: ['yyyyy', 'ylyyy', '.yyy.', '..y..', '.yyy.', 'ooooo'] },
  trophy_silver: { colors: { y: '#d9dde6', l: '#ffffff', o: '#5a5a6a' }, rows: ['yyyyy', 'ylyyy', '.yyy.', '..y..', '.yyy.', 'ooooo'] },
  trophy_bronze: { colors: { y: '#d0884a', l: '#ffffff', o: '#6b3e1f' }, rows: ['yyyyy', 'ylyyy', '.yyy.', '..y..', '.yyy.', 'ooooo'] },
  arrow: {
    cell: 0.5,
    colors: { y: '#ffd84a', l: '#fff2b0', o: '#7a5a00' },
    rows: ['ooooooooo', 'olllllllo', 'oyyyyyyyo', '.oyyyyyo.', '..oyyyo..', '...oyo...', '....o....'],
  },
  paw: {
    colors: { p: '#ff8fa3', o: '#7a2e45' },
    rows: ['.o.o.o.', 'opopopo', '.o.o.o.', '..ooo..', '.opppo.', 'opppppo', '.ooooo.'],
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
    cell: 0.5,
    colors: { o: '#6b3e1f', b: '#c98b4a', l: '#e0aa6a', d: '#8a5a2a' },
    rows: [
      'oo............................oo', 'obo..........................obo', 'obbo........................obbo', 'obbllllllllllllllllllllllllllbbo',
      'obblbbdlbbdlbbdlbbdlbbdlbbdlbbbo', 'obbdbbldbbldbbldbbldbbldbbllbbbo', 'obblbbdlbbdlbbdlbbdlbbdlbbdlbbbo', 'obbdbbldbbldbbldbbldbbldbbllbbbo',
      'obblbbdlbbdlbbdlbbdlbbdlbbdlbbbo', 'obbdbbldbbldbbldbbldbbldbbllbbbo', '.obbbbbbbbbbbbbbbbbbbbbbbbbbbbo.', '..oooooooooooooooooooooooooooo..',
    ],
  },
};

SPRITES.food_fish = SPRITES.fish;

// A sprite's size in room units. Sprites with `cell: 0.5` are laid out at half-unit detail, then painted on the
// chunky grid like the rest of the art (see fine.js).
export function spriteSize(name) {
  const s = SPRITES[name];
  const cell = s.cell ?? 1;
  return { w: s.rows[0].length * cell, h: s.rows.length * cell };
}

export function drawSprite(ctx, name, x, y, flip = false) {
  const { colors, rows, cell = 1 } = SPRITES[name];
  const w = rows[0].length;
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const color = colors[row[rx]];
      if (!color) continue;
      const col = flip ? w - 1 - rx : rx;
      if (cell < 1) {
        F(ctx, Math.round(x * 2) + col, Math.round(y * 2) + ry, 1, 1, color);
        continue;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x + col, y + ry, 1, 1);
    }
  });
}

// A small canvas showing one sprite, for buttons and shop rows.
export function spriteCanvas(name, scale = 4) {
  const { w, h } = spriteSize(name);
  const cell = SPRITES[name].cell ?? 1;
  const canvas = document.createElement('canvas');
  canvas.width = w / cell; // one canvas pixel per sprite cell
  canvas.height = h / cell;
  canvas.className = 'sprite-icon';
  canvas.style.width = `${w * scale}px`;
  canvas.style.height = `${h * scale}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(1 / cell, 1 / cell);
  drawSprite(ctx, name, 0, 0);
  return canvas;
}

