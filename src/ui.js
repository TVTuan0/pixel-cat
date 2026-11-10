// DOM: top bar, stat bars, buttons, speech bubble and bottom sheets.
import { t } from './i18n/index.js';
import { analyticsEnabled } from './analytics.js';
import { spriteCanvas, brokenSpriteCanvas, FURS } from './render/sprites.js';
import { drawScene, ROOM_W, ROOM_H } from './render/canvas.js';
import { entryToScene } from './contestRoom.js';
import { runFishGame, drawFishGameIdle } from './minigame/fish.js';
import { runMouseGame, drawMouseGameIdle } from './minigame/mouse.js';
import { FOODS, SHOP_ITEMS, FISH_GAME_SECONDS, MOUSE_GAME_SECONDS, EQUIP_SLOTS, STICKERS, CONTEST_ENTRY_COINS, DAY } from './config.js';
import { ageInDays, stageOf, dailyTasks, taskProgress, selectedCat, needsCare, wornItem, nextCatOffer, repairPrice } from './rules.js';

const $ = (id) => document.getElementById(id);
const sheet = $('sheet');
const STAT_KEYS = ['hunger', 'happiness', 'energy', 'cleanliness'];
const ACTION_ICONS = { feed: 'food_kibble', play: 'fish', clean: 'broom', sleep: 'moon', shop: 'bag', share: 'camera' };

let bubbleUntil = 0;
let sheetCleanup = null;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null) node.append(c);
  return node;
}

function priceTag(price) {
  if (price === 0) return el('span', { class: 'price' }, t('free'));
  return el('span', { class: 'price' }, spriteCanvas('coin', 3), String(price));
}

export function initUI(handlers) {
  $('coin-icon').append(spriteCanvas('coin', 4));
  $('settings-btn').append(spriteCanvas('gear', 4));
  $('settings-btn').addEventListener('click', handlers.settings);
  $('sound-btn').addEventListener('click', handlers.sound);
  $('tasks-btn').prepend(spriteCanvas('star', 4));
  $('tasks-btn').addEventListener('click', handlers.tasks);
  // Cat chips are rebuilt as cats change; one listener handles them all.
  $('cats').addEventListener('click', (e) => {
    const chip = e.target.closest('button');
    if (!chip) return;
    if (chip.dataset.cat) handlers.selectCat(Number(chip.dataset.cat));
    else handlers.addCat();
  });

  for (const btn of document.querySelectorAll('.action')) {
    btn.addEventListener('click', () => handlers[btn.dataset.action]());
  }

  $('stats').replaceChildren(
    ...STAT_KEYS.map((key) =>
      el('div', { class: 'stat' }, el('span', { class: 'stat-label', id: `label-${key}` }, spriteCanvas(`stat_${key}`, 3)), el('div', { class: 'bar', id: `bar-${key}` }, el('i'))),
    ),
  );

  $('room').addEventListener('pointerdown', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    handlers.tapRoom(((e.clientX - r.left) / r.width) * ROOM_W, ((e.clientY - r.top) / r.height) * ROOM_H);
  });

  // Tapping the dark backdrop closes a sheet, unless it is the adopt screen.
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet && !sheet.dataset.locked) closeSheet();
  });
  sheet.addEventListener('cancel', (e) => {
    if (sheet.dataset.locked) e.preventDefault();
  });
  sheet.addEventListener('close', () => {
    // The close event arrives a moment later. If another sheet has opened since, it is not this one's to clean up.
    if (sheet.open) return;
    sheetCleanup?.();
    sheetCleanup = null;
  });
}

export function furSwatch(fur) {
  const colors = FURS[fur];
  const swatch = el('span', { class: 'swatch' });
  swatch.style.background = colors.patch
    ? `linear-gradient(135deg, ${colors.fur} 55%, ${colors.stripe} 55% 75%, ${colors.patch} 75%)`
    : colors.fur;
  swatch.style.borderColor = colors.outline;
  return swatch;
}

