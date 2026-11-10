// A hidden panel for trying the game out quickly. It only loads when the page is opened with ?test.
import { SHOP_ITEMS, HOUR, DAY } from './config.js';
import { dayKey, selectedCat } from './rules.js';

const angry = (s) => ({
  ...s,
  cats: s.cats.map((c) => (c.id === selectedCat(s).id ? { ...c, stats: { ...c.stats, hunger: 5 } } : c)),
});

// Pretends `ms` went by: every saved time moves that far into the past.
const jump = (s, ms) => ({
  ...s,
  lastSeen: s.lastSeen - ms,
  nextPresentAt: s.nextPresentAt - ms,
  cats: s.cats.map((c) => ({ ...c, adoptedAt: c.adoptedAt - ms, nextBreakAt: c.nextBreakAt === null ? null : c.nextBreakAt - ms })),
});

// Each button changes the saved game. The game's own timer then catches up (breaking items, growing up, gifts).
const ACTIONS = [
  ['+1000 xu', (s) => ({ ...s, coins: s.coins + 1000 })],
  ['Mèo giận ngay', angry],
  ['Nhảy 6 tiếng', (s) => jump(s, 6 * HOUR)],
  ['Phòng bẩn', (s) => ({ ...s, cats: s.cats.map((c) => ({ ...c, stats: { ...c.stats, cleanliness: 5 } })) })],
  ['Lớn thêm 4 ngày', (s) => ({ ...s, cats: s.cats.map((c) => ({ ...c, adoptedAt: c.adoptedAt - 4 * DAY })) })],
  // Moves the last gift to yesterday, so the streak goes on and today's gift and tasks start over.
  ['Sang ngày mới', (s) => ({ ...s, lastGiftDay: s.lastGiftDay ? dayKey(Date.now() - DAY) : null, daily: null })],
  ['Mua hết đồ', (s) => ({ ...s, owned: [...new Set([...s.owned, ...SHOP_ITEMS.map((i) => i.id)])] })],
];

export function startTestPanel({ getState, setState, reset }) {
  const panel = document.createElement('div');
  panel.className = 'test-panel';
  const list = document.createElement('div');
  list.className = 'test-list';
  list.hidden = true;

  const button = (label, onClick) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn small';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  };
  for (const [label, change] of ACTIONS) {
    list.append(button(label, () => {
      const state = getState();
      if (state) setState(change(state));
    }));
  }
  list.append(button('Xoá & chơi lại', () => {
    list.hidden = true;
    reset();
  }));

  const toggle = button('🧪', () => { list.hidden = !list.hidden; });
  toggle.title = 'Test';
  panel.append(list, toggle);
  document.body.append(panel);
}
