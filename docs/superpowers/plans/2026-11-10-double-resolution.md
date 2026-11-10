# Double-resolution pixel art — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Draw the room, garden and cats at 320×240 with more detail while all game logic stays on the 160×120 grid.

**Architecture:** One constant `RES = 2` in `src/render/layout.js`. Scene canvases are `ROOM_W*RES × ROOM_H*RES`; `drawScene` sets `ctx.setTransform(RES, 0, 0, RES, 0, 0)`, so old drawing code is unchanged and new code draws in half-unit steps. Sprites may set `cell: 0.5`.

**Spec:** `docs/superpowers/specs/2026-11-10-double-resolution-design.md`

## Global Constraints
- Game logic, spots, taps and contest data stay in 160×120 room units.
- New art uses coordinates in multiples of 0.5 only; image smoothing off.
- Every round: `npx vitest run` passes, `npx vite build` works, screenshots at 390×844 and 1366×768, a test-panel play-through with no page errors.

## Review Focus
1. Snapshot cards and video clips must show the 320×240 scene (not a cropped quarter).
2. Contest room pictures and the adopt preview must be full size too.
3. Taps on cats, presents, butterflies and the door must still hit (they use room units).
4. Speech bubbles must still sit over cats' heads.
5. Half-unit art must stay sharp (no blurry edges) on phone and computer.

---

### Task 1: Groundwork
- `layout.js`: `export const RES = 2; SCENE_W = ROOM_W * RES; SCENE_H = ROOM_H * RES`.
- `index.html` room canvas 320×240; `ui.js` preview/contest canvases and `snapshot.js` room canvas use `SCENE_W/H`.
- `drawScene` sets the transform at the start.
- `sprites.js`: optional `cell` per sprite in `spriteSize`, `drawSprite`, `spriteCanvas`, `brokenSpriteCanvas`.
- Test: a `cell: 0.5` sprite reports half the size. Screenshots must look the same as before.

### Task 2: Cats at double detail
New `drawFrontCat` / `drawSideCat` drawing in half units for every pose, stage and fur; same signatures and returned boxes (in room units).

### Task 3: Room at double detail
Walls, floors, window, curtains, clock, door, furniture and broken looks, basic items, dirt, presents.

### Task 4: Garden at double detail

### Task 5: Small effects at double detail
