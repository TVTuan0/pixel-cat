// Drawing helpers. Art is laid out in fine pixels (half a room unit) but painted on the chunky 8-bit grid,
// one pixel per room unit: each block snaps to whole units, and a thin line still keeps one unit,
// so outlines and small details survive. The canvas is already scaled to room units.

// A fine-pixel span [a, a + n) snapped to whole room units: [start, length], at least one unit long.
function snap(a, n) {
  const start = Math.round(a / 2);
  return [start, Math.max(1, Math.round((a + n) / 2) - start)];
}

// A block of fine pixels.
export function F(ctx, x, y, w, h, color) {
  if (w <= 0 || h <= 0) return;
  const [sx, sw] = snap(x, w);
  const [sy, sh] = snap(y, h);
  ctx.fillStyle = color;
  ctx.fillRect(sx, sy, sw, sh);
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
  for (const [l, r, row] of inner) {
    if (r <= l) continue;
    const [sx, sw] = snap(l, r - l);
    const [sy, sh] = snap(row, 1);
    ctx.rect(sx, sy, sw, sh);
  }
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
