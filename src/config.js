// All tunable game numbers live here.

export const SAVE_KEY = 'pixel-cat-save';
export const SAVE_VERSION = 1;

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

// Points lost per hour. Three days away empties hunger and happiness.
export const DECAY_PER_HOUR = {
  hunger: 6,
  happiness: 4,
  energy: 5,
  cleanliness: 3,
};

// While asleep, energy goes up instead of down.
export const SLEEP_ENERGY_PER_HOUR = 20;

export const LOW_STAT = 25;
export const HAPPY_AVERAGE = 70;
export const FULL_HUNGER = 95;

// A stage starts at this many days since adoption.
export const STAGES = [
  { id: 'kitten', fromDay: 0 },
  { id: 'young', fromDay: 3 },
  { id: 'adult', fromDay: 7 },
];

export const PET_COOLDOWN_MS = 5000;
export const PET_HAPPINESS = 4;

export const CLEAN_COINS_BELOW = 70; // cleaning only pays when the box is fairly dirty
export const CLEAN_COINS = 2;

export const PLAY_MIN_ENERGY = 15;
export const PLAY_ENERGY_COST = 10;
export const FISH_GAME_SECONDS = 30;

export const GIFT_BASE_COINS = 5;
export const GIFT_STREAK_BONUS = 2; // per streak day, up to a week
export const GIFT_STREAK_CAP = 7;

export const START_COINS = 10;

export const FOODS = [
  { id: 'kibble', price: 0, hunger: 25, happiness: 2, coins: 1 },
  { id: 'fish', price: 3, hunger: 15, happiness: 15, coins: 0 },
  { id: 'cream', price: 5, hunger: 10, happiness: 25, coins: 0 },
];

// hat and collar show one at a time; toy and decor show whenever owned.
export const SHOP_ITEMS = [
  { id: 'collar_red', slot: 'collar', price: 8 },
  { id: 'collar_blue', slot: 'collar', price: 8 },
  { id: 'collar_gold', slot: 'collar', price: 20 },
  { id: 'hat_bow', slot: 'hat', price: 15 },
  { id: 'hat_party', slot: 'hat', price: 25 },
  { id: 'hat_crown', slot: 'hat', price: 40 },
  { id: 'toy_yarn', slot: 'toy', price: 12 },
  { id: 'toy_mouse', slot: 'toy', price: 12 },
  { id: 'decor_plant', slot: 'decor', price: 15 },
  { id: 'decor_rug', slot: 'decor', price: 20 },
  { id: 'decor_frame', slot: 'decor', price: 30 },
];