// One chip per cat (tap to pick it), plus a "+" chip for the next kitten. Rebuilt only when something shown changes.
function renderCatChips(state, now) {
  const offer = nextCatOffer(state, now);
  const key = JSON.stringify([state.selected, offer.result, offer.price, state.lang, state.cats.map((c) => [c.id, c.name, c.fur, needsCare(c)])]);
  const row = $('cats');
  if (row.dataset.key === key) return;
  row.dataset.key = key;
  // With several cats only the selected chip shows its name, so up to 5 fit on a phone.
  const showAllNames = state.cats.length <= 2;
  const chips = state.cats.map((c) => {
    const selected = c.id === state.selected;
    const chip = el('button', { class: `cat-chip ${selected ? 'active' : ''}`, type: 'button', 'data-cat': c.id, 'aria-pressed': String(selected), 'aria-label': c.name, title: c.name },
      furSwatch(c.fur), selected || showAllNames ? el('span', { class: 'chip-name' }, c.name) : null);
    if (needsCare(c)) chip.append(el('span', { class: 'dot', 'aria-label': t('needsCare') }));
    return chip;
  });
  if (offer.result !== 'max') {
    const label = offer.result === 'ok' ? `+ ${offer.price}` : '+';
    chips.push(el('button', { class: `cat-chip add ${offer.result === 'ok' ? 'ready' : ''}`, type: 'button', 'aria-label': t('catsAdd'), title: t('catsAdd') }, label));
  }
  row.replaceChildren(...chips);
}

// Re-labels everything for the current language and state.
export function renderHud(state, now) {
  document.title = t('title');
  const cat = selectedCat(state);
  $('cat-name').textContent = cat.name;
  $('cat-age').textContent = `${t('dayCount', { n: ageInDays(cat, now) + 1 })} · ${t(`stage_${stageOf(cat, now)}`)}`;
  renderCatChips(state, now);
  $('coins').textContent = state.coins;

  const ready = dailyTasks(now).filter((id) => {
    const p = taskProgress(state, id, now);
    return p.done >= p.task.goal && !p.claimed;
  }).length;
  const badge = $('tasks-badge');
  badge.hidden = ready === 0;
  badge.textContent = String(ready);
  $('tasks-btn').setAttribute('aria-label', t('tasksButton'));
  $('tasks-btn').title = t('tasksButton');

  const soundBtn = $('sound-btn');
  if (soundBtn.dataset.on !== String(state.sound)) {
    soundBtn.replaceChildren(spriteCanvas(state.sound ? 'sound_on' : 'sound_off', 4));
    soundBtn.dataset.on = String(state.sound);
  }
  soundBtn.classList.toggle('on', state.sound);
  soundBtn.setAttribute('aria-label', t(state.sound ? 'soundOn' : 'soundOff'));
  soundBtn.title = t(state.sound ? 'soundOn' : 'soundOff');
  $('settings-btn').setAttribute('aria-label', t('settings'));

  for (const key of STAT_KEYS) {
    const value = Math.round(cat.stats[key]);
    $(`label-${key}`).title = t(key); // the icon's name, shown on hover; the bar below is read out with its name
    const bar = $(`bar-${key}`);
    bar.classList.toggle('low', value < 25);
    bar.setAttribute('aria-label', `${t(key)} ${value}%`);
    const fill = bar.firstChild;
    fill.style.width = `${value}%`;
    fill.style.background = value > 50 ? 'var(--good)' : value > 25 ? 'var(--warn)' : 'var(--bad)';
  }

  for (const btn of document.querySelectorAll('.action')) {
    const action = btn.dataset.action;
    const asleep = state.asleep;
    const label = action === 'sleep' ? t(asleep ? 'wake' : 'sleep') : t(action);
    const icon = action === 'sleep' && asleep ? 'sun' : ACTION_ICONS[action];
    if (btn.dataset.label !== label) {
      btn.replaceChildren(spriteCanvas(icon, 3), el('span', {}, label));
      btn.dataset.label = label;
    }
  }
}

// Shows a short line in the speech bubble. Mood text shows when nothing else does.
export function say(text, ms = 2000) {
  const bubble = $('bubble');
  bubbleUntil = performance.now() + ms;
  bubble.textContent = text;
  bubble.classList.remove('pop');
  void bubble.offsetWidth;
  bubble.classList.add('pop');
}

export function showMood(text) {
  if (performance.now() < bubbleUntil) return;
  const bubble = $('bubble');
  if (bubble.textContent !== text) bubble.textContent = text;
}

