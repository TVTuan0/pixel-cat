import { t, setLanguage, guessLanguage } from './i18n/index.js';
import { createState, loadState, saveState, clearState } from './state.js';
import {
  applyElapsed, feed, pet, clean, toggleSleep, canPlay, finishFishGame,
  buy, equip, claimDailyGift, stageOf, ageInDays, recordAction, claimTask, checkStickers,
} from './rules.js';
import { FOODS, STICKERS } from './config.js';
import { drawScene, playEffect, isOnCat, stepCat, feedCat, resetCat } from './render/canvas.js';
import { spriteCanvas } from './render/sprites.js';
import { setSoundEnabled, sfx } from './sound.js';
import { makeCard, shareCard, shareLink } from './snapshot.js';
import { startAnalytics, track } from './analytics.js';
import { startInstallSupport, installState, promptInstall } from './install.js';
import {
  initUI, renderHud, say, showMood, closeSheet, isSheetOpen, openFeed, openShop,
  openSettings, openAdopt, openFishGame, showMessage, catPreview, openTasks,
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

// Counts actions for today's tasks and the sticker book, e.g. record(['feed', 1], ['treat', 1]).
function record(...actions) {
  const now = Date.now();
  commit(actions.reduce((s, [action, amount]) => recordAction(s, action, amount, now), state));
  awardStickers();
}

function awardStickers() {
  const r = checkStickers(state, Date.now());
  if (!r.earned.length) return;
  commit(r.state);
  r.earned.forEach(() => track('sticker'));
  const coins = r.earned.reduce((sum, id) => sum + STICKERS.find((x) => x.id === id).coins, 0);
  say(t('newSticker', { names: r.earned.map((id) => t(`sticker_${id}`)).join(', '), n: coins }), 3500);
  sfx.fanfare();
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
      const isTreat = FOODS.find((f) => f.id === foodId).price > 0;
      record(['feed', 1], ...(isTreat ? [['treat', 1]] : []));
    });
  },

  play() {
    const check = canPlay(state);
    if (check !== 'ok') return result(t(check), sfx.no);
    openFishGame({
      onCatch: sfx.catch,
      onEnd: (caught) => {
        commit(finishFishGame(state, caught).state);
        record(['play', 1], ['fish', caught]);
        track('fish_game');
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
    record(['clean', 1]);
  },

  tasks() {
    openTasks(state, Date.now(), {
      onClaim: (id) => {
        const r = claimTask(state, id, Date.now());
        if (r.result !== 'ok') return;
        commit(r.state);
        track('task_done');
        sfx.coin();
        awardStickers();
        handlers.tasks();
      },
    });
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
        track(`buy_${id}`);
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
    track('share_card');
    await shareCard(card, { fileName: `${safeName}-pixel-cat.png`, text: t('shareText', { name: state.name }) });
  },

  sound() {
    setSound(!state.sound);
  },

  settings() {
    openSettings(state, {
      onLang: (lang) => { changeLanguage(lang); handlers.settings(); },
      onSound: (on) => { setSound(on); handlers.settings(); },
      onInvite: () => { closeSheet(); invite(); },
      install: installState(),
      onInstall: () => { closeSheet(); promptInstall(); },
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
    if (r.result === 'ok') {
      commit(r.state);
      record(['pet', 1]);
    }
    playEffect('purr', 1500);
    result(t('petOk'), sfx.purr);
  },
};

async function invite() {
  track('invite');
  const outcome = await shareLink(t('inviteText'));
  if (outcome === 'copied') say(t('linkCopied'));
  if (outcome === 'failed') say(t('linkFailed'));
}

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
    // The gift comes once per day, so this is a good moment to count day-2 and day-7 returns.
    const day = ageInDays(state, now) + 1;
    if (day === 2 || day === 7) track(`return_day${day}`);
    commit(gift.state);
    sfx.coin();
    await showMessage(t('giftTitle'), t('giftBody', { n: gift.coins, s: gift.state.streak }), spriteCanvas('coin', 10));
  }
  const stage = stageOf(state, now);
  if (stage !== state.seenStage) {
    commit({ ...state, seenStage: stage });
    sfx.fanfare();
    await showMessage(t('grewTitle', { name: state.name }), t('grewBody', { stage: t(`stage_${stage}`) }), catPreview(state), {
      label: t('inviteButton'),
      onClick: invite,
    });
  }
  eventsRunning = false;
}

function tick() {
  if (!state) return;
  state = applyElapsed(state, Date.now());
  renderHud(state, Date.now());
  awardStickers();
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

function startAdopt(lang, fur = 'orange') {
  setLanguage(lang);
  previewState = createState('', Date.now(), lang, fur);
  renderHud(previewState, Date.now());
  openAdopt(previewState, {
    lang,
    onLang: (next) => startAdopt(next, previewState.fur),
    onAdopt: (name) => {
      closeSheet();
      commit(createState(name, Date.now(), lang, previewState.fur));
      track('adopt');
      resetCat(state);
      say(t('mood_happy'), 2500);
      sfx.meow();
      checkEvents();
    },
  });
}

function boot() {
  startAnalytics();
  startInstallSupport();
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
