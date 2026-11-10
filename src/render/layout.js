// Where things are in the room, in room pixels. The room and the walking cat both use this.

export const ROOM_W = 160;
export const ROOM_H = 120;
export const FLOOR_Y = 76; // where the wall meets the floor
export const FLOOR_G = 110; // where the cat's feet are when it stands on the floor

export const SPOTS = {
  center: { x: 80, g: FLOOR_G, weight: 1 },
  bed: { x: 34, g: FLOOR_G, weight: 1 },
  bowl: { x: 66, g: FLOOR_G, weight: 0 },
  sofa: { x: 72, g: 70, base: 72, weight: 2, needs: 'sofa' },
  tree: { x: 16, g: 46, base: 24, weight: 2, needs: 'cat_tree' },
  fishbowl: { x: 111, g: 104, weight: 2, needs: 'decor_fishbowl' },
  beanbag: { x: 102, g: 101, weight: 2, needs: 'decor_beanbag' },
  yarn: { x: 92, g: 112, weight: 2, needs: 'toy_yarn' },
  front: { x: 54, g: 117, weight: 1 },
  right: { x: 124, g: 115, weight: 1 },
  door: { x: 9, g: 84, weight: 0 }, // by the garden door, in the back left corner
};

// The garden door on the room's back wall: [x, y, w, h].
export const ROOM_DOOR = [0, 44, 14, 32];

// Spots in the garden. Cats come and go through the back door by the gate spot.
export const GARDEN_SPOTS = {
  gate: { x: 14, g: 94, weight: 0 },
  lawn: { x: 50, g: 98, weight: 2 },
  flowers: { x: 30, g: 112, weight: 2 },
  middle: { x: 82, g: 106, weight: 2 },
  sunny: { x: 100, g: 94, weight: 2 },
  shade: { x: 128, g: 104, weight: 2 },
  front: { x: 64, g: 116, weight: 1 },
};

// Where presents the cats bring home lie on the floor (top-left corner of each), by present spot number.
export const PRESENT_SPOTS = [{ x: 8, y: 110 }, { x: 104, y: 111 }, { x: 52, y: 112 }];

// Where cats sit when the page opens (spots that are always there, even in an empty room),
// and where they curl up at night, in cat order. The last five sleep spots are always there.
export const START_SPOTS = ['center', 'right', 'front', 'bed', 'bowl'];
export const SLEEP_SPOTS = ['bed', 'sofa', 'beanbag', 'tree', 'front', 'right', 'center', 'bowl'];

// Where each item sits: [x, y, w, h]. Used to draw claw marks on broken items and to find where a cat scratches.
export const ITEM_BOXES = {
  cat_tree: [4, 46, 30, 42],
  sofa: [44, 52, 56, 35],
  bookshelf: [126, 30, 22, 57],
  lamp: [147, 28, 12, 58],
  soft_bed: [20, 103, 28, 10],
  auto_feeder: [61, 99, 8, 8],
  auto_litter: [138, 94, 16, 7],
  decor_plant: [34, 73, 9, 13],
  decor_rug: [60, 100, 48, 14],
  decor_frame: [104, 32, 18, 14],
  decor_lights: [0, 3, 160, 8],
  decor_beanbag: [92, 94, 20, 16],
  decor_fishbowl: [101, 67, 20, 20],
  toy_yarn: [80, 108, 6, 6],
  toy_mouse: [122, 112, 9, 4],
};

// Where an angry cat stands to scratch an item: on the floor beside it, facing it (face 1 = right).
export function scratchPoint(itemId) {
  const [x, y, w, h] = ITEM_BOXES[itemId];
  const g = Math.max(FLOOR_Y + 12, Math.min(FLOOR_G + 6, y + h + 2));
  const left = x - 6;
  const right = x + w + 6;
  if (left >= 10) return { x: left, g, face: 1 };
  if (right <= ROOM_W - 10) return { x: right, g, face: -1 };
  return { x: Math.round(x + w / 2), g, face: 1 }; // as wide as the room: stand in the middle
}
