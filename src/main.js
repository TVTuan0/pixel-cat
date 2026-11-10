import { t, setLanguage, guessLanguage } from './i18n/index.js';
import { createState, loadState, saveState, clearState } from './state.js';
import {
  applyElapsed, feed, feedAll, pet, clean, toggleSleep, canPlay, finishMiniGame,
  buy, equip, repair, claimDailyGift, stageOf, ageInDays, recordAction, claimTask, checkStickers,
  selectCat, selectedCat, nextCatOffer, adoptCat, rewardContestEntry, claimContestPrize, pickUpPresent,
} from './rules.js';
import { buildEntry } from './contestRoom.js';
import { contestAvailable, getContestStatus, getDuel, sendVote, sendEntry } from './contest.js';
import { FOODS, STICKERS, CLIP_SECONDS } from './config.js';
import { drawScene, playEffect, playCatEffect, catAt, presentAt, stepCats, feedCat, resetCats, scratchItem } from './render/canvas.js';
import { spriteCanvas } from './render/sprites.js';
import { setSoundEnabled, sfx } from './sound.js';
import { makeCard, shareCard, shareLink, shareFile } from './snapshot.js';
import { recordClip, canRecord } from './clip.js';
import { startAnalytics, track } from './analytics.js';
import { startInstallSupport, installState, promptInstall } from './install.js';
import {
  initUI, renderHud, say, showMood, closeSheet, isSheetOpen, openFeed, openShop,
  openSettings, openAdopt, openGamePicker, openMiniGame, showMessage, catPreview, openTasks, openShareChoice, openContest, openDuel,
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
    if (!state.owned.includes('bowl')) return result(t('noBowl'), sfx.no);
    openFeed(state, (foodId, everyone) => {
      if (everyone) return feedEveryone(foodId);
      const r = feed(state, foodId);
      if (r.result === 'poor') return result(t('poor'), sfx.no);
      closeSheet();
      if (r.result === 'full') return result(t('feedFull'), sfx.no);
      commit(r.state);
      feedCat(state.selected);
      result(t('feedOk'), sfx.eat);
      const isTreat = FOODS.find((f) => f.id === foodId).price > 0;
      record(['feed', 1], ...(isTreat ? [['treat', 1]] : []));
    });
  },

  play() {
    const check = canPlay(state);
    if (check !== 'ok') return result(t(check), sfx.no);
    openGamePicker((kind) => openMiniGame(kind, {
      onCatch: sfx.catch,
      onEnd: (points) => {
        commit(finishMiniGame(state, points).state);
        record(['play', 1], [kind, points]);
        track(`${kind}_game`);
        sfx.coin();
        playCatEffect('hop', state.selected, 500);
        return points;
      },
    }));
  },

  clean() {
    const r = clean(state);
    if (r.result === 'noLitter') return result(t('noLitter'), sfx.no);
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
      onContest: contestAvailable ? () => handlers.contest() : null,
    });
  },

  async contest() {
    try {
      const status = await getContestStatus();
      await claimPrize(status);
      openContest(status, {
        onEnter: enterContest,
        onVote: startDuels,
        onInvite: () => { closeSheet(); invite(); },
      });
    } catch (err) {
      contestProblem(err);
    }
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
      onRepair: (id) => {
        const r = repair(state, id);
        if (r.result !== 'ok') return result(t('poor'), sfx.no);
        commit(r.state);
        track('repair');
        sfx.coin();
        say(t('repaired'));
        reopen();
      },
    });
  },

  share() {
    openShareChoice({ canVideo: canRecord() && !recording, onPhoto: sharePhoto, onVideo: shareVideo });
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
      onReset: resetGame,
    });
  },

  selectCat(id) {
    commit(selectCat(state, id));
    sfx.tap();
  },

  addCat() {
    const now = Date.now();
    const offer = nextCatOffer(state, now);
    if (offer.result === 'growing') return result(t('nextCatGrowing', { name: offer.waitFor }), sfx.no);
    if (offer.result === 'poor') return result(t('nextCatPoor', { n: offer.price }), sfx.no);
    if (offer.result !== 'ok') return;
    const preview = createState('', now, state.lang);
    openAdopt(preview, {
      lang: state.lang,
      price: offer.price,
      onAdopt: (name) => {
        const r = adoptCat(state, name, preview.cats[0].fur, Date.now());
        if (r.result !== 'ok') return;
        closeSheet();
        commit(r.state);
        track('adopt_more');
        say(t('newCatHello', { name }), 2500);
        sfx.meow();
        awardStickers();
      },
    });
  },

  tapRoom(x, y) {
    const present = state && !state.asleep ? presentAt(state, x, y) : null;
    if (present !== null) return pickUp(present);
    const id = state && catAt(x, y);
    if (!id) return;
    if (id !== state.selected) commit(selectCat(state, id));
    const r = pet(state, Date.now(), id);
    if (r.result === 'asleep') return say(t('asleep'));
    if (r.result === 'ok') {
      commit(r.state);
      record(['pet', 1]);
    }
    playCatEffect('purr', id, 1500);
    result(t('petOk'), sfx.purr);
  },
};