function openSheet(title, body, { locked = false, onClose } = {}) {
  sheetCleanup?.();
  sheetCleanup = onClose ?? null;
  const head = el('div', { class: 'sheet-head' }, el('h2', {}, title));
  if (!locked) head.append(el('button', { class: 'btn small', type: 'button', onclick: closeSheet }, t('close')));
  sheet.replaceChildren(el('div', { class: 'sheet-inner' }, head, body));
  if (locked) sheet.dataset.locked = '1';
  else delete sheet.dataset.locked;
  if (!sheet.open) sheet.showModal();
}

export function closeSheet() {
  delete sheet.dataset.locked;
  if (sheet.open) sheet.close();
}

export function isSheetOpen() {
  return sheet.open;
}

export function openFeed(state, onPick) {
  const rows = FOODS.map((food) =>
    el('button', { class: 'row btn', type: 'button', onclick: () => onPick(food.id) },
      el('span', { class: 'icon' }, spriteCanvas(`food_${food.id}`, 4)),
      el('span', { class: 'grow' }, t(`food_${food.id}`)),
      priceTag(food.price),
    ),
  );
  openSheet(t('feed'), el('div', { class: 'list' }, rows));
}

// What an item does for the cats, e.g. "Joy drops 15% slower", or null for looks-only items.
function itemNote(item) {
  if (item.slot === 'basic') return t(`need_${item.id}`);
  if (!item.help) return null;
  return Object.entries(item.help).map(([stat, n]) => t('helpLine', { stat: t(stat), n })).join(', ');
}

export function openShop(state, { onBuy, onEquip, onRepair }) {
  const slots = ['basic', 'gear', 'furniture', 'decor', 'toy', 'hat', 'collar', 'wall', 'floor'];
  const keepScroll = sheet.open ? sheet.scrollTop : 0; // stay in place after buying
  const body = el('div', { class: 'list' });
  for (const slot of slots) {
    body.append(el('div', { class: 'section-title' }, t(`slot_${slot}`)));
    for (const item of SHOP_ITEMS.filter((i) => i.slot === slot)) {
      const owned = state.owned.includes(item.id);
      const broken = (state.broken ?? []).includes(item.id);
      const inUse = wornItem(state, slot) === item.id;
      const worn = slot === 'hat' || slot === 'collar';
      let action;
      if (broken) {
        const price = repairPrice(item.id);
        action = el('button', { class: 'btn small primary', type: 'button', disabled: state.coins < price ? '' : false, onclick: () => onRepair(item.id) }, t('repair'), priceTag(price));
      } else if (!owned) {
        action = el('button', { class: 'btn small', type: 'button', disabled: state.coins < item.price ? '' : false, onclick: () => onBuy(item.id) }, priceTag(item.price));
      } else if (EQUIP_SLOTS.includes(slot)) {
        const label = worn ? (inUse ? 'wearing' : 'wear') : (inUse ? 'inUse' : 'use');
        action = el('button', { class: `btn small ${inUse ? 'primary' : ''}`, type: 'button', onclick: () => onEquip(item.id) }, t(label));
      } else {
        action = el('span', { class: 'note' }, t('ownedItem'));
      }
      body.append(el('div', { class: 'row' },
        el('span', { class: 'icon' }, broken ? brokenSpriteCanvas(item.id, 4) : spriteCanvas(item.id, 4)),
        el('span', { class: 'grow' }, t(`item_${item.id}`), broken ? el('span', { class: 'note' }, ` (${t('brokenItem')})`) : null,
          itemNote(item) ? el('br') : null, itemNote(item) ? el('span', { class: 'note' }, itemNote(item)) : null),
        action,
      ));
    }
  }
  openSheet(t('shopTitle'), body);
  sheet.scrollTop = keepScroll;
}

function languageSwitch(current, onLang) {
  return el('div', { class: 'seg' },
    ['en', 'vi'].map((lang) =>
      el('button', { class: `btn small ${lang === current ? 'active' : ''}`, type: 'button', onclick: () => onLang(lang) }, lang === 'en' ? 'English' : 'Tiếng Việt'),
    ),
  );
}

export function openShareChoice({ canVideo, onPhoto, onVideo }) {
  const body = el('div', { class: 'list' },
    el('button', { class: 'row btn', type: 'button', onclick: onPhoto }, el('span', { class: 'icon' }, spriteCanvas('camera', 4)), el('span', { class: 'grow' }, t('sharePhoto'))),
    canVideo ? el('button', { class: 'row btn', type: 'button', onclick: onVideo }, el('span', { class: 'icon' }, spriteCanvas('fish', 4)), el('span', { class: 'grow' }, t('shareClip'))) : null,
  );
  openSheet(t('share'), body);
}

