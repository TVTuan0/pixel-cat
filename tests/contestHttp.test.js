import { describe, it, expect, beforeEach } from 'vitest';
import { fakeStore } from './fakeStore.js';
import { contestRoute } from '../api/_lib/http.js';
import { enterContest, contestStatus } from '../api/_lib/contest.js';

const DEVICE = 'abcdef0123456789-browser';
const entry = { cats: [{ name: 'Mochi', fur: 'orange', stage: 'kitten', hat: null, collar: null }], decor: [], wall: null, floor: null };
const request = (method, { device = DEVICE, body } = {}) => new Request('https://pixel-cat.test/api/contest/x', {
  method,
  headers: { 'x-pixel-device': device, 'x-forwarded-for': '1.2.3.4, 10.0.0.1' },
  body,
});

describe('contest endpoints', () => {
  let store;
  beforeEach(() => {
    store = fakeStore();
    process.env.CONTEST_SECRET = 'test-secret';
  });

  it('enters and reads back through web requests', async () => {
    const enter = contestRoute((s, ctx) => enterContest(s, { ...ctx, entry: ctx.body.entry }), () => store);
    const status = contestRoute((s, ctx) => contestStatus(s, ctx), () => store);
    const res = await enter(request('POST', { body: JSON.stringify({ entry }) }));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const { entryId } = await res.json();
    expect((await (await status(request('GET'))).json()).mine.entryId).toBe(entryId);
  });

  it('answers clearly when something is wrong', async () => {
    const enter = contestRoute((s, ctx) => enterContest(s, { ...ctx, entry: ctx.body.entry }), () => store);
    const check = async (req, status, error) => {
      const res = await enter(req);
      expect(res.status).toBe(status);
      expect((await res.json()).error).toBe(error);
    };
    await check(request('POST', { device: 'short', body: '{}' }), 400, 'bad_device');
    await check(request('POST', { body: '{oops' }), 400, 'bad_json');
    await check(request('POST', { body: 'x'.repeat(9000) }), 413, 'too_big');
    await check(request('POST', { body: '{}' }), 400, 'bad_entry');
    delete process.env.CONTEST_SECRET;
    await check(request('POST', { body: '{}' }), 503, 'not_ready');
  });

  it('hides unexpected server errors', async () => {
    const broken = contestRoute(() => { throw new Error('database down'); }, () => store);
    const original = console.error;
    console.error = () => {};
    const res = await broken(request('GET'));
    console.error = original;
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'server' });
  });
});