// "Mochi · Young cat · Day 5" for one cat; just the names when there are several.
function shareCaption() {
  const now = Date.now();
  if (state.cats.length > 1) return catNames();
  const cat = state.cats[0];
  return t('shareCard', { name: cat.name, stage: t(`stage_${stageOf(cat, now)}`), n: ageInDays(cat, now) + 1 });
}

const catNames = () => state.cats.map((c) => c.name).join(' & ');
const fileBase = () => `${state.cats[0].name.replace(/[^\p{L}\p{N}_-]+/gu, '-') || 'cat'}-pixel-cat`;

async function sharePhoto() {
  closeSheet();
  const card = await makeCard(state, { title: t('title'), caption: shareCaption() });
  track('share_card');
  await shareCard(card, { fileName: `${fileBase()}.png`, text: t('shareText', { name: catNames() }) });
}

let recording = false;

// Records a clip, then shows it with a Share button (sharing needs a fresh tap).
async function shareVideo() {
  closeSheet();
  recording = true;
  try {
    const blob = await recordClip(document.getElementById('room'), {
      seconds: CLIP_SECONDS,
      title: t('title'),
      caption: shareCaption(),
      onTick: (n) => say(t('recording', { n }), 1100),
    });
    track('clip');
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');
    Object.assign(video, { src: url, autoplay: true, loop: true, muted: true, playsInline: true, className: 'clip-preview' });
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    await showMessage(t('clipReady'), t('shareText', { name: catNames() }), video, {
      label: t('shareVideo'),
      onClick: () => shareFile(blob, { fileName: `${fileBase()}.${ext}`, text: t('shareText', { name: catNames() }) }),
    });
    URL.revokeObjectURL(url);
  } catch {
    say(t('clipFailed'));
  } finally {
    recording = false;
  }
}

// Contest -------------------------------------------------------------

function contestProblem(err) {
  say(t(err.code === 'slow_down' ? 'contestSlow' : 'contestOffline'));
  sfx.no();
}

async function enterContest() {
  try {
    const entered = await sendEntry(buildEntry(state, Date.now()));
    const reward = rewardContestEntry(state, entered.week);
    if (reward.coins) {
      commit(reward.state);
      sfx.coin();
    }
    track('contest_enter');
    say(t('contestEntered'), 2500);
    await handlers.contest();
  } catch (err) {
    contestProblem(err);
  }
}

// Shows duel after duel; each tap is a vote, then the next pair appears.
function startDuels() {
  let votes = 0;
  const next = async () => {
    try {
      const duel = await getDuel();
      openDuel(duel, votes, {
        onInvite: () => { closeSheet(); invite(); },
        onPick: async (id) => {
          try {
            await sendVote(duel.ticket, id);
            if (votes === 0) track('contest_vote');
            votes++;
            sfx.tap();
            setTimeout(next, 450);
          } catch (err) {
            closeSheet();
            contestProblem(err);
          }
        },
      });
    } catch (err) {
      closeSheet();
      contestProblem(err);
    }
  };
  next();
}

