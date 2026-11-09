// DOM: top bar, stat bars, buttons, speech bubble and bottom sheets.
import { t } from './i18n/index.js';
import { spriteCanvas, FURS } from './render/sprites.js';
import { drawScene, ROOM_W, ROOM_H } from './render/canvas.js';
import { runFishGame, drawFishGameIdle } from './minigame/fish.js';
import { FOODS, SHOP_ITEMS, FISH_GAME_SECONDS, EQUIP_SLOTS } from './config.js';
import { ageInDays, stageOf } from './rules.js';

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

  for (const btn of document.querySelectorAll('.action')) {
    btn.addEventListener('click', () => handlers[btn.dataset.action]());
  }

  $('stats').replaceChildren(
    ...STAT_KEYS.map((key) =>
      el('div', { class: 'stat' }, el('span', { class: 'stat-label', id: `label-${key}` }), el('div', { class: 'bar', id: `bar-${key}` }, el('i'))),
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
    sheetCleanup?.();
    sheetCleanup = null;
  });
}

// Re-labels everything for the current language and state.
export function renderHud(state, now) {
  document.title = t('title');
  $('cat-name').textContent = state.name;
  $('cat-age').textContent = `${t(`stage_${stageOf(state, now)}`)} · ${t('dayCount', { n: ageInDays(state, now) + 1 })}`;
  $('coins').textContent = state.coins;

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
    const value = Math.round(state.stats[key]);
    $(`label-${key}`).textContent = t(key);
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

export function openShop(state, { onBuy, onEquip }) {
  const slots = ['hat', 'collar', 'toy', 'decor', 'wall', 'floor'];
  const keepScroll = sheet.open ? sheet.scrollTop : 0; // stay in place after buying
  const body = el('div', { class: 'list' });
  for (const slot of slots) {
    body.append(el('div', { class: 'section-title' }, t(`slot_${slot}`)));
    for (const item of SHOP_ITEMS.filter((i) => i.slot === slot)) {
      const owned = state.owned.includes(item.id);
      const inUse = state.equipped[slot] === item.id;
      const worn = slot === 'hat' || slot === 'collar';
      let action;
      if (!owned) {
        action = el('button', { class: 'btn small', type: 'button', disabled: state.coins < item.price ? '' : false, onclick: () => onBuy(item.id) }, priceTag(item.price));
      } else if (EQUIP_SLOTS.includes(slot)) {
        const label = worn ? (inUse ? 'wearing' : 'wear') : (inUse ? 'inUse' : 'use');
        action = el('button', { class: `btn small ${inUse ? 'primary' : ''}`, type: 'button', onclick: () => onEquip(item.id) }, t(label));
      } else {
        action = el('span', { class: 'note' }, t('ownedItem'));
      }
      body.append(el('div', { class: 'row' },
        el('span', { class: 'icon' }, spriteCanvas(item.id, 4)),
        el('span', { class: 'grow' }, t(`item_${item.id}`)),
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

export function openSettings(state, { onLang, onSound, onReset, onInvite }) {
  const body = el('div', { class: 'list' },
    el('div', { class: 'section-title' }, t('inviteTitle')),
    el('button', { class: 'btn small primary', type: 'button', onclick: onInvite }, t('inviteButton')),
    el('div', { class: 'section-title' }, t('language')),
    languageSwitch(state.lang, onLang),
    el('div', { class: 'section-title' }, t('sound')),
    el('div', { class: 'seg' },
      el('button', { class: `btn small ${!state.sound ? 'active' : ''}`, type: 'button', onclick: () => onSound(false) }, t('soundOff')),
      el('button', { class: `btn small ${state.sound ? 'active' : ''}`, type: 'button', onclick: () => onSound(true) }, t('soundOn')),
    ),
    el('div', { class: 'section-title' }, t('resetTitle')),
    el('p', { class: 'note' }, t('resetNote')),
    el('button', { class: 'btn small', type: 'button', onclick: () => { if (confirm(t('resetConfirm', { name: state.name }))) onReset(); } }, t('resetButton')),
  );
  openSheet(t('settings'), body);
}

function furPicker(previewState) {
  const buttons = Object.keys(FURS).map((fur) => {
    const colors = FURS[fur];
    const swatch = el('span', { class: 'swatch' });
    swatch.style.background = colors.patch
      ? `linear-gradient(135deg, ${colors.fur} 55%, ${colors.stripe} 55% 75%, ${colors.patch} 75%)`
      : colors.fur;
    swatch.style.borderColor = colors.outline;
    const button = el('button', { class: `btn small fur ${fur === previewState.fur ? 'active' : ''}`, type: 'button', 'aria-label': t(`fur_${fur}`), title: t(`fur_${fur}`) }, swatch);
    button.addEventListener('click', () => {
      previewState.fur = fur;
      for (const b of buttons) b.classList.toggle('active', b === button);
    });
    return button;
  });
  return el('div', { class: 'seg furs' }, buttons);
}

export function openAdopt(previewState, { lang, onLang, onAdopt }) {
  const preview = el('canvas', { class: 'preview', width: ROOM_W, height: ROOM_H });
  const input = el('input', { type: 'text', maxlength: '16', placeholder: t('adoptPlaceholder'), 'aria-label': t('adoptPrompt'), enterkeyhint: 'done' });
  const submit = () => onAdopt(input.value.trim() || t('defaultName'));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

  let raf = 0;
  const loop = (now) => {
    drawScene(preview.getContext('2d'), previewState, now, Date.now());
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const body = el('div', { class: 'list' },
    preview,
    el('div', { class: 'section-title' }, t('furLabel')),
    furPicker(previewState),
    el('p', {}, t('adoptPrompt')),
    input,
    el('button', { class: 'btn primary', type: 'button', onclick: submit }, t('adoptButton')),
    languageSwitch(lang, onLang),
  );
  openSheet(t('adoptTitle'), body, { locked: true, onClose: () => cancelAnimationFrame(raf) });
}

export function openFishGame(onFinish) {
  const canvas = el('canvas', { class: 'game-canvas' });
  const timer = el('span', {}, t('gameTime', { n: FISH_GAME_SECONDS }));
  const score = el('span', {}, '0');
  const help = el('p', { class: 'note' }, t('gameHelp'));
  const start = el('button', { class: 'btn primary', type: 'button' }, t('gameStart'));
  let stop = null;
  let finished = false;

  start.addEventListener('click', () => {
    start.hidden = true;
    help.hidden = true;
    stop = runFishGame(canvas, {
      seconds: FISH_GAME_SECONDS,
      onTick: (s) => { timer.textContent = t('gameTime', { n: s }); },
      onCatch: (n) => { score.textContent = String(n); onFinish.onCatch?.(); },
      onEnd: (caught) => {
        finished = true;
        const reward = onFinish.onEnd(caught);
        const done = el('div', { class: 'list center' },
          el('p', {}, t('gameOver', { n: caught })),
          el('p', {}, t('gameReward', { n: reward })),
          el('button', { class: 'btn primary', type: 'button', onclick: closeSheet }, t('ok')),
        );
        sheet.querySelector('.sheet-inner').append(done);
      },
    });
  });

  drawFishGameIdle(canvas);
  const body = el('div', { class: 'list' },
    el('div', { class: 'game-hud' }, timer, el('span', { class: 'price' }, spriteCanvas('fish', 3), score)),
    el('div', { class: 'game-wrap' }, canvas),
    help,
    start,
  );
  // Closing the sheet mid-game stops it; nothing is earned.
  openSheet(t('gameTitle'), body, { onClose: () => { if (!finished) stop?.(); } });
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

export function catPreview(state) {
  const canvas = el('canvas', { class: 'preview', width: ROOM_W, height: ROOM_H });
  drawScene(canvas.getContext('2d'), state, performance.now(), Date.now());
  return canvas;
}
