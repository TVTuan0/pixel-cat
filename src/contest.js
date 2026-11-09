// Talks to the contest server. The browser gets a random id (no account); only its hash is stored online.
import { SITE_URL } from './config.js';

const DEVICE_KEY = 'pixel-cat-device';
let fallbackId = null;

// The contest only runs on the game's own site (not inside itch.io), and locally while developing.
export const contestAvailable =
  location.origin === new URL(SITE_URL).origin || ['localhost', '127.0.0.1'].includes(location.hostname);

function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    fallbackId ??= crypto.randomUUID(); // storage blocked: one id for this visit
    return fallbackId;
  }
}

// Throws an error with a `code` (e.g. 'slow_down', 'offline') when something goes wrong.
async function call(path, body) {
  let response;
  try {
    response = await fetch(`/api/contest/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'x-pixel-device': deviceId(), ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('offline'), { code: 'offline' });
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error ?? 'offline'), { code: data.error ?? 'offline' });
  return data;
}

export const getContestStatus = () => call('status');
export const getDuel = () => call('duel');
export const sendVote = (ticket, winner) => call('vote', { ticket, winner });
export const sendEntry = (entry) => call('enter', { entry });
