// Drawing helpers for double-resolution art. Coordinates are in fine pixels (half a room unit);
// the canvas is already scaled so one room unit = 2 screen pixels.

// A block of fine pixels.
export function F(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x / 2, y / 2, w / 2, h / 2);
}

// The rows of a rounded shape (a "squircle"): [left, right, y] per row. Higher `round` = boxier.
export function rowsOf(x, y, w, h, round = 3) {
  const rows = [];
  for (let r = 0; r < h; r++) {
    const t = (r + 0.5 - h / 2) / (h / 2);
    const half = (w / 2) * Math.pow(1 - Math.pow(Math.abs(t), round), 1 / round);
    rows.push([Math.round(x + w / 2 - half), Math.round(x + w / 2 + half), y + r]);
  }
  return rows;
}

// A rounded shape with a thin outline. `inside` draws shading and details, clipped to the shape.
export function fineShape(ctx, x, y, w, h, fill, outline, { round = 3, inside = null } = {}) {
  for (const [l, r, row] of rowsOf(x, y, w, h, round)) F(ctx, l, row, r - l, 1, outline);
  const inner = rowsOf(x + 1, y + 1, w - 2, h - 2, round);
  for (const [l, r, row] of inner) F(ctx, l, row, r - l, 1, fill);
  if (!inside) return;
  ctx.save();
  ctx.beginPath();
  for (const [l, r, row] of inner) ctx.rect(l / 2, row / 2, (r - l) / 2, 0.5);
  ctx.clip();
  inside();
  ctx.restore();
}

// A thin straight line of fine pixels.
export function fineLine(ctx, x0, y0, x1, y1, color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    F(ctx, Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps), 1, 1, color);
  }
}