const TASK_ICONS = { feed: 'food_kibble', treat: 'food_cream', pet: 'heart', clean: 'broom', play: 'fish', fish: 'goldfish' };

export function openTasks(state, now, { onClaim, onContest = null }) {
  const keepScroll = sheet.open ? sheet.scrollTop : 0; // stay in place after claiming
  const tasks = dailyTasks(now).map((id) => {
    const { task, done, claimed } = taskProgress(state, id, now);
    const finished = done >= task.goal;
    const action = claimed
      ? el('span', { class: 'note' }, `✓ ${t('claimedLabel')}`)
      : el('button', { class: `btn small ${finished ? 'primary' : ''}`, type: 'button', disabled: finished ? false : '', onclick: () => onClaim(id) }, priceTag(task.coins));
    const fill = el('i');
    fill.style.width = `${(done / task.goal) * 100}%`;
    return el('div', { class: 'row' },
      el('span', { class: 'icon' }, spriteCanvas(TASK_ICONS[task.counter], 3)),
      el('span', { class: 'grow' },
        el('div', {}, t(`task_${id}`)),
        el('div', { class: 'task-progress' }, el('div', { class: 'bar' }, fill), `${done}/${task.goal}`),
      ),
      action,
    );
  });
  const stickers = STICKERS.map((s) => {
    const have = state.stickers.includes(s.id);
    return el('div', { class: `sticker ${have ? '' : 'locked'}` }, spriteCanvas(s.icon, 4), t(`sticker_${s.id}`));
  });
  const contestCard = onContest
    ? el('button', { class: 'row btn contest-card', type: 'button', onclick: onContest },
      el('span', { class: 'icon' }, spriteCanvas('trophy_gold', 5)),
      el('span', { class: 'grow' }, el('div', {}, t('contestCard')), el('div', { class: 'note' }, t('contestVote'))))
    : null;
  const body = el('div', { class: 'list' },
    contestCard,
    el('p', { class: 'note' }, t('tasksNote')),
    tasks,
    el('div', { class: 'section-title' }, `${t('stickersTitle')} · ${state.stickers.length}/${STICKERS.length}`),
    el('div', { class: 'stickers' }, stickers),
  );
  openSheet(t('tasksTitle'), body);
  sheet.scrollTop = keepScroll;
}

// Install section: a button when the browser can install, steps on iPhone, nothing otherwise.
function installSection(install, onInstall) {
  if (install === 'prompt') {
    return [el('div', { class: 'section-title' }, t('installTitle')), el('button', { class: 'btn small', type: 'button', onclick: onInstall }, t('installButton'))];
  }
  if (install === 'ios') return [el('div', { class: 'section-title' }, t('installTitle')), el('p', { class: 'note' }, t('installIos'))];
  return [];
}

export function openSettings(state, { onLang, onSound, onReset, onInvite, install, onInstall }) {
  const body = el('div', { class: 'list' },
    el('div', { class: 'section-title' }, t('inviteTitle')),
    el('button', { class: 'btn small primary', type: 'button', onclick: onInvite }, t('inviteButton')),
    installSection(install, onInstall),
    el('div', { class: 'section-title' }, t('language')),
    languageSwitch(state.lang, onLang),
    el('div', { class: 'section-title' }, t('sound')),
    el('div', { class: 'seg' },
      el('button', { class: `btn small ${!state.sound ? 'active' : ''}`, type: 'button', onclick: () => onSound(false) }, t('soundOff')),
      el('button', { class: `btn small ${state.sound ? 'active' : ''}`, type: 'button', onclick: () => onSound(true) }, t('soundOn')),
    ),
    el('div', { class: 'section-title' }, t('resetTitle')),
    el('p', { class: 'note' }, t('resetNote')),
    analyticsEnabled ? el('p', { class: 'note' }, t('privacyNote')) : null,
    el('button', { class: 'btn small', type: 'button', onclick: () => { if (confirm(t('resetConfirm', { name: state.cats.map((c) => c.name).join(', ') }))) onReset(); } }, t('resetButton')),
  );
  openSheet(t('settings'), body);
}

