// Where things are in the room, in room pixels. The room and the walking cat both use this.

export const ROOM_W = 160;
export const ROOM_H = 120;
export const FLOOR_Y = 76; // where the wall meets the floor
export const FLOOR_G = 110; // where the cat's feet are when it stands on the floor

export const SPOTS = {
  center: { x: 80, g: FLOOR_G, weight: 1 },
  bed: { x: 34, g: FLOOR_G, weight: 1 },
  bowl: { x: 66, g: FLOOR_G, weight: 0 },
  sofa: { x: 72, g: 70, base: 72, weight: 2 },
  tree: { x: 16, g: 46, base: 24, weight: 2 },
  fishbowl: { x: 111, g: 104, weight: 2, needs: 'decor_fishbowl' },
  beanbag: { x: 102, g: 101, weight: 2, needs: 'decor_beanbag' },
  yarn: { x: 92, g: 112, weight: 2, needs: 'toy_yarn' },
  front: { x: 54, g: 117, weight: 1 },
  right: { x: 124, g: 115, weight: 1 },
};

// A spot is "up high" when the cat must jump to reach it.
export const isHigh = (g) => g < FLOOR_G - 15;

// Where cats sit when the page opens, and where they curl up at night, in cat order.
export const START_SPOTS = ['center', 'sofa', 'tree', 'right', 'front'];
export const SLEEP_SPOTS = ['bed', 'sofa', 'beanbag', 'tree', 'front', 'right', 'center'];
