// Makes a picture card of the cat and shares it (phones) or downloads it.
import { drawScene, ROOM_W, ROOM_H } from './render/canvas.js';

const SCALE = 6;
const PAD = 24;

export async function makeCard(state, { title, caption }) {
  const room = document.createElement('canvas');
  room.width = ROOM_W;
  room.height = ROOM_H;
  drawScene(room.getContext('2d'), state, performance.now(), Date.now());

  const card = document.createElement('canvas');
  card.width = ROOM_W * SCALE + PAD * 2;
  card.height = ROOM_H * SCALE + PAD * 2 + 130;
  const ctx = card.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = '#3b2f5c';
  ctx.fillRect(0, 0, card.width, card.height);
  ctx.fillStyle = '#fff4e0';
  try { await document.fonts.load('48px VT323'); } catch { /* falls back to monospace */ }
  ctx.font = '48px VT323, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, card.width / 2, PAD + 36);

  const top = PAD + 56;
  ctx.fillStyle = '#2a1d3a';
  ctx.fillRect(PAD - 6, top - 6, ROOM_W * SCALE + 12, ROOM_H * SCALE + 12);
  ctx.drawImage(room, PAD, top, ROOM_W * SCALE, ROOM_H * SCALE);

  ctx.fillStyle = '#fff4e0';
  ctx.font = '40px VT323, monospace';
  ctx.fillText(caption, card.width / 2, top + ROOM_H * SCALE + 56);
  return card;
}

export async function shareCard(card, { fileName, text }) {
  const blob = await new Promise((resolve) => card.toBlob(resolve, 'image/png'));
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