// Changes the fur of the kitten shown in the preview.
function furPicker(kitten) {
  const buttons = Object.keys(FURS).map((fur) => {
    const swatch = furSwatch(fur);
    const button = el('button', { class: `btn small fur ${fur === kitten.fur ? 'active' : ''}`, type: 'button', 'aria-label': t(`fur_${fur}`), title: t(`fur_${fur}`) }, swatch);
    button.addEventListener('click', () => {
      kitten.fur = fur;
      for (const b of buttons) b.classList.toggle('active', b === button);
    });
    return button;
  });
  return el('div', { class: 'seg furs' }, buttons);
}

// The first kitten (locked sheet with a language switch), or a new kitten when `price` is given.
export function openAdopt(previewState, { lang, onLang, onAdopt, price = null }) {
  const preview = el('canvas', { class: 'preview', width: ROOM_W, height: ROOM_H });
  const input = el('input', { type: 'text', maxlength: '16', placeholder: t('adoptPlaceholder'), 'aria-label': t('adoptPrompt'), enterkeyhint: 'done' });
  const submit = () => onAdopt(input.value.trim() || t('defaultName'));
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault(); // otherwise the same key press also taps the button in the next sheet
    submit();
  });

  let raf = 0;
  const loop = (now) => {
    drawScene(preview.getContext('2d'), previewState, now, Date.now());
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const body = el('div', { class: 'list' },
    preview,
    el('div', { class: 'section-title' }, t('furLabel')),
    furPicker(previewState.cats[0]),
    el('p', {}, t('adoptPrompt')),
    input,
    el('button', { class: 'btn primary', type: 'button', onclick: submit }, price === null ? t('adoptButton') : t('adoptFor', { n: price })),
    price === null ? languageSwitch(lang, onLang) : null,
  );
  openSheet(t(price === null ? 'adoptTitle' : 'newCatTitle'), body, { locked: price === null, onClose: () => cancelAnimationFrame(raf) });
}

const MINI_GAMES = {
  fish: { run: runFishGame, idle: drawFishGameIdle, seconds: FISH_GAME_SECONDS, icon: 'fish' },
  mouse: { run: runMouseGame, idle: drawMouseGameIdle, seconds: MOUSE_GAME_SECONDS, icon: 'toy_mouse' },
};

// Lets the player pick a mini game.
export function openGamePicker(onPick) {
  const rows = Object.entries(MINI_GAMES).map(([kind, game]) => el('button', { class: 'row btn', type: 'button', onclick: () => onPick(kind) },
    el('span', { class: 'icon' }, spriteCanvas(game.icon, 4)),
    el('span', { class: 'grow' }, el('b', {}, t(`game_${kind}`)), el('br'), el('span', { class: 'note' }, t(`gameHelp_${kind}`))),
  ));
  openSheet(t('gamePickTitle'), el('div', { class: 'list' }, ...rows));
}

// Runs one mini game. onFinish.onEnd(score) returns the coins paid.
export function openMiniGame(kind, onFinish) {
  const game = MINI_GAMES[kind];
  const canvas = el('canvas', { class: 'game-canvas' });
  const timer = el('span', {}, t('gameTime', { n: game.seconds }));
  const score = el('span', {}, '0');
  const help = el('p', { class: 'note' }, t(`gameHelp_${kind}`));
  const start = el('button', { class: 'btn primary', type: 'button' }, t('gameStart'));
  let stop = null;
  let finished = false;

  start.addEventListener('click', () => {
    start.hidden = true;
    help.hidden = true;
    stop = game.run(canvas, {
      seconds: game.seconds,
      onTick: (s) => { timer.textContent = t('gameTime', { n: s }); },
      onCatch: (n) => { score.textContent = String(n); onFinish.onCatch?.(); },
      onEnd: (points) => {
        finished = true;
        const reward = onFinish.onEnd(points);
        const done = el('div', { class: 'list center' },
          el('p', {}, t(`gameOver_${kind}`, { n: points })),
          el('p', {}, t('gameReward', { n: reward })),
          el('button', { class: 'btn primary', type: 'button', onclick: closeSheet }, t('ok')),
        );
        sheet.querySelector('.sheet-inner').append(done);
      },
    });
  });

  game.idle(canvas);
  const body = el('div', { class: 'list' },
    el('div', { class: 'game-hud' }, timer, el('span', { class: 'price' }, spriteCanvas(game.icon, 3), score)),
    el('div', { class: 'game-wrap' }, canvas),
    help,
    start,
  );
  // Closing the sheet mid-game stops it; nothing is earned.
  openSheet(t(`game_${kind}`), body, { onClose: () => { if (!finished) stop?.(); } });
}