// Last week's top 3 get a trophy and coins, once.
async function claimPrize(status) {
  const mine = status.lastWeek.mine;
  if (!state || !mine) return;
  const r = claimContestPrize(state, status.lastWeek.week, mine.rank);
  if (!r.prize) return;
  commit(r.state);
  track('contest_prize');
  sfx.fanfare();
  await showMessage(t('prizeTitle'), t('prizeBody', { rank: mine.rank, n: r.prize.coins }), spriteCanvas(r.prize.trophy, 10));
}

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
  if (!state.basicsHintSeen) {
    commit({ ...state, basicsHintSeen: true });
    await showMessage(t('basicsTitle'), t('basicsBody'), spriteCanvas('bowl', 8));
  }
  if (state.news?.length) {
    const news = state.news;
    commit({ ...state, news: [] });
    sfx.no();
    // Each cat runs to the last thing it broke and scratches it.
    for (const n of news) scratchItem(n.catId, n.item);
    const lines = news.map((n) => t('brokeLine', { name: n.cat, item: t(`item_${n.item}`) })).join(' ');
    await showMessage(t('brokeTitle'), `${lines} ${t('brokeBody')}`, spriteCanvas(news[0].item, 6));
  }
  const gift = claimDailyGift(state, now);
  if (gift.coins) {
    // The gift comes once per day, so this is a good moment to count day-2 and day-7 returns.
    const day = ageInDays(state.cats[0], now) + 1;
    if (day === 2 || day === 7) track(`return_day${day}`);
    commit(gift.state);
    sfx.coin();
    await showMessage(t('giftTitle'), t('giftBody', { n: gift.coins, s: gift.state.streak }), spriteCanvas('coin', 10));
  }
  const grown = state.cats.find((c) => stageOf(c, now) !== c.seenStage);
  if (grown) {
    const stage = stageOf(grown, now);
    commit({ ...state, cats: state.cats.map((c) => (c.id === grown.id ? { ...c, seenStage: stage } : c)) });
    sfx.fanfare();
    await showMessage(t('grewTitle', { name: grown.name }), t('grewBody', { stage: t(`stage_${stage}`) }), catPreview(state), {
      label: t('inviteButton'),
      onClick: invite,
    });
  }
  eventsRunning = false;
}

function feedEveryone(foodId) {
  const r = feedAll(state, foodId);
  if (r.result === 'poor') return result(t('poor'), sfx.no);
  closeSheet();
  if (r.result === 'full') return result(t('feedAllFull'), sfx.no);
  commit(r.state);
  r.fed.forEach((id) => feedCat(id));
  result(t('feedAllOk'), sfx.eat);
  const isTreat = FOODS.find((f) => f.id === foodId).price > 0;
  record(['feed', r.fed.length], ...(isTreat ? [['treat', r.fed.length]] : []));
}

function pickUp(index) {
  const r = pickUpPresent(state, index);
  commit(r.state);
  seenPresents = state.presents.length;
  track('present');
  sfx.coin();
  const name = selectedCat(state).name;
  if (r.present.item) say(t('presentItem', { name, item: t(`item_${r.present.item}`) }), 3000);
  else say(t('presentCoins', { name, n: r.present.coins }), 2500);
}

// Says so when new presents have arrived (also right after the game opens).
let seenPresents = 0;
function notePresents() {
  const n = state.presents?.length ?? 0;
  if (n > seenPresents && !state.asleep) say(t('presentsWaiting', { name: selectedCat(state).name, n }), 3500);
  seenPresents = n;
}

function tick() {
  if (!state) return;
  state = applyElapsed(state, Date.now());
  notePresents();
  renderHud(state, Date.now());
  awardStickers();
  checkEvents();
}

function frame(now) {
  const shown = state ?? previewState;
  if (shown) {
    if (state) stepCats(state, now);
    const mood = drawScene(ctx, shown, now, Date.now(), { live: Boolean(state) });
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
    onLang: (next) => startAdopt(next, previewState.cats[0].fur),
    onAdopt: (name) => {
      closeSheet();
      commit(createState(name, Date.now(), lang, previewState.cats[0].fur));
      track('adopt');
      resetCats(state);
      say(t('mood_happy'), 2500);
      sfx.meow();
      checkEvents();
    },
  });
}

function resetGame() {
  const lang = state?.lang ?? guessLanguage();
  clearState(storage);
  state = null;
  closeSheet();
  startAdopt(lang);
}

function boot() {
  startAnalytics();
  startInstallSupport();
  initUI(handlers);
  if (state) {
    setLanguage(state.lang);
    setSoundEnabled(state.sound);
    commit(state);
    resetCats(state);
    checkEvents();
  } else {
    startAdopt(guessLanguage());
  }
  setInterval(tick, 1000);
  // A trophy from last week's contest is handed out shortly after the game opens.
  if (state && contestAvailable) {
    setTimeout(() => {
      if (!isSheetOpen()) getContestStatus().then(claimPrize).catch(() => {});
    }, 3000);
  }
  setInterval(() => state && saveState(storage, state), 15000);
  document.addEventListener('visibilitychange', () => {
    if (!state) return;
    if (document.hidden) saveState(storage, state);
    else tick();
  });
  requestAnimationFrame(frame);
  if (new URLSearchParams(location.search).has('test')) {
    import('./testPanel.js').then(({ startTestPanel }) => startTestPanel({ getState: () => state, setState: commit, reset: resetGame }));
  }
}

boot();
