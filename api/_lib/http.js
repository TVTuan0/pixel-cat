// Turns a contest action into a web endpoint: checks the browser id, reads the body, and reports errors plainly.
import { ContestError } from './contest.js';
import { getStore } from './store.js';

const DEVICE_ID = /^[A-Za-z0-9-]{16,64}$/;
const MAX_BODY = 8000;

export function contestRoute(action, store = getStore) {
  return async (request) => {
    try {
      const secret = process.env.CONTEST_SECRET;
      if (!secret) throw new ContestError('not_ready', 503);
      const device = request.headers.get('x-pixel-device') ?? '';
      if (!DEVICE_ID.test(device)) throw new ContestError('bad_device');
      const ip = (request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
      let body = {};
      if (request.method === 'POST') {
        const text = await request.text();
        if (text.length > MAX_BODY) throw new ContestError('too_big', 413);
        body = text ? JSON.parse(text) : {};
      }
      const result = await action(store(), { secret, device, ip, body, now: Date.now() });
      return Response.json(result, { headers: { 'cache-control': 'no-store' } });
    } catch (err) {
      if (err instanceof ContestError) return Response.json({ error: err.code }, { status: err.status });
      if (err instanceof SyntaxError) return Response.json({ error: 'bad_json' }, { status: 400 });
      console.error(err);
      return Response.json({ error: 'server' }, { status: 500 });
    }
  };
}
