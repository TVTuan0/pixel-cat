import { t, setLanguage, guessLanguage } from './i18n/index.js';
import { createState, loadState, saveState, clearState } from './state.js';
import {
  applyElapsed, feed, pet, clean, toggleSleep, canPlay, finishFishGame,
  buy, equip, claimDailyGift, stageOf, ageInDays,
} from './rules.js';
import { drawScene, playEffect, isOnCat, stepCat, feedCat, resetCat } from './render/canvas.js';
import { spriteCanvas } from './render/sprites.js';
import { setSoundEnabled, sfx } from './sound.js';
import { makeCard, shareCard } from './snapshot.js';
import {
  initUI, renderHud, say, showMood, closeSheet, isSheetOpen, openFeed, openShop,
  openSettings, openAdopt, openFishGame, showMessage, catPreview,
} from './ui.js';

const storage = (() => {
  try { return window.localStorage; } catch { return { getItem: () => null, setItem() {}, removeItem() {} }; }
})();

let state = loadState(storage, Date.now());
let previewState = null;
let eventsRunning = false;
const ctx = document.getElementById('room').getContext('2d');

function commit(next) {
  state = next;
  saveState(storage, state);
  renderHud(state, Date.now());
}

function result(text, sound) {
  say(text);
  sound?.();
}

const handlers = {
  feed() {
    if (state.asleep) return result(t('asleep'), sfx.no);
    openFeed(state, (foodId) => {
      const r = feed(state, foodId);
      if (r.result === 'poor') return result(t('poor'), sfx.no);
      closeSheet();
      if (r.result === 'full') return result(t('feedFull'), sfx.no);
      commit(r.state);
      feedCat();
      result(t('feedOk'), sfx.eat);
    });
  },

  play() {
    const check = canPlay(state);
    if (check !== 'ok') return result(t(check), sfx.no);
    openFishGame({
      onCatch: sfx.catch,
      onEnd: (caught) => {
        commit(finishFishGame(state, caught).state);
        sfx.coin();
        playEffect('hop', 500);
        return caught;
      },
    });
  },

  clean() {
    const r = clean(state);
    commit(r.state);
    playEffect('sparkle', 1200);
    result(r.coins ? t('cleanCoins', { n: r.coins }) : t('cleanOk'), sfx.clean);
  },

  sleep() {
    commit(toggleSleep(state));
    sfx.tap();
  },

  shop() {
    const reopen = () => handlers.shop();
    openShop(state, {
      onBuy: (id) => {
        const r = buy(state, id);
        if (r.result !== 'ok') return result(t('poor'), sfx.no);
        commit(r.state);
        sfx.coin();
        say(t('bought'));
        reopen();
      },
      onEquip: (id) => {
        commit(equip(state, id));
        sfx.tap();
        reopen();
      },
    });
  },

  async share() {
    const now = Date.now();
    const stage = t(`stage_${stageOf(state, now)}`);
    const card = await makeCard(state, {
      title: t('title'),
      caption: t('shareCard', { name: state.name, stage, n: ageInDays(state, now) + 1 }),
    });
    const safeName = state.name.replace(/[^\p{L}\p{N}_-]+/gu, '-') || 'cat';
    await shareCard(card, { fileName: `${safeName}-pixel-cat.png`, text: t('shareText', { name: state.name }) });
  },

  sound() {
    setSound(!state.sound);
  },

  settings() {
    openSettings(state, {
      onLang: (lang) => { changeLanguage(lang); handlers.settings(); },
      onSound: (on) => { setSound(on); handlers.settings(); },
      onReset: () => {
        const lang = state.lang;
        clearState(storage);
        state = null;
        closeSheet();
        startAdopt(lang);
      },
    });
  },

  tapRoom(x, y) {
    if (!state || !isOnCat(x, y)) return;
    const r = pet(state, Date.now());
    if (r.result === 'asleep') return say(t('asleep'));
    if (r.result === 'ok') commit(r.state);
    playEffect('purr', 1500);
    result(t('petOk'), sfx.purr);
  },
};

function setSound(on) {
  setSoundEnabled(on);
  commit({ ...state, sound: on });
  sfx.tap();
}

function changeLanguage(lang) {
  setLanguage(lang);
  if (state) commit({ ...state, lang });
}

// Daily gift and growing up. Shown one at a time when nothing else is open.
async function checkEvents() {
  if (eventsRunning || !state || isSheetOpen()) return;
  eventsRunning = true;
  const now = Date.now();
  const gift = claimDailyGift(state, now);
  if (gift.coins) {
    commit(gift.state);
    sfx.coin();
    await showMessage(t('giftTitle'), t('giftBody', { n: gift.coins, s: gift.state.streak }), spriteCanvas('coin', 10));
  }
  const stage = stageOf(state, now);
  if (stage !== state.seenStage) {
    commit({ ...state, seenStage: stage });
    sfx.fanfare();
    await showMessage(t('grewTitle', { name: state.name }), t('grewBody', { stage: t(`stage_${stage}`) }), catPreview(state));
  }
  eventsRunning = false;
}

function tick() {
  if (!state) return;
  state = applyElapsed(state, Date.now());
  renderHud(state, Date.now());
  checkEvents();
}

function frame(now) {
  const shown = state ?? previewState;
  if (shown) {
    if (state) stepCat(state, now);
    const mood = drawScene(ctx, shown, now, Date.now());
    if (state) showMood(t(`mood_${mood}`));
  }
  requestAnimationFrame(frame);
}

function startAdopt(lang) {
  setLanguage(lang);
  previewState = createState('', Date.now(), lang);
  renderHud(previewState, Date.now());
  openAdopt(previewState, {
    lang,
    onLang: (next) => startAdopt(next),
    onAdopt: (name) => {
      closeSheet();
      commit(createState(name, Date.now(), lang));
      resetCat(state);
      say(t('mood_happy'), 2500);
      sfx.meow();
      checkEvents();
    },
  });
}

function boot() {
  initUI(handlers);
  if (state) {
    setLanguage(state.lang);
    setSoundEnabled(state.sound);
    commit(state);
    resetCat(state);
    checkEvents();
  } else {
    startAdopt(guessLanguage());
  }
  setInterval(tick, 1000);
  setInterval(() => state && saveState(storage, state), 15000);
  document.addEventListener('visibilitychange', () => {
    if (!state) return;
    if (document.hidden) saveState(storage, state);
    else tick();
  });
  requestAnimationFrame(frame);
}

boot();
