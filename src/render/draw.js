// Tiny drawing helpers shared by the room and the cat.

export function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Outlined box with rounded (cut) corners.
export function blob(ctx, x, y, w, h, fill, outline) {
  rect(ctx, x + 2, y, w - 4, h, outline);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, outline);
  rect(ctx, x, y + 2, w, h - 4, outline);
  rect(ctx, x + 2, y + 1, w - 4, h - 2, fill);
  rect(ctx, x + 1, y + 2, w - 2, h - 4, fill);
}

// Pixel line between two points.
export function line(ctx, x0, y0, x1, y1, color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    rect(ctx, Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps), 1, 1, color);
  }
}

// Filled circle with a 1px outline.
export function disc(ctx, cx, cy, r, fill, outline) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y);
      if (d <= r + 0.3) rect(ctx, cx + x, cy + y, 1, 1, d > r - 0.8 ? outline : fill);
    }
  }
}