// A simple message sheet. `extra` adds a second button, e.g. { label, onClick }. Resolves when it closes.
export function showMessage(title, text, art, extra = null) {
  return new Promise((resolve) => {
    const body = el('div', { class: 'list center' },
      art ?? null,
      el('p', {}, text),
      extra ? el('button', { class: 'btn', type: 'button', onclick: extra.onClick }, extra.label) : null,
      el('button', { class: 'btn primary', type: 'button', onclick: closeSheet }, t('ok')),
    );
    openSheet(title, body, { onClose: resolve });
  });
}

// A still picture of a contest room.
function roomCanvas(room, className) {
  const canvas = el('canvas', { class: className, width: ROOM_W, height: ROOM_H });
  drawScene(canvas.getContext('2d'), entryToScene(room, Date.now()), performance.now(), Date.now());
  return canvas;
}

const catNamesOf = (room) => room.cats.map((c) => c.name).join(' & ');
const TROPHY_SPRITES = ['trophy_gold', 'trophy_silver', 'trophy_bronze'];

export function openContest(status, { onEnter, onVote, onInvite }) {
  const daysLeft = Math.ceil((status.endsAt - Date.now()) / DAY);
  const mine = !status.mine ? null
    : el('p', {}, status.mine.wins > 0 ? t('contestMine', { wins: status.mine.wins, rank: status.mine.rank }) : t('contestMineNew'));
  const winners = status.lastWeek.top.map((w) =>
    el('div', { class: 'winner' },
      el('div', { class: 'winner-head' },
        spriteCanvas(TROPHY_SPRITES[w.rank - 1], 4),
        el('span', {}, `#${w.rank} · ${catNamesOf(w.room)}`),
        el('span', { class: 'note' }, t('contestWins', { n: w.wins }))),
      roomCanvas(w.room, 'winner-room'),
    ));
  const body = el('div', { class: 'list' },
    el('p', { class: 'note' }, `${daysLeft <= 1 ? t('contestEndsToday') : t('contestEnds', { n: daysLeft })} · ${t('contestCount', { n: status.entries })}`),
    mine,
    el('button', { class: 'btn primary', type: 'button', onclick: onVote }, t('contestVote')),
    el('button', { class: 'btn', type: 'button', onclick: onEnter }, status.mine ? t('contestUpdate') : t('contestEnter', { n: CONTEST_ENTRY_COINS })),
    el('button', { class: 'btn small', type: 'button', onclick: onInvite }, t('inviteButton')),
    winners.length ? el('div', { class: 'section-title' }, t('contestWinners')) : null,
    winners,
    el('p', { class: 'note' }, t('contestPrivacy')),
  );
  openSheet(t('contestTitle'), body);
}

// "Which is cuter?": two rooms stacked; tapping one votes for it.
export function openDuel(duel, votes, { onPick, onInvite }) {
  if (!duel.pair) {
    const body = el('div', { class: 'list center' },
      spriteCanvas('trophy_gold', 8),
      el('p', {}, t('duelNone')),
      el('button', { class: 'btn primary', type: 'button', onclick: onInvite }, t('inviteButton')),
    );
    openSheet(t('duelTitle'), body);
    return;
  }
  let picked = false;
  const choices = duel.pair.map((entry) => {
    const button = el('button', { class: 'duel-choice', type: 'button' },
      roomCanvas(entry.room, 'duel-room'),
      el('span', { class: 'duel-names' }, catNamesOf(entry.room)));
    button.addEventListener('click', () => {
      if (picked) return;
      picked = true;
      button.classList.add('chosen');
      button.append(el('span', { class: 'duel-heart' }, spriteCanvas('heart', 8)));
      onPick(entry.id);
    });
    return button;
  });
  const body = el('div', { class: 'list' },
    el('p', { class: 'note' }, `${t('duelHelp')} · ${t('duelVotes', { n: votes })}`),
    el('div', { class: 'duel' }, choices[0], el('span', { class: 'duel-vs' }, 'VS'), choices[1]),
  );
  openSheet(t('duelTitle'), body);
}

export function catPreview(state) {
  const canvas = el('canvas', { class: 'preview', width: ROOM_W, height: ROOM_H });
  drawScene(canvas.getContext('2d'), state, performance.now(), Date.now());
  return canvas;
}
