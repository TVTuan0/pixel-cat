import { describe, it, expect } from 'vitest';
import { createState } from '../src/state.js';
import { dailyTasks, recordAction, claimTask, checkStickers, seasonOf, rewardContestEntry, claimContestPrize } from '../src/rules.js';
import { DAY, HOUR, TASKS, TASKS_PER_DAY, CONTEST_ENTRY_COINS, CONTEST_PRIZES } from '../src/config.js';

const T0 = new Date(2026, 10, 8, 10).getTime();
const fresh = () => createState('Mochi', T0, 'en');
const day = (y, m, d) => new Date(y, m - 1, d, 12).getTime();

describe('daily tasks', () => {
  it('picks 3 different tasks, the same all day, and they change over days', () => {
    const today = dailyTasks(T0);
    expect(today).toHaveLength(TASKS_PER_DAY);
    expect(new Set(today).size).toBe(TASKS_PER_DAY);
    expect(dailyTasks(T0 + 5 * HOUR)).toEqual(today);
    const seen = new Set();
    for (let d = 0; d < 30; d++) dailyTasks(T0 + d * DAY).forEach((id) => seen.add(id));
    expect(seen.size).toBe(TASKS.length);
  });

  it('counts actions today and in total, and starts over the next day', () => {
    let s = recordAction(fresh(), 'feed', 1, T0);
    s = recordAction(s, 'feed', 1, T0 + HOUR);
    expect(s.daily.progress.feed).toBe(2);
    expect(s.counters.feed).toBe(2);
    s = recordAction(s, 'feed', 1, T0 + DAY);
    expect(s.daily.progress.feed).toBe(1);
    expect(s.counters.feed).toBe(3);
  });

  it('pays a finished task once, and not an unfinished or foreign one', () => {
    const [taskId] = dailyTasks(T0);
    const task = TASKS.find((x) => x.id === taskId);
    const start = { ...fresh(), coins: 0 };
    expect(claimTask(start, taskId, T0).result).toBe('notDone');
    const done = recordAction(start, task.counter, task.goal, T0);
    const claimed = claimTask(done, taskId, T0);
    expect(claimed.result).toBe('ok');
    expect(claimed.state.coins).toBe(task.coins);
    expect(claimed.state.counters.tasks).toBe(1);
    expect(claimTask(claimed.state, taskId, T0).result).toBe('claimed');
    const notToday = TASKS.find((x) => !dailyTasks(T0).includes(x.id));
    expect(claimTask(recordAction(start, notToday.counter, 99, T0), notToday.id, T0).result).toBe('notToday');
  });
});

describe('stickers', () => {
  it('earns a sticker once, with coins', () => {
    const fed = recordAction({ ...fresh(), coins: 0 }, 'feed', 1, T0);
    const a = checkStickers(fed, T0);
    expect(a.earned).toContain('first_meal');
    expect(a.state.stickers).toContain('first_meal');
    expect(a.state.coins).toBeGreaterThan(0);
    expect(checkStickers(a.state, T0).earned).toEqual([]);
  });
  it('knows streaks, growing up and shopping', () => {
    const s = { ...fresh(), streak: 7, owned: ['hat_bow', 'hat_party', 'hat_crown', 'toy_yarn', 'wall_mint', 'wall_stars', 'wall_stripes'] };
    const { earned } = checkStickers(s, T0 + 8 * DAY);
    expect(earned).toEqual(expect.arrayContaining(['streak3', 'streak7', 'young', 'adult', 'shopper', 'decorator']));
  });
});

describe('seasonOf', () => {
  it('finds each season around its date', () => {
    expect(seasonOf(day(2026, 2, 17))).toBe('tet');
    expect(seasonOf(day(2026, 2, 9))).toBe('tet');
    expect(seasonOf(day(2026, 9, 25))).toBe('midautumn');
    expect(seasonOf(day(2026, 10, 31))).toBe('halloween');
    expect(seasonOf(day(2026, 12, 24))).toBe('christmas');
    expect(seasonOf(day(2026, 6, 1))).toBe(null);
    expect(seasonOf(day(2026, 11, 8))).toBe(null);
  });
});

describe('contest rewards', () => {
  it('pays for joining once a week', () => {
    const start = { ...fresh(), coins: 0 };
    const a = rewardContestEntry(start, '2026-11-09');
    expect(a.coins).toBe(CONTEST_ENTRY_COINS);
    expect(rewardContestEntry(a.state, '2026-11-09').coins).toBe(0);
    expect(rewardContestEntry(a.state, '2026-11-16').coins).toBe(CONTEST_ENTRY_COINS);
  });
  it('gives the top 3 a trophy and coins, once per week', () => {
    const start = { ...fresh(), coins: 0 };
    const gold = claimContestPrize(start, '2026-11-02', 1);
    expect(gold.prize).toEqual(CONTEST_PRIZES[0]);
    expect(gold.state.owned).toContain('trophy_gold');
    expect(gold.state.coins).toBe(CONTEST_PRIZES[0].coins);
    expect(claimContestPrize(gold.state, '2026-11-02', 1).prize).toBe(null);
    const again = claimContestPrize(gold.state, '2026-11-09', 1);
    expect(again.state.owned.filter((id) => id === 'trophy_gold')).toHaveLength(1);
    expect(again.state.coins).toBe(CONTEST_PRIZES[0].coins * 2);
    expect(claimContestPrize(start, '2026-11-02', 4).prize).toBe(null);
  });
});
