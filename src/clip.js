// Records a short vertical video (9:16, for TikTok/Reels) of the live room, with the game's link on it.
import { ROOM_W, ROOM_H } from './render/canvas.js';
import { SITE_URL } from './config.js';

const WIDTH = 720;
const HEIGHT = 1280;
const SCALE = 4; // whole-number scale keeps the pixels crisp
const ROOM_X = (WIDTH - ROOM_W * SCALE) / 2;
const ROOM_Y = 400;
const TYPES = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];

export function canRecord() {
  return typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream && TYPES.some((t) => MediaRecorder.isTypeSupported(t));
}

function drawFrame(ctx, room, { title, caption }) {
  ctx.fillStyle = '#3b2f5c';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#fff4e0';
  ctx.textAlign = 'center';
  ctx.font = '96px VT323, monospace';
  ctx.fillText(title, WIDTH / 2, ROOM_Y - 60);
  ctx.fillStyle = '#2a1d3a';
  ctx.fillRect(ROOM_X - 8, ROOM_Y - 8, ROOM_W * SCALE + 16, ROOM_H * SCALE + 16);
  ctx.drawImage(room, ROOM_X, ROOM_Y, ROOM_W * SCALE, ROOM_H * SCALE);
  ctx.fillStyle = '#fff4e0';
  ctx.font = '52px VT323, monospace';
  ctx.fillText(caption, WIDTH / 2, ROOM_Y + ROOM_H * SCALE + 100);
  ctx.fillStyle = '#ff8fa3';
  ctx.font = '44px VT323, monospace';
  ctx.fillText(new URL(SITE_URL).host, WIDTH / 2, ROOM_Y + ROOM_H * SCALE + 170);
}

// Records `seconds` of the room canvas. onTick(secondsLeft) lets the page show a countdown.
export async function recordClip(room, { seconds, title, caption, onTick }) {
  const out = document.createElement('canvas');
  out.width = WIDTH;
  out.height = HEIGHT;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  try { await document.fonts.load('52px VT323'); } catch { /* falls back to monospace */ }

  const mimeType = TYPES.find((t) => MediaRecorder.isTypeSupported(t));
  const recorder = new MediaRecorder(out.captureStream(30), { mimeType, videoBitsPerSecond: 4_000_000 });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise((resolve) => { recorder.onstop = resolve; });

  const start = performance.now();
  let raf = 0;
  const loop = (now) => {
    drawFrame(ctx, room, { title, caption });
    onTick?.(Math.max(0, Math.ceil(seconds - (now - start) / 1000)));
    raf = requestAnimationFrame(loop);
  };
  drawFrame(ctx, room, { title, caption });
  recorder.start();
  raf = requestAnimationFrame(loop);
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  recorder.stop();
  await stopped;
  cancelAnimationFrame(raf);

  const type = mimeType.split(';')[0];
  return new Blob(chunks, { type });
}
