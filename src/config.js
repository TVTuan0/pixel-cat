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

// Percent of days with each weather (snow gets the rest).
export const WEATHER_CHANCE = { clear: 60, rain: 25 };

// Items in these slots are used one at a time. Toys and decor show whenever owned.
export const EQUIP_SLOTS = ['hat', 'collar', 'wall', 'floor'];

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
  { id: 'decor_lights', slot: 'decor', price: 25 },
  { id: 'decor_beanbag', slot: 'decor', price: 30 },
  { id: 'decor_fishbowl', slot: 'decor', price: 35 },
  { id: 'wall_stripes', slot: 'wall', price: 20 },
  { id: 'wall_mint', slot: 'wall', price: 20 },
  { id: 'wall_stars', slot: 'wall', price: 30 },
  { id: 'floor_dark', slot: 'floor', price: 20 },
  { id: 'floor_tiles', slot: 'floor', price: 25 },
  { id: 'floor_carpet', slot: 'floor', price: 25 },
];

// The public link shown on cards and in invites (the game may also run on other sites, like itch.io).
export const SITE_URL = 'https://pixel-cat-green.vercel.app';

// Daily tasks: 3 are picked each day. `counter` is the action that moves a task forward.
export const TASKS = [
  { id: 'feed2', counter: 'feed', goal: 2, coins: 3 },
  { id: 'treat1', counter: 'treat', goal: 1, coins: 4 },
  { id: 'pet5', counter: 'pet', goal: 5, coins: 3 },
  { id: 'clean1', counter: 'clean', goal: 1, coins: 2 },
  { id: 'play1', counter: 'play', goal: 1, coins: 3 },
  { id: 'fish10', counter: 'fish', goal: 10, coins: 5 },
];
export const TASKS_PER_DAY = 3;

// Sticker book. kind: counter (lifetime count), streak, stage, owned (items bought), ownsAll (every item of a slot).
export const STICKERS = [
  { id: 'first_meal', kind: 'counter', counter: 'feed', goal: 1, coins: 5, icon: 'food_kibble' },
  { id: 'best_friends', kind: 'counter', counter: 'pet', goal: 50, coins: 10, icon: 'heart' },
  { id: 'fisher', kind: 'counter', counter: 'fish', goal: 50, coins: 10, icon: 'fish' },
  { id: 'master_fisher', kind: 'counter', counter: 'fish', goal: 300, coins: 25, icon: 'goldfish' },
  { id: 'tidy', kind: 'counter', counter: 'clean', goal: 10, coins: 10, icon: 'broom' },
  { id: 'task_star', kind: 'counter', counter: 'tasks', goal: 10, coins: 15, icon: 'sparkle' },
  { id: 'streak3', kind: 'streak', goal: 3, coins: 10, icon: 'sun' },
  { id: 'streak7', kind: 'streak', goal: 7, coins: 25, icon: 'moon' },
  { id: 'young', kind: 'stage', stage: 'young', coins: 10, icon: 'toy_yarn' },
  { id: 'adult', kind: 'stage', stage: 'adult', coins: 20, icon: 'hat_crown' },
  { id: 'shopper', kind: 'owned', goal: 5, coins: 10, icon: 'bag' },
  { id: 'decorator', kind: 'ownsAll', slot: 'wall', coins: 20, icon: 'wall_stripes' },
];

// Seasonal decorations. Tết and Mid-Autumn follow the lunar calendar, so their dates are listed per year.
export const LUNAR_DATES = {
  tet: { 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03' },
  midautumn: { 2026: '09-25', 2027: '09-15', 2028: '10-03', 2029: '09-22', 2030: '09-12' },
};

export const CLIP_SECONDS = 6;
